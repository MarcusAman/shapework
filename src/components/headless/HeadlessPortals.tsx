import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, ShieldAlert, Upload, Send, FileText, Check, AlertCircle } from 'lucide-react';

interface BrandSettings {
  brokerageName: string;
  logoUrl?: string;
  primaryColor?: string;
  emailHeaderLogo?: string;
  secureActionPageBrand?: string;
  clientPortalBrand?: string;
  replyToEmail?: string;
  notificationFooter?: string;
}

// ----------------------------------------------------
// CLIENT DEAL PORTAL
// ----------------------------------------------------
export function ClientDealPortal({ token }: { token: string }) {
  const [brand, setBrand] = useState<BrandSettings>({ brokerageName: 'Nest Realty Wilmington', primaryColor: '#18382b' });
  const [error, setError] = useState<string | null>(null);
  const [deal, setDeal] = useState<any>({
    address: '109 Woodlawn Avenue, Wilmington, NC 28403',
    status: 'Compliance Audit',
    clientName: 'Jessica Keenan',
    documents: [
      { id: 'd1', name: 'Escrow Wire Receipt', status: 'Approved' },
      { id: 'd2', name: 'Seller Disclosures Addendum', status: 'Pending Upload' }
    ],
    messages: [
      { sender: 'Brokerage Operations', text: 'Please upload the signed Seller Disclosures Addendum to proceed with escrow release.', date: 'Today, 10:15 AM' }
    ]
  });
  const [reply, setReply] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/headless/branding')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.branding) {
          setBrand(data.branding);
        }
      });

    fetch(`/api/headless/client-portal/resolve/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Invalid or Expired Link');
        return res.json();
      })
      .then(data => {
        if (data.success && data.deal) {
          setDeal(data.deal);
        }
      })
      .catch(err => {
        setError(err.message);
      });
  }, [token]);

  const handleUpload = () => {
    setUploadedFile('seller_disclosures_signed.pdf');
    const updatedDocs = deal.documents.map((d: any) =>
      d.id === 'd2' ? { ...d, status: 'Uploaded' } : d
    );
    setDeal({ ...deal, documents: updatedDocs });
  };

  const handleSend = () => {
    if (!reply.trim()) return;
    const newMsg = { sender: 'You (Client)', text: reply, date: 'Just now' };
    setDeal({ ...deal, messages: [...deal.messages, newMsg] });
    setReply('');
  };

  const primaryColor = brand.primaryColor || '#18382b';

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans p-6 flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl shadow-lg p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-700 rounded-full flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-800">Secure Access Blocked</h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            This secure action link is invalid, expired, or has already been used. Please request a new access link from your brokerage coordinator.
          </p>
          <div className="text-[10px] text-stone-400 pt-4 border-t border-stone-100 select-none">
            Secure Action Layer · Powered by shapework.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans p-6 flex flex-col justify-between">
      <div className="max-w-2xl w-full mx-auto bg-white border border-stone-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 text-white text-left flex justify-between items-center" style={{ backgroundColor: primaryColor }}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">Client Deal Portal</span>
            <h1 className="text-lg font-bold mt-1">{brand.brokerageName}</h1>
          </div>
          <div className="font-mono text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
            Token: {token.substring(0, 6)}
          </div>
        </div>

        <div className="p-6 space-y-6 text-left">
          {/* Deal Status */}
          <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl space-y-2">
            <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono">Property Status</span>
            <div className="flex justify-between items-center">
              <strong className="text-sm font-extrabold text-stone-800">{deal.address}</strong>
              <span className="px-2.5 py-0.5 bg-[#eaf2ee] text-[#18382b] text-[10px] font-bold rounded-full select-none">{deal.status}</span>
            </div>
            <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden mt-3">
              <div className="h-full rounded-full" style={{ width: '75%', backgroundColor: primaryColor }} />
            </div>
          </div>

          {/* Requested Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">Required Documents</h3>
            <div className="space-y-2">
              {deal.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-stone-100 rounded-xl bg-white hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stone-400" />
                    <span className="text-xs font-semibold text-stone-700">{doc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      doc.status === 'Approved' ? 'bg-green-50 text-green-700' : doc.status === 'Uploaded' ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {doc.status}
                    </span>
                    {doc.status === 'Pending Upload' && (
                      <button onClick={handleUpload} className="p-1 hover:bg-stone-100 rounded cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-stone-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">Message History</h3>
            <div className="border border-stone-200 rounded-xl p-4 space-y-3 max-h-48 overflow-y-auto bg-stone-50/20">
              {deal.messages.map((m: any, idx: number) => (
                <div key={idx} className="text-xs space-y-0.5">
                  <div className="flex justify-between text-[10px] text-stone-500 font-bold select-none">
                    <span>{m.sender}</span>
                    <span>{m.date}</span>
                  </div>
                  <p className="bg-white border border-stone-100 p-2.5 rounded-lg font-medium text-stone-700 leading-relaxed shadow-sm">{m.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type reply to brokerage..."
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-stone-400"
              />
              <button
                onClick={handleSend}
                className="px-3.5 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center text-[10px] text-stone-400 mt-6 select-none">
        Secure Micro-portal managed by {brand.brokerageName} · Powered by shapework.
      </div>
    </div>
  );
}

// ----------------------------------------------------
// AGENT ACTION PORTAL
// ----------------------------------------------------
export function AgentActionPortal({ token }: { token: string }) {
  const [brand, setBrand] = useState<BrandSettings>({ brokerageName: 'Nest Realty Wilmington', primaryColor: '#18382b' });
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<any>(null);
  const [actionCompleted, setActionCompleted] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/headless/branding')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.branding) {
          setBrand(data.branding);
        }
      });

    fetch(`/api/headless/agent-portal/resolve/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Invalid or Expired Link');
        return res.json();
      })
      .then(data => {
        if (data.success && data.action) {
          setAction(data.action);
        }
      })
      .catch(err => {
        setError(err.message);
      });
  }, [token]);

  const handleAction = () => {
    setActionCompleted(true);
  };

  const primaryColor = brand.primaryColor || '#18382b';

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans p-6 flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl shadow-lg p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-700 rounded-full flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-800">Secure Access Blocked</h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            This secure action link is invalid, expired, or has already been used. Please request a new access link from your brokerage coordinator.
          </p>
          <div className="text-[10px] text-stone-400 pt-4 border-t border-stone-100 select-none">
            Secure Action Layer · Powered by shapework.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans p-6 flex flex-col justify-between">
      <div className="max-w-md w-full mx-auto bg-white border border-stone-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 text-white text-left flex justify-between items-center" style={{ backgroundColor: primaryColor }}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">Agent Action Portal</span>
            <h1 className="text-base font-bold mt-0.5">{brand.brokerageName}</h1>
          </div>
        </div>

        <div className="p-6 space-y-6 text-left">
          {actionCompleted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-green-50 text-green-700 rounded-full flex items-center justify-center mx-auto border border-green-200">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-stone-800">Action Acknowledged</h2>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">The brokerage administration office has been notified of your response. You can close this window.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono">Assigned Task</span>
                <h2 className="text-sm font-bold text-stone-800 mt-1">{action?.title || 'MLS Listing Upload Verification'}</h2>
                <p className="text-xs text-stone-500 mt-1">{action?.description || 'Please confirm that all compliance forms for 123 Oak Street are uploaded to MLS.'}</p>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl space-y-3">
                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block">Required Files</span>
                <div className="border-2 border-dashed border-stone-200 rounded-lg p-4 text-center cursor-pointer hover:bg-stone-100/50 transition-colors" onClick={() => setUploadedFile('mls_screenshot.png')}>
                  {uploadedFile ? (
                    <span className="text-xs font-semibold text-[#18382b] flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {uploadedFile}</span>
                  ) : (
                    <span className="text-xs text-stone-500 font-medium">Click to upload MLS Screenshot</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleAction}
                className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer text-center"
              >
                Confirm Verification
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="text-center text-[10px] text-stone-400 mt-6 select-none">
        Powered by shapework.
      </div>
    </div>
  );
}

