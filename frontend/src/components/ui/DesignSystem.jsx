import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  ShieldCheck,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Compass,
  LayoutDashboard,
  Cpu,
  Workflow,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUX } from '../../context/UXContext';

export function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  let classes = 'bg-slate-100 text-slate-700 border-slate-200';

  if (
    [
      'resolved',
      'completed',
      'delivered',
      'in stock',
      'captured',
      'connected',
      'approved',
      'prevented',
      'success',
      'recovered',
    ].includes(s)
  ) {
    classes = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (
    [
      'investigating',
      'collaborating',
      'planning',
      'executing',
      'running',
      'in transit',
      'confirmed',
      'processing',
      'active',
      'mitigating',
    ].includes(s)
  ) {
    classes = 'bg-blue-50 text-[#0071E3] border-blue-200';
  } else if (
    [
      'awaiting approval',
      'awaiting information',
      'pending',
      'delayed',
      'low stock',
      'degraded',
      'paused',
      'medium',
      'high',
    ].includes(s)
  ) {
    classes = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (
    [
      'failed',
      'escalated',
      'missing',
      'lost',
      'disrupted',
      'critical',
      'catastrophic',
      'critical shortage',
      'out of stock',
      'rejected',
      'deducted_order_missing',
      'duplicate_charge',
    ].includes(s)
  ) {
    classes = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['idle', 'submitted', 'low'].includes(s)) {
    classes = 'bg-slate-100 text-slate-600 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function DemoSeededBadge({ label = 'Sample Business Data Active' }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50/90 text-[#0071E3] border border-blue-200/80">
      <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
      {label}
    </span>
  );
}

/**
 * Contextual Help Tooltip (?) next to complicated terms
 */
export function HelpTooltip({ term, explanation }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center align-middle ml-1.5">
      <button
        type="button"
        aria-label={`What does ${term || 'this term'} mean?`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-[#0071E3] border border-slate-300/80 inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
      >
        <HelpCircle className="w-3 h-3" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-[0_12px_32px_rgba(0,0,0,0.12)] text-left z-50 pointer-events-none"
        >
          {term && <span className="block text-xs font-semibold text-[#1D1D1F] mb-1">{term}</span>}
          <span className="block text-xs text-slate-600 font-normal leading-relaxed normal-case">
            {explanation}
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * Expandable Contextual Help Panel at top of modules
 */
export function ContextualHelpPanel({ title, summary, steps = [], consequenceNote }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 mb-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0071E3] shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-semibold text-[#1D1D1F]">{title}</span>
            {summary && (
              <span className="text-xs sm:text-sm text-slate-600 ml-1.5">— {summary}</span>
            )}
          </div>
        </div>
        {(steps.length > 0 || consequenceNote) && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-[#0071E3] hover:underline flex items-center gap-1"
          >
            {expanded ? 'Hide guide' : 'How does this page work?'}
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {steps.map((st, i) => {
            const isString = typeof st === 'string';
            return (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-[#F5F5F7] border border-slate-200/70"
              >
                <div className="font-semibold text-[#1D1D1F] mb-1">
                  {isString ? `Step ${i + 1}` : st.label}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {isString ? st : st.text}
                </p>
              </div>
            );
          })}
          {consequenceNote && (
            <div className="md:col-span-3 text-slate-600 pt-1">
              <strong className="text-[#1D1D1F]">Good to know:</strong> {consequenceNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function KpiCard({
  title,
  displayMetric,
  description,
  helpText,
  trend,
  trendDirection,
  comparisonPeriod,
  icon: Icon,
}) {
  const isPositive = trendDirection === 'up' || trendDirection === 'down-good';
  return (
    <div className="bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200 border border-slate-200/85 rounded-3xl p-6 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center">
            {title}
            {helpText && <HelpTooltip term={title} explanation={helpText} />}
          </span>
          {Icon && (
            <div className="w-9 h-9 rounded-2xl bg-[#F5F5F7] border border-slate-200/70 flex items-center justify-center text-[#0071E3] group-hover:scale-105 transition-transform">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-[#1D1D1F] tracking-tight mb-1.5">
          {displayMetric}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span
            className={`inline-flex items-center gap-1 font-semibold ${isPositive
              ? 'text-emerald-600'
              : trendDirection === 'neutral'
                ? 'text-[#0071E3]'
                : 'text-amber-600'
              }`}
          >
            {trendDirection === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {trendDirection === 'down-good' && <TrendingDown className="w-3.5 h-3.5" />}
            {trendDirection === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            {trend}
          </span>
          <span className="text-slate-400">{comparisonPeriod}</span>
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, badge, actions }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 mb-6 border-b border-slate-200/80">
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-3xl' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div
        className={`bg-white border border-slate-200 rounded-3xl w-full ${maxWidth} max-h-[90vh] flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.16)] overflow-hidden`}
      >
        <div className="flex items-start justify-between p-6 border-b border-slate-200/80 bg-[#FAFAFC]">
          <div>
            <h3 className="text-lg font-bold text-[#1D1D1F]">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700">{children}</div>
      </div>
    </div>
  );
}

/**
 * Confirmation Dialog before sensitive operations explaining consequences
 */
export function ConfirmActionModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  consequence,
  consequences = [],
  confirmLabel = 'Confirm & Continue',
  variant = 'primary',
}) {
  if (!open) return null;
  const list = consequences.length > 0 ? consequences : consequence ? [consequence] : [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-[0_24px_64px_rgba(0,0,0,0.16)] space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F]">{title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
        {list.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/80 text-xs text-slate-700 space-y-1">
            <strong className="text-[#1D1D1F] block mb-1">What will happen next:</strong>
            <ul className="list-disc list-inside space-y-1">
              {list.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-colors ${variant === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-[#0071E3] hover:bg-[#0077ED] text-white'
              }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * First-Time User Onboarding Welcome Screen Modal
 */
export function WelcomeOnboardingModal() {
  const { showWelcomeModal, markOnboardingSeen, startTour } = useUX();
  const navigate = useNavigate();

  if (!showWelcomeModal) return null;

  const concepts = [
    {
      num: '1',
      title: 'Your Business Dashboard',
      desc: 'See how your store is performing today, which orders or deliveries are at risk, and what needs your attention right now.',
    },
    {
      num: '2',
      title: 'Your AI Workforce',
      desc: '10 digital assistants work together like specialists in Orders, Payments, Inventory, and Deliveries to investigate issues for you.',
    },
    {
      num: '3',
      title: 'Automated Business Operations',
      desc: 'Routine tasks—like re-routing delayed packages or fixing checkout errors—run automatically step by step.',
    },
    {
      num: '4',
      title: 'Customer Complaint Resolution',
      desc: 'Submit or select any customer complaint and follow a clear 8-step guided timeline from investigation to customer notification.',
    },
    {
      num: '5',
      title: 'Business Monitoring & Approvals',
      desc: 'You stay in complete control. Any refund or replacement above your policy limit ($250) waits for a manager’s approval.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.16)] space-y-6 overflow-y-auto max-h-[92vh]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0071E3] border border-blue-200 mb-3">
              <Compass className="w-3.5 h-3.5" /> Interactive Onboarding Guide
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
              Welcome to ResolveAI.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Your intelligent business operations platform. Let&apos;s show you around.
            </p>
          </div>
          <button
            onClick={markOnboardingSeen}
            aria-label="Skip introduction"
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-[#F5F5F7] border border-slate-200/80 rounded-2xl p-4">
          You don&apos;t need any technical background to use ResolveAI. We start you in{' '}
          <strong className="text-[#1D1D1F]">Simple Mode</strong> so everything is explained in
          plain English, and you can switch to{' '}
          <strong className="text-[#1D1D1F]">Advanced Mode</strong> whenever you want deeper
          technical details.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {concepts.map((c) => (
            <div
              key={c.num}
              className="p-4 rounded-2xl bg-[#F5F5F7] border border-slate-200/70 flex items-start gap-3"
            >
              <span className="w-7 h-7 rounded-xl bg-[#0071E3] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {c.num}
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] mb-1">{c.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={markOnboardingSeen}
            className="px-4 py-2.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Skip Introduction
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                markOnboardingSeen();
                navigate('/app/dashboard');
              }}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#1D1D1F] border border-slate-200"
            >
              Explore Platform
            </button>
            <button
              type="button"
              onClick={() => {
                startTour();
                navigate('/app/dashboard');
              }}
              className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm flex items-center gap-2"
            >
              Start Tour (1 Min) <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Guided Product Tour Floating Banner & Element Highlighter
 */
export function GuidedTourOverlay() {
  const {
    tourActive,
    tourStepIndex,
    setTourStepIndex,
    currentTourStep,
    totalTourSteps,
    stopTour,
  } = useUX();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!tourActive || !currentTourStep) return;
    if (location.pathname !== currentTourStep.route) {
      navigate(currentTourStep.route);
    }
    const timer = setTimeout(() => {
      const el = document.getElementById(currentTourStep.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-[#0071E3]', 'ring-offset-4', 'ring-offset-[#F5F5F7]');
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      const el = document.getElementById(currentTourStep?.targetId);
      if (el) {
        el.classList.remove('ring-2', 'ring-[#0071E3]', 'ring-offset-4', 'ring-offset-[#F5F5F7]');
      }
    };
  }, [tourActive, tourStepIndex, currentTourStep, location.pathname]);

  if (!tourActive || !currentTourStep) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:w-[440px] z-50 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071E3]">
          Guided Product Tour • Step {tourStepIndex + 1} of {totalTourSteps}
        </span>
        <button
          onClick={stopTour}
          className="text-xs text-slate-400 hover:text-slate-700 font-medium"
        >
          Skip Tour ✕
        </button>
      </div>
      <h4 className="text-base font-bold text-[#1D1D1F] mb-1.5">{currentTourStep.title}</h4>
      <p className="text-xs text-slate-600 leading-relaxed mb-4">{currentTourStep.description}</p>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <button
          type="button"
          disabled={tourStepIndex === 0}
          onClick={() => setTourStepIndex((i) => Math.max(0, i - 1))}
          className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 disabled:opacity-40 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Previous
        </button>
        {tourStepIndex < totalTourSteps - 1 ? (
          <button
            type="button"
            onClick={() => setTourStepIndex((i) => i + 1)}
            className="px-4 py-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-xs font-semibold text-white flex items-center gap-1"
          >
            Next Step <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={stopTour}
            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white"
          >
            Finish Tour ✓
          </button>
        )}
      </div>
    </div>
  );
}

export function RoleGuardNotice({ allowedRoles }) {
  return (
    <div className="bg-white border border-rose-200 rounded-3xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
      <ShieldCheck className="w-10 h-10 text-rose-600 mx-auto mb-3" />
      <h3 className="text-lg font-bold text-[#1D1D1F] mb-1">Role Authorization Required</h3>
      <p className="text-sm text-slate-600">
        This operational module requires one of the following roles:{' '}
        <span className="text-[#1D1D1F] font-mono font-semibold">{allowedRoles.join(', ')}</span>.
      </p>
    </div>
  );
}