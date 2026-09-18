/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EventsAndVipHub
 * Consolidates:
 * - [18] Friends of Nest VIP Relationship Engine
 * - [21] Event Planning Playbook
 * - [14] Event Follow-Up Engine
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles, Calendar, Gift, Star, Award, Users, CheckCircle2,
  TrendingUp, MessageSquare, Send, RefreshCw, Plus, Clock,
  ArrowRight, ExternalLink, MapPin, DollarSign, X
} from 'lucide-react';
import type { FriendsOfNestVip, EventPlaybook } from '../../../server/persistence/opportunityRegisterRepository';

export const EventsAndVipHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vips' | 'playbooks' | 'follow_up'>('vips');
  const [vips, setVips] = useState<FriendsOfNestVip[]>([]);
  const [playbooks, setPlaybooks] = useState<EventPlaybook[]>([]);
  const [loading, setLoading] = useState(true);

  // VIP Touch Schedule Modal
  const [selectedVip, setSelectedVip] = useState<FriendsOfNestVip | null>(null);
  const [touchType, setTouchType] = useState<any>('anniversary_gift');
  const [giftItem, setGiftItem] = useState("Boombalatti's Artisan Ice Cream $25");
  const [schedulingTouch, setSchedulingTouch] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resVips, resEvents] = await Promise.all([
        fetch('/api/friends-of-nest').then(r => r.json()),
        fetch('/api/events/playbooks').then(r => r.json())
      ]);

      if (resVips.success) setVips(resVips.vips);
      if (resEvents.success) setPlaybooks(resEvents.playbooks);
    } catch (err) {
      console.error('Failed to load VIP and event data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScheduleTouch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVip) return;
    try {
      setSchedulingTouch(true);
      const res = await fetch('/api/friends-of-nest/schedule-touch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vipId: selectedVip.id, touchType, giftItem })
      });
      const data = await res.json();
      if (data.success) {
        setVips(prev => prev.map(v => v.id === selectedVip.id ? data.vip : v));
        setSelectedVip(null);
      }
    } catch (err) {
      console.error('Failed to schedule VIP touch:', err);
    } finally {
      setSchedulingTouch(false);
    }
  };

  const handleTriggerFollowUpBlitz = async (playbookId: string) => {
    try {
      const res = await fetch(`/api/events/${playbookId}/follow-up-blitz`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPlaybooks(prev => prev.map(p => p.id === playbookId ? data.playbook : p));
      }
    } catch (err) {
      console.error('Failed to trigger follow up blitz:', err);
    }
  };

  return (
    <div className="space-y-6 text-left select-none font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold tracking-wide">
              <Star className="w-3.5 h-3.5 text-amber-600" />
              <span>VIP Client & Event Engine</span>
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-900 mt-1.5">
            Friends of Nest & Event Playbook Hub
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 max-w-3xl leading-relaxed">
            Automated relationship lifecycle touches for top advocates and multi-stage event planning with post-event review automation.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('vips')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'vips' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Friends of Nest VIPs</span>
          </button>
          <button
            onClick={() => setActiveTab('playbooks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'playbooks' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Event Playbooks</span>
          </button>
          <button
            onClick={() => setActiveTab('follow_up')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'follow_up' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Follow-Up Blitz</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-stone-500 font-sans space-y-2">
          <RefreshCw className="w-6 h-6 text-stone-400 animate-spin mx-auto" />
          <div className="text-xs font-semibold">Loading VIP Relationship & Event Playbooks...</div>
        </div>
      ) : (
        <>
          {/* TAB 1: FRIENDS OF NEST VIP ENGINE */}
          {activeTab === 'vips' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F7F8F5] rounded-2xl border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-stone-900">VIP Advocate Lifecycle Automation</div>
                  <div className="text-[11px] text-stone-500">
                    Tracks top 15% past clients with automated local partner gifts (Boombalatti's, PinPoint) and annual home equity reviews.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                    {vips.length} Active VIP Advocates
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vips.map((vip) => (
                  <div key={vip.id} className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          vip.advocateTier === 'platinum_referral'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {vip.advocateTier.replace(/_/g, ' ')}
                        </span>
                        <span className="font-semibold text-emerald-700 text-[11px]">
                          ⭐ {vip.totalReferralsProvided} Referrals Sent
                        </span>
                      </div>

                      <div>
                        <h3 className="font-serif font-bold text-base text-stone-900">{vip.clientName}</h3>
                        <p className="text-[11px] text-stone-500">{vip.propertyAddress}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2 bg-stone-50 rounded-xl border border-stone-100">
                          <div className="text-[10px] text-stone-400 font-semibold uppercase">Closed Date</div>
                          <div className="font-bold text-stone-800 mt-0.5">{vip.closingDate}</div>
                        </div>
                        <div className="p-2 bg-stone-50 rounded-xl border border-stone-100">
                          <div className="text-[10px] text-stone-400 font-semibold uppercase">Next Touch</div>
                          <div className="font-bold text-stone-800 mt-0.5">{vip.nextTouchScheduledAt}</div>
                        </div>
                      </div>

                      <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100/80 text-[11px] space-y-1">
                        <div className="font-bold text-amber-900 flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-amber-700" />
                          <span>Upcoming Touch: {vip.nextTouchType.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="text-stone-700 font-medium">{vip.localPartnerGift}</div>
                      </div>

                      <p className="text-[11px] text-stone-500 italic">
                        Notes: {vip.notes}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] text-stone-400">Agent: {vip.referringAgent}</span>
                      <button
                        onClick={() => setSelectedVip(vip)}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Gift className="w-3.5 h-3.5 text-amber-300" />
                        <span>Schedule Custom Touch</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EVENT PLANNING PLAYBOOK */}
          {activeTab === 'playbooks' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {playbooks.map((pb) => (
                  <div key={pb.id} className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4 text-xs">
                    <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                          {pb.eventType.replace(/_/g, ' ')}
                        </span>
                        <h3 className="font-serif font-bold text-base text-stone-900 mt-1">{pb.title}</h3>
                        <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span>{pb.location}</span>
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-stone-100 text-stone-700 rounded-lg font-bold text-[11px] shrink-0">
                        {pb.scheduledDate}
                      </span>
                    </div>

                    {/* Budget & RSVPs */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                        <div className="text-[10px] text-stone-400 font-semibold uppercase">BUDGET</div>
                        <div className="font-bold text-stone-900 mt-0.5">${pb.targetBudget}</div>
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                        <div className="text-[10px] text-stone-400 font-semibold uppercase">ACTUAL SPEND</div>
                        <div className="font-bold text-stone-900 mt-0.5">${pb.actualSpend}</div>
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                        <div className="text-[10px] text-stone-400 font-semibold uppercase">CONFIRMED RSVPS</div>
                        <div className="font-bold text-emerald-800 mt-0.5">{pb.rsvpCount} Guests</div>
                      </div>
                    </div>

                    {/* Vendor Checklist */}
                    <div className="space-y-1.5">
                      <div className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">Vendor Contracts & Checklist</div>
                      <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                        {pb.vendorChecklist.map((vc, idx) => (
                          <div key={idx} className="p-2.5 bg-white flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-semibold text-stone-900">{vc.item}</span>
                              <span className="text-stone-400 ml-1.5">({vc.vendor})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-stone-600">${vc.cost}</span>
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-[9px]">
                                ✓ {vc.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] text-stone-400">Status: {pb.status.replace(/_/g, ' ')}</span>
                      <button
                        onClick={() => handleTriggerFollowUpBlitz(pb.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Trigger 24h Post-Event Blitz</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EVENT FOLLOW-UP ENGINE */}
          {activeTab === 'follow_up' && (
            <div className="space-y-4">
              <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4 text-xs">
                <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#00635C]" />
                      <span>Post-Event Testimonial & Review Conversion</span>
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Automatically reaches out to attendees within 24 hours to collect reviews and testimonials.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {playbooks.map((pb) => (
                    <div key={pb.id} className="p-4 bg-[#F7F8F5] rounded-xl border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-stone-900 text-sm">{pb.title}</div>
                          <div className="text-[11px] text-stone-500">{pb.scheduledDate} • {pb.location}</div>
                        </div>
                        {pb.postEventFollowUp.blitzDispatched ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Blitz Dispatched</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleTriggerFollowUpBlitz(pb.id)}
                            className="px-3 py-1.5 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl font-semibold text-xs cursor-pointer shadow-xs"
                          >
                            Launch Follow-Up Blitz
                          </button>
                        )}
                      </div>

                      {pb.postEventFollowUp.blitzDispatched && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-2">
                          <div className="p-2 bg-white rounded-lg border border-stone-200">
                            <div className="text-[10px] text-stone-400 font-semibold">SMS SENT</div>
                            <div className="font-bold text-stone-900 text-xs mt-0.5">{pb.postEventFollowUp.smsSentCount}</div>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-stone-200">
                            <div className="text-[10px] text-stone-400 font-semibold">TESTIMONIALS</div>
                            <div className="font-bold text-emerald-700 text-xs mt-0.5">{pb.postEventFollowUp.testimonialsCollectedCount}</div>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-stone-200">
                            <div className="text-[10px] text-stone-400 font-semibold">GOOGLE REVIEWS</div>
                            <div className="font-bold text-[#00635C] text-xs mt-0.5">{pb.postEventFollowUp.googleReviewsGeneratedCount} ⭐⭐⭐⭐⭐</div>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-stone-200">
                            <div className="text-[10px] text-stone-400 font-semibold">AVG RATING</div>
                            <div className="font-bold text-stone-900 text-xs mt-0.5">{pb.postEventFollowUp.averageRating} / 5.0</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: SCHEDULE VIP TOUCH */}
      {selectedVip && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-600" />
                <h3 className="text-base font-bold text-stone-900">Schedule VIP Touch for {selectedVip.clientName}</h3>
              </div>
              <button onClick={() => setSelectedVip(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleTouch} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  TOUCH OCCASION
                </label>
                <select
                  value={touchType}
                  onChange={(e) => setTouchType(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="anniversary_gift">Home Purchase Anniversary Gift</option>
                  <option value="quarterly_local_touch">Quarterly Local Business Advocate Touch</option>
                  <option value="tax_assessment_review">Annual County Tax Assessment Advisory</option>
                  <option value="holiday_pie">Thanksgiving Holiday Pie Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  LOCAL PARTNER EXPERIENCE / GIFT
                </label>
                <input
                  type="text"
                  value={giftItem}
                  onChange={(e) => setGiftItem(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVip(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingTouch}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {schedulingTouch ? 'Saving...' : 'Confirm Touch Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsAndVipHub;
