/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building, 
  Users, 
  Sliders, 
  GitPullRequest, 
  FileText, 
  Database, 
  UploadCloud, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock
} from 'lucide-react';

interface CustomerLaunchWizardProps {
  onLaunchWorkspace: (workspaceConfig: any) => void;
}

export default function CustomerLaunchWizard({ onLaunchWorkspace }: CustomerLaunchWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Workspace Form State
  const [workspace, setWorkspace] = useState({
    name: '',
    timezone: 'America/New_York',
    location: '',
    ownerEmail: '',
    ownerName: '',
    launchMode: 'integration_first'
  });

  // Staff Roles State
  const [staff, setStaff] = useState({
    operationsLead: '',
    transactionCoordinator: '',
    compliancePartner: '',
    listingCoordinator: '',
    marketingCoordinator: ''
  });

  // Routing State
  const [routing, setRouting] = useState({
    defaultSlaMins: '60',
    escalationSlaMins: '120',
    requireApprovalForOutbound: true
  });

  const steps = [
    { num: 1, label: 'Workspace', icon: Building },
    { num: 2, label: 'Staff Roles', icon: Users },
    { num: 3, label: 'Workflows', icon: Sliders },
    { num: 4, label: 'Routing', icon: GitPullRequest },
    { num: 5, label: 'Compliance', icon: FileText },
    { num: 6, label: 'Integrations', icon: Database },
    { num: 7, label: 'Import', icon: UploadCloud },
    { num: 8, label: 'Review', icon: CheckCircle }
  ];

  const handleNext = () => {
    if (currentStep < 8) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleActivate = async () => {
    try {
      const config = {
        workspace,
        staff,
        routing,
        status: 'active'
      };
      
      const res = await fetch('/api/workspaces/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        alert('Workspace activated successfully! Database persisted.');
        onLaunchWorkspace(config);
      } else {
        alert('Failed to activate workspace.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error activating workspace.');
    }
  };

  return (
    <div className="bg-surface border border-border-soft rounded-3xl p-6 shadow-card space-y-6 max-w-4xl mx-auto text-left text-xs text-text-secondary leading-normal font-sans">
      
      {/* Step header progress */}
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-border-soft pb-4 select-none">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.num;
          const isDone = currentStep > step.num;
          return (
            <div 
              key={step.num} 
              className={`flex items-center gap-1.5 pb-1 ${
                isActive ? 'text-brand-primary border-b-2 border-brand-primary font-bold' : 
                isDone ? 'text-success font-semibold' : 'text-text-tertiary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Steps contents */}
      <div className="space-y-4 min-h-[260px]">
        
        {/* Step 1: Workspace basics */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">// Step 1 — Workspace Tenancy Configuration</h3>
              <p className="mt-1">Define primary brokerage details and owner authorization identities.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-text-primary block">Brokerage Legal Name</label>
                <input 
                  type="text" 
                  value={workspace.name} 
                  onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })} 
                  placeholder="e.g. Nest Realty Richmond" 
                  className="w-full p-2 border border-border-soft rounded-lg bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-text-primary block">Timezone</label>
                <select 
                  value={workspace.timezone} 
                  onChange={(e) => setWorkspace({ ...workspace, timezone: e.target.value })} 
                  className="w-full p-2 border border-border-soft rounded-lg bg-white"
                >
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Chicago">America/Chicago (CST)</option>
                  <option value="America/Denver">America/Denver (MST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="font-bold text-text-primary block">Primary Office Address</label>
                <input 
                  type="text" 
                  value={workspace.location} 
                  onChange={(e) => setWorkspace({ ...workspace, location: e.target.value })} 
                  placeholder="Street Address, City, State, ZIP" 
                  className="w-full p-2 border border-border-soft rounded-lg bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-text-primary block">Owner Full Name</label>
                <input 
                  type="text" 
                  value={workspace.ownerName} 
                  onChange={(e) => setWorkspace({ ...workspace, ownerName: e.target.value })} 
                  placeholder="Diane Ross" 
                  className="w-full p-2 border border-border-soft rounded-lg bg-white"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="font-bold text-text-primary block">Launch Mode Strategy</label>
                <select 
                  value={workspace.launchMode} 
                  onChange={(e) => setWorkspace({ ...workspace, launchMode: e.target.value })} 
                  className="w-full p-2 border border-border-soft rounded-lg bg-white"
                >
                  <option value="integration_first">Integration First (Rechat & Dotloop required before launch)</option>
                  <option value="manual_first">Manual First (Allow roster & deal imports fallback; connect syncs later)</option>
                  <option value="hybrid">Hybrid (One integration required, manual for others)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-text-primary block">Owner Email Address</label>
                <input 
                  type="email" 
                  value={workspace.ownerEmail} 
                  onChange={(e) => setWorkspace({ ...workspace, ownerEmail: e.target.value })} 
                  placeholder="diane.ross@nestrealty.com" 
                  className="w-full p-2 border border-border-soft rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Staff Roles */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">// Step 2 — Staff Ownership Mapping</h3>
              <p className="mt-1">Assign roles and routing targets for key coordinator and compliance desks.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-text-primary block">Operations Lead (Primary Admin)</label>
                <input 
                  type="text" 
                  value={staff.operationsLead} 
                  onChange={(e) => setStaff({ ...staff, operationsLead: e.target.value })} 
                  placeholder="Email or Name" 
                  className="w-full p-2 border border-border-soft rounded-lg bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-text-primary block">Transaction Coordinator</label>
                <input 
                  type="text" 
                  value={staff.transactionCoordinator} 
                  onChange={(e) => setStaff({ ...staff, transactionCoordinator: e.target.value })} 
                  placeholder="Email or Name" 
                  className="w-full p-2 border border-border-soft rounded-lg bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-text-primary block">Compliance Partner</label>
                <input 
                  type="text" 
                  value={staff.compliancePartner} 
                  onChange={(e) => setStaff({ ...staff, compliancePartner: e.target.value })} 
                  placeholder="Email or Name" 
                  className="w-full p-2 border border-border-soft rounded-lg bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-text-primary block">Listing Coordinator</label>
                <input 
                  type="text" 
                  value={staff.listingCoordinator} 
                  onChange={(e) => setStaff({ ...staff, listingCoordinator: e.target.value })} 
                  placeholder="Email or Name" 
                  className="w-full p-2 border border-border-soft rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Workflow Priorities */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">// Step 3 — Active Guard Modules</h3>
              <p className="mt-1">Toggle the active guard layers to run in background sweeps.</p>
            </div>
            <div className="space-y-2 select-none">
              {[
                { name: 'Request Desk / Triage Desk', desc: 'Auto-categorizes email/SMS and routes to target coordinator' },
                { name: 'Owner Shield Escalation', desc: 'Flags SLA delays and escalates blockers' },
                { name: 'Deal Intake Guard', desc: 'Warns about missing escrow folders and imports checklist templates' },
                { name: 'Closing Compliance Guard', desc: 'Monitors closing disclosures and signed seller files' }
              ].map((item) => (
                <label key={item.name} className="flex items-start gap-3 p-3 bg-stone-50 border border-border-soft rounded-xl cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-1 rounded" />
                  <div>
                    <span className="font-bold text-text-primary block">{item.name}</span>
                    <span className="text-[10px] text-text-tertiary block mt-0.5">{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Routing rules */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">// Step 4 — Service Level Agreements & Routing</h3>
              <p className="mt-1">Define action boundaries and escalation triggers.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-text-primary block">Default Request SLA (Minutes)</label>
                <input 
                  type="number" 
                  value={routing.defaultSlaMins} 
                  onChange={(e) => setRouting({ ...routing, defaultSlaMins: e.target.value })} 
                  className="w-full p-2 border border-border-soft rounded-lg bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-text-primary block">Owner Shield Escalation SLA (Minutes)</label>
                <input 
                  type="number" 
                  value={routing.escalationSlaMins} 
                  onChange={(e) => setRouting({ ...routing, escalationSlaMins: e.target.value })} 
                  className="w-full p-2 border border-border-soft rounded-lg bg-white"
                />
              </div>
              <label className="col-span-2 flex items-center gap-2.5 p-3 bg-stone-50 border border-border-soft rounded-xl cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={routing.requireApprovalForOutbound} 
                  onChange={(e) => setRouting({ ...routing, requireApprovalForOutbound: e.target.checked })} 
                  className="rounded"
                />
                <div>
                  <span className="font-bold text-text-primary block">Require Manual TC Approval for Outbound Actions</span>
                  <span className="text-[10px] text-text-tertiary block mt-0.5">Enforces writeback gating for Rechat tasks, emails, and SMS alerts.</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Compliance */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">// Step 5 — Compliance Document Checklist</h3>
              <p className="mt-1">Select the standard closing milestones and required disclosures.</p>
            </div>
            <div className="space-y-2 select-none">
              {[
                'Exclusive Right to Sell Listing Agreement (Required)',
                'Residential Property Disclosure Statement (Required)',
                'Lead-Based Paint Disclosure (Conditional - pre-1978)',
                'Buyer Agency Agreement & Representation Signature (Required)'
              ].map((item) => (
                <div key={item} className="p-3 bg-stone-50 border border-border-soft rounded-xl flex justify-between items-center">
                  <span className="font-semibold text-text-primary">{item}</span>
                  <span className="text-[9px] font-bold font-mono text-brand-primary bg-brand-soft px-2 py-0.5 rounded">T-30 Review</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Integrations */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">// Step 6 — Connect Communication Pipelines</h3>
              <p className="mt-1">Connect API endpoints. Production requires real client key authorization scopes.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 select-none">
              {[
                { name: 'Rechat Partner OAuth', status: 'OAuth Setup Pending' },
                { name: 'Dotloop via API Nation Webhook', status: 'URL Generated' },
                { name: 'Gmail Workspace API', status: 'Configuration Pending' },
                { name: 'Twilio SMS Gateway', status: 'Credentials Input Required' }
              ].map((conn) => (
                <div key={conn.name} className="p-3 bg-white border border-border-soft rounded-xl flex justify-between items-center shadow-sm">
                  <div>
                    <span className="font-bold text-text-primary block">{conn.name}</span>
                    <span className="text-[10px] text-text-tertiary block mt-0.5">{conn.status}</span>
                  </div>
                  <span className="text-[9px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded uppercase">Setup</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Import */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">// Step 7 — Roster & Transactions Data Import</h3>
              <p className="mt-1">Upload active datasets via manual CSV paste lines.</p>
            </div>
            <div className="p-4 border border-dashed border-border-soft rounded-xl text-center space-y-2 select-none">
              <UploadCloud className="w-8 h-8 text-text-tertiary mx-auto" />
              <p className="font-semibold text-text-primary">Drag Roster or Transaction CSV file here</p>
              <span className="text-[10px] text-text-tertiary block">Or copy and paste raw rows in the Import settings panel later.</span>
            </div>
          </div>
        )}

        {/* Step 8: Review */}
        {currentStep === 8 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">// Step 8 — Launch Authorization Audit</h3>
              <p className="mt-1">Confirm and activate the workspace. An immutable audit record will log this bootstrap action.</p>
            </div>
            <div className="bg-stone-50 p-4 rounded-xl border border-border-soft space-y-3 font-mono">
              <div>
                <span className="text-text-tertiary block text-[9px] font-bold uppercase select-none">Workspace Name</span>
                <span className="text-text-primary font-bold">{workspace.name || 'Untitled Brokerage'}</span>
              </div>
              <div>
                <span className="text-text-tertiary block text-[9px] font-bold uppercase select-none">Tenant Owner</span>
                <span className="text-text-primary font-bold">{workspace.ownerName} ({workspace.ownerEmail})</span>
              </div>
              <div>
                <span className="text-text-tertiary block text-[9px] font-bold uppercase select-none">TC Coordinator Assigned</span>
                <span className="text-text-primary font-bold">{staff.transactionCoordinator || 'Unassigned'}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer wizard controls */}
      <div className="flex justify-between items-center pt-4 border-t border-border-soft select-none">
        <button 
          onClick={handleBack}
          disabled={currentStep === 1}
          className="px-4 py-2 border border-border-medium hover:bg-stone-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-30"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {currentStep < 8 ? (
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleActivate}
            className="px-5 py-2 bg-success text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Activate Workspace</span>
          </button>
        )}
      </div>

    </div>
  );
}
