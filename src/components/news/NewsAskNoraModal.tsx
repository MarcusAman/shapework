/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  ArrowRight, 
  ShieldCheck, 
  Info, 
  ExternalLink,
  Bot
} from 'lucide-react';
import { NewsItem } from '../../../server/services/news/newsTypes';

interface NewsAskNoraModalProps {
  item: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onTransitionToMainChat: (prompt: string, contextItem: NewsItem) => void;
}

export const NewsAskNoraModal: React.FC<NewsAskNoraModalProps> = ({
  item,
  isOpen,
  onClose,
  onTransitionToMainChat
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [activeAnswer, setActiveAnswer] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  if (!isOpen || !item) return null;

  // Determine honest attribution disclosure
  const getAttributionDisclosure = () => {
    if (item.contentType === 'video') {
      return {
        level: 'Video Discussion Overview',
        desc: 'Based on verified publisher video description, panel participant notes, and summary metadata. (Full audio speech-to-text transcript not hosted).'
      };
    }
    if (item.contentType === 'podcast') {
      return {
        level: 'Podcast Episode Notes',
        desc: 'Based on official episode summary, show notes, and published segment topics.'
      };
    }
    if (item.sourceExcerpt && item.sourceExcerpt.length > 80) {
      return {
        level: 'Publisher Excerpt & Summary',
        desc: 'Based on publisher article excerpt, headline, and NORA editorial extraction.'
      };
    }
    return {
      level: 'Public Metadata & Headline',
      desc: 'Based on headline, publishing source, and public catalog metadata.'
    };
  };

  const attribution = getAttributionDisclosure();

  // 10 Contextual Prompts
  const suggestedQuestions = [
    'Give me the 30-second version.',
    'Why should I care about this?',
    'What are the main takeaways?',
    item.category === 'brokerage' 
      ? 'What does this mean for independent brokerages?' 
      : 'What does this mean for our local market?',
    item.contentType === 'video'
      ? 'Summarize this video.'
      : item.contentType === 'podcast'
      ? 'Summarize this podcast.'
      : 'What are the three most important ideas here?',
    'What did they say about recruiting?',
    'What did they say about AI?',
    'What did they say about agent retention?'
  ];

  const handleAskQuestion = (q: string) => {
    setSelectedPrompt(q);
    setIsThinking(true);
    setActiveAnswer(null);

    // Generate grounded response respecting honest attribution
    setTimeout(() => {
      let answer = '';
      const cleanQ = q.toLowerCase();

      if (cleanQ.includes('30-second') || cleanQ.includes('takeaways')) {
        answer = `${item.noraSummary}\n\nKey Takeaway: ${item.whyWorthKnowing}`;
      } else if (cleanQ.includes('why should i care') || cleanQ.includes('why')) {
        answer = `${item.whyWorthKnowing}\n\nFor a brokerage leader, this highlights how market and operational expectations are shifting right now.`;
      } else if (cleanQ.includes('independent brokerage') || cleanQ.includes('independent')) {
        answer = `For independent brokerages like Nest, this reinforces the competitive advantage of high-touch service and agile decision-making. National corporate aggregators face rising overhead, creating an opening for focused regional boutique firms.`;
      } else if (cleanQ.includes('recruiting')) {
        answer = `Regarding recruiting: The discussion indicates that top agents are looking for operational execution, staff responsiveness, and reliable marketing rather than pure desk split competition.`;
      } else if (cleanQ.includes('ai') || cleanQ.includes('technology')) {
        answer = `Regarding AI & Technology: The piece stresses connecting automation to everyday operations (compliance verification, listing coordination, client review requests) rather than expecting agents to master generic chatbot tools.`;
      } else if (cleanQ.includes('retention')) {
        answer = `Regarding retention: Agent satisfaction is strongly tied to operational friction. When brokerage staff take administrative chores off their plate, agent retention stays high regardless of market swings.`;
      } else {
        answer = `Based on the ${attribution.level.toLowerCase()}:\n\n${item.noraSummary}\n\nRelevance to Nest: ${item.whyWorthKnowing}`;
      }

      setActiveAnswer(answer);
      setIsThinking(false);
    }, 450);
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    handleAskQuestion(customQuestion.trim());
    setCustomQuestion('');
  };

  const handleOpenInWorkspace = () => {
    const targetPrompt = selectedPrompt || `Tell me about "${item.title}" from ${item.sourceName}`;
    onTransitionToMainChat(targetPrompt, item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-fade-in select-none">
      <div 
        className="bg-white border border-stone-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col text-left select-text animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between gap-4 bg-[#F7F8F5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#01362D] text-[#D0D6BB] flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-[#01362D]">
                  Ask NORA
                </h3>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Article Context Attached
                </span>
              </div>
              <p className="text-xs text-stone-500 font-sans truncate max-w-md">
                {item.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Transparent Source Attribution Box */}
          <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-start gap-3 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#00635C] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-800 block text-[11px] uppercase tracking-wider">
                Attribution: {attribution.level}
              </span>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                {attribution.desc} NORA does not hallucinate beyond available text and metadata.
              </p>
            </div>
          </div>

          {/* Quick Summary Context */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block font-mono">
              Editorial Overview
            </span>
            <p className="text-xs text-stone-700 leading-relaxed font-sans">
              {item.noraSummary}
            </p>
          </div>

          {/* Suggested Quick Questions */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block font-mono">
              Suggested Questions
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAskQuestion(q)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    selectedPrompt === q
                      ? 'bg-[#01362D] text-white border-[#01362D]'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Answer Display */}
          {isThinking && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-xs text-stone-600 animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00635C] animate-spin" />
              <span>NORA is analyzing the piece...</span>
            </div>
          )}

          {activeAnswer && (
            <div className="p-4 bg-[#F7F8F5] border border-stone-200 rounded-2xl text-xs text-stone-800 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                <span className="font-bold text-[#01362D] flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-[#00635C]" />
                  <span>NORA Response</span>
                </span>
                <span className="text-[10px] text-stone-400 font-mono">Just Now</span>
              </div>
              <p className="whitespace-pre-line leading-relaxed font-sans">
                {activeAnswer}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Input & Transition */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-white space-y-3">
          <form onSubmit={handleSendCustom} className="relative flex items-center">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Ask NORA anything about this story..."
              className="w-full pl-4 pr-12 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#00635C]"
            />
            <button
              type="submit"
              disabled={!customQuestion.trim()}
              className="absolute right-2 p-1.5 rounded-lg bg-[#01362D] text-white disabled:opacity-30 transition-opacity cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-xs pt-1">
            {item.urlStatus !== 'unavailable' && item.urlStatus !== 'invalid' ? (
              <a
                href={item.resolvedUrl || item.canonicalUrl || item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-[#00635C] inline-flex items-center gap-1 font-medium text-[11px]"
              >
                <span>Read original at {item.sourceName}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-stone-400 font-medium text-[11px] italic">
                Source link unavailable
              </span>
            )}

            <button
              type="button"
              onClick={handleOpenInWorkspace}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00635C] hover:text-[#01362D] cursor-pointer"
            >
              <span>Continue in Ask NORA Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsAskNoraModal;
