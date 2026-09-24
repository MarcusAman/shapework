import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Send, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  FileText, 
  ShieldCheck, 
  RefreshCw,
  CornerDownRight,
  PhoneCall,
  UserCheck
} from 'lucide-react';

interface TrackerTimelineStage {
  id: string;
  label: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current?: boolean;
}

interface TrackerNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface TaskTrackerRecord {
  token: string;
  ticketId: string;
  callId?: string;
  callerName: string;
  phone?: string;
  email?: string;
  propertyAddress: string;
  category: string;
  fourPointSummary: {
    callerNeed: string;
    noraAction: string;
    routedTo: string;
    estimatedDelivery: string;
  };
  status: 'received' | 'routed' | 'in_progress' | 'completed';
  currentStepIndex: number;
  stages: TrackerTimelineStage[];
  notes: TrackerNote[];
  callbackRequested?: boolean;
  callbackRequestedAt?: string;
  createdAt: string;
  targetSla: string;
  slaRemainingMinutes: number;
  isMarketingRequest?: boolean;
  deliverables?: string[];
  assignedLead?: string;
  assignedProducer?: string;
  photos?: Array<{ id: string; name: string; url: string; type?: string; sizeBytes?: number }>;
  externalLinks?: Array<{ url: string; title: string; type: string }>;
}

