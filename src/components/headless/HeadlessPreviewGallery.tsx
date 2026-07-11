import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Monitor, Smartphone, Copy, Check, Send, AlertTriangle, ShieldAlert } from 'lucide-react';

interface TemplateMetadata {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'both';
}

const TEMPLATE_LIST: TemplateMetadata[] = [
  { id: 'client_portal_invite', name: 'Client Deal Invitation', channel: 'both' },
  { id: 'agent_action_portal', name: 'Agent Action Notification', channel: 'both' },
  { id: 'smart_intake_link', name: 'Smart Intake Portal Link', channel: 'both' },
  { id: 'owner_shield_review', name: 'Owner Shield Deflection Log', channel: 'both' },
  { id: 'triage_low_confidence', name: 'Triage Low-Confidence Alert', channel: 'both' },
  { id: 'webhook_delivery_failure', name: 'Webhook Delivery Failure', channel: 'both' },
  { id: 'upload_received', name: 'Document Upload Confirmation', channel: 'both' },
  { id: 'deal_status_changed', name: 'Transaction Status Update', channel: 'both' },
  { id: 'compliance_issue_flagged', name: 'Compliance Issue Correction', channel: 'both' },
  { id: 'support_request_received', name: 'Help Desk Acknowledgment', channel: 'both' },
  { id: 'pilot_welcome', name: 'Pilot Welcome / Activation', channel: 'both' }
];

