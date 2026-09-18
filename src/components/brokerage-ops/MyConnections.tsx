/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * My Connections & Tool Integrations Hub — Phase C Light-Mode Redesign
 * Refactored to canonical Shapework B1/B2/B3 design primitives.
 */

import React, { useState, useEffect } from 'react';
import { 
  Mail, Calendar, Users, Phone, FolderOpen, FileText, Zap, 
  MessageSquare, CheckCircle, AlertCircle, X, Shield, Eye, 
  EyeOff, HelpCircle, Lock, RefreshCw, ChevronRight, Check
} from 'lucide-react';
import ConnectorLogo from '../ui/ConnectorLogo';
import {
  Card,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  MetricTile,
  MetricGroup,
  Drawer,
  Modal
} from '../ui';

interface Integration {
  id: string;
  provider: string;
  status: 'connected' | 'stubbed' | 'planned' | 'none';
  description: string;
  priority: string;
  connectedAt?: string;
  lastSyncAt?: string;
  syncHealth?: string;
  notes?: string;
  supportedActions?: string[];
}

interface MyConnectionsProps {
  state: any;
}

export default function MyConnections({ state }: MyConnectionsProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConnector, setSelectedConnector] = useState<Integration | null>(null);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/ops/integrations', {
        headers: { 'x-workspace-id': state.workspaceId || 'nest-realty-demo' }
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch (e) {
      console.error('Failed to load integrations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleToggleConnection = async (integrationId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'connected' ? 'planned' : 'connected';
    try {
      const res = await fetch(`/api/ops/integrations/${integrationId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': state.workspaceId || 'nest-realty-demo'
        },
        body: JSON.stringify({
          status: nextStatus,
          actorEmail: state.activeProfile?.email || 'ann@nestrealty.com',
          actorName: state.activeProfile?.name || 'Ann Gunn'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(prev => prev.map(item => item.id === integrationId ? data.integration : item));
        if (selectedConnector?.id === integrationId) {
          setSelectedConnector(data.integration);
        }
      }
    } catch (err) {
      console.error('Failed to toggle connection:', err);
    }
  };

  return (
    <div className="space-y-6 text-left select-none animate-fadeIn bg-[#FAF9F6] p-6 rounded-3xl min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5 bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-50 text-[#00635C] border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              Shapework Tool Connections
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-900 mt-2">
            Integrations & Communication Channels
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-3xl leading-relaxed font-medium">
            Connect the email, calendar, transaction, and messaging tools your brokerage already uses to automate work routing.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <MetricGroup columns={3}>
        <MetricTile
          label="Active Connectors"
          value={`${integrations.filter(i => i.status === 'connected').length} Connected`}
          sublabel="Live API & Webhook integrations"
          variant="success"
          icon={<CheckCircle className="w-4 h-4" />}
        />
        <MetricTile
          label="Retell AI Inbound"
          value="Live Agent"
          sublabel="Voice & SMS auto-triage dispatch"
          variant="brand"
          icon={<Phone className="w-4 h-4" />}
        />
        <MetricTile
          label="Planned Tools"
          value={`${integrations.filter(i => i.status === 'planned' || i.status === 'stubbed').length} Ready`}
          sublabel="1-click OAuth activation"
          variant="default"
        />
      </MetricGroup>

      {/* Integrations Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#00635C]">Available Integrations</h3>

        {loading ? (
          <div className="p-8 text-center text-xs text-stone-500 font-medium bg-white rounded-2xl border border-stone-200/80">
            Loading tool connections...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((item) => (
              <Card key={item.id} className="p-5 space-y-4 flex flex-col justify-between bg-white border border-stone-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ConnectorLogo provider={item.provider || item.id} className="w-9 h-9 rounded-xl border border-stone-200/80 p-0.5 shadow-xs" />
                      <div>
                        <h4 className="font-bold text-sm text-stone-900">{item.provider}</h4>
                        <StatusBadge status={item.status === 'connected' ? 'healthy' : 'pending'} size="sm" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed font-medium">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedConnector(item)}>
                    Inspect Scope
                  </Button>
                  <Button
                    variant={item.status === 'connected' ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleConnection(item.id, item.status)}
                  >
                    {item.status === 'connected' ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedConnector && (
        <Drawer
          isOpen={!!selectedConnector}
          onClose={() => setSelectedConnector(null)}
          title={`Integration: ${selectedConnector.provider}`}
          subtitle="Authorized capabilities & security permissions"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setSelectedConnector(null)}>
              Close Scope
            </Button>
          }
        >
          <div className="space-y-4 text-xs font-medium">
            <Card className="p-5 bg-white border border-stone-200/80 rounded-2xl space-y-2 shadow-sm">
              <span className="font-bold text-stone-900 block text-sm">{selectedConnector.provider} Integration Scope</span>
              <p className="text-stone-600 leading-relaxed">{selectedConnector.description}</p>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-700">
                <span>Status: <strong className="text-[#00635C] font-bold">{selectedConnector.status}</strong></span>
                <span>Priority: <strong className="text-stone-900 font-bold">{selectedConnector.priority}</strong></span>
              </div>
            </Card>
          </div>
        </Drawer>
      )}
    </div>
  );
}

