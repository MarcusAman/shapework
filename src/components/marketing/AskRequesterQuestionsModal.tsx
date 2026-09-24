/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ask Agent / Requester Communication Dialog
 * Used for (1) missing-info questions and (2) post-approval "assets ready" outreach.
 * Melissa verifies/edits email or text before anything is sent.
 * Always From AskNora@NestRealty.com; marketing delivery CCs Melissa.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
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
  contactAssuranceLabel,
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
    intent?: 'ask_missing' | 'delivery_complete';
    subject?: string;
    ccEmails?: string[];
    domain?: string;
    taskId?: string;
  }) => void;
  /** ask_missing (default) | delivery_complete — approve assets ready outreach */
  intent?: 'ask_missing' | 'delivery_complete';
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

const MELISSA_CC = 'melissa.gagliardi@nestrealty.com';

function isPlaceholderDriveLink(url: string): boolean {
  return /\/folders\/1DRV_/i.test(url) || /\/folders\/folder_/i.test(url) || /\/folders\/sub_/i.test(url);
}

function collectDeliveryAssetLinks(campaign: any): string[] {
  const urls: string[] = [];
  const push = (u?: string) => {
    const s = String(u || '').trim();
    if (!s || !/^https?:\/\//i.test(s) || urls.includes(s)) return;
    if (isPlaceholderDriveLink(s)) return;
    urls.push(s);
  };
  push(campaign?.driveFolderUrl);
  push(campaign?.proofUrl);
  push(campaign?.approvePayload?.proofUrl);
  for (const a of campaign?.approvePayload?.stagedAssets || []) push(a?.previewUrl || a?.url);
  for (const a of campaign?.attachments || []) push(a?.url || a?.driveUrl);
  for (const p of campaign?.photos || []) push(p?.url || p?.driveUrl);
  for (const p of campaign?.proofs || []) push(p?.url);
  for (const u of campaign?.assetUrls || []) push(u);
  // Harvest real Drive links from notes (ignore fake 1DRV_ slugs)
  const noteBlob = [campaign?.notes, campaign?.approvePayload?.note, campaign?.requestExcerpt]
    .filter(Boolean)
    .join('\n');
  const found = noteBlob.match(/https?:\/\/drive\.google\.com\/[^\s)\]>"']+/gi) || [];
  for (const m of found) push(m.replace(/[.,;]+$/, ''));
  return urls;
}


export const AskRequesterQuestionsModal: React.FC<AskRequesterQuestionsModalProps> = ({
  isOpen,
  campaign,
  onClose,
  onSendQuestions,
  intent: intentProp,
  isOutboundEnabled = false,
  recentOutreach = null
}) => {
  const intent: 'ask_missing' | 'delivery_complete' =
    intentProp ||
    (campaign?.outreachIntent === 'delivery_complete' ? 'delivery_complete' : 'ask_missing');
  const isDelivery = intent === 'delivery_complete';
  const domain = String(campaign?.domain || campaign?.taskDomain || 'marketing');
  const showMelissaCc = isDelivery && domain !== 'operational';

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
    'Listing property';

  const [selectedChannel, setSelectedChannel] = useState<'email' | 'text' | 'both'>('email');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(['photos']);
  const [customQuestionText, setCustomQuestionText] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [hasManuallyEditedMessage, setHasManuallyEditedMessage] = useState<boolean>(false);
  const [hasManuallyEditedSubject, setHasManuallyEditedSubject] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [ensuredDriveUrl, setEnsuredDriveUrl] = useState<string>('');

  useEffect(() => {
    if (recipient.emailVerified && recipient.phoneVerified) {
      setSelectedChannel('email');
    } else if (recipient.emailVerified) {
      setSelectedChannel('email');
    } else if (recipient.phoneVerified) {
      setSelectedChannel('text');
    }
  }, [recipient]);

  useEffect(() => {
    if (!isOpen || !campaign) return;
    setHasManuallyEditedMessage(false);
    setHasManuallyEditedSubject(false);
    setSelectedQuestions(isDelivery ? [] : ['photos']);
    setCustomQuestionText('');
    setDuplicateConfirmed(false);
    setStatusMessage(null);
    setEnsuredDriveUrl('');
    // Materials-ready defaults to email+text only when both destinations are verified.
    setSelectedChannel(
      isDelivery && recipient.emailVerified && recipient.phoneVerified
        ? 'both'
        : recipient.phoneVerified && !recipient.emailVerified
          ? 'text'
          : 'email'
    );
  }, [isOpen, campaign?.id, intent, isDelivery, recipient.emailVerified, recipient.phoneVerified]);

  // Delivery: create/reuse real AskNora Drive folder so the assets strip is not empty
  useEffect(() => {
    if (!isOpen || !campaign || !isDelivery) return;
    const taskId = campaign.taskId || campaign.id;
    if (!taskId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/marketing/tasks/${taskId}/ensure-drive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stagedAssets: campaign.approvePayload?.stagedAssets || [],
            proofUrl: campaign.proofUrl || campaign.approvePayload?.proofUrl,
            attachments: campaign.attachments || [],
            propertyAddress: campaign.propertyAddress,
            agentName: campaign.agentName || campaign.recipientName,
            agentEmail: campaign.agentEmail,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data?.linkable && data?.driveFolderUrl) {
          campaign.driveFolderUrl = data.driveFolderUrl;
          setEnsuredDriveUrl(data.driveFolderUrl);
          setStatusMessage(null);
        } else if (res.ok) {
          setEnsuredDriveUrl('');
          setStatusMessage(data?.error || 'Drive not linkable yet — send will attach files to email.');
        } else {
          setStatusMessage(data?.error || 'Could not create AskNora Drive folder yet — send will attach files.');
        }
      } catch (err: any) {
        if (!cancelled) setStatusMessage(err?.message || 'Drive folder ensure failed');
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, isDelivery, campaign?.id, campaign?.taskId]);

  useEffect(() => {
    if (!campaign) return;
    const greetingName = recipient.firstName || recipient.name.split(' ')[0] || 'there';

    if (!hasManuallyEditedSubject) {
      setEmailSubject(
        isDelivery
          ? `Your marketing materials are ready — ${propertyAddress}`
          : `Quick question on ${propertyAddress}`
      );
    }

    if (!hasManuallyEditedMessage) {
      if (isDelivery) {
        setCustomMessage(
          [
            `${greetingName}, we have your requested marketing assets ready. Click the Google Drive link below to view.`,
            ...(propertyAddress && propertyAddress !== 'Listing Property' ? ['', `Property: ${propertyAddress}`] : []),
            '',
            'Respond to this text if you need any revisions.',
          ].join('\n')
        );
      } else {
        const itemsList = selectedQuestions
          .map((id) => {
            if (id === 'custom' && customQuestionText.trim()) {
              return `• ${customQuestionText.trim()}`;
            }
            const item = QUESTION_CATALOG.find((q) => q.id === id);
            return item ? `• ${item.detail}` : null;
          })
          .filter(Boolean)
          .join('\n');

        setCustomMessage(
          [
            `Hi ${greetingName},`,
            ``,
            `We need a few additional details to continue the marketing request for ${propertyAddress}:`,
            itemsList || `• Clarification on requested deliverables`,
            ``,
            `You can reply directly to this message, and NORA will add the information to the existing request.`,
            ``,
            `Thank you,`,
            `Melissa Gagliardi`,
            `Nest Realty Marketing`,
            `(via Ask NORA · AskNora@NestRealty.com)`
          ].join('\n')
        );
      }
    }
  }, [
    selectedQuestions,
    customQuestionText,
    recipient,
    propertyAddress,
    hasManuallyEditedMessage,
    hasManuallyEditedSubject,
    campaign,
    isDelivery
  ]);

  if (!isOpen || !campaign) return null;

  const toggleQuestion = (id: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAction = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    const activeChannels: ('sms' | 'email')[] = [];
    if (selectedChannel === 'email' || selectedChannel === 'both') activeChannels.push('email');
    if (selectedChannel === 'text' || selectedChannel === 'both') activeChannels.push('sms');

    const payload = {
      campaignId: campaign.id || campaign.campaignId || campaign.taskId || 'camp_active',
      taskId: campaign.taskId || campaign.id,
      requesterId: campaign.requesterId || campaign.agentId || campaign.listingSnapshot?.listingAgentId || recipient.requesterId,
      recipientName: recipient.name,
      // Never send Nora hotline as agent phone (call-ingest / Eduardo seed poison)
      recipientPhone: recipient.phoneVerified ? recipient.phone : undefined,
      recipientEmail: recipient.emailVerified ? recipient.email : undefined,
      channels: activeChannels,
      message: customMessage,
      selectedQuestions: isDelivery ? ['delivery_ready'] : selectedQuestions,
      propertyAddress,
      intent,
      subject: emailSubject,
      ccEmails: showMelissaCc ? [MELISSA_CC] : [],
      domain,
      workspaceId: campaign.workspaceId || 'ws_wilmington',
      driveFolderUrl: campaign.driveFolderUrl || undefined,
      proofUrl: campaign.proofUrl || campaign.approvePayload?.proofUrl || undefined,
      assetUrls: isDelivery ? [] : collectDeliveryAssetLinks(campaign),
      attachments: (campaign.attachments || []).filter((a: any) => a?.url)
    };

    try {
      const res = await fetch('/api/marketing/requests/send-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok || responseData.success === false) {
        setStatusMessage(responseData.error || `Could not send (${res.status}). Check the agent contact and try again.`);
        setIsSubmitting(false);
        return;
      }

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
      setStatusMessage(err?.message || 'Network error — outreach not sent.');
      setIsSubmitting(false);
    }
  };

  const isEmailAvailable = recipient.emailVerified;
  const isTextAvailable = recipient.phoneVerified;
  const channelReady =
    selectedChannel === 'email'
      ? isEmailAvailable
      : selectedChannel === 'text'
        ? isTextAvailable
        : isEmailAvailable && isTextAvailable;
  const isOutboundBlocked = !isOutboundEnabled;
  let actionButtonLabel = 'Save Outreach Draft';
  if (!isOutboundBlocked) {
    if (isDelivery) {
      if (selectedChannel === 'email') actionButtonLabel = 'Send & complete';
      else if (selectedChannel === 'text') actionButtonLabel = 'Text & complete';
      else actionButtonLabel = 'Notify & complete';
    } else if (selectedChannel === 'email') actionButtonLabel = 'Send Email';
    else if (selectedChannel === 'text') actionButtonLabel = 'Send Text';
    else actionButtonLabel = 'Send Request';
  } else if (isDelivery) {
    actionButtonLabel = 'Save draft & complete';
  }

  const showRecentWarning = Boolean(recentOutreach);
  const isBlockedByDuplicate = showRecentWarning && !duplicateConfirmed;

  const dialog = (
    <div
      data-testid="ask-agent-dialog"
      data-intent={intent}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#00635C] text-white flex items-center justify-between border-b border-[#004d47]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white font-bold text-sm flex items-center justify-center shadow-inner shrink-0">
              {recipient.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-white" data-testid="ask-agent-dialog-title">
                  {isDelivery
                    ? `Notify agent — assets ready · ${recipient.name}`
                    : `Send Questions to Requester · Ask ${recipient.name}`}
                </h3>
                {contactAssuranceLabel(recipient) === 'Verified Contact' && (
                  <span
                    data-testid="verified-contact-badge"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 text-[10px] font-medium border border-emerald-300/30"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    Verified Contact
                  </span>
                )}
                {contactAssuranceLabel(recipient) === 'Allowlisted (prove)' && (
                  <span
                    data-testid="allowlisted-prove-badge"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-medium border border-white/30"
                  >
                    Allowlisted (prove)
                  </span>
                )}
              </div>
              <p className="text-[12px] text-emerald-100/85 truncate">
                {isDelivery
                  ? `Review & send before completing · ${propertyAddress}`
                  : `Request missing information for ${propertyAddress}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
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

          {isDelivery && (
            <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Approve is held until you send this note.</p>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Customize the message, pick email / text / both, then send. Marketing completes CC Melissa automatically.
                </p>
              </div>
            </div>
          )}

          {showRecentWarning && (
            <div
              data-testid="recent-contact-warning"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2"
            >
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-950">
                    NORA emailed {recipient.firstName} about these details {recentOutreach?.relativeTime || 'recently'}.
                  </p>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    Confirm if you wish to repeat outreach.
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

          {/* Polished email composition card */}
          <div
            data-testid="outreach-email-card"
            className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {selectedChannel === 'text' ? 'Text preview' : 'Email composition'}
              </span>
              <span className="text-[10px] text-slate-400">Edit before send</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="px-4 py-2.5 flex gap-3 items-start">
                <span className="w-12 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-0.5">From</span>
                <div>
                  <div className="font-semibold text-slate-900" data-testid="from-sender-label">
                    Ask NORA &lt;AskNora@NestRealty.com&gt;
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Tracked Nest mailbox · replies route to Nora</div>
                </div>
              </div>
              <div className="px-4 py-2.5 flex gap-3 items-start">
                <span className="w-12 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-0.5">To</span>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{recipient.name}</div>
                  <div className="text-[11px] text-slate-600 font-mono mt-0.5 space-y-0.5">
                    {recipient.maskedEmail ? (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{recipient.maskedEmail}</span>
                      </div>
                    ) : (
                      <span className="text-amber-700 font-sans text-[10px]">{recipient.emailExplanation}</span>
                    )}
                    {recipient.maskedPhone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{recipient.maskedPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {isDelivery && (
                <div className="px-4 py-2.5 border-b border-slate-100" data-testid="outreach-delivery-assets">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Completed assets</div>
                  {(() => {
                    const links = [
                      ...(ensuredDriveUrl ? [ensuredDriveUrl] : []),
                      ...collectDeliveryAssetLinks(campaign),
                    ].filter((u, i, arr) => u && arr.indexOf(u) === i);
                    if (!links.length) {
                      return (
                        <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 m-0">
                          Creating AskNora Drive folder… if this stays empty, retry Send or paste a link.
                        </p>
                      );
                    }
                    return (
                      <ul className="m-0 pl-4 space-y-1">
                        {links.map((url) => (
                          <li key={url} className="text-[12px] break-all">
                            <a href={url} target="_blank" rel="noreferrer" className="text-[#00635C] font-semibold hover:underline">
                              {/drive\.google\.com/i.test(url) ? 'Google Drive folder (AskNora)' : url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
              )}

              {showMelissaCc && selectedChannel !== 'text' && (
                <div className="px-4 py-2.5 flex gap-3 items-start" data-testid="outreach-cc-melissa">
                  <span className="w-12 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-0.5">Cc</span>
                  <div>
                    <div className="font-semibold text-slate-900">Melissa Gagliardi</div>
                    <div className="text-[11px] text-slate-600 font-mono">{MELISSA_CC}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Auto-CC on marketing complete outreach</div>
                  </div>
                </div>
              )}
              {selectedChannel !== 'text' && (
                <div className="px-4 py-2.5 flex gap-3 items-center">
                  <span className="w-12 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject</span>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => {
                      setEmailSubject(e.target.value);
                      setHasManuallyEditedSubject(true);
                    }}
                    data-testid="outreach-subject-input"
                    className="flex-1 text-xs font-semibold text-slate-800 bg-transparent outline-none border-b border-transparent focus:border-[#00635C] py-0.5"
                  />
                </div>
              )}
              <div className="px-4 py-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Message</label>
                <textarea
                  rows={isDelivery ? 9 : 7}
                  value={customMessage}
                  onChange={(e) => {
                    setCustomMessage(e.target.value);
                    setHasManuallyEditedMessage(true);
                  }}
                  data-testid="ask-agent-message-textarea"
                  className="w-full text-xs p-0 border-0 outline-none font-sans text-slate-800 resize-none leading-relaxed bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Channel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Send via</label>
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
                <span>Email</span>
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
                <span>Text message</span>
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

          {/* Missing-info chips — only for ask_missing */}
          {!isDelivery && (
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
                <input
                  type="text"
                  value={customQuestionText}
                  onChange={(e) => setCustomQuestionText(e.target.value)}
                  placeholder="Specify custom question..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-[#00635C] focus:ring-1 focus:ring-[#00635C] outline-none"
                />
              )}
            </div>
          )}

          {statusMessage && (
            <p className="text-xs text-slate-600">{statusMessage}</p>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting || !customMessage.trim() || isBlockedByDuplicate || !channelReady}
            onClick={handleAction}
            data-testid="ask-agent-submit-btn"
            className="px-5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
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

  if (typeof document === 'undefined') return dialog;
  return createPortal(dialog, document.body);
};
