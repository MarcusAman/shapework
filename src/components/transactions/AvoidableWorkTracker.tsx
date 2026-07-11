import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  ZapOff, 
  TrendingDown, 
  HelpCircle, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function AvoidableWorkTracker() {
  const sources = [
    { title: 'Late File Cleanups', count: 5, hours: 12.5, status: 'high' },
    { title: 'Missing Intake Forms', count: 3, hours: 6.0, status: 'medium' },
    { title: 'Compliance Chases (< 7 days)', count: 4, hours: 8.0, status: 'high' },
    { title: 'Duplicate Clarification Loops', count: 2, hours: 2.0, status: 'low' }
  ];

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in pb-10">
      
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
        <div className="p-4 bg-stone-50 border border-border-soft rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-risk-red-soft text-risk-red rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary font-bold tracking-wider uppercase block">Avoidable Admin Hours</span>
            <strong className="text-xl font-bold text-text-primary block leading-tight">28.5 Hours</strong>
            <span className="text-[8px] text-text-secondary mt-0.5 block font-medium">Estimated leaks this week</span>
          </div>
        </div>

        <div className="p-4 bg-stone-50 border border-border-soft rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-soft text-brand-primary rounded-xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary font-bold tracking-wider uppercase block">Late Compliance Risks</span>
            <strong className="text-xl font-bold text-text-primary block leading-tight">9 Events</strong>
            <span className="text-[8px] text-success font-semibold flex items-center mt-0.5">
              <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> 4 Caught Early
            </span>
          </div>
        </div>

        <div className="p-4 bg-stone-50 border border-border-soft rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-soft text-brand-primary rounded-xl flex items-center justify-center shrink-0">
            <ZapOff className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary font-bold tracking-wider uppercase block">Rework & Duplicate Loops</span>
            <strong className="text-xl font-bold text-text-primary block leading-tight">6 Loop Backs</strong>
            <span className="text-[8px] text-text-secondary block font-medium mt-0.5">Vague intakes corrected</span>
          </div>
        </div>

        <div className="p-4 bg-brand-soft border border-brand-primary/10 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-primary text-white rounded-xl flex items-center justify-center shrink-0">
            <TrendingDown className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-primary font-bold tracking-wider uppercase block">Manual Cleanup Prevented</span>
            <strong className="text-xl font-bold text-brand-primary block leading-tight">14 Files</strong>
            <span className="text-[8px] text-brand-primary font-medium block mt-0.5">Triage rules applied</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Avoidable Sources list */}
        <div className="lg:col-span-2 bg-surface border border-border-soft rounded-2xl overflow-hidden shadow-card">
          <div className="h-12 border-b border-border-soft px-4 flex items-center bg-surface-muted justify-between select-none">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Primary Sources of Avoidable Work
            </span>
            <span className="text-[10px] text-text-tertiary">Weekly cumulative breakdown</span>
          </div>

          <div className="divide-y divide-border-soft">
            {sources.map((src, idx) => (
              <div key={idx} className="p-5 flex justify-between items-center text-xs">
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-text-primary text-base">{src.title}</h4>
                  <p className="text-[10px] text-text-tertiary">Registered {src.count} events in processing queue</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="font-bold text-risk-red font-mono text-sm">{src.hours} Hours lost</span>
                  <span className={`block text-[8px] font-bold uppercase ${
                    src.status === 'high' ? 'text-risk-red' :
                    src.status === 'medium' ? 'text-warning' : 'text-text-tertiary'
                  }`}>
                    {src.status.toUpperCase()} SEVERITY
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avoidable details & value prop */}
        <div className="lg:col-span-1 bg-surface border border-border-soft rounded-2xl p-5 shadow-card space-y-4">
          <div className="border-b border-border-soft pb-2 select-none">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Avoidable Prevention Strategy</span>
            <span className="text-[9px] text-brand-primary font-bold uppercase mt-0.5">Value Proposition</span>
          </div>

          <div className="space-y-4 text-xs leading-relaxed">
            <div className="p-3 bg-brand-soft/20 border border-brand-primary/10 rounded-xl space-y-1 select-none">
              <span className="text-[9px] text-brand-primary font-bold uppercase block tracking-wider">Primary Core Metric</span>
              <p className="text-text-primary font-medium italic font-serif">
                "shapework. prevents late-file cleanup by catching intake and compliance gaps earlier."
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="font-bold text-text-primary block">Deals causing late work</span>
                <p className="text-text-secondary">
                  <strong>109 Woodlawn Addendum</strong>: Missing contract intake form triggered 3.5 hours of coordinator search.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-text-primary block">Active Recommendation</span>
                <p className="text-text-secondary">
                  Authorize Deal Intake Guard to run automatic daily MLS status checks to catch files before they go under contract.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
