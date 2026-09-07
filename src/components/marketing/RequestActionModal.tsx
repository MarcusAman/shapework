/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  Bot,
  BrainCircuit,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  Smartphone,
  Mail,
  Layers,
  MessageSquare,
  ExternalLink,
  Users,
  Send,
  Truck,
  Check,
  Download,
  Share2,
  Clock,
  Building,
  User,
  Phone,
  BookOpen,
  Upload,
  Loader2
} from 'lucide-react';
import { getCampaignGoverningSop, MARKETING_SOPS, MarketingSopDefinition } from './marketingSopRegistry';
import { SOPQuickViewDrawer } from './SOPQuickViewDrawer';

export interface RequestActionModalProps {
  isOpen: boolean;
  campaign: any;
  onClose: () => void;
  onDispatchMaxaAgent?: (campaign: any) => void;
  onAssignToWorkspace?: (campaign: any, memberName?: string) => void;
  onAskQuestions?: (campaign: any) => void;
  onSyncToBasecamp?: (campaign: any) => void;
  onDispatchVendor?: (campaign: any) => void;
  onOpenNestMarketing?: (campaign: any) => void;
  onMarkCompleted?: (campaignId: string) => void;
  onShareApproval?: (campaign: any, recipients: string[]) => void;
  onProofsGenerated?: (campaignId: string, deliverables: any[], proofPackage: any) => void;
}

