import React from 'react';
import { ChevronRight, ArrowRight, CheckCircle } from 'lucide-react';
import HeroOrb from './HeroOrb';
import SectionHeader from './SectionHeader';
import FrictionGrid from './FrictionGrid';
import MethodTimeline from './MethodTimeline';
import WorkflowModuleCard from './WorkflowModuleCard';
import SignalToActionLoop from './SignalToActionLoop';
import DiscoveryOffer from './DiscoveryOffer';
import BeliefCard from './BeliefCard';
import CTASection from './CTASection';

interface PublicHomeProps {
  onNavigate: (path: string) => void;
}

export default function PublicHome({ onNavigate }: PublicHomeProps) {
  return (
    <div className="space-y-20 md:space-y-32 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="px-6 md:px-12 max-w-6xl mx-auto pt-10 md:pt-16 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy Column */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-primary block">
              Workflow design for owner-led operations
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-text-primary tracking-tight leading-[1.1]">
              Stop running brokerage operations from memory, texts, and owner interruptions.
            </h1>
            
            <p className="text-base md:text-lg text-text-secondary font-sans font-light leading-relaxed max-w-xl">
              shapework. helps brokerages turn scattered requests, documents, deadlines, and agent handoffs into routed work, approvals, and owner-ready briefs.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => onNavigate('/discovery')}
                className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Request Discovery</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => onNavigate('/login')}
                className="px-6 py-3 bg-surface hover:bg-stone-50 text-text-primary border border-border-soft text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Login</span>
              </button>

              <button
                onClick={() => onNavigate('/method')}
                className="px-6 py-3 bg-transparent hover:bg-stone-100/50 text-text-secondary text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>See How It Works</span>
              </button>
            </div>

            {/* Proof line */}
            <div className="pt-4 flex items-center gap-2 border-t border-border-soft/60 max-w-md">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
              <p className="text-xs text-text-tertiary leading-normal font-sans">
                <strong>One week</strong> to find the friction. One quick win implemented before the week ends.
              </p>
            </div>
          </div>

          {/* Right Orb Video Column */}
          <div className="lg:col-span-6 flex justify-center">
            <HeroOrb />
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION */}
      <section id="problem" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-border-soft/40 pt-16 md:pt-24 text-left">
        <SectionHeader
          eyebrow="The Friction"
          title="Growth exposes the shape of your operation."
          subtitle="Owner-led businesses do not break because people are lazy. They break because work enters through too many channels and no one system owns the handoffs."
        />
        <FrictionGrid />
      </section>

      {/* 3. THE shapework. METHOD SECTION */}
      <section id="method" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-border-soft/40 pt-16 md:pt-24 text-left">
        <SectionHeader
          eyebrow="The Framework"
          title="The shapework. Method"
          subtitle="We preserve existing tools and design standard procedures before building background integrations. Our approach consists of four structured phases."
        />
        <MethodTimeline />
      </section>

      {/* 4. WHAT WE BUILD SECTION */}
      <section id="modules" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-border-soft/40 pt-16 md:pt-24 text-left">
        <SectionHeader
          eyebrow="The System"
          title="From discovery to operating layer."
          subtitle="We build standardized workflow modules that sit above the databases and software licenses you already pay for."
        />
        <WorkflowModuleCard />
      </section>

      {/* 5. REAL ESTATE BROKERAGES WEDGES SECTION */}
      <section id="brokerages" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-border-soft/40 pt-16 md:pt-24 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary block">
              Vertical Focus
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-primary tracking-tight leading-tight">
              Built first around the operational reality of real estate brokerages.
            </h2>
            <p className="text-sm md:text-base text-text-secondary leading-relaxed font-sans font-light">
              Brokerages run on agent relationships, but the back office often runs on spreadsheets, group texts, memory, and one or two key administrators who know where everything lives.
            </p>
            <div className="space-y-2 pt-2">
              {[
                "Agent request and sign intake",
                "Contract-to-closing compliance follow-ups",
                "Onboarding checklists for split changes",
                "Owner exception escalations"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs md:text-sm text-text-primary font-sans font-light">
                  <CheckCircle className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button
                onClick={() => onNavigate('/brokerages')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-primary-hover group cursor-pointer"
              >
                <span>Explore brokerage workflows</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-7 bg-surface-soft border border-border-soft rounded-[32px] p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border-soft pb-4">
              <div>
                <span className="text-xs font-bold text-text-primary block font-serif">
                  Standardized Brokerage Operations
                </span>
                <span className="text-[10px] text-text-tertiary block">
                  Generic operational paths we structure and deploy
                </span>
              </div>
              <span className="px-2 py-0.5 bg-brand-soft text-brand-primary text-[9px] font-semibold rounded-full">
                Active Wedge
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Intake", desc: "Turns MLS signals and lender threads into new deal files instantly." },
                { title: "Compliance", desc: "Auto-chases signatures for missing disclosures prior to closing." },
                { title: "Onboarding", desc: "Launches checklists from contract signing to email setups." },
                { title: "Sign Inventory", desc: "Triage lockbox orders and signage requests automatically." }
              ].map((box, idx) => (
                <div key={idx} className="p-4 bg-surface border border-border-soft/60 rounded-xl text-left">
                  <span className="text-[10px] font-mono text-brand-primary uppercase block mb-1">
                    0{idx+1} / {box.title}
                  </span>
                  <p className="text-xs text-text-secondary leading-normal font-sans font-light">
                    {box.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. OPERATIONAL INTELLIGENCE / AI LOOP SECTION */}
      <section id="intelligence" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-border-soft/40 pt-16 md:pt-24 text-left">
        <SectionHeader
          eyebrow="Intelligence"
          title="AI where it earns its place."
          subtitle="We don't sell AI chatbots or magic widgets. The system uses background intelligence to classify requests, parse documents, draft communications, and flag risks, keeping humans securely in control."
        />
        <SignalToActionLoop />
        <div className="mt-8 text-center">
          <button
            onClick={() => onNavigate('/operational-intelligence')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-primary-hover group cursor-pointer"
          >
            <span>Learn about our intelligence layer</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* 7. WORKFLOW DISCOVERY OFFER */}
      <section id="discovery" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-border-soft/40 pt-16 md:pt-24 text-left">
        <SectionHeader
          eyebrow="Diagnostic"
          title="Start with Workflow Discovery."
          subtitle="An operational diagnostic designed to uncover bottlenecks and deploy one concrete win before the week ends."
        />
        <DiscoveryOffer onNavigate={onNavigate} />
      </section>

      {/* 8. BELIEFS SECTION */}
      <section id="beliefs" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-border-soft/40 pt-16 md:pt-24 text-left">
        <SectionHeader
          eyebrow="Philosophy"
          title="Operating Beliefs"
          subtitle="We guide our practice and our software configurations by five core principles."
        />
        <BeliefCard />
      </section>

      {/* 9. SEE THE OPERATING LAYER BRIDGE */}
      <section id="login-bridge" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-border-soft/40 pt-16 md:pt-24 text-left">
        <div className="bg-surface border border-border-medium rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-soft flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary block">
              Brokerage Portal
            </span>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-text-primary">
              Access your operating console.
            </h3>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-sans font-light">
              Log in to access your brokerage's structured work queue, compliance checklists, routing rules, and owner-ready transaction briefs.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/login')}
            className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
          >
            Log in to shapework.
          </button>
        </div>
      </section>

      {/* 10. ABOUT WEDGES SECTION */}
      <section id="about" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-border-soft/40 pt-16 md:pt-24 text-left">
        <div className="p-8 md:p-12 bg-surface-soft border border-border-soft rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary block">
              Founding Team
            </span>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-text-primary">
              Experienced operators, builders, and workflow designers.
            </h3>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-sans font-light">
              We built shapework. because we've lived the pain of scaling high-volume operations. Our backgrounds cross real estate, automotive operations, AI systems, and owner-led businesses. Based in Wilmington, NC.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/about')}
            className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
          >
            Read Our Story
          </button>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="px-6 md:px-12">
        <CTASection onNavigate={onNavigate} />
      </section>
      
    </div>
  );
}
