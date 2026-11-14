import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UXProvider } from './context/UXContext';
import { LandingPage } from './pages/LandingPage';
import { SignInPage, GetStartedPage } from './pages/AuthPages';
import { AppLayout } from './components/layout/AppLayout';
import { OperationsDashboardPage, BusinessIntelligencePage } from './pages/DashboardAndBI';
import {
  ComplaintManagementPage,
  OrderManagementPage,
  InventoryManagementPage,
  LogisticsManagementPage,
} from './pages/OperationsModules';
import {
  AgentCommandCenterPage,
  AgentCollaborationPage,
  AutonomousWorkflowsPage,
  PredictiveIntelligencePage,
} from './pages/AgentAndWorkflowModules';
import {
  CrisisManagementPage,
  DecisionSimulatorPage,
  BusinessDigitalTwinPage,
  OrganizationalMemoryPage,
} from './pages/AdvancedIntelligenceModules';
import {
  HumanApprovalCenterPage,
  AnalyticsPage,
  AuditLogsPage,
  IntegrationsPage,
  BusinessPoliciesPage,
  UserSettingsPage,
} from './pages/GovernanceAndAdminModules';
import { HelpCenterPage } from './pages/HelpCenterPage';
import { CustomerPortalPage } from './pages/CustomerPortal';

function ProtectedEnterpriseRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center text-slate-500 text-sm font-medium">
        Loading ResolveAI Session...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  if (user.role === 'CUSTOMER') {
    return <Navigate to="/portal" replace />;
  }
  return children;
}

function ProtectedCustomerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center text-slate-500 text-sm font-medium">
        Loading Portal...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <UXProvider>
        <BrowserRouter>
          <Routes>
            {/* EXPERIENCE A: PUBLIC MARKETING WEBSITE (8 Experiences) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<LandingPage initialSection="features" />} />
            <Route path="/how-it-works" element={<LandingPage initialSection="how-it-works" />} />
            <Route path="/agents-ecosystem" element={<LandingPage initialSection="ai-agents" />} />
            <Route path="/solutions" element={<LandingPage initialSection="solutions" />} />
            <Route path="/security" element={<LandingPage initialSection="security" />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/get-started" element={<GetStartedPage />} />

            {/* EXPERIENCE B: AUTHENTICATED BUSINESS APPLICATION (20 Modules + Help & Learning Center) */}
            <Route
              path="/app"
              element={
                <ProtectedEnterpriseRoute>
                  <AppLayout />
                </ProtectedEnterpriseRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<OperationsDashboardPage />} />
              <Route path="bi" element={<BusinessIntelligencePage />} />
              <Route path="complaints" element={<ComplaintManagementPage />} />
              <Route path="orders" element={<OrderManagementPage />} />
              <Route path="inventory" element={<InventoryManagementPage />} />
              <Route path="logistics" element={<LogisticsManagementPage />} />
              <Route path="agents" element={<AgentCommandCenterPage />} />
              <Route path="collaboration" element={<AgentCollaborationPage />} />
              <Route path="workflows" element={<AutonomousWorkflowsPage />} />
              <Route path="predictions" element={<PredictiveIntelligencePage />} />
              <Route path="crisis" element={<CrisisManagementPage />} />
              <Route path="simulator" element={<DecisionSimulatorPage />} />
              <Route path="digital-twin" element={<BusinessDigitalTwinPage />} />
              <Route path="memory" element={<OrganizationalMemoryPage />} />
              <Route path="approvals" element={<HumanApprovalCenterPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="policies" element={<BusinessPoliciesPage />} />
              <Route path="settings" element={<UserSettingsPage />} />
              <Route path="help" element={<HelpCenterPage />} />
            </Route>

            {/* EXPERIENCE C: CUSTOMER-FACING PORTAL */}
            <Route
              path="/portal"
              element={
                <ProtectedCustomerRoute>
                  <CustomerPortalPage />
                </ProtectedCustomerRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </UXProvider>
    </AuthProvider>
  );
}
