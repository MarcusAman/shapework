import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, Loader2, CheckCircle2, ShieldCheck, FileText, UserCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface PublicActivateAccountProps {
  onNavigate: (path: string) => void;
}

export default function PublicActivateAccount({ onNavigate }: PublicActivateAccountProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [invitationData, setInvitationData] = useState<any>(null);
  const [authoringRequest, setAuthoringRequest] = useState<any>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Extract token from URL path (/invite/:token or /author/activate/:token or ?token=)
    const pathParts = window.location.pathname.split('/');
    let rawTok = '';
    if (window.location.pathname.startsWith('/invite/')) {
      rawTok = pathParts[2] || '';
    } else if (window.location.pathname.startsWith('/author/activate/')) {
      rawTok = pathParts[3] || '';
    } else {
      const params = new URLSearchParams(window.location.search);
      rawTok = params.get('token') || '';
    }

    setToken(rawTok);

    if (!rawTok) {
      setErrorMsg('No invitation token was provided.');
      setLoading(false);
      return;
    }

    // Fetch invitation / authoring request details
    const fetchDetails = async () => {
      try {
        setLoading(true);
        // Try authoring request lookup first
        const sopRes = await fetch(`/api/sops/authoring-requests/by-token/${rawTok}`);
        if (sopRes.ok) {
          const sopData = await sopRes.json();
          if (sopData.success && sopData.request) {
            setAuthoringRequest(sopData.request);
          }
        }

        // Also check general invitation details
        const invRes = await fetch(`/api/auth/invitations/validate?token=${rawTok}`);
        if (invRes.ok) {
          const invData = await invRes.json();
          if (invData.success && invData.invitation) {
            setInvitationData(invData.invitation);
          }
        }
      } catch (err: any) {
        console.error('Failed to validate invitation token:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, []);

  const getPasswordStrength = () => {
    if (!password) return { label: 'Empty', color: 'bg-stone-200', score: 0 };
    let score = 0;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (password.length < 12) {
      return { label: 'Min 12 characters required', color: 'bg-red-400', score };
    }
    if (score <= 2) return { label: 'Weak', color: 'bg-amber-400', score };
    if (score === 3) return { label: 'Good', color: 'bg-blue-400', score };
    return { label: 'Strong & Compliant', color: 'bg-emerald-500', score };
  };

  const strength = getPasswordStrength();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Invalid or missing invitation token.');
      return;
    }

    if (!password || password.length < 12) {
      setErrorMsg('Password must be at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!agreedToTerms) {
      setErrorMsg('Please confirm agreement to workspace policies.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Activation failed. Please contact your brokerage owner.');
      }

      if (data.token) {
        localStorage.setItem('shapework_token', data.token);
        localStorage.setItem('shapework_user', JSON.stringify(data.user || {}));
      }

      // Redirect straight to authoring portal for this assignment
      if (token.startsWith('inv_sop_') || token.startsWith('inv_tok_')) {
        onNavigate(`/author/sop/${token}`);
      } else {
        onNavigate('/app/sops');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Activation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center font-sans text-xs text-stone-500">
        <Loader2 className="w-5 h-5 animate-spin text-[#00635C] mr-2" />
        Verifying secure invitation...
      </div>
    );
  }

  const assignedTitle = authoringRequest?.processName || 'Standard Operating Procedure';
  const assignedBy = authoringRequest?.requestedByName || 'Ryan Crecelius (Owner)';
  const invitedEmail = authoringRequest?.employeeEmail || invitationData?.email || 'staff@nestrealty.com';
  const assigneeName = authoringRequest?.employeeName || invitationData?.name || 'Staff Member';

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-stone-900 font-sans flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-[#E5EFEA] selection:text-[#00635C]">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00635C] flex items-center justify-center text-white font-serif font-bold text-base shadow-sm">
            N
          </div>
          <div>
            <span className="font-serif font-bold tracking-tight text-stone-900 text-sm">NEST REALTY</span>
            <span className="text-[11px] text-stone-500 font-medium ml-2">Wilmington Operations</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-stone-200 text-[11px] font-medium text-stone-600 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00635C]" />
          <span>Single-Use Secure Token</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full my-auto py-6">
        <motion.div
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8"
        >
          {/* Badge & Title */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E5EFEA] text-[#00635C] text-[11px] font-semibold tracking-wide uppercase mb-3">
              Staff SOP Contribution
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
              Activate your staff account
            </h1>
            <p className="text-stone-500 text-xs mt-1.5 leading-relaxed">
              Hello <span className="font-semibold text-stone-800">{assigneeName}</span>. Set your password to access the Nest Realty SOP Studio and document your assigned procedure with NORA.
            </p>
          </div>

          {/* Assignment Callout Box */}
          <div className="mb-6 p-4 rounded-xl bg-[#F7F8F5] border border-stone-200/80 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white border border-stone-200 text-[#00635C] mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
                  Assigned Procedure
                </div>
                <div className="font-semibold text-stone-900 text-sm mt-0.5">
                  {assignedTitle}
                </div>
                {authoringRequest?.processContext && (
                  <p className="text-stone-600 text-xs mt-1 italic">
                    "{authoringRequest.processContext}"
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/60 text-xs">
              <div>
                <span className="text-stone-500">Requested by: </span>
                <span className="font-medium text-stone-800">{assignedBy}</span>
              </div>
              <div>
                <span className="text-stone-500">Due Date: </span>
                <span className="font-medium text-stone-800">{authoringRequest?.dueDate || 'Within 7 days'}</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Work Email
              </label>
              <input
                type="email"
                readOnly
                disabled
                value={invitedEmail}
                className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-600 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-stone-500">Strength: {strength.label}</span>
                  <div className="flex gap-1 w-24">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full ${
                          strength.score >= step ? strength.color : 'bg-stone-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
              />
            </div>

            {/* Terms checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-[#00635C] focus:ring-[#00635C]"
                />
                <span className="text-[11px] text-stone-600 leading-relaxed">
                  I agree to create and maintain accurate operational procedures in accordance with Nest Realty Wilmington brokerage standards.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activating Account...</span>
                </>
              ) : (
                <>
                  <span>Activate & Start Documenting SOP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Role: <strong className="text-stone-700">SOP Contributor</strong></span>
            <span>Brokerage: <strong className="text-stone-700">Nest Realty NC</strong></span>
          </div>
        </motion.div>
      </main>

      {/* Page Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 text-[11px] text-stone-400">
        shapework. &copy; 2026. Secure Operational Intelligence for Real Estate Brokerages.
      </footer>
    </div>
  );
}
