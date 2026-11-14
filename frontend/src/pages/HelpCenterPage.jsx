import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Compass,
  Sparkles,
  ArrowRight,
  Cpu,
  MessageSquareWarning,
  ShieldCheck,
  Flame,
  BarChart3,
  Settings,
  Workflow,
  LayoutDashboard,
} from 'lucide-react';
import { useUX } from '../context/UXContext';
import { PageHeader, DemoSeededBadge } from '../components/ui/DesignSystem';

const HELP_GUIDES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    category: 'Foundations',
    route: '/app/dashboard',
    routeLabel: 'Go to Dashboard',
    icon: Sparkles,
    whatItDoes:
      'Introduces you to ResolveAI—an intelligent business operations platform where 10 specialized AI agents help you monitor orders, fix delivery or billing problems, and resolve customer complaints.',
    whyUseful:
      'Instead of checking separate order, payment, warehouse, and shipping systems manually, ResolveAI brings everything into one self-explanatory workspace.',
    howToUse:
      'Start in Simple Mode (the toggle at the top of the screen), review the "What Needs Your Attention?" cards on the Dashboard, or click "Restart Interactive Product Tour" above for a 6-step guided walkthrough.',
    practicalExample:
      'A new support team member logs in for the first time, opens the Welcome Screen, and clicks "Start Tour" to learn how complaints, AI agents, and manager approvals work in under 2 minutes.',
    whatHappensAfter:
      'You can confidently navigate between Customer Operations, AI Workforce, and Management pages knowing which actions are automatic and which require your approval.',
  },
  {
    id: 'understanding-dashboard',
    title: 'Understanding Your Dashboard',
    category: 'Business Overview',
    route: '/app/dashboard',
    routeLabel: 'Open Dashboard',
    icon: LayoutDashboard,
    whatItDoes:
      'Displays a live summary of your business health, including "What Needs Your Attention?", 6 core business metrics, your active AI team, and a live timeline of recent actions.',
    whyUseful:
      'Lets you understand within 30 seconds what is happening in your business, which customer issues are being handled by AI, and which items need your decision.',
    howToUse:
      'Check the 4 attention cards at the top of the Dashboard first. Click any card (such as "Complaints Needing Review" or "Actions Waiting for Your Approval") to jump straight to that task.',
    practicalExample:
      'You open the Dashboard in the morning and see "2 Actions Waiting for Your Approval." Clicking that card takes you directly to the approval queue.',
    whatHappensAfter:
      'As complaints are resolved or approvals are signed off, your Dashboard numbers and live activity timeline update automatically.',
  },
  {
    id: 'understanding-ai-agents',
    title: 'Understanding AI Agents',
    category: 'AI Workforce',
    route: '/app/agents',
    routeLabel: 'Meet Your AI Team',
    icon: Cpu,
    whatItDoes:
      'Explains each of your 10 specialized AI agents—including the Orchestrator, Order, Payment, Inventory, Logistics, Policy, Prediction, Decision, Execution, and Communication agents.',
    whyUseful:
      'Shows you exactly how your AI workforce divides up work like departments in a company so you never have to guess what the AI is doing.',
    howToUse:
      'Open "Your AI Agents" in the sidebar, click through the 5-step coordination diagram at the top, or click any agent card to inspect its recent findings and run a test check on sample order ORD-9841.',
    practicalExample:
      'You click on the "Logistics Agent" card to see what it does ("Your delivery tracker"), what information it checks (tracking numbers and carrier hubs), and test it on Order ORD-9841.',
    whatHappensAfter:
      'When you run a test diagnostic on an agent, it returns a live, structured report for that order and updates the agent activity log.',
  },
  {
    id: 'managing-customer-complaints',
    title: 'Managing Customer Complaints',
    category: 'Customer Operations',
    route: '/app/complaints',
    routeLabel: 'Open Complaints',
    icon: MessageSquareWarning,
    whatItDoes:
      'Provides a guided 8-step complaint resolution workflow that takes a customer issue from initial submission all the way to verified resolution.',
    whyUseful:
      'Automates repetitive investigation across orders, payments, warehouse stock, and shipping carriers while keeping you informed at every step.',
    howToUse:
      'Go to "Complaints", select a complaint from the list to view its 8 guided steps, or click "Submit a Complaint" (try clicking one of the quick-fill sample scenarios).',
    practicalExample:
      'A customer reports that Order ORD-9841 is delayed in Portland. You submit the complaint, and Steps 1–8 show the Order, Payment, Inventory, Logistics, Policy, Decision, Execution, and Communication agents resolving it.',
    whatHappensAfter:
      'If the solution costs $250 or less, the AI completes all 8 steps and marks the complaint Resolved. If it costs more than $250, it pauses at Step 6 and waits for manager approval.',
  },
  {
    id: 'understanding-automated-workflows',
    title: 'Understanding Automated Workflows',
    category: 'AI Workforce',
    route: '/app/workflows',
    routeLabel: 'Open Automated Tasks',
    icon: Workflow,
    whatItDoes:
      'Tracks every multi-step automated task running in ResolveAI and includes built-in error recovery (Self-Healing) and duplicate-action protection (Idempotency Keys).',
    whyUseful:
      'Ensures that even if a shipping carrier or payment system briefly times out, ResolveAI automatically retries the step without ever refunding or shipping an order twice.',
    howToUse:
      'Open "Automated Tasks", select any workflow on the left to see its 12 checkpoints, or click "Test Automatic Error Recovery" to see how it recovers from a simulated carrier timeout.',
    practicalExample:
      'During a replacement shipment, the carrier tracking system times out. The workflow logs the temporary error, verifies the Duplicate-Protection Lock, and switches to backup air shipping automatically.',
    whatHappensAfter:
      'The recovery event is displayed in the workflow log and recorded permanently in Activity History.',
  },
  {
    id: 'managing-approvals',
    title: 'Managing Approvals',
    category: 'Management',
    route: '/app/approvals',
    routeLabel: 'Open Pending Approvals',
    icon: ShieldCheck,
    whatItDoes:
      'Lists all high-cost or sensitive AI decisions that exceed your automatic policy limit ($250) and require a human manager to approve or reject them.',
    whyUseful:
      'Gives you complete financial control: routine low-cost cases are handled automatically, while expensive replacements or emergency budgets always require your sign-off.',
    howToUse:
      'Open "Pending Approvals", read the two summary boxes ("Why This Action Requires Your Approval" and "What Happens After You Approve"), add an optional note, and click "Approve & Start the Approved Action".',
    practicalExample:
      'Order ORD-9842 involves an $899 OLED monitor lost in transit. Because $899 is above the $250 automatic limit, you review the facts and click Approve.',
    whatHappensAfter:
      'As soon as you confirm approval, the Execution Agent dispatches the replacement monitor from the backup warehouse, the Communication Agent notifies the customer, and the complaint status changes to Resolved.',
  },
  {
    id: 'using-crisis-management',
    title: 'Using Crisis Management',
    category: 'Business Intelligence',
    route: '/app/crisis',
    routeLabel: 'Open Business Emergency Center',
    icon: Flame,
    whatItDoes:
      'Coordinates a 7-agent emergency taskforce when a large-scale disruption (such as a severe storm or warehouse outage) affects hundreds of customer orders at once.',
    whyUseful:
      'Instead of handling 300 delayed orders one by one, ResolveAI groups affected customers by urgency, compares recovery plans, and executes recovery in waves.',
    howToUse:
      'Open "Business Emergency Center", review the affected order counts and the 3 recovery options, and use the action buttons at the top to "Start Next Recovery Wave (+16%)", "Pause Recovery Workflow", or "Continue the Investigation".',
    practicalExample:
      'A Pacific Northwest storm delays 300 orders ($148,500 total value). You click "Start Next Recovery Wave (+16%)" to re-route the next batch of urgent orders from the Dallas backup warehouse.',
    whatHappensAfter:
      'The recovery progress bar increases, the emergency timeline logs the wave completion, and affected customers receive proactive shipping updates.',
  },
  {
    id: 'understanding-business-analytics',
    title: 'Understanding Business Analytics',
    category: 'Business Overview & Reports',
    route: '/app/analytics',
    routeLabel: 'Open Reports',
    icon: BarChart3,
    whatItDoes:
      'Shows your monthly cost savings compared to manual operations, delivery carrier reliability, complaint categories, and individual AI agent speed and accuracy.',
    whyUseful:
      'Helps business owners and managers measure the financial return and customer satisfaction improvements delivered by ResolveAI.',
    howToUse:
      'Visit "Business Performance" for complaint and carrier breakdowns, or "Reports" under Management for the 6-month cost savings chart and AI agent performance table.',
    practicalExample:
      'You check the 6-Month Cost Comparison chart in Reports to see how much money autonomous complaint resolution saved in March compared to manual support triage.',
    whatHappensAfter:
      'Use these insights to adjust your Business Rules or proactively restock high-demand warehouse items.',
  },
  {
    id: 'managing-settings',
    title: 'Managing Settings',
    category: 'Management',
    route: '/app/settings',
    routeLabel: 'Open Settings',
    icon: Settings,
    whatItDoes:
      'Lets you update your operator profile, switch between Simple Mode and Advanced Mode, restart the interactive product tour, or reset the sample business data.',
    whyUseful:
      'Allows you to customize how much technical detail you see and safely reset the demo environment whenever you want to practice or demonstrate the platform again.',
    howToUse:
      'Open "Settings", choose between Simple Mode and Advanced Mode, update your name or department, or click "Reset Sample Data" at the bottom right.',
    practicalExample:
      'After testing several complaint submissions and approvals, you click "Reset Sample Data" to restore all orders, complaints, and approvals back to their clean starting state.',
    whatHappensAfter:
      'Your preferences are saved immediately, and if you reset sample data, all 20 modules refresh to their original baseline.',
  },
];