export const TaskTrackerPage: React.FC<{ token?: string }> = ({ token: tokenProp }) => {
  const token = tokenProp || (typeof window !== 'undefined' 
    ? (window.location.pathname.split('/track/marketing/')[1]?.split('?')[0] 
       || window.location.pathname.split('/tracker/')[1]?.split('?')[0] 
       || window.location.pathname.split('/track/')[1]?.split('?')[0]) 
    : '');
  const [tracker, setTracker] = useState<TaskTrackerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [requestingCallback, setRequestingCallback] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isMissingToken = !token || token === 'status' || token === 'marketing';

  const fetchTracker = async () => {
    if (isMissingToken) {
      setError('missing_token');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/tracker/${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.success && data.tracker) {
        setTracker(data.tracker);
        setError(null);
      } else {
        setError(data.error || 'Tracker record not found.');
      }
    } catch (err: any) {
      setError('Unable to load tracker. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracker();
    if (isMissingToken) return;
    const interval = setInterval(fetchTracker, 15000); // Polling every 15s for real-time status
    return () => clearInterval(interval);
  }, [token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch(`/api/tracker/${token}/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            fileBase64: base64
          })
        });
        const data = await res.json();
        if (data.success && data.tracker) {
          setTracker(data.tracker);
          setToastMsg('✓ Photo uploaded and linked to marketing package!');
          setTimeout(() => setToastMsg(null), 4000);
        } else {
          setToastMsg('Failed to upload photo.');
          setTimeout(() => setToastMsg(null), 4000);
        }
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setToastMsg('Upload error. Please try again.');
      setTimeout(() => setToastMsg(null), 4000);
      setUploadingPhoto(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !token) return;

    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/tracker/${token}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: tracker?.callerName || 'Caller',
          content: newNote.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.tracker) {
        setTracker(data.tracker);
        setNewNote('');
        setShowNoteModal(false);
        setToastMsg('✓ Note added to live ticket!');
        setTimeout(() => setToastMsg(null), 4000);
      }
    } catch (err) {
      setToastMsg('Failed to add note. Please try again.');
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleRequestCallback = async () => {
    if (!token) return;
    setRequestingCallback(true);
    try {
      const res = await fetch(`/api/tracker/${token}/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: tracker?.phone })
      });
      const data = await res.json();
      if (data.success && data.tracker) {
        setTracker(data.tracker);
        setToastMsg('🚨 Priority callback requested! Ops team alerted.');
        setTimeout(() => setToastMsg(null), 5000);
      }
    } catch (err) {
      setToastMsg('Failed to request callback.');
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setRequestingCallback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#00635C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Connecting to live Nest Ops tracker...</p>
        </div>
      </div>
    );
  }

  if (error || !tracker) {
    const isMissing = error === 'missing_token';
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
          <div className={`w-12 h-12 rounded-full ${isMissing ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-600'} flex items-center justify-center mx-auto`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {isMissing ? 'Open your Nest workspace' : 'Tracker Record Not Found'}
          </h2>
          <p className="text-xs text-slate-500">
            {isMissing
              ? 'This email did not include a task-specific tracking link. Open your Nest workboard to see live marketing status.'
              : 'This tracking link may have expired or is invalid. Please check your SMS or call our operations hotline.'}
          </p>
          <a
            href={isMissing ? 'https://shapework.co/app/workboard' : 'tel:+19105072047'}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00635C] text-white rounded-xl text-xs font-bold shadow-sm"
          >
            {isMissing ? (
              <span>Open Nest Workboard</span>
            ) : (
              <>
                <Phone className="w-4 h-4" />
                <span>Call Hotline: +1 (910) 507-2047</span>
              </>
            )}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#00635C] text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00635C] text-white flex items-center justify-center font-black text-sm">
              N
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900 block leading-tight">NEST OPS</span>
              <span className="text-[10px] text-slate-400 font-mono">Live Ticket Tracker</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#00635C] border border-emerald-200 font-mono text-xs font-bold">
              {tracker.ticketId}
            </span>
            <button
              type="button"
              onClick={fetchTracker}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              title="Refresh status"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {/* Headline Card with Property & Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E5EFEA] text-[#00635C] uppercase tracking-wider">
              {tracker.category.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
              <Clock className="w-3 h-3" />
              <span>SLA Target: {tracker.fourPointSummary.estimatedDelivery}</span>
            </div>
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#00635C] shrink-0" />
              <span>{tracker.propertyAddress}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Caller: <strong>{tracker.callerName}</strong> • Logged via Voice Hotline
            </p>
          </div>

          {tracker.callbackRequested && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-amber-800 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                Priority Callback Flagged for Lead
              </span>
              <span className="text-[10px] text-amber-600 font-mono">Queued</span>
            </div>
          )}
        </div>

        {/* 4-Stage Visual Progress Stepper */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400">Live Progress Status</h2>
          
          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {tracker.stages.map((stage, idx) => {
              const isPast = stage.completed && !stage.current;
              const isCurrent = stage.current || (!stage.completed && idx === tracker.currentStepIndex);
              return (
                <div key={stage.id} className="relative flex items-start gap-3.5 z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    isPast ? 'bg-[#00635C] border-[#00635C] text-white shadow-xs' :
                    isCurrent ? 'bg-white border-[#00635C] text-[#00635C] ring-4 ring-[#00635C]/15 animate-pulse' :
                    'bg-slate-100 border-slate-300 text-slate-400'
                  }`}>
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-xs font-bold ${isCurrent ? 'text-[#00635C]' : isPast ? 'text-slate-900' : 'text-slate-400'}`}>
                        {stage.label}
                      </h3>
                      {stage.timestamp && (
                        <span className="text-[10px] font-mono text-slate-400">{stage.timestamp}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deliverables Section (for marketing requests) */}
        {tracker.deliverables && tracker.deliverables.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400">Requested Deliverables</h2>
            <div className="flex flex-wrap gap-2">
              {tracker.deliverables.map((deliv, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00635C]" />
                  <span>{deliv}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Property Photos & Linked Assets */}
        {((tracker.photos && tracker.photos.length > 0) || (tracker.externalLinks && tracker.externalLinks.length > 0)) && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900">
                Property Photos & Assets ({((tracker.photos?.length || 0) + (tracker.externalLinks?.length || 0))})
              </h2>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="text-[11px] font-bold text-[#00635C] hover:underline cursor-pointer"
              >
                {uploadingPhoto ? 'Uploading...' : '+ Upload Photo'}
              </button>
            </div>

            {/* Photos Thumbnail Grid */}
            {tracker.photos && tracker.photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {tracker.photos.map((p, idx) => (
                  <div key={p.id || idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-1.5 text-[9px] text-white truncate font-medium">
                      {p.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* External Links List */}
            {tracker.externalLinks && tracker.externalLinks.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {tracker.externalLinks.map((l, idx) => (
                  <a
                    key={idx}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{l.title}</span>
                    </span>
                    <span className="text-[10px] text-[#00635C] font-bold">Open Link ↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4-Point Operational Action Summary Callout */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00635C]" />
              <span>{tracker.isMarketingRequest ? 'Collateral Production Specs' : 'Nora 4-Point Action Summary'}</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">{tracker.isMarketingRequest ? 'Marketing Suite' : 'Post-Call Brief'}</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1">
                <span>1️⃣ What You Need</span>
              </div>
              <p className="text-xs font-medium text-slate-800 leading-relaxed">
                {tracker.fourPointSummary.callerNeed}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#00635C] flex items-center gap-1">
                <span>2️⃣ What I'm Doing (Nora)</span>
              </div>
              <p className="text-xs font-medium text-slate-800 leading-relaxed">
                {tracker.fourPointSummary.noraAction}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                <span>3️⃣ Assigned Lead</span>
              </div>
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>{tracker.fourPointSummary.routedTo}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <span>4️⃣ Estimated Time for Delivery</span>
              </div>
              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>{tracker.fourPointSummary.estimatedDelivery}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Interactive Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setShowNoteModal(true)}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between"
          >
            <MessageSquare className="w-4 h-4 text-[#00635C] mb-1.5" />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Add Note</span>
              <span className="text-[10px] text-slate-500">Provide instructions or feedback</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between"
          >
            <FileText className="w-4 h-4 text-[#00635C] mb-1.5" />
            <div>
              <span className="font-bold text-xs text-slate-900 block">
                {uploadingPhoto ? 'Uploading...' : 'Upload Photos'}
              </span>
              <span className="text-[10px] text-slate-500">Attach listing photography</span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Activity & Notes Stream */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900">Ticket Activity & Notes ({tracker.notes.length})</h2>
            <button
              type="button"
              onClick={() => setShowNoteModal(true)}
              className="text-[11px] font-bold text-[#00635C] hover:underline"
            >
              + Add Note
            </button>
          </div>

          <div className="space-y-2.5">
            {tracker.notes.map((n) => (
              <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-700">{n.author}</span>
                  <span className="text-slate-400 font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-800 font-normal leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support & Hotline Contact Footer */}
        <div className="p-4 bg-stone-100 rounded-2xl text-center space-y-2 text-xs text-stone-600 border border-stone-200">
          <p className="font-semibold text-stone-800">Need immediate assistance with this listing?</p>
          <a
            href="tel:+19105072047"
            className="inline-flex items-center gap-1.5 text-[#00635C] font-bold hover:underline"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Nora Hotline: +1 (910) 507-2047</span>
          </a>
        </div>
      </main>

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Add Note to Ticket {tracker.ticketId}</h3>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type your instructions, gate code, or updates here..."
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00635C] focus:bg-white outline-hidden"
                required
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{submittingNote ? 'Saving...' : 'Submit Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
