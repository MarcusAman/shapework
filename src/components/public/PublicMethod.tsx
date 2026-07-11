import React from 'react';
import SectionHeader from './SectionHeader';
import MethodTimeline from './MethodTimeline';
import CTASection from './CTASection';

interface PublicMethodProps {
  onNavigate: (path: string) => void;
}

export default function PublicMethod({ onNavigate }: PublicMethodProps) {
  return (
    <div className="space-y-16 md:space-y-24 py-10 md:py-16 text-left">
      {/* Hero section */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <SectionHeader
          eyebrow="The Method"
          title="We build systems on paper before we build them in code."
          subtitle="Software alone never solves operational friction. We apply a rigorous four-phase engineering discipline to map, shape, build, and run clean operations."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border-soft/60">
          <div className="space-y-3">
            <h3 className="text-lg font-serif font-bold text-text-primary">
              Why most operations projects fail
            </h3>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-sans font-light">
              Most businesses try to fix operational bottlenecks by purchasing a new software license or immediately writing code. This pushes existing, broken behaviors into a new database. The chaos remains, it just moves to a different screen.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-serif font-bold text-text-primary">
              The shapework. alternative
            </h3>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-sans font-light">
              We separate workflow design from software tools. We standardize the handoffs, define exact rules of ownership, and ensure the team adopts the behavior on paper. Only then do we deploy background AI and automation to lock the workflow in place.
            </p>
          </div>
        </div>
      </section>

      {/* Method Timeline */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <div className="bg-surface-soft border border-border-soft rounded-[32px] p-8 md:p-12">
          <MethodTimeline />
        </div>
      </section>

      {/* Deep-dive analysis of Run phase */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <div className="space-y-6">
          <h3 className="text-2xl font-serif font-bold text-text-primary">
            Adoption is the real work.
          </h3>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed font-sans font-light">
            An operating layer is only as good as the data it receives. The hardest part of any system modernization is not writing the code, but training the team and making sure the new habits stick.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-5 bg-surface border border-border-soft rounded-xl shadow-soft">
              <span className="text-[10px] font-mono text-brand-primary uppercase block mb-1">
                Active Event Monitoring
              </span>
              <p className="text-xs text-text-secondary leading-normal font-sans font-light">
                We monitor your operational audit trails weekly to find transactions that bypassed the standard intake guard and identify why they occurred.
              </p>
            </div>
            <div className="p-5 bg-surface border border-border-soft rounded-xl shadow-soft">
              <span className="text-[10px] font-mono text-brand-primary uppercase block mb-1">
                Staff Capacity Auditing
              </span>
              <p className="text-xs text-text-secondary leading-normal font-sans font-light">
                We trace tasks and check for backlogs in the Request Desk, ensuring tasks are divided fairly and no single coordinator is overloaded.
              </p>
            </div>
            <div className="p-5 bg-surface border border-border-soft rounded-xl shadow-soft">
              <span className="text-[10px] font-mono text-brand-primary uppercase block mb-1">
                Continuous Model Tuning
              </span>
              <p className="text-xs text-text-secondary leading-normal font-sans font-light">
                We continuously adjust the classification filters of your background AI agents, reducing false positives and improving accuracy based on feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 md:px-12">
        <CTASection onNavigate={onNavigate} />
      </section>
    </div>
  );
}
