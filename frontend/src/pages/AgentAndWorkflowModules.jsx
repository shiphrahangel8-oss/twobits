import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  GitMerge,
  Workflow,
  Radar,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Terminal,
  Users,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { useUX } from '../context/UXContext';
import {
  PageHeader,
  StatusBadge,
  DemoSeededBadge,
  Modal,
  HelpTooltip,
  ContextualHelpPanel,
} from '../components/ui/DesignSystem';

// Friendly educational metadata for all 10 ResolveAI Agents (Section 6)
const AGENT_EDUCATION_MAP = {
  'AGT-01': {
    displayName: 'ORCHESTRATOR AGENT',
    simpleRole: 'Your operations manager.',
    whatItDoes: 'Coordinates all other AI agents and manages the overall workflow from start to finish.',
    whenUsed: 'Every time a new customer complaint, order issue, or operational alert arrives.',
    infoNeeded: 'Complaint description, Order ID, and current status from all specialist agents.',
    resultProduced: 'A complete step-by-step investigation plan and verified final resolution.',
  },
  'AGT-02': {
    displayName: 'ORDER AGENT',
    simpleRole: 'Your order investigator.',
    whatItDoes: 'Checks order details, purchased items, and order status.',
    whenUsed: 'When a customer reports a problem with an order.',
    infoNeeded: 'Order ID, customer details, order records.',
    resultProduced: 'Confirms whether the order exists and identifies order-related issues.',
  },
  'AGT-03': {
    displayName: 'PAYMENT AGENT',
    simpleRole: 'Your payment specialist.',
    whatItDoes: 'Verifies payment transactions, duplicate charges, and refund eligibility.',
    whenUsed: 'When an order has a billing question, missing payment, or requires a refund.',
    infoNeeded: 'Payment transaction ID, billing amount, and payment gateway records.',
    resultProduced: 'Confirms whether payment succeeded and calculates any refund or credit due.',
  },
  'AGT-04': {
    displayName: 'INVENTORY AGENT',
    simpleRole: 'Your warehouse coordinator.',
    whatItDoes: 'Checks product availability across warehouses and reserves replacement items.',
    whenUsed: 'When an item needs to be replaced or when warehouse stock runs low.',
    infoNeeded: 'Product SKU, warehouse stock levels, and customer location.',
    resultProduced: 'Identifies the closest warehouse with available stock and reserves the item.',
  },
  'AGT-05': {
    displayName: 'LOGISTICS AGENT',
    simpleRole: 'Your delivery tracker.',
    whatItDoes: 'Monitors shipment progress, carrier delays, and delivery routes.',
    whenUsed: 'When a package is delayed, missing in transit, or affected by weather.',
    infoNeeded: 'Tracking number, carrier updates, and current shipping hub location.',
    resultProduced: 'Pinpoints where the package is delayed and recommends faster shipping options.',
  },
  'AGT-06': {
    displayName: 'POLICY AGENT',
    simpleRole: 'Your rule checker.',
    whatItDoes: 'Ensures all decisions follow your company policies and refund limits.',
    whenUsed: 'Before any refund, replacement, or courtesy credit is approved.',
    infoNeeded: 'Proposed solution cost, customer tier, and company business rules.',
    resultProduced: 'Confirms whether the action can run automatically or needs manager approval.',
  },
  'AGT-07': {
    displayName: 'PREDICTION AGENT',
    simpleRole: 'Your early warning system.',
    whatItDoes: 'Detects potential business problems before customers complain.',
    whenUsed: 'Continuously scans orders, warehouse stock, and delivery routes in the background.',
    infoNeeded: 'Live order trends, stock levels, and carrier delay patterns.',
    resultProduced: 'Early risk alerts with recommended preventive actions.',
  },
  'AGT-08': {
    displayName: 'DECISION AGENT',
    simpleRole: 'Your problem-solving strategist.',
    whatItDoes: 'Compares possible solutions and selects the best option for both the customer and the business.',
    whenUsed: 'After the specialist agents finish gathering facts about the problem.',
    infoNeeded: 'Findings from Order, Payment, Inventory, Logistics, and Policy agents.',
    resultProduced: 'Selects the best resolution (such as express replacement or instant refund).',
  },
  'AGT-09': {
    displayName: 'EXECUTION AGENT',
    simpleRole: 'Your action specialist.',
    whatItDoes: 'Carries out approved actions such as refunds, replacements, and order updates.',
    whenUsed: 'Once a solution is approved automatically by policy or signed off by a manager.',
    infoNeeded: 'Approved resolution plan, Order ID, and warehouse or payment instructions.',
    resultProduced: 'Updates the order, dispatches the replacement or refund, and logs the action.',
  },
  'AGT-10': {
    displayName: 'COMMUNICATION AGENT',
    simpleRole: 'Your customer messaging specialist.',
    whatItDoes: 'Writes clear updates for customers and internal teams.',
    whenUsed: 'After an action is taken or when a customer needs a status update.',
    infoNeeded: 'Customer name, resolution summary, new tracking number, or refund confirmation.',
    resultProduced: 'Sends a friendly, helpful message to the customer and closes the loop.',
  },
};

