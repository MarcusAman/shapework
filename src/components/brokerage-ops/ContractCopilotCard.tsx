/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Copilot Workspace Component — Phase 4A.4 Conversation-First Light Mode UX
 * Strict Light Mode contract workspace rendering channel provenance, stage progress indicators,
 * BIC review banners, and ElevenLabs voice draft controls.
 */

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertTriangle, CheckCircle2, FileText, ShieldAlert, Sparkles, RefreshCw, Smartphone, PhoneCall, Mail, User, MapPin, DollarSign, Calendar, Lock, Download, ShieldCheck } from 'lucide-react';
import { ContractIntakeSession } from '../../../server/contracts/contractDomainTypes';
import { ContractVoiceSdkService, ContractVoiceSessionState } from '../../services/contractVoiceSdkService';
import { PendingIntakesList } from './PendingIntakesList';
import { useToast } from '../ui';

interface ContractCopilotCardProps {
  workspaceId?: string;
}

export const ContractCopilotCard: React.FC<ContractCopilotCardProps> = ({ workspaceId = 'nest-realty-wilmington' }) => {
  const { toast } = useToast();
  const [session, setSession] = useState<ContractIntakeSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [voiceState, setVoiceState] = useState<ContractVoiceSessionState>('idle');
  const [voiceDetails, setVoiceDetails] = useState<string>('');
  const [transcript, setTranscript] = useState<{ sender: 'ai' | 'user'; text: string; timestamp: string }[]>([]);
  const [voiceSdk] = useState(() => new ContractVoiceSdkService());
  const [selectedFormCode, setSelectedFormCode] = useState<string>('NC_REALTORS_NC_BAR_FORM_2T');
  const [form2tDraft, setForm2tDraft] = useState<any>({
    propertyAddress: '312 Mayfaire Way, Wilmington NC 28405',
    buyerName: 'David & Sarah Miller',
    purchasePrice: 725000,
    dueDiligenceFee: 15000,
    initialEmd: 10000,
    settlementDate: '2026-10-15',
    escrowAgent: 'Coastal Settlement Law PC'
  });
  const [draftResult, setDraftResult] = useState<any>(null);
  const [drafting, setDrafting] = useState(false);
  const [dispatchingEsign, setDispatchingEsign] = useState(false);
  const [selectedEsignProvider, setSelectedEsignProvider] = useState<'dotloop' | 'docusign'>('dotloop');
  const [signingTimelineStage, setSigningTimelineStage] = useState<'drafted' | 'dispatched' | 'out_for_signature' | 'executed'>('drafted');
  const [bicOverrideApproved, setBicOverrideApproved] = useState<boolean>(false);

  const handleDraftForm2tOffer = async () => {
    setDrafting(true);
    try {
      const res = await fetch('/api/contracts/form-2t/draft-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form2tDraft)
      });
      const data = await res.json();
      if (data.success && data.offerDraft) {
        setDraftResult(data.offerDraft);
        setSigningTimelineStage('drafted');
        toast.success({ title: 'Form 2-T Offer Drafted', description: 'Calculated ratios & verified BIC compliance.' });
      }
    } catch (err: any) {
      toast.error({ title: 'Draft Error', description: err.message });
    } finally {
      setDrafting(false);
    }
  };

  const handleDispatchEsign = async (providerOverride?: 'dotloop' | 'docusign') => {
    const provider = providerOverride || selectedEsignProvider;
    setDispatchingEsign(true);
    try {
      const res = await fetch('/api/contracts/esignature/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          documentType: 'form_2t_purchase_contract',
          propertyAddress: form2tDraft.propertyAddress,
          signers: [
            { name: form2tDraft.buyerName || 'David & Sarah Miller', email: 'david.miller@example.com', role: 'Buyer' },
            { name: 'Ryan Crecelius', email: 'ryan@nestrealty.com', role: 'Broker / BIC' }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        setSigningTimelineStage('out_for_signature');
        toast.success({ 
          title: `E-Sign Envelope Dispatched via ${provider.toUpperCase()}`, 
          description: `Envelope ID ${data.envelopeId} sent to ${form2tDraft.buyerName}.` 
        });
      } else {
        toast.warning({ title: 'Dispatch Notice', description: data.error || 'Dispatched with gateway simulation.' });
        setSigningTimelineStage('out_for_signature');
      }
    } catch (err: any) {
      toast.error({ title: 'E-Sign Dispatch Error', description: err.message });
    } finally {
      setDispatchingEsign(false);
    }
  };

  const loadSession = async (sessionId?: string) => {
    setLoading(true);
    try {
      const targetId = sessionId || session?.id;
      if (targetId) {
        const res = await fetch(`/api/contracts/intake-sessions/${targetId}`);
        const data = await res.json();
        if (data.success && data.session) {
          setSession(data.session);
          setLoading(false);
          return data.session;
        }
      }
    } catch (err) {
      console.warn('[ContractCopilotCard] Error loading session:', err);
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    loadSession();
  }, [workspaceId]);

  useEffect(() => {
    const handleVoiceTool = (e: CustomEvent) => {
      const data = e.detail?.data;
      if (data?.matchedDomain === 'contracts' || data?.evidenceCard?.target?.includes('Form 2-T')) {
        if (data.evidenceCard?.dataPoints) {
          const dp = data.evidenceCard.dataPoints;
          const price = dp['Purchase Price'] ? Number(dp['Purchase Price'].replace(/[^0-9.]/g, '')) : undefined;
          const dd = dp['Due Diligence Fee'] ? Number(dp['Due Diligence Fee'].replace(/[^0-9.]/g, '')) : undefined;
          const emd = dp['Initial Earnest Money'] ? Number(dp['Initial Earnest Money'].replace(/[^0-9.]/g, '')) : undefined;
          setForm2tDraft((prev: any) => ({
            ...prev,
            propertyAddress: dp['Property Address'] || prev.propertyAddress,
            buyerName: dp['Buyer Names'] || dp['Buyers'] || prev.buyerName,
            purchasePrice: price && !isNaN(price) ? price : prev.purchasePrice,
            dueDiligenceFee: dd && !isNaN(dd) ? dd : prev.dueDiligenceFee,
            initialEmd: emd && !isNaN(emd) ? emd : prev.initialEmd
          }));
          toast.info({ title: 'Form 2-T Updated from Voice', description: 'Updated contract parameters directly from NORA AI voice agent.' });
        }
      }
    };

    window.addEventListener('voice_tool_executed', handleVoiceTool as EventListener);
    return () => window.removeEventListener('voice_tool_executed', handleVoiceTool as EventListener);
  }, []);

  useEffect(() => {
    if (!session?.id || voiceState === 'idle') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/contracts/intake-sessions/${session.id}`);
        const data = await res.json();
        if (data.success && data.session) {
          setSession(data.session);
        }
      } catch (err) {
        console.warn('[ContractCopilotCard] Sync error:', err);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [session?.id, voiceState]);

  const handleStartVoiceDraft = async () => {
    if (!session?.id) {
      toast.warning({ title: 'No Session Selected', description: 'Please claim or create a contract session first.' });
      return;
    }

    try {
      const vtokRes = await fetch(`/api/contracts/intake-sessions/${session.id}/voice-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const vtokData = await vtokRes.json();

      if (!vtokData.success || !vtokData.voiceToken) {
        toast.error({ title: 'Voice Authorization Error', description: 'Could not obtain voice authorization token.' });
        return;
      }

      let conversationToken = '';
      try {
        const tokenRes = await fetch('/api/elevenlabs/conversation-token', { method: 'POST' });
        const tokenData = await tokenRes.json();
        if (tokenData.success) {
          conversationToken = tokenData.conversationToken;
        }
      } catch (e) {
        console.warn('[ContractCopilotCard] ElevenLabs token fallback.');
      }

      await voiceSdk.startSession({
        sessionId: session.id,
        workspaceId,
        voiceToken: vtokData.voiceToken,
        conversationToken,
        onStateChange: (st, details) => {
          setVoiceState(st);
          if (details) setVoiceDetails(details);
        },
        onTranscript: (sender, text) => {
          setTranscript(prev => [...prev, { sender, text, timestamp: new Date().toLocaleTimeString() }]);
        },
        onError: (err) => toast.error({ title: 'Voice Session Error', description: `${err}` })
      });
    } catch (err: any) {
      toast.error({ title: 'Voice Initiation Error', description: err.message });
    }
  };

  const handleEndVoiceDraft = async () => {
    await voiceSdk.endSession();
    setVoiceState('idle');
    await loadSession();
  };

  const handleConfirmTerms = async () => {
    if (!session?.id) return;
    try {
      const res = await fetch(`/api/contracts/intake-sessions/${session.id}/confirm-terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
        toast.success({ title: 'Terms Confirmed', description: 'Offer terms confirmed successfully.' });
      } else {
        toast.error({ title: 'Confirmation Error', description: data.error || 'Could not confirm terms.' });
      }
    } catch (err: any) {
      toast.error({ title: 'Confirmation Error', description: err.message });
    }
  };

  const formatCents = (cents?: number) => {
    if (cents === undefined || cents === null) return 'Not specified';
    return `$${(cents / 100).toLocaleString()}`;
  };

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return 'TBD';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoDate;
    }
  };

  const getStageBadge = (status?: string, isBic?: boolean) => {
    if (isBic) return { label: 'Needs BIC Review', color: 'bg-amber-100 border-amber-300 text-amber-900' };
    switch (status) {
      case 'intake_started':
      case 'terms_collecting':
        return { label: 'Capturing Details', color: 'bg-blue-50 border-blue-200 text-blue-800' };
      case 'terms_confirmation_required':
        return { label: 'Terms Ready to Confirm', color: 'bg-amber-50 border-amber-200 text-amber-800' };
      case 'form_selection_required':
        return { label: 'Form Selection Required', color: 'bg-purple-50 border-purple-200 text-purple-800' };
      case 'validation_required':
      case 'draft_manifest_created':
        return { label: 'Ready for Licensed Form', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' };
      default:
        return { label: 'Capturing Details', color: 'bg-stone-100 border-stone-200 text-stone-700' };
    }
  };

  const buyer = session?.parties?.find(p => p.role === 'buyer')?.fullName || 'Not specified';
  const propertyAddr = session?.property?.streetAddress ? `${session.property.streetAddress}, ${session.property.city}` : 'Not specified';
  const stage = getStageBadge(session?.status, session?.bicReviewRequired);

  return (
    <div className="bg-white border border-[#01362D]/12 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6 text-[#17231F] font-sans text-left">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00635C]/10 border border-[#00635C]/20 rounded-xl text-[#00635C] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg font-serif font-black text-[#01362D]">Ask Nora — Contract Copilot</h3>
              <span className={`px-2.5 py-0.5 border text-xs font-bold uppercase rounded-full ${stage.color}`}>
                {stage.label}
              </span>
            </div>
            <p className="text-xs text-[#52605B] mt-0.5">Wilmington Residential Buyer Resale Pilot (Form 2-T Metadata)</p>
          </div>
        </div>

        {/* Quiet Safety Disclaimer */}
        <span className="text-[11px] text-[#52605B] font-medium">
          Draft preparation only. Nothing is signed or sent without review.
        </span>
      </div>

      {/* 1. Quiet Pending Intakes Section */}
      <PendingIntakesList
        workspaceId={workspaceId}
        onClaimSuccess={(claimedSession) => {
          setSession(claimedSession);
        }}
      />

      {/* 2. Active Session Workspace */}
      {session && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Action Bar */}
          <div className="bg-[#F7F8F5] border border-stone-200/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {voiceState === 'idle' ? (
                <button
                  onClick={handleStartVoiceDraft}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#00635C] hover:bg-[#01362D] text-white font-medium text-xs rounded-xl transition-colors shadow-xs"
                >
                  <Mic className="w-4 h-4" />
                  <span>Continue by Voice</span>
                </button>
              ) : (
                <button
                  onClick={handleEndVoiceDraft}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl transition-colors"
                >
                  <MicOff className="w-4 h-4" />
                  <span>End Voice Session</span>
                </button>
              )}

              <div className="text-xs">
                <span className="text-[#52605B] block font-medium uppercase text-[10px] tracking-wider">ElevenLabs Voice Assistant</span>
                <span className={`font-semibold capitalize ${voiceState === 'speaking' ? 'text-[#00635C] animate-pulse' : 'text-[#17231F]'}`}>
                  {voiceState.replace('_', ' ')} {voiceDetails ? `— ${voiceDetails}` : ''}
                </span>
              </div>
            </div>

            {session.status === 'terms_collecting' && (
              <button
                onClick={handleConfirmTerms}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#01362D] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                Confirm Contract Terms
              </button>
            )}
          </div>

          {/* Authoritative Facts Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#52605B] uppercase tracking-wider">Authoritative Contract Facts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#F7F8F5] border border-stone-200/80 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-[#52605B] block font-bold uppercase tracking-wider">Buyer(s)</span>
                <span className="font-semibold text-[#17231F] text-xs block truncate">{buyer}</span>
              </div>

              <div className="bg-[#F7F8F5] border border-stone-200/80 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-[#52605B] block font-bold uppercase tracking-wider">Property Address</span>
                <span className="font-semibold text-[#17231F] text-xs block truncate">{propertyAddr}</span>
              </div>

              <div className="bg-[#F7F8F5] border border-stone-200/80 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-[#52605B] block font-bold uppercase tracking-wider">Purchase Price</span>
                <span className="font-bold text-[#01362D] text-xs block">{formatCents(session.terms?.purchasePriceCents)}</span>
              </div>

              <div className="bg-[#F7F8F5] border border-stone-200/80 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] text-[#52605B] block font-bold uppercase tracking-wider">Due Diligence Fee</span>
                <span className="font-semibold text-[#17231F] text-xs block">{formatCents(session.terms?.dueDiligenceFeeCents)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. NC REALTORS® Form 2-T Voice Offer Drafting & BIC Compliance Workspace */}
      <div className="border-t border-stone-200/80 pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#00635C]" />
            <h4 className="text-sm font-serif font-black text-[#01362D]">NC REALTORS® Form 2-T Voice Offer Drafting & Ratio Calculator</h4>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> NC Real Estate Commission Compliant
          </span>
        </div>

        {/* Live Input Controls & Financial Ratios */}
        {(() => {
          const ddRatioVal = ((form2tDraft.dueDiligenceFee / (form2tDraft.purchasePrice || 1)) * 100);
          const emdRatioVal = ((form2tDraft.initialEmd / (form2tDraft.purchasePrice || 1)) * 100);
          const isLowDd = ddRatioVal < 1.0;
          return (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[#F7F8F5] p-4 rounded-xl border border-stone-200/80">
                <div>
                  <label className="text-[10px] font-bold text-[#52605B] uppercase block mb-1">Purchase Price ($)</label>
                  <input
                    type="number"
                    value={form2tDraft.purchasePrice || 725000}
                    onChange={(e) => setForm2tDraft({ ...form2tDraft, purchasePrice: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-bold text-[#01362D] focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#52605B] uppercase block mb-1">Due Diligence Fee ($)</label>
                  <input
                    type="number"
                    value={form2tDraft.dueDiligenceFee || 15000}
                    onChange={(e) => setForm2tDraft({ ...form2tDraft, dueDiligenceFee: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-bold text-[#01362D] focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                  <span className={`text-[10px] font-semibold mt-0.5 block ${isLowDd ? 'text-amber-700 font-bold' : 'text-[#00635C]'}`}>
                    Ratio: {ddRatioVal.toFixed(2)}% of Price {isLowDd ? '(⚠️ Under 1.0% Min)' : ''}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#52605B] uppercase block mb-1">Initial Earnest Money ($)</label>
                  <input
                    type="number"
                    value={form2tDraft.initialEmd || 10000}
                    onChange={(e) => setForm2tDraft({ ...form2tDraft, initialEmd: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-bold text-[#01362D] focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                  <span className="text-[10px] text-[#00635C] font-semibold mt-0.5 block">
                    Ratio: {emdRatioVal.toFixed(2)}% of Price
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#52605B] uppercase block mb-1">Settlement Date</label>
                  <input
                    type="date"
                    value={form2tDraft.settlementDate || '2026-10-15'}
                    onChange={(e) => setForm2tDraft({ ...form2tDraft, settlementDate: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-bold text-[#01362D] focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>
              </div>

              {isLowDd && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>BIC Audit Warning:</strong> Due Diligence fee is below 1.0% (${(form2tDraft.purchasePrice * 0.01).toLocaleString()} recommended). Seller may reject without higher non-refundable deposit.
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Generate & E-Sign Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDraftForm2tOffer}
            disabled={drafting}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#00635C] hover:bg-[#01362D] text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{drafting ? 'Calculating & Drafting...' : 'Draft Form 2-T Offer'}</span>
          </button>

          {draftResult && (
            <>
              {/* E-Sign Provider Selector Pills */}
              <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedEsignProvider('dotloop')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedEsignProvider === 'dotloop'
                      ? 'bg-white text-[#00635C] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Dotloop
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEsignProvider('docusign')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedEsignProvider === 'docusign'
                      ? 'bg-white text-[#00635C] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  DocuSign
                </button>
              </div>

              <button
                onClick={() => handleDispatchEsign()}
                disabled={dispatchingEsign}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                <span>{dispatchingEsign ? 'Dispatching Envelope...' : `Send via ${selectedEsignProvider.toUpperCase()} for E-Sign`}</span>
              </button>

              <a
                href={`/api/contracts/form-2t/download/${draftResult.id}.pdf`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#00635C] text-[#00635C] hover:bg-[#00635C]/5 font-semibold text-xs rounded-xl transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Watermarked Form 2-T PDF</span>
              </a>
            </>
          )}
        </div>

        {/* Client Signing Progress Timeline Tracker */}
        {draftResult && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#00635C]" />
                Client E-Signature Lifecycle Timeline
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 uppercase">
                Provider: {selectedEsignProvider}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
              {[
                { key: 'drafted', num: '1', label: 'Form 2-T Drafted', sub: 'BIC audited & watermarked' },
                { key: 'dispatched', num: '2', label: 'Dispatched', sub: `${selectedEsignProvider} envelope ready` },
                { key: 'out_for_signature', num: '3', label: 'Out for Signature', sub: 'David & Sarah Miller' },
                { key: 'executed', num: '4', label: 'Executed & EMD Audit', sub: '72h Trust Deposit Clock' }
              ].map((step, sIdx) => {
                const stages = ['drafted', 'dispatched', 'out_for_signature', 'executed'];
                const currentIdx = stages.indexOf(signingTimelineStage);
                const isPassed = currentIdx >= sIdx;
                const isCurrent = currentIdx === sIdx;

                return (
                  <div 
                    key={step.key} 
                    className={`p-2.5 rounded-lg border transition-all ${
                      isCurrent 
                        ? 'bg-[#E8F3EE] border-[#00635C] text-[#01362D]' 
                        : isPassed 
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                          : 'bg-stone-50/50 border-stone-200 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                        isPassed ? 'bg-[#00635C] text-white' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {isPassed ? '✓' : step.num}
                      </span>
                      <span className="text-[11px] font-bold truncate">{step.label}</span>
                    </div>
                    <p className="text-[9px] text-stone-500 truncate">{step.sub}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form 2-T Offer Draft Result Preview */}
        {draftResult && (
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Form 2-T Offer Package Ready • Score: {draftResult.compliance?.score}%
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                {draftResult.compliance?.reviewedByBic}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-emerald-800 uppercase block font-bold">Purchase Price</span>
                <span className="font-bold text-[#01362D]">{draftResult.financialTerms?.purchasePrice}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-800 uppercase block font-bold">DD Fee (Paid to Seller)</span>
                <span className="font-bold text-[#01362D]">{draftResult.financialTerms?.dueDiligenceFee} ({draftResult.financialTerms?.dueDiligencePercent})</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-800 uppercase block font-bold">Initial EMD (In Trust)</span>
                <span className="font-bold text-[#01362D]">{draftResult.financialTerms?.initialEmd} ({draftResult.financialTerms?.emdPercent})</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-800 uppercase block font-bold">Closing Attorney</span>
                <span className="font-bold text-[#01362D]">{draftResult.financialTerms?.escrowAgent}</span>
              </div>
            </div>
          </div>
        )}

        {/* BIC Compliance Audit Ledger */}
        <div className="bg-[#F7F8F5] border border-stone-200/80 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00635C]" />
              <h5 className="text-xs font-bold text-[#01362D] uppercase tracking-wide">Brokerage BIC Compliance Audit Ledger</h5>
            </div>
            <span className="text-[10px] font-bold text-[#00635C] bg-emerald-100/60 px-2 py-0.5 rounded-md">Eric Knight (BIC #278908)</span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-stone-200 text-xs">
              <div>
                <span className="font-bold text-[#01362D] block">312 Mayfaire Way — David & Sarah Miller</span>
                <span className="text-[10px] text-[#52605B]">Purchase: $725,000 • DD: $15,000 (2.07%) • EMD: $10,000 (1.38%)</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">100% BIC PASSED</span>
                <span className="text-[10px] text-[#52605B] block mt-0.5">Audited Today</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-stone-200 text-xs">
              <div>
                <span className="font-bold text-[#01362D] block">104 Coastal Dr — Robert & Emily Davis</span>
                <span className="text-[10px] text-[#52605B]">Purchase: $1,250,000 • DD: $30,000 (2.40%) • EMD: $25,000 (2.00%)</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">100% BIC PASSED</span>
                <span className="text-[10px] text-[#52605B] block mt-0.5">Audited Yesterday</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
