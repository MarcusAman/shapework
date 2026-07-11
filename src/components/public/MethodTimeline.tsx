import React from 'react';
import { Eye, Layers, Hammer, ShieldCheck } from 'lucide-react';

interface Step {
  phase: string;
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  duration: string;
  details: string[];
}

export default function MethodTimeline() {
  const steps: Step[] = [
    {
      phase: "Map",
      icon: Eye,
      title: "We trace how work actually moves",
      description: "We don't audit by reviewing training manuals. We audit by conducting focused, 30-minute interviews with the people performing the daily tasks to build an objective map of your real operations.",
      duration: "Week 1 (Discovery)",
      details: [
        "Audit inbound request channels (texts, emails, calls)",
        "Document real handoffs between agents and staff",
        "Identify and cost the exact friction leaks"
      ]
    },
    {
      phase: "Shape",
      icon: Layers,
      title: "We design the new workflow rules",
      description: "Before coding or installing platforms, we design the workflow paths on paper. We establish strict boundaries for ownership, documentation requirements, and approval loops.",
      duration: "Weeks 2-3",
      details: [
        "Standardize transaction intake checklists",
        "Design the agent request desk structure",
        "Remove human middleware loops"
      ]
    },
    {
      phase: "Build",
      icon: Hammer,
      title: "We implement the operating layer",
      description: "We write the integrations, deploy light automation, and configure AI agents to run in the background. We connect your existing tools (email, MLS, SkySlope, QuickBooks) so data moves silently.",
      duration: "Weeks 4-6",
      details: [
        "Deploy background email classification systems",
        "Set up compliance and intake alerts",
        "Build secure document routing pipelines"
      ]
    },
    {
      phase: "Run",
      icon: ShieldCheck,
      title: "We support adoption until it holds",
      description: "Software alone never solves operations. We stay embedded with your staff, auditing event logs, monitoring capacity metrics, and adjusting the rules until the workflow becomes second nature.",
      duration: "Ongoing Partnership",
      details: [
        "Weekly pipeline and backlog audits",
        "User adoption monitoring and feedback loops",
        "Ongoing model and policy tuning"
      ]
    }
  ];

  return (
    <div className="space-y-12 md:space-y-16 max-w-5xl mx-auto text-left">
      <div className="relative border-l border-border-medium pl-6 md:pl-10 space-y-12 md:space-y-16 py-4">
        {/* Timeline Path Glow Overlay */}
        <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-gradient-to-b from-brand-primary via-info to-transparent" />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="relative group">
              {/* Timeline Indicator Node */}
              <div className="absolute -left-[31px] md:-left-[47px] top-1.5 w-4 h-4 md:w-6 md:h-6 rounded-full border border-border-medium bg-canvas group-hover:border-brand-primary flex items-center justify-center transition-colors duration-300">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-border-strong group-hover:bg-brand-primary transition-colors duration-300" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Meta details (Phase and Timeline) */}
                <div className="lg:col-span-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono tracking-widest text-text-tertiary uppercase">
                      Phase 0{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold text-brand-primary bg-brand-soft rounded-full">
                      {step.phase}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-sans font-medium text-brand-primary">
                    {step.duration}
                  </p>
                </div>

                {/* Content description */}
                <div className="lg:col-span-5 space-y-3">
                  <h3 className="text-xl font-serif font-bold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-sans font-light">
                    {step.description}
                  </p>
                </div>

                {/* Bullets/Deliverables */}
                <div className="lg:col-span-4 bg-surface p-5 border border-border-soft rounded-xl shadow-soft">
                  <span className="text-[10px] font-semibold tracking-wider text-text-tertiary uppercase block mb-3">
                    Key Activities:
                  </span>
                  <ul className="space-y-2">
                    {step.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2 text-[11px] md:text-xs text-text-primary leading-normal">
                        <span className="w-1 h-1 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                        <span className="font-sans font-light">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
