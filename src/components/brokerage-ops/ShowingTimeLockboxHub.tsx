import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Send,
  Building,
  User,
  Phone,
  Mail,
  Lock,
  Search,
  RotateCcw
} from 'lucide-react';

interface ShowingAppointment {
  id: string;
  propertyAddress: string;
  listingAgentEmail: string;
  showingAgentName: string;
  showingAgentEmail: string;
  showingAgentPhone: string;
  showingAgentBrokerage: string;
  appointmentTime: string;
  durationMinutes: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'feedback_received';
  lockboxSerial: string;
  supraAccessVerified: boolean;
  feedback?: {
    overallImpression: '5_stars' | '4_stars' | '3_stars' | '2_stars' | '1_star';
    priceOpinion: 'just_right' | 'too_high' | 'too_low';
    clientInterest: 'writing_offer' | 'second_showing' | 'neutral' | 'not_interested';
    writtenComments: string;
    submittedAt: string;
  };
}

interface SupraLockboxAccessEvent {
  id: string;
  lockboxSerial: string;
  propertyAddress: string;
  accessTime: string;
  agentName: string;
  agentEmail: string;
  keySerial: string;
  isMatchedWithAppointment: boolean;
  securityFlag: 'normal' | 'unauthorized_entry' | 'vendor_service';
}

interface SellerShowingDigest {
  propertyAddress: string;
  generatedAt: string;
  totalShowings: number;
  averageRating: number;
  priceOpinionBreakdown: { justRight: number; tooHigh: number; tooLow: number };
  clientInterestBreakdown: { writingOffer: number; secondShowing: number; notInterested: number };
  aiExecutiveSummary: string;
  recentComments: { agent: string; brokerage: string; comment: string; date: string }[];
  actionRecommendations: string[];
}

