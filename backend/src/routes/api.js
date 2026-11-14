import { createRouter } from '../utils/httpCompat.js';
import { db } from '../services/supabaseService.js';
import { geminiService } from '../services/geminiService.js';
import { hashPassword, verifyPassword, signToken } from '../utils/cryptoAuth.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validatePayload } from '../utils/validator.js';
import { agentRegistry } from '../agents/agentRegistry.js';
import { workflowEngine } from '../agents/workflowEngine.js';

const router = createRouter();

// ============================================================================
// 1. SYSTEM HEALTH & ENVIRONMENT TELEMETRY
// ============================================================================
router.get('/health', async (req, res) => {
  const dbStatus = await db.getStatus();
  const aiStatus = geminiService.getStatus();
  res.json({
    status: 'ok',
    platform: 'ResolveAI Autonomous Business Operations Platform',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    ai: aiStatus,
  });
});

// ============================================================================
// 2. AUTHENTICATION & USER MANAGEMENT
// ============================================================================
router.get('/auth/demo-accounts', async (req, res) => {
  res.json({
    accounts: [
      { role: 'ADMINISTRATOR', name: 'Alex Rivera', email: 'admin@resolveai.io', password: 'ResolveAdmin123!', description: 'Full platform, agent, crisis, policy & system configuration access' },
      { role: 'BUSINESS_MANAGER', name: 'Elena Vance', email: 'manager@resolveai.io', password: 'ResolveManager123!', description: 'Operations, approvals, crisis command, simulator, policies & analytics' },
      { role: 'SUPPORT_EMPLOYEE', name: 'Marcus Chen', email: 'support@resolveai.io', password: 'ResolveSupport123!', description: 'Complaint management, order inspection, and permitted resolutions' },
      { role: 'CUSTOMER', name: 'Sophia Sterling', email: 'customer@resolveai.io', password: 'ResolveCustomer123!', description: 'Customer Portal: personal orders, live shipment tracking & complaints' },
    ],
  });
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await db.findOne('users', (u) => u.email.toLowerCase() === String(email).toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    await db.insert('audit_logs', {
      id: `AUD-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      actor_type: 'USER',
      actor_name: user.name,
      actor_role: user.role,
      action: 'USER_LOGIN',
      target_entity: 'Session',
      target_id: user.id,
      status: 'SUCCESS',
      details: `${user.name} (${user.role}) signed in to ResolveAI.`,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar_url: user.avatar_url,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const schema = {
      name: { required: true, type: 'string' },
      email: { required: true, type: 'string' },
      password: { required: true, type: 'string' },
      role: {
        required: false,
        type: 'string',
        enum: ['ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE', 'CUSTOMER'],
      },
    };
    const validation = validatePayload(schema, req.body || {});
    if (!validation.success) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const { name, email, password, role = 'BUSINESS_MANAGER', department = 'Operations' } = req.body;
    const existing = await db.findOne('users', (u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await hashPassword(password);
    const newUser = await db.insert('users', {
      id: `usr-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      role,
      department,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      preferences: { theme: 'dark', notifications: true, autoApproveLowRisk: false },
    });

    const token = signToken({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name });

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        avatar_url: newUser.avatar_url,
        preferences: newUser.preferences,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

// ============================================================================
// 3. MAIN OPERATIONS DASHBOARD
// ============================================================================
router.get('/dashboard', authenticateToken, async (req, res) => {
  const [
    orders,
    complaints,
    agents,
    shipments,
    approvals,
    workflows,
    inventory,
    payments,
    auditLogs,
    predictions,
    crises,
  ] = await Promise.all([
    db.getAll('orders'),
    db.getAll('complaints'),
    db.getAll('agents'),
    db.getAll('shipments'),
    db.getAll('approvals'),
    db.getAll('workflows'),
    db.getAll('inventory'),
    db.getAll('payments'),
    db.getAll('audit_logs'),
    db.getAll('predictions'),
    db.getAll('crises'),
  ]);

  const activeComplaints = complaints.filter((c) => c.status !== 'Resolved');
  const resolvedComplaints = complaints.filter((c) => c.status === 'Resolved');
  const atRiskShipments = shipments.filter((s) => ['Delayed', 'Disrupted', 'Lost'].includes(s.status));
  const pendingApprovals = approvals.filter((a) => a.status === 'Pending');
  const completedWorkflows = workflows.filter((w) => w.status === 'Completed');
  const automationRate = workflows.length > 0
    ? ((completedWorkflows.length / workflows.length) * 100).toFixed(1)
    : '96.4';

  const kpiCards = [
    {
      id: 'total-orders',
      title: 'Total Orders',
      metric: orders.length + 1240,
      displayMetric: (orders.length + 1240).toLocaleString(),
      description: 'Active e-commerce orders monitored across 3 hubs (incl. seeded demo baseline)',
      trend: '+14.2%',
      trendDirection: 'up',
      comparisonPeriod: 'vs. prior 7 days',
    },
    {
      id: 'active-complaints',
      title: 'Active Complaints',
      metric: activeComplaints.length,
      displayMetric: String(activeComplaints.length),
      description: 'Open customer issues under autonomous investigation or approval',
      trend: '-28.5%',
      trendDirection: 'down-good',
      comparisonPeriod: 'vs. manual baseline',
    },
    {
      id: 'resolved-complaints',
      title: 'Resolved Complaints',
      metric: resolvedComplaints.length + 312,
      displayMetric: String(resolvedComplaints.length + 312),
      description: 'End-to-end verified resolutions with customer confirmation',
      trend: '+31.8%',
      trendDirection: 'up',
      comparisonPeriod: 'vs. last month',
    },
    {
      id: 'active-agents',
      title: 'Active AI Agents',
      metric: `${agents.length} / 10`,
      displayMetric: `${agents.length} / 10`,
      description: 'Specialized Gemini agents online and synchronized with Orchestrator',
      trend: '99.98% Uptime',
      trendDirection: 'up',
      comparisonPeriod: 'All 10 healthy',
    },
    {
      id: 'at-risk-shipments',
      title: 'At-Risk Shipments',
      metric: atRiskShipments.length,
      displayMetric: String(atRiskShipments.length),
      description: 'Parcels experiencing carrier hub delays >24h or transit exceptions',
      trend: '-19.0%',
      trendDirection: 'down-good',
      comparisonPeriod: 'after proactive re-routing',
    },
    {
      id: 'pending-approvals',
      title: 'Pending Approvals',
      metric: pendingApprovals.length,
      displayMetric: String(pendingApprovals.length),
      description: 'High-value (> $250) actions awaiting human governance sign-off',
      trend: 'Avg wait 4m',
      trendDirection: 'neutral',
      comparisonPeriod: 'Policy POL-02 active',
    },
    {
      id: 'automation-success-rate',
      title: 'Automation Success Rate',
      metric: `${automationRate}%`,
      displayMetric: `${automationRate}%`,
      description: 'Workflows resolved autonomously or self-healed without escalation',
      trend: '+4.6%',
      trendDirection: 'up',
      comparisonPeriod: 'vs. prior 30 days',
    },
    {
      id: 'avg-resolution-time',
      title: 'Average Resolution Time',
      metric: '2.4 mins',
      displayMetric: '2.4 mins',
      description: 'Mean time from complaint ingestion to verified execution',
      trend: '-91.4%',
      trendDirection: 'down-good',
      comparisonPeriod: 'vs. 4.2 hrs manual SLA',
    },
  ];

  const performanceTrend = [
    { day: 'Mon', orders: 195, complaints: 14, autonomousResolutions: 13 },
    { day: 'Tue', orders: 218, complaints: 16, autonomousResolutions: 15 },
    { day: 'Wed', orders: 242, complaints: 19, autonomousResolutions: 18 },
    { day: 'Thu', orders: 210, complaints: 11, autonomousResolutions: 11 },
    { day: 'Fri', orders: 265, complaints: 28, autonomousResolutions: 26 },
    { day: 'Sat', orders: 290, complaints: 15, autonomousResolutions: 15 },
    { day: 'Sun', orders: 248, complaints: 12, autonomousResolutions: 12 },
  ];

  res.json({
    isDemoSeededData: true,
    kpiCards,
    performanceTrend,
    agents,
    recentActivities: auditLogs.slice(0, 8),
    operationalRisks: {
      delayedOrders: orders.filter((o) => ['Delayed', 'Missing'].includes(o.status)),
      inventoryShortages: inventory.filter((i) => i.status !== 'In Stock'),
      paymentIssues: payments.filter((p) => p.inconsistency_flag),
      predictions: predictions.slice(0, 4),
    },
    recentDecisions: complaints
      .filter((c) => c.recommended_decision)
      .map((c) => ({
        complaintId: c.id,
        orderId: c.order_id,
        category: c.category,
        decision: c.recommended_decision,
        explanation: c.decision_reasoning,
        status: c.status,
        updatedAt: c.updated_at,
      })),
    workflowPerformance: {
      total: workflows.length,
      completed: workflows.filter((w) => w.status === 'Completed').length,
      pendingApproval: workflows.filter((w) => w.status === 'Awaiting Approval').length,
      failedOrEscalated: workflows.filter((w) => ['Failed', 'Escalated'].includes(w.status)).length,
      workflows,
    },
    pendingApprovals,
    activeCrisis: crises[0] || null,
  });
});

// ============================================================================
// 4. CUSTOMER COMPLAINT MANAGEMENT (Full CRUD + Autonomous 12-Stage Workflow)
// ============================================================================
router.get('/complaints', authenticateToken, async (req, res) => {
  const { search = '', category = 'ALL', status = 'ALL', priority = 'ALL', sort = 'newest', page = 1, limit = 20 } = req.query;
  let complaints = await db.getAll('complaints');

  // Role scoping: CUSTOMER only sees their own complaints
  if (req.user.role === 'CUSTOMER') {
    complaints = complaints.filter((c) => c.customer_email.toLowerCase() === req.user.email.toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    complaints = complaints.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.order_id.toLowerCase().includes(q) ||
        c.customer_name.toLowerCase().includes(q) ||
        c.customer_email.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }
  if (category !== 'ALL') {
    complaints = complaints.filter((c) => c.category === category);
  }
  if (status !== 'ALL') {
    complaints = complaints.filter((c) => c.status === status);
  }
  if (priority !== 'ALL') {
    complaints = complaints.filter((c) => c.priority === priority);
  }

  if (sort === 'priority') {
    const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    complaints.sort((a, b) => (rank[b.priority] || 0) - (rank[a.priority] || 0));
  } else {
    complaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const total = complaints.length;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const items = complaints.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    items,
    total,
    page: pageNum,
    totalPages: Math.max(1, Math.ceil(total / limitNum)),
  });
});

router.get('/complaints/:id', authenticateToken, async (req, res) => {
  const complaint = await db.getById('complaints', req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  if (req.user.role === 'CUSTOMER' && complaint.customer_email.toLowerCase() !== req.user.email.toLowerCase()) {
    return res.status(403).json({ error: 'Access denied to another customer complaint record.' });
  }

  const order = await db.getById('orders', complaint.order_id);
  const workflow = complaint.assigned_workflow_id
    ? await db.getById('workflows', complaint.assigned_workflow_id)
    : await db.findOne('workflows', (w) => w.complaint_id === complaint.id);
  const collaborations = await db.findMany('agent_collaborations', (col) => col.complaint_id === complaint.id);

  return res.json({
    complaint,
    order,
    workflow,
    collaborations,
  });
});

router.post('/complaints', authenticateToken, async (req, res) => {
  try {
    const schema = {
      customer_name: { required: true, type: 'string' },
      customer_email: { required: true, type: 'string' },
      order_id: { required: true, type: 'string' },
      category: {
        required: true,
        type: 'string',
        enum: [
          'Delayed delivery',
          'Missing order',
          'Payment deducted but order missing',
          'Damaged product',
          'Wrong product',
          'Cancellation',
          'Replacement',
          'Refund request',
        ],
      },
      description: { required: true, type: 'string' },
      priority: { required: true, type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
    };

    const valid = validatePayload(schema, req.body || {});
    if (!valid.success) {
      return res.status(400).json({ error: valid.errors.join(', ') });
    }

    const complaintId = `CMP-${Math.floor(2050 + Math.random() * 7900)}`;
    const workflowId = `WF-${Math.floor(8010 + Math.random() * 1900)}`;

    const createdComplaint = await db.insert('complaints', {
      id: complaintId,
      order_id: req.body.order_id.trim().toUpperCase(),
      customer_name: req.body.customer_name.trim(),
      customer_email: req.body.customer_email.trim(),
      category: req.body.category,
      description: req.body.description.trim(),
      priority: req.body.priority,
      status: 'Submitted',
      attachment_url: req.body.attachment_url || null,
      assigned_workflow_id: workflowId,
      recommended_decision: null,
      decision_reasoning: null,
      resolution_summary: 'Autonomous 12-stage workflow initiated.',
      customer_notification: null,
      resolution_history: [
        {
          timestamp: new Date().toISOString(),
          stage: 'Submitted',
          actor: req.user.name,
          detail: `Complaint ${complaintId} created and assigned to workflow ${workflowId}.`,
        },
      ],
      is_demo: false,
    });

    // Trigger real 12-stage Autonomous Multi-Agent Resolution Workflow
    const executionResult = await workflowEngine.executeComplaintWorkflow(createdComplaint);

    return res.status(201).json({
      message: executionResult.requiresApproval
        ? `Complaint ${complaintId} investigated by AI Agents and queued in Human Approval Center (${executionResult.approvalId}).`
        : `Complaint ${complaintId} autonomously investigated and resolved via workflow ${workflowId}!`,
      complaint: executionResult.complaint,
      workflow: executionResult.workflow,
      requiresApproval: executionResult.requiresApproval,
      approvalId: executionResult.approvalId || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/complaints/:id/rerun', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE'), async (req, res) => {
  try {
    const complaint = await db.getById('complaints', req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    const result = await workflowEngine.executeComplaintWorkflow(complaint);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 5. ORDER, PAYMENT, INVENTORY & LOGISTICS MANAGEMENT
// ============================================================================
router.get('/orders', authenticateToken, async (req, res) => {
  let orders = await db.getAll('orders');
  if (req.user.role === 'CUSTOMER') {
    orders = orders.filter((o) => o.customer_email.toLowerCase() === req.user.email.toLowerCase());
  }
  const payments = await db.getAll('payments');
  const shipments = await db.getAll('shipments');

  const enriched = orders.map((order) => ({
    ...order,
    payment: payments.find((p) => p.order_id === order.id) || null,
    shipment: shipments.find((s) => s.order_id === order.id) || null,
  }));

  res.json({ orders: enriched, payments });
});

router.patch('/orders/:id', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE'), async (req, res) => {
  const updated = await db.update('orders', req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Order not found' });

  await db.insert('audit_logs', {
    id: `AUD-${Date.now().toString().slice(-5)}`,
    timestamp: new Date().toISOString(),
    actor_type: 'USER',
    actor_name: req.user.name,
    actor_role: req.user.role,
    action: 'UPDATE_ORDER_STATE',
    target_entity: 'Order',
    target_id: req.params.id,
    status: 'SUCCESS',
    details: `Updated order ${req.params.id} status to ${updated.status}.`,
  });

  return res.json({ order: updated });
});

router.post('/payments/:id/reconcile', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE'), async (req, res) => {
  const payment = await db.getById('payments', req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  const nextStatus = payment.status === 'Duplicate_Charge' ? 'Refunded' : 'Captured';
  const updated = await db.update('payments', payment.id, {
    status: nextStatus,
    inconsistency_flag: false,
    inconsistency_reason: `Reconciled by ${req.user.name} + Payment Agent verification at ${new Date().toLocaleTimeString()}`,
  });

  if (payment.order_id) {
    await db.update('orders', payment.order_id, { status: nextStatus === 'Refunded' ? 'Confirmed' : 'In Transit' });
  }

  await db.insert('audit_logs', {
    id: `AUD-${Date.now().toString().slice(-5)}`,
    timestamp: new Date().toISOString(),
    actor_type: 'AI_AGENT',
    actor_name: `Payment Agent + ${req.user.name}`,
    actor_role: req.user.role,
    action: 'RECONCILE_PAYMENT_LEDGER',
    target_entity: 'Payment',
    target_id: payment.id,
    status: 'SUCCESS',
    details: `Resolved payment anomaly on ${payment.id} (${payment.gateway_reference}) -> ${nextStatus}.`,
  });

  return res.json({ payment: updated });
});

router.get('/inventory', authenticateToken, async (req, res) => {
  const inventory = await db.getAll('inventory');
  res.json({ inventory });
});

router.post('/inventory/:id/replenish', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE'), async (req, res) => {
  const item = await db.getById('inventory', req.params.id);
  if (!item) return res.status(404).json({ error: 'Inventory SKU not found' });

  const addedQty = Number(req.body?.quantity || 50);
  const newStock = item.stock_level + addedQty;
  const newStatus = newStock - item.reserved_stock > item.reorder_threshold ? 'In Stock' : 'Low Stock';

  const updated = await db.update('inventory', item.id, {
    stock_level: newStock,
    status: newStatus,
  });

  await db.insert('audit_logs', {
    id: `AUD-${Date.now().toString().slice(-5)}`,
    timestamp: new Date().toISOString(),
    actor_type: 'AI_AGENT',
    actor_name: `Inventory Agent + ${req.user.name}`,
    actor_role: req.user.role,
    action: 'REPLENISH_INVENTORY_STOCK',
    target_entity: 'Inventory',
    target_id: item.sku,
    status: 'SUCCESS',
    details: `Added +${addedQty} units to ${item.sku} at ${item.warehouse_id}. New stock level: ${newStock} (${newStatus}).`,
  });

  return res.json({ item: updated });
});

router.get('/logistics', authenticateToken, async (req, res) => {
  const shipments = await db.getAll('shipments');
  res.json({ shipments });
});

router.post('/logistics/:id/reroute', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE'), async (req, res) => {
  const shipment = await db.getById('shipments', req.params.id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

  const newCarrier = req.body?.carrier || 'UPS Next Day Air (Bypass Route)';
  const newHub = req.body?.hub || 'Dallas Central Air Gateway (WH-DAL-02)';

  const updated = await db.update('shipments', shipment.id, {
    carrier: newCarrier,
    current_hub: newHub,
    status: 'In Transit',
    delay_hours: 0,
    disruption_reason: `Autonomously re-routed via ${newCarrier} bypassing regional bottleneck.`,
  });

  if (shipment.order_id) {
    await db.update('orders', shipment.order_id, { status: 'In Transit' });
  }

  await db.insert('audit_logs', {
    id: `AUD-${Date.now().toString().slice(-5)}`,
    timestamp: new Date().toISOString(),
    actor_type: 'AI_AGENT',
    actor_name: `Logistics Agent + ${req.user.name}`,
    actor_role: req.user.role,
    action: 'REROUTE_DISRUPTED_SHIPMENT',
    target_entity: 'Shipment',
    target_id: shipment.id,
    status: 'SUCCESS',
    details: `Re-routed ${shipment.tracking_number} (${shipment.order_id}) via ${newCarrier} through ${newHub}.`,
  });

  return res.json({ shipment: updated });
});

// ============================================================================
// 6. AGENT COMMAND CENTER & AGENT COLLABORATION
// ============================================================================
router.get('/agents', authenticateToken, async (req, res) => {
  const agents = await db.getAll('agents');
  const collaborations = await db.getAll('agent_collaborations');
  res.json({ agents, collaborations });
});

router.post('/agents/:id/invoke', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE'), async (req, res) => {
  try {
    const agentId = req.params.id;
    const orderId = req.body?.orderId || 'ORD-9841';
    let result = null;

    switch (agentId) {
      case 'AGT-01':
        result = await agentRegistry.runOrchestratorAgent({
          complaintId: 'CMP-2041',
          orderId,
          category: 'Delayed delivery',
          description: 'Live interactive agent diagnostic check.',
        });
        break;
      case 'AGT-02':
        result = await agentRegistry.runOrderAgent({ orderId });
        break;
      case 'AGT-03':
        result = await agentRegistry.runPaymentAgent({ orderId });
        break;
      case 'AGT-04':
        result = await agentRegistry.runInventoryAgent({ orderId });
        break;
      case 'AGT-05':
        result = await agentRegistry.runLogisticsAgent({ orderId });
        break;
      case 'AGT-06':
        result = await agentRegistry.runPolicyAgent({ orderAmount: 219, category: 'Delayed delivery' });
        break;
      case 'AGT-07':
        result = await agentRegistry.runPredictionAgent();
        break;
      default: {
        const orderFinding = await agentRegistry.runOrderAgent({ orderId });
        const logisticsFinding = await agentRegistry.runLogisticsAgent({ orderId });
        const inventoryFinding = await agentRegistry.runInventoryAgent({ orderId });
        const policyFinding = await agentRegistry.runPolicyAgent({ orderAmount: orderFinding.totalAmount || 219, category: 'Delayed delivery' });
        result = await agentRegistry.runDecisionAgent({
          complaintId: 'CMP-2041',
          category: 'Delayed delivery',
          orderFinding,
          logisticsFinding,
          inventoryFinding,
          policyFinding,
        });
      }
    }

    const updatedAgent = await db.getById('agents', agentId);
    return res.json({ agent: updatedAgent, result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/collaborations', authenticateToken, async (req, res) => {
  const collaborations = await db.getAll('agent_collaborations');
  const workflows = await db.getAll('workflows');
  res.json({ collaborations, workflows });
});

router.post('/collaborations/negotiate', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE'), async (req, res) => {
  const orderId = req.body?.orderId || 'ORD-9841';
  const workflowId = `WF-NEG-${Date.now().toString().slice(-4)}`;

  const [orderFinding, logisticsFinding, inventoryFinding, paymentFinding] = await Promise.all([
    agentRegistry.runOrderAgent({ workflowId, orderId }),
    agentRegistry.runLogisticsAgent({ workflowId, orderId }),
    agentRegistry.runInventoryAgent({ workflowId, orderId }),
    agentRegistry.runPaymentAgent({ workflowId, orderId }),
  ]);

  const policyFinding = await agentRegistry.runPolicyAgent({
    workflowId,
    orderAmount: orderFinding.totalAmount || 249,
    category: req.body?.scenario || 'Delayed delivery',
  });

  const decision = await agentRegistry.runDecisionAgent({
    workflowId,
    complaintId: `NEG-${orderId}`,
    category: req.body?.scenario || 'Delayed delivery',
    orderFinding,
    paymentFinding,
    inventoryFinding,
    logisticsFinding,
    policyFinding,
  });

  const entries = [
    {
      id: `COL-${Date.now().toString().slice(-5)}-A`,
      workflow_id: workflowId,
      complaint_id: null,
      from_agent: 'Logistics Agent',
      to_agent: 'Decision Agent',
      stage: 'Live Negotiation — Step 1',
      message_type: 'Finding',
      message: logisticsFinding.summary,
      structured_data: logisticsFinding,
      confidence: 0.98,
    },
    {
      id: `COL-${Date.now().toString().slice(-5)}-B`,
      workflow_id: workflowId,
      complaint_id: null,
      from_agent: 'Inventory Agent',
      to_agent: 'Decision Agent',
      stage: 'Live Negotiation — Step 2',
      message_type: inventoryFinding.shortageDetected ? 'Conflict' : 'Recommendation',
      message: inventoryFinding.summary,
      structured_data: inventoryFinding,
      confidence: 0.96,
    },
    {
      id: `COL-${Date.now().toString().slice(-5)}-C`,
      workflow_id: workflowId,
      complaint_id: null,
      from_agent: 'Policy Agent',
      to_agent: 'Decision Agent',
      stage: 'Live Negotiation — Step 3',
      message_type: 'PolicyCheck',
      message: policyFinding.summary,
      structured_data: policyFinding,
      confidence: 1.0,
    },
    {
      id: `COL-${Date.now().toString().slice(-5)}-D`,
      workflow_id: workflowId,
      complaint_id: null,
      from_agent: 'Decision Agent',
      to_agent: policyFinding.requiresHumanApproval ? 'Human Approval Center' : 'Execution Agent',
      stage: 'Live Negotiation — Consensus',
      message_type: policyFinding.requiresHumanApproval ? 'Escalation' : 'Consensus',
      message: `${decision.selectedAction} is the preferred eligible option based on the available evidence.`,
      structured_data: decision,
      confidence: decision.confidence,
    },
  ];

  for (const entry of entries.reverse()) {
    await db.insert('agent_collaborations', entry);
  }

  const allCollaborations = await db.getAll('agent_collaborations');
  res.json({
    workflowId,
    decision,
    newMessages: entries.reverse(),
    collaborations: allCollaborations,
  });
});

// ============================================================================
// 7. AUTONOMOUS WORKFLOWS & SELF-HEALING ENGINE
// ============================================================================
router.get('/workflows', authenticateToken, async (req, res) => {
  const workflows = await db.getAll('workflows');
  res.json({ workflows });
});

router.post('/workflows/:id/self-heal', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE'), async (req, res) => {
  try {
    const updated = await workflowEngine.simulateAndHealWorkflow(req.params.id, req.body?.faultType || 'CARRIER_API_TIMEOUT');
    return res.json({ workflow: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 8. PREDICTIVE INTELLIGENCE
// ============================================================================
router.get('/predictions', authenticateToken, async (req, res) => {
  const predictions = await db.getAll('predictions');
  res.json({ predictions });
});

router.post('/predictions/scan', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE'), async (req, res) => {
  const scanResult = await agentRegistry.runPredictionAgent();
  res.json(scanResult);
});

router.patch('/predictions/:id/mitigate', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE'), async (req, res) => {
  const pred = await db.getById('predictions', req.params.id);
  if (!pred) return res.status(404).json({ error: 'Prediction not found' });

  const nextStatus = req.body?.status || 'Prevented';
  const updated = await db.update('predictions', pred.id, { status: nextStatus });

  await db.insert('audit_logs', {
    id: `AUD-${Date.now().toString().slice(-5)}`,
    timestamp: new Date().toISOString(),
    actor_type: 'AI_AGENT',
    actor_name: `Prediction Agent + ${req.user.name}`,
    actor_role: req.user.role,
    action: 'EXECUTE_PREVENTIVE_MITIGATION',
    target_entity: 'Prediction',
    target_id: pred.id,
    status: 'SUCCESS',
    details: `Executed preventive action for ${pred.id} (${pred.title}): ${pred.recommended_action}`,
  });

  return res.json({ prediction: updated });
});

// ============================================================================
// 9. AUTONOMOUS BUSINESS CRISIS MODE (300-Order Disruption Command Center)
// ============================================================================
router.get('/crises', authenticateToken, async (req, res) => {
  const crises = await db.getAll('crises');
  const approvals = await db.findMany('approvals', (a) => a.workflow_id === 'WF-CRISIS-901' || a.evidence?.crisisId === 'CRS-901');
  res.json({ crises, crisisApprovals: approvals });
});

router.post('/crises/:id/control', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER'), async (req, res) => {
  const crisis = await db.getById('crises', req.params.id);
  if (!crisis) return res.status(404).json({ error: 'Crisis event not found' });

  const { action, solutionId } = req.body || {};
  const nowIso = new Date().toISOString();
  let nextStatus = crisis.status;
  let nextProgress = crisis.recovery_progress;
  let timelineNote = '';

  if (action === 'PAUSE') {
    nextStatus = 'Paused';
    timelineNote = `Crisis workflow paused by ${req.user.name} (${req.user.role}) for manual inspection.`;
  } else if (action === 'RESUME') {
    nextStatus = 'Executing Recovery';
    nextProgress = Math.min(100, crisis.recovery_progress + 12);
    timelineNote = `Crisis recovery resumed by ${req.user.name}. Execution & Communication Agents processing remaining orders.`;
  } else if (action === 'ESCALATE') {
    nextStatus = 'Escalated';
    timelineNote = `Crisis escalated to Executive War Room by ${req.user.name}.`;
  } else if (action === 'EXECUTE_WAVE') {
    nextProgress = Math.min(100, crisis.recovery_progress + 16);
    nextStatus = nextProgress >= 100 ? 'Resolved' : 'Executing Recovery';
    timelineNote = `Executed recovery wave (${solutionId || 'SOL-A'}) across affected orders. Recovery progress now ${nextProgress}%.`;
  }

  const nextTimeline = [
    ...(crisis.timeline || []),
    {
      step: (crisis.timeline?.length || 0) + 1,
      time: nowIso,
      title: `Manager Action: ${action}`,
      agent: `${req.user.name} + Orchestrator Agent`,
      status: nextProgress >= 100 ? 'Completed' : 'Active',
      detail: timelineNote,
    },
  ];

  const updated = await db.update('crises', crisis.id, {
    status: nextStatus,
    recovery_progress: nextProgress,
    timeline: nextTimeline,
  });

  await db.insert('audit_logs', {
    id: `AUD-${Date.now().toString().slice(-5)}`,
    timestamp: nowIso,
    actor_type: 'USER',
    actor_name: req.user.name,
    actor_role: req.user.role,
    action: `CRISIS_${action}`,
    target_entity: 'Crisis',
    target_id: crisis.id,
    status: nextStatus.toUpperCase(),
    details: timelineNote,
  });

  return res.json({ crisis: updated });
});

// ============================================================================
// 10. WHAT-IF DECISION SIMULATOR (Pure Simulation — Never Executes Mutations)
// ============================================================================
router.post('/simulator/evaluate', authenticateToken, async (req, res) => {
  const {
    scenario = 'Lost High-Value Shipment',
    orderValue = 499,
    affectedVolume = 15,
    unitCostRatio = 0.48,
    expeditedShippingCost = 28,
    slaCreditAmount = 25,
    customerLifetimeValue = 1850,
  } = req.body || {};

  const policies = await db.getAll('policies');
  const threshold = Number(policies[0]?.require_human_approval_above || 250);

  const unitCost = Number((orderValue * unitCostRatio).toFixed(2));

  // Option A: Full Refund
  const refundDirectCost = Number((orderValue * affectedVolume).toFixed(2));
  const refundChurnRisk = 0.22;
  const refundLtvLoss = Number((affectedVolume * refundChurnRisk * customerLifetimeValue * 0.15).toFixed(2));

  // Option B: Expedited Replacement + SLA Credit
  const replacementDirectCost = Number(((unitCost + expeditedShippingCost + slaCreditAmount) * affectedVolume).toFixed(2));
  const replacementChurnRisk = 0.03;
  const replacementLtvLoss = Number((affectedVolume * replacementChurnRisk * customerLifetimeValue * 0.15).toFixed(2));

  // Option C: Wait 72h for Carrier Investigation
  const waitDirectCost = Number((slaCreditAmount * 0.5 * affectedVolume).toFixed(2));
  const waitChurnRisk = 0.38;
  const waitLtvLoss = Number((affectedVolume * waitChurnRisk * customerLifetimeValue * 0.2).toFixed(2));

  const options = [
    {
      id: 'SIM-OPT-A',
      name: 'Option A: Immediate Full Refund',
      estimatedBusinessCostUsd: refundDirectCost,
      retentionImpact: '78% Customer Retention (-22% Churn Risk)',
      estimatedLtvAtRiskUsd: refundLtvLoss,
      inventoryImpact: '0 units consumed (Revenue written off)',
      expectedResolutionTime: '4 minutes (Instant gateway reversal)',
      policyEligibility: orderValue <= threshold
        ? `Eligible for Auto-Refund (<= $${threshold})`
        : `Requires Human Approval (> $${threshold} under POL-02)`,
      operationalConsequences: 'Immediate revenue loss on all affected orders; avoids secondary shipping cost but forfeits margin.',
      recommended: false,
    },
    {
      id: 'SIM-OPT-B',
      name: 'Option B: Expedited Replacement + SLA Credit',
      estimatedBusinessCostUsd: replacementDirectCost,
      retentionImpact: '97% Customer Retention (Highest NPS & Loyalty)',
      estimatedLtvAtRiskUsd: replacementLtvLoss,
      inventoryImpact: `${affectedVolume} replacement units allocated from secondary hub`,
      expectedResolutionTime: '18–24 hours (Next-Day Air Dispatch)',
      policyEligibility: (unitCost + expeditedShippingCost + slaCreditAmount) <= threshold
        ? `Eligible for Autonomous Replacement under POL-01`
        : `Requires Human Manager Approval under POL-02`,
      operationalConsequences: 'Preserves full order revenue and long-term customer LTV at 44% lower net cost than refunding.',
      recommended: true,
    },
    {
      id: 'SIM-OPT-C',
      name: 'Option C: Wait 72h for Carrier Investigation',
      estimatedBusinessCostUsd: waitDirectCost,
      retentionImpact: '62% Customer Retention (High Escalation & Chargeback Risk)',
      estimatedLtvAtRiskUsd: waitLtvLoss,
      inventoryImpact: '0 units consumed initially; delayed secondary spike',
      expectedResolutionTime: '72–96 hours (Carrier trace SLA)',
      policyEligibility: 'Permitted under standard SLA, violates VIP proactive protection rule',
      operationalConsequences: 'Lowest upfront cash outlay but triggers +310% support ticket follow-ups and highest LTV erosion.',
      recommended: false,
    },
  ];

  res.json({
    isSimulatedEstimate: true,
    disclaimer: 'SIMULATED ESTIMATE ONLY — No actual orders, payments, or inventory records were modified.',
    scenario,
    assumptions: {
      orderValue,
      affectedVolume,
      unitCost,
      expeditedShippingCost,
      slaCreditAmount,
      customerLifetimeValue,
      policyApprovalCap: threshold,
    },
    options,
  });
});

// ============================================================================
// 11. BUSINESS DIGITAL TWIN (Live Entity Graph + Isolated State Simulation)
// ============================================================================
router.get('/digital-twin', authenticateToken, async (req, res) => {
  const [users, orders, payments, inventory, shipments, complaints] = await Promise.all([
    db.getAll('users'),
    db.getAll('orders'),
    db.getAll('payments'),
    db.getAll('inventory'),
    db.getAll('shipments'),
    db.getAll('complaints'),
  ]);

  res.json({
    realBusinessState: {
      customersCount: users.filter((u) => u.role === 'CUSTOMER').length + 284,
      ordersCount: orders.length,
      paymentsCount: payments.length,
      inventoryCount: inventory.length,
      shipmentsCount: shipments.length,
      complaintsCount: complaints.length,
      orders,
      payments,
      inventory,
      shipments,
      complaints,
    },
  });
});

router.post('/digital-twin/simulate', authenticateToken, async (req, res) => {
  const {
    perturbationType = 'WAREHOUSE_OUTAGE',
    targetWarehouse = 'WH-SEA-01',
    complaintSurgePercent = 50,
    carrierDelayHours = 48,
  } = req.body || {};

  const [orders, inventory, shipments] = await Promise.all([
    db.getAll('orders'),
    db.getAll('inventory'),
    db.getAll('shipments'),
  ]);

  // Compute simulated ripple effects without touching real DB
  const affectedInventory = inventory.filter((i) => i.warehouse_id === targetWarehouse);
  const affectedOrders = orders.filter((o) => o.warehouse_id === targetWarehouse);
  const fallbackHub = targetWarehouse === 'WH-SEA-01' ? 'WH-DAL-02' : 'WH-EWR-03';

  res.json({
    isolatedSimulationState: true,
    perturbationType,
    targetWarehouse,
    rippleChain: [
      {
        stage: '1. Inventory Node Impact',
        entity: 'Inventory',
        impactSummary: `${affectedInventory.length} SKUs at ${targetWarehouse} become unavailable or constrained.`,
      },
      {
        stage: '2. Order Fulfillment Ripple',
        entity: 'Orders',
        impactSummary: `${affectedOrders.length} active orders (plus ~120 projected daily orders) require immediate re-allocation to ${fallbackHub}.`,
      },
      {
        stage: '3. Carrier & Shipment Telemetry',
        entity: 'Shipments',
        impactSummary: `Simulated +${carrierDelayHours}h transit delay adds $${(affectedOrders.length * 25).toFixed(2)} in projected SLA credits.`,
      },
      {
        stage: '4. Customer Complaint Surge',
        entity: 'Complaints',
        impactSummary: `Projected +${complaintSurgePercent}% ticket surge absorbed by Orchestrator + Communication Agents with 94% autonomous containment.`,
      },
    ],
    alternativeFulfillmentStrategy: {
      primaryFallbackWarehouse: fallbackHub,
      estimatedRerouteLatencyHours: 4.5,
      autoScalingAgentsRequired: ['Inventory Agent', 'Logistics Agent', 'Execution Agent', 'Communication Agent'],
      projectedGmvSavedUsd: affectedOrders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0) * 12,
    },
  });
});

// ============================================================================
// 12. ORGANIZATIONAL MEMORY
// ============================================================================
router.get('/memory', authenticateToken, async (req, res) => {
  const memories = await db.getAll('organizational_memory');
  res.json({ memories });
});

router.post('/memory', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER'), async (req, res) => {
  const { category, title, problem_pattern, approved_resolution, workflow_template } = req.body || {};
  if (!title || !problem_pattern || !approved_resolution) {
    return res.status(400).json({ error: 'Title, problem pattern, and approved resolution are required.' });
  }
  const created = await db.insert('organizational_memory', {
    id: `MEM-${Date.now().toString().slice(-4)}`,
    category: category || 'Operational Playbook',
    title,
    problem_pattern,
    approved_resolution,
    workflow_template: workflow_template || 'WF-TPL-CUSTOM',
    avg_resolution_time_mins: 2.2,
    cost_saved_usd: 1200,
    success_rate: 99.0,
    times_reused: 1,
    learnings: [`Added by ${req.user.name} (${req.user.role}).`],
  });
  return res.status(201).json({ memory: created });
});

// ============================================================================
// 13. HUMAN APPROVAL CENTER
// ============================================================================
router.get('/approvals', authenticateToken, async (req, res) => {
  const approvals = await db.getAll('approvals');
  res.json({ approvals });
});

router.post('/approvals/:id/review', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER'), async (req, res) => {
  try {
    const { decision, reviewNotes } = req.body || {};
    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ error: "Decision must be 'Approved' or 'Rejected'." });
    }
    const updated = await workflowEngine.processHumanApproval(req.params.id, {
      decision,
      reviewerName: `${req.user.name} (${req.user.role})`,
      reviewNotes,
    });
    return res.json({ approval: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ============================================================================
// 14. ANALYTICS & BUSINESS INTELLIGENCE
// ============================================================================
router.get('/analytics', authenticateToken, async (req, res) => {
  const [complaints, workflows, agents, orders, memories] = await Promise.all([
    db.getAll('complaints'),
    db.getAll('workflows'),
    db.getAll('agents'),
    db.getAll('orders'),
    db.getAll('organizational_memory'),
  ]);

  const byCategory = {};
  complaints.forEach((c) => {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
  });

  const totalSaved = memories.reduce((sum, m) => sum + Number(m.cost_saved_usd || 0), 0);

  res.json({
    summaryMetrics: {
      totalCostSavedUsd: totalSaved,
      autonomousContainmentRate: 94.8,
      meanTimeToDetectMins: 0.3,
      meanTimeToResolveMins: 2.4,
      customerSatisfactionScore: 4.92,
      preventedDisruptions30d: 342,
    },
    complaintsByCategory: Object.entries(byCategory).map(([category, count]) => ({ category, count })),
    agentEfficiency: agents.map((a) => ({
      id: a.id,
      name: a.name,
      completedTasks: a.completed_tasks,
      successRate: a.success_rate,
      avgLatencyMs: a.avg_latency_ms,
    })),
    monthlySavingsSeries: [
      { month: 'Jun', manualCost: 48200, aiCost: 14100, savings: 34100 },
      { month: 'Jul', manualCost: 51900, aiCost: 13400, savings: 38500 },
      { month: 'Aug', manualCost: 54600, aiCost: 12800, savings: 41800 },
      { month: 'Sep', manualCost: 58000, aiCost: 12200, savings: 45800 },
      { month: 'Oct', manualCost: 62400, aiCost: 11900, savings: 50500 },
      { month: 'Nov', manualCost: 67800, aiCost: 11400, savings: 56400 },
    ],
    ordersCount: orders.length,
    workflowsCount: workflows.length,
  });
});

// ============================================================================
// 15. AUDIT LOGS
// ============================================================================
router.get('/audit-logs', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER', 'SUPPORT_EMPLOYEE'), async (req, res) => {
  const logs = await db.getAll('audit_logs');
  res.json({ logs });
});

// ============================================================================
// 16. INTEGRATIONS
// ============================================================================
router.get('/integrations', authenticateToken, async (req, res) => {
  const integrations = await db.getAll('integrations');
  const dbStatus = await db.getStatus();
  const aiStatus = geminiService.getStatus();
  res.json({ integrations, runtimeStatus: { dbStatus, aiStatus } });
});

router.post('/integrations/:id/sync', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER'), async (req, res) => {
  const item = await db.getById('integrations', req.params.id);
  if (!item) return res.status(404).json({ error: 'Integration not found' });

  const updated = await db.update('integrations', item.id, {
    status: 'Connected',
    health_score: 100,
    latency_ms: Math.floor(45 + Math.random() * 60),
    last_sync: new Date().toISOString(),
    events_24h: (item.events_24h || 1000) + 25,
  });

  return res.json({ integration: updated });
});

// ============================================================================
// 17. BUSINESS POLICIES
// ============================================================================
router.get('/policies', authenticateToken, async (req, res) => {
  const policies = await db.getAll('policies');
  res.json({ policies });
});

router.patch('/policies/:id', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER'), async (req, res) => {
  const policy = await db.getById('policies', req.params.id);
  if (!policy) return res.status(404).json({ error: 'Policy not found' });

  const updated = await db.update('policies', policy.id, req.body || {});

  await db.insert('audit_logs', {
    id: `AUD-${Date.now().toString().slice(-5)}`,
    timestamp: new Date().toISOString(),
    actor_type: 'USER',
    actor_name: req.user.name,
    actor_role: req.user.role,
    action: 'UPDATE_BUSINESS_POLICY',
    target_entity: 'Policy',
    target_id: policy.id,
    status: 'SUCCESS',
    details: `Updated policy ${policy.name} (Auto-Approval Threshold: $${updated.require_human_approval_above}).`,
  });

  return res.json({ policy: updated });
});

// ============================================================================
// 18. USER SETTINGS & DEMO DATA RESET
// ============================================================================
router.patch('/settings/profile', authenticateToken, async (req, res) => {
  const { name, department, preferences } = req.body || {};
  const updates = {};
  if (name) updates.name = name;
  if (department) updates.department = department;
  if (preferences) updates.preferences = preferences;

  const updatedUser = await db.update('users', req.user.id, updates);
  return res.json({
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      avatar_url: updatedUser.avatar_url,
      preferences: updatedUser.preferences,
    },
  });
});

router.post('/settings/reset-demo', authenticateToken, authorizeRoles('ADMINISTRATOR', 'BUSINESS_MANAGER'), async (req, res) => {
  await db.resetDemoData();
  res.json({ message: 'Seeded demo data has been reset to factory baseline.' });
});

export default router;