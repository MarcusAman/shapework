import React from 'react';
import { Mail, Settings, HelpCircle, FileText, CheckCircle2, UserCheck, FileLock2 } from 'lucide-react';

interface Step {
  step: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  badge: string;
}

export default function SignalToActionLoop() {
  const loopSteps: Step[] = [
    {
      step: "01",
      label: "Signal",
      icon: Mail,
      description: "An email arrives from the lender asking to verify the buyer's tax transcripts.",
      badge: "Inbound Email"
    },
    {
      step: "02",
      label: "Classification",
      icon: Settings,
      description: "AI reads the email, classifies it as a financing milestone, and identifies the intent.",
      badge: "Model Inference"
    },
    {
      step: "03",
      label: "Check",
      icon: HelpCircle,
      description: "The system sweeps current records to check if tax transcripts are already uploaded.",
      badge: "Database Query"
    },
    {
      step: "04",
      label: "Recommendation",
      icon: FileText,
      description: "AI drafts a request email to the buyer and stages the update for the transaction coordinator.",
      badge: "Action Prepared"
    },
    {
      step: "05",
      label: "Approval",
      icon: CheckCircle2,
      description: "The coordinator reviews the prepared email draft and clicks 'Approve' to send.",
      badge: "Human in the Loop"
    },
    {
      step: "06",
      label: "Assignment",
      icon: UserCheck,
      description: "The system updates the deal milestone and assigns the follow-up reminder.",
      badge: "Workflow Sync"
    },
    {
      step: "07",
      label: "Audit",
      icon: FileLock2,
      description: "The action is logged permanently in the system event log with coordinator initials and timestamps.",
      badge: "Permanent Record"
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {loopSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={idx}>
              <div 
                className="p-5 bg-surface border border-border-soft rounded-2xl flex flex-col justify-between shadow-soft min-h-[220px] transition-all hover:border-brand-primary/40 relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono text-text-tertiary">
                      STEP {step.step}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-brand-soft flex items-center justify-center text-brand-primary text-xs font-semibold">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-serif font-bold text-text-primary mb-2">
                    {step.label}
                  </h4>
                  
                  <p className="text-[11px] text-text-secondary leading-relaxed font-sans font-light">
                    {step.description}
                  </p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-border-soft/60">
                  <span className="text-[9px] font-semibold text-brand-primary uppercase tracking-wider block">
                    {step.badge}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      
      <div className="p-4 bg-brand-soft/50 border border-brand-primary/10 rounded-xl flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping shrink-0" />
        <p className="text-xs text-text-secondary leading-normal font-sans">
          <strong>Calm Operations Thesis:</strong> Notice that the AI operates invisibly across Steps 02, 03, and 04, but halts at Step 05. Human approval remains the gatekeeper before any external communication is dispatched.
        </p>
      </div>
    </div>
  );
}
