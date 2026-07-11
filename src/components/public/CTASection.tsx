import React from 'react';
import { ChevronRight } from 'lucide-react';

interface CTASectionProps {
  onNavigate: (path: string) => void;
}

export default function CTASection({ onNavigate }: CTASectionProps) {
  return (
    <div className="bg-brand-primary text-white py-16 md:py-24 px-6 md:px-12 rounded-[32px] max-w-5xl mx-auto my-12 relative overflow-hidden shadow-card text-center">
      {/* Background Soft Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-soft/10 rounded-full blur-[96px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-info-soft/10 rounded-full blur-[96px] pointer-events-none" />

      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 relative z-10">
        <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-brand-soft">
          Take the first step
        </span>
        
        <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight leading-[1.15]">
          See where your operation is leaking time.
        </h2>
        
        <p className="text-sm md:text-base text-brand-soft/80 font-sans font-light leading-relaxed max-w-lg mx-auto">
          One week. An objective operational audit. A ranked improvement roadmap. One concrete win implemented live.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onNavigate('/discovery')}
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-brand-soft text-brand-primary text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Request Workflow Discovery</span>
            <ChevronRight className="w-4 h-4 text-brand-primary" />
          </button>
          
          <a
            href="mailto:hello@shapework.co?subject=Intro Call Inquiry"
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary-hover hover:bg-brand-primary/50 text-white border border-brand-soft/20 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 decoration-none"
          >
            Schedule intro call
          </a>
        </div>
        
        <p className="text-[10px] md:text-xs text-brand-soft/50 pt-2 font-sans font-light">
          Fixed $1,500 fee · Deploys in 1 week · Requires 3-5 hours of team time
        </p>
      </div>
    </div>
  );
}
