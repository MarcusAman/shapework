/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ErrorBoundary from './components/system/ErrorBoundary';
import SecureActionLinks from './components/ui/SecureActionLinks';
import PublicLayout from './components/public/PublicLayout';
import WorkspaceAccessGate from './components/system/WorkspaceAccessGate';

// Resilient lazy loader that auto-reloads the page if a stale build chunk fails to fetch after a deployment
function lazyWithRetry<T extends React.ComponentType<any>>(componentImport: () => Promise<{ default: T }>) {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        const reloadKey = 'shapework_chunk_reload_retry';
        const hasReloaded = sessionStorage.getItem(reloadKey);
        if (!hasReloaded) {
          sessionStorage.setItem(reloadKey, 'true');
          window.location.reload();
          return new Promise(() => {}) as any;
        }
        sessionStorage.removeItem(reloadKey);
      }
      throw error;
    }
  });
}

// Route-level lazy loading for code splitting bundle hygiene
const WorkspaceConsole = lazyWithRetry(() => import('./components/demo/WorkspaceConsole'));
const InternalConsole = lazyWithRetry(() => import('./components/console/InternalConsole'));
const DemoConsole = lazyWithRetry(() => import('./components/console/DemoConsole'));
const PublicHome = lazyWithRetry(() => import('./components/public/PublicHome'));
const PublicMethod = lazyWithRetry(() => import('./components/public/PublicMethod'));
const PublicBrokerages = lazyWithRetry(() => import('./components/public/PublicBrokerages'));
const PublicIntelligence = lazyWithRetry(() => import('./components/public/PublicIntelligence'));
const PublicDiscovery = lazyWithRetry(() => import('./components/public/PublicDiscovery'));
const PublicAbout = lazyWithRetry(() => import('./components/public/PublicAbout'));
const PublicFieldNotes = lazyWithRetry(() => import('./components/public/PublicFieldNotes'));
const PublicDiscoveryRequest = lazyWithRetry(() => import('./components/public/PublicDiscoveryRequest'));
const PublicLogin = lazyWithRetry(() => import('./components/public/PublicLogin'));
const PublicForgotPassword = lazyWithRetry(() => import('./components/public/PublicForgotPassword'));
const PublicResetPassword = lazyWithRetry(() => import('./components/public/PublicResetPassword'));
const PublicTerms = lazyWithRetry(() => import('./components/public/PublicTerms'));
const PublicPrivacy = lazyWithRetry(() => import('./components/public/PublicPrivacy'));
const PublicSmsConsent = lazyWithRetry(() => import('./components/public/PublicSmsConsent'));
const PublicSmsTerms = lazyWithRetry(() => import('./components/public/PublicSmsTerms'));
const TaskTrackerPage = lazyWithRetry(() => import('./components/tracker/TaskTrackerPage').then(m => ({ default: m.TaskTrackerPage })));
const PublicClientCompPortal = lazyWithRetry(() => import('./components/comps/PublicClientCompPortal').then(m => ({ default: m.PublicClientCompPortal })));
const ClientDealPortal = lazyWithRetry(() => import('./components/headless/HeadlessPortals').then(m => ({ default: m.ClientDealPortal })));
const AgentActionPortal = lazyWithRetry(() => import('./components/headless/HeadlessPortals').then(m => ({ default: m.AgentActionPortal })));
const SmartIntakeLink = lazyWithRetry(() => import('./components/headless/HeadlessPortals').then(m => ({ default: m.SmartIntakeLink })));
import { ToastProvider, ToastContainer } from './components/ui';
import NetworkStatusToast from './components/system/NetworkStatusToast';


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
      desc = "Privacy Policy and data protection standards for shapework.";
    } else if (currentPath === '/sms-consent') {
      title = "SMS & Text Messaging Consent Policy | shapework.";
      desc = "SMS & Text Messaging Consent Policy and 10DLC compliance disclosures for shapework.";
    } else if (currentPath === '/sms-terms') {
      title = "SMS Terms of Service | shapework.";
      desc = "SMS and Text Messaging Terms of Service for shapework.";
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

  const isTaskDetailPreview = currentPath === '/dev/task-detail-preview';
  if (isTaskDetailPreview) {
    const TaskDetailPreviewHarness = React.lazy(() => import('./components/headless/TaskDetailPreviewHarness'));
    return (
      <ErrorBoundary>
        <React.Suspense fallback={
          <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans text-xs text-slate-300 animate-pulse">
            Loading task detail preview...
          </div>
        }>
          <TaskDetailPreviewHarness />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  const isClientPortal = currentPath.startsWith('/client/deal/');
  if (isClientPortal) {
    const token = currentPath.split('/').pop() || '';
    return (
      <ErrorBoundary>
        <React.Suspense fallback={<div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center font-sans text-xs text-stone-500 animate-pulse">Loading portal...</div>}>
          <ClientDealPortal token={token} />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  const isAgentPortal = currentPath.startsWith('/agent/action/');
  if (isAgentPortal) {
    const token = currentPath.split('/').pop() || '';
    return (
      <ErrorBoundary>
        <React.Suspense fallback={<div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center font-sans text-xs text-stone-500 animate-pulse">Loading portal...</div>}>
          <AgentActionPortal token={token} />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  const isActivateRoute = currentPath.startsWith('/invite/') || currentPath.startsWith('/author/activate/') || currentPath === '/activate';
  if (isActivateRoute) {
    const PublicActivateAccount = React.lazy(() => import('./components/public/PublicActivateAccount'));
    return (
      <ErrorBoundary>
        <React.Suspense fallback={<div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center font-sans text-xs text-stone-500 animate-pulse">Loading secure activation...</div>}>
          <PublicActivateAccount onNavigate={navigate} />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  const isAuthorRoute = currentPath.startsWith('/author/sop/');
  if (isAuthorRoute) {
    const EmployeeAuthoringPortal = React.lazy(() => import('./routes/EmployeeAuthoringPortal').then(m => ({ default: m.EmployeeAuthoringPortal })));
    const token = currentPath.replace('/author/sop/', '').replace(/\/$/, '');
    return (
      <ErrorBoundary>
        <React.Suspense fallback={<div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center font-sans text-xs text-stone-500 animate-pulse">Loading SOP authoring portal...</div>}>
          <EmployeeAuthoringPortal invitationToken={token} onClose={() => navigate('/')} />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  const isIntakeLink = currentPath.startsWith('/request/');
  if (isIntakeLink) {
    const type = currentPath.split('/')[2] || 'support';
    return (
      <ErrorBoundary>
        <React.Suspense fallback={<div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center font-sans text-xs text-stone-500 animate-pulse">Loading request...</div>}>
          <SmartIntakeLink type={type} />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  const isAssessmentRoute = currentPath.startsWith('/assessment/') || currentPath === '/survey' || currentPath === '/survey/' || currentPath.startsWith('/survey/');
  if (isAssessmentRoute) {
    const PublicSurveyRenderer = React.lazy(() => import('./components/public/PublicSurveyRenderer'));
    let slug = currentPath.startsWith('/assessment/') 
      ? currentPath.replace('/assessment/', '') 
      : currentPath.replace('/survey/', '');
    if (slug === '/survey' || slug === '/survey/' || !slug || slug === 'survey') {
      slug = 'brokerage-operational-intelligence';
    }
    // Remove trailing slash if present
    slug = slug.replace(/\/$/, '');
    
    return (
      <ErrorBoundary>
        <React.Suspense fallback={
          <div className="min-h-screen bg-[#01362D] flex items-center justify-center font-sans text-xs text-[#D0D6BB] animate-pulse">
            Loading survey...
          </div>
        }>
          <PublicSurveyRenderer slug={slug} onNavigate={navigate} />
        </React.Suspense>
      </ErrorBoundary>
    );
  }

  const isDemo = currentPath.startsWith('/demo');
  const isApp = currentPath.startsWith('/app') || currentPath.startsWith('/brokerage-ops') || currentPath.startsWith('/market-intelligence') || currentPath.startsWith('/marketing-intelligence') || currentPath.startsWith('/spatial-comps') || currentPath.startsWith('/news');
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
    if (
      currentPath === '/market-intelligence' || currentPath.startsWith('/market-intelligence/') ||
      currentPath === '/marketing-intelligence' || currentPath.startsWith('/marketing-intelligence/') ||
      currentPath === '/spatial-comps' || currentPath.startsWith('/spatial-comps/') ||
      currentPath === '/comps' || currentPath.startsWith('/comps/')
    ) {
      navigate('/app/market-intelligence');
    }
    if (currentPath === '/news' || currentPath.startsWith('/news/')) {
      navigate('/app/news');
    }
    if (currentPath.startsWith('/brokerage-ops')) {
      navigate('/app/workboard?workspace=nest-realty-wilmington');
    }
  }, [currentPath, appMode]);

  if (isDemo || isApp || isInternal) {
    return (
      <ToastProvider>
        <ToastContainer />
        <NetworkStatusToast />
        <React.Suspense fallback={
          <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans text-xs text-text-secondary animate-pulse">
            Loading shapework...
          </div>
        }>
          {isInternal ? (
            <ErrorBoundary>
              <InternalConsole />
            </ErrorBoundary>
          ) : isDemo ? (
            <ErrorBoundary>
              <DemoConsole />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary>
              <WorkspaceAccessGate>
                <WorkspaceConsole />
              </WorkspaceAccessGate>
            </ErrorBoundary>
          )}
        </React.Suspense>
      </ToastProvider>
    );
  }

  // Render Public Website
  const renderPublicPage = () => {
    const cleanPath = currentPath.split('?')[0].replace(/\/$/, '') || '/';
    if (cleanPath === '/method') {
      return <PublicMethod onNavigate={navigate} />;
    }
    if (cleanPath === '/brokerages') {
      return <PublicBrokerages onNavigate={navigate} />;
    }
    if (cleanPath === '/operational-intelligence') {
      return <PublicIntelligence onNavigate={navigate} />;
    }
    if (cleanPath === '/login') {
      return <PublicLogin onNavigate={navigate} />;
    }
    if (cleanPath === '/forgot-password') {
      return <PublicForgotPassword onNavigate={navigate} />;
    }
    if (cleanPath.startsWith('/reset-password')) {
      return <PublicResetPassword onNavigate={navigate} />;
    }
    if (cleanPath === '/discovery' || cleanPath === '/request-discovery') {
      return <PublicDiscoveryRequest onNavigate={navigate} />;
    }
    if (cleanPath === '/about') {
      return <PublicAbout onNavigate={navigate} />;
    }
    if (cleanPath === '/terms') {
      return <PublicTerms onNavigate={navigate} />;
    }
    if (cleanPath === '/privacy') {
      return <PublicPrivacy onNavigate={navigate} />;
    }
    if (cleanPath === '/sms-consent') {
      return <PublicSmsConsent onNavigate={navigate} />;
    }
    if (cleanPath === '/sms-terms') {
      return <PublicSmsTerms onNavigate={navigate} />;
    }
    if (cleanPath === '/field-notes' || cleanPath.startsWith('/field-notes/')) {
      return <PublicFieldNotes currentPath={currentPath} onNavigate={navigate} />;
    }
    if (cleanPath === '/' || cleanPath === '' || cleanPath === '/home' || cleanPath === '/practice') {
      return <PublicHome onNavigate={navigate} />;
    }
    if (cleanPath === '/login') {
      return <PublicLogin onNavigate={navigate} />;
    }
    return <PublicHome onNavigate={navigate} />;
  };

  const isLegalPage = currentPath === '/terms' || currentPath === '/privacy' || currentPath === '/sms-consent' || currentPath === '/sms-terms';
  const isTrackerPage = currentPath.startsWith('/tracker/') || currentPath.startsWith('/track/');
  const isShareCompsPage = currentPath.startsWith('/share/comps');

  if (isShareCompsPage) {
    return (
      <ToastProvider>
        <ToastContainer />
        <NetworkStatusToast />
        <React.Suspense fallback={
          <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center font-sans text-xs text-[#00635C] font-bold uppercase tracking-wider animate-pulse">
            Loading Nest Realty Luxury Market Dossier...
          </div>
        }>
          <PublicClientCompPortal />
        </React.Suspense>
      </ToastProvider>
    );
  }

  if (isTrackerPage) {
    return (
      <ToastProvider>
        <ToastContainer />
        <NetworkStatusToast />
        <React.Suspense fallback={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-xs text-slate-500 animate-pulse">
            Connecting to live Nest Ops tracker...
          </div>
        }>
          <TaskTrackerPage />
        </React.Suspense>
      </ToastProvider>
    );
  }

  if (isLegalPage) {
    return (
      <>
        <NetworkStatusToast />
        <React.Suspense fallback={
          <div className="min-h-screen bg-[#FBF8F0] flex items-center justify-center font-sans text-xs text-[#1E2520] animate-pulse">
            Loading...
          </div>
        }>
          {renderPublicPage()}
        </React.Suspense>
      </>
    );
  }

  return (
    <PublicLayout currentPath={currentPath} onNavigate={navigate}>
      <NetworkStatusToast />
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
