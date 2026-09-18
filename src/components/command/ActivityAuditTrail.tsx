import React, { useState } from 'react';
import { History, RotateCcw, Filter, CheckCircle2, Search, Activity, Shield } from 'lucide-react';
import { AuditEvent } from '../../types/shapework';
import { safeLower, safeDate } from '../../utils/string';
import SurfaceCard from '../ui/SurfaceCard';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import TextInput from '../ui/TextInput';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';

interface ActivityAuditTrailProps {
  auditLogs: AuditEvent[];
  onRollback?: (logId: string) => void;
}

export default function ActivityAuditTrail({
  auditLogs = [],
  onRollback
}: ActivityAuditTrailProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [selectedActor, setSelectedActor] = useState<string>('all');
  const [rollbackSuccessMsg, setRollbackSuccessMsg] = useState<string | null>(null);
  
  // Filter options
  const uniqueSystems = Array.from(new Set((auditLogs || []).map(l => l?.system || 'shapework')));
  const uniqueActors = Array.from(new Set((auditLogs || []).map(l => l?.actor || l?.user_name || 'System')));

  const query = safeLower(searchTerm);

  // Filter logs list
  const filteredLogs = (auditLogs || []).filter(log => {
    if (!log) return false;
    const searchable = [
      log.action,
      log.action_description,
      log.actor,
      log.user_name,
      log.user_role,
      log.system,
      log.target_record,
      log.impact_area,
      log.metadata?.before_value,
      log.metadata?.after_value
    ]
      .map(safeLower)
      .join(" ");

    const matchesSearch = searchable.includes(query);
    
    const systemText = log.system || 'shapework';
    const actorText = log.actor || log.user_name || 'System';

    const matchesSystem = selectedSystem === 'all' || systemText === selectedSystem;
    const matchesActor = selectedActor === 'all' || actorText === selectedActor;
    
    return matchesSearch && matchesSystem && matchesActor;
  });

  // Sort logs safely by timestamp (newest first)
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateA = safeDate(a?.timestamp);
    const dateB = safeDate(b?.timestamp);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB.getTime() - dateA.getTime();
  });

  const handleExecuteRollback = (id: string, action: string) => {
    if (onRollback) {
      onRollback(id);
    }
    setRollbackSuccessMsg(`Successfully rolled back action: "${action}"`);
    setTimeout(() => setRollbackSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6 text-left font-sans text-slate-800">
      {/* Page Header Card */}
      <SurfaceCard className="p-6 space-y-5 bg-white border border-slate-200 shadow-sm rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E6F4F1] flex items-center justify-center text-[#00635C] shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#01362D] tracking-tight">Brokerage Activity & Audit Log</h2>
                <Badge variant="neutral">{sortedLogs.length} Events Recorded</Badge>
              </div>
              <p className="text-xs text-[#52605B] mt-0.5 font-medium">Immutable audit trail of recommendations, approvals, system events, and agent actions.</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-slate-200/80 items-center">
          {/* Search Bar */}
          <div className="md:col-span-2">
            <TextInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit actions, properties, or actors..."
              icon={<Search className="w-4 h-4 text-slate-400" />}
              fullWidth
            />
          </div>

          {/* System Dropdown */}
          <div>
            <Select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              options={[
                { value: 'all', label: 'All Systems' },
                ...uniqueSystems.map(sys => ({ value: sys, label: sys }))
              ]}
              fullWidth
            />
          </div>

          {/* Actor Dropdown */}
          <div>
            <Select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              options={[
                { value: 'all', label: 'All Actors' },
                ...uniqueActors.map(actor => ({ value: actor, label: actor }))
              ]}
              fullWidth
            />
          </div>
        </div>
      </SurfaceCard>

      {/* Success Notification Banner */}
      {rollbackSuccessMsg && (
        <div className="p-4 bg-[#E6F4F1] text-[#00635C] rounded-2xl border border-[#00635C]/20 flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{rollbackSuccessMsg}</span>
        </div>
      )}

      {/* Audit Events Chronology */}
      <div className="space-y-3">
        {auditLogs.length === 0 ? (
          <SurfaceCard className="p-8 bg-white border border-slate-200 rounded-3xl">
            <EmptyState
              icon={History}
              title="No audit events recorded"
              description="As Shapework processes work items, approvals, and system events, audit logs will be rendered here."
            />
          </SurfaceCard>
        ) : sortedLogs.length === 0 ? (
          <SurfaceCard className="p-8 bg-white border border-slate-200 rounded-3xl">
            <EmptyState
              icon={Search}
              title="No matching audit records"
              description="Try adjusting your search terms or filter selection."
            />
          </SurfaceCard>
        ) : (
          sortedLogs.map((log) => {
            const actorName = log.actor || log.user_name || 'System';
            const actionText = log.action || log.action_description || 'Operation Logged';
            const isAI = actorName === 'AI Operator' || actorName === 'shapework' || safeLower(actorName).includes('agent');

            return (
              <SurfaceCard 
                key={log.id} 
                className="p-5 bg-white border border-slate-200/90 hover:border-[#00635C]/30 transition-all rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Details Column */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant={isAI ? "ai" : "neutral"}>
                      {isAI ? 'AI Agent' : actorName}
                    </Badge>
                    <span className="text-[11px] text-[#52605B] font-mono font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-[#8CA08E] font-mono">
                      via {log.system || 'shapework'}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-[#17231F] leading-snug">
                    {actionText}
                  </h3>

                  {/* Target Record Reference */}
                  {log.target_record && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#52605B] font-mono">
                      <span className="font-semibold text-[#8CA08E]">Target Record:</span>
                      <span className="font-bold text-[#17231F] bg-slate-100 px-2 py-0.5 rounded-md">{log.target_record}</span>
                    </div>
                  )}

                  {/* State Diff Details */}
                  {(log.metadata?.before_value || log.metadata?.after_value) && (
                    <div className="grid grid-cols-2 gap-3 max-w-md p-3 rounded-2xl border border-slate-200 bg-[#F7F8F5] text-[11px] font-mono mt-2">
                      <div className="p-2 bg-[#FDEDEC] rounded-xl border border-[#C0392B]/10">
                        <span className="text-[#C0392B] block font-bold uppercase tracking-wider text-[9px] mb-0.5">Previous State</span>
                        <span className="text-[#C0392B] font-medium line-through break-all">{log.metadata.before_value}</span>
                      </div>
                      <div className="p-2 bg-[#E6F4F1] rounded-xl border border-[#00635C]/10">
                        <span className="text-[#00635C] block font-bold uppercase tracking-wider text-[9px] mb-0.5">Current State</span>
                        <span className="text-[#00635C] font-bold break-all">{log.metadata.after_value}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Action Column */}
                <div className="flex items-center gap-2 shrink-0">
                  {isAI && onRollback && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                      onClick={() => handleExecuteRollback(log.id, actionText)}
                    >
                      Rollback
                    </Button>
                  )}
                </div>
              </SurfaceCard>
            );
          })
        )}
      </div>
    </div>
  );
}
