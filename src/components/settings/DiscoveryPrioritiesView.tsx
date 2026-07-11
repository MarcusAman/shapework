import React from 'react';
import { nestDiscoveryProblems } from '../../data/nestDiscoveryProblems';
import { DiscoveryProblem } from '../../types/shapework';
import { BarChart2, RefreshCw } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

interface DiscoveryPrioritiesViewProps {
  state?: any;
}

export default function DiscoveryPrioritiesView({ state }: DiscoveryPrioritiesViewProps = {}) {
  const isProd = state?.appMode === 'production';
  const [opportunities, setOpportunities] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(isProd);

  React.useEffect(() => {
    if (isProd) {
      const fetchOpps = async () => {
        try {
          const res = await fetch('/api/operating-record', {
            headers: {
              'x-workspace-id': state?.workspaceId || 'active-brokerage',
              'Authorization': `Bearer ${localStorage.getItem('shapework_session_token') || 'owner@prod.co'}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setOpportunities(data.opportunities || []);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchOpps();
    }
  }, [isProd, state?.workspaceId]);

  // Helper to resolve build status for each module/problem
  const getBuildStatus = (problemId: string, module: string): { text: string; color: string } => {
    switch (problemId) {
      // Request Desk MVP
      case 'prob_5':
      case 'prob_6':
      case 'prob_8':
        return { text: 'MVP ready', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      
      // Owner Shield MVP
      case 'prob_7':
      case 'prob_9':
      case 'prob_10':
        return { text: 'MVP ready', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

      // Deal Intake Guard MVP
      case 'prob_1':
      case 'prob_4':
        return { text: 'MVP ready', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

      // Closing Compliance Guard MVP
      case 'prob_2':
      case 'prob_3':
        return { text: 'MVP ready', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

      // Listing / Onboarding / Sign Inventory
      case 'prob_12':
      case 'prob_13':
      case 'prob_14':
      case 'prob_15':
        return { text: 'Demo ready', color: 'bg-blue-50 text-blue-700 border-blue-200' };

      // Google Review Request
      case 'prob_16':
        return { text: 'Designed', color: 'bg-stone-50 text-stone-600 border-stone-200' };

      // Spreadsheets / Analytics
      default:
        return { text: 'Designed', color: 'bg-stone-50 text-stone-600 border-stone-200' };
    }
  };

  // Scoring weights and mappings
  const getImpactScore = (impact: 'none' | 'low' | 'medium' | 'high' | 'very_high'): number => {
    switch (impact) {
      case 'none': return 0;
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'very_high': return 4;
    }
  };

  const getFrequencyScore = (freq: DiscoveryProblem['frequency']): number => {
    switch (freq) {
      case 'daily': return 4;
      case 'weekly': return 3;
      case 'per_transaction': return 3;
      case 'per_listing': return 3;
      case 'monthly': return 2;
      case 'per_agent': return 2;
    }
  };

  const calculateScore = (prob: DiscoveryProblem) => {
    const owner = getImpactScore(prob.ownerImpact);
    const rev = getImpactScore(prob.revenueImpact);
    const comp = getImpactScore(prob.complianceImpact);
    const freq = getFrequencyScore(prob.frequency);
    
    // Priority Score formula
    const score = (owner * 2) + rev + comp + freq;
    return {
      total: score,
      breakdown: `(${owner} × 2 Owner) + ${rev} Rev + ${comp} Comp + ${freq} Freq = ${score}`
    };
  };

  // Sort by highest priority score
  const prioritizedProblems = isProd
    ? opportunities.map((opp, idx) => ({
        id: opp.id,
        title: opp.title,
        workflow: opp.area || 'Operations',
        score: opp.priorityScore || 8,
        currentState: opp.currentState || 'Manual tracing',
        desiredState: opp.desiredState || 'Automated tracking',
        severity: opp.severity || 'medium',
        productModule: opp.moduleName || 'Work Queue',
        statusText: opp.status || 'Planned',
        statusColor: 'bg-stone-50 text-stone-600 border-stone-200'
      }))
    : nestDiscoveryProblems.map(prob => {
        const scoreInfo = calculateScore(prob);
        const statusInfo = getBuildStatus(prob.id, prob.productModule);
        return {
          ...prob,
          score: scoreInfo.total,
          breakdown: scoreInfo.breakdown,
          statusText: statusInfo.text,
          statusColor: statusInfo.color
        };
      }).sort((a, b) => b.score - a.score);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-xs text-text-tertiary select-none">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-primary mb-2" />
        <span>Loading operational priorities ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in pb-10 select-text">
      
      {/* Overview Block */}
      <div className="bg-brand-soft/20 border border-brand-primary/10 rounded-2xl p-5 select-none">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-brand-primary" />
          <h2 className="text-sm font-bold text-brand-primary uppercase tracking-wider">
            {isProd ? 'Operational Priorities' : 'Discovery Backlog & Priorities Matrix'}
          </h2>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed font-medium mt-1 max-w-3xl">
          {isProd 
            ? 'This ledger ranks operational friction areas and integration gaps, sorted by impact and frequency score.'
            : 'This backlog ranks the 16 operational problems uncovered in the Nest Realty discovery session, sorted by Priority Score.'
          }
        </p>
      </div>

      {prioritizedProblems.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No operational gaps logged yet"
          description="Log operational friction areas, bottlenecks, or tools integration gaps to prioritize and track resolution progress."
          primaryAction={{
            label: "Log Operational Gap",
            onClick: () => alert('Log Operational Gap form wizard triggered.')
          }}
        />
      ) : (
        /* Roster Grid */
        <div className="bg-surface border border-border-soft rounded-2xl overflow-hidden shadow-card">
          <div className="h-12 border-b border-border-soft px-4 flex items-center bg-surface-muted justify-between select-none">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              {isProd ? 'Logged Gaps & Vulnerabilities' : 'Prioritized Issues'}
            </span>
            <span className="text-[10px] text-text-tertiary">Sorted by score</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 text-text-tertiary border-b border-border-soft/60 font-mono text-[9px] uppercase select-none">
                  <th className="p-3">Rank & Problem</th>
                  <th className="p-3">Workflow Area</th>
                  <th className="p-3 text-center font-mono">Score</th>
                  <th className="p-3">Build Status</th>
                  <th className="p-3">Current State</th>
                  <th className="p-3">Desired State</th>
                  <th className="p-3">Product Module</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft/60 font-medium">
                {prioritizedProblems.map((prob, idx) => {
                  return (
                    <tr key={prob.id} className="hover:bg-stone-50/40">
                      <td className="p-3 max-w-[180px]">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-brand-primary bg-brand-soft px-1.5 py-0.2 rounded font-bold shrink-0 select-none">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-text-primary block leading-snug">{prob.title}</span>
                            <span className="text-[9px] text-text-tertiary block mt-0.5 capitalize select-none">
                              Severity: <strong className="text-risk-red">{prob.severity}</strong>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-text-secondary capitalize whitespace-nowrap">
                        {prob.workflow.replace('_', ' ')}
                      </td>
                      <td className="p-3 text-center select-none">
                        <span className="text-xs font-bold text-brand-primary bg-brand-soft px-2 py-0.5 rounded">
                          {prob.score}
                        </span>
                      </td>
                      <td className="p-3 select-none">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${prob.statusColor}`}>
                          {prob.statusText}
                        </span>
                      </td>
                      <td className="p-3 text-text-secondary leading-normal max-w-[200px]">
                        {prob.currentState}
                      </td>
                      <td className="p-3 text-text-secondary leading-normal max-w-[200px]">
                        {prob.desiredState}
                      </td>
                      <td className="p-3 max-w-[180px] text-text-primary font-bold">
                        {prob.productModule}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