const COORDINATION_STEPS = [
  {
    step: 1,
    title: '1. Orchestrator Receives the Problem',
    agent: 'Orchestrator Agent (AGT-01)',
    summary:
      'Like an operations manager, the Orchestrator reads the incoming issue and assigns the right specialist agents to investigate.',
  },
  {
    step: 2,
    title: '2. Specialist Agents Check the Facts',
    agent: 'Order, Payment, Inventory & Logistics Agents',
    summary:
      'Each specialist checks its own department simultaneously: Order checks the purchase, Payment checks billing, Inventory checks stock, and Logistics checks shipping.',
  },
  {
    step: 3,
    title: '3. Policy Agent Checks Company Rules',
    agent: 'Policy Agent (AGT-06)',
    summary:
      'The Policy Agent checks your company refund and replacement limits (for example, whether the cost is under the $250 automatic limit).',
  },
  {
    step: 4,
    title: '4. Decision Agent Picks the Best Solution',
    agent: 'Decision Agent (AGT-08)',
    summary:
      'The Decision Agent compares refund vs. replacement vs. waiting, and chooses the best option—pausing for manager approval only if the cost is high.',
  },
  {
    step: 5,
    title: '5. Execution & Communication Finish the Job',
    agent: 'Execution (AGT-09) & Communication (AGT-10)',
    summary:
      'The Execution Agent processes the replacement or refund, and the Communication Agent sends a clear update to the customer.',
  },
];