export const RequestActionModal: React.FC<RequestActionModalProps> = ({
  isOpen,
  campaign,
  onClose,
  onDispatchMaxaAgent,
  onAssignToWorkspace,
  onAskQuestions,
  onSyncToBasecamp,
  onDispatchVendor,
  onOpenNestMarketing,
  onMarkCompleted,
  onShareApproval,
  onProofsGenerated
}) => {
  const [localCampaign, setLocalCampaign] = useState<any>(campaign);
  const [isGeneratingMaxa, setIsGeneratingMaxa] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<{ eduardo: boolean; melissa: boolean }>({
    eduardo: true,
    melissa: false
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [quickViewSop, setQuickViewSop] = useState<MarketingSopDefinition | null>(null);

  useEffect(() => {
    setLocalCampaign(campaign);
    setIsGeneratingMaxa(false);
    setGenerationStep(0);
    setGenerationProgress(0);
  }, [campaign?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !campaign) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const activeCamp = localCampaign || campaign;

  const hasProofs = Boolean(
    activeCamp.proofUrl ||
    activeCamp.proofPackage ||
    activeCamp.generatedDeliverables?.length ||
    activeCamp.statusKey === 'proofs_ready' ||
    activeCamp.statusKey === 'ready_for_review' ||
    activeCamp.statusKey === 'proof_submitted'
  );

  const needsQuestions = activeCamp.statusKey === 'needs_attention' || activeCamp.needsAttention;

  // Determine dynamic AI recommendation
  let aiRecommendation: {
    title: string;
    description: string;
    actionLabel: string;
    icon: any;
    actionType: 'assign_workspace' | 'share_approval' | 'ask_questions';
  } = {
    title: 'Route to Workspace (Eduardo Lovo)',
    description: 'Stage task in Eduardo Lovo’s workstation for human collateral drafting and template selection in Nest Design Center.',
    actionLabel: 'Execute: Assign to Workspace',
    icon: Users,
    actionType: 'assign_workspace'
  };

  if (hasProofs) {
    aiRecommendation = {
      title: 'Marketing Proofs Ready: Share for Approval',
      description: 'Collateral suite generated and verified at 300 DPI. Dispatches SMS and Email proof package to Eduardo and Melissa.',
      actionLabel: 'Execute: Send for Approval',
      icon: Share2,
      actionType: 'share_approval' as const
    };
  } else if (needsQuestions) {
    aiRecommendation = {
      title: 'Incomplete Request: Ask Agent for Clarification',
      description: 'Missing listing disclosures or property notes detected. Dispatch SMS and Email questionnaire to the agent.',
      actionLabel: 'Execute: Ask Requester Questions',
      icon: MessageSquare,
      actionType: 'ask_questions' as const
    };
  }

  const handleRunMaxaAgent = () => {
    setIsGeneratingMaxa(true);
    setGenerationStep(0);
    setGenerationProgress(15);

    const propertyName = activeCamp.propertyAddress || activeCamp.propertySummary || 'Property';

    const t1 = setTimeout(() => {
      setGenerationStep(1);
      setGenerationProgress(40);
    }, 600);

    const t2 = setTimeout(() => {
      setGenerationStep(2);
      setGenerationProgress(75);
    }, 1300);

    const t3 = setTimeout(() => {
      setGenerationStep(3);
      setGenerationProgress(95);
    }, 2000);

    const t4 = setTimeout(() => {
      setIsGeneratingMaxa(false);
      setGenerationStep(4);
      setGenerationProgress(100);

      const generatedDeliverables = [
        {
          id: `deliv_flyer_${activeCamp.id || 'new'}`,
          name: 'Double-Sided 8.5x11 Property Flyer',
          format: 'pdf',
          dimensions: '8.5 x 11 in (Letter)',
          previewUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229058/image/original/open-uri20260804-25191-essk58.jpg?1785880440',
          pdfDownloadUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229058/image/original/open-uri20260804-25191-essk58.jpg?1785880440',
          maxaEditUrl: 'https://nest.maxadesigns.com/designs/229058',
          specs: 'Front Hero + 3 Interior Photos, Headline, NCREC Brokerage Disclosures, QR Code to 3D Tour',
          dpi: 300,
          complianceVerified: true
        },
        {
          id: `deliv_story_${activeCamp.id || 'new'}`,
          name: '9:16 Social Story Carousel',
          format: 'png',
          dimensions: '1080 x 1920 px (9:16)',
          previewUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/206208/image/original/open-uri20260529-58756-2yqjxb.jpg?1780064887',
          pdfDownloadUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/206208/image/original/open-uri20260529-58756-2yqjxb.jpg?1780064887',
          maxaEditUrl: 'https://nest.maxadesigns.com/designs/206208',
          specs: 'Animated Slide Suite, High-Impact Typography, Agent Headshot & Direct Dial',
          dpi: 300,
          complianceVerified: true
        },
        {
          id: `deliv_postcard_${activeCamp.id || 'new'}`,
          name: '6x9 Jumbo EDDM Postcard',
          format: 'pdf',
          dimensions: '6 x 9 in (Jumbo)',
          previewUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229016/image/original/open-uri20260804-25265-drq7ui.jpg?1785872123',
          pdfDownloadUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229016/image/original/open-uri20260804-25265-drq7ui.jpg?1785872123',
          maxaEditUrl: 'https://nest.maxadesigns.com/designs/229016',
          specs: 'USPS EDDM Clear Zone, Property Feature Highlights, Agent Branding Footer',
          dpi: 300,
          complianceVerified: true
        }
      ];

      const proofPackage = {
        flyerUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229058/image/original/open-uri20260804-25191-essk58.jpg?1785880440',
        storyUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/206208/image/original/open-uri20260529-58756-2yqjxb.jpg?1780064887',
        postcardUrl: 'https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229016/image/original/open-uri20260804-25265-drq7ui.jpg?1785872123'
      };

      const updatedCamp = {
        ...activeCamp,
        status: 'ready_for_review',
        statusKey: 'proofs_ready',
        assignedTo: 'Eduardo Lovo',
        proofUrl: proofPackage.flyerUrl,
        proofPackage,
        generatedDeliverables
      };

      setLocalCampaign(updatedCamp);
      showToast(`✓ Maxa Agent compiled 300 DPI templates for ${propertyName.split(',')[0]}!`);

      if (onProofsGenerated) {
        onProofsGenerated(activeCamp.id, generatedDeliverables, proofPackage);
      }
    }, 2400);
  };

  const handleExecuteAiSuggestion = () => {
    if (aiRecommendation.actionType === 'share_approval') {
      const recips: string[] = [];
      if (selectedRecipients.eduardo) recips.push('eduardo');
      if (selectedRecipients.melissa) recips.push('melissa');
      if (onShareApproval) {
        onShareApproval(activeCamp, recips.length > 0 ? recips : ['eduardo']);
      }
      showToast('✓ Dispatched approval package via SMS and Email!');
    } else if (aiRecommendation.actionType === 'ask_questions') {
      if (onAskQuestions) onAskQuestions(activeCamp);
    } else {
      if (onAssignToWorkspace) onAssignToWorkspace(activeCamp, 'Eduardo Lovo');
      showToast('✓ Assigned to Eduardo in Marketing Workspace!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200" data-testid="request-action-modal">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 my-8 flex flex-col text-left font-sans animate-in zoom-in-95 duration-200">
        
        {/* Toast Alert */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#01362D] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-slate-50/90 border-b border-slate-200/80 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#00635C] bg-[#E5EFEA] px-2.5 py-0.5 rounded-md">
                {activeCamp.idNumber || activeCamp.id}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                {activeCamp.packageType || 'Full Marketing Suite'}
              </span>
              {(activeCamp.governingSopId || activeCamp.sopCode) && (
                <>
                  <span className="text-xs text-slate-400">•</span>
                  <button
                    type="button"
                    onClick={() => setQuickViewSop(MARKETING_SOPS[activeCamp.governingSopId || activeCamp.sopCode || ''] || getCampaignGoverningSop(activeCamp.packageType, activeCamp.requestExcerpt))}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E5EFEA] hover:bg-[#d0e5dc] text-[#00635C] border border-[#00635C]/25 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Inspect Governing SOP"
                  >
                    <BookOpen className="w-2.5 h-2.5 text-[#00635C]" />
                    <span>{activeCamp.governingSopId || activeCamp.sopCode}</span>
                    <ExternalLink className="w-2 h-2" />
                  </button>
                </>
              )}
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#00635C]" />
                <span>Due: <strong>{activeCamp.slaTarget || activeCamp.targetSla || 'Today 3:00 PM'}</strong></span>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {activeCamp.propertyAddress || activeCamp.propertySummary}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Agent: <strong className="text-slate-700">{activeCamp.agentName}</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-slate-600">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{activeCamp.phone || activeCamp.agentPhone || '(910) 555-0199'}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[72vh]">
          
          {/* 1. TOP AI RECOMMENDATION BANNER (Zero Sparkles) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#E5EFEA] via-[#F8FAF9] to-emerald-50/80 border border-[#00635C]/30 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00635C] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00635C] bg-white px-2 py-0.5 rounded border border-[#00635C]/20">
                      Nora Cognitive Recommendation
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#01362D]">
                    {aiRecommendation.title}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed max-w-xl">
                    {aiRecommendation.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={handleExecuteAiSuggestion}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs hover:scale-[1.01]"
              >
                <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>{aiRecommendation.actionLabel}</span>
              </button>
            </div>
          </div>

          {/* Autonomous Maxa Browser Agent Progress Runner */}
          {isGeneratingMaxa && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3" data-testid="maxa-progress-banner">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#00635C]" />
                  <span>Autonomous Maxa Browser Agent Running</span>
                </span>
                <span className="font-mono text-emerald-400">{generationProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${generationProgress}%` }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400">
                <div className={generationStep >= 0 ? 'text-emerald-400 font-bold' : ''}>1. Authenticate nest.maxadesigns.com</div>
                <div className={generationStep >= 1 ? 'text-emerald-400 font-bold' : ''}>2. Ingest MLS property media</div>
                <div className={generationStep >= 2 ? 'text-emerald-400 font-bold' : ''}>3. Generate 300 DPI templates</div>
                <div className={generationStep >= 3 ? 'text-emerald-400 font-bold' : ''}>4. Stage vector PDF package</div>
              </div>
            </div>
          )}

          {/* 2. GENERATED MARKETING PROOFS PREVIEW SECTION */}
          {hasProofs && (
            <div className="p-4 rounded-2xl bg-white border border-emerald-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Generated Marketing Proofs (300 DPI Vector PDF)</h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                  ✓ Ready for Approval
                </span>
              </div>

              {/* Deliverables Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 8.5x11 Flyer */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#00635C]" />
                      <span>Double-Sided 8.5x11 Property Flyer</span>
                    </span>
                    <span className="text-[9px] font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-600">8.5x11</span>
                  </div>
                  <div className="aspect-[8.5/11] bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                    <img
                      src="https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229058/image/original/open-uri20260804-25191-essk58.jpg?1785880440"
                      alt="8.5x11 Flyer Proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 gap-1.5">
                      <a
                        href="https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229058/image/original/open-uri20260804-25191-essk58.jpg?1785880440"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-white text-slate-900 rounded-lg text-[10px] font-bold shadow flex items-center gap-1 hover:bg-slate-100"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Inspect</span>
                      </a>
                      <a
                        href="https://nest.maxadesigns.com/designs/229058"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-[#00635C] text-white rounded-lg text-[10px] font-bold shadow flex items-center gap-1 hover:bg-[#004d47]"
                      >
                        <span>Edit ↗</span>
                      </a>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">300 DPI Print PDF</div>
                </div>

                {/* 9:16 Social Story */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#00635C]" />
                      <span>9:16 Social Story Carousel</span>
                    </span>
                    <span className="text-[9px] font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-600">9:16</span>
                  </div>
                  <div className="aspect-[9/16] max-h-36 mx-auto bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                    <img
                      src="https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/206208/image/original/open-uri20260529-58756-2yqjxb.jpg?1780064887"
                      alt="9:16 Social Story Proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 gap-1.5">
                      <a
                        href="https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/206208/image/original/open-uri20260529-58756-2yqjxb.jpg?1780064887"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-white text-slate-900 rounded-lg text-[10px] font-bold shadow flex items-center gap-1 hover:bg-slate-100"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Inspect</span>
                      </a>
                      <a
                        href="https://nest.maxadesigns.com/designs/206208"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-[#00635C] text-white rounded-lg text-[10px] font-bold shadow flex items-center gap-1 hover:bg-[#004d47]"
                      >
                        <span>Edit ↗</span>
                      </a>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">1080x1920 PNG</div>
                </div>

                {/* 6x9 Postcard */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#00635C]" />
                      <span>6x9 Jumbo EDDM Postcard</span>
                    </span>
                    <span className="text-[9px] font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-600">6x9</span>
                  </div>
                  <div className="aspect-[9/6] bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                    <img
                      src="https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229016/image/original/open-uri20260804-25265-drq7ui.jpg?1785872123"
                      alt="6x9 EDDM Postcard Proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 gap-1.5">
                      <a
                        href="https://dnhf8bus4lv8r.cloudfront.net/system/nest.maxadesigns.com/design_view_pictures/229016/image/original/open-uri20260804-25265-drq7ui.jpg?1785872123"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white text-slate-900 rounded-lg text-[10px] font-bold shadow flex items-center gap-1 hover:bg-slate-100"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Inspect</span>
                      </a>
                      <a
                        href="https://nest.maxadesigns.com/designs/229016"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-[#00635C] text-white rounded-lg text-[10px] font-bold shadow flex items-center gap-1 hover:bg-[#004d47]"
                      >
                        <span>Edit ↗</span>
                      </a>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">USPS EDDM Clear Zone</div>
                </div>
              </div>

              {/* Multi-Select Recipient Share Bar */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Select Reviewers to Dispatch Proof Alerts (SMS + Email):</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1 text-xs">
                  {/* Eduardo Lovo (Checked by default) */}
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={selectedRecipients.eduardo}
                      onChange={(e) => setSelectedRecipients(prev => ({ ...prev, eduardo: e.target.checked }))}
                      className="w-4 h-4 text-[#00635C] rounded border-slate-300 focus:ring-[#00635C]"
                    />
                    <span>Eduardo Lovo (Virtual Assistant)</span>
                  </label>

                  {/* Melissa Gagliardi (Underneath/Next to Eduardo, Unchecked by default) */}
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={selectedRecipients.melissa}
                      onChange={(e) => setSelectedRecipients(prev => ({ ...prev, melissa: e.target.checked }))}
                      className="w-4 h-4 text-[#00635C] rounded border-slate-300 focus:ring-[#00635C]"
                    />
                    <span>Melissa Gagliardi (Marketing Director)</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const recips: string[] = [];
                      if (selectedRecipients.eduardo) recips.push('eduardo');
                      if (selectedRecipients.melissa) recips.push('melissa');
                      if (onShareApproval) onShareApproval(activeCamp, recips);
                      showToast('✓ Dispatched SMS and Email proof package to selected reviewers!');
                    }}
                    className="sm:ml-auto px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send for Approval</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. EXECUTION PATHWAYS GRID (7 Handling Options) */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Available Execution Pathways:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              
              {/* Option 1: Open Nest Design Center (Maxa) */}
              <a
                href="https://nest.maxadesigns.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-[#00635C] transition text-left flex items-start gap-3 cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#00635C] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-[#00635C] transition">Open Nest Design Center (Maxa)</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">Manual template selection, editing, and flyer creation in Maxa.</div>
                </div>
              </a>

              {/* Option 2: Assign to Workspace (Eduardo) */}
              <button
                type="button"
                onClick={() => {
                  if (onAssignToWorkspace) onAssignToWorkspace(activeCamp, 'Eduardo Lovo');
                  showToast('✓ Assigned to Eduardo in Marketing Workspace!');
                  onClose();
                }}
                className="p-3 rounded-2xl bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-[#00635C] transition text-left flex items-start gap-3 cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-[#00635C] transition">Route to Workspace (Eduardo)</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">Stages task in Eduardo Lovo's production workstation queue.</div>
                </div>
              </button>

              {/* Option 3: Ask Requester / Agent Questions */}
              <button
                type="button"
                onClick={() => {
                  if (onAskQuestions) onAskQuestions(activeCamp);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 transition text-left flex items-start gap-3 cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-amber-900 transition">Ask Requester / Agent</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">Dispatches SMS & Email questionnaire for missing specs.</div>
                </div>
              </button>

              {/* Option 4: Sync to Basecamp */}
              <button
                type="button"
                onClick={() => {
                  if (onSyncToBasecamp) onSyncToBasecamp(activeCamp);
                  showToast('✓ Synced request to Basecamp marketing project!');
                  onClose();
                }}
                className="p-3 rounded-2xl bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-[#00635C] transition text-left flex items-start gap-3 cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#00635C] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-[#00635C] transition">Sync to Basecamp Project</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">Pushes card to Nest Marketing Basecamp todo list.</div>
                </div>
              </button>

              {/* Option 5: Upload Finished Proof */}
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.png,.jpg';
                  input.onchange = () => {
                    showToast('✓ Proof uploaded and attached for review!');
                  };
                  input.click();
                }}
                className="p-3 rounded-2xl bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-[#00635C] transition text-left flex items-start gap-3 cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#00635C] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 group-hover:text-[#00635C] transition">Upload Finished Proof</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">Attach finished marketing collateral for approval.</div>
                </div>
              </button>

              {/* Option 6: Open Nest Design Center (Maxa) */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenNestMarketing) {
                    onOpenNestMarketing(activeCamp);
                  } else {
                    window.open('https://designcenter.nestrealty.com', '_blank', 'noopener,noreferrer');
                  }
                  onClose();
                }}
                className="p-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 transition text-left flex items-start gap-3 cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 transition">Open Nest Design Center (Maxa) ↗</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">Open marketing template editor in external tab.</div>
                </div>
              </button>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onMarkCompleted) onMarkCompleted(activeCamp.id);
                showToast(`✓ Request ${activeCamp.idNumber || activeCamp.id} marked as completed!`);
                onClose();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Request Completed</span>
            </button>
          </div>
        </div>

      </div>

      {/* POPUP: SLIDE-OVER SOP QUICK-VIEW DRAWER */}
      <SOPQuickViewDrawer
        sop={quickViewSop}
        isOpen={Boolean(quickViewSop)}
        onClose={() => setQuickViewSop(null)}
      />
    </div>
  );
};
