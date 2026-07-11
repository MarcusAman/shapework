import React from 'react';
import { 
  Sparkles, 
  ArrowRight,
  TrendingDown,
  ShieldAlert,
  Inbox,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

interface MorningBriefingProps {
  briefing: string;
  isGenerating: boolean;
  onGenerate: () => void;
  itemsNeedingAttentionCount: number;
  revenueAtRisk: number;
  decisionsCount: number;
  primaryActionText: string;
  onNavigateTab?: (tab: string) => void;
}

interface OperatingBriefCardProps {
  key?: React.Key;
  type: 'risk' | 'warning' | 'approval' | 'success' | 'info';
  label: string;
  value: string;
  description: string;
  action: string;
  onActionClick?: () => void;
}

function OperatingBriefCard({ type, label, value, description, action, onActionClick }: OperatingBriefCardProps) {
  return (
    <div className={`alert-card ${type} flex flex-col justify-between h-full`}>
      <div>
        <div className="alert-label">{label}</div>
        <div className="alert-value">{value}</div>
        <p className="alert-description">{description}</p>
      </div>
      <button 
        onClick={onActionClick}
        className="mt-4 text-[11px] font-bold text-[var(--sw-green-700)] hover:text-[var(--sw-green-900)] hover:underline flex items-center gap-1 cursor-pointer w-fit"
      >
        <span>{action}</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function MorningBriefing({
  briefing,
  isGenerating,
  onGenerate,
  itemsNeedingAttentionCount,
  revenueAtRisk,
  decisionsCount,
  primaryActionText,
  onNavigateTab
}: MorningBriefingProps) {

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  // Helper to clean up markdown and parse into structured alert cards
  const getParsedAlerts = () => {
    if (!briefing) return [];
    const lines = briefing.split('\n');
    const alerts: Omit<OperatingBriefCardProps, 'onActionClick'>[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('**Active') || trimmed.startsWith('**Priority')) continue;

      if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        const cleanText = trimmed
          .replace(/^[\*\-•]\s*/, '')
          .replace(/\*\*/g, '')
          .trim();

        // Categorize based on keywords
        if (cleanText.toLowerCase().includes('critical') || cleanText.toLowerCase().includes('crack') || cleanText.toLowerCase().includes('exception')) {
          alerts.push({
            type: 'risk',
            label: 'Revenue at Risk',
            value: 'Critical Exception',
            description: cleanText.length > 70 ? cleanText.substring(0, 68) + '...' : cleanText,
            action: 'Review exception'
          });
        } else if (cleanText.toLowerCase().includes('decision') || cleanText.toLowerCase().includes('lender') || cleanText.toLowerCase().includes('approval')) {
          alerts.push({
            type: 'approval',
            label: 'Pending Decision',
            value: 'Approval Required',
            description: cleanText.length > 70 ? cleanText.substring(0, 68) + '...' : cleanText,
            action: 'Review approvals'
          });
        } else {
          alerts.push({
            type: 'warning',
            label: 'Needs Attention',
            value: 'Workflow Nudge',
            description: cleanText.length > 70 ? cleanText.substring(0, 68) + '...' : cleanText,
            action: 'Open work queue'
          });
        }
      }
    }

    return alerts.slice(0, 3); // Max 3 cards
  };

  const parsedAlerts = getParsedAlerts();

  // If no alerts could be parsed, show default premium cards
  const displayAlerts = parsedAlerts.length > 0 ? parsedAlerts : [
    {
      type: 'risk' as const,
      label: 'Revenue at Risk',
      value: formatCurrency(revenueAtRisk || 43400),
      description: 'Five active escrows need review.',
      action: 'Review transactions'
    },
    {
      type: 'warning' as const,
      label: 'Needs Attention',
      value: `${itemsNeedingAttentionCount || 11} files`,
      description: 'Action thresholds exceeded.',
      action: 'Open work queue'
    },
    {
      type: 'approval' as const,
      label: 'Pending Decisions',
      value: `${decisionsCount || 3} items`,
      description: 'Brokerage approval needed.',
      action: 'Review approvals'
    }
  ];

  return (
    <div className="space-y-8 text-left font-sans animate-fade-in pb-4">
      
      {/* 1. Today's Summary & Status */}
      <div className="sw-card p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--sw-border)] pb-4 select-none">
          <div>
            <h2 className="text-base font-bold text-[var(--sw-text)]">Situation Report</h2>
          </div>
          <button 
            onClick={onGenerate}
            disabled={isGenerating}
            className="sw-btn sw-btn-secondary text-[11px] py-1.5 px-3"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Refreshing...' : 'Refresh Logs'}</span>
          </button>
        </div>

        {/* Telemetry Summary grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 select-none">
          <div 
            onClick={() => onNavigateTab && onNavigateTab('Transactions')}
            data-testid="telemetry-revenue-at-risk"
            className="p-3 bg-[var(--sw-card)] border border-[var(--sw-border)] hover:border-[var(--sw-risk)] transition-colors rounded-xl cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-[var(--sw-muted)] block">Revenue at Risk</span>
            <strong className="text-lg font-bold text-[var(--sw-risk)] block mt-1 font-mono">
              {formatCurrency(revenueAtRisk)}
            </strong>
          </div>
          <div 
            onClick={() => onNavigateTab && onNavigateTab('Work Queue')}
            data-testid="telemetry-needs-attention"
            className="p-3 bg-[var(--sw-card)] border border-[var(--sw-border)] hover:border-[var(--sw-text)] transition-colors rounded-xl cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-[var(--sw-muted)] block">Needs Attention</span>
            <strong className="text-lg font-bold text-[var(--sw-text)] block mt-1 font-mono">
              {itemsNeedingAttentionCount} Files
            </strong>
          </div>
          <div 
            onClick={() => onNavigateTab && onNavigateTab('Approvals')}
            data-testid="telemetry-pending-decisions"
            className="p-3 bg-[var(--sw-card)] border border-[var(--sw-border)] hover:border-[var(--sw-warning)] transition-colors rounded-xl cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-[var(--sw-muted)] block">Pending Decisions</span>
            <strong className="text-lg font-bold text-[var(--sw-warning)] block mt-1 font-mono">
              {decisionsCount} Items
            </strong>
          </div>
          <div className="p-3 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl">
            <span className="text-[10px] uppercase font-bold text-[var(--sw-muted)] block">Interruptions Avoided</span>
            <strong className="text-lg font-bold text-[var(--sw-success)] block mt-1 font-mono flex items-center gap-1">
              184 <TrendingDown className="w-3.5 h-3.5 text-[var(--sw-success)]" />
            </strong>
          </div>
        </div>

        {/* Primary recommendation alert line */}
        <div className="flex items-center gap-2.5 text-xs py-2 px-3 bg-[var(--sw-mint-100)] border-l-4 border-[var(--sw-green-700)] text-[var(--sw-green-900)] rounded-r-xl select-none font-medium">
          <span className="animate-pulse text-xs shrink-0">▲</span>
          <span><strong>Recommended:</strong> {primaryActionText.replace(/\*\*/g, '')}</span>
        </div>
      </div>

      {/* 2. Structured Operating Brief section (replacing black box) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[var(--sw-text)] uppercase tracking-wider select-none">
          Operating Brief
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayAlerts.map((alertItem, idx) => (
            <OperatingBriefCard
              key={idx}
              type={alertItem.type as any}
              label={alertItem.label}
              value={alertItem.value}
              description={alertItem.description}
              action={alertItem.action}
              onActionClick={() => {
                if (onNavigateTab) {
                  if (alertItem.action.includes('transaction')) {
                    onNavigateTab('Transactions');
                  } else if (alertItem.action.includes('approval')) {
                    onNavigateTab('Approvals');
                  } else {
                    onNavigateTab('Work Queue');
                  }
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