const PLAIN_LANGUAGE_GLOSSARY = [
  {
    term: 'Orchestrator Agent',
    meaning:
      'The main AI coordinator that assigns tasks to other agents and manages the overall workflow.',
  },
  {
    term: 'Predictive Intelligence (Early Problem Detection)',
    meaning:
      'ResolveAI analyzes business information to identify potential problems before they become serious.',
  },
  {
    term: 'Business Digital Twin (Business Simulation)',
    meaning:
      'A virtual model of your business operations used to explore how problems affect orders, inventory, deliveries, and complaints without changing real records.',
  },
  {
    term: 'Organizational Memory (Previous Case History)',
    meaning:
      'ResolveAI remembers previous problems and successful solutions so similar issues can be handled faster in the future.',
  },
  {
    term: 'Human-in-the-Loop Approval',
    meaning:
      'Some important or expensive actions (above $250) require manager approval before the AI completes them.',
  },
  {
    term: 'Decision Simulator (Compare Solutions)',
    meaning:
      'A safe calculator to compare possible solutions (Refund vs. Replacement vs. Waiting) before taking action.',
  },
];

export function HelpCenterPage() {
  const { startTour, openWelcomeModal, openWelcomeScreen, interfaceMode, setInterfaceMode } =
    useUX();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuideId, setSelectedGuideId] = useState(HELP_GUIDES[0].id);

  const handleOpenWelcome = () => {
    if (openWelcomeModal) openWelcomeModal();
    else if (openWelcomeScreen) openWelcomeScreen();
  };

  const filteredGuides = HELP_GUIDES.filter((g) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      g.title.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      g.whatItDoes.toLowerCase().includes(q) ||
      g.howToUse.toLowerCase().includes(q) ||
      g.practicalExample.toLowerCase().includes(q)
    );
  });

  const activeGuide =
    filteredGuides.find((g) => g.id === selectedGuideId) ||
    filteredGuides[0] ||
    HELP_GUIDES[0];

  return (
    <div id="tour-help-center" className="space-y-8">
      <PageHeader
        title="Help & Learning Center"
        subtitle="Plain-language guides, practical examples, and interactive tours so anyone can understand and use ResolveAI without external assistance."
        badge={<DemoSeededBadge label="9 Step-by-Step Guides Available" />}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={startTour}
              className="px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center gap-2 shadow-xs"
            >
              <Compass className="w-4 h-4" /> Restart Interactive Product Tour
            </button>
            <button
              type="button"
              onClick={handleOpenWelcome}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#1D1D1F] border border-slate-200/90 text-xs font-semibold flex items-center gap-2 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-[#0071E3]" /> Open Welcome Screen
            </button>
          </div>
        }
      />

      {/* SEARCH BAR & QUICK MODE SWITCHER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help topics (e.g., 'complaints', 'agents', 'approvals', 'crisis', 'dashboard')..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-[#F5F5F7] border border-slate-200/80 text-xs text-[#1D1D1F] focus:bg-white focus:outline-none focus:border-[#0071E3]"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Current View:</span>
          <button
            type="button"
            onClick={() => setInterfaceMode(interfaceMode === 'simple' ? 'advanced' : 'simple')}
            className="px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-slate-200/70 border border-slate-200 text-[#1D1D1F] font-semibold"
          >
            {interfaceMode === 'simple'
              ? 'Simple Mode (Click to switch to Advanced)'
              : 'Advanced Mode (Click to switch to Simple)'}
          </button>
        </div>
      </div>

      {/* 9 GUIDES DIRECTORY + ACTIVE GUIDE READER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 9 Guide Topics List */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2">
            Help Topics ({filteredGuides.length})
          </div>
          {filteredGuides.map((guide) => {
            const IconComp = guide.icon;
            const isSelected = activeGuide?.id === guide.id;
            return (
              <button
                key={guide.id}
                type="button"
                onClick={() => setSelectedGuideId(guide.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'bg-white border-[#0071E3] shadow-[0_6px_20px_rgba(0,113,227,0.08)]'
                    : 'bg-white/80 border-slate-200/80 hover:bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-[#0071E3] text-white'
                      : 'bg-[#F5F5F7] text-[#0071E3] border border-slate-200/70'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase text-[#0071E3]">
                    {guide.category}
                  </div>
                  <div className="text-sm font-bold text-[#1D1D1F] mt-0.5">{guide.title}</div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {guide.whatItDoes}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Detailed 5-Part Guide View */}
        <div className="lg:col-span-8">
          {activeGuide && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.03)] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <span className="text-xs font-semibold uppercase text-[#0071E3]">
                    {activeGuide.category} Guide
                  </span>
                  <h2 className="text-2xl font-bold text-[#1D1D1F] mt-1">{activeGuide.title}</h2>
                </div>
                <Link
                  to={activeGuide.route}
                  className="px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center gap-2 shadow-xs"
                >
                  {activeGuide.routeLabel} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* The 5 Required Sections for Every Help Guide */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/70">
                  <div className="text-xs font-bold uppercase text-[#0071E3] mb-1">
                    1. What This Feature Does
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeGuide.whatItDoes}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/70">
                  <div className="text-xs font-bold uppercase text-[#0071E3] mb-1">
                    2. Why It Is Useful
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeGuide.whyUseful}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/70">
                  <div className="text-xs font-bold uppercase text-emerald-700 mb-1">
                    3. How to Use It
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{activeGuide.howToUse}</p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
                  <div className="text-xs font-bold uppercase text-[#0071E3] mb-1">
                    4. Practical Example
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeGuide.practicalExample}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                  <div className="text-xs font-bold uppercase text-emerald-700 mb-1">
                    5. What Happens After Using It
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeGuide.whatHappensAfter}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PLAIN-LANGUAGE GLOSSARY OF PLATFORM TERMS */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-[#1D1D1F]">
            Plain-Language Dictionary of ResolveAI Terms
          </h3>
          <p className="text-xs text-slate-500">
            Quick explanations of technical terms you may see in Advanced Mode or next to{' '}
            <span className="font-mono text-[#0071E3]">?</span> help icons.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLAIN_LANGUAGE_GLOSSARY.map((item) => (
            <div
              key={item.term}
              className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 space-y-1.5"
            >
              <div className="text-xs font-bold text-[#0071E3]">{item.term}</div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.meaning}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
