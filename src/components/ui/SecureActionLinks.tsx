import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Upload, 
  MapPin, 
  Zap, 
  Calendar, 
  Send,
  HelpCircle,
  ShieldCheck,
  Star,
  User,
  ArrowUpRight,
  ClipboardList
} from 'lucide-react';
import { getSessionData, setSessionData } from '../../state/operatingMemoryStore';
import { createAuditEvent } from '../../utils/audit';

interface SecureActionLinksProps {
  pathname: string;
}

export default function SecureActionLinks({ pathname }: SecureActionLinksProps) {
  // Parse path to get the token (the last part of pathname)
  const segments = pathname.split('/').filter(Boolean);
  const token = segments[segments.length - 1];

  // Database-backed secure token states
  const [dbLink, setDbLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Authentication states for step-up gating
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load latest state directly from session storage to sync across tabs (for legacy mock links)
  const secureLinks = getSessionData<any[]>('shapework_ops_secure_links', []);
  const agentRequests = getSessionData<any[]>('shapework_ops_agent_requests', []);
  const transactions = getSessionData<any[]>('shapework_transactions', []);
  const auditEvents = getSessionData<any[]>('shapework_audit_events', []);

  const legacyLinkIndex = secureLinks.findIndex(l => l.token === token);
  const legacyLink = secureLinks[legacyLinkIndex];

  const [status, setStatus] = useState<'form' | 'success' | 'error' | 'loading'>('loading');

  // Form Fields for legacy/custom pages
  const [propertyAddress, setPropertyAddress] = useState('');
  const [launchDate, setLaunchDate] = useState('');
  const [assetType, setAssetType] = useState('Flyers');
  const [uploadFile, setUploadFile] = useState<string>('');
  const [uploadComment, setUploadComment] = useState('');
  const [signAction, setSignAction] = useState<'install' | 'return' | 'confirm'>('install');
  const [signType, setSignType] = useState('Premium Post Sign');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLogin(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        const data = await res.json();
        setLoginError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setLoginError('Network connection error.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Fetch token status and authentication state on load
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorText('Token is missing.');
      setLoading(false);
      return;
    }

    // Check active session status
    fetch('/api/auth/session')
      .then(async (res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });

    fetch(`/api/notifications/action/${token}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setDbLink(data);
          setStatus('form');
        } else {
          // Fallback to legacy mock link if present in session storage
          if (legacyLink) {
            setStatus(legacyLink.status === 'submitted' ? 'success' : 'form');
          } else {
            setErrorText('This link is invalid or has expired.');
            setStatus('error');
          }
        }
      })
      .catch(() => {
        if (legacyLink) {
          setStatus(legacyLink.status === 'submitted' ? 'success' : 'form');
        } else {
          setErrorText('Network error validating secure link.');
          setStatus('error');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, legacyLink]);

  const handleLegacySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      // 1. Mark Link as submitted
      const updatedLinks = [...secureLinks];
      updatedLinks[legacyLinkIndex] = {
        ...legacyLink,
        status: 'submitted',
        submittedValues: {
          propertyAddress,
          launchDate,
          assetType,
          uploadFile,
          uploadComment,
          signAction,
          signType,
          reviewRating: String(reviewRating),
          reviewText
        }
      };
      setSessionData('shapework_ops_secure_links', updatedLinks);

      // 2. Perform workflow updates based on linkType
      if (legacyLink.linkType === 'clarification') {
        const reqIdx = agentRequests.findIndex(r => r.id === legacyLink.relatedRecordId);
        if (reqIdx !== -1) {
          const updatedRequests = [...agentRequests];
          updatedRequests[reqIdx] = {
            ...updatedRequests[reqIdx],
            status: 'completed',
            structuredSummary: `${updatedRequests[reqIdx].structuredSummary} (Clarified: Property at ${propertyAddress}, Target Launch ${launchDate}, Type: ${assetType})`,
            missingInfo: []
          };
          setSessionData('shapework_ops_agent_requests', updatedRequests);
        }
      } else if (legacyLink.linkType === 'document_upload') {
        const updatedTransactions = transactions.map((t: any) => {
          if (t.id === legacyLink.relatedRecordId || t.property_address?.includes(propertyAddress)) {
            return {
              ...t,
              risk_level: 'healthy',
              waiting_on: 'None',
              next_action: 'Compliance audit passed.'
            };
          }
          return t;
        });
        setSessionData('shapework_transactions', updatedTransactions);
      } else if (legacyLink.linkType === 'sign_request') {
        const logMsg = `Sign inventory status updated for ${propertyAddress}: ${signAction === 'install' ? 'Installation Requested' : 'Removal Complete'}`;
        const auditEvent = createAuditEvent(
          { name: legacyLink.recipientName, role: 'agent' } as any,
          logMsg,
          'Inventory Update'
        );
        setSessionData('shapework_audit_events', [auditEvent, ...auditEvents]);
      } else if (legacyLink.linkType === 'review_request') {
        const auditEvent = createAuditEvent(
          { name: legacyLink.recipientName, role: 'client' } as any,
          `Received Google Review submission (${reviewRating} stars)`,
          'Marketing Review'
        );
        setSessionData('shapework_audit_events', [auditEvent, ...auditEvents]);
      }

      // 3. Log Audit event
      const auditEvent = createAuditEvent(
        { name: legacyLink.recipientName, role: 'agent' } as any,
        `Secure Agent Link submitted: ${legacyLink.linkType} (Token: ${token})`,
        'Agent Portal Audit'
      );
      setSessionData('shapework_audit_events', [auditEvent, ...auditEvents]);

      // Trigger main UI update
      try {
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        if (typeof document !== 'undefined' && document.createEvent) {
          const evt = document.createEvent('Event');
          evt.initEvent('storage', true, true);
          window.dispatchEvent(evt);
        }
      }

      setIsSubmitting(false);
      setStatus('success');
    }, 600);
  };

  const handleDbAction = async (actionResult: 'approve' | 'reject' | 'completed') => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/notifications/action/${token}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actionResult,
          notes: uploadComment
        })
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json();
        setErrorText(data.error || 'Failed to submit response.');
        setStatus('error');
      }
    } catch (e) {
      setErrorText('Network error submitting response.');
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendering Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#fcfbf7] flex items-center justify-center p-6 text-left font-sans">
        <div className="max-w-md w-full bg-white border border-[#e4decb] rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18382b] mx-auto"></div>
          <p className="text-xs text-text-secondary">Securing encrypted connection...</p>
        </div>
      </div>
    );
  }

  // Rendering Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#fcfbf7] flex items-center justify-center p-6 text-left font-sans">
        <div className="max-w-md w-full bg-white border border-[#e4decb] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-700 rounded-full flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif font-bold text-xl text-[#1e2520]">Link Expired or Invalid</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            {errorText || 'This secure intake token has expired or is invalid. Please request a new secure link from your transaction coordinator.'}
          </p>
        </div>
      </div>
    );
  }

  // Rendering Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#fcfbf7] flex items-center justify-center p-6 text-left font-sans">
        <div className="max-w-md w-full bg-white border border-[#e4decb] rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-[#eaf2ee] text-[#18382b] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif font-bold text-xl text-[#1e2520]">Submission Successful</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Thank you! Your response has been securely processed and transmitted to the shapework. brokerage operations queue.
          </p>
          <div className="pt-4 select-none text-[10px] text-text-tertiary flex items-center justify-center gap-1.5">
            <span>Reference: {token.substring(0, 16)}...</span>
          </div>
          <div className="pt-2">
            <a 
              href="/app"
              className="inline-flex items-center gap-1 text-xs text-[#18382b] font-bold hover:underline"
            >
              <span>Go to App Console</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // DATABASE BACKED ACTION PAGE (PHASE 7 FOCUSED VIEW)
  if (dbLink) {
    const isApproval = dbLink.actionType === 'approve_action';
    const title = dbLink.workItem?.title || dbLink.approval?.title || 'Action Needed';
    const summary = dbLink.workItem?.summary || dbLink.approval?.draft_content || dbLink.approval?.description || 'Your feedback or action is required to resolve this item.';
    const dueDate = dbLink.workItem?.dueDate || 'None';
    const assignedPerson = dbLink.workItem?.assignedOwnerName || 'Brokerage Operations';
    const nextAction = dbLink.workItem?.recommendedNextAction || 'Review details and sign-off on the proposal.';

    // Check gating for sensitive action
    if (!isAuthenticated && isApproval) {
      return (
        <div className="min-h-screen bg-[#fcfbf7] flex items-center justify-center p-6 text-left font-sans">
          <div className="max-w-md w-full bg-white border border-[#e4decb] rounded-[28px] p-8 shadow-sm space-y-6">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#18382b]" />
                <span className="text-sm font-bold text-[#18382b] font-serif">shapework.</span>
              </div>
              <span className="text-[9px] bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Step-Up Auth Required</span>
            </div>
            <div className="space-y-2">
              <h2 className="font-serif font-bold text-lg text-[#1e2520]">Security Verification Required</h2>
              <p className="text-stone-500 text-xs leading-relaxed font-medium">
                You are accessing a sensitive operations control action. Please authenticate to authorize this request.
              </p>
            </div>
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {loginError}
              </div>
            )}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. sarah@shapework.com"
                  className="w-full px-3.5 py-2 border border-[#e4decb] rounded-xl focus:outline-none focus:border-[#18382b] bg-[#fcfbf7] font-medium text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 border border-[#e4decb] rounded-xl focus:outline-none focus:border-[#18382b] bg-[#fcfbf7] font-medium text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingLogin}
                className="w-full py-2.5 bg-[#18382b] hover:bg-[#1f4938] text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold shadow-sm disabled:opacity-50"
              >
                <span>{isSubmittingLogin ? 'Authenticating...' : 'Sign In & Continue'}</span>
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#fcfbf7] flex items-center justify-center p-6 text-left font-sans max-sm:p-4">
        <div className="max-w-lg w-full bg-white border border-[#e4decb] rounded-2xl p-6 shadow-sm space-y-6 max-sm:pb-28">
          {/* Logo Header */}
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#18382b]" />
              <span className="text-sm font-bold text-[#18382b] font-serif">shapework.</span>
            </div>
            <span className="text-[9px] bg-[#eaf2ee] text-[#18382b] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Secure Action Link</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Action Needed</span>
            <h1 className="font-serif text-xl font-bold text-text-primary leading-tight">{title}</h1>
          </div>

          {/* Details list */}
          <div className="bg-[#fcfbf7] border border-[#e4decb] rounded-xl p-4 space-y-3.5 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-text-tertiary uppercase block">Description / Context</span>
              <p className="text-text-primary font-medium leading-relaxed bg-white border border-stone-100 p-3 rounded-lg font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap">
                {summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="flex items-center gap-2 text-text-secondary">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                <div>
                  <span className="text-[9px] text-text-tertiary block uppercase">Due Date</span>
                  <span className="font-bold">{dueDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <User className="w-4 h-4 text-text-tertiary" />
                <div>
                  <span className="text-[9px] text-text-tertiary block uppercase">Assigned To</span>
                  <span className="font-bold">{assignedPerson}</span>
                </div>
              </div>
            </div>

            {nextAction && (
              <div className="pt-2 border-t border-[#e4decb]/60 flex items-start gap-2">
                <ClipboardList className="w-4 h-4 text-[#18382b] mt-0.5" />
                <div>
                  <span className="text-[9px] text-text-tertiary uppercase block">Recommended Next Action</span>
                  <span className="font-bold text-text-primary">{nextAction}</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive controls */}
          <div className="space-y-4">
            {/* Optional Comments field */}
            <div className="space-y-1">
              <label className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Add Note or Comment (Optional)</label>
              <textarea
                placeholder="Write any comments, directions, or approvals text..."
                value={uploadComment}
                onChange={(e) => setUploadComment(e.target.value)}
                className="w-full p-3 border border-[#e4decb] rounded-lg focus:outline-none focus:border-[#18382b] bg-[#fcfbf7] font-medium text-xs leading-relaxed"
                rows={3}
              />
            </div>

            {/* CTAs */}
            <div className="space-y-2 max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:bg-white max-sm:border-t max-sm:border-[#e4decb]/60 max-sm:p-4 max-sm:z-50">
              {isApproval ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDbAction('approve')}
                    className="py-2.5 bg-[#18382b] hover:bg-[#1f4938] text-white rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold shadow-sm"
                  >
                    <span>Approve Proposal</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleDbAction('reject')}
                    className="py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold"
                  >
                    <span>Reject Proposal</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDbAction('completed')}
                  className="w-full py-2.5 bg-[#18382b] hover:bg-[#1f4938] text-white rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold shadow-sm"
                >
                  <span>Complete Task</span>
                </button>
              )}

              {/* Utility actions */}
              <div className="flex justify-between items-center pt-2 max-sm:hidden">
                <a 
                  href="/app"
                  className="text-[10px] text-text-secondary font-bold hover:underline"
                >
                  Open Full App Console
                </a>
                <div className="flex items-center gap-1 text-[9px] text-text-tertiary">
                  <ShieldCheck className="w-3 h-3 text-[#18382b]" />
                  <span>Secure 256-bit hash verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LEGACY FORM RENDERING (BACKWARD COMPATIBLE)
  return (
    <div className="min-h-screen bg-[#fcfbf7] flex items-center justify-center p-6 text-left font-sans">
      <div className="max-w-md w-full bg-white border border-[#e4decb] rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="border-b border-stone-100 pb-3 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#18382b]" />
            <span className="text-xs font-bold text-[#18382b] tracking-wider uppercase font-serif">shapework. agent links</span>
          </div>
          <span className="text-[9px] bg-stone-100 text-text-secondary px-2 py-0.5 rounded uppercase font-bold">Secure Portal</span>
        </div>

        <form onSubmit={handleLegacySubmit} className="space-y-4 text-xs font-semibold">
          
          {/* 1. Clarification Intake */}
          {legacyLink.linkType === 'clarification' && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-text-tertiary uppercase block select-none">Pending Request</span>
                <p className="text-xs text-[#1e2520] bg-stone-50 border border-stone-200 p-3 rounded-lg leading-normal italic font-medium">
                  "Can someone help me get this listing promoted? Need it soon."
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-text-secondary font-bold">Property Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 w-4 h-4 text-text-tertiary" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 109 Woodlawn Addendum"
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#18382b] font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-text-secondary font-bold">Launch Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-text-tertiary" />
                    <input
                      type="date"
                      required
                      value={launchDate}
                      onChange={(e) => setLaunchDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#18382b] font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-text-secondary font-bold">Requested Asset Type</label>
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#18382b] bg-white font-medium"
                  >
                    <option value="Flyers">Print Flyers</option>
                    <option value="Social Post">Instagram Social Post Card</option>
                    <option value="Email Blast">Just Listed Email Blast</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. Document Upload */}
          {legacyLink.linkType === 'document_upload' && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-text-tertiary uppercase block select-none">Outstanding Document Requirement</span>
                <p className="text-xs text-text-primary bg-stone-50 border border-stone-200 p-3 rounded-lg leading-normal font-bold">
                  {legacyLink.requiredFields[0]}
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-text-secondary font-bold">Confirm Property Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 102 Pine Street"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#18382b] font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-secondary font-bold">Upload Document File</label>
                  <div className="border-2 border-dashed border-stone-200 rounded-lg p-6 text-center hover:border-[#18382b] transition-all cursor-pointer">
                    <Upload className="w-6 h-6 text-text-tertiary mx-auto mb-2" />
                    <input
                      type="file"
                      id="secure-file-picker"
                      className="hidden"
                      onChange={(e) => setUploadFile(e.target.files?.[0]?.name || '')}
                    />
                    <label htmlFor="secure-file-picker" className="text-[10px] text-[#18382b] font-bold cursor-pointer">
                      {uploadFile ? `Selected: ${uploadFile}` : '[ Click to Browse Mock PDF ]'}
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-text-secondary font-bold">Notes / Comments</label>
                  <textarea
                    placeholder="Provide any context for the compliance partner..."
                    value={uploadComment}
                    onChange={(e) => setUploadComment(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#18382b] font-medium text-xs"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Sign Inventory Link */}
          {legacyLink.linkType === 'sign_request' && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-text-tertiary uppercase block select-none">Action Link</span>
                <p className="text-xs text-text-primary bg-stone-50 border border-stone-200 p-3 rounded-lg leading-normal font-bold">
                  Sign Installation Update
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-text-secondary font-bold">Action Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'install', label: 'Request Install' },
                      { id: 'confirm', label: 'Confirm Installed' },
                      { id: 'return', label: 'Request Return' }
                    ].map((act) => (
                      <button
                        type="button"
                        key={act.id}
                        onClick={() => setSignAction(act.id as any)}
                        className={`py-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          signAction === act.id
                            ? 'bg-[#eaf2ee] text-[#18382b] border-[#18382b]'
                            : 'border-stone-200 text-text-secondary hover:bg-stone-50'
                        }`}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-text-secondary font-bold">Property Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 109 Woodlawn Addendum"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#18382b] font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-text-secondary font-bold">Sign Type</label>
                  <select
                    value={signType}
                    onChange={(e) => setSignType(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#18382b] bg-white font-medium"
                  >
                    <option value="Premium Post Sign">Premium Post Sign</option>
                    <option value="Directional Sign">Directional Sign</option>
                    <option value="Lockbox Only">Lockbox Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 4. Review Request */}
          {legacyLink.linkType === 'review_request' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-serif font-bold text-base text-text-primary">Share Your Experience</h3>
                <p className="text-[10px] text-text-secondary font-medium leading-relaxed">
                  We’d be grateful if you shared your experience working with Nest Realty.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-center gap-1 select-none">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-6 h-6 ${
                          star <= reviewRating 
                            ? 'text-warning fill-warning' 
                            : 'text-stone-200'
                        }`} 
                      />
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-text-secondary font-bold">Your Feedback</label>
                  <textarea
                    required
                    placeholder="We appreciate your honest thoughts..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#18382b] font-medium text-xs"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#18382b] hover:bg-[#1f4938] text-white rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-xs font-bold"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting secure payload...' : 'Submit Response'}</span>
          </button>

          {/* Security Banner */}
          <div className="flex items-center justify-center gap-1.5 pt-2 text-[9px] text-text-tertiary select-none">
            <ShieldCheck className="w-3 h-3 text-[#18382b]" />
            <span>256-bit secure end-to-end sandbox payload transfer</span>
          </div>

        </form>

      </div>
    </div>
  );
}
