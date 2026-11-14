import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  Cpu,
  ShieldCheck,
  Zap,
  GitBranch,
  Activity,
  Layers,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Package,
  Truck,
  CreditCard,
  MessageSquare,
  Sparkles,
  Play,
  Menu,
  X,
  Compass,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TEN_AGENTS = [
  {
    id: 'AGT-01',
    name: 'Orchestrator Agent',
    simpleRole: 'Your operations manager.',
    role: 'Central Coordinator & Workflow Planner',
    icon: Cpu,
    desc: 'Receives incoming customer or business problems, assigns the right specialist agents, and tracks every step to completion.',
  },
  {
    id: 'AGT-02',
    name: 'Order Agent',
    simpleRole: 'Your order investigator.',
    role: 'Order Records & Purchase Verifier',
    icon: Package,
    desc: 'Checks order details, purchased items, customer ownership, and current order status.',
  },
  {
    id: 'AGT-03',
    name: 'Payment Agent',
    simpleRole: 'Your payment specialist.',
    role: 'Billing & Refund Auditor',
    icon: CreditCard,
    desc: 'Verifies payment transactions, detects duplicate or unlinked charges, and checks refund eligibility.',
  },
  {
    id: 'AGT-04',
    name: 'Inventory Agent',
    simpleRole: 'Your warehouse coordinator.',
    role: 'Multi-Warehouse Stock Optimizer',
    icon: Layers,
    desc: 'Checks real-time product availability across Seattle, Dallas, and Newark warehouses and reserves replacement items.',
  },
  {
    id: 'AGT-05',
    name: 'Logistics Agent',
    simpleRole: 'Your delivery tracker.',
    role: 'Shipping & Carrier Delay Analyst',
    icon: Truck,
    desc: 'Monitors FedEx, UPS, and DHL tracking updates, spots regional delays, and recommends faster shipping routes.',
  },
  {
    id: 'AGT-06',
    name: 'Policy Agent',
    simpleRole: 'Your rule checker.',
    role: 'Company Rules & Approval Guardrail',
    icon: ShieldCheck,
    desc: 'Checks your company refund and replacement rules and ensures actions over $250 wait for a manager’s approval.',
  },
  {
    id: 'AGT-07',
    name: 'Prediction Agent',
    simpleRole: 'Your early warning system.',
    role: 'Early Problem Detection Specialist',
    icon: Activity,
    desc: 'Continuously scans orders, warehouse stock, and delivery routes to spot potential problems before customers complain.',
  },
  {
    id: 'AGT-08',
    name: 'Decision Agent',
    simpleRole: 'Your problem-solving strategist.',
    role: 'Solution Comparison Specialist',
    icon: GitBranch,
    desc: 'Compares possible solutions (Refund vs. Replacement vs. Waiting) and selects the best option for the customer and your business.',
  },
  {
    id: 'AGT-09',
    name: 'Execution Agent',
    simpleRole: 'Your action specialist.',
    role: 'Approved Action Executor',
    icon: Zap,
    desc: 'Carries out approved refunds, replacement shipments, and order updates safely without duplicate actions.',
  },
  {
    id: 'AGT-10',
    name: 'Communication Agent',
    simpleRole: 'Your customer messaging specialist.',
    role: 'Customer & Team Update Writer',
    icon: MessageSquare,
    desc: 'Writes clear, friendly status updates for customers and logs a plain-English summary for your team.',
  },
];

