/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ErrorBoundary from './components/system/ErrorBoundary';
import SecureActionLinks from './components/ui/SecureActionLinks';
import PublicLayout from './components/public/PublicLayout';
import WorkspaceAccessGate from './components/system/WorkspaceAccessGate';

// Route-level lazy loading for code splitting bundle hygiene
const WorkspaceConsole = React.lazy(() => import('./components/demo/WorkspaceConsole'));
const InternalConsole = React.lazy(() => import('./components/console/InternalConsole'));
const DemoConsole = React.lazy(() => import('./components/console/DemoConsole'));
const PublicHome = React.lazy(() => import('./components/public/PublicHome'));
const PublicMethod = React.lazy(() => import('./components/public/PublicMethod'));
const PublicBrokerages = React.lazy(() => import('./components/public/PublicBrokerages'));
const PublicIntelligence = React.lazy(() => import('./components/public/PublicIntelligence'));
const PublicDiscovery = React.lazy(() => import('./components/public/PublicDiscovery'));
const PublicAbout = React.lazy(() => import('./components/public/PublicAbout'));
const PublicFieldNotes = React.lazy(() => import('./components/public/PublicFieldNotes'));
const PublicDiscoveryRequest = React.lazy(() => import('./components/public/PublicDiscoveryRequest'));
const PublicLogin = React.lazy(() => import('./components/public/PublicLogin'));
const PublicForgotPassword = React.lazy(() => import('./components/public/PublicForgotPassword'));
const PublicResetPassword = React.lazy(() => import('./components/public/PublicResetPassword'));
const PublicTerms = React.lazy(() => import('./components/public/PublicTerms'));
const PublicPrivacy = React.lazy(() => import('./components/public/PublicPrivacy'));
import { ClientDealPortal, AgentActionPortal, SmartIntakeLink } from './components/headless/HeadlessPortals';

