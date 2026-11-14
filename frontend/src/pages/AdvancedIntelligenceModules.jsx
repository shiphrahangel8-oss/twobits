import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Pause,
  Play,
  AlertOctagon,
  Zap,
  Sliders,
  Network,
  BrainCircuit,
  Plus,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
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
// MODULE 11: AUTONOMOUS BUSINESS CRISIS MODE (/app/crisis)
// ============================================================================
export function CrisisManagementPage() {
  const { user } = useAuth();
  const { isSimpleMode } = useUX();
  const [crisis, setCrisis] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [acting, setActing] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(null);

  const fetchCrisis = async () => {
    const res = await api.get('/crises');
    setCrisis((res.data.crises || [])[0] || null);
    setApprovals(res.data.crisisApprovals || []);
  };

  useEffect(() => {
    fetchCrisis();
  }, []);

  const handleControl = async (action, solutionId = 'SOL-A') => {
    if (!crisis) return;
    setActing(true);
    try {
      const res = await api.post(`/crises/${crisis.id}/control`, { action, solutionId });
      setCrisis(res.data.crisis);
      setPendingConfirm(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Manager role required to control crisis workflow.');
    } finally {
      setActing(false);
    }
  };

  if (!crisis) {
    return (
      <div className="h-64 rounded-3xl bg-white animate-pulse border border-slate-200/80" />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Business Emergency Center (Crisis Management)'
            : '11. Autonomous Business Crisis Mode — Command Center'
        }
        subtitle={
          isSimpleMode
            ? 'When a major operational problem affects many orders at once (such as a regional storm delaying 300 shipments), your AI agents coordinate a recovery plan here.'
            : 'Signature Differentiating Feature: Coordinated multi-agent detection, severity segmentation, cross-warehouse re-routing, and customer recovery for mass operational disruptions.'
        }
        badge={<StatusBadge status={crisis.status} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleControl('EXECUTE_WAVE', 'SOL-A')}
              disabled={acting}
              className="px-4 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" /> Start Next Recovery Wave (+16%)
            </button>
            <button
              onClick={() =>
                setPendingConfirm({
                  action: 'PAUSE',
                  title: 'Pause Emergency Recovery Workflow?',
                  description:
                    'Pausing this emergency workflow will temporarily stop your AI agents from re-routing remaining affected orders until you resume it.',
                  consequences: [
                    'No new replacement shipments or carrier re-routes will be dispatched while paused.',
                    'You can click "Continue the Investigation" at any time to resume.',
                  ],
                  confirmLabel: 'Yes, Pause Recovery Workflow',
                  variant: 'warning',
                })
              }
              disabled={acting}
              className="px-3.5 py-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" /> Pause Recovery Workflow
            </button>
            <button
              onClick={() => handleControl('RESUME')}
              disabled={acting}
              className="px-3.5 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0071E3] border border-blue-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Continue the Investigation
            </button>
            <button
              onClick={() =>
                setPendingConfirm({
                  action: 'ESCALATE',
                  title: 'Escalate Emergency to Executive Leadership?',
                  description:
                    'Escalating will mark this emergency as requiring immediate executive leadership review and notify all senior managers.',
                  consequences: [
                    'Status will update to Escalated.',
                    'Recorded in Activity History (Audit Logs) for management review.',
                  ],
                  confirmLabel: 'Yes, Escalate Emergency',
                  variant: 'danger',
                })
              }
              disabled={acting}
              className="px-3.5 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <AlertOctagon className="w-3.5 h-3.5" /> Escalate to Executive Team
            </button>
          </div>
        }
      />

      <ContextualHelpPanel
        title="How does the Business Emergency Center work?"
        steps={[
          '1. What the problem is: A severe regional disruption has delayed 300 customer orders at once.',
          '2. How AI helps: 7 AI agents automatically group affected customers by urgency, find backup warehouse stock, and prepare recovery waves.',
          '3. Your control: You can start the next recovery wave (+16%), pause or continue the workflow, or review pending high-cost approvals.',
        ]}
      />

      {/* TOP CRISIS METRICS BANNER */}
      <div className="bg-white border border-rose-200/90 rounded-3xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-rose-600 uppercase font-bold">
                <span>
                  {crisis.id} • {crisis.severity} PRIORITY EMERGENCY
                </span>
                <HelpTooltip
                  term="Business Emergency Mode (Crisis Mode)"
                  explanation="A special coordinated mode when hundreds of orders are affected by the same disruption (like a storm or warehouse outage)."
                />
              </div>
              <h2 className="text-xl font-bold text-[#1D1D1F]">{crisis.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
            <span>
              Your Role: <strong className="text-[#0071E3]">{user?.role}</strong>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/70 mb-6">
          <div className="text-xs font-mono uppercase text-rose-700 font-bold mb-1">
            What Is Happening Right Now
          </div>
          <p className="text-sm text-[#1D1D1F] leading-relaxed">{crisis.underlying_issue}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Affected Orders</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">{crisis.affected_orders}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">$148,500 Total Order Value</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Affected Customers</div>
            <div className="text-2xl font-bold text-[#1D1D1F] mt-1">
              {crisis.affected_customers}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              Customers Notified by AI
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium">Customer Priority Groups</div>
            <div className="text-xs font-mono text-slate-700 mt-1.5 space-y-0.5">
              <div>
                <span className="text-rose-600 font-bold">42</span> Urgent (&gt;48h delayed)
              </div>
              <div>
                <span className="text-amber-700 font-bold">118</span> High Priority (24-48h)
              </div>
              <div>
                <span className="text-[#0071E3] font-bold">140</span> Standard (&lt;24h)
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium mb-1">Investigation Progress</div>
            <div className="text-2xl font-bold text-[#0071E3]">
              {crisis.investigation_progress}%
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                style={{ width: `${crisis.investigation_progress}%` }}
                className="h-full bg-[#0071E3]"
              />
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
            <div className="text-xs text-slate-500 font-medium mb-1">Orders Recovered So Far</div>
            <div className="text-2xl font-bold text-emerald-600">{crisis.recovery_progress}%</div>
            <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                style={{ width: `${crisis.recovery_progress}%` }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* RECOMMENDED SOLUTIONS COMPARISON & ASSIGNED AGENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
          <div>
            <h3 className="text-lg font-bold text-[#1D1D1F]">
              Recovery Options Compared by Your AI Agents
            </h3>
            <p className="text-xs text-slate-500">
              Your AI team evaluated 3 recovery plans and selected the best balance of speed, cost,
              and customer satisfaction.
            </p>
          </div>
          <div className="space-y-3">
            {(crisis.recommended_solutions || []).map((sol) => (
              <div
                key={sol.id}
                className={`p-4 rounded-2xl border ${sol.recommended
                  ? 'bg-emerald-50/40 border-emerald-300'
                  : 'bg-[#F5F5F7] border-slate-200/80'
                  }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-bold text-[#1D1D1F]">{sol.name}</span>
                  {sol.recommended && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Recommended & Active Plan
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{sol.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-slate-200/80 text-slate-600">
                  <div>
                    Estimated Cost:{' '}
                    <strong className="text-[#1D1D1F]">
                      ${sol.estimatedCostUsd.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    Order Value Protected:{' '}
                    <strong className="text-[#0071E3]">
                      ${sol.gmvProtectedUsd.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    Customer Impact:{' '}
                    <strong className="text-emerald-700">{sol.customerRetentionImpact}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
            <h3 className="text-base font-bold text-[#1D1D1F] mb-1">
              AI Agents Working on This Emergency
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              These 7 specialist agents are actively coordinating the recovery:
            </p>
            <div className="flex flex-wrap gap-2">
              {(crisis.assigned_agents || []).map((ag) => (
                <span
                  key={ag}
                  className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0071E3]"
                >
                  {ag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
            <h3 className="text-base font-bold text-[#1D1D1F] mb-1">
              Decisions Waiting for Manager Approval
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              High-budget actions require your sign-off before execution:
            </p>
            {approvals.map((apr) => (
              <div
                key={apr.id}
                className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-1.5"
              >
                <div className="flex justify-between font-mono">
                  <span className="text-amber-800 font-bold">{apr.id}</span>
                  <StatusBadge status={apr.status} />
                </div>
                <div className="font-bold text-[#1D1D1F]">{apr.title}</div>
                <p className="text-slate-600">{apr.reason}</p>
                <Link
                  to="/app/approvals"
                  className="inline-block text-[#0071E3] hover:underline pt-1 font-semibold"
                >
                  Review & Approve in Pending Approvals →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CRISIS TIMELINE */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <h3 className="text-lg font-bold text-[#1D1D1F] mb-4">
          Step-by-Step Emergency Recovery Timeline
        </h3>
        <div className="space-y-3">
          {(crisis.timeline || []).map((ev, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 flex items-start gap-3"
            >
              <span className="w-6 h-6 rounded-lg bg-white text-[#0071E3] border border-slate-200 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                {ev.step}
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#1D1D1F]">{ev.title}</span>
                  <StatusBadge status={ev.status} />
                </div>
                <div className="text-[11px] font-mono text-[#0071E3]">{ev.agent}</div>
                <p className="text-xs text-slate-600 mt-1">{ev.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmActionModal
        open={Boolean(pendingConfirm)}
        onClose={() => setPendingConfirm(null)}
        onConfirm={() => pendingConfirm && handleControl(pendingConfirm.action)}
        title={pendingConfirm?.title || ''}
        description={pendingConfirm?.description || ''}
        consequences={pendingConfirm?.consequences || []}
        confirmLabel={pendingConfirm?.confirmLabel || 'Confirm'}
        variant={pendingConfirm?.variant || 'warning'}
        loading={acting}
      />
    </div>
  );
}

// ============================================================================
// MODULE 12: WHAT-IF DECISION SIMULATOR (/app/simulator)
// ============================================================================
export function DecisionSimulatorPage() {
  const { isSimpleMode } = useUX();
  const [params, setParams] = useState({
    scenario: 'Lost High-Value Shipment Batch',
    orderValue: 499,
    affectedVolume: 15,
    expeditedShippingCost: 28,
    slaCreditAmount: 25,
    customerLifetimeValue: 1850,
  });
  const [simResult, setSimResult] = useState(null);

  const runSimulation = async (nextParams = params) => {
    const res = await api.post('/simulator/evaluate', nextParams);
    setSimResult(res.data);
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const handleSliderChange = (key, val) => {
    const updated = { ...params, [key]: Number(val) };
    setParams(updated);
    runSimulation(updated);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Compare Solutions (Decision Simulator)'
            : '12. Interactive What-If Decision Simulator'
        }
        subtitle="Compare possible solutions before taking action—see how issuing a Full Refund, sending an Express Replacement, or Waiting for the Carrier affects your costs and customer satisfaction."
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            SAFE COMPARISON — DOES NOT CHANGE LIVE ORDERS
          </span>
        }
      />

      <ContextualHelpPanel
        title="How to use Compare Solutions (Decision Simulator)"
        steps={[
          'Use the sliders on the left to adjust the order value, number of affected orders, or shipping cost.',
          'On the right, ResolveAI compares 3 choices side by side: Option 1 (Full Refund), Option 2 (Express Replacement), and Option 3 (Wait for Carrier).',
          'Because this is a safe calculator, adjusting sliders never modifies your actual orders or customer records.',
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Assumptions Controls */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1D1D1F]">Adjust Situation Details</h3>
            <HelpTooltip
              term="Decision Simulator"
              explanation="Compare possible solutions before taking action."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Choose a Situation
            </label>
            <select
              value={params.scenario}
              onChange={(e) => {
                const updated = { ...params, scenario: e.target.value };
                setParams(updated);
                runSimulation(updated);
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-slate-200 text-xs text-[#1D1D1F]"
            >
              <option value="Lost High-Value Shipment Batch">Lost High-Value Shipment Batch</option>
              <option value="Regional Carrier Weather Delay (>48h)">
                Regional Carrier Weather Delay (&gt;48h)
              </option>
              <option value="Damaged Fragile Display Batch">Damaged Fragile Display Batch</option>
            </select>
          </div>

          {[
            { key: 'orderValue', label: 'Average Order Value ($)', min: 50, max: 1500, step: 25 },
            { key: 'affectedVolume', label: 'Number of Affected Orders', min: 1, max: 300, step: 1 },
            {
              key: 'expeditedShippingCost',
              label: 'Express Shipping Cost per Order ($)',
              min: 10,
              max: 120,
              step: 5,
            },
            {
              key: 'slaCreditAmount',
              label: 'Customer Apology Credit ($)',
              min: 0,
              max: 100,
              step: 5,
            },
            {
              key: 'customerLifetimeValue',
              label: 'Value of Keeping a Repeat Customer ($)',
              min: 300,
              max: 5000,
              step: 100,
            },
          ].map((ctrl) => (
            <div key={ctrl.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">{ctrl.label}</span>
                <span className="font-mono font-bold text-[#0071E3]">{params[ctrl.key]}</span>
              </div>
              <input
                type="range"
                min={ctrl.min}
                max={ctrl.max}
                step={ctrl.step}
                value={params[ctrl.key]}
                onChange={(e) => handleSliderChange(ctrl.key, e.target.value)}
                className="w-full accent-[#0071E3]"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => runSimulation(params)}
            className="w-full py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold"
          >
            Recalculate & Compare Solutions
          </button>
        </div>

        {/* Right: 3 Candidate Options Comparison */}
        <div className="lg:col-span-8 space-y-4">
          {simResult && (
            <>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong>Note:</strong> {simResult.disclaimer}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {simResult.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`rounded-3xl p-5 border flex flex-col justify-between ${opt.recommended
                      ? 'bg-white border-emerald-400 shadow-[0_8px_24px_rgba(16,185,129,0.08)]'
                      : 'bg-white border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)]'
                      }`}
                  >
                    <div>
                      {opt.recommended && (
                        <span className="inline-block mb-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          BEST RECOMMENDED OPTION
                        </span>
                      )}
                      <h4 className="text-base font-bold text-[#1D1D1F] mb-3">{opt.name}</h4>

                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 rounded-2xl bg-[#F5F5F7] border border-slate-200/70">
                          <div className="text-slate-500">Estimated Cost to Your Business</div>
                          <div className="text-lg font-mono font-bold text-[#1D1D1F]">
                            ${opt.estimatedBusinessCostUsd.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 rounded-2xl bg-[#F5F5F7] border border-slate-200/70">
                          <div className="text-slate-500">Effect on Customer Loyalty</div>
                          <div className="font-semibold text-[#0071E3]">{opt.retentionImpact}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Repeat Business at Risk: ${opt.estimatedLtvAtRiskUsd.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Warehouse Stock Impact:</span>
                          <span className="text-[#1D1D1F] font-medium">{opt.inventoryImpact}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Time to Resolve:</span>
                          <span className="text-[#1D1D1F] font-mono">
                            {opt.expectedResolutionTime}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Company Rule Status:</span>
                          <span className="text-[#0071E3] font-semibold">
                            {opt.policyEligibility}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">What Happens if You Pick This:</span>
                          <span className="text-slate-600 leading-relaxed">
                            {opt.operationalConsequences}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE 13: BUSINESS DIGITAL TWIN (/app/digital-twin)
// ============================================================================
export function BusinessDigitalTwinPage() {
  const { isSimpleMode } = useUX();
  const [twinData, setTwinData] = useState(null);
  const [simConfig, setSimConfig] = useState({
    perturbationType: 'WAREHOUSE_OUTAGE',
    targetWarehouse: 'WH-SEA-01',
    complaintSurgePercent: 60,
    carrierDelayHours: 48,
  });
  const [simOutput, setSimOutput] = useState(null);

  useEffect(() => {
    api.get('/digital-twin').then((res) => setTwinData(res.data.realBusinessState));
    api.post('/digital-twin/simulate', simConfig).then((res) => setSimOutput(res.data));
  }, []);

  const handleRunSimulation = async (nextConfig = simConfig) => {
    setSimConfig(nextConfig);
    const res = await api.post('/digital-twin/simulate', nextConfig);
    setSimOutput(res.data);
  };

  if (!twinData) {
    return (
      <div className="h-64 rounded-3xl bg-white animate-pulse border border-slate-200/80" />
    );
  }

  const entityChain = [
    { label: 'Customers', count: twinData.customersCount, desc: 'Active Buyers' },
    { label: 'Orders', count: twinData.ordersCount, desc: 'Placed Orders' },
    { label: 'Payments', count: twinData.paymentsCount, desc: 'Payment Records' },
    { label: 'Inventory', count: twinData.inventoryCount, desc: 'Warehouse Items' },
    { label: 'Deliveries', count: twinData.shipmentsCount, desc: 'Shipments in Transit' },
    { label: 'Complaints', count: twinData.complaintsCount, desc: 'Support Cases' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Business Simulation (Business Digital Twin)'
            : '13. Business Digital Twin & Scenario Simulation'
        }
        subtitle="A virtual model of your business operations used to explore how problems affect orders, inventory, deliveries, and complaints—without changing your actual business records."
        badge={<DemoSeededBadge label="Safe Sandbox Simulation" />}
      />

      <ContextualHelpPanel
        title="What is Business Simulation (Business Digital Twin)?"
        steps={[
          'Your business is connected in a chain: Customers place Orders, make Payments, reserve Warehouse Inventory, receive Deliveries, and occasionally file Complaints.',
          'This page lets you test "what-if" scenarios—such as a warehouse closing for a day or a 48-hour shipping delay—to see the ripple effect across your business.',
          'All tests run on a virtual copy of your business, so your live records are never altered.',
        ]}
      />

      {/* ENTITY RELATIONSHIP CHAIN */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#0071E3] font-bold">
            How Your Business Operations Connect (Live Counts)
          </h3>
          <HelpTooltip
            term="Business Digital Twin"
            explanation="A virtual model of your business operations used to explore how problems affect orders, inventory, deliveries, and complaints."
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {entityChain.map((node, idx) => (
            <div
              key={node.label}
              className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 relative"
            >
              <div className="text-[10px] font-mono text-slate-400">STEP 0{idx + 1}</div>
              <div className="text-base font-bold text-[#1D1D1F] mt-0.5">{node.label}</div>
              <div className="text-2xl font-bold text-[#0071E3] my-1">{node.count}</div>
              <div className="text-[11px] text-slate-500">{node.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PERTURBATION EXPLORER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
          <h3 className="text-lg font-bold text-[#1D1D1F]">
            Explore a &ldquo;What-If&rdquo; Business Scenario
          </h3>
          <p className="text-xs text-slate-500">
            Choose a hypothetical problem below to see how it would affect your warehouses,
            deliveries, and customers—without changing any real data.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Scenario to Test
            </label>
            <select
              value={simConfig.perturbationType}
              onChange={(e) =>
                handleRunSimulation({ ...simConfig, perturbationType: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-slate-200 text-xs text-[#1D1D1F]"
            >
              <option value="WAREHOUSE_OUTAGE">
                What happens when stock at a warehouse becomes unavailable?
              </option>
              <option value="CARRIER_DISRUPTION">
                What happens when a shipping carrier has a major delay?
              </option>
              <option value="COMPLAINT_SURGE">
                How does a sudden jump in customer complaints affect operations?
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Warehouse Location
            </label>
            <select
              value={simConfig.targetWarehouse}
              onChange={(e) =>
                handleRunSimulation({ ...simConfig, targetWarehouse: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-slate-200 text-xs text-[#1D1D1F] font-mono"
            >
              <option value="WH-SEA-01">Seattle Pacific Hub (WH-SEA-01)</option>
              <option value="WH-DAL-02">Dallas Central Fulfillment (WH-DAL-02)</option>
              <option value="WH-EWR-03">Newark East Coast Hub (WH-EWR-03)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">Hypothetical Shipping Delay (Hours)</span>
              <span className="font-mono font-bold text-[#0071E3]">
                {simConfig.carrierDelayHours}h
              </span>
            </div>
            <input
              type="range"
              min={12}
              max={120}
              step={12}
              value={simConfig.carrierDelayHours}
              onChange={(e) =>
                handleRunSimulation({
                  ...simConfig,
                  carrierDelayHours: Number(e.target.value),
                })
              }
              className="w-full accent-[#0071E3]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">Hypothetical Increase in Complaints (%)</span>
              <span className="font-mono font-bold text-amber-700">
                +{simConfig.complaintSurgePercent}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={simConfig.complaintSurgePercent}
              onChange={(e) =>
                handleRunSimulation({
                  ...simConfig,
                  complaintSurgePercent: Number(e.target.value),
                })
              }
              className="w-full accent-[#0071E3]"
            />
          </div>

          <button
            type="button"
            onClick={() => handleRunSimulation(simConfig)}
            className="w-full py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold"
          >
            Analyze This Business Scenario
          </button>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#1D1D1F]">
              Step-by-Step Impact Across Your Business
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0071E3] border border-blue-200 font-mono text-xs">
              Simulation Only — No Live Changes
            </span>
          </div>

          {simOutput && (
            <>
              <div className="space-y-3">
                {simOutput.rippleChain.map((r, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/80"
                  >
                    <div className="flex justify-between text-xs font-mono text-[#0071E3] font-semibold mb-1">
                      <span>{r.stage}</span>
                      <span>Department: {r.entity}</span>
                    </div>
                    <p className="text-xs text-[#1D1D1F]">{r.impactSummary}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                <div className="font-mono uppercase font-bold text-emerald-800">
                  AI Recommended Backup Plan
                </div>
                <div className="text-slate-700">
                  Backup Warehouse:{' '}
                  <strong className="font-mono text-[#1D1D1F]">
                    {simOutput.alternativeFulfillmentStrategy.primaryFallbackWarehouse}
                  </strong>{' '}
                  • Estimated Switch Time:{' '}
                  <strong className="font-mono text-[#1D1D1F]">
                    {simOutput.alternativeFulfillmentStrategy.estimatedRerouteLatencyHours}h
                  </strong>{' '}
                  • Order Value Protected:{' '}
                  <strong className="font-mono text-emerald-700">
                    $
                    {simOutput.alternativeFulfillmentStrategy.projectedGmvSavedUsd.toLocaleString()}
                  </strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE 14: ORGANIZATIONAL MEMORY (/app/memory)
// ============================================================================
export function OrganizationalMemoryPage() {
  const { isSimpleMode } = useUX();
  const [memories, setMemories] = useState([]);
  const [form, setForm] = useState({
    category: 'Fulfillment Playbook',
    title: '',
    problem_pattern: '',
    approved_resolution: '',
    workflow_template: 'WF-TPL-CUSTOM',
  });

  const fetchMemories = async () => {
    const res = await api.get('/memory');
    setMemories(res.data.memories || []);
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleAddMemory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/memory', form);
      setForm({
        category: 'Fulfillment Playbook',
        title: '',
        problem_pattern: '',
        approved_resolution: '',
        workflow_template: 'WF-TPL-CUSTOM',
      });
      fetchMemories();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save organizational memory');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Previous Case History (Organizational Memory)'
            : '14. Organizational Memory & Knowledge Engine'
        }
        subtitle="ResolveAI remembers previous problems and successful solutions so similar issues can be handled faster in the future."
        badge={<DemoSeededBadge label={`${memories.length} Proven Solution Playbooks`} />}
      />

      <ContextualHelpPanel
        title="How does Previous Case History help your business?"
        steps={[
          'Whenever your team solves a tricky problem (such as a carrier delay or duplicate billing charge), ResolveAI saves the winning solution here.',
          'Next time a customer reports a similar problem, the AI agents automatically look up these proven solutions to resolve the case faster.',
          'You can also add your own proven solution using the form on the right.',
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          {memories.map((mem) => (
            <div
              key={mem.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0071E3]">{mem.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F5F5F7] border border-slate-200 text-xs text-slate-600">
                    {mem.category}
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-700 font-semibold">
                  Used {mem.times_reused} times • {mem.success_rate}% Success • Saved $
                  {Number(mem.cost_saved_usd).toLocaleString()}
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#1D1D1F] mb-2">{mem.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
                  <div className="font-mono text-slate-500 uppercase font-bold mb-1">
                    When This Problem Happens
                  </div>
                  <p className="text-[#1D1D1F]">{mem.problem_pattern}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <div className="font-mono text-emerald-800 uppercase font-bold mb-1">
                    Proven Solution Used by AI
                  </div>
                  <p className="text-[#1D1D1F]">{mem.approved_resolution}</p>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                <strong className="text-slate-700">Key Takeaways:</strong>{' '}
                {(mem.learnings || []).join(' • ')}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 h-fit shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-[#1D1D1F]">Save a New Proven Solution</h3>
            <HelpTooltip
              term="Organizational Memory"
              explanation="ResolveAI remembers previous problems and successful solutions so similar issues can be handled faster in the future."
            />
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Teach your AI agents how you want recurring customer problems handled in the future.
          </p>
          <form onSubmit={handleAddMemory} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Solution Title</label>
              <input
                type="text"
                required
                placeholder="e.g., International Customs Hold -> Express Broker Release"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F]"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                What Problem Does This Solve?
              </label>
              <textarea
                rows={2}
                required
                placeholder="Describe when this problem happens..."
                value={form.problem_pattern}
                onChange={(e) => setForm({ ...form, problem_pattern: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F]"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                How Should AI Resolve It?
              </label>
              <textarea
                rows={2}
                required
                placeholder="Describe the approved action to take..."
                value={form.approved_resolution}
                onChange={(e) => setForm({ ...form, approved_resolution: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-slate-200 text-[#1D1D1F]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold"
            >
              Save to Previous Case History
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