export function LandingPage({ initialSection }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedAgent, setSelectedAgent] = useState(TEN_AGENTS[0]);
  const [activeStage, setActiveStage] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % 4);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const target = initialSection || location.hash?.replace('#', '');
    if (target) {
      const el = document.getElementById(target);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [initialSection, location]);

  const scrollToId = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${id}`);
    }
  };

  const fourSimpleSteps = [
    {
      step: '01',
      name: 'Spot the Problem',
      summary: 'A customer submits a complaint—or ResolveAI spots a shipping delay or low stock early.',
      detail: 'Order #ORD-9841 is delayed 28 hours at the Portland shipping hub.',
    },
    {
      step: '02',
      name: 'AI Specialists Check the Facts',
      summary: 'Your Order, Payment, Inventory, and Logistics agents check every record in seconds.',
      detail: 'Order & payment verified. Replacement item available in Dallas warehouse.',
    },
    {
      step: '03',
      name: 'Check Rules & Pick the Best Solution',
      summary: 'The Policy and Decision agents verify company rules and pause for manager approval if over $250.',
      detail: 'Express replacement + $25 courtesy credit complies with company policy.',
    },
    {
      step: '04',
      name: 'Fix the Issue & Update the Customer',
      summary: 'The Execution Agent dispatches the solution and the Communication Agent notifies the customer.',
      detail: 'Replacement shipped via Express Air and tracking number sent to customer.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] selection:bg-[#0071E3]/15">
      {/* APPLE FROSTED GLASS NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#1D1D1F] flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1D1D1F]">ResolveAI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600">
            <button onClick={() => scrollToId('platform')} className="hover:text-[#1D1D1F] transition-colors">
              Overview
            </button>
            <button onClick={() => scrollToId('how-it-works')} className="hover:text-[#1D1D1F] transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollToId('ai-agents')} className="hover:text-[#1D1D1F] transition-colors">
              Meet Your AI Team
            </button>
            <button onClick={() => scrollToId('features')} className="hover:text-[#1D1D1F] transition-colors">
              Capabilities
            </button>
            <button onClick={() => scrollToId('security')} className="hover:text-[#1D1D1F] transition-colors">
              Governance & Security
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                to={user.role === 'CUSTOMER' ? '/portal' : '/app/dashboard'}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-[#0071E3] hover:bg-[#0077ED] text-white transition-all flex items-center gap-1.5 shadow-xs"
              >
                Open Workspace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-700 hover:text-[#1D1D1F] hover:bg-slate-200/50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signin"
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-[#0071E3] hover:bg-[#0077ED] text-white transition-all shadow-xs"
                >
                  Open ResolveAI
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
              <button onClick={() => scrollToId('platform')} className="text-left py-1.5">Overview</button>
              <button onClick={() => scrollToId('how-it-works')} className="text-left py-1.5">How It Works</button>
              <button onClick={() => scrollToId('ai-agents')} className="text-left py-1.5">Meet Your AI Team</button>
              <button onClick={() => scrollToId('features')} className="text-left py-1.5">Capabilities</button>
              <button onClick={() => scrollToId('security')} className="text-left py-1.5">Security</button>
            </div>
            <div className="pt-2 border-t border-slate-100 flex gap-3">
              <Link to="/signin" className="flex-1 text-center py-2.5 rounded-full bg-slate-100 text-xs font-semibold text-[#1D1D1F]">
                Sign In
              </Link>
              <Link to="/get-started" className="flex-1 text-center py-2.5 rounded-full bg-[#0071E3] text-white text-xs font-semibold">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* APPLE-STYLE MINIMALIST HERO SECTION */}
      <section id="platform" className="pt-16 pb-20 lg:pt-24 lg:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] text-xs font-semibold text-[#0071E3] mb-7">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Your Business. Your AI Workforce. Always in Sync.</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-bold text-[#1D1D1F] tracking-tight leading-[1.06] mb-6">
            Business operations,{' '}
            <span className="text-[#0071E3]">effortlessly in sync.</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10 font-normal">
            ResolveAI brings your orders, payments, warehouse stock, deliveries, and customer support into one self-explanatory workspace—powered by 10 specialized AI assistants and guided by your rules.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link
              to={user ? '/app/dashboard' : '/signin'}
              className="px-7 py-3.5 rounded-full text-sm font-semibold bg-[#0071E3] hover:bg-[#0077ED] text-white transition-all shadow-[0_8px_20px_rgba(0,113,227,0.25)] flex items-center gap-2"
            >
              Open ResolveAI Workspace <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => scrollToId('how-it-works')}
              className="px-7 py-3.5 rounded-full text-sm font-semibold bg-white hover:bg-slate-50 text-[#1D1D1F] border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-[#0071E3]" /> See How It Works
            </button>
          </div>
        </div>

        {/* CLEAN APPLE PRODUCT PREVIEW SHOWCASE CARD */}
        <div className="max-w-6xl mx-auto bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0071E3]">
                Self-Explanatory Operations Preview
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] mt-0.5">
                How Your AI Team Resolves a Customer Issue in 4 Simple Steps
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Simple Mode & Advanced Mode Included
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {fourSimpleSteps.map((item, idx) => {
              const isCurrent = activeStage === idx;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className={`text-left p-5 rounded-3xl border transition-all ${
                    isCurrent
                      ? 'bg-[#F5F5F7] border-[#0071E3] shadow-[0_4px_16px_rgba(0,113,227,0.08)]'
                      : 'bg-white border-slate-200/80 hover:bg-[#FAFAFC]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`w-8 h-8 rounded-2xl text-xs font-bold flex items-center justify-center ${
                        isCurrent
                          ? 'bg-[#0071E3] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.step}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-semibold text-[#0071E3]">Active Step</span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[#1D1D1F] mb-1.5">{item.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{item.summary}</p>
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200/70 text-[11px] text-slate-700 font-medium">
                    {item.detail}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY RESOLVEAI — CLEAN BENTO GRID */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200/70 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0071E3]">
              Designed for Clarity
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] tracking-tight mt-2 mb-4">
              Understand your entire business in 30 seconds.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              No complicated jargon or disconnected spreadsheets. ResolveAI organizes your daily work into five clear areas anyone on your team can use immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                badge: '1. Business Overview',
                title: 'See What Needs Your Attention First',
                desc: 'Open your Dashboard to see open complaints, deliveries at risk, low warehouse stock, and decisions waiting for your approval.',
              },
              {
                badge: '2. Guided Complaint Resolution',
                title: 'Follow Every Case in 8 Clear Steps',
                desc: 'Submit a customer issue and watch your AI specialists check the order, payment, warehouse stock, and shipping route step by step.',
              },
              {
                badge: '3. Human-in-the-Loop Control',
                title: 'You Approve High-Value Decisions',
                desc: 'Routine fixes under $250 happen automatically. Anything over $250 pauses and waits for a manager’s one-click sign-off.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-[#F5F5F7] border border-slate-200/80 rounded-3xl p-7 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#0071E3] border border-slate-200/80 mb-4">
                    {card.badge}
                  </span>
                  <h3 className="text-xl font-bold text-[#1D1D1F] mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/70 flex items-center justify-between text-xs font-semibold text-[#1D1D1F]">
                  <span>Built into Simple & Advanced Mode</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEET YOUR 10 AI SPECIALISTS */}
      <section id="ai-agents" className="py-20 bg-[#F5F5F7] px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0071E3]">
              10 Specialized Digital Assistants
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] tracking-tight mt-2 mb-4">
              Meet Your AI Team.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              ResolveAI uses specialized AI agents that work together like employees in different departments. Click any specialist below to see its role.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {TEN_AGENTS.map((agt) => {
                const Icon = agt.icon;
                const active = selectedAgent.id === agt.id;
                return (
                  <button
                    key={agt.id}
                    onClick={() => setSelectedAgent(agt)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      active
                        ? 'bg-white border-[#0071E3] shadow-[0_8px_24px_rgba(0,113,227,0.10)]'
                        : 'bg-white/80 border-slate-200/80 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        {agt.id}
                      </span>
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <Icon className="w-4 h-4 text-[#0071E3]" />
                      <span className="font-bold text-[#1D1D1F] text-sm">{agt.name}</span>
                    </div>
                    <p className="text-xs text-[#0071E3] font-medium">"{agt.simpleRole}"</p>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-7 shadow-[0_12px_36px_rgba(0,0,0,0.05)] sticky top-24">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-semibold text-[#0071E3]">
                    {selectedAgent.id} • {selectedAgent.simpleRole}
                  </span>
                  <h3 className="text-2xl font-bold text-[#1D1D1F] mt-0.5">
                    {selectedAgent.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedAgent.role}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0071E3]">
                  <selectedAgent.icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">{selectedAgent.desc}</p>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/70">
                  <div className="font-semibold text-[#1D1D1F] mb-0.5">
                    Always Verified Against Real Records
                  </div>
                  <div className="text-slate-600">
                    Checks your actual orders, payments, inventory, and shipping records before making any recommendation.
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-slate-200/70">
                  <div className="font-semibold text-[#1D1D1F] mb-0.5">
                    Follows Your Business Rules
                  </div>
                  <div className="text-slate-600">
                    Respects your $250 automatic limit and logs every step in Activity History.
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  to="/signin"
                  className="w-full py-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  Explore {selectedAgent.name} in Workspace <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENTERPRISE CAPABILITIES */}
      <section id="features" className="py-20 bg-white border-t border-slate-200/70 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0071E3]">
              Complete Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] tracking-tight mt-2 mb-4">
              Simple for beginners. Powerful for managers.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Business Emergency Center',
                badge: 'Crisis Management',
                desc: 'When a storm or outage delays 300 orders at once, 7 AI agents group affected customers by urgency and coordinate recovery waves.',
              },
              {
                title: 'Early Problem Detection',
                badge: 'Predictive Intelligence',
                desc: 'Spots shipping bottlenecks, low warehouse stock, and payment mismatches early so you can prevent problems before customers complain.',
              },
              {
                title: 'Compare Solutions Safely',
                badge: 'Decision Simulator',
                desc: 'Compare the cost and customer loyalty impact of a Full Refund vs. Express Replacement vs. Waiting before taking action.',
              },
              {
                title: 'Business Simulation',
                badge: 'Business Digital Twin',
                desc: 'Test "what-if" scenarios—like a warehouse outage or complaint surge—in a safe virtual model without changing live records.',
              },
              {
                title: 'Previous Case History',
                badge: 'Organizational Memory',
                desc: 'Remembers past problems and proven solutions so your AI team can resolve similar issues faster in the future.',
              },
              {
                title: 'Built-In Help & Guided Tour',
                badge: 'Self-Explanatory UX',
                desc: 'Includes an interactive 6-step product tour, plain-English tooltips, and a searchable Help Center with 9 practical guides.',
              },
            ].map((feat, i) => (
              <div
                key={i}
                className="bg-[#F5F5F7] border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full bg-white text-[#0071E3] border border-slate-200/80 mb-3">
                    {feat.badge}
                  </span>
                  <h3 className="text-lg font-bold text-[#1D1D1F] mb-2">{feat.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
                  <span>Included in Workspace</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY & GOVERNANCE */}
      <section id="security" className="py-20 bg-[#F5F5F7] border-t border-slate-200/70 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0071E3]">
              Trust & Governance
            </span>
            <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight mt-2 mb-4">
              You stay in control of every critical decision.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              ResolveAI combines intelligent automation with clear human oversight. Switching between Simple Mode and Advanced Mode never changes user permissions or bypasses security rules.
            </p>
            <div className="space-y-3 text-sm text-slate-700">
              {[
                'Role-based access for Administrators, Business Managers, Support Staff, and Customers.',
                'Automatic safety locks (Idempotency Keys) guarantee a customer is never refunded twice.',
                'All secret API keys (Supabase & Google Gemini) remain strictly on the backend server.',
                'Every AI action and manager approval is recorded in Activity History.',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="documentation" className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-[#1D1D1F]">Ready Out of the Box</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Demo & Live Modes
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore immediately with realistic sample business data, or connect your own Supabase PostgreSQL and Google Gemini credentials in <code className="text-[#0071E3] font-mono">backend/.env</code>.
            </p>
            <pre className="bg-[#F5F5F7] border border-slate-200/80 rounded-2xl p-4 text-xs font-mono text-slate-700 overflow-x-auto">
{`# backend/.env (Server-Side Only)
PORT=5000
JWT_SECRET=your_enterprise_jwt_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key`}
            </pre>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-white border-t border-slate-200/80 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold text-[#1D1D1F] tracking-tight mb-4">
            Experience ResolveAI today.
          </h2>
          <p className="text-slate-600 text-base mb-8">
            Sign in with one click using our pre-configured Administrator, Business Manager, Support Employee, or Customer accounts.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/signin"
              className="px-8 py-4 rounded-full font-semibold text-sm text-white bg-[#0071E3] hover:bg-[#0077ED] shadow-[0_8px_20px_rgba(0,113,227,0.25)] flex items-center gap-2"
            >
              Sign In to ResolveAI <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/get-started"
              className="px-8 py-4 rounded-full font-semibold text-sm text-[#1D1D1F] bg-[#F5F5F7] hover:bg-slate-200/70 border border-slate-200/90"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#F5F5F7] border-t border-slate-200/80 py-10 text-xs text-slate-500 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#1D1D1F] flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[#1D1D1F]">ResolveAI</span>
            <span>— Your Business. Your AI Workforce. Always in Sync.</span>
          </div>
          <span>React • Express • Supabase PostgreSQL • Google Gemini</span>
        </div>
      </footer>
    </div>
  );
}