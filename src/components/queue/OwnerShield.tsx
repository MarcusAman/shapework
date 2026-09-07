import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  TrendingDown, 
  BellOff, 
  Zap, 
  AlertTriangle 
} from 'lucide-react';
import { useOperatingMemoryStore } from '../../state/operatingMemoryStore';
import { createAuditEvent } from '../../utils/audit';

interface EscalationItem {
  id: string;
  type: string;
  record: string;
  details: string;
  raisedBy: string;
  age: string;
  actionTaken: boolean;
}

const initialEscalations: EscalationItem[] = [
  {
    id: 'esc_1',
    type: 'Commission Split Dispute',
    record: '102 Pine Street Escrow',
    details: 'Cooperating broker claims verbal agreement to waive $500 processing fee. Buyer agent Alex Carter requests owner mediation.',
    raisedBy: 'Alex Carter (Agent)',
    age: '2 hours ago',
    actionTaken: false
  },
  {
    id: 'esc_2',
    type: 'Legal Risk',
    record: 'Colonial Ave Land Survey',
    details: 'Neighboring tract owner has formally disputed property boundary lines prior to title insurance underwriting. Closing day at risk.',
    raisedBy: 'Jessica Keenan (Compliance Partner)',
    age: '5 hours ago',
    actionTaken: false
  },
  {
    id: 'esc_3',
    type: 'Partnership / Growth Proposal',
    record: 'Evergreen Title Co. Integration',
    details: 'Proposal to integrate preferred escrow API in exchange for 10% compliance credit reduction. Requires Owner approval.',
    raisedBy: 'Jessica Keenan (Compliance Partner)',
    age: '1 day ago',
    actionTaken: false
  },
  {
    id: 'esc_4',
    type: 'Agent Relationship Issue',
    record: 'Todd Howard Compliance Warnings',
    details: 'Todd Howard has failed to respond to three separate automated pre-approval document warnings. Brokerage policy escalation.',
    raisedBy: 'Jessica Keenan (Compliance Partner)',
    age: '1 day ago',
    actionTaken: false
  }
];

const routedLog = [
  {
    id: 'route_1',
    message: 'Who do I ask about signs for my new listing?',
    from: 'Todd Howard',
    action: 'Routed to Sign Inventory Owner (Emma Watson)',
    reason: 'Inventory Rule: Sign inventory queries automated by Sign Monitor.'
  },
  {
    id: 'route_2',
    message: 'What is the combination lockbox code for the office supplies cabinet?',
    from: 'Emma Watson',
    action: 'Auto-responded with combination code',
    reason: 'Access Rule: Lockbox combination queries auto-resolved by AI Engine.'
  },
  {
    id: 'route_3',
    message: 'Can someone replace the light bulb in the upstairs conference room?',
    from: 'Diane Ross',
    action: 'Routed to Office Maintenance Vendor',
    reason: 'Maintenance Rule: Facility requests routed directly to vendor dispatcher.'
  },
  {
    id: 'route_4',
    message: 'Where do we download the new MLS agent agreement PDF template?',
    from: 'Jessica Keenan',
    action: 'Emailed document link',
    reason: 'Form Rule: Standard contract files automated by Resource Assistant.'
  }
];

