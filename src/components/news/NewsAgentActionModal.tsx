/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Users, 
  Bot, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles,
  Share2
} from 'lucide-react';
import { NewsItem } from '../../../server/services/news/newsTypes';
import { generateClientTalkingPoints, generateTeamMeetingTakeaways } from './newsThemeAssets';

interface NewsAgentActionModalProps {
  item: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAskNora?: (item: NewsItem) => void;
}

export const NewsAgentActionModal: React.FC<NewsAgentActionModalProps> = ({
  item,
  isOpen,
  onClose,
  onAskNora
}) => {
  const [activeTab, setActiveTab] = useState<'client' | 'meeting' | 'nora'>('client');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const clientPoints = generateClientTalkingPoints(item);
  const meetingPoints = generateTeamMeetingTakeaways(item);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const formattedClientEmail = `${clientPoints.headline}\n\nHi there,\n\nI wanted to share a quick update on recent real estate developments:\n\n${clientPoints.talkingPoints.map(p => `• ${p}`).join('\n\n')}\n\nLet me know if you have any questions about how this impacts your plans!\n\nBest,`;

  const formattedClientSms = `${clientPoints.headline}: Quick market note for you:\n${clientPoints.talkingPoints[0]}\nHappy to chat details anytime!`;

  const formattedMeetingAgenda = `${meetingPoints.agendaTopic}\n\nKey Points:\n${meetingPoints.keyDiscussionPoints.join('\n')}\n\nAction:\n${meetingPoints.recommendedBrokerAction}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-100 bg-[#F7F8F5] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 bg-[#01362D] text-[#D0D6BB] rounded-full text-[10.5px] font-semibold tracking-wide">
                Agent Action Toolkit
              </span>
              <span className="text-xs font-semibold text-stone-500">
                {item.sourceName}
              </span>
            </div>
            <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 leading-snug">
              {item.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200/60 transition-colors cursor-pointer shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200/80 px-6 bg-white gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'client'
                ? 'border-[#00635C] text-[#00635C]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Client Talking Points</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('meeting')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'meeting'
                ? 'border-[#00635C] text-[#00635C]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Meeting Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onAskNora) {
                onClose();
                onAskNora(item);
              }
            }}
            className="flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 border-transparent text-stone-500 hover:text-[#00635C] transition-all cursor-pointer ml-auto"
          >
            <Bot className="w-4 h-4 text-[#00635C]" />
            <span>Deep Dive with NORA</span>
            <ExternalLink className="w-3 h-3 text-stone-400" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-left">
          {/* TAB 1: CLIENT TALKING POINTS */}
          {activeTab === 'client' && (
            <div className="space-y-4">
              <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-amber-200/70">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                  How To Use With Clients
                </span>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  {clientPoints.suggestedAction}
                </p>
              </div>

              <div>
                <h4 className="font-serif font-bold text-base text-stone-900 mb-3">
                  {clientPoints.headline}
                </h4>
                <ul className="space-y-2.5">
                  {clientPoints.talkingPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                      <span className="w-5 h-5 rounded-full bg-[#00635C]/10 text-[#00635C] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Copy Buttons */}
              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleCopy(formattedClientEmail, 'email')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#01362D] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {copiedType === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'email' ? 'Copied Email Draft!' : 'Copy Full Email Draft'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(formattedClientSms, 'sms')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {copiedType === 'sms' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'sms' ? 'Copied Text Message!' : 'Copy Quick SMS'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TEAM MEETING TAKEAWAY */}
          {activeTab === 'meeting' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/70">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                  Sales Meeting / Leadership Context
                </span>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  {meetingPoints.recommendedBrokerAction}
                </p>
              </div>

              <div>
                <h4 className="font-serif font-bold text-base text-stone-900 mb-3">
                  {meetingPoints.agendaTopic}
                </h4>
                <ul className="space-y-2.5">
                  {meetingPoints.keyDiscussionPoints.map((pt, i) => (
                    <li key={i} className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy(formattedMeetingAgenda, 'agenda')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#01362D] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {copiedType === 'agenda' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'agenda' ? 'Copied Agenda Notes!' : 'Copy Meeting Agenda Notes'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>Formatted for Nest Realty agents & leadership</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
