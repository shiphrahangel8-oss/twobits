import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  MessageSquareWarning,
  CheckCircle2,
  Cpu,
  Truck,
  ShieldAlert,
  Zap,
  Clock,
  RefreshCw,
  ArrowRight,
  Flame,
  Boxes,
  Compass,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useUX } from '../context/UXContext';
import {
  KpiCard,
  StatusBadge,
  DemoSeededBadge,
  PageHeader,
  HelpTooltip,
  ContextualHelpPanel,
} from '../components/ui/DesignSystem';

const KPI_META = {
  'total-orders': {
    simpleTitle: 'Total Orders',
    help: 'The total number of customer orders currently tracked across your warehouses.',
    icon: ShoppingBag,
  },
  'active-complaints': {
    simpleTitle: 'Open Complaints',
    help: 'Customer issues that are currently being investigated by your AI agents or waiting for manager sign-off.',
    icon: MessageSquareWarning,
  },
  'resolved-complaints': {
    simpleTitle: 'Resolved Complaints',
    help: 'Customer complaints that have been completely investigated, fixed, and verified.',
    icon: CheckCircle2,
  },
  'at-risk-shipments': {
    simpleTitle: 'Deliveries at Risk',
    help: 'Shipments experiencing weather delays, hub bottlenecks, or missing tracking scans.',
    icon: Truck,
  },
  'active-agents': {
    simpleTitle: 'AI Agents Working',
    help: 'Your 10 digital specialists that check orders, payments, stock, and deliveries automatically.',
    icon: Cpu,
  },
  'pending-approvals': {
    simpleTitle: 'Actions Requiring Approval',
    help: 'Refunds or replacements over $250 that wait for a manager to approve them before the AI finishes the task.',
    icon: ShieldAlert,
  },
  'automation-success-rate': {
    simpleTitle: 'Automated Fix Rate',
    help: 'Percentage of routine customer issues solved end-to-end without needing manual work.',
    icon: Zap,
  },
  'avg-resolution-time': {
    simpleTitle: 'Average Resolution Speed',
    help: 'How quickly an issue goes from customer report to verified solution.',
    icon: Clock,
  },
};

const FRIENDLY_AGENT_ROLES = {
  'AGT-01': 'Coordinates all other AI agents and manages the overall workflow.',
  'AGT-02': 'Checks order details, purchased items, and order status.',
  'AGT-03': 'Verifies payment transactions and refund eligibility.',
  'AGT-04': 'Checks product availability across warehouses.',
  'AGT-05': 'Monitors shipment progress and delivery delays.',
  'AGT-06': 'Ensures decisions follow company policies.',
  'AGT-07': 'Detects potential business problems before customers complain.',
  'AGT-08': 'Compares possible solutions and selects the best option.',
  'AGT-09': 'Carries out approved refunds, replacements, and order updates.',
  'AGT-10': 'Writes clear updates for customers and internal teams.',
};

