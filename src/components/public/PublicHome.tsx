/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';

interface PublicHomeProps {
  onNavigate: (path: string) => void;
}

export default function PublicHome({ onNavigate }: PublicHomeProps) {
  return (
    <div className="bg-[#f5f2ec] text-[#14140f] font-sans antialiased overflow-x-hidden selection:bg-[#8fb09f] selection:text-[#14140f]">
      
      {/* 1. HERO SECTION */}
      <header className="min-h-[92vh] flex flex-col justify-center items-center text-center px-6 md:px-14 pt-24 pb-16 relative">
        {/* Massive Serif Wordmark */}
        <h1 className="font-serif font-normal text-[clamp(68px,15vw,210px)] leading-[0.9] tracking-[-0.05em] text-[#14140f] mb-8 md:mb-12 animate-fadeIn">
          shapework<span className="text-[#1f3a2e]">.</span>
        </h1>

        {/* Hero Divider Rule */}
        <div className="w-16 h-[1px] bg-[#14140f] mb-6 opacity-80" aria-hidden="true" />

        {/* Tagline */}
        <p className="text-[16px] md:text-[18px] font-normal tracking-[0.04em] text-[#4a4a44] mb-8 md:mb-10">
          Modern Workflow Design
        </p>

        {/* Hero Statement */}
        <p className="font-serif font-normal text-[clamp(20px,2.6vw,28px)] leading-[1.25] tracking-[-0.01em] text-[#14140f] max-w-[620px] mx-auto mb-8">
          Workflow design for businesses that have outgrown how they operate.
        </p>

        {/* Hero CTA Action */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => onNavigate('/discovery')}
            className="inline-flex items-center gap-2.5 bg-[#1f3a2e] hover:bg-[#16281f] text-[#f5f2ec] px-7 py-3.5 rounded-full text-[15px] font-medium tracking-[0.01em] transition-all shadow-sm hover:scale-[1.02] cursor-pointer"
          >
            <span>Request Workflow Discovery</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-16 md:mt-20 flex flex-col items-center text-[11px] tracking-[0.2em] uppercase text-[#8a8a82]" aria-hidden="true">
          <span>Scroll</span>
          <div className="w-[1px] h-8 bg-[#8a8a82] mt-3 animate-pulse" />
        </div>
      </header>

      {/* 2. THE PRACTICE THESIS SECTION */}
      <section className="border-t border-[#d6d0c2] py-24 md:py-32 px-6 md:px-14 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <h2 className="font-serif font-normal text-[clamp(32px,5vw,60px)] leading-[1.1] tracking-[-0.03em] text-[#14140f]">
            Friction and inefficiency cost every operation.
            <span className="block h-4" />
            <em className="italic text-[#1f3a2e]">We're in the business of eliminating them.</em>
          </h2>

          <div className="space-y-6 pt-2">
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#1f3a2e] font-semibold">
              The Practice
            </p>
            <p className="text-[17px] md:text-[18px] leading-[1.65] text-[#4a4a44]">
              We're a workflow design and operational modernization company. We diagnose how growing businesses actually operate, redesign the workflows and systems holding them back, and build practical solutions that help them work better.
            </p>
            <p className="text-[16px] md:text-[17px] leading-[1.65] text-[#4a4a44]">
              Most businesses we meet don't have an AI problem. They have an operations problem. Unclear ownership, dropped handoffs, disconnected tools, repetitive admin, work that depends too heavily on one or two people. We find the friction first, redesign the workflow, then use automation and AI only where they earn their place.
            </p>
            <p className="text-[16px] md:text-[17px] leading-[1.65] font-normal text-[#14140f]">
              The goal isn't just efficiency. It's leverage and control: a business that runs with clarity and consistency, without everything depending on the owner.
            </p>
          </div>
        </div>
      </section>

      {/* 3. OPERATIONAL FRICTION SECTION */}
      <section className="border-t border-[#d6d0c2] py-24 md:py-32 px-6 md:px-14 max-w-[1080px] mx-auto">
        <div className="max-w-[720px] mb-12">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#1f3a2e] font-semibold mb-4">
            Operational Friction
          </p>
          <h2 className="font-serif font-normal text-[clamp(28px,4.5vw,48px)] leading-[1.1] tracking-[-0.03em] text-[#14140f]">
            Most owners know something feels off. <em className="italic text-[#1f3a2e]">They just can't name where.</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-[#d6d0c2]">
          {[
            'The owner has quietly become the human middleware between every system.',
            'Teams rebuilding the same information by hand, over and over.',
            'Clients and deals slipping through invisible handoffs.',
            'Reporting that only exists because someone stayed late to build it.',
            'Critical processes living entirely inside one person\'s head.',
            'Workflows held together by memory, spreadsheets, and group texts.'
          ].map((friction, idx) => (
            <div
              key={idx}
              className={`flex items-baseline gap-4 py-5 border-b border-[#d6d0c2] text-[16.5px] leading-[1.5] text-[#14140f] ${
                idx % 2 === 0 ? 'md:pr-10 md:border-r md:border-[#d6d0c2]' : 'md:pl-10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1f3a2e] shrink-0 transform -translate-y-1" />
              <span>{friction}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. THE METHOD (MSBR DARK SECTION) */}
      <section id="method" className="bg-[#14140f] text-[#f5f2ec] py-24 md:py-32 px-6 md:px-14">
        <div className="max-w-[1280px] mx-auto">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#8fb09f] font-semibold mb-4">
            The Method
          </p>
          <h2 className="font-serif font-normal text-[clamp(34px,5vw,60px)] leading-[1.05] tracking-[-0.03em] text-[#f5f2ec] mb-4">
            Map. Shape. Build. <em className="italic text-[#8fb09f]">Run.</em>
          </h2>
          <p className="text-[17px] md:text-[18px] text-[rgba(245,242,236,0.7)] max-w-[640px] mb-16 leading-relaxed">
            Every engagement follows the same four phases. We call it MSBR. The work compounds because the method holds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-[rgba(245,242,236,0.15)]">
            {[
              {
                num: 'PHASE 01',
                title: 'Map.',
                desc: 'We document how the business actually runs. Not the org chart. The real work, as it happens, from the people doing it.'
              },
              {
                num: 'PHASE 02',
                title: 'Shape.',
                desc: 'We redesign the highest-leverage workflows on paper first. Clean handoffs. Owned responsibilities. Reasoned steps.'
              },
              {
                num: 'PHASE 03',
                title: 'Build.',
                desc: 'We implement against the new shape. Automation, integrations, AI. Lightweight where possible. Custom where necessary.'
              },
              {
                num: 'PHASE 04',
                title: 'Run.',
                desc: 'We stay close as the operator. Training, adoption, refinement. A workflow nobody follows is not a workflow.'
              }
            ].map((phase, idx) => (
              <div
                key={idx}
                className={`pt-8 pb-10 md:pb-0 ${
                  idx < 3 ? 'lg:pr-8 lg:border-r lg:border-[rgba(245,242,236,0.15)]' : ''
                } ${idx > 0 ? 'lg:pl-8' : ''} border-b lg:border-b-0 border-[rgba(245,242,236,0.15)]`}
              >
                <div className="font-serif text-[12px] text-[#8fb09f] tracking-[0.1em] mb-3">
                  {phase.num}
                </div>
                <h4 className="font-serif font-normal text-[36px] tracking-[-0.02em] text-[#f5f2ec] mb-3">
                  {phase.title}
                </h4>
                <p className="text-[14.5px] leading-[1.6] text-[rgba(245,242,236,0.65)]">
                  {phase.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WHAT WE BELIEVE */}
      <section id="beliefs" className="border-t border-[#d6d0c2] py-24 md:py-32 px-6 md:px-14 max-w-[1280px] mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#1f3a2e] font-semibold mb-3">
            What We Believe
          </p>
          <h2 className="font-serif font-normal text-[clamp(30px,4.5vw,56px)] leading-[1.05] tracking-[-0.03em] mb-4">
            A working thesis on <em className="italic text-[#1f3a2e]">modern operations.</em>
          </h2>
          <p className="text-[16.5px] text-[#4a4a44] max-w-[520px] mx-auto">
            We've spent enough time inside enough businesses to develop some opinions. These are ours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-14 mb-12">
          <article className="space-y-3">
            <div className="font-serif italic text-[18px] text-[#1f3a2e]">i.</div>
            <h3 className="font-serif font-normal text-[24px] tracking-[-0.02em] text-[#14140f]">
              Less software, not more.
            </h3>
            <p className="text-[15px] leading-[1.65] text-[#4a4a44]">
              Most businesses we meet are drowning in tools. We remove more than we add.
            </p>
          </article>

          <article className="space-y-3">
            <div className="font-serif italic text-[18px] text-[#1f3a2e]">ii.</div>
            <h3 className="font-serif font-normal text-[24px] tracking-[-0.02em] text-[#14140f]">
              AI is a tool, not a strategy.
            </h3>
            <p className="text-[15px] leading-[1.65] text-[#4a4a44]">
              We use it where it pays. We do not sell it as a product.
            </p>
          </article>

          <article className="space-y-3">
            <div className="font-serif italic text-[18px] text-[#1f3a2e]">iii.</div>
            <h3 className="font-serif font-normal text-[24px] tracking-[-0.02em] text-[#14140f]">
              Operations is a design discipline.
            </h3>
            <p className="text-[15px] leading-[1.65] text-[#4a4a44]">
              The way work moves through a business is a system. Systems can be redesigned. Most just never have been.
            </p>
          </article>
        </div>

        <div className="text-center">
          <button
            onClick={() => onNavigate('/method')}
            className="inline-block text-[15px] text-[#1f3a2e] border-b border-[#d6d0c2] hover:border-[#1f3a2e] pb-0.5 transition cursor-pointer"
          >
            Read the full thesis →
          </button>
        </div>
      </section>

      {/* 6. GEO BREAK */}
      <div className="py-16 px-6 text-center max-w-[1280px] mx-auto">
        <div className="w-8 h-[1px] bg-[#d6d0c2] mx-auto mb-8" />
        <p className="font-serif italic text-[20px] text-[#4a4a44] leading-[1.6] tracking-[-0.01em]">
          Born in Wilmington, North Carolina.<br />
          Serving clients worldwide.
        </p>
        <div className="w-8 h-[1px] bg-[#d6d0c2] mx-auto mt-8" />
      </div>

      {/* 7. WHO WE WORK WITH */}
      <section id="about" className="border-t border-[#d6d0c2] py-24 md:py-32 px-6 md:px-14 max-w-[880px] mx-auto text-center">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[#1f3a2e] font-semibold mb-4">
          Who We Work With
        </p>
        <h2 className="font-serif font-normal italic text-[clamp(24px,3.8vw,40px)] leading-[1.25] tracking-[-0.02em] mb-8 text-[#14140f]">
          "Owner-led businesses that have outgrown the way they operate."
        </h2>
        <p className="text-[17px] md:text-[18px] text-[#4a4a44] leading-[1.65] mb-10">
          Growing businesses, roughly five to one hundred employees, that have become operationally more complicated than their current systems can comfortably support. Operators who can feel something is off but cannot quite name it. Real estate brokerages are our first and most developed specialty, where our domain knowledge runs deepest. We also work with professional services firms, healthcare practices, and other owner-led operations facing the same accumulating complexity.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onNavigate('/brokerages')}
            className="text-[14px] text-[#4a4a44] hover:text-[#14140f] px-5 py-2.5 border border-[#d6d0c2] hover:border-[#14140f] rounded-full transition cursor-pointer"
          >
            For Real Estate Brokerages
          </button>
          <button
            onClick={() => onNavigate('/discovery')}
            className="text-[14px] text-[#4a4a44] hover:text-[#14140f] px-5 py-2.5 border border-[#d6d0c2] hover:border-[#14140f] rounded-full transition cursor-pointer"
          >
            For Professional Services
          </button>
          <button
            onClick={() => onNavigate('/discovery')}
            className="text-[14px] text-[#4a4a44] hover:text-[#14140f] px-5 py-2.5 border border-[#d6d0c2] hover:border-[#14140f] rounded-full transition cursor-pointer"
          >
            For Healthcare Practices
          </button>
        </div>
      </section>

      {/* 8. FOUNDER CREDIBILITY */}
      <section className="border-t border-[#d6d0c2] py-24 md:py-32 px-6 md:px-14 max-w-[880px] mx-auto text-center">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[#1f3a2e] font-semibold mb-4">
          Who's Behind It
        </p>
        <h2 className="font-serif font-normal text-[clamp(26px,3.8vw,42px)] leading-[1.2] tracking-[-0.02em] mb-8 text-[#14140f]">
          Experienced operators, <em className="italic text-[#1f3a2e]">not theorists.</em>
        </h2>
        <p className="text-[17px] md:text-[18px] text-[#4a4a44] leading-[1.7] max-w-[680px] mx-auto mb-6">
          shapework. was built by three operators who have run the kind of businesses we now redesign. One scaled a brokerage from $100M to $325M+ in annual sales as its strategic growth lead. One co-founded, scaled, and exited a research firm, then spent years restructuring operations for other companies as a fractional executive. One led fixed operations at one of the country's largest auto groups, then founded companies built to remove the inefficiencies he watched cost businesses every day.
        </p>
        <p className="text-[16px] text-[#4a4a44] leading-[1.7] max-w-[680px] mx-auto mb-8">
          We have been the owner acting as the glue. We have untangled the systems nobody understood. The pattern recognition is earned, not borrowed.
        </p>
        <button
          onClick={() => onNavigate('/about')}
          className="inline-block text-[15px] text-[#1f3a2e] border-b border-[#d6d0c2] hover:border-[#1f3a2e] pb-0.5 transition cursor-pointer"
        >
          Meet Adam, Matt, and Marcus →
        </button>
      </section>

      {/* 9. SELECTED WORK / PROOF */}
      <section className="border-t border-[#d6d0c2] py-20 px-6 md:px-14 text-center max-w-[1280px] mx-auto">
        <div className="text-[11px] tracking-[0.25em] uppercase text-[#1f3a2e] mb-4">
          Selected Work
        </div>
        <h3 className="font-serif italic text-[clamp(22px,3.2vw,34px)] tracking-[-0.02em] text-[#14140f] mb-3">
          Currently in pilot with select partners.
        </h3>
        <p className="text-[15px] text-[#8a8a82] tracking-[0.02em]">
          Case studies coming soon.
        </p>
      </section>

      {/* 10. START HERE / DISCOVERY CTA */}
      <section id="cta" className="border-t border-[#d6d0c2] py-24 md:py-32 px-6 md:px-14 text-center max-w-[1280px] mx-auto">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[#1f3a2e] font-semibold mb-4">
          Start Here
        </p>
        <h2 className="font-serif font-normal text-[clamp(36px,6vw,80px)] leading-[1] tracking-[-0.04em] mb-6 text-[#14140f]">
          <em className="italic text-[#1f3a2e]">Workflow</em> Discovery.
        </h2>
        <p className="text-[17px] md:text-[18px] text-[#4a4a44] max-w-[540px] mx-auto mb-8 leading-relaxed">
          One week. A complete diagnostic of how your business runs today: where work gets stuck, where ownership is unclear, where the bottlenecks are, and what to fix first. You walk away with a ranked roadmap. Every engagement begins here.
        </p>
        <button
          onClick={() => onNavigate('/discovery')}
          className="inline-block px-8 py-4 bg-[#14140f] hover:bg-[#1f3a2e] text-[#f5f2ec] rounded-full text-[15px] font-medium tracking-[0.02em] transition-all hover:scale-[1.02] shadow-sm cursor-pointer"
        >
          Request Workflow Discovery →
        </button>
        <p className="mt-5 text-[13px] text-[#8a8a82] tracking-[0.05em]">
          $1,500 · Fixed fee · No surprises
        </p>
      </section>

      {/* 11. EXPANDED FOOTER */}
      <footer className="border-t border-[#d6d0c2] bg-[#ebe6dc] py-16 px-6 md:px-14">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          <div>
            <div className="font-serif text-[22px] font-medium tracking-[-0.03em] text-[#14140f]">
              shapework<span className="text-[#1f3a2e]">.</span>
            </div>
            <div className="text-[13px] text-[#8a8a82] mt-1 tracking-[0.02em]">
              Modern Workflow Design
            </div>
            <div className="font-serif italic text-[13px] text-[#8a8a82] mt-4 leading-relaxed">
              Born in Wilmington, NC.<br />
              Serving clients worldwide.
            </div>
          </div>

          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase text-[#1f3a2e] font-semibold mb-4">
              Explore
            </div>
            <div className="space-y-2.5 text-[14px]">
              <button onClick={() => onNavigate('/')} className="block text-[#4a4a44] hover:text-[#14140f] transition text-left cursor-pointer">Home</button>
              <button onClick={() => onNavigate('/method')} className="block text-[#4a4a44] hover:text-[#14140f] transition text-left cursor-pointer">The Method</button>
              <button onClick={() => onNavigate('/about')} className="block text-[#4a4a44] hover:text-[#14140f] transition text-left cursor-pointer">About</button>
              <button onClick={() => onNavigate('/operational-intelligence')} className="block text-[#4a4a44] hover:text-[#14140f] transition text-left cursor-pointer">Operational Intelligence</button>
              <button onClick={() => onNavigate('/discovery')} className="block text-[#4a4a44] hover:text-[#14140f] transition text-left cursor-pointer">Workflow Discovery</button>
            </div>
          </div>

          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase text-[#1f3a2e] font-semibold mb-4">
              Get in touch
            </div>
            <div className="space-y-2.5 text-[14px]">
              <a href="https://calendar.app.google/hAijcuGXPPjWjwmV7" target="_blank" rel="noopener noreferrer" className="block text-[#4a4a44] hover:text-[#14140f] transition">
                Schedule an intro call
              </a>
              <a href="mailto:hello@shapework.co" className="block text-[#4a4a44] hover:text-[#14140f] transition">
                hello@shapework.co
              </a>
              <div className="text-[13px] text-[#8a8a82] pt-4">
                © 2026 shapework.
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
