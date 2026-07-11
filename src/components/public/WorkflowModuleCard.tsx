import React from 'react';
import { Inbox, ShieldCheck, FileCheck, ClipboardList, Database, ShieldAlert } from 'lucide-react';

interface Module {
  icon: React.ComponentType<any>;
  name: string;
  problem: string;
  solution: string;
  outcome: string;
}

export default function WorkflowModuleCard() {
  const modules: Module[] = [
    {
      icon: Inbox,
      name: "Request Desk",
      problem: "Admins receive marketing, signage, and lockbox requests via random texts, phone calls, and email threads.",
      solution: "Consolidates all channels into a structured intake pipeline that transcribes calls, routes tasks, and drafts updates automatically.",
      outcome: "Zero dropped agent requests; average response times drop below 15 minutes."
    },
    {
      icon: ShieldAlert,
      name: "Owner Shield",
      problem: "Owners and executives spend 20+ hours per week acting as routers, answering repetitive questions, and resolving minor staff conflicts.",
      solution: "Enforces a rule-based triage system that handles routine escalations and routes only true decision exceptions to leadership.",
      outcome: "75% reduction in owner interruptions; operations run autonomously."
    },
    {
      icon: ShieldCheck,
      name: "Deal Intake Guard",
      problem: "Agents write contracts but delay filing them in the transaction portal, leaving leadership blind to revenue and pipeline metrics.",
      solution: "Monitors MLS changes and email communications in real-time to detect under-contract events and auto-chases agent filings.",
      outcome: "100% visibility of active deals within 24 hours of execution."
    },
    {
      icon: FileCheck,
      name: "Compliance Guard",
      problem: "Closing files are audited only in the final week, resulting in a stressful rush to collect signatures, addenda, and wire forms.",
      solution: "Sweeps file storage daily, flagging missing items at milestones (T-14, T-7, T-3) and emailing secure upload links directly to agents.",
      outcome: "90% reduction in late-night closing audits and delayed commission disbursements."
    },
    {
      icon: ClipboardList,
      name: "Launch Boards",
      problem: "Listing preparation and new agent onboarding are executed from memory, resulting in varying service quality and missed steps.",
      solution: "Translates standard procedures into collaborative checklists with automatic notifications, task assignments, and completion logs.",
      outcome: "Consistent, high-quality service; onboarding cycles cut from 3 weeks to 4 days."
    },
    {
      icon: Database,
      name: "Operating Memory",
      problem: "Transaction notes, approvals, compliance overrides, and changes are scattered across Slack, text history, and coordinator notebooks.",
      solution: "Maintains a structured, permanent log of every operational event, approval, decision override, and agent message.",
      outcome: "Full auditability of every transaction folder; compliance disputes resolved instantly."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
      {modules.map((mod, idx) => {
        const Icon = mod.icon;
        return (
          <div 
            key={idx}
            className="p-6 md:p-8 bg-surface border border-border-soft hover:border-brand-primary/45 rounded-[24px] shadow-soft hover:shadow-card transition-all duration-300 group flex flex-col justify-between text-left"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                <Icon className="w-5 h-5" />
              </div>
              
              <h3 className="text-lg md:text-xl font-serif font-bold text-text-primary">
                {mod.name}
              </h3>
              
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider block">
                    The Problem
                  </span>
                  <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-sans font-light">
                    {mod.problem}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-brand-primary tracking-wider block">
                    What shapework. builds
                  </span>
                  <p className="text-xs md:text-sm text-text-primary leading-relaxed font-sans font-light">
                    {mod.solution}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border-soft/60 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-semibold text-brand-primary block tracking-wider">
                  Verifiable Outcome
                </span>
                <span className="text-[11px] md:text-xs text-brand-primary font-serif italic">
                  {mod.outcome}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
