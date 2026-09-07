/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Layers, 
  UserCheck, 
  ArrowRight,
  Database,
  Info
} from 'lucide-react';

interface RechatLaunchSetupPanelProps {
  workspaceId: string;
  onConfigChanged?: () => void;
}

export default function RechatLaunchSetupPanel({ 
  workspaceId, 
  onConfigChanged 
}: RechatLaunchSetupPanelProps) {
  const [status, setStatus] = useState<any>({ connected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [writebackMode, setWritebackMode] = useState<'disabled' | 'approval_gated'>('approval_gated');

  // Simulated Rechat Users list for mapping
  const [rechatUsers, setRechatUsers] = useState([
    { id: 'ru_1', name: 'Diane Ross', email: 'diane.ross@nestrealty.com', mappedRole: 'transaction_coordinator' },
    { id: 'ru_2', name: 'Jessica Keenan', email: 'jessica.keenan@nestrealty.com', mappedRole: 'compliance_lead' },
    { id: 'ru_3', name: 'John Broker', email: 'owner@nestrealty.com', mappedRole: 'owner' },
    { id: 'ru_4', name: 'Ann', email: 'ann@nestrealty.com', mappedRole: 'admin' },
    { id: 'ru_5', name: 'Melissa Gagliardi', email: 'melissa.gagliardi@nestrealty.com', mappedRole: 'admin' },
    { id: 'ru_6', name: 'James Fort', email: 'james.fort@nestrealty.com', mappedRole: 'admin' },
    { id: 'ru_7', name: 'Ryan', email: 'ryan@nestrealty.com', mappedRole: 'admin' }
  ]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/integrations/rechat/status?workspaceId=${workspaceId}`);
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [workspaceId]);

  const handleConnect = () => {
    // Start standard OAuth flow
    window.location.href = `/api/integrations/rechat/oauth/start?workspaceId=${workspaceId}`;
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/integrations/rechat/sync?workspaceId=${workspaceId}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(data.summary);
        if (onConfigChanged) onConfigChanged();
      } else {
        alert('Sync failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('Error triggering baseline sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Rechat? Active sync tasks will halt.')) return;
    try {
      const res = await fetch(`/api/integrations/rechat/disconnect?workspaceId=${workspaceId}`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchStatus();
        setSyncResult(null);
        if (onConfigChanged) onConfigChanged();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleMapChange = (userId: string, role: string) => {
    setRechatUsers(prev => prev.map(u => u.id === userId ? { ...u, mappedRole: role } : u));
    if (onConfigChanged) onConfigChanged();
  };

  if (isLoading) {
    return <div className="text-xs text-text-tertiary">Loading Rechat configuration...</div>;
  }

  return (
    <div className="space-y-6 font-sans text-xs text-text-secondary leading-normal text-left">
      
      {/* Connection Card */}
      <div className="border border-border-soft rounded-2xl p-5 bg-white shadow-sm flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-primary" />
            <h4 className="font-bold text-text-primary text-sm">Rechat CRM Integration</h4>
          </div>
          <p className="text-text-tertiary max-w-md">
            Authorize shapework to read deal files, synchronize contacts, and writeback approved task checklists into Rechat.
          </p>

          <div className="flex items-center gap-2 mt-2">
            {status.connected ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[10px]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Connected (Brand: {status.brandId || 'Nest Realty'})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium text-[10px]">
                <XCircle className="w-3.5 h-3.5" />
                <span>Not Connected</span>
              </span>
            )}
          </div>
        </div>

        <div>
          {status.connected ? (
            <button 
              onClick={handleDisconnect}
              className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold cursor-pointer transition-all"
            >
              Disconnect
            </button>
          ) : (
            <button 
              onClick={handleConnect}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl font-bold cursor-pointer transition-all"
            >
              Connect via OAuth 2.0
            </button>
          )}
        </div>
      </div>

      {status.connected && (
        <>
          {/* Baseline sync */}
          <div className="border border-border-soft rounded-2xl p-5 bg-stone-50/50 space-y-4">
            <h5 className="font-bold text-text-primary flex items-center gap-1.5">
              <Database className="w-4 h-4 text-brand-primary" />
              <span>Baseline Synchronization</span>
            </h5>
            <p className="text-text-tertiary">
              Run a baseline import sync to ingest active escrow lines, agent files, and contact listings.
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-white hover:bg-stone-50 border border-border-soft rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all text-text-primary shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Trigger Sync Now</span>
              </button>

              {syncResult && (
                <div className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200/50 rounded-xl p-3 flex gap-2 flex-1">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <div>
                    <strong>Sync completed:</strong> Synced {syncResult.dealsSynced} deals, {syncResult.contactsSynced} contacts, and {syncResult.tasksSynced} tasks successfully.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Mapping */}
          <div className="border border-border-soft rounded-2xl p-5 bg-white space-y-4">
            <h5 className="font-bold text-text-primary flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-brand-primary" />
              <span>Roster Mapping</span>
            </h5>
            <p className="text-text-tertiary">
              Map authenticated Rechat users to role configurations within your shapework workspace.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-soft text-left text-xs font-mono">
                <thead>
                  <tr className="text-text-tertiary font-sans text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2.5">Rechat Staff Name</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Mapped shapework Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {rechatUsers.map(user => (
                    <tr key={user.id}>
                      <td className="py-3 font-sans font-bold text-text-primary">{user.name}</td>
                      <td className="py-3 text-text-tertiary">{user.email}</td>
                      <td className="py-3 select-none">
                        <select
                          value={user.mappedRole}
                          onChange={(e) => handleRoleMapChange(user.id, e.target.value)}
                          className="bg-white border border-border-soft rounded-lg px-2.5 py-1.5 font-sans focus:outline-none cursor-pointer"
                        >
                          <option value="owner">Owner</option>
                          <option value="operations_lead">Operations Lead</option>
                          <option value="transaction_coordinator">Transaction Coordinator</option>
                          <option value="compliance_partner">Compliance Partner</option>
                          <option value="agent">Agent</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Writeback Policy */}
          <div className="border border-border-soft rounded-2xl p-5 bg-stone-50/50 space-y-4">
            <h5 className="font-bold text-text-primary flex items-center gap-1.5">
              <Info className="w-4 h-4 text-brand-primary" />
              <span>Writeback Approval Gating Policy</span>
            </h5>
            <p className="text-text-tertiary">
              Gating prevents shapework from automatically modifying your Rechat account. Tasks created by the AI must go through approval.
            </p>

            <div className="flex gap-4 select-none">
              <label className="flex items-start gap-2.5 p-3 bg-white border border-border-soft hover:border-brand-primary rounded-xl cursor-pointer flex-1 transition-all">
                <input 
                  type="radio" 
                  name="writeback"
                  checked={writebackMode === 'approval_gated'}
                  onChange={() => {
                    setWritebackMode('approval_gated');
                    if (onConfigChanged) onConfigChanged();
                  }}
                  className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                />
                <div>
                  <span className="font-bold text-text-primary block">Approval Gated Writeback</span>
                  <span className="text-[10px] text-text-tertiary block mt-0.5">Tasks must be reviewed and approved in the Approval Center before pushing to Rechat.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 bg-white border border-border-soft hover:border-brand-primary rounded-xl cursor-pointer flex-1 transition-all">
                <input 
                  type="radio" 
                  name="writeback"
                  checked={writebackMode === 'disabled'}
                  onChange={() => {
                    setWritebackMode('disabled');
                    if (onConfigChanged) onConfigChanged();
                  }}
                  className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                />
                <div>
                  <span className="font-bold text-text-primary block">Read-Only Mode</span>
                  <span className="text-[10px] text-text-tertiary block mt-0.5">Disable all Rechat writebacks. shapework acts purely as an observation and analysis layer.</span>
                </div>
              </label>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
