import React from 'react';
import { 
  Zap, 
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
    <div 
      className="rounded-[24px] p-5 flex flex-col justify-between space-y-4 text-left transition-all hover:border-stone-300 bg-white border border-stone-200/80 shadow-sm hover:shadow-md"
    >
      <div className="space-y-2">
        <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{label}</div>
        <div className="font-serif text-lg font-black text-stone-900 tracking-tight">{value}</div>
        <p className="text-xs text-stone-600 leading-relaxed font-sans">{description}</p>
      </div>
      <button 
        onClick={onActionClick}
        className="mt-2 px-3.5 py-2 bg-[#00635C] hover:bg-[#007c73] text-white text-[11px] font-bold rounded-xl cursor-pointer w-fit flex items-center gap-1.5 transition-colors shadow-sm"
      >
        <span>{action}</span>
        <ArrowRight className="w-3.5 h-3.5 text-white/90" />
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
            label: 'Operational Action',
            value: 'Action Required',
            description: cleanText.length > 70 ? cleanText.substring(0, 68) + '...' : cleanText,
            action: 'View work queue'
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
      <div 
        className="rounded-[28px] p-6 space-y-6 text-left shadow-sm bg-white border border-stone-200/80"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4 select-none">
          <div>
            <h2 className="font-serif text-base font-black text-stone-900">Situation Report</h2>
          </div>
          <button 
            onClick={onGenerate}
            disabled={isGenerating}
            className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#007c73] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Zap className={`w-3.5 h-3.5 text-emerald-300 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Refreshing...' : 'Refresh Logs'}</span>
          </button>
        </div>

        {/* Telemetry Summary grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 select-none">
          <div 
            onClick={() => onNavigateTab && onNavigateTab('Transactions')}
            data-testid="telemetry-revenue-at-risk"
            className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 hover:border-emerald-500/40 transition-colors cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-stone-500 block font-sans tracking-wider">Revenue at Risk</span>
            <strong className="text-xl font-black text-stone-900 block mt-1 font-sans">
              {formatCurrency(revenueAtRisk)}
            </strong>
          </div>
          <div 
            onClick={() => onNavigateTab && onNavigateTab('Work Queue')}
            data-testid="telemetry-needs-attention"
            className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 hover:border-emerald-500/40 transition-colors cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-stone-500 block font-sans tracking-wider">Needs Attention</span>
            <strong className="text-xl font-black text-stone-900 block mt-1 font-sans">
              {itemsNeedingAttentionCount} Files
            </strong>
          </div>
          <div 
            onClick={() => onNavigateTab && onNavigateTab('Approvals')}
            data-testid="telemetry-pending-decisions"
            className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70 hover:border-emerald-500/40 transition-colors cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-stone-500 block font-sans tracking-wider">Pending Decisions</span>
            <strong className="text-xl font-black text-stone-900 block mt-1 font-sans">
              {decisionsCount} Items
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
            <span className="text-[10px] uppercase font-bold text-stone-500 block font-sans tracking-wider">Interruptions Avoided</span>
            <strong className="text-xl font-black text-stone-900 block mt-1 font-sans flex items-center gap-1">
              184 <TrendingDown className="w-4 h-4 text-emerald-600" />
            </strong>
          </div>
        </div>

        {/* Primary recommendation alert line */}
        <div className="flex items-center gap-2.5 text-xs py-3 px-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 select-none font-medium">
          <span className="animate-pulse text-xs text-emerald-700 shrink-0">▲</span>
          <span><strong className="text-emerald-900 font-bold">Recommended:</strong> {primaryActionText.replace(/\*\*/g, '')}</span>
        </div>
      </div>

      {/* 2. Structured Operating Brief section */}
      <div className="space-y-3">
        <h3 className="font-serif text-base font-black text-stone-900 px-1">
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