export default function App() {
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);
  const [appMode, setAppMode] = React.useState('development');

  React.useEffect(() => {
    fetch('/api/mode')
      .then(res => res.json())
      .then(data => setAppMode(data.mode || 'development'))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  React.useEffect(() => {
    // Dynamic SEO Metadata updates based on route path
    let title = "shapework. — Workflow Design & Operational Intelligence";
    let desc = "shapework. maps how work actually moves, redesigns high-friction workflows, and builds the operating layer that turns scattered requests, deadlines, and decisions into structured work.";
    
    if (currentPath === '/login') {
      title = "Log in to shapework.";
      desc = "Access your brokerage operating console.";
    } else if (currentPath === '/method') {
      title = "The shapework. Method — Standardizing Operations";
      desc = "Map the work. Shape the handoffs. Build the system. Run until it sticks. Learn how the shapework. method eliminates operational leaks.";
    } else if (currentPath === '/brokerages') {
      title = "shapework. for Real Estate Brokerages";
      desc = "Turn agent requests, deal intake, compliance follow-up, listing launch, and agent onboarding into repeatable, structured brokerage operations.";
    } else if (currentPath === '/operational-intelligence') {
      title = "Operational Intelligence — AI Where it Earns its Place";
      desc = "How we connect background AI agents to standard databases, audit logs, and existing business software without chat interface overload.";
    } else if (currentPath === '/discovery') {
      title = "Request Workflow Discovery — shapework.";
      desc = "Submit your team size and operational friction details to request a custom discovery session and roadmap blueprint.";
    } else if (currentPath === '/about') {
      title = "About shapework. — Founding Operators";
      desc = "Learn about the founding team of operators, builders, and workflow designers based in Wilmington, NC, building calm operating layers.";
    } else if (currentPath.startsWith('/field-notes')) {
      title = "Field Notes — shapework. Editorial";
      desc = "Intellectually rigorous essays on human middleware, workflow design, software restraint, and why AI fails in unstructured operations.";
    } else if (currentPath.startsWith('/demo')) {
      title = "shapework. Portal — Secure Operations Console";
      desc = "Private shapework. demo workspace. Synthetic real estate data, compliance ledgers, and operational triage desk.";
    } else if (currentPath === '/forgot-password') {
      title = "Reset Your Password — shapework.";
      desc = "Request a secure password reset link for your shapework. account.";
    } else if (currentPath.startsWith('/reset-password')) {
      title = "Create New Password — shapework.";
      desc = "Securely set a new password for your shapework. account.";
    } else if (currentPath === '/terms') {
      title = "Terms of Service | shapework.";
      desc = "Terms of Service and End User License Agreement for shapework.";
    } else if (currentPath === '/privacy') {
      title = "Privacy Policy | shapework.";
      desc = "Privacy Policy for shapework.";
    }

    document.title = title;

    // Update meta description tag dynamically
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);

    // Update Open Graph tags dynamically
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);
  }, [currentPath]);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const isSecureLink = currentPath.startsWith('/link/') || currentPath.startsWith('/action/');
  if (isSecureLink) {
    return (
      <ErrorBoundary>
        <SecureActionLinks pathname={currentPath} />
      </ErrorBoundary>
    );
  }

  const isPreviewGallery = currentPath === '/dev/notification-preview' || currentPath === '/admin/notification-preview';
  if (isPreviewGallery) {
    const HeadlessPreviewGallery = React.lazy(() => import('./components/headless/HeadlessPreviewGallery'));
    return (
      <ErrorBoundary>
        <React.Suspense fallback={
          <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans text-xs text-stone-500 animate-pulse">
            Loading preview gallery...
          </div>
        }>
          <HeadlessPreviewGallery />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  const isClientPortal = currentPath.startsWith('/client/deal/');
  if (isClientPortal) {
    const token = currentPath.split('/').pop() || '';
    return (
      <ErrorBoundary>
        <ClientDealPortal token={token} />
      </ErrorBoundary>
    );
  }

  const isAgentPortal = currentPath.startsWith('/agent/action/');
  if (isAgentPortal) {
    const token = currentPath.split('/').pop() || '';
    return (
      <ErrorBoundary>
        <AgentActionPortal token={token} />
      </ErrorBoundary>
    );
  }

  const isIntakeLink = currentPath.startsWith('/request/');
  if (isIntakeLink) {
    const type = currentPath.split('/')[2] || 'support';
    return (
      <ErrorBoundary>
        <SmartIntakeLink type={type} />
      </ErrorBoundary>
    );
  }

  const isAssessmentRoute = currentPath.startsWith('/assessment/') || currentPath === '/survey' || currentPath.startsWith('/survey/');
  if (isAssessmentRoute) {
    const PublicAssessment = React.lazy(() => import('./components/public/PublicAssessment'));
    return (
      <ErrorBoundary>
        <React.Suspense fallback={
          <div className="min-h-screen bg-[#01362D] flex items-center justify-center font-sans text-xs text-[#D0D6BB] animate-pulse">
            Loading assessment...
          </div>
        }>
          <PublicAssessment onNavigate={navigate} />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  const isDemo = currentPath.startsWith('/demo');
  const isApp = currentPath.startsWith('/app') || currentPath.startsWith('/brokerage-ops');
  const isInternal = currentPath.startsWith('/internal');

  React.useEffect(() => {
    if (isDemo && appMode === 'production') {
      navigate('/app/workboard');
    }
    if (currentPath === '/app' || currentPath === '/app/') {
      navigate('/app/workboard');
    }
    if (currentPath === '/app/command-center' || currentPath === '/app/command-center/') {
      navigate('/app/workboard');
    }
    if (currentPath.startsWith('/brokerage-ops')) {
      navigate('/app/workboard?workspace=nest-realty-wilmington');
    }
  }, [currentPath, appMode]);

  if (isDemo || isApp || isInternal) {
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans text-xs text-text-secondary animate-pulse">
          Loading shapework...
        </div>
      }>
        {isInternal ? (
          <InternalConsole />
        ) : isDemo ? (
          <DemoConsole />
        ) : (
          <WorkspaceAccessGate>
            <WorkspaceConsole />
          </WorkspaceAccessGate>
        )}
      </React.Suspense>
    );
  }

  // Render Public Website
  const renderPublicPage = () => {
    if (currentPath === '/method') {
      return <PublicMethod onNavigate={navigate} />;
    }
    if (currentPath === '/brokerages') {
      return <PublicBrokerages onNavigate={navigate} />;
    }
    if (currentPath === '/operational-intelligence') {
      return <PublicIntelligence onNavigate={navigate} />;
    }
    if (currentPath === '/login') {
      return <PublicLogin onNavigate={navigate} />;
    }
    if (currentPath === '/forgot-password') {
      return <PublicForgotPassword onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/reset-password')) {
      return <PublicResetPassword onNavigate={navigate} />;
    }
    if (currentPath === '/discovery' || currentPath === '/request-discovery') {
      return <PublicDiscoveryRequest onNavigate={navigate} />;
    }
    if (currentPath === '/about') {
      return <PublicAbout onNavigate={navigate} />;
    }
    if (currentPath === '/terms') {
      return <PublicTerms onNavigate={navigate} />;
    }
    if (currentPath === '/privacy') {
      return <PublicPrivacy onNavigate={navigate} />;
    }
    if (currentPath === '/field-notes' || currentPath.startsWith('/field-notes/')) {
      return <PublicFieldNotes currentPath={currentPath} onNavigate={navigate} />;
    }
    return <PublicHome onNavigate={navigate} />;
  };

  const isLegalPage = currentPath === '/terms' || currentPath === '/privacy';

  if (isLegalPage) {
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-[#FBF8F0] flex items-center justify-center font-sans text-xs text-[#1E2520] animate-pulse">
          Loading...
        </div>
      }>
        {renderPublicPage()}
      </React.Suspense>
    );
  }

  return (
    <PublicLayout currentPath={currentPath} onNavigate={navigate}>
      <React.Suspense fallback={
        <div className="py-20 text-center text-xs text-text-secondary font-sans animate-pulse">
          Loading...
        </div>
      }>
        {renderPublicPage()}
      </React.Suspense>
    </PublicLayout>
  );
}