// ----------------------------------------------------
// SMART INTAKE LINK
// ----------------------------------------------------
export function SmartIntakeLink({ type }: { type: string }) {
  const [brand, setBrand] = useState<BrandSettings>({ brokerageName: 'Nest Realty Wilmington', primaryColor: '#18382b' });
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/headless/branding')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.branding) {
          setBrand(data.branding);
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Call submit endpoint to generate Work Item
    try {
      await fetch('/api/headless/intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: desc,
          type
        })
      });
      setSubmitted(true);
    } catch {}
  };

  const primaryColor = brand.primaryColor || '#18382b';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans p-6 flex flex-col justify-between">
      <div className="max-w-md w-full mx-auto bg-white border border-stone-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 text-white text-left" style={{ backgroundColor: primaryColor }}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">Smart Intake Portal</span>
          <h1 className="text-base font-bold mt-0.5">{brand.brokerageName}</h1>
        </div>

        <div className="p-6 space-y-6 text-left">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-green-50 text-green-700 rounded-full flex items-center justify-center mx-auto border border-green-200">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-stone-800">Request Submitted</h2>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">Your request has been routed to the brokerage operations queue as a pending work item.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono block mb-1">Request Type</span>
                <span className="px-2.5 py-1 bg-stone-100 text-stone-700 text-[10px] font-bold rounded-full select-none capitalize">{type} Request</span>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono">Title / Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken office lockbox"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-stone-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider font-mono">Details / Description</label>
                <textarea
                  rows={4}
                  placeholder="Provide any additional context..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-stone-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer text-center"
              >
                Submit Request
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="text-center text-[10px] text-stone-400 mt-6 select-none">
        Powered by shapework.
      </div>
    </div>
  );
}