export default function OwnerShield() {
  const { setAgentRequests } = useOperatingMemoryStore();
  const [escalations, setEscalations] = useState<EscalationItem[]>(initialEscalations);
  
  const [stats, setStats] = useState({
    notificationsAvoided: 184,
    requestsRouted: 56,
    activeEscalations: 4,
    hoursSaved: 28.5
  });

  const handleResolveEscalation = (id: string, resolution: string) => {
    alert(`Escalation resolved: ${resolution}`);
    setEscalations(prev => prev.filter(e => e.id !== id));
    setStats(prev => ({
      ...prev,
      activeEscalations: prev.activeEscalations - 1,
      hoursSaved: prev.hoursSaved + 0.5
    }));

    // Create Audit event
    const auditEvents = JSON.parse(sessionStorage.getItem('shapework_audit_events') || '[]');
    const userProfile = JSON.parse(sessionStorage.getItem('shapework_active_profile') || '{"name":"Alex Carter", "role":"owner"}');
    const auditEvent = createAuditEvent(
      userProfile,
      `Brokerage Owner approved escalation: ${resolution} for target record: ${id}`,
      'Owner Decisions'
    );
    sessionStorage.setItem('shapework_audit_events', JSON.stringify([auditEvent, ...auditEvents]));

    // Dispatch update event
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      if (typeof document !== 'undefined' && document.createEvent) {
        const evt = document.createEvent('Event');
        evt.initEvent('storage', true, true);
        window.dispatchEvent(evt);
      }
    }
  };

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in pb-10">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
        <div className="p-4 bg-stone-50 border border-border-soft rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-soft text-brand-primary rounded-xl flex items-center justify-center shrink-0">
            <BellOff className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary font-bold tracking-wider uppercase block">Interruptions Blocked</span>
            <strong className="text-xl font-bold text-text-primary block leading-tight">{stats.notificationsAvoided}</strong>
            <span className="text-[8px] text-success font-semibold flex items-center mt-0.5">
              <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> 92% Noise Reduction
            </span>
          </div>
        </div>

        <div className="p-4 bg-stone-50 border border-border-soft rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-soft text-brand-primary rounded-xl flex items-center justify-center shrink-0">
            <Zap className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary font-bold tracking-wider uppercase block">Routine Tasks Routed</span>
            <strong className="text-xl font-bold text-text-primary block leading-tight">{stats.requestsRouted}</strong>
            <span className="text-[8px] text-text-secondary font-medium block mt-0.5">Emma Watson / Jessica Keenan / Vendors</span>
          </div>
        </div>

        <div className="p-4 bg-stone-50 border border-border-soft rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-soft text-brand-primary rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary font-bold tracking-wider uppercase block">Decisions Pending</span>
            <strong className="text-xl font-bold text-text-primary block leading-tight">{stats.activeEscalations}</strong>
            <span className="text-[8px] text-text-secondary font-medium block mt-0.5">High-stakes actions only</span>
          </div>
        </div>

        <div className="p-4 bg-brand-soft border border-brand-primary/10 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-primary text-white rounded-xl flex items-center justify-center shrink-0">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-primary font-bold tracking-wider uppercase block">Owner Time Protected</span>
            <strong className="text-xl font-bold text-brand-primary block leading-tight">{stats.hoursSaved} Hours</strong>
            <span className="text-[8px] text-brand-primary/80 font-medium block mt-0.5">Executive focus preserved</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Escalated Actions & Decisions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface border border-border-soft rounded-2xl overflow-hidden shadow-card">
            <div className="h-12 border-b border-border-soft px-4 flex items-center bg-surface-muted justify-between select-none">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Owner Decision Queue
              </span>
              <span className="text-[10px] text-risk-red font-bold">Action Required</span>
            </div>

            <div className="divide-y divide-border-soft">
              {escalations.length > 0 ? (
                escalations.map((item) => (
                  <div key={item.id} className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-risk-red uppercase tracking-wider bg-risk-red-soft px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                      <span className="text-[10px] text-text-tertiary">{item.age}</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-text-primary text-base">{item.record}</h4>
                      <p className="text-xs text-text-secondary leading-relaxed font-medium">
                        {item.details}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-1 border-t border-stone-50">
                      <span>Submitted by: <strong>{item.raisedBy}</strong></span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveEscalation(item.id, `Approved Commission/Legal Resolution: ${item.record}`)}
                          className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Approve Decision
                        </button>
                        <button
                          onClick={() => handleResolveEscalation(item.id, `Delegated task: ${item.record} to Compliance Lead`)}
                          className="px-3 py-1.5 border border-border-medium text-text-secondary hover:bg-stone-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Delegate Back
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-xs text-text-tertiary italic">
                  No pending escalations. All leadership channels protected.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Routed Interruptions Ledger */}
        <div className="lg:col-span-1 bg-surface border border-border-soft rounded-2xl p-4 shadow-card space-y-4">
          <div className="border-b border-border-soft pb-2 select-none">
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">Avoided Interruption Log</span>
            <p className="text-[9.5px] text-text-secondary mt-0.5">Routine communications intercepted and handled by shapework.</p>
          </div>

          <div className="space-y-3.5">
            {routedLog.map((log) => (
              <div key={log.id} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-mono text-[9px] text-text-tertiary select-none">
                  <span>From: {log.from}</span>
                  <span className="text-brand-primary font-bold">Auto-Routed</span>
                </div>
                <div className="p-2 bg-stone-50 border border-border-subtle rounded-lg text-text-secondary italic">
                  "{log.message}"
                </div>
                <p className="font-semibold text-text-primary text-[10px]">
                  Action: {log.action}
                </p>
                <p className="text-[9px] text-text-tertiary leading-normal">
                  Reason: {log.reason}
                </p>
                <div className="border-b border-border-soft/50 pt-1.5" />
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
