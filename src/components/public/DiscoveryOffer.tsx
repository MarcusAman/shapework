import React from 'react';
import { Calendar, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface DiscoveryOfferProps {
  onNavigate: (path: string) => void;
}

export default function DiscoveryOffer({ onNavigate }: DiscoveryOfferProps) {
  const deliverables = [
    {
      title: "Current-State Map",
      desc: "An objective flowchart documenting how work and files actually move through your office today, detailing active leakage points."
    },
    {
      title: "Ranked Opportunity List",
      desc: "A prioritized backlog of friction items, scored by complexity and business impact so you know what to fix first."
    },
    {
      title: "Prioritized Roadmap",
      desc: "A phased, realistic plan detailing how to implement standard rules, automation, and AI layers over the next 12 weeks."
    },
    {
      title: "One Deployed Quick Win",
      desc: "We don't leave you with just paper. We identify, configure, and launch one operational quick win live before the week ends."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto text-left">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Value Prop & Deliverables */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-brand-soft text-brand-primary text-xs font-semibold rounded-full uppercase tracking-wider inline-block">
              1-Week Fixed Engagement
            </span>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-text-primary tracking-tight">
              One week to locate the leaks.
            </h3>
            <p className="text-sm md:text-base text-text-secondary font-sans font-light leading-relaxed">
              We sit with your team, trace the workflows, and deliver a complete operational diagnostic. No long consulting cycles, no generic templates.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider block">
              What we deliver by Friday afternoon:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliverables.map((item, idx) => (
                <div key={idx} className="p-4 bg-surface border border-border-soft rounded-xl shadow-soft">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                    <h4 className="text-xs md:text-sm font-serif font-bold text-text-primary">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[11px] md:text-xs text-text-secondary leading-normal font-sans font-light">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Price Card & CTA */}
        <div className="lg:col-span-5 bg-surface border border-border-medium rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-soft hover:shadow-card transition-shadow relative overflow-hidden">
          {/* Subtle green decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-soft/30 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-6 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-widest">
                Service Fee
              </span>
              <span className="px-2 py-0.5 bg-brand-soft text-brand-primary text-[10px] font-semibold rounded-full">
                Fixed Cost
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-mono font-bold text-text-primary">$1,500</span>
                <span className="text-xs text-text-secondary">USD</span>
              </div>
              <p className="text-xs text-text-tertiary">
                No hidden costs. One invoice. Complete roadmap delivered.
              </p>
            </div>

            <div className="pt-4 border-t border-border-soft/60 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                <Calendar className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <p className="font-sans font-light leading-normal">
                  Requires <strong>3 to 5 hours total</strong> of your team's time across the week.
                </p>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-text-secondary">
                <HelpCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <p className="font-sans font-light leading-normal">
                  No obligation to hire us for subsequent implementation.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-8 mt-6 border-t border-border-soft/60">
            <button
              onClick={() => onNavigate('/method')}
              className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>See the Method</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('/discovery')}
              className="w-full py-3 bg-stone-50 hover:bg-stone-100 text-text-primary border border-border-soft text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Request Booking
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
