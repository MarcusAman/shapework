import React from 'react';
import SectionHeader from './SectionHeader';
import CTASection from './CTASection';

interface PublicAboutProps {
  onNavigate: (path: string) => void;
}

export default function PublicAbout({ onNavigate }: PublicAboutProps) {
  return (
    <div className="space-y-16 md:space-y-24 py-10 md:py-16 text-left font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <SectionHeader
          eyebrow="Our Story"
          title="Experienced operators. Not theorists."
          subtitle="We built shapework. because we scaled brokerages and got tired of buying software licenses that promised to solve operations but just added complexity. We believe in design, standard procedures, and simple integrations."
        />

        <div className="pt-8 border-t border-border-soft max-w-3xl space-y-6">
          <p className="text-sm md:text-base text-text-secondary leading-relaxed font-light">
            shapework. is led by operators, builders, and workflow designers with experience across real estate, automotive operations, AI systems, and owner-led businesses.
          </p>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed font-light">
            Before co-founding shapework., we built and ran operations ourselves. We know what it means when an administrative team is stressed, files are piling up, and the founder has to spend hours sorting out text chains.
          </p>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed font-light">
            Our practice is built around a single, clear goal: **making operations calm.** We do this by mapping the friction first, cleaning the procedures, and building the background systems that make the workflow stick.
          </p>
        </div>
      </section>

      {/* 2. FOUNDERS PROFILE BIOGRAPHY WEDGES */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <div className="space-y-8">
          <h3 className="text-2xl font-serif font-bold text-text-primary">
            The Founders
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Adam LeMire */}
            <div className="p-6 bg-surface border border-border-soft rounded-[24px] space-y-4 shadow-soft">
              <div>
                <span className="text-[10px] font-mono text-brand-primary uppercase block tracking-wider">
                  Co-Founder & Operator
                </span>
                <h4 className="text-base font-serif font-bold text-text-primary">
                  Adam LeMire
                </h4>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed font-light">
                Adam specializes in brand, strategy, and workflow design. He leverages years of experience deploying practical AI models inside business pipelines to remove manual data rekeying and coordinate files.
              </p>
            </div>

            {/* Matt Orr */}
            <div className="p-6 bg-surface border border-border-soft rounded-[24px] space-y-4 shadow-soft">
              <div>
                <span className="text-[10px] font-mono text-brand-primary uppercase block tracking-wider">
                  Co-Founder & Operator
                </span>
                <h4 className="text-base font-serif font-bold text-text-primary">
                  Matt Orr
                </h4>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed font-light">
                Matt coordinates real estate operations, sales, and client discovery. He sat with coordinators and agents across dozens of brokerages, tracking how emails move, documenting friction leakage, and designing rules that human teams actually follow.
              </p>
            </div>

            {/* Marcus Aman */}
            <div className="p-6 bg-surface border border-border-soft rounded-[24px] space-y-4 shadow-soft">
              <div>
                <span className="text-[10px] font-mono text-brand-primary uppercase block tracking-wider">
                  Co-Founder & Operator
                </span>
                <h4 className="text-base font-serif font-bold text-text-primary">
                  Marcus Aman
                </h4>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed font-light">
                Marcus oversees AI systems, product architecture, and operations automation. He builds the coordinate platform layers, data models, and secure API sync engines that keep backend transactions clean and synchronized.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section: How We Work */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto border-t border-border-soft/40 pt-12">
        <div className="space-y-6">
          <h3 className="text-2xl font-serif font-bold text-text-primary">
            How we work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            <div className="p-5 bg-surface border border-border-soft rounded-xl shadow-soft">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">We map before we automate</h4>
              <p className="text-xs text-text-secondary leading-normal font-light">We never write automation code or connect AI models until we have traced the actual workflows on paper and removed systemic friction.</p>
            </div>
            <div className="p-5 bg-surface border border-border-soft rounded-xl shadow-soft">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">No replacement without reason</h4>
              <p className="text-xs text-text-secondary leading-normal font-light">We sit on top of the tools you already pay for. We only replace systems if they are fundamentally incompatible with a clean workflow.</p>
            </div>
            <div className="p-5 bg-surface border border-border-soft rounded-xl shadow-soft">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">Humans in the loop</h4>
              <p className="text-xs text-text-secondary leading-normal font-light">AI handles classification and draft preparation in the background, but human approval is required before external dispatch.</p>
            </div>
            <div className="p-5 bg-surface border border-border-soft rounded-xl shadow-soft">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">Synthetic demos, secure code</h4>
              <p className="text-xs text-text-secondary leading-normal font-light">We protect client data. No real transaction records or emails are exposed in our public systems. Private demo files use synthetic data.</p>
            </div>
            <div className="p-5 bg-surface border border-border-soft rounded-xl shadow-soft">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">Built for adoption</h4>
              <p className="text-xs text-text-secondary leading-normal font-light">A system is only as good as the team's compliance. We stay embedded with your coordinators until the workflow becomes second nature.</p>
            </div>
          </div>
          <p className="text-xs text-text-tertiary italic pt-2">
            No client data is used in public demos. Private demo environments use synthetic data unless otherwise agreed.
          </p>
        </div>
      </section>

      {/* 3. LOCATION INFO WEDGE */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <div className="p-8 md:p-12 bg-surface-soft border border-border-soft rounded-[32px] text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary block">
                Geography
              </span>
              <h3 className="text-2xl font-serif font-bold text-text-primary">
                Born in Wilmington, North Carolina.
              </h3>
              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-light">
                We are proud to be based in the Cape Fear region, working on-site with local businesses along the North Carolina coast while serving operations-heavy clients globally.
              </p>
            </div>
            <div className="md:col-span-4 flex justify-start md:justify-end">
              <div className="p-4 bg-surface border border-border-soft rounded-2xl flex flex-col justify-center text-left max-w-[180px] shadow-sm">
                <span className="text-[10px] font-semibold tracking-wider text-text-tertiary uppercase">
                  Headquarters
                </span>
                <span className="text-sm font-serif font-bold text-text-primary">
                  Wilmington, NC
                </span>
                <span className="text-[10px] text-text-secondary leading-normal font-light">
                  Cape Fear River Basin
                </span>
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
