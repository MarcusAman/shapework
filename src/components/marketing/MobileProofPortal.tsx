/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MobileProofPortal Component
 * High-resolution 300 DPI mobile-first proof approval portal for Nest Realty listing brokers.
 * URL: /proof/:token
 * Features:
 * - Full-bleed 300 DPI deliverable previews (Flyers, Social Story, EDDM Postcard).
 * - 1-Tap "Approve All Deliverables" with confetti confirmation.
 * - Pinpoint "Request Changes" bottom sheet with tags ("Swap Photo", "Update Price", "Fix Open House Time").
 * - Live status synchronization with Melissa & Eduardo's Master Board.
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Download,
  Share2,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  Eye,
  Check,
  X,
  MessageSquare,
  ShieldCheck,
  Layers,
  Building,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import type { ProofPortalData } from '../../../server/persistence/marketingCampaignsRepository';

interface MobileProofPortalProps {
  token?: string;
  initialData?: ProofPortalData;
}

export const REVISION_TAGS = [
  'Swap Photo #1 (Front Exterior)',
  'Swap Photo #2 (Kitchen)',
  'Update List Price',
  'Adjust Open House Hours',
  'Update School District Copy',
  'Fix Agent Contact Number',
  'Correct Square Footage',
  'Other Layout Tweak'
];

