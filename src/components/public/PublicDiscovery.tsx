import React from 'react';
import { CheckCircle2, Calendar, HelpCircle, ArrowRight, ChevronDown } from 'lucide-react';
import SectionHeader from './SectionHeader';
import CTASection from './CTASection';

interface PublicDiscoveryProps {
  onNavigate: (path: string) => void;
}

export default function PublicDiscovery({ onNavigate }: PublicDiscoveryProps) {
  const [openFaqIdx, setOpenFaqIdx] = React.useState<number | null>(null);

  const deliverables = [
    {
      title: "Current-State Map",
      desc: "An objective flowchart detailing exactly how requests enter your office, who routes them, where files are stored, and where bottlenecks occur."
    },
    {
      title: "Ranked Opportunity List",
      desc: "A prioritized backlog of operational friction points, scored by complexity and revenue/compliance impact, so you know what is costing you the most."
    },
    {
      title: "Prioritized Roadmap",
      desc: "A realistic 12-week blueprint explaining exactly how to implement the standard rules, automation pipelines, and background AI systems."
    },
    {
      title: "One Deployed Quick Win",
      desc: "We configure and launch one immediate operational fix (e.g. email intake agent, automated compliance reminders, sign request desk) during the week."
    }
  ];

  const days = [
    {
      day: "Monday",
      label: "Kickoff & Signal Inventory",
      desc: "We host a 45-minute kickoff call with leadership to audit the systems, logins, and channels through which your business receives requests."
    },
    {
      day: "Tuesday & Wednesday",
      label: "Focused Team Interviews",
      desc: "We spend 30 minutes interviewing the staff performing the daily work, tracing how requests move and documenting actual behavior, not theoretical manuals."
    },
    {
      day: "Thursday",
      label: "Diagnostic Analysis",
      desc: "We analyze the interview data, identify leakage points, score friction severity, and build the current-state maps and opportunity backlog."
    },
    {
      day: "Friday",
      label: "Deliverables & Quick Win Deployed",
      desc: "We present our findings, walk through your custom roadmap, and activate your selected quick-win automation live."
    }
  ];

  const faqs = [
    {
      q: "How long does Workflow Discovery actually take?",
      a: "One week from Monday kickoff to Friday walkthrough. Most of the work happens on our end. Your team's time commitment is typically 3 to 5 hours total across the week."
    },
    {
      q: "What do we get at the end?",
      a: "You receive a current-state map of how your business runs today, a ranked list of opportunities to remove friction, severity scoring on each opportunity, a 12-week roadmap, and one quick win implemented live during the engagement."
    },
    {
      q: "Do we have to hire shapework. for the next phase?",
      a: "No. Workflow Discovery is a complete engagement on its own. The roadmap is yours regardless. Most clients do move into implementation work afterward, but that is a separate decision made after they have the diagnostic in hand."
    },
    {
      q: "What kinds of businesses is this for?",
      a: "Owner-led businesses typically with 5 to 50 employees that have outgrown the way they operate. Professional services firms, agencies, healthcare practices, real estate brokerages, and other operations-heavy small businesses."
    },
    {
      q: "Is this remote or in person?",
      a: "Both are options. We serve clients worldwide remotely and work with Wilmington-area businesses on-site when it makes sense. The deliverables and outcomes are identical."
    },
    {
      q: "What is the quick win?",
      a: "During the audit we identify one immediate improvement we can make. It varies by business but is always something you can see and measure by Friday. Past examples include email-to-task parsers, automated status reminders, and sign request desks."
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  return (
    <div className="space-y-16 md:space-y-24 py-10 md:py-16 text-left font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <SectionHeader
          eyebrow="Signature Diagnostic"
          title="One week. A complete operational diagnostic."
          subtitle="Before you buy another software tool or hire more coordinators, let's trace where your operations are leaking time. $1,500 fixed fee. Complete diagnostic. One quick win."
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-6 border-t border-border-soft/60">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xl font-serif font-bold text-text-primary">
              The Deliverables
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {deliverables.map((item, idx) => (
                <div key={idx} className="p-4 bg-surface border border-border-soft rounded-xl shadow-soft">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4.5 h-4.5 text-brand-primary shrink-0" />
                    <h4 className="text-xs md:text-sm font-serif font-bold text-text-primary">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-[11px] md:text-xs text-text-secondary leading-normal font-light">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-5 bg-surface border border-border-medium rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-soft">
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-widest block">
                Engagement Terms
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-mono font-bold text-text-primary">$1,500</span>
                <span className="text-xs text-text-secondary">USD</span>
              </div>
              <p className="text-xs text-text-tertiary">
                Fixed fee. One invoice. Complete roadmap delivered.
              </p>
            </div>
            
            <div className="pt-4 border-t border-border-soft space-y-2 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-primary shrink-0" />
                <span>3 to 5 hours total of team time required</span>
              </div>
            </div>
            
            <div className="pt-6">
              <button
                onClick={() => onNavigate('/discovery')}
                className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                Request Booking
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DAY-BY-DAY ENGAGEMENT TIMELINE */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto">
        <div className="space-y-8">
          <h3 className="text-2xl font-serif font-bold text-text-primary">
            The Discovery Week
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {days.map((d, idx) => (
              <div key={idx} className="p-5 bg-surface-soft border border-border-soft rounded-2xl relative text-left">
                <div className="flex items-center justify-between mb-3 border-b border-border-soft pb-2">
                  <span className="text-[10px] font-mono text-brand-primary font-bold uppercase">
                    {d.day}
                  </span>
                  <span className="text-xs font-serif font-bold text-text-tertiary">
                    0{idx+1}
                  </span>
                </div>
                <h4 className="text-sm font-serif font-bold text-text-primary mb-2">
                  {d.label}
                </h4>
                <p className="text-[11px] md:text-xs text-text-secondary leading-relaxed font-light">
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE FAQ SECTION */}
      <section className="px-6 md:px-12 max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary block mb-2">
              Questions
            </span>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-text-primary">
              Frequently Asked Questions
            </h3>
          </div>
          
          <div className="space-y-4 pt-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-surface border border-border-soft rounded-2xl overflow-hidden shadow-soft transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 flex items-center justify-between text-left font-serif font-bold text-sm md:text-base text-text-primary cursor-pointer hover:bg-stone-50/50 focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-text-secondary leading-relaxed font-light font-sans border-t border-border-soft/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. FINAL CTA */}
      <section className="px-6 md:px-12">
        <CTASection onNavigate={onNavigate} />
      </section>
      
    </div>
  );
}
