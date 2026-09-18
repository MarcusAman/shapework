import React, { useState } from 'react';
import { ShieldCheck, Download, AlertTriangle, CheckCircle, Clock, DollarSign, FileText, Wrench, Mail } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import WeeklyOwnerDigestConfigModal from './WeeklyOwnerDigestConfigModal';

interface WeeklyOwnerBriefProps {
  state?: any;
}

export default function WeeklyOwnerBrief({ state = {} }: WeeklyOwnerBriefProps) {
  const [showDigestModal, setShowDigestModal] = useState(false);
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
          userName: activeProfile?.name || 'Ann Gunn',
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
    <div className="space-y-6 font-sans text-xs text-[var(--sw-text-primary)] select-text text-left">
      <div 
        className="rounded-[28px] p-6 text-left shadow-xs select-none bg-[var(--sw-surface)] border border-[var(--sw-border)]"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-[var(--sw-text-primary)] tracking-tight font-sans">Weekly Owner Brief & Shield</h3>
            <p className="mt-1 text-xs text-[var(--sw-text-secondary)] font-sans font-medium">Overview of high-level operational risks, avoided interruptions, and owner-worthy decision queues.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDigestModal(true)}
              className="sw-btn bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold shadow-xs transition-colors shrink-0 text-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Configure Email Digest</span>
            </button>
            <button
              onClick={handleExportBrief}
              className="sw-btn bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer font-bold shadow-xs transition-colors shrink-0 text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Brief</span>
            </button>
          </div>
        </div>
      </div>

      <WeeklyOwnerDigestConfigModal
        isOpen={showDigestModal}
        onClose={() => setShowDigestModal(false)}
        workspaceId={state?.workspaceId || 'nest-realty-demo'}
        currentUserEmail={activeProfile?.email}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 select-none">
        {[
          { label: 'Shielded Issues', val: `${avoidedCount} Avoided`, color: 'text-emerald-700' },
          { label: 'Owner Decisions', val: `${ownerDecisions.length} Items`, color: 'text-amber-700' },
          { label: 'Role Gaps', val: `${roleGaps.length} Vacant`, color: 'text-rose-700' },
          { label: 'Wins This Week', val: `${completedCount} Closed`, color: 'text-[var(--sw-text-primary)]' }
        ].map((stat, idx) => (
          <div 
            key={idx} 
            className="p-4 rounded-2xl flex flex-col justify-between space-y-1.5 bg-[var(--sw-surface)] border border-[var(--sw-border)] shadow-xs"
          >
            <span className="text-[10px] uppercase font-bold text-[var(--sw-text-secondary)] tracking-wider">{stat.label}</span>
            <strong className={`text-lg font-bold ${stat.color} font-mono block mt-1`}>{stat.val}</strong>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Owner Worthy Decisions Queue */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Owner Shield Notification */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-[28px] p-6 flex flex-col md:flex-row items-start md:items-center gap-4 select-none shadow-xs">
            <ShieldCheck className="w-10 h-10 text-[var(--brand-primary)] shrink-0" />
            <div className="space-y-1.5 flex-1 text-left">
              <h4 className="font-bold text-[var(--sw-text-primary)] text-sm">Owner Interruption Shield Active</h4>
              <p className="text-[11px] text-[var(--sw-text-secondary)] leading-relaxed font-medium">
                The Owner Shield dynamically blocks routine tasks (marketing details, checkout lists, lockbox setups) from your view. Only critical legal, commission, or partner issues reach this board.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-emerald-200 text-[10px]">
                <div>
                  <span className="block font-bold text-[var(--sw-text-secondary)] uppercase tracking-wider font-mono text-[8px]">Routed to Staff</span>
                  <strong className="text-xs text-[var(--sw-text-primary)] font-bold">{shieldMetrics.routedToStaffCount} deflected</strong>
                </div>
                <div>
                  <span className="block font-bold text-[var(--sw-text-secondary)] uppercase tracking-wider font-mono text-[8px]">Escalated to Owner</span>
                  <strong className="text-xs text-[var(--sw-text-primary)] font-bold">{shieldMetrics.escalatedToOwnerCount} items</strong>
                </div>
                <div>
                  <span className="block font-bold text-[var(--sw-text-secondary)] uppercase tracking-wider font-mono text-[8px]">Held for Digest</span>
                  <strong className="text-xs text-[var(--sw-text-primary)] font-bold">{shieldMetrics.heldForDigestCount} items</strong>
                </div>
                <div>
                  <span className="block font-bold text-[var(--sw-text-secondary)] uppercase tracking-wider font-mono text-[8px]">True Decisions</span>
                  <strong className="text-xs text-[var(--sw-text-primary)] font-bold">{shieldMetrics.needsOwnerDecisionCount} pending</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Role Gaps & Vacant Responsibilities Alert */}
          {roleGaps.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 select-none text-left">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <h5 className="font-bold text-amber-950 text-xs">Active Role Gaps Detected</h5>
                <p className="text-[11px] text-amber-900 mt-0.5 font-medium leading-normal">
                  The following required responsibilities have no active owner: <strong>{roleGaps.join(', ')}</strong>. Routine workflows are currently piling up.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <span className="font-mono font-bold text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider block">Critical Owner-Worthy Decisions & approvals</span>
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
                    className="rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--sw-surface)] border border-[var(--sw-border)] hover:bg-[var(--sw-canvas)] transition-all cursor-pointer text-left shadow-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 select-none">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-bold rounded-full text-[8px] uppercase tracking-wider">
                          Shapework Approval Required
                        </span>
                        <span className="text-[9px] text-[var(--sw-text-secondary)] font-mono">{new Date(dec.created_at).toLocaleDateString()}</span>
                      </div>
                      <h5 className="font-bold text-[var(--sw-text-primary)] text-xs font-sans">{dec.title}</h5>
                      <p className="text-xs text-[var(--sw-text-secondary)] leading-relaxed font-medium">
                        {dec.summary}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--brand-primary)] font-bold shrink-0">Review Action &rarr;</span>
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
                  className="rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--sw-surface)] border border-[var(--sw-border)] hover:bg-[var(--sw-canvas)] transition-all cursor-pointer text-left shadow-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 select-none">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-bold rounded-full text-[8px] uppercase tracking-wider">
                        Shapework Approval Needed
                      </span>
                      <span className="text-[9px] text-[var(--sw-text-secondary)] font-mono">{new Date(dec.created_at).toLocaleDateString()}</span>
                    </div>
                    <h5 className="font-bold text-[var(--sw-text-primary)] text-xs font-sans">{dec.workflow_name}</h5>
                    <p className="text-xs text-[var(--sw-text-secondary)] leading-relaxed font-medium">
                      Shapework requires approval to execute: <span className="font-bold text-[var(--sw-text-primary)]">{dec.current_step}</span>.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--brand-primary)] font-bold shrink-0">Review Action &rarr;</span>
                </div>
              ))}

              {ownerDecisions.map((dec: any) => (
                <div 
                  key={dec.id} 
                  className="rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--sw-surface)] border border-[var(--sw-border)] hover:bg-[var(--sw-canvas)] transition-all select-text text-left shadow-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 select-none">
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 font-bold rounded-full text-[8px] uppercase tracking-wider">
                        {dec.priority} Priority Escalation
                      </span>
                      <span className="text-[9px] text-[var(--sw-text-secondary)] font-mono">{new Date(dec.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h5 className="font-bold text-[var(--sw-text-primary)] text-xs">{dec.title}</h5>
                    <p className="text-xs text-[var(--sw-text-secondary)] leading-relaxed font-medium">
                      {dec.recommendedNextAction}
                    </p>
                  </div>
                  <button
                    onClick={() => handleResolveDecision(dec.id)}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white text-[10px] py-1.5 px-3 rounded-lg font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Mark Resolved
                  </button>
                </div>
              ))}

              {headlessOwnerDecisions.length === 0 && shapeworkApprovals.length === 0 && ownerDecisions.length === 0 && (
                <div className="p-6 bg-[var(--sw-canvas)] border border-dashed border-[var(--sw-border)] rounded-2xl text-center text-[var(--sw-text-secondary)] italic">
                  No critical escalations pending owner signoff.
                </div>
              )}
            </div>
          </div>

          {/* Active Closings at Risk */}
          <div className="space-y-3 text-left">
            <span className="font-mono font-bold text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider block">Closings at Risk checklist ({closingsAtRisk.length})</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {closingsAtRisk.map((deal: any) => (
                <div 
                  key={deal.id} 
                  className="rounded-2xl p-4 space-y-3 bg-[var(--sw-surface)] border border-[var(--sw-border)] shadow-xs"
                >
                  <div className="flex justify-between items-start select-none">
                    <div>
                      <h6 className="font-bold text-[var(--sw-text-primary)] text-xs font-sans">{deal.property_address || 'Wilmington Closing'}</h6>
                      <span className="text-[9px] text-[var(--sw-text-secondary)] font-mono">{deal.client_name}</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 font-bold rounded text-[8px] uppercase font-mono">
                      {deal.risk_level}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--sw-text-secondary)] leading-relaxed font-medium">
                    {deal.risk_description || 'Closing checklist is blocked by missing file requirements.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Operational Wins (Shapework) */}
          <div className="space-y-3">
            <span className="font-mono font-bold text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider block">Completed Wins (Shapework)</span>
            <div className="space-y-2 select-none">
              {outputs.length === 0 ? (
                <p className="text-[var(--sw-text-secondary)] italic text-[10px] bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-2xl p-5">No workflows completed this week.</p>
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
                        className="p-3 border border-[var(--sw-border)] bg-[var(--sw-surface)] hover:bg-[var(--sw-canvas)] rounded-xl flex justify-between items-center text-[10px] cursor-pointer transition-all text-left shadow-xs"
                      >
                        <div className="space-y-1 pr-4">
                          <span className="font-bold text-[var(--sw-text-primary)] block font-sans">{out.title}</span>
                          <span className="text-[9px] text-[var(--sw-text-secondary)] block leading-snug">{out.summary}</span>
                        </div>
                        <span className="text-[8px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Handled</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Deflected Inquiries (Shield Log) */}
          <div className="space-y-3">
            <span className="font-mono font-bold text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider block">Deflected Inquiries (Shield Log)</span>
            <div className="space-y-2 select-none">
              {ownerBriefItems.filter((item: any) => item.category === 'interruption_avoided').length === 0 ? (
                <p className="text-[10px] text-[var(--sw-text-secondary)] italic bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-2xl p-5">No routine queries deflected yet this week.</p>
              ) : (
                <div className="space-y-2">
                  {ownerBriefItems.filter((item: any) => item.category === 'interruption_avoided').map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3 border border-[var(--sw-border)] bg-[var(--sw-surface)] rounded-xl flex justify-between items-center text-[10px] shadow-xs"
                    >
                      <div className="space-y-1 pr-4">
                        <span className="font-bold text-[var(--sw-text-primary)] block font-sans">{item.title}</span>
                        <span className="text-[9px] text-[var(--sw-text-secondary)] block leading-snug">{item.summary}</span>
                      </div>
                      <span className="text-[8px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Shielded</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: avoided counts, closing risks, compliance, and marketing bottlenecks */}
        <div className="space-y-4 select-none">
          <div className="bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-2xl p-5 space-y-4 shadow-xs">
            
            {/* Closings At Risk */}
            <div>
              <span className="font-mono font-bold text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider block">Closings At Risk</span>
              <div className="mt-2 space-y-2">
                {closingsAtRisk.map((c: any) => (
                  <div key={c.id} className="p-2 border border-[var(--sw-border)] bg-[var(--sw-canvas)] rounded-xl flex justify-between items-center text-[10px]">
                    <span className="font-bold text-[var(--sw-text-primary)] truncate max-w-[120px]">{c.property_address.split(',')[0]}</span>
                    <span className="px-1.5 py-0.2 bg-rose-50 text-rose-800 border border-rose-200 rounded uppercase font-bold text-[8px] font-mono">{c.risk_level}</span>
                  </div>
                ))}
                {closingsAtRisk.length === 0 && (
                  <span className="text-[10px] text-[var(--sw-text-secondary)] italic">No closings currently flagged at risk.</span>
                )}
              </div>
            </div>

            {/* Aging Escalations */}
            <div className="border-t border-[var(--sw-border)] pt-3">
              <span className="font-mono font-bold text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider block">Aging Escalations (&gt;24h)</span>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-rose-700">{agingEscalations.length}</span>
                <span className="text-[10px] text-[var(--sw-text-secondary)]">tasks pending override</span>
              </div>
            </div>

            {/* Commission Readiness */}
            <div className="border-t border-[var(--sw-border)] pt-3">
              <span className="font-mono font-bold text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider block">Commission Readiness</span>
              <div className="mt-2 text-[10px] space-y-1 text-[var(--sw-text-secondary)]">
                <div className="flex justify-between">
                  <span>Expected commission:</span>
                  <span className="font-bold text-[var(--sw-text-primary)] font-mono">{formatCurrency(totalExpectedCommission)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ready for payout:</span>
                  <span className="text-emerald-700 font-bold">{readyCommission.length} files</span>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding gaps:</span>
                  <span className="text-rose-700 font-bold">{commissionGaps.length} files</span>
                </div>
              </div>
            </div>

            {/* QuickBooks Financial Insights */}
            <div className="border-t border-[var(--sw-border)] pt-3">
              <span className="font-mono font-bold text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider block">QuickBooks Financials (30d)</span>
              {(() => {
                const qbConnection = (state.quickbooksConnections || []).find(
                  (c: any) => c.workspaceId === (state.workspaceId || state.activeWorkspaceId || 'nest-realty-demo')
                );
                if (qbConnection && qbConnection.plSummary) {
                  return (
                    <div className="mt-2 space-y-2 text-[10px] text-[var(--sw-text-secondary)]">
                      <div className="flex justify-between">
                        <span>Net Income:</span>
                        <span className={`font-mono font-bold ${qbConnection.plSummary.netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatCurrency(qbConnection.plSummary.netIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Income:</span>
                        <span className="font-bold text-[var(--sw-text-primary)] font-mono">{formatCurrency(qbConnection.plSummary.totalIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Expenses:</span>
                        <span className="font-mono text-[var(--sw-text-secondary)]">{formatCurrency(qbConnection.plSummary.totalExpenses)}</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="mt-2 p-2 border border-dashed border-[var(--sw-border)] bg-[var(--sw-canvas)] rounded-xl text-center">
                    <span className="text-[10px] text-[var(--sw-text-secondary)] block">QuickBooks not connected</span>
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
                <div className="border-t border-[var(--sw-border)] pt-3">
                  <span className="font-mono font-bold text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider block">QuickBooks Signals</span>
                  <div className="mt-2 space-y-1.5 max-h-[150px] overflow-y-auto">
                    {qbSignals.map((sig: any) => (
                      <div key={sig.id} className="p-2 bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-lg text-[9px] space-y-1 leading-normal text-left">
                        <div className="flex justify-between items-center font-mono">
                          <span className={`px-1.5 rounded uppercase font-bold text-[7px] ${
                            sig.signalType === 'payment_received' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            sig.signalType === 'deposit_received' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {sig.signalType.replace('_', ' ')}
                          </span>
                          <span className="text-[var(--sw-text-secondary)]">{sig.date}</span>
                        </div>
                        <p className="text-[10px] text-[var(--sw-text-primary)] font-medium leading-relaxed">{sig.summary}</p>
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
                <div className="border-t border-[var(--sw-border)] pt-3 space-y-3">
                  <span className="font-mono font-bold text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider block">Team execution signals</span>
                  
                  <div className="space-y-1.5 text-[10px] text-[var(--sw-text-secondary)]">
                    <div className="flex justify-between">
                      <span>Overdue Team Tasks:</span>
                      <span className={`font-mono font-bold ${overdueTasks.length > 0 ? 'text-rose-700' : 'text-[var(--sw-text-secondary)]'}`}>
                        {overdueTasks.length} tasks
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unassigned Internal Work:</span>
                      <span className={`font-mono font-bold ${unassignedWork.length > 0 ? 'text-amber-700' : 'text-[var(--sw-text-secondary)]'}`}>
                        {unassignedWork.length} items
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner Mentions (Avoided/Escalated):</span>
                      <span className={`font-mono font-bold ${ownerMentions.length > 0 ? 'text-rose-700' : 'text-[var(--sw-text-secondary)]'}`}>
                        {ownerMentions.length} mentions
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stuck Marketing/Event/Office:</span>
                      <span className={`font-mono font-bold ${stuckFollowups.length > 0 ? 'text-amber-700 font-bold' : 'text-[var(--sw-text-secondary)]'}`}>
                        {stuckFollowups.length} stuck
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sync Status:</span>
                      <span className="font-mono text-emerald-700 font-bold">Connected</span>
                    </div>
                  </div>

                  {bcSignals.length > 0 && (
                    <div className="mt-2 space-y-1.5 max-h-[150px] overflow-y-auto">
                      {bcSignals.slice(0, 5).map((sig: any) => (
                        <div key={sig.id} className="p-2 bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-lg text-[9px] space-y-1 leading-normal text-left">
                          <div className="flex justify-between items-center font-mono">
                            <span className={`px-1.5 rounded uppercase font-bold text-[7px] ${
                              sig.signalType === 'owner_mentioned' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                              sig.signalType === 'todo_overdue' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                              'bg-stone-100 text-[var(--sw-text-secondary)] border border-stone-200'
                            }`}>
                              {sig.signalType.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[var(--sw-text-secondary)]">Active</span>
                          </div>
                          <p className="text-[10px] text-[var(--sw-text-primary)] font-medium leading-relaxed">{sig.summary}</p>
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
                <div className="border-t border-[var(--sw-border)] pt-3 space-y-3">
                  <span className="font-mono font-bold text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider block">Workspace &amp; Communications</span>
                  
                  <div className="space-y-1.5 text-[10px] text-[var(--sw-text-secondary)]">
                    {googleConn && (
                      <div className="flex justify-between items-center">
                        <span>Google Workspace:</span>
                        <span className="font-mono text-emerald-700 font-bold">Connected</span>
                      </div>
                    )}
                    {msConn && (
                      <div className="flex justify-between items-center">
                        <span>Microsoft 365:</span>
                        <span className="font-mono text-emerald-700 font-bold">Connected</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Synced Email Messages:</span>
                      <span className="font-mono text-[var(--sw-text-primary)] font-bold">{syncedEmailsCount} messages</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Synced Calendar Events:</span>
                      <span className="font-mono text-[var(--sw-text-primary)] font-bold">{syncedEventsCount} appointments</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Outbox Approvals:</span>
                      <span className={`font-mono font-bold ${pendingOutboxCount > 0 ? 'text-amber-700' : 'text-[var(--sw-text-secondary)]'}`}>
                        {pendingOutboxCount} drafts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Operation Bottlenecks summary */}
            <div className="border-t border-[var(--sw-border)] pt-3 divide-y divide-[var(--sw-border)] space-y-3">
              
              <div className="flex justify-between items-center pt-3 first:pt-0">
                <div className="space-y-0.5 text-left">
                  <span className="font-bold text-[var(--sw-text-primary)] text-xs">Compliance Risks</span>
                  <span className="block text-[9px] text-[var(--sw-text-secondary)]">Missing documents / checks</span>
                </div>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 font-mono font-bold rounded-lg shrink-0 text-[10px]">
                  {complianceRisks.length}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3">
                <div className="space-y-0.5 text-left">
                  <span className="font-bold text-[var(--sw-text-primary)] text-xs">Waiting on Agents</span>
                  <span className="block text-[9px] text-[var(--sw-text-secondary)]">Awaiting uploads / forms</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold rounded-lg shrink-0 text-[10px]">
                  {filesWaitingOnAgents.length}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3">
                <div className="space-y-0.5 text-left">
                  <span className="font-bold text-[var(--sw-text-primary)] text-xs">Marketing Bottlenecks</span>
                  <span className="block text-[9px] text-[var(--sw-text-secondary)]">Collaterals in design stage</span>
                </div>
                <span className="px-2 py-0.5 bg-[var(--sw-canvas)] text-[var(--sw-text-secondary)] border border-[var(--sw-border)] font-mono font-bold rounded-lg shrink-0 text-[10px]">
                  {marketingBottlenecks.length}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3">
                <div className="space-y-0.5 text-left">
                  <span className="font-bold text-[var(--sw-text-primary)] text-xs">Office / Signage issues</span>
                  <span className="block text-[9px] text-[var(--sw-text-secondary)]">Active facilities tickets</span>
                </div>
                <span className="px-2 py-0.5 bg-[var(--sw-canvas)] text-[var(--sw-text-secondary)] border border-[var(--sw-border)] font-mono font-bold rounded-lg shrink-0 text-[10px]">
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
