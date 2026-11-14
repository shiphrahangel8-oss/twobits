import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  LineChart,
  ScrollText,
  PlugZap,
  Scale,
  Settings,
  RefreshCw,
  Save,
  RotateCcw,
  Sparkles,
  Compass,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useUX } from '../context/UXContext';
import {
  PageHeader,
  StatusBadge,
  DemoSeededBadge,
  HelpTooltip,
  ContextualHelpPanel,
  ConfirmActionModal,
} from '../components/ui/DesignSystem';

// ============================================================================
// MODULE 15: HUMAN APPROVAL CENTER (/app/approvals)
// ============================================================================
export function HumanApprovalCenterPage() {
  const { user } = useAuth();
  const { isSimpleMode } = useUX();
  const [approvals, setApprovals] = useState([]);
  const [notesMap, setNotesMap] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [confirmDecision, setConfirmDecision] = useState(null);

  const fetchApprovals = async () => {
    const res = await api.get('/approvals');
    setApprovals(res.data.approvals || []);
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleReview = async (id, decision) => {
    setProcessingId(id);
    try {
      await api.post(`/approvals/${id}/review`, {
        decision,
        reviewNotes:
          notesMap[id] || `${decision} by ${user?.name} via Human Approval Center.`,
      });
      await fetchApprovals();
      setConfirmDecision(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Requires BUSINESS_MANAGER or ADMINISTRATOR role.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div id="tour-approvals" className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Actions Awaiting Your Approval'
            : '15. Human Approval Center (Human-in-the-Loop Governance)'
        }
        subtitle="Some important or expensive actions require manager approval before the AI completes them. Review the facts below to approve or reject each action."
        badge={
          <DemoSeededBadge
            label={`${approvals.filter((a) => a.status === 'Pending').length} Waiting for Your Review`}
          />
        }
      />

      <ContextualHelpPanel
        title="Why do some AI actions need your approval?"
        steps={[
          '1. Automatic limit: Routine refunds or replacements under $250 are completed automatically by your AI agents.',
          '2. Why it paused here: When a solution costs more than $250 (or involves a major emergency budget), the Policy Agent pauses the workflow and asks for manager sign-off.',
          '3. What happens after you approve: The Execution Agent immediately finishes the refund or replacement, the Communication Agent notifies the customer, and the complaint is marked Resolved.',
        ]}
      />

      <div className="space-y-4">
        {approvals.map((apr) => (
          <div
            key={apr.id}
            className={`bg-white border rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] ${
              apr.status === 'Pending' ? 'border-amber-300' : 'border-slate-200/90'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-amber-800">{apr.id}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono text-[#0071E3]">
                  Prepared by {apr.requested_by_agent}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Rule: {apr.policy_reference}
                </span>
                <HelpTooltip
                  term="Human-in-the-Loop Approval"
                  explanation="Some important or expensive actions require manager approval before the AI completes them."
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-bold text-[#1D1D1F]">
                  Cost of Action: ${Number(apr.estimated_cost).toFixed(2)}
                </span>
                <StatusBadge status={apr.status} />
              </div>
            </div>

            <h3 className="text-lg font-bold text-[#1D1D1F] mb-3">{apr.title}</h3>

            {/* Clear Explanation of WHY Approval is Needed & WHAT Happens After Approval */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="font-mono uppercase font-bold text-amber-900 mb-1">
                  Why This Action Requires Your Approval
                </div>
                <p className="text-slate-700 leading-relaxed">{apr.reason}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="font-mono uppercase font-bold text-emerald-800 mb-1">
                  What Happens After You Approve
                </div>
                <p className="text-slate-700 leading-relaxed">
                  The Execution Agent will immediately carry out this $
                  {Number(apr.estimated_cost).toFixed(2)} action for{' '}
                  <strong>{apr.order_id || 'the affected orders'}</strong>, the Communication Agent
                  will notify the customer, and the paused workflow will finish steps 9–12
                  automatically.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
                <div className="font-mono uppercase text-slate-500 font-bold mb-1">
                  {isSimpleMode ? 'Facts Checked by Your AI Agents' : 'Verified Multi-Agent Evidence'}
                </div>
                <pre className="font-mono text-[11px] text-[#1D1D1F] overflow-x-auto">
                  {JSON.stringify(apr.evidence, null, 2)}
                </pre>
              </div>
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="font-mono uppercase text-slate-500 font-bold mb-1">
                    Customer & Order Details
                  </div>
                  <div className="text-slate-700 mb-1">
                    Customer Impact: <strong className="text-[#1D1D1F]">{apr.customer_impact}</strong>
                  </div>
                  <div className="font-mono text-slate-500">
                    Workflow ID: {apr.workflow_id || 'N/A'} • Order ID: {apr.order_id || 'N/A'}
                  </div>
                </div>
                {apr.reviewed_by && (
                  <div className="mt-3 pt-2 border-t border-slate-200 text-emerald-700 font-medium">
                    Reviewed by {apr.reviewed_by}: &ldquo;{apr.review_notes}&rdquo;
                  </div>
                )}
              </div>
            </div>

            {apr.status === 'Pending' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-200/80">
                <input
                  type="text"
                  placeholder="Add an optional note explaining your decision..."
                  value={notesMap[apr.id] || ''}
                  onChange={(e) => setNotesMap({ ...notesMap, [apr.id]: e.target.value })}
                  className="flex-1 px-4 py-2 rounded-full bg-[#F5F5F7] border border-slate-200 text-xs text-[#1D1D1F]"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setConfirmDecision({
                        id: apr.id,
                        decision: 'Approved',
                        title: `Approve "${apr.title}" ($${Number(apr.estimated_cost).toFixed(2)})?`,
                        description:
                          'Approving this request will immediately instruct the Execution Agent to complete the action and notify the customer.',
                        consequences: [
                          `Financial impact: $${Number(apr.estimated_cost).toFixed(2)} authorized under ${apr.policy_reference}.`,
                          `Paused workflow (${apr.workflow_id || 'Crisis Recovery'}) will immediately resume and complete.`,
                          'Your approval will be recorded in Activity History (Audit Logs).',
                        ],
                        confirmLabel: 'Yes, Approve & Start the Approved Action',
                        variant: 'primary',
                      })
                    }
                    disabled={processingId === apr.id}
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Start the Approved Action
                  </button>
                  <button
                    onClick={() =>
                      setConfirmDecision({
                        id: apr.id,
                        decision: 'Rejected',
                        title: `Reject "${apr.title}"?`,
                        description:
                          'Rejecting this request will stop the AI from executing this solution and keep the case open for manual handling.',
                        consequences: [
                          'No refund or replacement shipment will be sent automatically.',
                          'Recorded in Activity History as Rejected by manager.',
                        ],
                        confirmLabel: 'Yes, Reject This Request',
                        variant: 'danger',
                      })
                    }
                    disabled={processingId === apr.id}
                    className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject & Request Manual Review
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmActionModal
        open={Boolean(confirmDecision)}
        onClose={() => setConfirmDecision(null)}
        onConfirm={() =>
          confirmDecision && handleReview(confirmDecision.id, confirmDecision.decision)
        }
        title={confirmDecision?.title || ''}
        description={confirmDecision?.description || ''}
        consequences={confirmDecision?.consequences || []}
        confirmLabel={confirmDecision?.confirmLabel || 'Confirm'}
        variant={confirmDecision?.variant || 'primary'}
        loading={Boolean(processingId)}
      />
    </div>
  );
}

// ============================================================================
// MODULE 16: ANALYTICS (/app/analytics)
// ============================================================================
export function AnalyticsPage() {
  const { isSimpleMode } = useUX();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/analytics').then((res) => setData(res.data));
  }, []);

  if (!data) {
    return (
      <div className="h-64 rounded-3xl bg-white animate-pulse border border-slate-200/80" />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Reports — Cost Savings & AI Team Performance'
            : '16. Platform & AI Workforce Analytics'
        }
        subtitle="See how much time and money ResolveAI saves your business each month compared to manual handling, and review each AI agent's accuracy."
        badge={<DemoSeededBadge label="Monthly Savings & Accuracy Reports" />}
      />

      <ContextualHelpPanel
        title="How to read these reports"
        steps={[
          'The top chart compares what it would cost to handle operations manually (Red bar) versus using ResolveAI (Blue bar), and highlights your net monthly savings (Green bar).',
          'The table below shows how many tasks each of your 10 AI agents has completed and how fast it responds.',
        ]}
      />

      {/* Monthly Cost Savings Chart */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#1D1D1F]">
              6-Month Cost Comparison: Manual Operations vs. ResolveAI
            </h3>
            <p className="text-xs text-slate-500">
              Hover over any bar to see exact dollar figures for that month
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-400" /> Manual Handling Cost
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#0071E3]" /> ResolveAI Cost
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> Money Saved
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4 items-end h-56 pt-6 px-4 border-b border-slate-200/80">
          {data.monthlySavingsSeries.map((m) => (
            <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-1.5 h-44">
                <div
                  style={{ height: `${Math.round((m.manualCost / 70000) * 100)}%` }}
                  title={`Manual: $${m.manualCost.toLocaleString()}`}
                  className="w-4 bg-rose-400 rounded-t-md"
                />
                <div
                  style={{ height: `${Math.round((m.aiCost / 70000) * 100)}%` }}
                  title={`AI Cost: $${m.aiCost.toLocaleString()}`}
                  className="w-4 bg-[#0071E3] rounded-t-md"
                />
                <div
                  style={{ height: `${Math.round((m.savings / 70000) * 100)}%` }}
                  title={`Saved: $${m.savings.toLocaleString()}`}
                  className="w-4 bg-emerald-500 rounded-t-md"
                />
              </div>
              <span className="text-xs font-mono text-slate-500">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Efficiency Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div className="p-5 border-b border-slate-200/80">
          <h3 className="text-lg font-bold text-[#1D1D1F]">AI Team Performance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-[#F5F5F7] text-[11px] font-mono uppercase text-slate-500">
                <th className="py-3.5 px-5">Agent ID</th>
                <th className="py-3.5 px-4">AI Specialist Name</th>
                <th className="py-3.5 px-4">Tasks Completed</th>
                <th className="py-3.5 px-4">Success Rate</th>
                <th className="py-3.5 px-5">Average Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-xs">
              {data.agentEfficiency.map((ag) => (
                <tr key={ag.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-5 font-mono text-[#0071E3] font-bold">{ag.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-[#1D1D1F]">{ag.name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {ag.completedTasks.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-emerald-700 font-bold">
                    {ag.successRate}%
                  </td>
                  <td className="py-3.5 px-5 font-mono text-slate-500">{ag.avgLatencyMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE 17: AUDIT LOGS (/app/audit-logs)
// ============================================================================
export function AuditLogsPage() {
  const { isSimpleMode } = useUX();
  const [logs, setLogs] = useState([]);
  const [actorFilter, setActorFilter] = useState('ALL');

  const fetchLogs = async () => {
    const res = await api.get('/audit-logs');
    setLogs(res.data.logs || []);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = actorFilter === 'ALL' ? logs : logs.filter((l) => l.actor_type === actorFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Activity History (Audit Logs)'
            : '17. Transparent Execution Audit Logs'
        }
        subtitle="A complete, permanent record of every action taken by your AI agents, automated workflows, and human managers."
        badge={<DemoSeededBadge label={`${logs.length} Recorded Activities`} />}
        actions={
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="px-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs text-[#1D1D1F] font-medium"
          >
            <option value="ALL">Show All Activity</option>
            <option value="AI_AGENT">AI Agents Only</option>
            <option value="WORKFLOW">Automated Workflows Only</option>
            <option value="USER">Human Managers & Staff Only</option>
          </select>
        }
      />

      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-[#F5F5F7] text-[11px] font-mono uppercase text-slate-500">
                <th className="py-3.5 px-5">Record ID</th>
                <th className="py-3.5 px-4">Who Took Action</th>
                <th className="py-3.5 px-4">Action Taken</th>
                <th className="py-3.5 px-4">Order / Item</th>
                <th className="py-3.5 px-4">Plain-English Summary</th>
                <th className="py-3.5 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-xs">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-5 font-mono text-[#0071E3] font-bold">{log.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#1D1D1F]">{log.actor_name}</div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {log.actor_type} • {log.actor_role}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#1D1D1F]">{log.action}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {log.target_entity}: {log.target_id}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-md">{log.details}</td>
                  <td className="py-3.5 px-5">
                    <StatusBadge status={log.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE 18: INTEGRATIONS (/app/integrations)
// ============================================================================
export function IntegrationsPage() {
  const { isSimpleMode } = useUX();
  const [integrations, setIntegrations] = useState([]);
  const [runtime, setRuntime] = useState(null);

  const fetchIntegrations = async () => {
    const res = await api.get('/integrations');
    setIntegrations(res.data.integrations || []);
    setRuntime(res.data.runtimeStatus);
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleSync = async (id) => {
    await api.post(`/integrations/${id}/sync`);
    fetchIntegrations();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Connected Business Systems (Integrations)'
            : '18. Connected Enterprise Integrations'
        }
        subtitle="Check the connection health of your database, AI engine, payment processor, shipping carriers, and warehouse systems."
        badge={<DemoSeededBadge label="Connected & Ready" />}
      />

      {runtime && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 text-xs space-y-1 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="font-mono uppercase text-[#0071E3] font-bold">
              Business Database Connection
            </div>
            <div className="text-[#1D1D1F] font-semibold">
              Current Mode: {runtime.dbStatus.mode}
            </div>
            <div className="text-slate-500">Status: {runtime.dbStatus.supabaseUrl}</div>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 text-xs space-y-1 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="font-mono uppercase text-emerald-700 font-bold">
              Google Gemini AI Engine
            </div>
            <div className="text-[#1D1D1F] font-semibold">
              Current Mode: {runtime.aiStatus.mode}
            </div>
            <div className="text-slate-500">
              Model: {runtime.aiStatus.model} • API Keys Safely Stored on Server
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((intg) => (
          <div
            key={intg.id}
            className="bg-white border border-slate-200/90 rounded-3xl p-5 flex flex-col justify-between shadow-[0_2px_14px_rgba(0,0,0,0.03)]"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-[#0071E3]">{intg.category}</span>
                <StatusBadge status={intg.status} />
              </div>
              <h3 className="text-base font-bold text-[#1D1D1F] mb-0.5">{intg.name}</h3>
              <p className="text-xs text-slate-500 mb-4">Provider: {intg.provider}</p>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#F5F5F7] border border-slate-200/70 text-center text-xs mb-3">
                <div>
                  <div className="font-bold text-emerald-700">{intg.health_score}%</div>
                  <div className="text-[10px] text-slate-500">Reliability</div>
                </div>
                <div>
                  <div className="font-bold text-[#1D1D1F]">{intg.latency_ms}ms</div>
                  <div className="text-[10px] text-slate-500">Speed</div>
                </div>
                <div>
                  <div className="font-bold text-[#0071E3]">
                    {intg.events_24h.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">Daily Syncs</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSync(intg.id)}
              className="w-full py-2.5 rounded-full bg-[#F5F5F7] hover:bg-[#0071E3] text-[#1D1D1F] hover:text-white text-xs font-semibold border border-slate-200/80 transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Connection & Sync Data
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MODULE 19: BUSINESS POLICIES (/app/policies)
// ============================================================================
export function BusinessPoliciesPage() {
  const { isSimpleMode } = useUX();
  const [policies, setPolicies] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const fetchPolicies = async () => {
    const res = await api.get('/policies');
    setPolicies(res.data.policies || []);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleUpdateThreshold = async (pol, newThreshold) => {
    setSavingId(pol.id);
    try {
      await api.patch(`/policies/${pol.id}`, {
        require_human_approval_above: Number(newThreshold),
        max_auto_refund_usd: Number(newThreshold),
      });
      fetchPolicies();
    } catch (err) {
      alert(err.response?.data?.error || 'Requires manager or admin role.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Business Rules & Approval Limits'
            : '19. Business Policies & Governance Guardrails'
        }
        subtitle="Set the rules your AI agents must follow—including the maximum dollar amount an AI agent can refund or replace automatically without asking a manager."
        badge={<DemoSeededBadge label="Checked by Policy Agent (AGT-06)" />}
      />

      <ContextualHelpPanel
        title="How do Business Rules control your AI agents?"
        steps={[
          'Before any AI agent issues a refund, ships a replacement item, or gives a store credit, the Policy Agent checks the rules on this page.',
          'If an action costs less than your Automatic Approval Limit (for example, $250), the AI completes it automatically.',
          'If an action costs more than the limit, the AI pauses and sends it to Pending Approvals for a manager to review.',
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {policies.map((pol) => (
          <div
            key={pol.id}
            className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between shadow-[0_2px_14px_rgba(0,0,0,0.03)]"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-[#0071E3]">
                  {pol.id} • {pol.category}
                </span>
                <StatusBadge status={pol.status} />
              </div>
              <h3 className="text-lg font-bold text-[#1D1D1F] mb-2">{pol.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">{pol.description}</p>

              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 space-y-1.5 text-xs mb-4">
                <div className="font-mono uppercase font-bold text-[#0071E3]">
                  Rules Checked by AI
                </div>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {(pol.rules || []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500">Require Manager Approval Above: </span>
                <strong className="font-mono text-[#1D1D1F] text-sm">
                  ${pol.require_human_approval_above}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                {[150, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    disabled={savingId === pol.id}
                    onClick={() => handleUpdateThreshold(pol, amt)}
                    className={`px-3 py-1 rounded-full font-mono font-semibold border transition-colors ${
                      Number(pol.require_human_approval_above) === amt
                        ? 'bg-[#0071E3] text-white border-[#0071E3]'
                        : 'bg-[#F5F5F7] text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MODULE 20: USER SETTINGS (/app/settings)
// ============================================================================
export function UserSettingsPage() {
  const { user, updateUserState } = useAuth();
  const { interfaceMode, setInterfaceMode, startTour, openWelcomeModal } = useUX();
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [savedMsg, setSavedMsg] = useState('');
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const res = await api.patch('/settings/profile', { name, department });
    updateUserState(res.data.user);
    setSavedMsg('Your profile settings have been saved.');
  };

  const handleResetDemo = async () => {
    await api.post('/settings/reset-demo');
    setConfirmResetOpen(false);
    setSavedMsg('Sample business data has been restored to its original starting state.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Interface Preferences"
        subtitle="Manage your profile, switch between Simple Mode and Advanced Mode, restart the guided tour, or reset the sample business data."
      />

      {savedMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
          {savedMsg}
        </div>
      )}

      {/* INTERFACE EXPERIENCE & ONBOARDING PREFERENCES */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div>
          <h3 className="text-base font-bold text-[#1D1D1F]">
            Interface Mode & Guided Onboarding Tour
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose Simple Mode for clear, everyday language and guided workflows, or Advanced Mode
            for technical logs and metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setInterfaceMode('simple')}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              interfaceMode === 'simple'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-[#F5F5F7] text-slate-600 border-slate-200'
            }`}
          >
            Simple Mode (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setInterfaceMode('advanced')}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              interfaceMode === 'advanced'
                ? 'bg-blue-50 text-[#0071E3] border-blue-200'
                : 'bg-[#F5F5F7] text-slate-600 border-slate-200'
            }`}
          >
            Advanced Mode
          </button>
          <button
            type="button"
            onClick={startTour}
            className="px-4 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" /> Restart Guided Tour
          </button>
          <button
            type="button"
            onClick={openWelcomeModal}
            className="px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-slate-200/70 text-[#1D1D1F] border border-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" /> Open Welcome Introduction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSaveProfile}
          className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 text-xs shadow-[0_2px_14px_rgba(0,0,0,0.03)]"
        >
          <h3 className="text-base font-bold text-[#1D1D1F]">Your Profile & Role</h3>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F]"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Email Address (Read-Only)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Your Access Level</label>
              <input
                type="text"
                disabled
                value={user?.role || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[#0071E3] font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Profile Changes
          </button>
        </form>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 text-xs shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
          <h3 className="text-base font-bold text-[#1D1D1F]">
            Sample Business Data & External Credentials
          </h3>
          <p className="text-slate-600 leading-relaxed">
            ResolveAI keeps secret keys (
            <code className="text-[#0071E3] font-semibold">SUPABASE_SERVICE_ROLE_KEY</code> and{' '}
            <code className="text-[#0071E3] font-semibold">GEMINI_API_KEY</code>) safely stored in{' '}
            <code className="text-[#1D1D1F] font-semibold">backend/.env</code> on the server. When
            you add those keys and restart the backend, the platform connects automatically.
          </p>
          <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 font-mono text-[11px] text-slate-700 space-y-1">
            <div>1. Copy backend/.env.example to backend/.env</div>
            <div>2. Set SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY</div>
            <div>3. Run backend/database/schema.sql in Supabase SQL Editor</div>
            <div>4. Set GEMINI_API_KEY for live @google/genai reasoning</div>
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-slate-500">
              Restore initial sample orders, complaints & approvals:
            </span>
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Sample Data
            </button>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleResetDemo}
        title="Reset Sample Business Data?"
        description="This will restore all sample orders, complaints, inventory stock levels, and pending approvals back to their initial starting state."
        consequences={[
          'Any new test complaints or approvals you created during this session will be reset to the default sample records.',
          'Your user account and interface preferences will remain intact.',
        ]}
        confirmLabel="Yes, Reset Sample Data"
        variant="danger"
      />
    </div>
  );
}
