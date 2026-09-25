/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ContactSummaryCard — Request-Level Contact & Communication Status Card
 * Answers critical staff questions at a glance:
 * - Who contacted NORA?
 * - Did NORA contact the requester afterward?
 * - What channel was used?
 * - Was communication drafted, queued, blocked, delivered, failed, or answered?
 * - Were files or photographs received?
 * - Who is the ball in whose court (Waiting on)?
 */

import React from 'react';
import {
  User,
  Phone,
  Mail,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Send,
  Camera,
  ShieldAlert,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import type { ContactSummary, CommunicationStatus, ChannelType } from '../../../server/services/activityHistoryService.js';
import { formatEasternDateTime, formatRelativeTime } from './ActivityAndContactTimeline';

export interface ContactSummaryCardProps {
  contactSummary?: ContactSummary | null;
  loading?: boolean;
  className?: string;
}

export const ContactSummaryCard: React.FC<ContactSummaryCardProps> = ({
  contactSummary,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`p-4 bg-white border border-slate-200 rounded-2xl animate-pulse space-y-3 ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!contactSummary) {
    return null;
  }

  const {
    requesterName,
    requesterChannel,
    lastNoraContact,
    lastInboundReply,
    waitingOn,
    timeWaiting,
    communicationBlockedByPolicy,
    policyBannerMessage
  } = contactSummary;

  // Status badge helper
  const renderStatusBadge = (status?: CommunicationStatus, isBlocked?: boolean) => {
    if (isBlocked || status === 'blocked') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <ShieldAlert className="w-3 h-3 text-rose-600" />
          Blocked (Not Sent)
        </span>
      );
    }
    switch (status) {
      case 'drafted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Drafted (Pending Approval)
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            Queued
          </span>
        );
      case 'held':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-700" />
            Held
          </span>
        );
      case 'provider_accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Send className="w-3 h-3 text-indigo-600" />
            Accepted by Provider
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Delivered
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Delivery Failed
          </span>
        );
      case 'bounced':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Bounced
          </span>
        );
      case 'replied':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <RotateCcw className="w-3 h-3 text-teal-600" />
            Reply Received
          </span>
        );
      default:
        return null;
    }
  };

  // Channel icon helper
  const getChannelIcon = (ch?: ChannelType) => {
    switch (ch) {
      case 'phone':
        return <Phone className="w-3.5 h-3.5" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5" />;
      case 'web':
        return <Globe className="w-3.5 h-3.5" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  // Waiting on badge helper
  const getWaitingOnBadge = () => {
    switch (waitingOn) {
      case 'agent':
        return {
          label: 'Waiting on: Requester / Agent',
          color: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'nora':
        return {
          label: 'Waiting on: NORA Follow-up',
          color: 'bg-blue-50 text-blue-800 border-blue-200'
        };
      case 'assignee':
        return {
          label: 'Waiting on: Production Assignee',
          color: 'bg-purple-50 text-purple-800 border-purple-200'
        };
      case 'manager':
        return {
          label: 'Waiting on: Manager Review',
          color: 'bg-indigo-50 text-indigo-800 border-indigo-200'
        };
      case 'completed':
        return {
          label: 'Completed / Delivered',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        };
      default:
        return {
          label: `Waiting on: ${waitingOn}`,
          color: 'bg-slate-50 text-slate-700 border-slate-200'
        };
    }
  };

  const waitingBadge = getWaitingOnBadge();

  return (
    <div className={`bg-gradient-to-br from-white to-slate-50/50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 ${className}`}>
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E5EFEA] text-[#00635C] flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900">{requesterName || 'Unknown Requester'}</h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/80 uppercase">
                {getChannelIcon(requesterChannel)}
                <span>{requesterChannel}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">Authoritative Request Contact Record</p>
          </div>
        </div>

        {/* Current Ball-In-Court State */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${waitingBadge.color}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{waitingBadge.label}</span>
          </span>
          {timeWaiting && (
            <span className="text-xs font-medium text-slate-500">
              ({timeWaiting})
            </span>
          )}
        </div>
      </div>

      {/* 3 Core Answer Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Column 1: NORA Outreach State */}
        <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Send className="w-3 h-3 text-[#00635C]" />
              NORA Outreach
            </span>
            {lastNoraContact ? (
              renderStatusBadge(lastNoraContact.status, lastNoraContact.isBlocked)
            ) : (
              <span className="text-[11px] font-medium text-slate-400">None yet</span>
            )}
          </div>

          {lastNoraContact ? (
            <div className="space-y-1 text-xs">
              <div className="text-slate-800 font-medium line-clamp-2">
                {lastNoraContact.summary}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="inline-flex items-center gap-1">
                  {getChannelIcon(lastNoraContact.channel)}
                  <span className="capitalize">{lastNoraContact.channel}</span>
                </span>
                <span title={formatEasternDateTime(lastNoraContact.timestamp)}>
                  {formatRelativeTime(lastNoraContact.timestamp)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No outbound contact has been initiated by NORA for this request.
            </p>
          )}
        </div>

        {/* Column 2: Requester Replies & Assets */}
        <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-teal-600" />
              Inbound Reply &amp; Assets
            </span>
            {lastInboundReply?.photosCount !== undefined && lastInboundReply.photosCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                <Camera className="w-3 h-3 text-teal-600" />
                {lastInboundReply.photosCount} photos received
              </span>
            )}
          </div>

          {lastInboundReply ? (
            <div className="space-y-1 text-xs">
              <div className="text-slate-800 font-medium line-clamp-2">
                {lastInboundReply.summary}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>From: <strong className="text-slate-700">{lastInboundReply.sender}</strong></span>
                <span title={formatEasternDateTime(lastInboundReply.timestamp)}>
                  {formatRelativeTime(lastInboundReply.timestamp)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Awaiting reply from requester.
            </p>
          )}
        </div>
      </div>

      {/* Policy Guardrail Notice */}
      {communicationBlockedByPolicy && (
        <div className="flex items-start gap-2 p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-800">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Outbound Policy Active: </span>
            {policyBannerMessage || 'Outbound communications are currently paused by policy.'} Inquiries and deliveries are logged and displayed as <strong className="font-semibold">Blocked (Not Sent)</strong> rather than falsely claiming delivery.
          </div>
        </div>
      )}
    </div>
  );
};