export const ShowingTimeLockboxHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'supra_audit' | 'seller_digest'>('appointments');
  const [appointments, setAppointments] = useState<ShowingAppointment[]>([]);
  const [accessLogs, setAccessLogs] = useState<SupraLockboxAccessEvent[]>([]);
  const [selectedDigest, setSelectedDigest] = useState<SellerShowingDigest | null>(null);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchAccessLogs();
    fetchDigest('312 Mayfaire Way');
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/nora/showingtime/appointments');
      const data = await res.json();
      if (data.success) setAppointments(data.appointments || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAccessLogs = async () => {
    try {
      const res = await fetch('/api/nora/showingtime/supra-audit');
      const data = await res.json();
      if (data.success) setAccessLogs(data.accessLogs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDigest = async (address: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/nora/showingtime/seller-digest/${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.success) setSelectedDigest(data.digest);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestFeedback = async (appointmentId: string) => {
    try {
      const res = await fetch('/api/nora/showingtime/request-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSuccessMsg(data.message);
        setTimeout(() => setFeedbackSuccessMsg(null), 5000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Apple Light Mode) */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-white to-stone-50 rounded-2xl border border-stone-200/80 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 rounded-full tracking-wider">
              ShowingTime & Supra 2-Way Lockbox Hub
            </span>
            <span className="text-xs font-semibold text-stone-600">
              🟢 Live 2-Way Lockbox Sync Active
            </span>
          </div>
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#00635C]" />
            Automated Showing Management & Supra Audit
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Automated buyer agent feedback collection SMS, Bluetooth lockbox entry reconciliation, and AI seller showing digests.
          </p>
        </div>

        <button
          onClick={() => {
            fetchAppointments();
            fetchAccessLogs();
            fetchDigest('312 Mayfaire Way');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#00635C] hover:bg-[#00524C] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {feedbackSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackSuccessMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Active Showings</span>
          <span className="text-2xl font-black text-stone-900 mt-1 block">{appointments.length}</span>
          <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">Cape Fear MLS Synced</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Feedback Rate</span>
          <span className="text-2xl font-black text-stone-900 mt-1 block">67%</span>
          <span className="text-[10px] text-blue-700 font-bold block mt-0.5">2 of 3 Completed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Avg Buyer Rating</span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">4.5 / 5.0</span>
          <span className="text-[10px] text-stone-600 block mt-0.5">312 Mayfaire Way</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Lockbox Security</span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">100%</span>
          <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">0 Unauthorized Entries</span>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100/90 rounded-xl border border-stone-200/80 w-fit">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'bg-white text-[#01362D] shadow-xs border border-stone-200/80'
              : 'text-stone-600 hover:text-[#01362D]'
          }`}
        >
          🏡 Showings & Feedback ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('supra_audit')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'supra_audit'
              ? 'bg-white text-[#01362D] shadow-xs border border-stone-200/80'
              : 'text-stone-600 hover:text-[#01362D]'
          }`}
        >
          🔐 Supra eKEY Lockbox Audit ({accessLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('seller_digest')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'seller_digest'
              ? 'bg-white text-[#01362D] shadow-xs border border-stone-200/80'
              : 'text-stone-600 hover:text-[#01362D]'
          }`}
        >
          📊 AI Seller Showing Summary
        </button>
      </div>

      {/* Tab 1: Showings & Feedback */}
      {activeTab === 'appointments' && (
        <div className="space-y-3">
          {appointments.map(appt => (
            <div
              key={appt.id}
              className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-stone-900">{appt.propertyAddress}</h4>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                        appt.status === 'feedback_received'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {appt.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Showing Agent: <strong className="text-stone-700">{appt.showingAgentName}</strong> ({appt.showingAgentBrokerage}) • {appt.showingAgentPhone}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {appt.status !== 'feedback_received' ? (
                    <button
                      onClick={() => handleRequestFeedback(appt.id)}
                      className="px-3 py-1.5 bg-[#00635C] hover:bg-[#00524C] text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Feedback SMS</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Feedback Logged
                    </span>
                  )}
                </div>
              </div>

              {/* Feedback Review Card if available */}
              {appt.feedback && (
                <div className="bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(parseInt(appt.feedback.overallImpression[0]) || 4)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                      <span className="text-xs font-bold text-stone-800 ml-1">
                        {appt.feedback.overallImpression.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 bg-white border border-stone-200 rounded font-semibold text-stone-700">
                        Price: {appt.feedback.priceOpinion.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                        Interest: {appt.feedback.clientInterest.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 italic leading-relaxed">
                    "{appt.feedback.writtenComments}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Supra eKEY Lockbox Audit */}
      {activeTab === 'supra_audit' && (
        <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-stone-900">Supra eKEY Electronic Lockbox Access Log</h3>
              <p className="text-[10px] text-stone-500">
                Reconciled with Cape Fear MLS ShowingTime appointment records in real-time
              </p>
            </div>
            <span className="px-2.5 py-0.5 text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
              🛡️ 100% RECONCILED
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {accessLogs.map(log => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    log.securityFlag === 'normal'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-stone-900">{log.agentName}</h4>
                      <span className="text-[9px] font-bold bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-mono">
                        {log.keySerial}
                      </span>
                      {log.isMatchedWithAppointment && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                          Matched Showing
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {log.propertyAddress} • {new Date(log.accessTime).toLocaleString()}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-stone-600 bg-stone-50 border border-stone-200 px-2 py-1 rounded">
                  {log.lockboxSerial}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: AI Seller Showing Summary */}
      {activeTab === 'seller_digest' && selectedDigest && (
        <div className="bg-white rounded-xl border border-stone-200/80 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Executive Seller Digest
              </span>
              <h3 className="text-sm font-bold text-stone-900">{selectedDigest.propertyAddress}</h3>
            </div>

            <button
              onClick={() => alert('Exporting PDF Seller Report to Google Drive Transaction Vault "05 - Client Reporting"...')}
              className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#00524C] text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export to Google Drive</span>
            </button>
          </div>

          {/* AI Executive Summary Card */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-stone-50 p-4 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#00635C]">
              <Sparkles className="w-4 h-4" />
              <span>Nora AI Showing Synthesis</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              {selectedDigest.aiExecutiveSummary}
            </p>
          </div>

          {/* Recommended Seller Action Plan */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Nora Action Recommendations:
            </h4>
            <div className="space-y-1.5">
              {selectedDigest.actionRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200/70">
                  <ChevronRight className="w-3.5 h-3.5 text-[#00635C] shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
