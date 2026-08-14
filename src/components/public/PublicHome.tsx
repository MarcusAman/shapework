import React from 'react';
import { ChevronRight, ArrowRight, CheckCircle, ShieldCheck, Zap, Layers, Cpu, Users } from 'lucide-react';
import HeroOrb from './HeroOrb';
import SectionHeader from './SectionHeader';
import FrictionGrid from './FrictionGrid';
import MethodTimeline from './MethodTimeline';
import DiscoveryOffer from './DiscoveryOffer';
import BeliefCard from './BeliefCard';
import CTASection from './CTASection';

interface PublicHomeProps {
  onNavigate: (path: string) => void;
}

export default function PublicHome({ onNavigate }: PublicHomeProps) {
  return (
    <div className="space-y-20 md:space-y-32 pb-20 font-sans text-stone-900">
      
      {/* 1. HERO SECTION */}
      <section className="px-6 md:px-12 max-w-6xl mx-auto pt-10 md:pt-16 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy Column */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#00635C] block">
              Modern Workflow Design
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-stone-900 tracking-tight leading-[1.1]">
              Workflow design for businesses that have outgrown how they operate.
            </h1>
            
            <p className="text-base md:text-lg text-stone-600 font-sans font-light leading-relaxed max-w-xl">
              Friction and inefficiency cost every operation. We're in the business of eliminating them.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('/discovery')}
                className="px-6 py-3.5 bg-[#00635C] hover:bg-[#01362D] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Request Workflow Discovery</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onNavigate('/login')}
                className="px-6 py-3.5 bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Login</span>
              </button>

              <button
                onClick={() => onNavigate('/method')}
                className="px-6 py-3.5 bg-transparent hover:bg-stone-100/60 text-stone-600 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>The Method</span>
              </button>
            </div>

            {/* Proof line */}
            <div className="pt-4 flex items-center gap-2 border-t border-stone-200 max-w-md">
              <span className="w-2 h-2 rounded-full bg-[#00635C] shrink-0" />
              <p className="text-xs text-stone-500 leading-normal font-sans">
                <strong>$1,500 Fixed Fee</strong> · One week diagnostic to find your friction and deliver a ranked roadmap.
              </p>
            </div>
          </div>

          {/* Right Orb Video Column */}
          <div className="lg:col-span-5 flex justify-center">
            <HeroOrb />
          </div>
        </div>
      </section>

      {/* 2. THE PRACTICE SECTION */}
      <section className="px-6 md:px-12 max-w-6xl mx-auto border-t border-stone-200/80 pt-16 md:pt-24 text-left">
        <div className="max-w-3xl space-y-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#00635C] block">
            The Practice
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
            We're a workflow design and operational modernization company.
          </h2>
          <div className="space-y-4 text-base md:text-lg text-stone-600 font-sans font-light leading-relaxed">
            <p>
              We diagnose how growing businesses actually operate, redesign the workflows and systems holding them back, and build practical solutions that help them work better.
            </p>
            <p>
              Most businesses we meet don't have an AI problem. They have an operations problem. Unclear ownership, dropped handoffs, disconnected tools, repetitive admin, work that depends too heavily on one or two people. We find the friction first, redesign the workflow, then use automation and AI only where they earn their place.
            </p>
            <p className="font-normal text-stone-900 pt-2">
              The goal isn't just efficiency. It's leverage and control: a business that runs with clarity and consistency, without everything depending on the owner.
            </p>
          </div>
        </div>
      </section>

      {/* 3. OPERATIONAL FRICTION SECTION */}
      <section id="problem" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-stone-200/80 pt-16 md:pt-24 text-left">
        <SectionHeader
          eyebrow="Operational Friction"
          title="Most owners know something feels off. They just can't name where."
          subtitle="Growth exposes the shape of your operation. Work enters through too many channels, and no one system owns the handoffs."
        />
        <FrictionGrid />
      </section>

      {/* 4. THE METHOD SECTION (MSBR) */}
      <section id="method" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-stone-200/80 pt-16 md:pt-24 text-left">
        <SectionHeader
          eyebrow="The Method"
          title="Map. Shape. Build. Run."
          subtitle="Every engagement follows the same four phases. We call it MSBR. The work compounds because the method holds."
        />
        <MethodTimeline />
      </section>

      {/* 5. WHAT WE BELIEVE SECTION */}
      <section id="beliefs" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-stone-200/80 pt-16 md:pt-24 text-left">
        <div className="space-y-8">
          <SectionHeader
            eyebrow="What we believe"
            title="A working thesis on modern operations."
            subtitle="We've spent enough time inside enough businesses to develop some opinions. These are ours."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-[24px] bg-stone-50 border border-stone-200/80 space-y-3 text-left">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00635C] flex items-center justify-center font-bold text-sm">1</span>
              <h3 className="font-serif font-bold text-lg text-stone-900">Less software, not more.</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-light">
                Most businesses we meet are drowning in tools. We remove more than we add.
              </p>
            </div>

            <div className="p-8 rounded-[24px] bg-stone-50 border border-stone-200/80 space-y-3 text-left">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00635C] flex items-center justify-center font-bold text-sm">2</span>
              <h3 className="font-serif font-bold text-lg text-stone-900">AI is a tool, not a strategy.</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-light">
                We use it where it pays. We do not sell it as a product.
              </p>
            </div>

            <div className="p-8 rounded-[24px] bg-stone-50 border border-stone-200/80 space-y-3 text-left">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00635C] flex items-center justify-center font-bold text-sm">3</span>
              <h3 className="font-serif font-bold text-lg text-stone-900">Operations is a design discipline.</h3>
              <p className="text-sm text-stone-600 leading-relaxed font-light">
                The way work moves through a business is a system. Systems can be redesigned. Most just never have been.
              </p>
            </div>
          </div>

          <div className="pt-2 text-left">
            <p className="text-xs text-stone-500 font-mono">
              Born in Wilmington, North Carolina. Serving clients worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* 6. WHO WE WORK WITH SECTION */}
      <section id="work-with" className="px-6 md:px-12 max-w-6xl mx-auto border-t border-stone-200/80 pt-16 md:pt-24 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#00635C] block">
              Who we work with
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
              "Owner-led businesses that have outgrown the way they operate."
            </h2>
            <p className="text-base text-stone-600 leading-relaxed font-light">
              Growing businesses, roughly five to one hundred employees, that have become operationally more complicated than their current systems can comfortably support. Operators who can feel something is off but cannot quite name it.
            </p>
            <p className="text-sm text-stone-600 leading-relaxed font-light">
              Real estate brokerages are our first and most developed specialty, where our domain knowledge runs deepest. We also work with professional services firms, healthcare practices, and other owner-led operations facing the same accumulating complexity.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onNavigate('/brokerages')}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#01362D] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                For Real Estate Brokerages →
              </button>
              <button
                onClick={() => onNavigate('/discovery')}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200/70 text-stone-900 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Request Discovery →
              </button>
            </div>
          </div>

          {/* Right Column: Experienced Operators */}
          <div className="lg:col-span-6 bg-stone-50 border border-stone-200/80 rounded-[32px] p-8 space-y-6 text-left">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#00635C] block">
              Who's behind it
            </span>
            <h3 className="text-2xl font-serif font-bold text-stone-900">
              Experienced operators, not theorists.
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed font-light">
              shapework. was built by three operators who have run the kind of businesses we now redesign. One scaled a brokerage from $100M to $325M+ in annual sales as its strategic growth lead. One co-founded, scaled, and exited a research firm, then spent years restructuring operations for other companies as a fractional executive. One led fixed operations at one of the country's largest auto groups, then founded companies built to remove the inefficiencies he watched cost businesses every day.
            </p>
            <p className="text-xs font-medium text-stone-900 italic">
              We have been the owner acting as the glue. We have untangled the systems nobody understood. The pattern recognition is earned, not borrowed.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('/about')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00635C] hover:text-[#01362D] cursor-pointer"
              >
                <span>Meet Adam, Matt, and Marcus →</span>
              </button>
            </div>
          </div>
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