// ============================================================================
// MODULE 1: SELF-EXPLANATORY OPERATIONS DASHBOARD (/app/dashboard)
// ============================================================================
export function OperationsDashboardPage() {
  const { user } = useAuth();
  const { isSimpleMode, startTour } = useUX();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-3xl bg-white animate-pulse border border-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-3xl bg-white animate-pulse border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const priorityOrder = [
    'total-orders',
    'active-complaints',
    'resolved-complaints',
    'at-risk-shipments',
    'active-agents',
    'pending-approvals',
    'automation-success-rate',
    'avg-resolution-time',
  ];

  const sortedKpis = priorityOrder
    .map((id) => data.kpiCards.find((c) => c.id === id))
    .filter(Boolean);

  const visibleKpis = isSimpleMode && !showAllMetrics ? sortedKpis.slice(0, 6) : sortedKpis;

  const openComplaintsCount =
    data.kpiCards.find((c) => c.id === 'active-complaints')?.metric || 0;
  const atRiskShipmentsCount =
    data.kpiCards.find((c) => c.id === 'at-risk-shipments')?.metric || 0;
  const pendingApprovalsCount = data.pendingApprovals?.length || 0;
  const lowStockCount = data.operationalRisks?.inventoryShortages?.length || 0;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <PageHeader
        title={`Welcome back, ${user?.name || 'Operations Leader'}.`}
        subtitle="Here is your business at a glance—see what needs your attention today, how your AI team is helping, and recent customer updates."
        badge={<DemoSeededBadge label="Sample Business Data Active" />}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={startTour}
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-[#0071E3] text-xs font-semibold border border-slate-200/90 shadow-xs flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" /> Start 1-Minute Guided Tour
            </button>
            <button
              type="button"
              onClick={fetchDashboard}
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 border border-slate-200/90 shadow-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </button>
            <Link
              to="/app/complaints"
              className="px-5 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-xs font-semibold text-white shadow-xs flex items-center gap-1.5"
            >
              Submit a Complaint <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {/* CONTEXTUAL HELP BANNER */}
      <ContextualHelpPanel
        title="How to use your Dashboard"
        summary="Understand what is happening in your business in 30 seconds."
        steps={[
          {
            label: '1. Check What Needs Your Attention',
            text: 'Start with the four priority cards below. Click any card to review open complaints, delayed packages, or actions waiting for your approval.',
          },
          {
            label: '2. Monitor Your AI Team',
            text: 'Your 10 AI agents automatically investigate routine issues under $250 and update you in the live timeline.',
          },
          {
            label: '3. Switch Modes Anytime',
            text: 'Use Simple Mode for everyday work, or switch to Advanced Mode in the top bar for technical logs and charts.',
          },
        ]}
      />

      {/* SECTION 1: WHAT NEEDS YOUR ATTENTION? */}
      <section
        id="tour-dashboard-attention"
        className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.03)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0071E3]">
              Priority Action Center
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] mt-0.5">
              What Needs Your Attention?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Click any card below to go directly to the items that need a decision or review right now.
            </p>
          </div>
          {data.activeCrisis && (
            <Link
              to="/app/crisis"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
            >
              <Flame className="w-4 h-4 text-rose-600" />
              Active Business Emergency: 300 Orders Delayed →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Complaints */}
          <Link
            to="/app/complaints"
            className="p-5 rounded-2xl bg-[#F5F5F7] hover:bg-blue-50/40 border border-slate-200/80 hover:border-[#0071E3]/40 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  {openComplaintsCount} Open
                </span>
                <MessageSquareWarning className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F] mb-1">
                Complaints Needing Review
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Follow the 8-step guided investigation or submit a new customer complaint.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/70 text-xs font-semibold text-[#0071E3] flex items-center justify-between">
              <span>Investigate Complaints</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Deliveries */}
          <Link
            to="/app/logistics"
            className="p-5 rounded-2xl bg-[#F5F5F7] hover:bg-blue-50/40 border border-slate-200/80 hover:border-[#0071E3]/40 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  {atRiskShipmentsCount} Delayed
                </span>
                <Truck className="w-4 h-4 text-rose-600" />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F] mb-1">Deliveries at Risk</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Packages delayed by weather or carrier bottlenecks that can be re-routed.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/70 text-xs font-semibold text-[#0071E3] flex items-center justify-between">
              <span>Check Deliveries</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Approvals */}
          <Link
            to="/app/approvals"
            className="p-5 rounded-2xl bg-[#F5F5F7] hover:bg-blue-50/40 border border-slate-200/80 hover:border-[#0071E3]/40 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  {pendingApprovalsCount} Waiting
                </span>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F] mb-1">
                Actions Waiting for Your Approval
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                High-value replacements or refunds above your $250 automatic limit.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/70 text-xs font-semibold text-[#0071E3] flex items-center justify-between">
              <span>Review & Approve</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Inventory */}
          <Link
            to="/app/inventory"
            className="p-5 rounded-2xl bg-[#F5F5F7] hover:bg-blue-50/40 border border-slate-200/80 hover:border-[#0071E3]/40 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0071E3] border border-blue-200">
                  {lowStockCount} Low Stock
                </span>
                <Boxes className="w-4 h-4 text-[#0071E3]" />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F] mb-1">Low Inventory Items</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Products running low in Seattle or Newark that can be restocked with one click.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/70 text-xs font-semibold text-[#0071E3] flex items-center justify-between">
              <span>Check Warehouse Stock</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION 2: CORE BUSINESS HEALTH CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1D1D1F]">Business Health Summary</h2>
            <p className="text-xs text-slate-500">
              Click the <span className="font-mono text-[#0071E3]">?</span> icon next to any metric
              for a plain-English explanation.
            </p>
          </div>
          {isSimpleMode && (
            <button
              type="button"
              onClick={() => setShowAllMetrics(!showAllMetrics)}
              className="text-xs font-semibold text-[#0071E3] hover:underline"
            >
              {showAllMetrics ? 'Show Essential 6 Metrics' : 'Show All 8 Metrics'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleKpis.map((card) => {
            const meta = KPI_META[card.id] || {};
            return (
              <KpiCard
                key={card.id}
                title={isSimpleMode ? meta.simpleTitle || card.title : card.title}
                displayMetric={card.displayMetric}
                description={card.description}
                helpText={meta.help}
                trend={card.trend}
                trendDirection={card.trendDirection}
                comparisonPeriod={card.comparisonPeriod}
                icon={meta.icon}
              />
            );
          })}
        </div>
      </section>

      {/* SECTION 3: YOUR AI TEAM + WHAT IS HAPPENING IN YOUR BUSINESS? */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* YOUR AI TEAM */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0071E3]">
                Meet Your Digital Helpers
              </span>
              <h2 className="text-xl font-bold text-[#1D1D1F] mt-0.5">Your AI Team</h2>
              <p className="text-xs text-slate-500">
                Each AI agent handles a specific department so you don&apos;t have to check systems
                manually.
              </p>
            </div>
            <Link
              to="/app/agents"
              className="px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-slate-200/70 text-xs font-semibold text-[#0071E3] border border-slate-200/80"
            >
              Explore All 10 AI Agents →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {data.agentWorkforce.slice(0, isSimpleMode ? 6 : 10).map((agt) => (
              <Link
                to="/app/agents"
                key={agt.id}
                className="p-4 rounded-2xl bg-[#F5F5F7] hover:bg-blue-50/40 border border-slate-200/80 hover:border-[#0071E3]/40 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-[#1D1D1F]">{agt.name}</span>
                  <StatusBadge status={agt.status} />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  {FRIENDLY_AGENT_ROLES[agt.id] || agt.role}
                </p>
                <div className="text-[11px] text-[#0071E3] font-medium truncate">
                  Current task: {agt.active_task}
                </div>
              </Link>
            ))}
          </div>

          {isSimpleMode && (
            <div className="mt-5 text-center">
              <Link to="/app/agents" className="text-xs font-semibold text-[#0071E3] hover:underline">
                View all 10 AI team members and how they work together →
              </Link>
            </div>
          )}
        </div>

        {/* WHAT IS HAPPENING IN YOUR BUSINESS? */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0071E3]">
                  Live Business Timeline
                </span>
                <h2 className="text-xl font-bold text-[#1D1D1F] mt-0.5">
                  What Is Happening in Your Business?
                </h2>
                <p className="text-xs text-slate-500">
                  Recent investigations, completed fixes, and manager approvals.
                </p>
              </div>
              <Link
                to="/app/audit-logs"
                className="text-xs font-semibold text-[#0071E3] hover:underline shrink-0"
              >
                Full History →
              </Link>
            </div>

            <div className="space-y-3">
              {data.recentActivities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#1D1D1F]">{act.actor_name}</span>
                    <StatusBadge status={act.status} />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{act.details}</p>
                  {!isSimpleMode && (
                    <div className="mt-1.5 text-[10px] font-mono text-slate-400">
                      {act.action} • Target: {act.target_id}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need to review a decision waiting on you?</span>
            <Link to="/app/approvals" className="font-semibold text-amber-700 hover:underline">
              Open Pending Approvals ({pendingApprovalsCount}) →
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 4: 7-DAY TREND & RECENT AI DECISIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#1D1D1F]">
                7-Day Order & Complaint Resolution Trend
              </h2>
              <p className="text-xs text-slate-500">
                Compare daily orders against customer complaints and automated fixes
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0071E3]" /> Orders
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Complaints
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Solved by AI
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3 items-end h-48 pt-4 px-2 border-b border-slate-200">
            {data.performanceTrend.map((pt) => {
              const orderH = Math.min(100, Math.round((pt.orders / 300) * 100));
              const compH = Math.min(100, Math.round((pt.complaints / 35) * 100));
              const resH = Math.min(100, Math.round((pt.autonomousResolutions / 35) * 100));
              return (
                <div key={pt.day} className="flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-36">
                    <div
                      style={{ height: `${orderH}%` }}
                      title={`Orders: ${pt.orders}`}
                      className="w-3 sm:w-4 bg-[#0071E3] rounded-t-md"
                    />
                    <div
                      style={{ height: `${compH}%` }}
                      title={`Complaints: ${pt.complaints}`}
                      className="w-3 sm:w-4 bg-amber-500 rounded-t-md"
                    />
                    <div
                      style={{ height: `${resH}%` }}
                      title={`Solved by AI: ${pt.autonomousResolutions}`}
                      className="w-3 sm:w-4 bg-emerald-500 rounded-t-md"
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{pt.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1D1D1F]">
                Recent AI Solutions & Explanations
              </h2>
              <p className="text-xs text-slate-500">
                Why the AI chose each solution for recent customer complaints
              </p>
            </div>
            <Link to="/app/complaints" className="text-xs font-semibold text-[#0071E3] hover:underline">
              All Cases →
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentDecisions.map((dec) => (
              <div
                key={dec.complaintId}
                className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0071E3]">
                    {dec.complaintId} • Order {dec.orderId} ({dec.category})
                  </span>
                  <StatusBadge status={dec.status} />
                </div>
                <div className="text-xs font-bold text-[#1D1D1F]">
                  Chosen Solution: {dec.decision}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{dec.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODULE 2: BUSINESS PERFORMANCE / EXECUTIVE BI (/app/bi)
// ============================================================================
export function BusinessIntelligencePage() {
  const { isSimpleMode } = useUX();
  const [analytics, setAnalytics] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/analytics'), api.get('/dashboard')])
      .then(([aRes, dRes]) => {
        setAnalytics(aRes.data);
        setDashboard(dRes.data);
      })
      .catch(() => {});
  }, []);

  if (!analytics || !dashboard) {
    return <div className="h-64 rounded-3xl bg-white animate-pulse border border-slate-200" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSimpleMode ? 'Business Performance Overview' : '2. Executive Business Intelligence'}
        subtitle={
          isSimpleMode
            ? 'See how much time and money your AI team has saved, how each warehouse is performing, and which types of customer issues happen most often.'
            : 'Real-time financial exposure, cross-warehouse fulfillment health, and autonomous ROI intelligence.'
        }
        badge={<DemoSeededBadge label="Live Business Performance" />}
      />

      <ContextualHelpPanel
        title="What does Business Performance show?"
        summary="This page summarizes your overall savings, customer satisfaction, and warehouse shipping health in one place."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center">
            Money Saved by Automation
            <HelpTooltip
              term="Money Saved by Automation"
              explanation="Estimated savings from resolving complaints automatically and avoiding unnecessary full-item returns."
            />
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            ${Number(analytics.summaryMetrics.totalCostSavedUsd).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Saved across verified resolution playbooks
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center">
            Order Value Protected
            <HelpTooltip
              term="Order Value Protected"
              explanation="Total dollar value of delayed or disrupted customer orders currently being recovered by ResolveAI."
            />
          </div>
          <div className="text-3xl font-bold text-[#0071E3]">
            ${Number(analytics.summaryMetrics.gmvProtectedDuringCrisisUsd).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            300-order Pacific Northwest delay recovery
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center">
            Issues Solved Without Waiting
            <HelpTooltip
              term="Issues Solved Without Waiting"
              explanation="Percentage of routine customer issues under $250 that your AI agents resolve automatically."
            />
          </div>
          <div className="text-3xl font-bold text-[#1D1D1F]">
            {analytics.summaryMetrics.autonomousContainmentPercent}%
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Eligible issues under $250 policy limit
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="text-xs text-slate-500 font-semibold uppercase mb-1">
            Customer Satisfaction Score
          </div>
          <div className="text-3xl font-bold text-[#0071E3]">
            {analytics.summaryMetrics.csatScore} / 5.0
          </div>
          <div className="text-xs text-slate-500 mt-2">
            +1.4 points higher than manual support
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaint Distribution by Category */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <h2 className="text-lg font-bold text-[#1D1D1F] mb-1">
            Most Common Customer Complaint Types
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Breakdown of why customers reach out and how many are solved automatically
          </p>
          <div className="space-y-4">
            {analytics.categoryDistribution.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-[#1D1D1F]">{cat.category}</span>
                  <span className="text-slate-500">
                    {cat.count} cases ({cat.autoResolvedPercent}% solved automatically)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cat.autoResolvedPercent}%` }}
                    className="h-full bg-[#0071E3] rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrier SLA Reliability */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <h2 className="text-lg font-bold text-[#1D1D1F] mb-1">
            Shipping Carrier On-Time Performance
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Track which delivery partners are delivering on time and which routes have delays
          </p>
          <div className="space-y-3">
            {analytics.carrierPerformance.map((cp) => (
              <div
                key={cp.carrier}
                className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-[#1D1D1F]">{cp.carrier}</div>
                  <div className="text-xs text-slate-500">
                    Average Delay: {cp.avgDelayHours}h • Disrupted Packages: {cp.disruptedCount}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-bold ${
                      cp.onTimePercent > 90 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {cp.onTimePercent}%
                  </div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">On-Time</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}