export default function HeadlessPreviewGallery() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('client_portal_invite');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'sms'>('desktop');
  const [darkBackground, setDarkBackground] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>('');
  const [emailHtml, setEmailHtml] = useState<string>('');
  const [smsBody, setSmsBody] = useState<string>('');
  
  const [copiedSubject, setCopiedSubject] = useState<boolean>(false);
  const [copiedBody, setCopiedBody] = useState<boolean>(false);
  const [testEmail, setTestEmail] = useState<string>('marcus@shapework.co');
  
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState<boolean>(false);

  const [authorized, setAuthorized] = useState<boolean>(true);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Parse token from URL
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token') || '';

  useEffect(() => {
    // Verify preview token on load
    fetch(`/api/headless/verify-preview-token?token=${token}`)
      .then(res => {
        if (res.ok) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
        setCheckingAuth(false);
      })
      .catch(() => {
        setAuthorized(false);
        setCheckingAuth(false);
      });
  }, [token]);

  useEffect(() => {
    if (!authorized) return;
    
    // Fetch template previews
    fetch(`/api/headless/notification-previews?type=${selectedTemplate}&token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSubject(data.subject);
          setEmailHtml(data.html);
          setSmsBody(data.smsBody);
        }
      });
  }, [selectedTemplate, authorized, token]);

  const handleCopySubject = () => {
    navigator.clipboard.writeText(subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyBody = () => {
    const textToCopy = previewMode === 'sms' ? smsBody : emailHtml;
    navigator.clipboard.writeText(textToCopy);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim() || sending) return;

    setSending(true);
    setSendSuccess(null);
    setSendError(null);

    fetch('/api/headless/notification-previews/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: selectedTemplate,
        recipientEmail: testEmail.trim()
      })
    })
      .then(async res => {
        const data = await res.json();
        if (res.ok) {
          setSendSuccess(`Test email sent successfully! Message ID: ${data.messageId}`);
        } else {
          setSendError(data.error || 'Failed to dispatch test send.');
        }
      })
      .catch(err => {
        setSendError(err.message || 'Network error occurred.');
      })
      .finally(() => {
        setSending(false);
      });
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans text-xs text-stone-500 animate-pulse">
        Verifying secure preview token...
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans p-6 flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl shadow-lg p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-700 rounded-full flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-800">Preview Unauthorized</h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            Accessing notification previews in production requires a valid secure environment token parameter.
          </p>
          <div className="text-[10px] text-stone-400 pt-4 border-t border-stone-100 select-none">
            Secure Preview Gate · Powered by shapework.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 font-sans flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <div className="w-full md:w-80 bg-white border-r border-stone-200 flex flex-col h-auto md:h-screen sticky top-0 overflow-y-auto">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#18382b] inline-block animate-pulse" />
            <h1 className="text-sm font-black tracking-wider text-stone-900 uppercase">shapework.</h1>
          </div>
          <span className="text-[10px] text-stone-400 font-bold block mt-1 uppercase tracking-widest font-mono">Notification Template Gallery</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {TEMPLATE_LIST.map(tmpl => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#18382b] text-white shadow-md'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <span>{tmpl.name}</span>
                <div className="flex items-center gap-1">
                  <Mail className={`w-3.5 h-3.5 ${isSelected ? 'text-white/60' : 'text-stone-300'}`} />
                  <MessageSquare className={`w-3.5 h-3.5 ${isSelected ? 'text-white/60' : 'text-stone-300'}`} />
                </div>
              </button>
            );
          })}
        </nav>

        {/* Branding indicator */}
        <div className="p-4 bg-stone-50 border-t border-stone-200/60 text-[10px] text-stone-400 font-semibold select-none">
          Active Theme: Nest Realty Brand Accent
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-auto md:h-screen">
        {/* Header Controls */}
        <div className="bg-white border-b border-stone-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1 text-left">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest font-mono">Active Subject Line</span>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-900 leading-none">{subject}</h2>
              <button
                onClick={handleCopySubject}
                className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                title="Copy subject line"
              >
                {copiedSubject ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Selectors */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200/60">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  previewMode === 'desktop' ? 'bg-white shadow text-stone-900' : 'text-stone-400 hover:text-stone-600'
                }`}
                title="Desktop Email"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  previewMode === 'mobile' ? 'bg-white shadow text-stone-900' : 'text-stone-400 hover:text-stone-600'
                }`}
                title="Mobile Email"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('sms')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  previewMode === 'sms' ? 'bg-white shadow text-stone-900' : 'text-stone-400 hover:text-stone-600'
                }`}
                title="SMS Notification"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle light/dark preview BG */}
            {previewMode !== 'sms' && (
              <button
                onClick={() => setDarkBackground(!darkBackground)}
                className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 cursor-pointer transition-colors"
              >
                {darkBackground ? 'Light Background' : 'Dark Background'}
              </button>
            )}

            <button
              onClick={handleCopyBody}
              className="text-[10px] font-bold bg-stone-900 text-white px-3.5 py-1.5 rounded-lg hover:bg-stone-800 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              {copiedBody ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {previewMode === 'sms' ? 'Copy SMS' : 'Copy HTML'}
            </button>
          </div>
        </div>

        {/* Content Viewer Frame */}
        <div className={`flex-1 overflow-auto p-8 flex items-center justify-center transition-colors duration-300 ${
          darkBackground ? 'bg-stone-900' : 'bg-stone-100'
        }`}>
          {previewMode === 'desktop' && (
            <div className="w-full max-w-4xl bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden h-[calc(100vh-280px)]">
              <iframe
                title="Desktop Template Preview"
                srcDoc={emailHtml}
                className="w-full h-full border-none"
              />
            </div>
          )}

          {previewMode === 'mobile' && (
            <div className="w-[375px] h-[640px] bg-stone-950 border-[10px] border-stone-850 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col">
              {/* Phone Speaker Notch */}
              <div className="w-28 h-4 bg-stone-950 rounded-b-xl absolute top-0 left-1/2 transform -translate-x-1/2 z-20" />
              <div className="flex-1 bg-white pt-4 overflow-hidden">
                <iframe
                  title="Mobile Template Preview"
                  srcDoc={emailHtml}
                  className="w-full h-full border-none"
                />
              </div>
            </div>
          )}

          {previewMode === 'sms' && (
            <div className="w-[320px] bg-stone-50 border border-stone-200 rounded-3xl shadow-xl p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-stone-150 pb-2 text-[10px] font-bold text-stone-500 select-none">
                <span>SMS Notification Preview</span>
                <span>shapework.</span>
              </div>
              <div className="space-y-1 text-left">
                <span className="text-[8px] font-bold text-stone-400 font-mono block">Outbound Message</span>
                <div className="bg-[#18382b] text-white p-3 rounded-2xl rounded-tl-sm text-xs leading-relaxed max-w-[260px] font-semibold">
                  {smsBody}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Testing / Actions Panel */}
        <div className="bg-white border-t border-stone-200 p-6">
          <form onSubmit={handleSendTest} className="max-w-xl mx-auto flex flex-col gap-3">
            <div className="flex flex-col text-left">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest font-mono mb-1">
                Test Outbound Email Sending
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="marcus@shapework.co"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-stone-400"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-850 cursor-pointer flex items-center gap-1.5 transition-colors disabled:bg-stone-300"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Sending...' : 'Send Preview'}
                </button>
              </div>
            </div>

            {sendSuccess && (
              <p className="text-[10px] font-bold text-green-700 bg-green-50 px-3 py-1.5 border border-green-150 rounded-lg text-left">
                {sendSuccess}
              </p>
            )}
            {sendError && (
              <div className="flex gap-1.5 bg-red-50 text-red-700 px-3 py-2 border border-red-150 rounded-lg text-left text-[10px] font-semibold leading-relaxed">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{sendError}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
