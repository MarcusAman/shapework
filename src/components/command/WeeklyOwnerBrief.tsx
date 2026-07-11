import React from 'react';
import { ShieldCheck, Download, AlertTriangle, CheckCircle, Clock, DollarSign, FileText, Wrench } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface WeeklyOwnerBriefProps {
  state?: any;
}

export default function WeeklyOwnerBrief({ state = {} }: WeeklyOwnerBriefProps) {
  const {
    transactions = [],
    activeProfile,
    fetchState,
    jobs = [],
    ownerBriefItems = [],
    setCurrentTab,
    onSelectJob
  } = state;

  // 1. Owner Worthy Decisions (from ownerBriefItems category = 'owner_decision')
  const headlessOwnerDecisions = ownerBriefItems.filter((item: any) => item.category === 'owner_decision');
  const ownerDecisions = headlessOwnerDecisions.map((item: any) => ({
    id: item.sourceId || item.id,
    title: item.title,
    summary: item.summary,
    priority: item.priority || 'medium',
    status: 'pending',
    createdAt: item.createdAt || item.created_at
  }));

  const shapeworkApprovals = jobs.filter((j: any) => j.status === 'waiting_approval');

  // 2. Routine Issues Shielded
  const completedJobsCount = jobs.filter((j: any) => j.status === 'completed').length;
  const completedCount = completedJobsCount;
  const avoidedBriefItemsCount = ownerBriefItems.filter((item: any) => item.category === 'interruption_avoided' || item.category === 'deflection').length;
  const avoidedCount = completedJobsCount + avoidedBriefItemsCount;

  // 3. Role Gaps (Vacant roles)
  const staffList = state.profiles || [];
  const hasMarketing = staffList.some((p: any) => p.role === 'marketing_coordinator');
  const roleGaps = hasMarketing ? [] : ["Marketing Coordinator (Melissa)"];

  // 4. Aging Escalations (Owner decisions created > 24 hours ago)
  const agingEscalations = ownerBriefItems.filter((item: any) => 
    item.category === 'owner_decision' && 
    (Date.now() - new Date(item.createdAt || item.created_at || Date.now()).getTime()) > 24 * 60 * 60 * 1000
  ).map((item: any) => ({
    id: item.sourceId || item.id,
    title: item.title,
    createdAt: item.createdAt || item.created_at
  }));

  // 5. Closings at Risk
  const closingsAtRisk = transactions.filter((t: any) => 
    t.current_stage !== 'closed' && 
    (t.risk_level === 'blocked' || t.risk_level === 'at_risk')
  );

  // 6. Commission Readiness summary
  const totalActive = transactions.filter((t: any) => t.current_stage !== 'closed');
  const readyCommission = totalActive.filter((t: any) => t.health_score >= 80);
  const commissionGaps = totalActive.filter((t: any) => t.health_score < 80);
  const totalExpectedCommission = totalActive.reduce((sum: number, t: any) => sum + (t.revenue || 0), 0);

  // 7. Compliance Risks
  const complianceRisks = jobs.filter((j: any) => 
    j.status !== 'completed' && 
    (j.workflowKey === 'closing_compliance_risk' || j.workflowKey === 'missing_document' || j.workflowKey === 'compliance_chase')
  ).map((j: any) => ({
    id: j.id,
    title: j.workflowName || j.requestText,
    status: j.status,
    createdAt: j.created_at
  }));

  // 8. Files waiting on agents
  const filesWaitingOnAgents = jobs.filter((j: any) => 
    j.status === 'blocked' || 
    (j.requestText || '').toLowerCase().includes('agent')
  ).map((j: any) => ({
    id: j.id,
    title: j.workflowName || j.requestText,
    status: j.status,
    createdAt: j.created_at
  }));

  // 9. Marketing Bottlenecks
  const marketingBottlenecks = jobs.filter((j: any) => 
    j.status !== 'completed' && 
    j.workflowKey === 'marketing_request'
  ).map((j: any) => ({
    id: j.id,
    title: j.workflowName || j.requestText,
    status: j.status,
    createdAt: j.created_at
  }));

  // 10. Office / Signage Issues
  const officeIssues = jobs.filter((j: any) => 
    j.status !== 'completed' && 
    (j.workflowKey === 'office_readiness' || j.workflowKey === 'facilities_issue' || j.workflowKey === 'sign_low_stock')
  ).map((j: any) => ({
    id: j.id,
    title: j.workflowName || j.requestText,
    status: j.status,
    createdAt: j.created_at
  }));

  // Completed wins from receipts
  const outputs = (state.receipts || []).map((rec: any) => ({
    id: rec.id,
    job_id: rec.jobId || rec.job_id,
    title: rec.title,
    summary: rec.summary
  }));

  const [shieldMetrics, setShieldMetrics] = React.useState({
    routedToStaffCount: 4,
    escalatedToOwnerCount: 2,
    heldForDigestCount: 0,
    needsOwnerDecisionCount: 1
  });

  React.useEffect(() => {
    fetch('/api/headless/owner-shield')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.metrics) {
          setShieldMetrics(data.metrics);
        }
      });
  }, []);

  const handleResolveDecision = async (itemId: string) => {
    try {
      const res = await fetch(`/api/work-items/${itemId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          userName: activeProfile?.name || 'Sarah Jenkins',
          userRole: activeProfile?.role || 'operations_lead'
        })
      });
      if (res.ok && fetchState) {
        await fetchState();
        alert('Escalation resolved and logged to database.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportBrief = () => {
    const briefText = `WEEKLY OPERATIONS BRIEF & OWNER SHIELD REPORT
Week Ending: ${new Date().toLocaleDateString()}
Brokerage OS Operating Layer Metrics

1. OWNER INTERRUPTIONS SHIELDED
- Total routine coordinator requests deflected: ${avoidedCount} items
- Tasks closed automatically or handled by coordinators: ${completedCount} instances
- Owner Shield deflected to staff: ${shieldMetrics.routedToStaffCount}
- Escalated to Owner: ${shieldMetrics.escalatedToOwnerCount}
- True Decisions Pending: ${shieldMetrics.needsOwnerDecisionCount}

2. DYNAMIC HIGH-RISK ESCALATIONS
${ownerDecisions.map((d: any) => `- [${d.priority.toUpperCase()}] ${d.title}: ${d.recommendedNextAction}`).join('\n') || '- No pending owner-worthy disputes or legal issues reported.'}

3. COMMISSION READINESS & PIPELINE
- Active pipeline files observed: ${totalActive.length} transactions
- Ready for commission distribution: ${readyCommission.length} files
- Files with outstanding compliance gaps: ${commissionGaps.length} files
- Expected pipeline revenue volume: ${formatCurrency(totalExpectedCommission)}

4. CLOSINGS AT RISK DETAIL
${closingsAtRisk.map((c: any) => `- ${c.property_address} (Risk Level: ${c.risk_level})`).join('\n') || '- No active closings flagged at risk.'}

5. OPERATIONS BOTTLENECKS
- Compliance risks: ${complianceRisks.length} files
- Files waiting on agents: ${filesWaitingOnAgents.length} files
- Marketing bottlenecks: ${marketingBottlenecks.length} files
- Office/signage issues: ${officeIssues.length} files`;
    
    navigator.clipboard.writeText(briefText.trim());
    alert('Weekly Owner Brief copied to clipboard!');
  };

  return (
    <div className="space-y-6 font-sans text-xs text-[#F6F7F1] select-text text-left">
      <div className="flex justify-between items-center border-b border-[rgba(246,247,241,0.12)] pb-4 select-none">
        <div>
          <h3 className="text-xl font-serif font-black text-white">Weekly Owner Brief & Shield</h3>
          <p className="mt-1 text-[#D0D6BB] font-medium font-sans">Overview of high-level operational risks, avoided interruptions, and owner-worthy decision queues.</p>
        </div>
        <button
          onClick={handleExportBrief}
          className="sw-btn bg-[#00635C] hover:bg-[#007c73] text-white py-1.5 px-3 rounded-xl border border-[rgba(246,247,241,0.18)] flex items-center gap-1.5 cursor-pointer font-bold shadow-md transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Brief</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 select-none">
        {[
          { label: 'Shielded Issues', val: `${avoidedCount} Avoided`, color: 'text-emerald-400' },
          { label: 'Owner Decisions', val: `${ownerDecisions.length} Items`, color: 'text-amber-400' },
          { label: 'Role Gaps', val: `${roleGaps.length} Vacant`, color: 'text-rose-400' },
          { label: 'Wins This Week', val: `${completedCount} Closed`, color: 'text-white' }
        ].map((stat, idx) => (
          <div 
            key={idx} 
            className="p-4 rounded-2xl flex flex-col justify-between space-y-1.5"
            style={{
              background: 'rgba(246, 247, 241, 0.10)',
              border: '1px solid rgba(246, 247, 241, 0.18)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}
          >
            <span className="text-[10px] uppercase font-bold text-[#D0D6BB] tracking-wider">{stat.label}</span>
            <strong className={`text-lg font-bold ${stat.color} font-mono block mt-1`}>{stat.val}</strong>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Owner Worthy Decisions Queue */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Owner Shield Notification */}
          <div className="bg-[rgba(0,99,92,0.15)] border border-[rgba(0,99,92,0.3)] rounded-[28px] p-6 flex flex-col md:flex-row items-start md:items-center gap-4 select-none shadow-lg">
            <ShieldCheck className="w-10 h-10 text-emerald-400 shrink-0" />
            <div className="space-y-1.5 flex-1 text-left">
              <h4 className="font-serif font-black text-white text-sm">Owner Interruption Shield Active</h4>
              <p className="text-[11px] text-[#D0D6BB] leading-relaxed font-medium">
                The Owner Shield dynamically blocks routine tasks (marketing details, checkout lists, lockbox setups) from your view. Only critical legal, commission, or partner issues reach this board.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[rgba(246,247,241,0.12)] text-[10px]">
                <div>
                  <span className="block font-bold text-[#D0D6BB] uppercase tracking-wider font-mono text-[8px]">Routed to Staff</span>
                  <strong className="text-xs text-white font-bold">{shieldMetrics.routedToStaffCount} deflected</strong>
                </div>
                <div>
                  <span className="block font-bold text-[#D0D6BB] uppercase tracking-wider font-mono text-[8px]">Escalated to Owner</span>
                  <strong className="text-xs text-white font-bold">{shieldMetrics.escalatedToOwnerCount} items</strong>
                </div>
                <div>
                  <span className="block font-bold text-[#D0D6BB] uppercase tracking-wider font-mono text-[8px]">Held for Digest</span>
                  <strong className="text-xs text-white font-bold">{shieldMetrics.heldForDigestCount} items</strong>
                </div>
                <div>
                  <span className="block font-bold text-[#D0D6BB] uppercase tracking-wider font-mono text-[8px]">True Decisions</span>
                  <strong className="text-xs text-white font-bold">{shieldMetrics.needsOwnerDecisionCount} pending</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Role Gaps & Vacant Responsibilities Alert */}
          {roleGaps.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-800 rounded-2xl p-4 flex items-center gap-3 select-none text-left">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <h5 className="font-bold text-white text-xs">Active Role Gaps Detected</h5>
                <p className="text-[11px] text-amber-350 mt-0.5 font-medium leading-normal">
                  The following required responsibilities have no active owner: <strong>{roleGaps.join(', ')}</strong>. Routine workflows are currently piling up.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block">Critical Owner-Worthy Decisions & approvals</span>
            <div className="space-y-3">
              {headlessOwnerDecisions.map((dec: any) => {
                const approval = (state.approvals || []).find((a: any) => a.id === dec.source_id);
                const step = approval ? (state.steps || []).find((s: any) => s.id === approval.step_id) : null;
                const job = step ? (state.jobs || []).find((j: any) => j.id === step.job_id) : null;
                return (
                  <div
                    key={dec.id}
                    onClick={() => {
                      if (setCurrentTab) setCurrentTab('Workboard');
                      if (job && onSelectJob) onSelectJob(job);
                    }}
                    className="rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[rgba(246,247,241,0.14)] hover:border-emerald-500/50 border transition-all cursor-pointer text-left"
                    style={{
                      background: 'rgba(246, 247, 241, 0.08)',
                      border: '1px solid rgba(246, 247, 241, 0.16)'
                    }}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 select-none">
                        <span className="px-2 py-0.5 bg-amber-950/40 text-amber-250 border border-amber-800/40 font-bold rounded-full text-[8px] uppercase tracking-wider">
                          Shapework Approval Required
                        </span>
                        <span className="text-[9px] text-[#D0D6BB]/75 font-mono">{new Date(dec.created_at).toLocaleDateString()}</span>
                      </div>
                      <h5 className="font-serif font-black text-white text-xs">{dec.title}</h5>
                      <p className="text-xs text-[#D0D6BB] leading-relaxed font-medium">
                        {dec.summary}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-white font-bold shrink-0">Review Action &rarr;</span>
                  </div>
                );
              })}

              {shapeworkApprovals.map((dec: any) => (
                <div
                  key={dec.id}
                  onClick={() => {
                    if (setCurrentTab) setCurrentTab('Workboard');
                    if (onSelectJob) onSelectJob(dec);
                  }}
                  className="rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[rgba(246,247,241,0.14)] hover:border-emerald-500/50 border transition-all cursor-pointer text-left"
                  style={{
                    background: 'rgba(246, 247, 241, 0.08)',
                    border: '1px solid rgba(246, 247, 241, 0.16)'
                  }}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 select-none">
                      <span className="px-2 py-0.5 bg-amber-950/40 text-amber-250 border border-amber-800/40 font-bold rounded-full text-[8px] uppercase tracking-wider">
                        Shapework Approval Needed
                      </span>
                      <span className="text-[9px] text-[#D0D6BB]/75 font-mono">{new Date(dec.created_at).toLocaleDateString()}</span>
                    </div>
                    <h5 className="font-serif font-black text-white text-xs">{dec.workflow_name}</h5>
                    <p className="text-xs text-[#D0D6BB] leading-relaxed font-medium">
                      Shapework requires approval to execute: <span className="font-bold text-white">{dec.current_step}</span>.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-white font-bold shrink-0">Review Action &rarr;</span>
                </div>
              ))}

              {ownerDecisions.map((dec: any) => (
                <div 
                  key={dec.id} 
                  className="rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[rgba(246,247,241,0.14)] border transition-all select-text text-left"
                  style={{
                    background: 'rgba(246, 247, 241, 0.08)',
                    border: '1px solid rgba(246, 247, 241, 0.16)'
                  }}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 select-none">
                      <span className="px-2 py-0.5 bg-rose-950/40 text-rose-250 border border-rose-800/40 font-bold rounded-full text-[8px] uppercase tracking-wider">
                        {dec.priority} Priority Escalation
                      </span>
                      <span className="text-[9px] text-[#D0D6BB]/75 font-mono">{new Date(dec.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h5 className="font-bold text-white text-xs">{dec.title}</h5>
                    <p className="text-xs text-[#D0D6BB] leading-relaxed font-medium">
                      {dec.recommendedNextAction}
                    </p>
                  </div>
                  <button
                    onClick={() => handleResolveDecision(dec.id)}
                    className="bg-[#00635C] hover:bg-[#007c73] text-white text-[10px] py-1.5 px-3 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                </div>
              ))}

              {headlessOwnerDecisions.length === 0 && shapeworkApprovals.length === 0 && ownerDecisions.length === 0 && (
                <div className="p-6 bg-[rgba(246,247,241,0.06)] border border-dashed border-[rgba(246,247,241,0.18)] rounded-2xl text-center text-[#D0D6BB] italic">
                  No critical escalations pending owner signoff.
                </div>
              )}
            </div>
          </div>

          {/* Active Closings at Risk */}
          <div className="space-y-3 text-left">
            <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block">Closings at Risk checklist ({closingsAtRisk.length})</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {closingsAtRisk.map((deal: any) => (
                <div 
                  key={deal.id} 
                  className="rounded-2xl p-4 space-y-3"
                  style={{
                    background: 'rgba(246, 247, 241, 0.08)',
                    border: '1px solid rgba(246, 247, 241, 0.16)'
                  }}
                >
                  <div className="flex justify-between items-start select-none">
                    <div>
                      <h6 className="font-serif font-black text-white text-xs">{deal.property_address || 'Wilmington Closing'}</h6>
                      <span className="text-[9px] text-[#D0D6BB] font-mono">{deal.client_name}</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-rose-950/40 text-rose-300 border border-rose-800/40 font-bold rounded text-[8px] uppercase font-mono">
                      {deal.risk_level}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#D0D6BB] leading-relaxed font-medium">
                    {deal.risk_description || 'Closing checklist is blocked by missing file requirements.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Operational Wins (Shapework) */}
          <div className="space-y-3">
            <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block">Completed Wins (Shapework)</span>
            <div className="space-y-2 select-none">
              {outputs.length === 0 ? (
                <p className="text-[#D0D6BB] italic text-[10px] bg-[rgba(246,247,241,0.06)] border border-[rgba(246,247,241,0.12)] rounded-2xl p-5">No workflows completed this week.</p>
              ) : (
                <div className="space-y-2">
                  {outputs.map((out: any) => {
                    const job = jobs.find((j: any) => j.id === out.job_id);
                    return (
                      <div
                        key={out.id}
                        onClick={() => {
                          if (setCurrentTab) setCurrentTab('Workboard');
                          if (job && onSelectJob) onSelectJob(job);
                        }}
                        className="p-3 border border-[rgba(246,247,241,0.15)] bg-[rgba(246,247,241,0.06)] hover:bg-[rgba(246,247,241,0.12)] rounded-xl flex justify-between items-center text-[10px] cursor-pointer hover:border-emerald-500/30 transition-all text-left"
                      >
                        <div className="space-y-1 pr-4">
                          <span className="font-serif font-black text-white block">{out.title}</span>
                          <span className="text-[9px] text-[#D0D6BB] block leading-snug">{out.summary}</span>
                        </div>
                        <span className="text-[8px] font-mono bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Handled</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Deflected Inquiries (Shield Log) */}
          <div className="space-y-3">
            <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block">Deflected Inquiries (Shield Log)</span>
            <div className="space-y-2 select-none">
              {ownerBriefItems.filter((item: any) => item.category === 'interruption_avoided').length === 0 ? (
                <p className="text-[10px] text-[#D0D6BB] italic bg-[rgba(246,247,241,0.06)] border border-[rgba(246,247,241,0.12)] rounded-2xl p-5">No routine queries deflected yet this week.</p>
              ) : (
                <div className="space-y-2">
                  {ownerBriefItems.filter((item: any) => item.category === 'interruption_avoided').map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3 border border-[rgba(246,247,241,0.15)] bg-[rgba(246,247,241,0.06)] rounded-xl flex justify-between items-center text-[10px]"
                    >
                      <div className="space-y-1 pr-4">
                        <span className="font-serif font-black text-white block">{item.title}</span>
                        <span className="text-[9px] text-[#D0D6BB] block leading-snug">{item.summary}</span>
                      </div>
                      <span className="text-[8px] font-mono bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Shielded</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: avoided counts, closing risks, compliance, and marketing bottlenecks */}
        <div className="space-y-4 select-none">
          <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-2xl p-5 space-y-4">
            
            {/* Closings At Risk */}
            <div>
              <span className="font-mono font-bold text-[9px] text-[var(--sw-muted-light)] uppercase tracking-wider block">Closings At Risk</span>
              <div className="mt-2 space-y-2">
                {closingsAtRisk.map((c: any) => (
                  <div key={c.id} className="p-2 border border-[var(--sw-border)] bg-[var(--sw-surface)] rounded-xl flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[var(--sw-text)] truncate max-w-[120px]">{c.property_address.split(',')[0]}</span>
                    <span className="px-1.5 py-0.2 bg-[var(--sw-risk)]/10 text-[var(--sw-risk)] rounded uppercase font-bold text-[8px] font-mono">{c.risk_level}</span>
                  </div>
                ))}
                {closingsAtRisk.length === 0 && (
                  <span className="text-[10px] text-[var(--sw-muted)] italic">No closings currently flagged at risk.</span>
                )}
              </div>
            </div>

            {/* Aging Escalations */}
            <div className="border-t border-[var(--sw-border)] pt-3">
              <span className="font-mono font-bold text-[9px] text-[var(--sw-muted-light)] uppercase tracking-wider block">Aging Escalations (&gt;24h)</span>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-[var(--sw-risk)]">{agingEscalations.length}</span>
                <span className="text-[10px] text-[var(--sw-muted)]">tasks pending override</span>
              </div>
            </div>

            {/* Commission Readiness */}
            <div className="border-t border-[var(--sw-border)] pt-3">
              <span className="font-mono font-bold text-[9px] text-[var(--sw-muted-light)] uppercase tracking-wider block">Commission Readiness</span>
              <div className="mt-2 text-[10px] space-y-1 text-[var(--sw-muted)]">
                <div className="flex justify-between">
                  <span>Expected commission:</span>
                  <span className="font-bold text-[var(--sw-text)] font-mono">{formatCurrency(totalExpectedCommission)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ready for payout:</span>
                  <span className="text-[var(--sw-success)] font-bold">{readyCommission.length} files</span>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding gaps:</span>
                  <span className="text-[var(--sw-risk)] font-bold">{commissionGaps.length} files</span>
                </div>
              </div>
            </div>

            {/* QuickBooks Financial Insights */}
            <div className="border-t border-[var(--sw-border)] pt-3">
              <span className="font-mono font-bold text-[9px] text-[var(--sw-muted-light)] uppercase tracking-wider block">QuickBooks Financials (30d)</span>
              {(() => {
                const qbConnection = (state.quickbooksConnections || []).find(
                  (c: any) => c.workspaceId === (state.workspaceId || state.activeWorkspaceId || 'nest-realty-demo')
                );
                if (qbConnection && qbConnection.plSummary) {
                  return (
                    <div className="mt-2 space-y-2 text-[10px] text-[var(--sw-muted)]">
                      <div className="flex justify-between">
                        <span>Net Income:</span>
                        <span className={`font-mono font-bold ${qbConnection.plSummary.netIncome >= 0 ? 'text-[var(--sw-success)] font-bold' : 'text-[var(--sw-risk)] font-bold'}`}>
                          {formatCurrency(qbConnection.plSummary.netIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Income:</span>
                        <span className="font-bold text-[var(--sw-text)] font-mono">{formatCurrency(qbConnection.plSummary.totalIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Expenses:</span>
                        <span className="font-mono text-stone-400">{formatCurrency(qbConnection.plSummary.totalExpenses)}</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="mt-2 p-2 border border-dashed border-[var(--sw-border)] rounded-xl text-center">
                    <span className="text-[10px] text-[var(--sw-muted)] block">QuickBooks not connected</span>
                  </div>
                );
              })()}
            </div>

            {/* QuickBooks Online Signal Audit */}
            {(() => {
              const qbSignals = (state.financeSignals || []).filter(
                (s: any) => s.workspaceId === (state.workspaceId || state.activeWorkspaceId || 'nest-realty-demo') && s.sourceSystem === 'quickbooks'
              );
              if (qbSignals.length === 0) return null;
              return (
                <div className="border-t border-[rgba(246,247,241,0.12)] pt-3">
                  <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block">QuickBooks Signals</span>
                  <div className="mt-2 space-y-1.5 max-h-[150px] overflow-y-auto">
                    {qbSignals.map((sig: any) => (
                      <div key={sig.id} className="p-2 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-lg text-[9px] space-y-1 leading-normal text-left">
                        <div className="flex justify-between items-center font-mono">
                          <span className={`px-1.5 rounded uppercase font-bold text-[7px] ${
                            sig.signalType === 'payment_received' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' :
                            sig.signalType === 'deposit_received' ? 'bg-blue-950 text-blue-400 border border-blue-900/50' :
                            'bg-amber-950 text-amber-400 border border-amber-900/50'
                          }`}>
                            {sig.signalType.replace('_', ' ')}
                          </span>
                          <span className="text-[#D0D6BB]">{sig.date}</span>
                        </div>
                        <p className="text-[10px] text-white font-medium leading-relaxed">{sig.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Basecamp Team Execution Signals */}
            {(() => {
              const wsId = state.workspaceId || state.activeWorkspaceId || 'nest-realty-demo';
              const bcConnection = (state.basecampConnections || []).find(
                (c: any) => c.workspaceId === wsId && c.status === 'connected'
              );
              if (!bcConnection) return null;

              const bcSignals = (state.basecampSignals || []).filter(
                (s: any) => s.workspaceId === wsId
              );

              const overdueTasks = bcSignals.filter((s: any) => s.signalType === 'todo_overdue');
              const unassignedWork = bcSignals.filter((s: any) => s.signalType === 'todo_unassigned');
              const ownerMentions = bcSignals.filter((s: any) => s.signalType === 'owner_mentioned');
              const stuckFollowups = bcSignals.filter((s: any) => 
                s.signalType === 'task_stuck' || 
                s.signalType === 'marketing_request_detected' || 
                s.signalType === 'event_task_detected' || 
                s.signalType === 'office_issue_detected' || 
                s.signalType === 'vendor_followup_detected'
              );

              return (
                <div className="border-t border-[rgba(246,247,241,0.12)] pt-3 space-y-3">
                  <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block">Team execution signals</span>
                  
                  <div className="space-y-1.5 text-[10px] text-[#D0D6BB]">
                    <div className="flex justify-between">
                      <span>Overdue Team Tasks:</span>
                      <span className={`font-mono font-bold ${overdueTasks.length > 0 ? 'text-rose-400' : 'text-[#D0D6BB]/75'}`}>
                        {overdueTasks.length} tasks
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unassigned Internal Work:</span>
                      <span className={`font-mono font-bold ${unassignedWork.length > 0 ? 'text-amber-400' : 'text-[#D0D6BB]/75'}`}>
                        {unassignedWork.length} items
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner Mentions (Avoided/Escalated):</span>
                      <span className={`font-mono font-bold ${ownerMentions.length > 0 ? 'text-rose-400' : 'text-[#D0D6BB]/75'}`}>
                        {ownerMentions.length} mentions
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stuck Marketing/Event/Office:</span>
                      <span className={`font-mono font-bold ${stuckFollowups.length > 0 ? 'text-amber-400 font-bold' : 'text-[#D0D6BB]/75'}`}>
                        {stuckFollowups.length} stuck
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sync Status:</span>
                      <span className="font-mono text-emerald-400 font-bold">Connected</span>
                    </div>
                  </div>

                  {bcSignals.length > 0 && (
                    <div className="mt-2 space-y-1.5 max-h-[150px] overflow-y-auto">
                      {bcSignals.slice(0, 5).map((sig: any) => (
                        <div key={sig.id} className="p-2 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-lg text-[9px] space-y-1 leading-normal text-left">
                          <div className="flex justify-between items-center font-mono">
                            <span className={`px-1.5 rounded uppercase font-bold text-[7px] ${
                              sig.signalType === 'owner_mentioned' ? 'bg-rose-950 text-rose-400 border border-rose-900/50' :
                              sig.signalType === 'todo_overdue' ? 'bg-amber-950 text-amber-400 border border-amber-900/50' :
                              'bg-stone-850 text-[#D0D6BB] border border-stone-800'
                            }`}>
                              {sig.signalType.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[#D0D6BB]">Active</span>
                          </div>
                          <p className="text-[10px] text-white font-medium leading-relaxed">{sig.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Google & Microsoft Workspace Rollup */}
            {(() => {
              const wsId = state.workspaceId || state.activeWorkspaceId || 'nest-realty-demo';
              const googleConn = (state.googleConnections || []).find((c: any) => c.workspaceId === wsId && c.status === 'connected');
              const msConn = (state.microsoftConnections || []).find((c: any) => c.workspaceId === wsId && c.status === 'connected');
              if (!googleConn && !msConn) return null;

              const syncedEmailsCount = (state.emailMessages || []).filter((m: any) => !m.workspaceId || m.workspaceId === wsId).length;
              const syncedEventsCount = (state.calendarEvents || []).filter((e: any) => !e.workspaceId || e.workspaceId === wsId).length;
              const pendingOutboxCount = (state.actionProposals || []).filter((p: any) => p.action_type === 'draft_email' && p.state === 'suggested').length;

              return (
                <div className="border-t border-[rgba(246,247,241,0.12)] pt-3 space-y-3">
                  <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block">Workspace &amp; Communications</span>
                  
                  <div className="space-y-1.5 text-[10px] text-[#D0D6BB]">
                    {googleConn && (
                      <div className="flex justify-between items-center">
                        <span>Google Workspace:</span>
                        <span className="font-mono text-emerald-400 font-bold">Connected</span>
                      </div>
                    )}
                    {msConn && (
                      <div className="flex justify-between items-center">
                        <span>Microsoft 365:</span>
                        <span className="font-mono text-emerald-400 font-bold">Connected</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Synced Email Messages:</span>
                      <span className="font-mono text-white font-bold">{syncedEmailsCount} messages</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Synced Calendar Events:</span>
                      <span className="font-mono text-white font-bold">{syncedEventsCount} appointments</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Outbox Approvals:</span>
                      <span className={`font-mono font-bold ${pendingOutboxCount > 0 ? 'text-amber-400' : 'text-[#D0D6BB]/75'}`}>
                        {pendingOutboxCount} drafts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Operation Bottlenecks summary */}
            <div className="border-t border-[rgba(246,247,241,0.12)] pt-3 divide-y divide-[rgba(246,247,241,0.12)] space-y-3">
              
              <div className="flex justify-between items-center pt-3 first:pt-0">
                <div className="space-y-0.5 text-left">
                  <span className="font-bold text-white text-xs">Compliance Risks</span>
                  <span className="block text-[9px] text-[#D0D6BB]">Missing documents / checks</span>
                </div>
                <span className="px-2 py-0.5 bg-rose-950/40 text-rose-200 border border-rose-800/40 font-mono font-bold rounded-lg shrink-0 text-[10px]">
                  {complianceRisks.length}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3">
                <div className="space-y-0.5 text-left">
                  <span className="font-bold text-white text-xs">Waiting on Agents</span>
                  <span className="block text-[9px] text-[#D0D6BB]">Awaiting uploads / forms</span>
                </div>
                <span className="px-2 py-0.5 bg-[rgba(0,99,92,0.15)] text-emerald-300 border border-[rgba(0,99,92,0.3)] font-mono font-bold rounded-lg shrink-0 text-[10px]">
                  {filesWaitingOnAgents.length}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3">
                <div className="space-y-0.5 text-left">
                  <span className="font-bold text-white text-xs">Marketing Bottlenecks</span>
                  <span className="block text-[9px] text-[#D0D6BB]">Collaterals in design stage</span>
                </div>
                <span className="px-2 py-0.5 bg-[rgba(246,247,241,0.06)] text-[#D0D6BB] border border-[rgba(246,247,241,0.12)] font-mono font-bold rounded-lg shrink-0 text-[10px]">
                  {marketingBottlenecks.length}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3">
                <div className="space-y-0.5 text-left">
                  <span className="font-bold text-white text-xs">Office / Signage issues</span>
                  <span className="block text-[9px] text-[#D0D6BB]">Active facilities tickets</span>
                </div>
                <span className="px-2 py-0.5 bg-[rgba(246,247,241,0.06)] text-[#D0D6BB] border border-[rgba(246,247,241,0.12)] font-mono font-bold rounded-lg shrink-0 text-[10px]">
                  {officeIssues.length}
                </span>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
