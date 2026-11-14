import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  Bot,
  LayoutDashboard,
  BarChart3,
  MessageSquareWarning,
  ShoppingBag,
  Boxes,
  Truck,
  Cpu,
  GitMerge,
  Workflow,
  Radar,
  Flame,
  Sliders,
  Network,
  BrainCircuit,
  ShieldAlert,
  LineChart,
  ScrollText,
  PlugZap,
  Scale,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUX } from '../../context/UXContext';
import { api } from '../../services/api';
import { WelcomeOnboardingModal, GuidedTourOverlay } from '../ui/DesignSystem';

export function AppLayout() {
  const { user, logout, login } = useAuth();
  const { isSimpleMode, setInterfaceMode, openWelcomeScreen, openWelcomeModal, startTour } = useUX();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api
      .get('/health')
      .then((res) => setHealth(res.data))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const handleQuickRoleSwitch = async (roleEmail, rolePassword, isCustomer = false) => {
    try {
      await login(roleEmail, rolePassword);
      if (isCustomer) navigate('/portal');
    } catch {
      // ignore
    }
  };

  const handleOpenWelcome = () => {
    if (openWelcomeModal) openWelcomeModal();
    else if (openWelcomeScreen) openWelcomeScreen();
  };

  const navGroups = [
    {
      title: 'BUSINESS OVERVIEW',
      items: [
        {
          to: '/app/dashboard',
          label: 'Dashboard',
          advancedLabel: 'Operations Dashboard',
          subtitle: 'Daily overview & what needs your attention',
          icon: LayoutDashboard,
        },
        {
          to: '/app/bi',
          label: 'Business Performance',
          advancedLabel: 'Business Intelligence (BI)',
          subtitle: 'Order trends, fulfillment health & savings',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'CUSTOMER OPERATIONS',
      items: [
        {
          to: '/app/complaints',
          label: 'Complaints',
          advancedLabel: 'Complaint Management',
          subtitle: 'Submit & track customer issues step-by-step',
          icon: MessageSquareWarning,
        },
        {
          to: '/app/orders',
          label: 'Orders',
          advancedLabel: 'Order & Ledger Management',
          subtitle: 'Check customer orders & payment status',
          icon: ShoppingBag,
        },
        {
          to: '/app/inventory',
          label: 'Inventory',
          advancedLabel: 'Multi-Warehouse Inventory',
          subtitle: 'Check warehouse stock & restock items',
          icon: Boxes,
        },
        {
          to: '/app/logistics',
          label: 'Deliveries',
          advancedLabel: 'Carrier Logistics Telemetry',
          subtitle: 'Track shipments & re-route delayed packages',
          icon: Truck,
        },
      ],
    },
    {
      title: 'AI WORKFORCE',
      items: [
        {
          to: '/app/agents',
          label: 'Your AI Agents',
          advancedLabel: 'Agent Command Center',
          subtitle: 'Meet & monitor your 10 specialized AI helpers',
          icon: Cpu,
        },
        {
          to: '/app/collaboration',
          label: 'Agent Collaboration',
          advancedLabel: 'Multi-Agent Negotiation',
          subtitle: 'See how agents share facts & agree on solutions',
          icon: GitMerge,
        },
        {
          to: '/app/workflows',
          label: 'Automated Tasks',
          advancedLabel: 'Autonomous Workflows & Self-Healing',
          subtitle: 'Follow step-by-step automated progress',
          icon: Workflow,
        },
        {
          to: '/app/predictions',
          label: 'Early Problem Detection',
          advancedLabel: 'Predictive Intelligence',
          subtitle: 'Spot delivery delays or low stock early',
          icon: Radar,
        },
      ],
    },
    {
      title: 'BUSINESS INTELLIGENCE',
      items: [
        {
          to: '/app/crisis',
          label: isSimpleMode ? 'Business Emergency Center' : 'Crisis Management',
          advancedLabel: 'Autonomous Business Crisis Mode',
          subtitle: 'Manage the 300-order regional delivery delay',
          icon: Flame,
          badge: '300 Orders',
        },
        {
          to: '/app/simulator',
          label: isSimpleMode ? 'Compare Solutions' : 'Decision Simulator',
          advancedLabel: 'What-If Decision Simulator',
          subtitle: 'Compare refund vs. replacement costs safely',
          icon: Sliders,
        },
        {
          to: '/app/digital-twin',
          label: 'Business Simulation',
          advancedLabel: 'Business Digital Twin',
          subtitle: 'Explore "what-if" scenarios without changing live data',
          icon: Network,
        },
        {
          to: '/app/memory',
          label: 'Previous Case History',
          advancedLabel: 'Organizational Memory',
          subtitle: 'See past solutions that worked well',
          icon: BrainCircuit,
        },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        {
          to: '/app/approvals',
          label: isSimpleMode ? 'Pending Approvals' : 'Human Approval Center',
          advancedLabel: 'Human Approval Center',
          subtitle: 'Approve refunds or replacements over $250',
          icon: ShieldAlert,
        },
        {
          to: '/app/analytics',
          label: 'Reports',
          advancedLabel: 'Platform Analytics',
          subtitle: 'Monthly cost savings & team efficiency',
          icon: LineChart,
        },
        {
          to: '/app/audit-logs',
          label: 'Activity History',
          advancedLabel: 'Immutable Audit Logs',
          subtitle: 'Complete record of every decision & action',
          icon: ScrollText,
        },
        {
          to: '/app/integrations',
          label: 'Integrations',
          advancedLabel: 'System Integrations',
          subtitle: 'Connected payment, shipping & AI services',
          icon: PlugZap,
        },
        {
          to: '/app/policies',
          label: 'Business Rules',
          advancedLabel: 'Governance & Business Policies',
          subtitle: 'Set approval limits & refund eligibility rules',
          icon: Scale,
        },
        {
          to: '/app/settings',
          label: 'Settings',
          advancedLabel: 'User & System Settings',
          subtitle: 'Manage your profile & reset sample data',
          icon: Settings,
        },
      ],
    },
    {
      title: 'HELP & LEARNING',
      items: [
        {
          to: '/app/help',
          label: 'Help & Support',
          advancedLabel: 'Help & Learning Center',
          subtitle: 'Plain-English guides, examples & product tour',
          icon: HelpCircle,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex">
      <WelcomeOnboardingModal />
      <GuidedTourOverlay />

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* APPLE-INSPIRED LIGHT SIDEBAR */}
      <aside
        id="tour-sidebar-nav"
        className={`fixed lg:static inset-y-0 left-0 z-50 w-76 bg-[#FAFAFC] border-r border-slate-200/90 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#1D1D1F] flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-[#1D1D1F] tracking-tight leading-none">
                ResolveAI
              </div>
              <div className="text-[11px] font-medium text-[#0071E3] mt-0.5">
                {isSimpleMode ? 'Guided Workspace' : 'Advanced Workspace'}
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const displayLabel = isSimpleMode ? item.label : item.advancedLabel;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `block px-3 py-2.5 rounded-2xl transition-all ${
                          isActive
                            ? 'bg-white text-[#0071E3] border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                            : 'text-slate-600 hover:text-[#1D1D1F] hover:bg-slate-200/50'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2.5 truncate">
                              <Icon
                                className={`w-4 h-4 shrink-0 ${
                                  isActive ? 'text-[#0071E3]' : 'text-slate-500'
                                }`}
                              />
                              <span
                                className={`text-xs font-semibold truncate ${
                                  isActive ? 'text-[#1D1D1F]' : ''
                                }`}
                              >
                                {displayLabel}
                              </span>
                            </span>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 pl-6.5 mt-0.5 truncate leading-snug">
                            {item.subtitle}
                          </p>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Link to Customer Portal */}
          <div className="pt-3 border-t border-slate-200/80">
            <Link
              to="/portal"
              className="flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#1D1D1F] border border-slate-200/90 shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition-all"
            >
              <div>
                <div className="text-[#0071E3]">Customer Self-Service Portal</div>
                <div className="text-[11px] font-normal text-slate-500">
                  Preview customer order tracking
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </Link>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-white">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="truncate">
              <div className="text-xs font-bold text-[#1D1D1F] truncate">{user?.name}</div>
              <div className="text-[11px] font-medium text-slate-500 truncate">
                Role: {user?.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] font-medium text-slate-400 mb-1.5">
            Switch Role for Testing:
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px] font-semibold">
            <button
              onClick={() => handleQuickRoleSwitch('admin@resolveai.io', 'ResolveAdmin123!')}
              className={`py-1.5 rounded-lg border text-center transition-colors ${
                user?.role === 'ADMINISTRATOR'
                  ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Switch to Administrator"
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickRoleSwitch('manager@resolveai.io', 'ResolveManager123!')}
              className={`py-1.5 rounded-lg border text-center transition-colors ${
                user?.role === 'BUSINESS_MANAGER'
                  ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Switch to Business Manager"
            >
              Mgr
            </button>
            <button
              onClick={() => handleQuickRoleSwitch('support@resolveai.io', 'ResolveSupport123!')}
              className={`py-1.5 rounded-lg border text-center transition-colors ${
                user?.role === 'SUPPORT_EMPLOYEE'
                  ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Switch to Support Employee"
            >
              Supp
            </button>
            <button
              onClick={() =>
                handleQuickRoleSwitch('customer@resolveai.io', 'ResolveCustomer123!', true)
              }
              className="py-1.5 rounded-lg border bg-slate-50 border-slate-200 text-slate-600 hover:text-[#0071E3] hover:bg-blue-50 text-center transition-colors"
              title="Switch to Customer Portal"
            >
              Cust
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Frosted Glass Apple Top Bar */}
        <header className="min-h-16 py-2.5 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* APPLE SEGMENTED CONTROL: SIMPLE MODE VS ADVANCED MODE */}
            <div
              id="tour-mode-switcher"
              className="inline-flex items-center p-1 rounded-full bg-[#F5F5F7] border border-slate-200/90"
              role="group"
              aria-label="Interface Mode Switcher"
            >
              <button
                type="button"
                onClick={() => setInterfaceMode('simple')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isSimpleMode
                    ? 'bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
                    : 'text-slate-500 hover:text-[#1D1D1F]'
                }`}
              >
                Simple Mode
              </button>
              <button
                type="button"
                onClick={() => setInterfaceMode('advanced')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  !isSimpleMode
                    ? 'bg-white text-[#1D1D1F] shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
                    : 'text-slate-500 hover:text-[#1D1D1F]'
                }`}
              >
                Advanced Mode
              </button>
            </div>

            <span className="hidden xl:inline-block text-xs text-slate-500">
              {isSimpleMode
                ? 'Plain-English explanations & essential tasks first'
                : 'Showing full technical logs, schemas & deep metrics'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startTour}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#F5F5F7] hover:bg-slate-200/70 text-[#1D1D1F] border border-slate-200/80 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-[#0071E3]" />
              Guided Tour
            </button>

            <button
              type="button"
              onClick={handleOpenWelcome}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#F5F5F7] hover:bg-slate-200/70 text-[#1D1D1F] border border-slate-200/80 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
              Welcome Guide
            </button>

            <Link
              to="/app/help"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#F5F5F7] hover:bg-slate-200/70 text-[#1D1D1F] border border-slate-200/80 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
              Help & Guides
            </Link>

            <Link
              to="/app/approvals"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100/80 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              {isSimpleMode ? 'Needs Approval' : 'Human Approvals'}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-[1480px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}