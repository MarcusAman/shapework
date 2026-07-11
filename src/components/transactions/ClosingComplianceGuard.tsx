import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  FileText, 
  Mail, 
  Send, 
  Clock, 
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  XCircle,
  FileQuestion
} from 'lucide-react';

interface ClosingComplianceGuardProps {
  state?: any;
}

export default function ClosingComplianceGuard({ state = {} }: ClosingComplianceGuardProps) {
  const {
    workItems = [],
    transactions = [],
    profiles = [],
    fetchState,
    activeProfile
  } = state;

  const [activeBucket, setActiveBucket] = useState<'all' | 'T3' | 'T7' | 'T14' | 'T30'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customNudgeText, setCustomNudgeText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Map transactions to compliance records with missing docs and daysToClose countdowns
  const complianceRecords = transactions
    .filter((t: any) => t.current_stage !== 'closed')
    .map((t: any) => {
      const closingDate = t.expected_closing_date;
      let daysToClose = 999;
      if (closingDate) {
        const diff = new Date(closingDate).getTime() - Date.now();
        daysToClose = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
      
      // Parse missing docs from risk_reasons or fallback
      const missingDocs = t.risk_reasons?.filter((r: string) => 
        r !== 'Low Commission' && 
        r !== 'Closing Date Past' && 
        r !== 'Missing Docs'
      ) || [];
      
      if (missingDocs.length === 0) {
        if (t.risk_level === 'blocked') {
          missingDocs.push("Signed Sales Contract", "Escrow Escrow Receipt");
        } else if (t.risk_level === 'at_risk') {
          missingDocs.push("Buyer Agency Agreement");
        } else {
          missingDocs.push("Seller Property Disclosure");
        }
      }

      return {
        id: t.id,
        propertyAddress: t.property_address,
        clientName: t.client_name,
        agentName: t.responsible_agent_id === 'ag_1' ? 'Alex Carter' : 'Sarah Jenkins',
        daysToClose,
        closingDate,
        missingDocs,
        hasMissingDocs: true,
        riskLevel: t.risk_level
      };
    });

  // Buckets
  const t3Files = complianceRecords.filter((r: any) => r.daysToClose >= 0 && r.daysToClose <= 3);
  const t7Files = complianceRecords.filter((r: any) => r.daysToClose > 3 && r.daysToClose <= 7);
  const t14Files = complianceRecords.filter((r: any) => r.daysToClose > 7 && r.daysToClose <= 14);
  const t30Files = complianceRecords.filter((r: any) => r.daysToClose > 14 && r.daysToClose <= 30);

  // Filter based on activeBucket selection
  const filteredRecords = complianceRecords.filter((r: any) => {
    if (activeBucket === 'all') return true;
    if (activeBucket === 'T3') return r.daysToClose >= 0 && r.daysToClose <= 3;
    if (activeBucket === 'T7') return r.daysToClose > 3 && r.daysToClose <= 7;
    if (activeBucket === 'T14') return r.daysToClose > 7 && r.daysToClose <= 14;
    if (activeBucket === 'T30') return r.daysToClose > 14 && r.daysToClose <= 30;
    return true;
  });

  useEffect(() => {
    if (filteredRecords.length > 0 && !selectedId) {
      setSelectedId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedId]);

  const selectedItem = filteredRecords.find((i: any) => i.id === selectedId) || filteredRecords[0];

  const getPrebuiltNudgeText = (deal: any) => {
    if (!deal) return '';
    return `Hi ${deal.agentName}, closing on ${deal.propertyAddress} is approaching in ${deal.daysToClose} days. We are missing compliance documents: ${deal.missingDocs.join(', ')}. Please upload these documents today to ensure timely commission release. Thanks!`;
  };

  useEffect(() => {
    if (selectedItem) {
      setCustomNudgeText(getPrebuiltNudgeText(selectedItem));
    }
  }, [selectedId, selectedItem]);

  const handleAction = async (itemId: string, actionName: string, messageText?: string) => {
    setIsProcessing(true);
    try {
      // Find the associated database work item (if any) or make a new approval
      const res = await fetch('/api/work-items/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Approval Needed: Send SMS compliance notice to agent`,
          type: 'approval_needed',
          source: 'system',
          ownerRole: 'operations_lead',
          priority: 'critical',
          recommendedNextAction: `Confirm outreach message to agent: "${messageText || customNudgeText}"`,
          relatedType: 'workflow',
          relatedId: itemId,
          relatedLabel: 'Outbound Agent Compliance Chaser',
          approvalRequired: true
        })
      });

      if (res.ok) {
        if (fetchState) await fetchState();
        alert(`Compliance action logged. SMS Outreach draft created in Approval Center.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in pb-10 select-text text-[#F6F7F1]">
      
      {/* Overview Banner */}
      <div className="bg-[rgba(0,99,92,0.15)] border border-[rgba(0,99,92,0.3)] rounded-[28px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none shadow-lg">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Closing Compliance Guard Active
          </h2>
          <p className="text-xs text-[#D0D6BB] leading-relaxed font-medium max-w-2xl font-sans">
            Compliance Guard watches upcoming closings (T-30 to T-1 days) to flag missing buyer agency agreements, unsigned disclosures, or escrow receipts, preventing delayed funding.
          </p>
        </div>
        <div className="px-4 py-2 bg-[#00635C] border border-[rgba(246,247,241,0.18)] text-white text-xs font-bold rounded-xl shrink-0">
          {complianceRecords.length} Files Awaiting Document Audits
        </div>
      </div>

      {/* Integration Warnings */}
      {(() => {
        const integrations = state?.integrations || [];
        const rechatConn = integrations.find((i: any) => i.id === 'i_rechat');
        const dotloopConn = integrations.find((i: any) => i.id === 'i_dotloop') || integrations.find((i: any) => i.name?.toLowerCase().includes('dotloop'));
        const hasRechatError = rechatConn?.errors_count > 0;
        const isDotloopInactive = !dotloopConn?.connected;

        if (!hasRechatError && !isDotloopInactive) return null;

        return (
          <div className="p-4 bg-amber-955/30 border border-amber-800 rounded-2xl flex flex-col gap-2 select-none text-left">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <h4 className="font-bold text-white text-xs">Rechat / Dotloop Connection Alert</h4>
            </div>
            <div className="text-[11px] text-amber-300 space-y-1.5 pl-7 font-sans font-medium">
              {hasRechatError && (
                <p>
                  <strong>Rechat Sync Alert:</strong> Webhook credentials experienced a token refresh failure: 
                  <code className="bg-amber-900/40 text-amber-250 border border-amber-800/40 px-1 py-0.5 rounded font-mono text-[10px] ml-1">{rechatConn.recent_errors?.[0] || '401 Unauthorized'}</code>. 
                  Listing status changes may be delayed.
                </p>
              )}
              {isDotloopInactive && (
                <p>
                  <strong>Dotloop Integration Inactive:</strong> Dotloop is currently disconnected or operating in mock/read-only mode. 
                  Under-contract signatures will not automatically clear compliance checks until connected.
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Countdown buckets interactive filters */}
      <div className="grid grid-cols-5 gap-3 select-none">
        <button
          onClick={() => { setActiveBucket('all'); setSelectedId(null); }}
          className={`p-3 border rounded-xl flex flex-col items-center justify-center transition-all bg-[rgba(246,247,241,0.10)] ${
            activeBucket === 'all' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-[rgba(246,247,241,0.15)]' : 'border-[rgba(246,247,241,0.18)]'
          }`}
        >
          <span className="text-[9px] uppercase font-bold text-[#D0D6BB] font-sans">All Active</span>
          <strong className="text-base font-black font-mono mt-1 text-white">{complianceRecords.length} Files</strong>
        </button>
        <button
          onClick={() => { setActiveBucket('T3'); setSelectedId(null); }}
          className={`p-3 border rounded-xl flex flex-col items-center justify-center transition-all bg-[rgba(246,247,241,0.10)] ${
            activeBucket === 'T3' ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-950/20' : 'border-[rgba(246,247,241,0.18)]'
          }`}
        >
          <span className="text-[9px] uppercase font-bold text-rose-450 font-sans">T-3 Days</span>
          <strong className="text-base font-black font-mono mt-1 text-rose-400">{t3Files.length} Files</strong>
        </button>
        <button
          onClick={() => { setActiveBucket('T7'); setSelectedId(null); }}
          className={`p-3 border rounded-xl flex flex-col items-center justify-center transition-all bg-[rgba(246,247,241,0.10)] ${
            activeBucket === 'T7' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-955/20' : 'border-[rgba(246,247,241,0.18)]'
          }`}
        >
          <span className="text-[9px] uppercase font-bold text-amber-450 font-sans">T-7 Days</span>
          <strong className="text-base font-black font-mono mt-1 text-amber-400">{t7Files.length} Files</strong>
        </button>
        <button
          onClick={() => { setActiveBucket('T14'); setSelectedId(null); }}
          className={`p-3 border rounded-xl flex flex-col items-center justify-center transition-all bg-[rgba(246,247,241,0.10)] ${
            activeBucket === 'T14' ? 'border-emerald-450 ring-2 ring-emerald-500/20 bg-[rgba(246,247,241,0.15)]' : 'border-[rgba(246,247,241,0.18)]'
          }`}
        >
          <span className="text-[9px] uppercase font-bold text-emerald-400 font-sans">T-14 Days</span>
          <strong className="text-base font-black font-mono mt-1 text-emerald-350">{t14Files.length} Files</strong>
        </button>
        <button
          onClick={() => { setActiveBucket('T30'); setSelectedId(null); }}
          className={`p-3 border rounded-xl flex flex-col items-center justify-center transition-all bg-[rgba(246,247,241,0.10)] ${
            activeBucket === 'T30' ? 'border-white ring-2 ring-white/20 bg-[rgba(246,247,241,0.15)]' : 'border-[rgba(246,247,241,0.18)]'
          }`}
        >
          <span className="text-[9px] uppercase font-bold text-[#D0D6BB] font-sans">T-30 Days</span>
          <strong className="text-base font-black font-mono mt-1 text-white">{t30Files.length} Files</strong>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left List of Risks */}
        <div 
          className="xl:col-span-2 rounded-[28px] overflow-hidden shadow-lg border select-none"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <div className="h-12 border-b border-[rgba(246,247,241,0.12)] px-4 flex items-center bg-[rgba(246,247,241,0.04)] justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-serif font-black">
              Pending Document Audits
            </span>
          </div>

          <div className="divide-y divide-[rgba(246,247,241,0.12)]">
            {filteredRecords.map((item: any) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedId(item.id)}
                className={`p-4 transition-all cursor-pointer flex justify-between items-center text-left ${
                  selectedId === item.id ? 'bg-[rgba(0,99,92,0.20)]' : 'hover:bg-[rgba(246,247,241,0.06)]'
                }`}
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-xs">{item.propertyAddress}</h4>
                  <p className="text-[10px] text-[#D0D6BB] font-sans">Client: {item.clientName} · Responsible: {item.agentName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#D0D6BB] font-bold">
                    Closing in {item.daysToClose}d
                  </span>
                  <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase tracking-wider border ${
                    item.riskLevel === 'blocked' 
                      ? 'bg-rose-950/40 text-rose-300 border-rose-800/40' 
                      : 'bg-amber-955/40 text-amber-355 border-amber-800/40'
                  }`}>
                    {item.riskLevel}
                  </span>
                </div>
              </div>
            ))}
            {filteredRecords.length === 0 && (
              <div className="p-8 text-center text-[#D0D6BB] italic">
                No active compliance documents missing in this countdown window.
              </div>
            )}
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="space-y-4">
          {selectedItem ? (
            <div 
              className="rounded-[28px] p-5 space-y-4 shadow-lg"
              style={{
                background: 'rgba(246, 247, 241, 0.10)',
                border: '1px solid rgba(246, 247, 241, 0.18)',
                backdropFilter: 'blur(18px)'
              }}
            >
              <div className="flex justify-between items-center select-none">
                <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider">
                  COMPLIANCE FILE AUDIT
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[rgba(246,247,241,0.06)] rounded border border-[rgba(246,247,241,0.12)] text-white font-mono">
                  SLA: Active
                </span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-white text-sm">{selectedItem.propertyAddress}</h4>
                <p className="text-[11px] text-[#D0D6BB] mt-0.5">Client: {selectedItem.clientName} · Agent: {selectedItem.agentName}</p>
              </div>

              {/* Exception Details Audit Log */}
              <div className="p-3 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-xl text-[10px] space-y-2 select-text font-mono text-left">
                <div className="flex justify-between py-0.5 border-b border-[rgba(246,247,241,0.08)]">
                  <span className="text-[#D0D6BB]">Source System:</span>
                  <span className="text-white font-sans font-semibold">Dotloop via API Nation</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-[rgba(246,247,241,0.08)]">
                  <span className="text-[#D0D6BB]">External Ref:</span>
                  <span className="text-white">dl_loop_{selectedItem.id.substring(3)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-[rgba(246,247,241,0.08)]">
                  <span className="text-[#D0D6BB]">Matching Rule:</span>
                  <span className="text-white font-sans">NC Close-of-Escrow Audit SLA (T-30)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-[#D0D6BB]">Escalation Manager:</span>
                  <span className="text-white font-sans font-bold">
                    {(() => {
                      const opsLead = (profiles || []).find((p: any) => p.role === 'operations_lead' && p.status === 'active');
                      return opsLead ? `${opsLead.name} (Operations Lead)` : 'Ann Gunn (Operations Lead)';
                    })()}
                  </span>
                </div>
              </div>

              {/* Missing Documents Checklist */}
              <div className="bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] p-3.5 rounded-xl space-y-2 select-none text-left">
                <span className="font-bold text-white text-[10px] block uppercase tracking-wider flex items-center gap-1.5">
                  <FileQuestion className="w-4 h-4 text-rose-400" />
                  Missing Compliance Documents
                </span>
                <ul className="space-y-1 text-xs text-rose-300 leading-relaxed list-disc pl-4 font-medium font-sans">
                  {selectedItem.missingDocs.map((doc: string, idx: number) => (
                    <li key={idx} className="font-bold">{doc}</li>
                  ))}
                </ul>
              </div>

              {/* Action Outreach Intake Form */}
              <div className="space-y-3 pt-2 border-t border-[rgba(246,247,241,0.12)]">
                <span className="text-[10px] text-white font-bold block select-none text-left">Dispatch Agent Nudge</span>
                <textarea
                  value={customNudgeText}
                  onChange={(e) => setCustomNudgeText(e.target.value)}
                  placeholder="Draft SMS content here: e.g. Hey Alex, title is requesting the buyer agency contract. Please upload..."
                  className="w-full p-3 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs h-24 font-sans leading-relaxed focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={() => handleAction(selectedItem.id, 'Prompt Outreach Notice', customNudgeText)}
                  disabled={isProcessing}
                  className="w-full py-2 bg-[#00635C] hover:bg-[#007c73] border border-[rgba(246,247,241,0.18)] text-white rounded-xl flex items-center justify-center gap-1.5 select-none font-bold text-xs cursor-pointer shadow-md transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Nudge Draft for Approval</span>
                </button>
              </div>

            </div>
          ) : (
            <div 
              className="p-5 text-center text-[#D0D6BB] select-none italic rounded-[28px] shadow-lg border"
              style={{
                background: 'rgba(246, 247, 241, 0.10)',
                border: '1px solid rgba(246, 247, 241, 0.18)',
                backdropFilter: 'blur(18px)'
              }}
            >
              Select a file on the left to proceed with compliance audit.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
