/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AgentRetentionHub
 * Consolidates:
 * - [25] Agent Happiness Monitor & Distress Radar
 * - [22] Agent Birthday & Life Event CRM
 * - [7] Agent Help Video Library
 */

import React, { useState, useEffect } from 'react';
import {
  HeartHandshake, Cake, Video, AlertTriangle, ShieldCheck,
  Calendar, Gift, Send, Play, Search, UserCheck, Coffee,
  Sparkles, CheckCircle2, RefreshCw, X, MessageSquare, Clock
} from 'lucide-react';
import type { AgentHappinessSignal, AgentLifeEvent, AgentHelpVideo } from '../../../server/persistence/opportunityRegisterRepository';

export const AgentRetentionHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'happiness' | 'life_events' | 'videos'>('happiness');
  const [signals, setSignals] = useState<AgentHappinessSignal[]>([]);
  const [lifeEvents, setLifeEvents] = useState<AgentLifeEvent[]>([]);
  const [videos, setVideos] = useState<AgentHelpVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<AgentHelpVideo | null>(null);

  // Outreach Modal
  const [selectedAgentForOutreach, setSelectedAgentForOutreach] = useState<AgentHappinessSignal | null>(null);
  const [outreachLeader, setOutreachLeader] = useState('Jessica Keenan (BIC — Mayfaire)');
  const [outreachNote, setOutreachNote] = useState('Scheduled 1-on-1 coffee to discuss multiple-offer negotiation strategy.');
  const [outreachSubmitting, setOutreachSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSignals, resEvents, resVideos] = await Promise.all([
        fetch('/api/retention/happiness-signals').then(r => r.json()),
        fetch('/api/retention/life-events').then(r => r.json()),
        fetch('/api/resources/videos').then(r => r.json())
      ]);

      if (resSignals.success) setSignals(resSignals.signals);
      if (resEvents.success) setLifeEvents(resEvents.events);
      if (resVideos.success) setVideos(resVideos.videos);
    } catch (err) {
      console.error('Failed to load retention data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendLifeEventTouch = async (eventId: string) => {
    try {
      const res = await fetch('/api/retention/life-events/send-touch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, senderName: 'Ryan Crecelius (Owner)' })
      });
      const data = await res.json();
      if (data.success) {
        setLifeEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'sent', sentAt: new Date().toISOString() } : e));
      }
    } catch (err) {
      console.error('Failed to send life event touch:', err);
    }
  };

  const handleRecordOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentForOutreach) return;
    try {
      setOutreachSubmitting(true);
      const res = await fetch('/api/retention/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentForOutreach.agentId,
          performedBy: outreachLeader,
          note: outreachNote
        })
      });
      const data = await res.json();
      if (data.success) {
        setSignals(prev => prev.map(s => s.agentId === selectedAgentForOutreach.agentId ? data.signal : s));
        setSelectedAgentForOutreach(null);
      }
    } catch (err) {
      console.error('Failed to record leadership outreach:', err);
    } finally {
      setOutreachSubmitting(false);
    }
  };

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left select-none font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#00635C] text-[11px] font-semibold tracking-wide">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Agent Retention & Care Hub</span>
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-900 mt-1.5">
            Agent Happiness, Life Events & Knowledge Hub
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 max-w-3xl leading-relaxed">
            Proactive retention distress signals, milestone celebrations, and video walkthroughs across all 74 Nest agents.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('happiness')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'happiness' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Happiness Radar</span>
          </button>
          <button
            onClick={() => setActiveTab('life_events')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'life_events' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Cake className="w-3.5 h-3.5" />
            <span>Life Events CRM</span>
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'videos' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Help Video Library</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-stone-500 font-sans space-y-2">
          <RefreshCw className="w-6 h-6 text-stone-400 animate-spin mx-auto" />
          <div className="text-xs font-semibold">Loading Agent Retention Intelligence...</div>
        </div>
      ) : (
        <>
          {/* TAB 1: AGENT HAPPINESS RADAR */}
          {activeTab === 'happiness' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F7F8F5] rounded-2xl border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-stone-900">Multi-Factor Distress Scoring Engine</div>
                  <div className="text-[11px] text-stone-500">
                    Monitors multiple-offer losses, 45d inactivity, and compliance friction to trigger proactive leadership touches.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                    1 High Distress
                  </span>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                    1 Moderate Friction
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                    72 Healthy
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {signals.map((sig) => (
                  <div
                    key={sig.agentId}
                    className={`p-5 rounded-2xl border bg-white shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                      sig.riskTier === 'high_distress'
                        ? 'border-rose-200 hover:border-rose-300 ring-1 ring-rose-100'
                        : sig.riskTier === 'moderate_friction'
                        ? 'border-amber-200 hover:border-amber-300'
                        : 'border-stone-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sig.riskTier === 'high_distress'
                            ? 'bg-rose-100 text-rose-800'
                            : sig.riskTier === 'moderate_friction'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {sig.riskTier.replace(/_/g, ' ')}
                        </span>
                        <div className="font-mono text-xs font-bold text-stone-900">
                          {sig.distressScore} / 100 Index
                        </div>
                      </div>

                      <div>
                        <h3 className="font-serif font-bold text-base text-stone-900">{sig.agentName}</h3>
                        <p className="text-[11px] text-stone-500 font-medium">{sig.office}</p>
                      </div>

                      <p className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-100 italic leading-relaxed">
                        "{sig.recentSentiment}"
                      </p>

                      <div className="grid grid-cols-3 gap-1 text-[10px] text-center pt-1">
                        <div className="p-1.5 bg-stone-50 rounded-lg border border-stone-100">
                          <div className="text-stone-400 font-semibold">STALLED</div>
                          <div className="font-bold text-stone-900 text-xs mt-0.5">{sig.stalledDealsCount}</div>
                        </div>
                        <div className="p-1.5 bg-stone-50 rounded-lg border border-stone-100">
                          <div className="text-stone-400 font-semibold">INACTIVE</div>
                          <div className="font-bold text-stone-900 text-xs mt-0.5">{sig.daysSinceLastActivity}d</div>
                        </div>
                        <div className="p-1.5 bg-stone-50 rounded-lg border border-stone-100">
                          <div className="text-stone-400 font-semibold">ESCALATIONS</div>
                          <div className="font-bold text-stone-900 text-xs mt-0.5">{sig.complianceEscalationCount}</div>
                        </div>
                      </div>

                      <div className="text-[11px] text-stone-600 space-y-0.5 pt-1">
                        <div className="font-bold text-stone-800">Recommended Move:</div>
                        <p className="text-stone-600 leading-snug">{sig.recommendedAction}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      {sig.lastLeadershipOutreachAt ? (
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Contacted {sig.lastLeadershipOutreachAt.slice(0, 10)}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400">Outreach pending</span>
                      )}

                      <button
                        onClick={() => setSelectedAgentForOutreach(sig)}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Coffee className="w-3.5 h-3.5 text-amber-300" />
                        <span>Schedule Outreach</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AGENT BIRTHDAYS & LIFE EVENTS CRM */}
          {activeTab === 'life_events' && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                      <Cake className="w-4 h-4 text-pink-500" />
                      <span>Upcoming Agent Celebrations & Milestones</span>
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Never let a birthday, work anniversary, or $10M production record pass unnoticed.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-stone-100">
                  {lifeEvents.map((evt) => (
                    <div key={evt.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-pink-50 text-pink-700 font-bold border border-pink-100 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">{evt.agentName}</span>
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full font-semibold text-[10px]">
                              {evt.eventDate}
                            </span>
                          </div>
                          <div className="text-stone-700 font-medium mt-0.5">{evt.title}</div>
                          <p className="text-stone-500 text-[11px] mt-0.5">{evt.description}</p>
                          {evt.giftCardType && (
                            <div className="text-[11px] text-[#00635C] font-semibold mt-1 flex items-center gap-1">
                              <Gift className="w-3 h-3" />
                              <span>Gift: {evt.giftCardType}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
                        {evt.status === 'sent' ? (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl font-semibold text-xs flex items-center gap-1 border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Touch Sent</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendLifeEventTouch(evt.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Dispatch Gift & Touch</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AGENT HELP VIDEO LIBRARY */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search video walkthroughs by topic (Dotloop, Supra, CDA, MLS)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <span className="text-xs text-stone-500 font-medium">
                  {filteredVideos.length} Curated Walkthroughs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVideos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => setSelectedVideo(vid)}
                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="relative aspect-video bg-stone-100 overflow-hidden">
                      <img
                        src={vid.thumbnailUrl}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-stone-900 group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-stone-900 ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-mono font-bold">
                        {vid.durationMinutes} min
                      </span>
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {vid.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded text-[9px] font-semibold">
                              #{t}
                            </span>
                          ))}
                        </div>
                        <h3 className="font-bold text-stone-900 text-xs mt-1.5 line-clamp-2">{vid.title}</h3>
                        <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">{vid.description}</p>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 font-semibold">
                        <span>Instructor: {vid.instructorName}</span>
                        <span>{vid.viewsCount} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: LEADERSHIP OUTREACH MODAL */}
      {selectedAgentForOutreach && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-600" />
                <h3 className="text-base font-bold text-stone-900">Schedule Leadership Outreach</h3>
              </div>
              <button onClick={() => setSelectedAgentForOutreach(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordOutreach} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  TARGET AGENT
                </label>
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold text-stone-900">
                  {selectedAgentForOutreach.agentName} ({selectedAgentForOutreach.office})
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  LEADERSHIP CONTACT PERSON
                </label>
                <select
                  value={outreachLeader}
                  onChange={(e) => setOutreachLeader(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="Jessica Keenan (BIC — Mayfaire)">Jessica Keenan (BIC — Mayfaire)</option>
                  <option value="Eric Knight (BIC — Carolina Beach)">Eric Knight (BIC — Carolina Beach)</option>
                  <option value="Ryan Crecelius (Owner)">Ryan Crecelius (Owner)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  ACTION & NOTES
                </label>
                <textarea
                  rows={3}
                  value={outreachNote}
                  onChange={(e) => setOutreachNote(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAgentForOutreach(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={outreachSubmitting}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {outreachSubmitting ? 'Recording...' : 'Confirm Outreach Touch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIDEO PLAYER MODAL */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full p-6 text-left animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900">{selectedVideo.title}</h3>
                <div className="text-[11px] text-stone-500">Instructor: {selectedVideo.instructorName} • {selectedVideo.durationMinutes} min</div>
              </div>
              <button onClick={() => setSelectedVideo(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-stone-900 rounded-xl overflow-hidden flex items-center justify-center relative text-white">
              <img src={selectedVideo.thumbnailUrl} alt={selectedVideo.title} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 fill-stone-900 ml-0.5" />
                </div>
                <div className="text-sm font-bold text-white drop-shadow">Simulated Loom / Video Walkthrough Active</div>
                <div className="text-xs text-stone-200 max-w-sm">Embedding real-time step-by-step guidance for {selectedVideo.tags.join(', ')}</div>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              {selectedVideo.description}
            </p>

            <div className="flex items-center justify-end pt-2 border-t border-stone-100">
              <button
                onClick={() => setSelectedVideo(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentRetentionHub;
