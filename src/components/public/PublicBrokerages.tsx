import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ArrowRightLeft, FileSpreadsheet, RefreshCw, MessageSquare, ShieldCheck, Inbox, ClipboardList, Database, ShieldAlert, ChevronRight } from 'lucide-react';
import SectionHeader from './SectionHeader';
import CTASection from './CTASection';

interface PublicBrokeragesProps {
  onNavigate: (path: string) => void;
}

export default function PublicBrokerages({ onNavigate }: PublicBrokeragesProps) {
  const workflows = [
    {
      icon: Inbox,
      name: "Request Desk",
      problem: "Admins receive marketing, sign, and lockbox requests via random texts, calls, and email threads.",
      solution: "Consolidates all channels into a structured intake pipeline that translates messy texts into clear inventory tasks.",
      outcome: "Zero dropped agent requests; average response times drop below 15 minutes.",
      signal: "SMS from agent: 'Need listing signs and lockbox installed at 124 Oak St by tomorrow morning.'",
      action: "System checks sign inventory, schedules lockbox routing, and drafts confirmation SMS to agent."
    },
    {
      icon: ShieldAlert,
      name: "Owner Shield",
      problem: "Owners spend 20+ hours per week acting as routers, answering repetitive questions, and resolving minor staff conflicts.",
      solution: "Enforces a rule-based triage system that handles routine issues and routes only true exceptions to leadership.",
      outcome: "75% reduction in owner interruptions; operations run autonomously.",
      signal: "Agent emails owner: 'Client is complaining about closing doc delay. Can we close anyway?'",
      action: "System reviews file compliance ledger, flags missing addendum, and drafts coordinator message."
    },
    {
      icon: ShieldCheck,
      name: "Deal Intake Guard",
      problem: "Agents write contracts but delay filing them in the transaction portal, leaving leadership blind to active deals.",
      solution: "Monitors MLS changes and email communications in real-time to detect under-contract events and auto-chases agent filings.",
      outcome: "100% visibility of active deals within 24 hours of execution.",
      signal: "MLS update: 445 Ridgewood Hill status transitioned to 'Under Contract'. No file in SkySlope.",
      action: "System flags missing intake form, issues warning, and emails agent secure filing link."
    },
    {
      icon: ClipboardList,
      name: "Compliance Guard",
      problem: "Closing files are audited only in the final week, resulting in a stressful rush to collect signatures and wire forms.",
      solution: "Sweeps file storage daily, flagging missing items at milestones and emailing secure upload links directly to agents.",
      outcome: "90% reduction in late-night closing audits and delayed commission disbursements.",
      signal: "Closing scheduled for 102 Pine St in 5 days. Lead Paint Disclosure is in file but missing seller initials.",
      action: "System triggers SMS to agent with secure upload link to submit the fully executed disclosure."
    }
  ];

  return (
    <div className="space-y-16 md:space-y-24 py-10 md:py-16 text-left font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary block mb-3">
          Real Estate Practice
        </span>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-text-primary tracking-tight leading-tight mb-4">
          Brokerage operations should not depend on group texts and memory.
        </h1>
        <p className="text-sm md:text-base text-text-secondary leading-relaxed font-sans font-light max-w-3xl mb-8">
          shapework. gives brokerage leaders one operating layer for agent requests, deal intake, compliance follow-up, listing launch, onboarding, owner escalations, and audit.
        </p>

        <div className="p-6 md:p-10 bg-brand-soft/40 border border-brand-primary/15 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="space-y-1">
            <span className="text-2xl font-mono font-bold text-brand-primary">70%</span>
            <h4 className="text-xs font-semibold uppercase text-text-primary">Compliance Panic Reduction</h4>
            <p className="text-xs text-text-secondary leading-normal font-light">
              By automating disclosures checks and agent notifications at milestones, we eliminate late-night closing audits.
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-mono font-bold text-brand-primary">15 hrs</span>
            <h4 className="text-xs font-semibold uppercase text-text-primary">TC Time Saved Per Week</h4>
            <p className="text-xs text-text-secondary leading-normal font-light">
              We remove manual copying of email contract details, allowing coordinators to audit files instead of chasing paperwork.
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-mono font-bold text-brand-primary">4 Days</span>
            <h4 className="text-xs font-semibold uppercase text-text-primary">Onboarding Cycle Time</h4>
            <p className="text-xs text-text-secondary leading-normal font-light">
              Checklists launch automatically, ensuring agent splits, MLS accesses, and emails are set up instantly.
            </p>
          </div>
        </div>
      </section>

      {/* 2. THE FOUR CORE WORKFLOWS SECTION */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <div className="space-y-8">
          <h2 className="text-2xl font-serif font-bold text-text-primary">
            The Four Core Brokerage Workflows
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {workflows.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div 
                  key={idx}
                  className="p-6 md:p-8 bg-surface border border-border-soft rounded-[24px] shadow-soft hover:shadow-card hover:border-brand-primary/45 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center text-brand-primary">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-text-tertiary">
                        WORKFLOW 0{idx + 1}
                      </span>
                    </div>
                    
                    <h3 className="text-lg md:text-xl font-serif font-bold text-text-primary">
                      {mod.name}
                    </h3>
                    
                    <div className="space-y-3 pt-2 text-xs md:text-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider block">
                          The Problem
                        </span>
                        <p className="text-text-secondary leading-relaxed font-light">
                          {mod.problem}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-brand-primary tracking-wider block">
                          What shapework. builds
                        </span>
                        <p className="text-text-primary leading-relaxed font-light">
                          {mod.solution}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border-soft/60 space-y-3 text-[11px] md:text-xs">
                    <div className="space-y-1 bg-stone-50/50 p-3 rounded-lg border border-border-soft/40">
                      <span className="text-[9px] font-mono text-text-tertiary uppercase block">
                        Example Inbound Signal
                      </span>
                      <p className="text-text-secondary italic leading-relaxed">
                        "{mod.signal}"
                      </p>
                      <span className="text-[9px] font-mono text-brand-primary uppercase block pt-1.5">
                        Recommended Action
                      </span>
                      <p className="text-brand-primary font-medium leading-relaxed">
                        {mod.action}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] uppercase font-semibold text-brand-primary tracking-wider">
                        Verifiable Outcome
                      </span>
                      <span className="text-brand-primary font-serif italic font-bold">
                        {mod.outcome}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. BEFORE / AFTER COMPARISON SECTION */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto border-t border-border-soft/40 pt-16 md:pt-24 text-left">
        <div className="space-y-8">
          <h2 className="text-2xl font-serif font-bold text-text-primary">
            Before and After shapework.
          </h2>
          
          <div className="overflow-x-auto border border-border-soft rounded-2xl shadow-soft">
            <table className="min-w-full divide-y divide-border-soft text-left text-xs md:text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th scope="col" className="px-6 py-4 font-bold text-text-primary uppercase tracking-wider text-[10px] w-1/2">
                    Before shapework.
                  </th>
                  <th scope="col" className="px-6 py-4 font-bold text-brand-primary uppercase tracking-wider text-[10px] w-1/2">
                    After shapework.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft bg-surface">
                {[
                  {
                    before: "Agent requests for marketing, signs, and supplies are scattered across group texts, calls, and email threads.",
                    after: "All intake channels feed a single Request Desk queue with automated triage, checklists, and route drafts."
                  },
                  {
                    before: "Owners spend 20+ hours per week forwarding lender emails, reviewing splits, and routing administrative queries.",
                    after: "Triage layers shield ownership from routine matters, surfacing only exceptions and critical compliance decisions."
                  },
                  {
                    before: "Contract intake is skipped or delayed, leaving the brokerage blind to pipeline revenue splits and commission totals.",
                    after: "Intake checks flag missing transaction records within 24 hours of MLS under-contract status shifts."
                  },
                  {
                    before: "Coordinators spend closing week chasing agents for signed disclosures, escrow wires, and addenda.",
                    after: "Continuous background audits trigger milestones and dispatch secure document upload links to agents."
                  },
                  {
                    before: "Listing launch and agent onboarding checklists are run from memory, resulting in uneven splits and errors.",
                    after: "Consistent, automated check boards run in the background, updating splits, calendars, and signs."
                  }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/20 transition-colors">
                    <td className="px-6 py-4 text-text-secondary leading-relaxed font-light font-sans align-top">
                      {row.before}
                    </td>
                    <td className="px-6 py-4 text-text-primary leading-relaxed font-light font-sans align-top bg-brand-soft/10">
                      {row.after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. DISCOVERY CALL TO ACTION */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto pt-8">
        <div className="bg-brand-primary text-white py-12 px-6 md:px-12 rounded-[24px] relative overflow-hidden shadow-card text-center">
          <div className="max-w-xl mx-auto space-y-5 relative z-10">
            <h3 className="text-xl md:text-3xl font-serif font-bold tracking-tight">
              Request Brokerage Workflow Discovery
            </h3>
            <p className="text-xs md:text-sm text-brand-soft/80 font-light leading-relaxed">
              We will sit with your coordinators, map your current loops, identify leakage points, and configure one quick win live in one week.
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => onNavigate('/discovery')}
                className="px-6 py-3 bg-white hover:bg-brand-soft text-brand-primary text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Request Discovery Request</span>
                <ChevronRight className="w-3.5 h-3.5 text-brand-primary" />
              </button>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}
