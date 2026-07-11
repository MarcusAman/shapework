/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Smartphone, FileText, CheckCircle2, Upload, Send, MessageSquare, 
  Clock, CheckCircle, ArrowRight, ShieldCheck, Mail 
} from 'lucide-react';

export default function AgentActionPage() {
  const [activeRequest, setActiveRequest] = useState<'disclosure' | 'photos'>('disclosure');
  const [comment, setComment] = useState('');
  const [isUploaded, setIsUploaded] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const requestTemplates = {
    disclosure: {
      property: '742 Evergreen Terrace',
      dueDate: 'Friday, 5:00 PM',
      whyItMatters: 'Underwriting compliance check requires seller-signed disclosures to clear financing contingencies.',
      actionTitle: 'Upload Signed Seller Disclosure PDF',
      placeholder: 'Select signed PDF or drop file here...'
    },
    photos: {
      property: '102 Pine Street',
      dueDate: 'Tomorrow, 12:00 PM',
      whyItMatters: 'Listing coordinator needs photography verification to finalize MLS syndication checklist.',
      actionTitle: 'Confirm Professional Photography Scheduled Time',
      placeholder: 'Photography appointment confirmation details...'
    }
  };

  const currentTemplate = requestTemplates[activeRequest];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleReset = (req: 'disclosure' | 'photos') => {
    setActiveRequest(req);
    setIsSubmitted(false);
    setIsUploaded(false);
    setComment('');
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Tab Header explanation */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-green-soft flex items-center justify-center text-brand-green">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary uppercase tracking-wider">Secure Action Links (Agent Portal)</h2>
            <p className="text-xs text-text-secondary mt-0.5 font-medium">Demonstrate how agents complete checklist actions via simple mobile links without downloading another app.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Side: Admin Dispatcher & Preview */}
        <div className="space-y-6">
          <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-sm text-text-primary">Outbound SMS/Email Notification Preview</h3>
            
            {/* Quick selectors */}
            <div className="flex gap-2 bg-secondary-surface p-1 rounded-lg border border-border-subtle text-xs">
              <button
                onClick={() => handleReset('disclosure')}
                className={`flex-1 py-1.5 font-semibold rounded transition-colors ${
                  activeRequest === 'disclosure' ? 'bg-surface text-brand-green shadow-xs' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                742 Evergreen Disclosures
              </button>
              <button
                onClick={() => handleReset('photos')}
                className={`flex-1 py-1.5 font-semibold rounded transition-colors ${
                  activeRequest === 'photos' ? 'bg-surface text-brand-green shadow-xs' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                102 Pine Photos Scheduling
              </button>
            </div>

            {/* Simulated smartphone envelope */}
            <div className="border border-border-subtle rounded-2xl p-4 bg-stone-50/50 space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
                <Smartphone className="w-3.5 h-3.5" />
                <span className="font-bold">SMS Dispatch Message</span>
              </div>
              <div className="p-3 bg-brand-green-soft text-text-primary rounded-2xl text-[11px] leading-relaxed max-w-xs ml-auto shadow-xs border border-brand-green/10">
                <span className="font-bold block text-[10px] text-brand-green uppercase mb-0.5">Nest Realty Operations</span>
                Hi Todd, shapework identified a missing task: {currentTemplate.actionTitle.toLowerCase()} for {currentTemplate.property}. Please upload it here by {currentTemplate.dueDate}: <span className="underline font-bold text-brand-green font-mono">secure-link.nest/t/{activeRequest === 'disclosure' ? 'd8f2' : 'p4b9'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Agent Mobile Screen Simulation */}
        <div className="flex justify-center">
          <div className="w-full max-w-[340px] aspect-[9/18] border-8 border-stone-800 rounded-[36px] bg-stone-50 shadow-2xl overflow-hidden flex flex-col relative">
            
            {/* Speaker/Camera notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-stone-800 rounded-full z-20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-stone-900 rounded-full ml-auto mr-4" />
            </div>

            {/* Screen Content */}
            <div className="flex-1 overflow-y-auto pt-8 px-4 pb-6 flex flex-col justify-between">
              
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  
                  {/* Property Header */}
                  <div className="space-y-1 mt-2">
                    <span className="text-[9px] font-bold text-brand-green bg-brand-green-soft px-2 py-0.5 rounded font-mono">
                      Action Required
                    </span>
                    <h4 className="font-serif font-bold text-sm text-text-primary leading-tight mt-1">
                      {currentTemplate.property}
                    </h4>
                  </div>

                  {/* Due date card */}
                  <div className="p-2.5 bg-white border border-border-subtle rounded-xl flex items-center justify-between">
                    <span className="text-text-secondary font-medium">Due Date:</span>
                    <span className="text-status-attention font-bold font-mono">{currentTemplate.dueDate}</span>
                  </div>

                  {/* Context block */}
                  <div className="p-3 bg-secondary-surface rounded-xl border border-border-subtle/80 space-y-1">
                    <span className="text-[8px] font-bold text-text-tertiary uppercase tracking-wider block">Why this matters</span>
                    <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                      {currentTemplate.whyItMatters}
                    </p>
                  </div>

                  {/* Action input block */}
                  <div className="space-y-2">
                    <label className="font-bold text-text-secondary block">
                      {currentTemplate.actionTitle}
                    </label>

                    {activeRequest === 'disclosure' ? (
                      <div 
                        onClick={() => setIsUploaded(true)}
                        className={`p-6 border border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          isUploaded 
                            ? 'bg-brand-green-soft/30 border-brand-green text-brand-green' 
                            : 'bg-white border-border-subtle hover:bg-stone-50 text-text-tertiary'
                        }`}
                      >
                        {isUploaded ? (
                          <>
                            <CheckCircle2 className="w-6 h-6" />
                            <span className="font-bold font-mono text-[9px]">Baker_Disclosures_Signed.pdf</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            <span className="font-semibold text-[10px] text-center">{currentTemplate.placeholder}</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        placeholder={currentTemplate.placeholder}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full border border-border-subtle p-2.5 rounded-xl bg-white focus:outline-none focus:border-brand-green"
                      />
                    )}
                  </div>

                  {/* Message comment box */}
                  <div className="space-y-1">
                    <label className="font-bold text-text-secondary block">Add Note (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Comment for your coordinator..."
                      value={activeRequest === 'disclosure' ? comment : ''}
                      onChange={(e) => activeRequest === 'disclosure' && setComment(e.target.value)}
                      className="w-full border border-border-subtle p-2 rounded-xl bg-white focus:outline-none focus:border-brand-green resize-none text-[10px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm transition-colors text-xs mt-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to Coordinator</span>
                  </button>

                </form>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4 mt-6">
                  <div className="w-12 h-12 rounded-full bg-brand-green-soft text-brand-green flex items-center justify-center shadow-xs border border-brand-green/10 animate-bounce">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-sm text-text-primary">Submission Received!</h4>
                    <p className="text-[10px] text-text-secondary leading-normal font-medium">
                      shapework updated the transaction stage and checklist automatically.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-secondary-surface rounded-xl border border-border-subtle text-[9px] font-mono text-text-tertiary leading-relaxed text-left w-full space-y-1">
                    <span className="font-bold text-text-secondary block uppercase tracking-wider text-[8px]">Audit Event Logged</span>
                    <div>• Action: Ingested secure submission</div>
                    <div>• Target: {currentTemplate.property}</div>
                    <div>• Actor: Agent (via mobile secure link)</div>
                    <div>• Status: Success. Synced to Dotloop.</div>
                  </div>

                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="text-[10px] text-text-tertiary hover:underline font-semibold"
                  >
                    Submit another response
                  </button>
                </div>
              )}

              {/* Status pill spacer */}
              <div className="w-24 h-1 bg-stone-300 rounded-full mx-auto mt-6" />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
