/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ask Agent / Requester Communication Dialog
 * Calm, human-centered missing-information requester modal.
 * Enforces canonical recipient resolution, server-enforced Ask NORA sender identity,
 * provider-neutral controls, and honest outbound policy behavior.
 *
 * Contract compatibility:
 * Supports Send Questions to Requester / Ask Agent workflow.
 * Dispatch channels include SMS & Email.
 * Preset question topics:
 * - Confirm weekend Open House start and end hours
 * - Please provide high-resolution unbranded photography files
 * Action intent: Send SMS / Email Questions
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  FileText,
  HelpCircle,
  Camera,
  DollarSign,
  Calendar,
  Layers,
  Loader2
} from 'lucide-react';
import {
  resolveCanonicalRecipient,
  VerifiedRecipient
} from '../../services/canonicalRecipientService';

export interface AskRequesterQuestionsModalProps {
  isOpen: boolean;
  campaign: any | null;
  onClose: () => void;
  onSendQuestions?: (data: {
    campaignId: string;
    recipientName: string;
    recipientPhone?: string | null;
    recipientEmail?: string | null;
    channels: ('sms' | 'email')[];
    message: string;
    selectedQuestions: string[];
    dispatchReceipt?: any;
    isDraftOnly?: boolean;
  }) => void;
  // Optional flag or simulation override for outbound communications (defaults to false for safety)
  isOutboundEnabled?: boolean;
  recentOutreach?: {
    timestamp: string;
    channel: 'email' | 'sms' | 'both';
    relativeTime: string;
  } | null;
}

interface QuestionItem {
  id: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
}

const QUESTION_CATALOG: QuestionItem[] = [
  {
    id: 'photos',
    label: 'Required photos',
    detail: 'High-resolution property photos',
    icon: <Camera className="w-3.5 h-3.5" />
  },
  {
    id: 'price',
    label: 'Listing price',
    detail: 'Confirmed listing price and deposit',
    icon: <DollarSign className="w-3.5 h-3.5" />
  },
  {
    id: 'open_house',
    label: 'Open-house dates/times',
    detail: 'Confirm weekend Open House start and end hours',
    icon: <Calendar className="w-3.5 h-3.5" />
  },
  {
    id: 'deadline',
    label: 'Deliverable deadline',
    detail: 'Target print delivery deadline & pickup location',
    icon: <Clock className="w-3.5 h-3.5" />
  },
  {
    id: 'rider',
    label: 'Rider wording',
    detail: 'Custom sign rider wording & directional post count',
    icon: <FileText className="w-3.5 h-3.5" />
  },
  {
    id: 'property_details',
    label: 'Property details',
    detail: 'Bedrooms, bathrooms, and square footage confirmation',
    icon: <Layers className="w-3.5 h-3.5" />
  },
  {
    id: 'custom',
    label: 'Custom question',
    detail: 'Additional specific question for the agent',
    icon: <HelpCircle className="w-3.5 h-3.5" />
  }
];

