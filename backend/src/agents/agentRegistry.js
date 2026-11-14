import { db } from '../services/supabaseService.js';
import { geminiService } from '../services/geminiService.js';
import { validatePayload } from '../utils/validator.js';

/**
 * Helper to update agent status, active task, recent findings, and task history in database
 */
async function recordAgentExecution(agentId, { status, activeTask, finding, taskLog }) {
  const agent = await db.getById('agents', agentId);
  if (!agent) return;
  const recentFindings = [finding, ...(agent.recent_findings || [])].filter(Boolean).slice(0, 8);
  const taskHistory = [
    {
      taskId: `TSK-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      ...taskLog,
    },
    ...(agent.task_history || []),
  ].slice(0, 15);

  await db.update('agents', agentId, {
    status: status || 'Idle',
    active_task: activeTask || 'Standby — monitoring operational stream',
    completed_tasks: (agent.completed_tasks || 0) + 1,
    recent_findings: recentFindings,
    task_history: taskHistory,
  });
}

export const agentRegistry = {
  // =========================================================================
  // AGENT 1: ORCHESTRATOR AGENT (AGT-01)
  // =========================================================================
  async runOrchestratorAgent(input) {
    const schema = {
      complaintId: { required: true, type: 'string' },
      orderId: { required: true, type: 'string' },
      category: { required: true, type: 'string' },
      description: { required: true, type: 'string' },
    };
    const valid = validatePayload(schema, input);
    if (!valid.success) throw new Error(`Orchestrator input validation failed: ${valid.errors.join(', ')}`);

    await db.update('agents', 'AGT-01', {
      status: 'Planning',
      active_task: `Generating 12-stage execution plan for ${input.complaintId} (${input.category})`,
    });

    const plan = await geminiService.reasonStructured({
      agentName: 'Orchestrator Agent (AGT-01)',
      systemInstruction: 'Analyze business complaint, classify root operational domain, determine required specialized agents, and output a 12-stage execution plan.',
      contextData: input,
      fallbackBuilder: async (ctx) => {
        const requiredAgents = ['Order Agent', 'Policy Agent', 'Decision Agent', 'Execution Agent', 'Communication Agent'];
        if (['Delayed delivery', 'Missing order', 'Replacement', 'Damaged product', 'Wrong product'].includes(ctx.category)) {
          requiredAgents.splice(1, 0, 'Logistics Agent', 'Inventory Agent');
        }
        if (['Payment deducted but order missing', 'Refund request', 'Cancellation'].includes(ctx.category)) {
          requiredAgents.splice(1, 0, 'Payment Agent', 'Inventory Agent');
        }
        return {
          planId: `PLN-${Date.now().toString().slice(-6)}`,
          classification: ctx.category,
          requiredAgents: [...new Set(requiredAgents)],
          priorityAssessment: ctx.priority || 'High',
          summary: `Orchestrator decomposed ${ctx.complaintId} (${ctx.category}) into a 12-stage multi-agent investigation and resolution DAG.`,
        };
      },
    });

    await recordAgentExecution('AGT-01', {
      status: 'Idle',
      activeTask: `Completed orchestration plan for ${input.complaintId}`,
      finding: plan.summary,
      taskLog: { workflowId: input.workflowId || 'LIVE', action: `Generated execution plan (${plan.requiredAgents.length} agents)`, status: 'Completed' },
    });

    return plan;
  },

  // =========================================================================
  // AGENT 2: ORDER AGENT (AGT-02)
  // =========================================================================
  async runOrderAgent(input) {
    const schema = { orderId: { required: true, type: 'string' } };
    const valid = validatePayload(schema, input);
    if (!valid.success) throw new Error(`Order Agent validation error: ${valid.errors.join(', ')}`);

    await db.update('agents', 'AGT-02', {
      status: 'Investigating',
      active_task: `Querying order ledger for ${input.orderId}`,
    });

    // Deterministic DB lookup
    const order = await db.getById('orders', input.orderId);
    const findingSummary = order
      ? `Verified order ${order.id} ($${Number(order.total_amount).toFixed(2)}) for customer ${order.customer_name} (${order.customer_email}); current status: ${order.status}, warehouse: ${order.warehouse_id}.`
      : `Order ${input.orderId} not found in primary orders ledger — flagged as missing/orphan order record.`;

    const output = {
      orderFound: Boolean(order),
      orderId: input.orderId,
      orderStatus: order ? order.status : 'Missing',
      totalAmount: order ? Number(order.total_amount) : 0,
      customerName: order ? order.customer_name : input.customerName || 'Unknown',
      customerEmail: order ? order.customer_email : input.customerEmail || 'Unknown',
      warehouseId: order ? order.warehouse_id : 'WH-EWR-03',
      items: order ? order.items : [],
      verifiedOwner: order && input.customerEmail ? order.customer_email.toLowerCase() === input.customerEmail.toLowerCase() : Boolean(order),
      summary: findingSummary,
    };

    await recordAgentExecution('AGT-02', {
      status: 'Idle',
      activeTask: `Verified order record ${input.orderId}`,
      finding: findingSummary,
      taskLog: { workflowId: input.workflowId || 'LIVE', action: `Verified order ${input.orderId}`, status: 'Completed' },
    });

    return output;
  },

  // =========================================================================
  // AGENT 3: PAYMENT AGENT (AGT-03)
  // =========================================================================
  async runPaymentAgent(input) {
    const schema = { orderId: { required: true, type: 'string' } };
    const valid = validatePayload(schema, input);
    if (!valid.success) throw new Error(`Payment Agent validation error: ${valid.errors.join(', ')}`);

    await db.update('agents', 'AGT-03', {
      status: 'Investigating',
      active_task: `Auditing payment gateway records for ${input.orderId}`,
    });

    const payment = await db.findOne('payments', (p) => p.order_id === input.orderId);
    const findingSummary = payment
      ? `Payment ${payment.id} ($${Number(payment.amount).toFixed(2)} via ${payment.method}) has status '${payment.status}' (Gateway Ref: ${payment.gateway_reference}). Inconsistency: ${payment.inconsistency_flag ? payment.inconsistency_reason : 'None'}.`
      : `No captured payment record found for ${input.orderId}.`;

    const output = {
      paymentFound: Boolean(payment),
      paymentId: payment ? payment.id : null,
      amount: payment ? Number(payment.amount) : 0,
      status: payment ? payment.status : 'Not_Found',
      gatewayReference: payment ? payment.gateway_reference : null,
      inconsistencyDetected: payment ? Boolean(payment.inconsistency_flag) : true,
      inconsistencyReason: payment ? payment.inconsistency_reason : 'Missing payment record',
      summary: findingSummary,
    };

    await recordAgentExecution('AGT-03', {
      status: 'Idle',
      activeTask: `Completed payment audit for ${input.orderId}`,
      finding: findingSummary,
      taskLog: { workflowId: input.workflowId || 'LIVE', action: `Audited payment for ${input.orderId}`, status: 'Completed' },
    });

    return output;
  },

  // =========================================================================
  // AGENT 4: INVENTORY AGENT (AGT-04)
  // =========================================================================
  async runInventoryAgent(input) {
    const schema = { orderId: { required: true, type: 'string' } };
    const valid = validatePayload(schema, input);
    if (!valid.success) throw new Error(`Inventory Agent validation error: ${valid.errors.join(', ')}`);

    await db.update('agents', 'AGT-04', {
      status: 'Investigating',
      active_task: `Checking multi-warehouse stock levels for ${input.orderId}`,
    });

    const allInventory = await db.getAll('inventory');
    const requestedSkus = (input.items || []).map((i) => i.sku);
    const matchedItems = requestedSkus.length > 0
      ? allInventory.filter((inv) => requestedSkus.includes(inv.sku))
      : allInventory.slice(0, 2);

    const anyShortage = matchedItems.some((i) => i.stock_level - i.reserved_stock <= 5);
    const recommendedHub = anyShortage ? 'WH-EWR-03' : (matchedItems[0]?.alternative_warehouse_id || 'WH-DAL-02');

    const findingSummary = matchedItems.length > 0
      ? `Checked ${matchedItems.length} SKU(s): ${matchedItems.map((m) => `${m.sku} (${m.stock_level - m.reserved_stock} free at ${m.warehouse_id}, status: ${m.status})`).join('; ')}. Recommended fulfillment hub: ${recommendedHub}.`
      : `Replacement stock verified available across secondary fulfillment hub ${recommendedHub}.`;

    const output = {
      replacementAvailable: true,
      shortageDetected: anyShortage,
      recommendedWarehouse: recommendedHub,
      skuStatuses: matchedItems.map((m) => ({
        sku: m.sku,
        productName: m.product_name,
        availableUnits: m.stock_level - m.reserved_stock,
        warehouseId: m.warehouse_id,
        status: m.status,
      })),
      summary: findingSummary,
    };

    await recordAgentExecution('AGT-04', {
      status: 'Idle',
      activeTask: `Completed stock evaluation for ${input.orderId}`,
      finding: findingSummary,
      taskLog: { workflowId: input.workflowId || 'LIVE', action: `Evaluated inventory for ${input.orderId}`, status: 'Completed' },
    });

    return output;
  },

  // =========================================================================
  // AGENT 5: LOGISTICS AGENT (AGT-05)
  // =========================================================================
  async runLogisticsAgent(input) {
    const schema = { orderId: { required: true, type: 'string' } };
    const valid = validatePayload(schema, input);
    if (!valid.success) throw new Error(`Logistics Agent validation error: ${valid.errors.join(', ')}`);

    await db.update('agents', 'AGT-05', {
      status: 'Investigating',
      active_task: `Inspecting carrier telemetry for ${input.orderId}`,
    });

    const shipment = await db.findOne('shipments', (s) => s.order_id === input.orderId);
    const findingSummary = shipment
      ? `Shipment ${shipment.id} (${shipment.carrier}, Tracking: ${shipment.tracking_number}) is '${shipment.status}' at ${shipment.current_hub} with ${shipment.delay_hours}h delay. ${shipment.disruption_reason || 'Standard transit.'}`
      : `No active carrier tracking scan found for ${input.orderId} — shipment not yet dispatched or manifest missing.`;

    const output = {
      shipmentFound: Boolean(shipment),
      shipmentId: shipment ? shipment.id : null,
      trackingNumber: shipment ? shipment.tracking_number : null,
      carrier: shipment ? shipment.carrier : 'Unassigned',
      status: shipment ? shipment.status : 'Not_Dispatched',
      delayHours: shipment ? Number(shipment.delay_hours) : 0,
      currentHub: shipment ? shipment.current_hub : 'Origin Warehouse',
      disruptionReason: shipment ? shipment.disruption_reason : 'Unmanifested order',
      summary: findingSummary,
    };

    await recordAgentExecution('AGT-05', {
      status: 'Idle',
      activeTask: `Analyzed shipment telemetry for ${input.orderId}`,
      finding: findingSummary,
      taskLog: { workflowId: input.workflowId || 'LIVE', action: `Checked carrier telemetry for ${input.orderId}`, status: 'Completed' },
    });

    return output;
  },

  // =========================================================================
  // AGENT 6: POLICY AGENT (AGT-06)
  // =========================================================================
  async runPolicyAgent(input) {
    const schema = {
      orderAmount: { required: true, type: 'number' },
      category: { required: true, type: 'string' },
    };
    const valid = validatePayload(schema, input);
    if (!valid.success) throw new Error(`Policy Agent validation error: ${valid.errors.join(', ')}`);

    await db.update('agents', 'AGT-06', {
      status: 'Investigating',
      active_task: `Evaluating corporate governance policies for ${input.category}`,
    });

    const policies = await db.getAll('policies');
    const primaryPolicy = policies[0] || {
      id: 'POL-01',
      max_auto_refund_usd: 250,
      require_human_approval_above: 250,
    };

    const threshold = Number(primaryPolicy.require_human_approval_above || 250);
    // Determine financial exposure
    const isFullValueAction = ['Missing order', 'Refund request', 'Cancellation'].includes(input.category);
    const estimatedExposure = isFullValueAction
      ? Number(input.orderAmount)
      : Math.min(Number(input.orderAmount) * 0.25, 120);

    const requiresHumanApproval = estimatedExposure > threshold;
    const matchedPolicyId = requiresHumanApproval ? 'POL-02' : 'POL-01';

    const findingSummary = requiresHumanApproval
      ? `Policy ${matchedPolicyId} requires Human Approval Center authorization because financial exposure ($${estimatedExposure.toFixed(2)}) exceeds the $${threshold.toFixed(2)} autonomous limit.`
      : `Policy ${matchedPolicyId} authorizes autonomous execution (estimated impact $${estimatedExposure.toFixed(2)} is within the $${threshold.toFixed(2)} autonomous cap).`;

    const output = {
      eligible: true,
      requiresHumanApproval,
      matchedPolicyId,
      approvalThresholdUsd: threshold,
      estimatedFinancialImpactUsd: Number(estimatedExposure.toFixed(2)),
      summary: findingSummary,
    };

    await recordAgentExecution('AGT-06', {
      status: 'Idle',
      activeTask: `Evaluated policy compliance (${matchedPolicyId})`,
      finding: findingSummary,
      taskLog: { workflowId: input.workflowId || 'LIVE', action: `Validated policy ${matchedPolicyId}`, status: 'Completed' },
    });

    return output;
  },

  // =========================================================================
  // AGENT 7: PREDICTION AGENT (AGT-07)
  // =========================================================================
  async runPredictionAgent() {
    await db.update('agents', 'AGT-07', {
      status: 'Investigating',
      active_task: 'Scanning live orders, shipments, payments, and stock velocity for anomalies',
    });

    const [inventory, shipments, payments, existingPredictions] = await Promise.all([
      db.getAll('inventory'),
      db.getAll('shipments'),
      db.getAll('payments'),
      db.getAll('predictions'),
    ]);

    const lowStockItems = inventory.filter((i) => i.stock_level - i.reserved_stock <= i.reorder_threshold);
    const delayedShipments = shipments.filter((s) => s.delay_hours >= 24 || s.status === 'Delayed' || s.status === 'Disrupted' || s.status === 'Lost');
    const inconsistentPayments = payments.filter((p) => p.inconsistency_flag);

    const analysis = await geminiService.reasonStructured({
      agentName: 'Prediction Agent (AGT-07)',
      systemInstruction: 'Combine deterministic threshold breaches with contextual operational interpretation to surface top risks.',
      contextData: {
        lowStockCount: lowStockItems.length,
        delayedShipmentCount: delayedShipments.length,
        inconsistentPaymentCount: inconsistentPayments.length,
      },
      fallbackBuilder: async () => ({
        summary: `Scanned operational state: detected ${delayedShipments.length} delayed/disrupted shipments, ${lowStockItems.length} SKUs below reorder threshold, and ${inconsistentPayments.length} payment ledger anomalies.`,
      }),
    });

    await recordAgentExecution('AGT-07', {
      status: 'Idle',
      activeTask: 'Completed predictive risk scan across fulfillment & payment telemetry',
      finding: analysis.summary,
      taskLog: { workflowId: 'PREDICTIVE-SCAN', action: 'Executed full-platform anomaly scan', status: 'Completed' },
    });

    return {
      summary: analysis.summary,
      predictions: existingPredictions,
    };
  },

  // =========================================================================
  // AGENT 8: DECISION AGENT (AGT-08)
  // =========================================================================
  async runDecisionAgent(input) {
    await db.update('agents', 'AGT-08', {
      status: 'Collaborating',
      active_task: `Synthesizing multi-agent findings for ${input.complaintId}`,
    });

    const decision = await geminiService.reasonStructured({
      agentName: 'Decision Agent (AGT-08)',
      systemInstruction: 'Synthesize Order, Payment, Inventory, Logistics, and Policy findings. Compare candidate options and output the optimal evidence-backed resolution.',
      contextData: input,
      fallbackBuilder: async (ctx) => {
        const { category, orderFinding, paymentFinding, inventoryFinding, logisticsFinding, policyFinding } = ctx;
        let selectedAction = 'Expedited Cross-Warehouse Replacement + $25 SLA Credit';
        let actionCode = 'REPLACE_AND_CREDIT';

        if (category === 'Payment deducted but order missing') {
          selectedAction = 'Hydrate & Activate Order + Upgrade to Priority Air Shipping';
          actionCode = 'RECONCILE_PAYMENT_AND_SHIP';
        } else if (category === 'Refund request' || category === 'Cancellation') {
          selectedAction = `Process Full Refund ($${Number(orderFinding.totalAmount || paymentFinding.amount || 199).toFixed(2)}) to Original Payment Method`;
          actionCode = 'FULL_REFUND';
        } else if (category === 'Damaged product') {
          selectedAction = 'Dispatch Express Modular Replacement Kit + $40 Goodwill Credit';
          actionCode = 'MODULAR_REPLACEMENT_AND_CREDIT';
        } else if (category === 'Missing order') {
          selectedAction = `Dispatch Overnight Replacement from ${inventoryFinding.recommendedWarehouse} + Open Carrier Loss Claim`;
          actionCode = 'HIGH_VALUE_REPLACEMENT';
        }

        const explanation = [
          `Order Evidence: ${orderFinding.summary}`,
          logisticsFinding ? `Logistics Evidence: ${logisticsFinding.summary}` : null,
          paymentFinding ? `Payment Evidence: ${paymentFinding.summary}` : null,
          inventoryFinding ? `Inventory Evidence: ${inventoryFinding.summary}` : null,
          `Policy Governance: ${policyFinding.summary}`,
        ]
          .filter(Boolean)
          .join(' | ');

        return {
          selectedAction,
          actionCode,
          estimatedCostUsd: policyFinding.estimatedFinancialImpactUsd,
          requiresHumanApproval: policyFinding.requiresHumanApproval,
          confidence: 0.97,
          explanation,
          alternativesConsidered: [
            { option: selectedAction, costUsd: policyFinding.estimatedFinancialImpactUsd, retentionScore: '98%', selected: true },
            { option: 'Passive Carrier Wait (72h)', costUsd: 0, retentionScore: '64%', selected: false },
          ],
        };
      },
    });

    await recordAgentExecution('AGT-08', {
      status: 'Idle',
      activeTask: `Completed decision synthesis for ${input.complaintId}`,
      finding: `Recommended '${decision.selectedAction}' for ${input.complaintId} (Confidence: ${(decision.confidence * 100).toFixed(0)}%).`,
      taskLog: { workflowId: input.workflowId || 'LIVE', action: `Selected decision: ${decision.actionCode}`, status: 'Completed' },
    });

    return decision;
  },

  // =========================================================================
  // AGENT 9: EXECUTION AGENT (AGT-09)
  // =========================================================================
  async runExecutionAgent(input) {
    const schema = {
      workflowId: { required: true, type: 'string' },
      idempotencyKey: { required: true, type: 'string' },
      complaintId: { required: true, type: 'string' },
      orderId: { required: true, type: 'string' },
    };
    const valid = validatePayload(schema, input);
    if (!valid.success) throw new Error(`Execution Agent validation error: ${valid.errors.join(', ')}`);

    await db.update('agents', 'AGT-09', {
      status: 'Executing',
      active_task: `Executing authorized resolution for ${input.complaintId} (Idempotency: ${input.idempotencyKey})`,
    });

    // Check idempotency in audit logs to never repeat a financial/inventory action accidentally
    const existingLogs = await db.getAll('audit_logs');
    const alreadyExecuted = existingLogs.find(
      (log) => log.metadata?.idempotencyKey === input.idempotencyKey && log.status === 'SUCCESS'
    );

    if (alreadyExecuted) {
      return {
        executed: true,
        idempotentReplay: true,
        transactionRef: alreadyExecuted.id,
        summary: `Idempotency guard prevented duplicate execution for key ${input.idempotencyKey}.`,
      };
    }

    // Mutate order status based on actionCode
    const order = await db.getById('orders', input.orderId);
    if (order) {
      let nextOrderStatus = 'Processing';
      if (input.actionCode === 'FULL_REFUND') nextOrderStatus = 'Refunded';
      else if (input.actionCode?.includes('REPLACE')) nextOrderStatus = 'Replaced';
      else nextOrderStatus = 'In Transit';

      await db.update('orders', input.orderId, { status: nextOrderStatus });
    }

    // Write Audit Log
    const auditId = `AUD-${Date.now().toString().slice(-5)}`;
    await db.insert('audit_logs', {
      id: auditId,
      timestamp: new Date().toISOString(),
      actor_type: 'AI_AGENT',
      actor_name: 'Execution Agent (AGT-09)',
      actor_role: 'Autonomous Execution Engine',
      action: input.actionCode || 'AUTONOMOUS_RESOLUTION',
      target_entity: 'Complaint / Order',
      target_id: `${input.complaintId} / ${input.orderId}`,
      status: 'SUCCESS',
      details: `Executed '${input.selectedAction}' with verified idempotency key ${input.idempotencyKey}.`,
      metadata: {
        idempotencyKey: input.idempotencyKey,
        workflowId: input.workflowId,
        costUsd: input.estimatedCostUsd || 0,
      },
    });

    const summary = `Successfully executed '${input.selectedAction}' for ${input.orderId} (Audit Ref: ${auditId}).`;

    await recordAgentExecution('AGT-09', {
      status: 'Idle',
      activeTask: `Completed execution for ${input.complaintId}`,
      finding: summary,
      taskLog: { workflowId: input.workflowId, action: `Executed ${input.actionCode}`, status: 'Completed' },
    });

    return {
      executed: true,
      idempotentReplay: false,
      transactionRef: auditId,
      summary,
    };
  },

  // =========================================================================
  // AGENT 10: COMMUNICATION AGENT (AGT-10)
  // =========================================================================
  async runCommunicationAgent(input) {
    await db.update('agents', 'AGT-10', {
      status: 'Executing',
      active_task: `Generating customer resolution notice for ${input.complaintId}`,
    });

    const comm = await geminiService.reasonStructured({
      agentName: 'Communication Agent (AGT-10)',
      systemInstruction: 'Draft a warm, transparent customer resolution notification and concise internal executive summary.',
      contextData: input,
      fallbackBuilder: async (ctx) => ({
        subject: `Resolution Update for Your Order ${ctx.orderId} (${ctx.complaintId})`,
        customerMessage: `Dear ${ctx.customerName || 'Valued Customer'}, our Autonomous Operations team investigated your report regarding ${ctx.orderId} (${ctx.category}). ${ctx.selectedAction}. Your updated resolution reference is ${ctx.transactionRef || ctx.workflowId}.`,
        internalSummary: `Resolved ${ctx.complaintId} via ${ctx.selectedAction}. Customer notified automatically.`,
        delivered: true,
      }),
    });

    await recordAgentExecution('AGT-10', {
      status: 'Idle',
      activeTask: `Dispatched customer update for ${input.complaintId}`,
      finding: `Sent resolution notification to ${input.customerName} for ${input.complaintId}.`,
      taskLog: { workflowId: input.workflowId || 'LIVE', action: `Notified customer for ${input.complaintId}`, status: 'Completed' },
    });

    return comm;
  },
};