// ============================================================================
// MODULE 7: AGENT COMMAND CENTER (/app/agents)
// ============================================================================
export function AgentCommandCenterPage() {
  const { isSimpleMode } = useUX();
  const [agents, setAgents] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [invoking, setInvoking] = useState(false);
  const [diagnosticOutput, setDiagnosticOutput] = useState(null);
  const [activeCoordStep, setActiveCoordStep] = useState(0);
  const [showTechGraph, setShowTechGraph] = useState(false);

  const fetchAgents = async () => {
    const res = await api.get('/agents');
    setAgents(res.data.agents || []);
    setCollaborations(res.data.collaborations || []);
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleInvokeAgent = async (agentId) => {
    setInvoking(true);
    setDiagnosticOutput(null);
    try {
      const res = await api.post(`/agents/${agentId}/invoke`, { orderId: 'ORD-9841' });
      setDiagnosticOutput(res.data.result);
      setSelectedAgent(res.data.agent);
      fetchAgents();
    } catch (err) {
      alert(err.response?.data?.error || 'Agent invocation failed');
    } finally {
      setInvoking(false);
    }
  };

  return (
    <div id="tour-ai-agents" className="space-y-8">
      <PageHeader
        title={isSimpleMode ? 'Meet Your AI Team.' : '7. Agent Command Center — Meet Your AI Team'}
        subtitle="ResolveAI uses specialized AI agents that work together like employees in different departments. Each agent has a specific responsibility."
        badge={<DemoSeededBadge label="10 Specialized AI Agents Working Together" />}
      />

      <ContextualHelpPanel
        title="How do ResolveAI's 10 AI agents work together?"
        steps={[
          'Think of ResolveAI as a 10-person operations team where each AI specialist handles one job—such as checking orders, verifying payments, tracking packages, or checking company rules.',
          'The Orchestrator Agent acts as the team manager, assigning tasks to the right specialists and combining their findings.',
          'Click any agent card below to see its live work, recent findings, or run a test check on an order.',
        ]}
      />

      {/* VISUAL EXPLANATION OF HOW THE ORCHESTRATOR COORDINATES THEM */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1D1D1F]">
                How the Orchestrator Agent Coordinates Your AI Team
              </h2>
              <HelpTooltip
                term="Orchestrator Agent"
                explanation="The main AI coordinator that assigns tasks to other agents and manages the overall workflow."
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click each step below to see how your AI agents pass information from one department
              to the next.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTechGraph(!showTechGraph)}
            className="px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-slate-200/70 border border-slate-200 text-xs font-semibold text-[#0071E3] transition-colors"
          >
            {showTechGraph
              ? 'Show Simple Step-by-Step Diagram'
              : 'View Multi-Tier Agent Architecture'}
          </button>
        </div>

        {/* 5-Step Interactive Coordination Flow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          {COORDINATION_STEPS.map((cs, idx) => (
            <button
              key={cs.step}
              type="button"
              onClick={() => setActiveCoordStep(idx)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                activeCoordStep === idx
                  ? 'bg-blue-50/70 border-[#0071E3] shadow-xs'
                  : 'bg-[#F5F5F7] border-slate-200/70 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-6 h-6 rounded-lg bg-white text-[#0071E3] border border-blue-200 font-mono text-xs font-bold flex items-center justify-center">
                  {cs.step}
                </span>
                {activeCoordStep === idx && (
                  <span className="text-[10px] font-mono uppercase text-[#0071E3] font-bold">
                    Selected
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-[#1D1D1F] leading-snug">{cs.title}</div>
              <div className="text-[11px] text-slate-500 mt-1 truncate">{cs.agent}</div>
            </button>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-[#0071E3] font-bold">
              {COORDINATION_STEPS[activeCoordStep].title} —{' '}
              {COORDINATION_STEPS[activeCoordStep].agent}
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              {COORDINATION_STEPS[activeCoordStep].summary}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveCoordStep((prev) => (prev + 1) % COORDINATION_STEPS.length)}
            className="shrink-0 px-4 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            Next Coordination Step <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Optional Multi-Tier Architecture Graph (Progressive Disclosure or Advanced Mode) */}
        {(!isSimpleMode || showTechGraph) && (
          <div className="mt-5 pt-5 border-t border-slate-200/80">
            <div className="text-xs font-mono uppercase text-slate-500 mb-3">
              Interactive Multi-Tier Department Map (Click any agent to inspect)
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center bg-[#F5F5F7] border border-slate-200/80 rounded-2xl p-4">
              {/* Tier 1: Orchestrator */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase text-[#0071E3] font-bold">
                  1 • Operations Manager
                </div>
                {agents
                  .filter((a) => a.id === 'AGT-01')
                  .map((agt) => (
                    <button
                      key={agt.id}
                      onClick={() => {
                        setSelectedAgent(agt);
                        setDiagnosticOutput(null);
                      }}
                      className="w-full text-left p-3.5 rounded-2xl bg-white border border-[#0071E3] shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#0071E3]">{agt.id}</span>
                        <StatusBadge status={agt.status} />
                      </div>
                      <div className="text-sm font-bold text-[#1D1D1F] mt-1">{agt.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {agt.active_task}
                      </div>
                    </button>
                  ))}
              </div>

              {/* Tier 2: Domain Investigators */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-600 font-bold">
                  2 • Specialist Investigators
                </div>
                {agents
                  .filter((a) => ['AGT-02', 'AGT-03', 'AGT-04', 'AGT-05', 'AGT-07'].includes(a.id))
                  .map((agt) => (
                    <button
                      key={agt.id}
                      onClick={() => {
                        setSelectedAgent(agt);
                        setDiagnosticOutput(null);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-[#0071E3]/50 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#1D1D1F]">
                          <span className="font-mono text-[#0071E3] mr-1">{agt.id}</span>{' '}
                          {agt.name}
                        </span>
                        <StatusBadge status={agt.status} />
                      </div>
                    </button>
                  ))}
              </div>

              {/* Tier 3: Governance & Synthesis */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase text-amber-700 font-bold">
                  3 • Rules & Decision Strategy
                </div>
                {agents
                  .filter((a) => ['AGT-06', 'AGT-08'].includes(a.id))
                  .map((agt) => (
                    <button
                      key={agt.id}
                      onClick={() => {
                        setSelectedAgent(agt);
                        setDiagnosticOutput(null);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-bold text-amber-700">{agt.id}</span>
                        <StatusBadge status={agt.status} />
                      </div>
                      <div className="text-xs font-bold text-[#1D1D1F]">{agt.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{agt.role}</div>
                    </button>
                  ))}
              </div>

              {/* Tier 4: Action & Communication */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase text-emerald-700 font-bold">
                  4 • Action & Customer Updates
                </div>
                {agents
                  .filter((a) => ['AGT-09', 'AGT-10'].includes(a.id))
                  .map((agt) => (
                    <button
                      key={agt.id}
                      onClick={() => {
                        setSelectedAgent(agt);
                        setDiagnosticOutput(null);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-bold text-emerald-700">{agt.id}</span>
                        <StatusBadge status={agt.status} />
                      </div>
                      <div className="text-xs font-bold text-[#1D1D1F]">{agt.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{agt.role}</div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 10 AGENT EDUCATION CARDS GRID (Section 6 exact structure) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agt) => {
          const edu = AGENT_EDUCATION_MAP[agt.id] || {
            displayName: agt.name.toUpperCase(),
            simpleRole: agt.role,
            whatItDoes: agt.description,
            whenUsed: 'During automated business operations.',
            infoNeeded: 'Order and customer records.',
            resultProduced: 'Structured findings and actions.',
          };

          return (
            <div
              key={agt.id}
              onClick={() => {
                setSelectedAgent(agt);
                setDiagnosticOutput(null);
              }}
              className="cursor-pointer bg-white hover:border-[#0071E3]/60 border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between transition-all shadow-[0_2px_14px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0071E3] font-mono text-xs font-bold border border-blue-200">
                      {agt.id}
                    </span>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                      {edu.displayName}
                    </span>
                  </div>
                  <StatusBadge status={agt.status} />
                </div>

                <h3 className="text-lg font-bold text-[#1D1D1F]">{agt.name}</h3>
                <div className="text-sm font-semibold text-[#0071E3] mb-4">
                  &ldquo;{edu.simpleRole}&rdquo;
                </div>

                {/* 4 Clear Educational Sections Required by Section 6 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                  <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/70">
                    <div className="text-[10px] font-mono uppercase text-[#0071E3] font-bold mb-1">
                      What it does
                    </div>
                    <p className="text-slate-700 leading-relaxed">{edu.whatItDoes}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/70">
                    <div className="text-[10px] font-mono uppercase text-slate-600 font-bold mb-1">
                      When it is used
                    </div>
                    <p className="text-slate-700 leading-relaxed">{edu.whenUsed}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/70">
                    <div className="text-[10px] font-mono uppercase text-amber-700 font-bold mb-1">
                      What information it needs
                    </div>
                    <p className="text-slate-700 leading-relaxed">{edu.infoNeeded}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/70">
                    <div className="text-[10px] font-mono uppercase text-emerald-700 font-bold mb-1">
                      What result it produces
                    </div>
                    <p className="text-slate-700 leading-relaxed">{edu.resultProduced}</p>
                  </div>
                </div>

                {/* Live Current Task */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-2">
                  <div className="text-[10px] font-mono uppercase text-slate-400 mb-0.5">
                    Currently Working On
                  </div>
                  <div className="text-xs text-[#1D1D1F] font-medium">{agt.active_task}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Tasks Completed:{' '}
                  <strong className="text-[#1D1D1F] font-mono">{agt.completed_tasks}</strong>
                </span>
                <span className="text-emerald-700 font-mono font-semibold">
                  Success Rate: {agt.success_rate}%
                </span>
                <span className="text-[#0071E3] font-semibold">View Details & Test Agent →</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AGENT DETAIL MODAL */}
      <Modal
        open={Boolean(selectedAgent)}
        onClose={() => setSelectedAgent(null)}
        title={selectedAgent ? `${selectedAgent.name} (${selectedAgent.id})` : ''}
        subtitle={
          selectedAgent
            ? AGENT_EDUCATION_MAP[selectedAgent.id]?.simpleRole || selectedAgent.role
            : ''
        }
        maxWidth="max-w-4xl"
      >
        {selectedAgent && (
          <div className="space-y-5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedAgent.status} />
                <span className="font-mono text-slate-600">
                  Completed Tasks: {selectedAgent.completed_tasks}
                </span>
                <span className="font-mono text-emerald-700 font-semibold">
                  Success Rate: {selectedAgent.success_rate}%
                </span>
              </div>
              <button
                onClick={() => handleInvokeAgent(selectedAgent.id)}
                disabled={invoking}
                className="px-4 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                {invoking
                  ? 'Running Live Agent Check...'
                  : 'Test This Agent on Sample Order (ORD-9841)'}
              </button>
            </div>

            {diagnosticOutput && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="font-mono font-bold text-emerald-800 uppercase">
                  Live Agent Result for Order ORD-9841
                </div>
                <pre className="bg-white p-3 rounded-xl border border-emerald-200 font-mono text-[11px] text-[#1D1D1F] overflow-x-auto">
                  {JSON.stringify(diagnosticOutput, null, 2)}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
                <div className="font-mono uppercase text-[#0071E3] font-bold mb-1">
                  Agent Responsibilities & Instructions
                </div>
                <p className="text-slate-700 leading-relaxed">{selectedAgent.instructions}</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
                <div className="font-mono uppercase text-slate-600 font-bold mb-2">
                  Connected Business Tools Used by This Agent
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedAgent.authorized_tools || []).map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono text-[#1D1D1F]"
                    >
                      {t}()
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
                <div className="font-mono uppercase text-slate-500 font-bold mb-2">
                  Recent Findings
                </div>
                <ul className="space-y-1.5 text-slate-700 list-disc list-inside">
                  {(selectedAgent.recent_findings || []).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
                <div className="font-mono uppercase text-slate-500 font-bold mb-2">
                  Recent Tasks Completed
                </div>
                <div className="space-y-2">
                  {(selectedAgent.task_history || []).map((th, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-[#1D1D1F]">{th.action}</div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {th.taskId} • {th.workflowId}
                        </div>
                      </div>
                      <StatusBadge status={th.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
              <div className="font-mono uppercase text-[#0071E3] font-bold mb-2">
                Messages Shared with Other Agents
              </div>
              <div className="space-y-2">
                {collaborations
                  .filter(
                    (c) =>
                      c.from_agent.includes(selectedAgent.name) ||
                      c.to_agent.includes(selectedAgent.name)
                  )
                  .slice(0, 4)
                  .map((col) => (
                    <div
                      key={col.id}
                      className="p-3 rounded-xl bg-white border border-slate-200/80"
                    >
                      <div className="flex justify-between font-mono text-[11px] text-[#0071E3] font-semibold">
                        <span>
                          {col.from_agent} → {col.to_agent}
                        </span>
                        <span>{col.message_type}</span>
                      </div>
                      <p className="text-slate-700 mt-1">{col.message}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============================================================================
// MODULE 8: AGENT COLLABORATION & NEGOTIATION (/app/collaboration)
// ============================================================================
export function AgentCollaborationPage() {
  const { isSimpleMode } = useUX();
  const [collaborations, setCollaborations] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('ORD-9841');
  const [scenario, setScenario] = useState('Delayed delivery');
  const [running, setRunning] = useState(false);

  const fetchCollaborations = async () => {
    const res = await api.get('/collaborations');
    setCollaborations(res.data.collaborations || []);
  };

  useEffect(() => {
    fetchCollaborations();
  }, []);

  const handleRunNegotiation = async () => {
    setRunning(true);
    try {
      const res = await api.post('/collaborations/negotiate', {
        orderId: selectedOrder,
        scenario,
      });
      setCollaborations(res.data.collaborations || []);
    } catch (err) {
      alert(err.response?.data?.error || 'Negotiation failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'How Your AI Agents Work Together'
            : '8. Agent-to-Agent Collaboration & Negotiation'
        }
        subtitle={
          isSimpleMode
            ? 'See the step-by-step conversation between your AI agents as they share facts, check company rules, and agree on the best solution for an order.'
            : 'Chronological multi-agent deliberation timeline where Logistics, Inventory, Payment, Policy, and Decision agents share structured findings, resolve conflicts, and reach consensus.'
        }
        badge={<DemoSeededBadge label={`${collaborations.length} Recorded Agent Discussions`} />}
      />

      <ContextualHelpPanel
        title="Why do AI agents talk to each other?"
        steps={[
          'A single business problem often involves multiple departments: shipping, warehouse stock, billing, and company rules.',
          'Here you can read the plain-English messages each AI agent sends to the next agent so you always know why a decision was made.',
          'Select an order and problem type below, then click "Start Multi-Agent Discussion" to watch them solve it together.',
        ]}
      />

      {/* Trigger Live Negotiation Bar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
              Select Order to Discuss
            </label>
            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-slate-200 text-xs text-[#1D1D1F] font-mono"
            >
              <option value="ORD-9841">ORD-9841 ($499 • Delayed in Portland)</option>
              <option value="ORD-9842">ORD-9842 ($899 • Lost OLED Monitor)</option>
              <option value="ORD-9843">ORD-9843 ($349 • Orphan Payment)</option>
              <option value="ORD-9847">ORD-9847 ($1,290 • Disrupted NAS)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">
              Problem Scenario
            </label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-slate-200 text-xs text-[#1D1D1F]"
            >
              <option value="Delayed delivery">Delayed delivery</option>
              <option value="Missing order">Missing order</option>
              <option value="Payment deducted but order missing">
                Payment deducted but order missing
              </option>
              <option value="Damaged product">Damaged product</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleRunNegotiation}
          disabled={running}
          className="px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all"
        >
          <GitMerge className="w-4 h-4" />
          {running
            ? 'AI Agents Discussing Solutions...'
            : 'Start Multi-Agent Discussion for This Order'}
        </button>
      </div>

      {/* Chronological Timeline */}
      <div className="space-y-3">
        {collaborations.map((col) => (
          <div
            key={col.id}
            className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0071E3] font-mono text-xs font-bold border border-blue-200">
                  {col.from_agent} → {col.to_agent}
                </span>
                <span className="text-xs font-mono text-slate-500">{col.stage}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={col.message_type} />
                <span className="text-xs font-mono text-emerald-700 font-semibold">
                  Confidence: {(Number(col.confidence || 0.95) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <p className="text-sm text-[#1D1D1F] leading-relaxed mb-3">&ldquo;{col.message}&rdquo;</p>
            <details className="text-xs">
              <summary className="cursor-pointer font-mono text-[#0071E3] font-semibold hover:underline">
                {isSimpleMode
                  ? `Show Supporting Details Checked by Agent (${col.workflow_id})`
                  : `View Structured JSON Evidence Payload (${col.workflow_id})`}
              </summary>
              <pre className="mt-2 p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 font-mono text-[11px] text-[#1D1D1F] overflow-x-auto">
                {JSON.stringify(col.structured_data, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MODULE 9: AUTONOMOUS WORKFLOWS & SELF-HEALING (/app/workflows)
// ============================================================================
export function AutonomousWorkflowsPage() {
  const { isSimpleMode } = useUX();
  const [workflows, setWorkflows] = useState([]);
  const [selectedWf, setSelectedWf] = useState(null);
  const [healing, setHealing] = useState(false);

  const fetchWorkflows = async () => {
    const res = await api.get('/workflows');
    const list = res.data.workflows || [];
    setWorkflows(list);
    if (!selectedWf && list.length > 0) {
      setSelectedWf(list[0]);
    } else if (selectedWf) {
      const updated = list.find((w) => w.id === selectedWf.id);
      if (updated) setSelectedWf(updated);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleSelfHealTest = async (workflowId, faultType) => {
    setHealing(true);
    try {
      const res = await api.post(`/workflows/${workflowId}/self-heal`, { faultType });
      setSelectedWf(res.data.workflow);
      fetchWorkflows();
    } catch (err) {
      alert(err.response?.data?.error || 'Self-healing simulation failed');
    } finally {
      setHealing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Automated Tasks & Step-by-Step Progress'
            : '9. Autonomous Workflows & Self-Healing Engine'
        }
        subtitle={
          isSimpleMode
            ? 'Track every automated business task from start to finish. If an external shipping or payment system briefly times out, ResolveAI automatically retries without charging or refunding twice.'
            : 'Inspect every stage of our 12-stage autonomous resolution workflows, verify cryptographic idempotency keys, and test fault-tolerant self-healing recovery.'
        }
        badge={<DemoSeededBadge label={`${workflows.length} Active & Completed Tasks`} />}
      />

      <ContextualHelpPanel
        title="How do Automated Tasks stay reliable?"
        steps={[
          'Each automated task goes through 12 checkpoints—from receiving the problem to verifying that the customer was helped.',
          'Every task has a unique safety lock (Idempotency Key) so a customer is never refunded twice even if a network error causes a retry.',
          'Click "Test Automatic Error Recovery" on any workflow to see how ResolveAI safely recovers from a simulated carrier timeout.',
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Workflows List */}
        <div className="lg:col-span-4 space-y-3">
          {workflows.map((wf) => (
            <button
              key={wf.id}
              onClick={() => setSelectedWf(wf)}
              className={`w-full text-left p-4 rounded-3xl border transition-all ${
                selectedWf?.id === wf.id
                  ? 'bg-white border-[#0071E3] shadow-sm'
                  : 'bg-white border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-[#0071E3]">{wf.id}</span>
                <StatusBadge status={wf.status} />
              </div>
              <div className="text-sm font-bold text-[#1D1D1F] mb-1">{wf.title}</div>
              {!isSimpleMode && (
                <div className="text-[11px] font-mono text-slate-500 mb-2">
                  Idempotency: <span className="text-slate-700">{wf.idempotency_key}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-mono text-slate-500">
                <span>
                  Step {wf.current_stage} of {wf.total_stages}
                </span>
                <span className="text-emerald-700 font-semibold">
                  Auto-Retries: {wf.retry_count}/{wf.max_retries}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Selected Workflow 12-Stage Pipeline & Self-Healing Logs */}
        <div className="lg:col-span-8 space-y-6">
          {selectedWf && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-200/80">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-bold text-[#1D1D1F]">{selectedWf.title}</span>
                    <StatusBadge status={selectedWf.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#0071E3] mt-1">
                    <span>Duplicate-Protection Lock: {selectedWf.idempotency_key}</span>
                    <HelpTooltip
                      term="Duplicate-Protection Lock (Idempotency Key)"
                      explanation="A unique safety code that guarantees ResolveAI will never issue a duplicate refund or duplicate shipment if a step is retried."
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSelfHealTest(selectedWf.id, 'CARRIER_API_TIMEOUT')}
                    disabled={healing}
                    className="px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0071E3] border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    {healing ? 'Recovering Automatically...' : 'Test Automatic Error Recovery'}
                  </button>
                </div>
              </div>

              {/* Self-Healing Failure & Recovery History */}
              {(selectedWf.failure_logs?.length > 0 ||
                selectedWf.recovery_history?.length > 0) && (
                <div className="mb-6 p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 space-y-2">
                  <div className="text-xs font-mono uppercase text-[#0071E3] font-bold">
                    Automatic Error Recovery History
                  </div>
                  {selectedWf.failure_logs.map((fl, i) => (
                    <div key={i} className="text-xs text-amber-800">
                      <strong>[Temporary Issue Detected — Step {fl.stage}]:</strong> {fl.errorCode}{' '}
                      — {fl.detail}
                    </div>
                  ))}
                  {selectedWf.recovery_history.map((rh, i) => (
                    <div key={i} className="text-xs text-emerald-700">
                      <strong>[Automatically Recovered]:</strong> {rh.action} (No duplicate action
                      taken: {String(rh.idempotencyVerified)})
                    </div>
                  ))}
                </div>
              )}

              {/* 12 Stages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(selectedWf.stages || []).map((stg) => (
                  <div
                    key={stg.step}
                    className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-xl bg-white text-[#0071E3] border border-slate-200 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {stg.step}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#1D1D1F] truncate">
                          {stg.name}
                        </span>
                        <StatusBadge status={stg.status} />
                      </div>
                      <div className="text-[11px] font-mono text-[#0071E3] mt-0.5">{stg.agent}</div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{stg.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE 10: PREDICTIVE INTELLIGENCE (/app/predictions)
// ============================================================================
export function PredictiveIntelligencePage() {
  const { isSimpleMode } = useUX();
  const [predictions, setPredictions] = useState([]);
  const [scanSummary, setScanSummary] = useState('');
  const [scanning, setScanning] = useState(false);

  const fetchPredictions = async () => {
    const res = await api.get('/predictions');
    setPredictions(res.data.predictions || []);
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = await api.post('/predictions/scan');
      setScanSummary(res.data.summary);
      setPredictions(res.data.predictions || []);
    } finally {
      setScanning(false);
    }
  };

  const handleMitigate = async (id) => {
    await api.patch(`/predictions/${id}/mitigate`, { status: 'Prevented' });
    fetchPredictions();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSimpleMode
            ? 'Early Problem Detection (Predictive Intelligence)'
            : '10. Predictive Intelligence & Risk Detection'
        }
        subtitle="ResolveAI analyzes business information to identify potential problems before they become serious—such as shipping delays, low warehouse stock, or payment issues."
        badge={<DemoSeededBadge label="Early Warning System Active" />}
        actions={
          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all"
          >
            <Radar className="w-4 h-4" />
            {scanning ? 'Scanning Business Data...' : 'Scan Business Data for Early Risks'}
          </button>
        }
      />

      <ContextualHelpPanel
        title="What is Early Problem Detection (Predictive Intelligence)?"
        steps={[
          'Instead of waiting for customers to complain, the Prediction Agent continuously checks delivery routes, warehouse stock, and payment records.',
          'Each alert below explains what risk was spotted, which orders or products are affected, and what preventive step you can take right now.',
          'Click "Apply Recommended Preventive Action" to fix the issue before customers experience a delay.',
        ]}
      />

      {scanSummary && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-[#0071E3]">
          <strong>Prediction Agent (AGT-07) Live Scan Summary:</strong> {scanSummary}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {predictions.map((pred) => (
          <div
            key={pred.id}
            className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between shadow-[0_2px_14px_rgba(0,0,0,0.03)]"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0071E3]">{pred.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F5F5F7] border border-slate-200 text-xs text-slate-600">
                    {pred.risk_category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={pred.severity} />
                  <StatusBadge status={pred.status} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-[#1D1D1F] mb-2">{pred.title}</h3>

              {/* Risk Score Gauge */}
              <div className="mb-4 p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/80">
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-slate-500 flex items-center gap-1">
                    {isSimpleMode
                      ? 'Estimated Urgency Level'
                      : 'Heuristic Risk Severity Score (Non-Calibrated Index)'}
                    <HelpTooltip
                      term="Urgency Score"
                      explanation="A 0 to 100 urgency rating based on how many orders or items could be affected if no action is taken."
                    />
                  </span>
                  <span className="font-bold text-rose-600">{pred.risk_score} / 100</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pred.risk_score}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-mono uppercase text-slate-500">Why this was flagged: </span>
                  <span className="text-slate-700">{pred.supporting_evidence}</span>
                </div>
                {!isSimpleMode && (
                  <div>
                    <span className="font-mono uppercase text-slate-500">Detection Method: </span>
                    <span className="text-[#0071E3] font-mono">{pred.detection_method}</span>
                  </div>
                )}
                <div>
                  <span className="font-mono uppercase text-slate-500">
                    Affected Orders / Products:{' '}
                  </span>
                  <span className="font-mono font-semibold text-[#1D1D1F]">
                    {(pred.affected_records || []).join(', ')}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 mt-2">
                  <div className="font-mono uppercase font-bold text-emerald-800 mb-0.5">
                    Recommended Preventive Action
                  </div>
                  <div className="text-slate-700">{pred.recommended_action}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200/80 flex justify-end">
              {pred.status !== 'Prevented' ? (
                <button
                  onClick={() => handleMitigate(pred.id)}
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                >
                  Apply Recommended Preventive Action
                </button>
              ) : (
                <span className="text-xs font-mono font-semibold text-emerald-700">
                  ✓ Preventive Action Applied
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}