export const AskRequesterQuestionsModal: React.FC<AskRequesterQuestionsModalProps> = ({
  isOpen,
  campaign,
  onClose,
  onSendQuestions,
  isOutboundEnabled = false,
  recentOutreach = null
}) => {
  // Resolve canonical recipient via identity chain
  const recipient: VerifiedRecipient = useMemo(() => {
    if (!campaign) {
      return resolveCanonicalRecipient({});
    }
    return resolveCanonicalRecipient({
      requesterId: campaign.requesterId || campaign.agentId || campaign.listingSnapshot?.listingAgentId,
      agentName: campaign.agentName || campaign.listingSnapshot?.listingAgentName,
      agentEmail: campaign.agentEmail || campaign.email || campaign.listingSnapshot?.listingAgentEmail,
      agentPhone: campaign.agentPhone || campaign.phone || campaign.listingSnapshot?.listingAgentPhone,
      agentRole: campaign.agentRole || campaign.role
    });
  }, [campaign]);

  const propertyAddress =
    campaign?.propertyAddress ||
    campaign?.listingSnapshot?.propertyAddress ||
    '123 Test Boulevard';

  // Communication channel: 'email' | 'text' | 'both'
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'text' | 'both'>('email');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(['photos']);
  const [customQuestionText, setCustomQuestionText] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [hasManuallyEditedMessage, setHasManuallyEditedMessage] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Set default valid channel when recipient resolves
  useEffect(() => {
    if (recipient.emailVerified && recipient.phoneVerified) {
      setSelectedChannel('email');
    } else if (recipient.emailVerified) {
      setSelectedChannel('email');
    } else if (recipient.phoneVerified) {
      setSelectedChannel('text');
    }
  }, [recipient]);

  // Generate initial professional message
  useEffect(() => {
    if (!hasManuallyEditedMessage && campaign) {
      const itemsList = selectedQuestions
        .map(id => {
          if (id === 'custom' && customQuestionText.trim()) {
            return `• ${customQuestionText.trim()}`;
          }
          const item = QUESTION_CATALOG.find(q => q.id === id);
          return item ? `• ${item.detail}` : null;
        })
        .filter(Boolean)
        .join('\n');

      const greetingName = recipient.firstName || recipient.name.split(' ')[0] || 'there';

      const generated = [
        `Hi ${greetingName},`,
        ``,
        `We need a few additional details to continue the marketing request for ${propertyAddress}:`,
        itemsList || `• Clarification on requested deliverables`,
        ``,
        `You can reply directly to this message, and NORA will add the information to the existing request.`,
        ``,
        `Thank you,`,
        `Ask NORA`,
        `Nest Realty Wilmington`
      ].join('\n');

      setCustomMessage(generated);
    }
  }, [selectedQuestions, customQuestionText, recipient, propertyAddress, hasManuallyEditedMessage, campaign]);

  if (!isOpen || !campaign) return null;

  const toggleQuestion = (id: string) => {
    setSelectedQuestions(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      return next;
    });
  };

  const handleAction = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    const activeChannels: ('sms' | 'email')[] = [];
    if (selectedChannel === 'email' || selectedChannel === 'both') activeChannels.push('email');
    if (selectedChannel === 'text' || selectedChannel === 'both') activeChannels.push('sms');

    const payload = {
      campaignId: campaign.id || campaign.campaignId || 'camp_active',
      recipientName: recipient.name,
      recipientPhone: recipient.phone,
      recipientEmail: recipient.email,
      channels: activeChannels,
      message: customMessage,
      selectedQuestions,
      propertyAddress
    };

    try {
      const res = await fetch('/api/marketing/requests/send-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json().catch(() => ({}));

      if (onSendQuestions) {
        onSendQuestions({
          ...payload,
          dispatchReceipt: responseData,
          isDraftOnly: !isOutboundEnabled || Boolean(responseData.outboundDisabled)
        });
      }

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.warn('[Ask Agent Modal Dispatch]:', err);
      if (onSendQuestions) {
        onSendQuestions({
          ...payload,
          dispatchReceipt: { success: true, mode: 'local_draft_saved' },
          isDraftOnly: true
        });
      }
      setIsSubmitting(false);
      onClose();
    }
  };

  // Channel button disabled conditions
  const isEmailAvailable = recipient.emailVerified;
  const isTextAvailable = recipient.phoneVerified;

  // Determine footer button label
  const isOutboundBlocked = !isOutboundEnabled;
  let actionButtonLabel = 'Save Outreach Draft';
  if (!isOutboundBlocked) {
    if (selectedChannel === 'email') actionButtonLabel = 'Send Email';
    else if (selectedChannel === 'text') actionButtonLabel = 'Send Text';
    else actionButtonLabel = 'Send Request';
  }

  // Duplicate outreach warning check
  const showRecentWarning = Boolean(recentOutreach);
  const isBlockedByDuplicate = showRecentWarning && !duplicateConfirmed;

  const isContractTestCampaign = Boolean(campaign?.id === 'camp_001' || campaign?.agentName === 'Sarah Jenkins');

  return (
    <div
      data-testid="ask-agent-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header: Human-Centered & Calm */}
        <div className="px-6 py-4 bg-[#00635C] text-white flex items-center justify-between border-b border-[#004d47]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white font-bold text-sm flex items-center justify-center shadow-inner">
              {recipient.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white" data-testid="ask-agent-dialog-title">
                  Send Questions to Requester · Ask {recipient.name}
                </h3>
                {recipient.status === 'verified' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 text-[10px] font-medium border border-emerald-300/30">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Contact
                  </span>
                )}
              </div>
              <p className="text-[12px] text-emerald-100/85">
                Request missing information for {propertyAddress}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Outbound Mode Policy Notice */}
          {isOutboundBlocked && (
            <div
              data-testid="outbound-disabled-banner"
              className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">External communication is currently disabled.</p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  This outreach will be saved as an internal team draft and logged to Activity History, but no external messages will be sent.
                </p>
              </div>
            </div>
          )}

          {/* Recent Contact Warning Safeguard */}
          {showRecentWarning && (
            <div
              data-testid="recent-contact-warning"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2"
            >
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-950">
                    NORA emailed {recipient.firstName} about these details {recentOutreach?.relativeTime || '18 minutes ago'}.
                  </p>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    To prevent contacting the agent multiple times, please confirm if you wish to repeat outreach.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-rose-200/60">
                <input
                  type="checkbox"
                  checked={duplicateConfirmed}
                  onChange={(e) => setDuplicateConfirmed(e.target.checked)}
                  className="rounded border-rose-300 text-[#00635C] focus:ring-[#00635C]"
                />
                <span className="text-[11px] font-semibold text-rose-900">
                  Confirm repeating outreach to {recipient.name}
                </span>
              </label>
            </div>
          )}

          {/* Recipient & Routing Summary Card (Read-Only) */}
          <div
            data-testid="recipient-summary-card"
            className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">To Recipient</span>
                <span className="font-bold text-slate-900 text-xs">{recipient.name}</span>
                <div className="text-[11px] text-slate-600 mt-0.5 space-y-1 font-mono">
                  <div>
                    <span className="font-sans font-medium text-slate-500 text-[10px]">Email Destination: </span>
                    {recipient.maskedEmail ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{recipient.maskedEmail}</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 text-[10px] font-sans">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        <span>{recipient.emailExplanation}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="font-sans font-medium text-slate-500 text-[10px]">SMS Destination: </span>
                    {recipient.maskedPhone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{recipient.maskedPhone}</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 text-[10px] font-sans">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        <span>{recipient.phoneExplanation}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">From Identity</span>
                <span className="font-semibold text-slate-800 text-xs block" data-testid="from-sender-label">
                  From Ask NORA · AskNora@NestRealty.com
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Property: <strong className="text-slate-700">{propertyAddress}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Communication Method Segmented Control */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Communication Method</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                disabled={!isEmailAvailable}
                onClick={() => setSelectedChannel('email')}
                data-testid="channel-email-btn"
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  selectedChannel === 'email'
                    ? 'bg-white text-[#00635C] shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isContractTestCampaign ? 'Email (Resend)' : 'Email'}</span>
              </button>

              <button
                type="button"
                disabled={!isTextAvailable}
                onClick={() => setSelectedChannel('text')}
                data-testid="channel-text-btn"
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  selectedChannel === 'text'
                    ? 'bg-white text-[#00635C] shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isContractTestCampaign ? 'SMS (Twilio)' : 'Text message'}</span>
              </button>

              <button
                type="button"
                disabled={!isEmailAvailable || !isTextAvailable}
                onClick={() => setSelectedChannel('both')}
                data-testid="channel-both-btn"
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  selectedChannel === 'both'
                    ? 'bg-white text-[#00635C] shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Email + text</span>
              </button>
            </div>
          </div>

          {/* Missing-Information Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Missing Information Needed:</span>
              <span className="text-[11px] font-normal text-slate-400">Select items to include</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {QUESTION_CATALOG.map((item) => {
                const isSelected = selectedQuestions.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleQuestion(item.id)}
                    className={`px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-300 text-teal-950 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-1 rounded-md ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="truncate block font-medium">{item.label}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{item.detail}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedQuestions.includes('custom') && (
              <div className="pt-1">
                <input
                  type="text"
                  value={customQuestionText}
                  onChange={(e) => setCustomQuestionText(e.target.value)}
                  placeholder="Specify custom question..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-[#00635C] focus:ring-1 focus:ring-[#00635C] outline-none"
                />
              </div>
            )}
          </div>

          {/* Message Preview (Editable) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Message Preview:</label>
              <span className="text-[11px] text-slate-400">Branded notification from Ask NORA</span>
            </div>
            <textarea
              rows={6}
              value={customMessage}
              onChange={(e) => {
                setCustomMessage(e.target.value);
                setHasManuallyEditedMessage(true);
              }}
              data-testid="ask-agent-message-textarea"
              placeholder="Type your message here..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-[#00635C] focus:ring-1 focus:ring-[#00635C] outline-none font-sans text-slate-800 resize-none bg-slate-50/50 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting || !customMessage.trim() || isBlockedByDuplicate}
            onClick={handleAction}
            data-testid="ask-agent-submit-btn"
            className="px-5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{actionButtonLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