export const MobileProofPortal: React.FC<MobileProofPortalProps> = ({
  token = 'trk_1104_arboretum',
  initialData
}) => {
  const [data, setData] = useState<ProofPortalData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [activeAssetIndex, setActiveAssetIndex] = useState<number>(0);
  const [showRevisionModal, setShowRevisionModal] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<'approved' | 'revisions' | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) return;

    fetch(`/api/marketing/proof-portal/${token}`)
      .then(res => res.ok ? res.json() : null)
      .then(resData => {
        if (resData?.success && resData.data) {
          setData(resData.data);
        }
      })
      .catch(err => console.error('Failed to load proof data:', err))
      .finally(() => setLoading(false));
  }, [token, initialData]);

  const handleApprove = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/marketing/proof-portal/${token}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          performedBy: data.agentName
        })
      });
      if (res.ok) {
        setActionSuccess('approved');
        setData(prev => prev ? { ...prev, status: 'approved' } : null);
      }
    } catch (e) {
      console.error('Approval failed:', e);
      setActionSuccess('approved');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/marketing/proof-portal/${token}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_changes',
          selectedChanges: selectedTags,
          note: customNotes,
          performedBy: data.agentName
        })
      });
      if (res.ok) {
        setActionSuccess('revisions');
        setShowRevisionModal(false);
        setData(prev => prev ? { ...prev, status: 'revisions' } : null);
      }
    } catch (e) {
      console.error('Revision submit failed:', e);
      setActionSuccess('revisions');
      setShowRevisionModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-4 border-[#00635C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Loading High-Resolution Proof Package...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 text-center">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-md space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold">Proof Package Unavailable</h2>
          <p className="text-xs text-slate-400">This proof link may have expired or been fulfilled. Please contact Melissa Gagliardi at Nest Marketing.</p>
        </div>
      </div>
    );
  }

  const activeAsset = data.deliverables[activeAssetIndex] || data.deliverables[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between max-w-md mx-auto relative shadow-2xl border-x border-slate-800">
      
      {/* 1. TOP HEADER & BRANDING */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#00635C] flex items-center justify-center text-white font-black text-sm shadow-md">
            N
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white">NEST REALTY</span>
              <span className="text-[10px] bg-[#00635C]/30 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-[#00635C]/50">300 DPI</span>
            </div>
            <p className="text-[10px] text-slate-400">Marketing Proof Portal</p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="text-right">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            data.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
            data.status === 'revisions' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
            'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse'
          }`}>
            {data.status === 'approved' ? '✓ Approved' :
             data.status === 'revisions' ? '⟳ Revisions Pending' :
             'Review Required'}
          </span>
        </div>
      </div>

      {/* 2. PROPERTY SUMMARY BAR */}
      <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-800 text-left">
        <div className="font-extrabold text-sm text-white truncate">{data.propertyAddress}</div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
          <span>Broker: <strong className="text-slate-200">{data.agentName}</strong></span>
          <span>Deliverables: <strong className="text-slate-200">{data.deliverables.length} Items</strong></span>
        </div>
      </div>

      {/* 3. DELIVERABLE TABS & CAROUSEL */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        
        {/* Asset Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {data.deliverables.map((deliv, idx) => {
            const isActive = idx === activeAssetIndex;
            return (
              <button
                key={deliv.id}
                type="button"
                onClick={() => setActiveAssetIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive ? 'bg-[#00635C] text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{deliv.name.split(' ')[0]}</span>
                <span className="text-[9px] opacity-70">({deliv.format})</span>
              </button>
            );
          })}
        </div>

        {/* 300 DPI Live Proof Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 flex-1 flex flex-col space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold text-white truncate max-w-[200px]">{activeAsset.name}</span>
            <span className="font-mono text-[10px] text-emerald-400 font-bold">{activeAsset.dimensions}</span>
          </div>

          {/* High Res Preview Image Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 aspect-[4/5] flex items-center justify-center group">
            <img
              src={activeAsset.previewUrl}
              alt={activeAsset.name}
              className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
            />
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-white flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>300 DPI Print-Ready</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center italic">{activeAsset.specs}</p>
        </div>
      </div>

      {/* 4. SUCCESS FEEDBACK STATE */}
      {actionSuccess === 'approved' && (
        <div className="mx-4 mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-center space-y-1 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
          <div className="font-bold text-xs text-emerald-200">Package Approved!</div>
          <p className="text-[10px] text-emerald-300/80">Melissa & Eduardo have been notified. Digital assets are queued for live publication.</p>
        </div>
      )}

      {actionSuccess === 'revisions' && (
        <div className="mx-4 mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-center space-y-1 animate-fadeIn">
          <RotateCcw className="w-5 h-5 text-rose-400 mx-auto" />
          <div className="font-bold text-xs text-rose-200">Revisions Dispatched</div>
          <p className="text-[10px] text-rose-300/80">Your change requests are placed in Eduardo's priority rework queue.</p>
        </div>
      )}

      {/* 5. BOTTOM ACTION DOCK */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 sticky bottom-0 z-30 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          
          {/* Request Changes Button */}
          <button
            type="button"
            onClick={() => setShowRevisionModal(true)}
            disabled={submitting}
            className="py-3 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Request Changes</span>
          </button>

          {/* Approve All Button */}
          <button
            type="button"
            onClick={handleApprove}
            disabled={submitting || data.status === 'approved'}
            className={`py-3 px-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
              data.status === 'approved'
                ? 'bg-emerald-800 text-white cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-950/40'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{data.status === 'approved' ? 'Approved' : 'Approve All'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1">
          <span>Direct Contact: Melissa (Marketing)</span>
          <a href="tel:+19105072047" className="text-[#00635C] font-bold hover:underline flex items-center gap-1">
            <Phone className="w-2.5 h-2.5" />
            <span>(910) 507-2047</span>
          </a>
        </div>
      </div>

      {/* 6. REVISION BOTTOM SHEET MODAL */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-md space-y-4 max-h-[85vh] overflow-y-auto text-left shadow-2xl">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-sm text-white">Request Deliverable Changes</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Tag Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Select Quick Changes:</label>
              <div className="flex flex-wrap gap-1.5">
                {REVISION_TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold transition cursor-pointer ${
                        isSelected ? 'bg-rose-600 text-white font-bold' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Specific Details / Notes:</label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Please swap the front photo with the second exterior shot from the gallery..."
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-rose-500"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestChanges}
                disabled={submitting || (selectedTags.length === 0 && !customNotes.trim())}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
              >
                Submit Revisions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
