/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { History, ShieldAlert, ArrowLeftRight, RotateCcw, Filter, CheckCircle2, AlertTriangle, Eye, Search } from 'lucide-react';
import { AuditEvent } from '../../types/shapework';
import { safeLower, safeText, safeDate } from '../../utils/string';
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
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-green-soft flex items-center justify-center text-brand-green">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary uppercase tracking-wider">Activity & Audit Logs</h2>
            <p className="text-xs text-text-secondary mt-0.5 font-medium">Every recommendation, approval, update, and automation recorded with evidence.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-border-subtle/50 items-center">
          {/* Keyword Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit actions, properties, or actors..."
              className="w-full pl-9 pr-4 py-2 border border-border-subtle bg-secondary-surface rounded-lg text-xs focus:outline-none focus:bg-surface focus:border-brand-green transition-all"
            />
          </div>

          {/* System Filter */}
          <div className="relative">
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle bg-secondary-surface rounded-lg text-xs focus:outline-none focus:border-brand-green appearance-none"
            >
              <option value="all">All Systems</option>
              {uniqueSystems.map(sys => (
                <option key={sys} value={sys}>{sys}</option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-text-tertiary absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Actor Filter */}
          <div className="relative">
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle bg-secondary-surface rounded-lg text-xs focus:outline-none focus:border-brand-green appearance-none"
            >
              <option value="all">All Actors</option>
              {uniqueActors.map(actor => (
                <option key={actor} value={actor}>{actor}</option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-text-tertiary absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {rollbackSuccessMsg && (
        <div className="p-4 bg-status-healthy-soft text-status-healthy rounded-xl border border-status-healthy/10 flex items-center gap-2 text-xs font-semibold animate-pulse">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{rollbackSuccessMsg}</span>
        </div>
      )}

      {/* Audit Log Chronology list */}
      <div className="space-y-4">
        {auditLogs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit events yet"
            description="As shapework. creates work items, requests approvals, updates records, and generates briefs, the timeline will appear here."
          />
        ) : sortedLogs.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching audit trace records found"
            description="Try adjusting your keyword filter or switching selected systems/actors."
          />
        ) : (
          sortedLogs.map((log) => {
            const actorName = log.actor || log.user_name || 'System';
            const actionText = log.action || log.action_description || 'Operation Logged';
            const isAI = actorName === 'AI Operator' || actorName === 'shapework' || safeLower(actorName).includes('agent');
            return (
              <div 
                key={log.id} 
                className="bg-surface border border-border-subtle rounded-2xl p-4 shadow-sm hover:border-strong-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Details left pane */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      isAI 
                        ? 'bg-brand-green-soft text-brand-green border border-brand-green/10' 
                        : 'bg-secondary-surface text-text-secondary border border-border-subtle'
                    }`}>
                      {actorName}
                    </span>
                    <span className="text-[10px] text-text-tertiary font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="text-text-tertiary font-medium font-mono">
                      in {log.system || 'shapework'}
                    </span>
                  </div>

                  <h3 className="font-semibold text-xs text-text-primary">
                    {actionText}
                  </h3>

                  {/* Target record metadata if exists */}
                  {log.target_record && (
                    <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-mono leading-none">
                      <span className="font-bold text-text-tertiary">Target Record:</span>
                      <span className="font-semibold">{log.target_record}</span>
                    </div>
                  )}

                  {/* Before / After metadata details */}
                  {(log.metadata?.before_value || log.metadata?.after_value) && (
                    <div className="grid grid-cols-2 gap-4 max-w-lg p-2.5 rounded-lg border border-border-subtle/50 bg-secondary-surface/40 text-[10px] font-mono mt-2">
                      <div>
                        <span className="text-text-tertiary block font-bold uppercase tracking-wider text-[8px] mb-0.5">Previous state</span>
                        <span className="text-status-danger font-medium line-through">{log.metadata.before_value}</span>
                      </div>
                      <div>
                        <span className="text-brand-green block font-bold uppercase tracking-wider text-[8px] mb-0.5">Current state</span>
                        <span className="text-brand-green font-bold">{log.metadata.after_value}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Audit actions right pane */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Rollback capability button */}
                  {isAI && (
                    <button
                      onClick={() => handleExecuteRollback(log.id, actionText)}
                      className="flex items-center gap-1 border border-border-subtle bg-surface hover:bg-secondary-surface text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      title="Undo this action and restore previous status values"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rollback</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
