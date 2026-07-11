import React from 'react';
import SectionHeader from './SectionHeader';
import SignalToActionLoop from './SignalToActionLoop';
import CTASection from './CTASection';

interface PublicIntelligenceProps {
  onNavigate: (path: string) => void;
}

export default function PublicIntelligence({ onNavigate }: PublicIntelligenceProps) {
  return (
    <div className="space-y-16 md:space-y-24 py-10 md:py-16 text-left font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <SectionHeader
          eyebrow="Operational Intelligence"
          title="Background intelligence. Not flashy AI chatbots."
          subtitle="We don't believe in conversational chat interfaces replacing standard systems. We configure background AI to handle predictable classification, data extraction, and drafting tasks—keeping human verification firmly in the loop."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border-soft/60">
          <div className="space-y-3">
            <h3 className="text-lg font-serif font-bold text-text-primary">
              Where AI belongs: Background Triage
            </h3>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-light">
              AI earns its place when it handles repetitive administrative tasks that consume human attention. That means reading inbound emails to categorize intent, identifying dates inside PDF agreements, matching wire confirmations with expected escrow totals, and preparing drafts.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-serif font-bold text-text-primary">
              Where AI does NOT belong: Opaque Execution
            </h3>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-light">
              We never configure AI to take irreversible actions on its own. An AI agent should never email an agent to complain about compliance, change commission splits in accounting, or release escrow funds without explicit human authorization.
            </p>
          </div>
        </div>
      </section>

      {/* 2. THE SIGNAL TO ACTION LOOP DIAGRAM */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-serif font-bold text-text-primary">
              The Signal-to-Action Pipeline
            </h3>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed max-w-2xl font-light">
              Here is how shapework. maps inbound signals, automates document analysis, drafts responses, and logs permanent audit records.
            </p>
          </div>
          <div className="bg-surface-soft border border-border-soft rounded-[32px] p-6 md:p-10">
            <SignalToActionLoop />
          </div>
        </div>
      </section>

      {/* 3. PLATFORM INTEGRATION LAYER */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-2xl font-serif font-bold text-text-primary">
              Sits directly above the tools you already use.
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed font-light">
              You don't need to migrate your database or replace your software suite. shapework. connects to your tools behind the scenes via secure API layers.
            </p>
            
            <div className="space-y-4 pt-2 text-xs">
              <div>
                <span className="font-semibold text-text-primary block">SkySlope & DocuSign API Integration</span>
                <p className="text-text-secondary font-light">Sweeps directories daily to verify signatures and update compliance logs.</p>
              </div>
              <div>
                <span className="font-semibold text-text-primary block">Gmail & Outlook Email Sync</span>
                <p className="text-text-secondary font-light">Monitors inbox signals for contract adjustments, status updates, and lender requests.</p>
              </div>
              <div>
                <span className="font-semibold text-text-primary block">QuickBooks Online Sync</span>
                <p className="text-text-secondary font-light">Verifies wiring receipts against transaction splits and records payout entries.</p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-7 bg-surface border border-border-soft rounded-[32px] p-6 md:p-8 space-y-6 shadow-soft">
            <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-widest block">
              Operational Memory & Audit Trails
            </span>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-light">
              Every single event, email read, classification score, recommendation, and coordinator approval is permanently logged in a structured ledger. If a dispute arises or a file is audited, you have a complete timeline of who knew what, when they knew it, and who approved the action.
            </p>
            <div className="p-4 bg-stone-50 border border-border-soft rounded-xl space-y-2">
              <span className="text-[9px] font-mono text-brand-primary font-bold uppercase block">
                Sample Operational Ledger Entry
              </span>
              <div className="font-mono text-[10px] text-text-secondary leading-relaxed space-y-1">
                <p><span className="text-text-tertiary">[2026-06-29 14:32:01]</span> <span className="text-brand-primary">INBOUND_EMAIL</span>: Detected from a.walker@apexhomeloans.com</p>
                <p><span className="text-text-tertiary">[2026-06-29 14:32:02]</span> <span className="text-brand-primary">AI_CLASSIFY</span>: Intent 'verify tax transcripts' with confidence 96%</p>
                <p><span className="text-text-tertiary">[2026-06-29 14:32:03]</span> <span className="text-brand-primary">DB_LOOKUP</span>: Verified transcripts missing from '102 Pine Street' file</p>
                <p><span className="text-text-tertiary">[2026-06-29 14:32:04]</span> <span className="text-brand-primary">RECOMMEND_ACTION</span>: Prepared request email draft to Arthur Pendragon</p>
                <p><span className="text-text-tertiary">[2026-06-29 14:35:12]</span> <span className="text-brand-primary">USER_APPROVE</span>: Coordinator 'Diane Ross' approved & sent draft</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DISCOVERY CALL TO ACTION */}
      <section className="px-6 md:px-12">
        <CTASection onNavigate={onNavigate} />
      </section>
      
    </div>
  );
}
