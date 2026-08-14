/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Operating Record Page — Phase C Light-Mode Redesign
 * Refactored to canonical Shapework B1/B2/B3 design primitives.
 */

import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Shield, 
  Brain, 
  Zap, 
  FolderOpen, 
  ArrowRight, 
  Layers, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  AlertCircle, 
  HelpCircle, 
  Activity,
  Users,
  Compass,
  Play,
  Briefcase,
  TrendingUp,
  X,
  Building as BuildingIcon
} from 'lucide-react';
import {
  Card,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  MetricTile,
  MetricGroup,
  SegmentedControl,
  Modal
} from '../ui';

type OperatingRecordTab = 'overview' | 'operation-map';

interface FrictionPoint {
  title: string;
  description: string;
  severity: 'friction' | 'breakdown';
}

interface WorkflowMap {
  id: string;
  label: string;
  title: string;
  theme: string;
  steps: string[];
  frictionPoints: FrictionPoint[];
  linkedOpportunities: string[];
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedAnnualSavings?: string;
  tags: string[];
}

interface OpportunityGroup {
  category: string;
  description: string;
  savings: string;
  opportunities: Opportunity[];
}

export default function OperatingRecordPage() {
  const [activeTab, setActiveTab] = useState<OperatingRecordTab>('overview');
  const [expandedWorkflows, setExpandedWorkflows] = useState<Record<string, boolean>>({
    'wf-1': false,
    'wf-2': false,
    'wf-3': false,
    'wf-4': false,
  });
  
  const [activeSprintOpp, setActiveSprintOpp] = useState<Opportunity | null>(null);
  const [isSprintCreated, setIsSprintCreated] = useState<boolean>(false);

  const toggleWorkflow = (id: string) => {
    setExpandedWorkflows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const triggerSprintModal = (opp: Opportunity) => {
    setActiveSprintOpp(opp);
    setIsSprintCreated(false);
  };

  const handleCreateSprint = () => {
    setIsSprintCreated(true);
    setTimeout(() => {
      setActiveSprintOpp(null);
      setIsSprintCreated(false);
      alert(`Shape sprint initiated for "${activeSprintOpp?.title}".`);
    }, 1200);
  };

  const metaChips = [
    { label: 'Client', value: 'Nest Realty' },
    { label: 'Location', value: 'Wilmington, NC' },
    { label: 'Status', value: 'Map & Shape complete' },
    { label: 'Updated', value: 'June 19, 2026' },
  ];

  const businessZones = [
    { name: 'Owner freedom', description: 'Work routing off the owner’s plate.', opportunities: 3, savings: '$86,250', status: 'Ready to build' },
    { name: 'Transaction & compliance', description: 'Faster closings, faster pay.', opportunities: 4, savings: '$49,900', status: 'Ready to build' },
    { name: 'Team & people', description: 'Support desk, training, retention.', opportunities: 4, savings: '$25,875', status: 'Planning wins' },
    { name: 'Marketing & growth', description: 'Reviews, intake, listing launch.', opportunities: 5, savings: '$19,250', status: 'Planning wins' },
    { name: 'Finance & visibility', description: 'Dashboards, cash flow, leakage.', opportunities: 2, savings: '$22,500', status: 'Identified' },
    { name: 'Office & operations', description: 'Signs, vendors, readiness.', opportunities: 3, savings: '$16,025', status: 'Identified' }
  ];

  const workflows: WorkflowMap[] = [
    {
      id: 'wf-1',
      label: 'Map 01',
      title: 'Transaction Flow',
      theme: 'How a deal moves from contract to close — and where it stalls or costs more than it should.',
      steps: ['Agent gets contract', 'New contract form', 'DotLoop file opened', 'Compliance chase', 'Coast to Close', 'Closing + payment'],
      frictionPoints: [
        { title: 'New contract form routinely skipped', description: 'Agents do not file when a deal comes in, making incoming pipeline invisible.', severity: 'friction' },
        { title: 'Compliance chase near closing', description: 'Documents get collected too late, forcing manual fire drills.', severity: 'breakdown' }
      ],
      linkedOpportunities: ['Transaction Intake Guard', 'Closing Compliance Guard', 'Avoidable Work & TC Spend Tracker']
    },
    {
      id: 'wf-2',
      label: 'Map 02',
      title: 'Agent Support & Requests',
      theme: 'How agents ask for help, marketing assets, and administrative answers.',
      steps: ['Agent has question', 'Sends group text', 'Admin triages', 'Clarification back-and-forth', 'Work completed'],
      frictionPoints: [
        { title: 'Agents group-text Ryan directly', description: 'Ryan gets pulled into minor, low-value requests.', severity: 'breakdown' }
      ],
      linkedOpportunities: ['Agent Support Desk / SOP Bot', 'Marketing Request Intake']
    }
  ];

  const opportunityGroups: OpportunityGroup[] = [
    {
      category: 'Owner freedom',
      description: 'Systematize operational routing and reduce direct interruptions to the principal.',
      savings: '$86,250',
      opportunities: [
        { id: 'opp-1', title: 'Role & Escalation Map', description: 'Interactive decision map clarifying who owns what.', tags: ['Quick win', 'Policy & Process'] },
        { id: 'opp-2', title: 'Ryan Shield', description: 'Operational shield protecting the owner from low-level operational noise.', tags: ['AI / automation', 'Your time'] }
      ]
    }
  ];

  return (
    <div className="space-y-6 text-left select-none">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="brand" icon={<Layers className="w-3.5 h-3.5" />}>
              Shapework Operating Record
            </Badge>
            {metaChips.map((chip, idx) => (
              <span key={idx} className="text-xs text-[var(--sw-text-secondary)] font-medium">
                {chip.label}: <strong className="text-[var(--sw-text-primary)]">{chip.value}</strong> •
              </span>
            ))}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--sw-text-primary)]">
            Operating Record & System Map
          </h1>
          <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5 max-w-3xl leading-relaxed">
            Mapped workflows, identified operational friction, and prioritized system sprints for Nest Realty Wilmington.
          </p>
        </div>

        <SegmentedControl
          value={activeTab}
          onChange={(v) => setActiveTab(v as any)}
          options={[
            { id: 'overview', label: 'Overview' },
            { id: 'operation-map', label: 'Operation Map' }
          ]}
        />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <MetricGroup columns={3}>
            <MetricTile label="Total Annual Savings" value="$219,800" sublabel="Identified operational efficiency gain" variant="success" />
            <MetricTile label="Mapped Workflows" value="4 Maps" sublabel="Transaction, Support, Day, People" variant="brand" />
            <MetricTile label="Active Sprints" value="2 Ready" sublabel="Role Map & Ryan Shield" variant="warning" />
          </MetricGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businessZones.map((zone, idx) => (
              <Card key={idx} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--sw-text-primary)]">{zone.name}</h3>
                  <StatusBadge status={zone.status === 'Ready to build' ? 'healthy' : 'active'} size="sm" />
                </div>
                <p className="text-xs text-[var(--sw-text-secondary)]">{zone.description}</p>
                <div className="pt-2 border-t border-[var(--sw-border)] flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--sw-text-secondary)]">{zone.opportunities} Opportunities</span>
                  <span className="font-bold text-[var(--brand-primary)]">{zone.savings}/yr</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Operation Map Tab */}
      {activeTab === 'operation-map' && (
        <div className="space-y-6 animate-fade-in">
          {workflows.map((wf) => (
            <Card key={wf.id} className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--sw-border)] pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-secondary)] font-mono">{wf.label}</span>
                  <h3 className="text-base font-bold text-[var(--sw-text-primary)]">{wf.title}</h3>
                </div>
                <Button variant="secondary" size="sm" onClick={() => toggleWorkflow(wf.id)}>
                  {expandedWorkflows[wf.id] ? 'Collapse' : 'Expand Steps'}
                </Button>
              </div>

              <p className="text-xs text-[var(--sw-text-secondary)]">{wf.theme}</p>

              {expandedWorkflows[wf.id] && (
                <div className="p-3 bg-[var(--sw-canvas)] border border-[var(--sw-border)] rounded-[var(--radius-sm)] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[var(--sw-text-secondary)]">Workflow Steps</span>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {wf.steps.map((step, sIdx) => (
                      <span key={sIdx} className="px-2.5 py-1 bg-[var(--sw-surface)] border border-[var(--sw-border)] rounded-md font-medium text-[var(--sw-text-primary)]">
                        {sIdx + 1}. {step}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
