import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UXContext = createContext(null);

export const TOUR_STEPS = [
  {
    step: 1,
    route: '/app/dashboard',
    targetId: 'tour-dashboard-attention',
    title: '1. Your Business Dashboard & Actionable Priorities',
    description:
      'Your dashboard immediately answers 5 questions: how your business is performing, whether there are problems, what your AI agents are doing, what needs your attention, and what to do next.',
  },
  {
    step: 2,
    route: '/app/dashboard',
    targetId: 'tour-mode-switcher',
    title: '2. Simple Mode vs. Advanced Mode',
    description:
      'Switch between Simple Mode (plain English, guided workflows, essential metrics first) and Advanced Mode (technical logs, schemas, and deep analytics) anytime without changing your permissions.',
  },
  {
    step: 3,
    route: '/app/agents',
    targetId: 'tour-ai-agents',
    title: '3. Meet Your AI Workforce (10 Specialized Agents)',
    description:
      'ResolveAI uses 10 specialized AI agents that work like employees in different departments—checking orders, verifying payments, tracking deliveries, and following your business rules.',
  },
  {
    step: 4,
    route: '/app/complaints',
    targetId: 'tour-complaints-guided',
    title: '4. Guided 8-Step Complaint Resolution',
    description:
      'Submit a customer complaint and watch ResolveAI guide it through an 8-step resolution timeline—from understanding the problem to notifying the customer.',
  },
  {
    step: 5,
    route: '/app/approvals',
    targetId: 'tour-approvals',
    title: '5. Actions Awaiting Your Approval',
    description:
      'Whenever an action costs more than your policy limit ($250), ResolveAI pauses and asks a manager for approval before executing.',
  },
  {
    step: 6,
    route: '/app/help',
    targetId: 'tour-help-center',
    title: '6. Help & Learning Center',
    description:
      'Need a refresher? Visit Help & Support anytime to search plain-language guides, examples, or restart this interactive tour.',
  },
];

export function UXProvider({ children }) {
  const { user } = useAuth();

  const [interfaceMode, setInterfaceModeState] = useState(() => {
    const saved = localStorage.getItem('resolveai_interface_mode');
    return saved === 'advanced' ? 'advanced' : 'simple';
  });

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  useEffect(() => {
    if (!user || user.role === 'CUSTOMER') {
      setShowWelcomeModal(false);
      return;
    }
    const key = `resolveai_onboarded_${user.email}`;
    const seen = localStorage.getItem(key);
    if (!seen) {
      setShowWelcomeModal(true);
    }
  }, [user]);

  const setInterfaceMode = (mode) => {
    const normalized = mode === 'advanced' ? 'advanced' : 'simple';
    localStorage.setItem('resolveai_interface_mode', normalized);
    setInterfaceModeState(normalized);
  };

  const markOnboardingSeen = () => {
    if (user?.email) {
      localStorage.setItem(`resolveai_onboarded_${user.email}`, 'true');
    }
    setShowWelcomeModal(false);
  };

  const startTour = () => {
    markOnboardingSeen();
    setTourStepIndex(0);
    setTourActive(true);
  };

  const stopTour = () => {
    setTourActive(false);
  };

  const openWelcomeScreen = () => {
    setTourActive(false);
    setShowWelcomeModal(true);
  };

  return (
    <UXContext.Provider
      value={{
        interfaceMode,
        isSimpleMode: interfaceMode === 'simple',
        isAdvancedMode: interfaceMode === 'advanced',
        setInterfaceMode,
        showWelcomeModal,
        setShowWelcomeModal,
        markOnboardingSeen,
        openWelcomeScreen,
        openWelcomeModal: openWelcomeScreen,
        tourActive,
        tourStepIndex,
        setTourStepIndex,
        currentTourStep: TOUR_STEPS[tourStepIndex] || TOUR_STEPS[0],
        totalTourSteps: TOUR_STEPS.length,
        startTour,
        stopTour,
      }}
    >
      {children}
    </UXContext.Provider>
  );
}

export function useUX() {
  return useContext(UXContext);
}
