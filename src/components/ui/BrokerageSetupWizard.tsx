/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, Users, GitCommit, ClipboardCheck, Mail, ShieldCheck, 
  Layers, ArrowRight, ArrowLeft, Plus, Check, Play, Settings, AlertOctagon 
} from 'lucide-react';

interface BrokerageSetupWizardProps {
  onLaunchWorkspace: (config: {
    brokerageName: string;
    pipelineStages: string[];
    listingChecklist: string[];
    automationThreshold: number;
    pauseAutomation: boolean;
  }) => void;
}

export default function BrokerageSetupWizard({ onLaunchWorkspace }: BrokerageSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Profile
  const [brokerageName, setBrokerageName] = useState('Nest Realty');
  const [offices, setOffices] = useState('Charlottesville (HQ), Richmond, Norfolk');
  const [primaryRole, setPrimaryRole] = useState('Managing Broker');
  const [agentCount, setAgentCount] = useState(120);
  const [monthlyVolume, setMonthlyVolume] = useState('$45,000,000');
  const [primarySystems, setPrimarySystems] = useState('Rechat, Dotloop, Gmail');

  // Step 2: People
  const [people, setPeople] = useState([
    { name: 'Ann Gunn', role: 'ATC & Operations Lead', permissions: 'Full Admin' },
    { name: 'Frank Miller', role: 'Managing Broker', permissions: 'Compliance Approval' },
    { name: 'Diane Ross', role: 'Transaction Coordinator', permissions: 'Deal Management' },
    { name: 'Emma Watson', role: 'Listing Coordinator', permissions: 'Listing Intake' },
    { name: 'Alex Carter', role: 'Agent', permissions: 'Submit Documents' },
    { name: 'Ann', role: 'Admin', permissions: 'Full Admin' },
    { name: 'Melissa Gagliardi', role: 'Admin', permissions: 'Full Admin' },
    { name: 'James Fort', role: 'Admin', permissions: 'Full Admin' },
    { name: 'Ryan', role: 'Admin', permissions: 'Full Admin' },
  ]);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Agent');

  const handleAddPerson = () => {
    if (!newName.trim()) return;
    const permissions = newRole === 'COO / Operations Leader' ? 'Full Admin' : 'Submit Documents';
    setPeople([...people, { name: newName, role: newRole, permissions }]);
    setNewName('');
  };

  // Step 3: Pipelines
  const [pipelineStages, setPipelineStages] = useState([
    'Intake',
    'Active Listing',
    'Under Contract',
    'Inspection',
    'Appraisal',
    'Underwriting',
    'Clear to Close',
    'Scheduled Closing',
    'Closed'
  ]);

  const handleStageEdit = (index: number, val: string) => {
    const updated = [...pipelineStages];
    updated[index] = val;
    setPipelineStages(updated);
  };

  // Step 4: Listing Workflow
  const [listingChecklist, setListingChecklist] = useState([
    'Listing agreement received',
    'Seller disclosure received',
    'Photos scheduled',
    'Photos received',
    'MLS data complete',
    'Compliance reviewed',
    'Seller approved copy',
    'Ready to publish',
    'Published'
  ]);

  const handleChecklistEdit = (index: number, val: string) => {
    const updated = [...listingChecklist];
    updated[index] = val;
    setListingChecklist(updated);
  };

  // Step 5: Email & Comm Scope
  const [monitoredMailboxes, setMonitoredMailboxes] = useState(['operations@nest-demo.local', 'transactions@nest-demo.local']);
  const [businessOnly, setBusinessOnly] = useState(true);
  const [sensitiveDataRedaction, setSensitiveDataRedaction] = useState(true);
  const [monitoredFolders, setMonitoredFolders] = useState('Inbox, Sent, Archive');
  const [lowConfidenceReview, setLowConfidenceReview] = useState(80);

  // Step 6: Automation Policy
  const [autoUpdateThreshold, setAutoUpdateThreshold] = useState(90);
  const [externalApprovalReq, setExternalApprovalReq] = useState(true);
  const [dateChangeApprovalReq, setDateChangeApprovalReq] = useState(true);
  const [emergencyPause, setEmergencyPause] = useState(false);

  // Step 7: Integrations
  const integrations = [
    { name: 'Gmail API', description: 'Monitors inbound communication & drafts email updates.', status: 'Ready for OAuth' },
    { name: 'Rechat CRM', description: 'Syncs active directories and listing details.', status: 'Production connected' },
    { name: 'Dotloop Integration', description: 'Ingests transaction files and loop statuses.', status: 'Needs API credentials' },
    { name: 'DocuSign Connect', description: 'Monitors signature completions.', status: 'Ready for OAuth' },
    { name: 'Google Drive Sync', description: 'Archives compliance disclosures.', status: 'Ready for OAuth' },
  ];

  const handleNext = () => {
    if (currentStep < 8) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleLaunch = () => {
    onLaunchWorkspace({
      brokerageName,
      pipelineStages,
      listingChecklist,
      automationThreshold: autoUpdateThreshold,
      pauseAutomation: emergencyPause,
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-surface border border-border-subtle rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row h-[620px] text-left">
      
      {/* Left Stepper Rail */}
      <div className="w-full md:w-64 bg-secondary-surface border-r border-border-subtle p-6 flex flex-col justify-between shrink-0 font-sans">
        <div className="space-y-6">
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-brand-green-soft text-brand-green rounded text-[10px] font-bold uppercase tracking-wider">
              Onboarding
            </span>
            <h3 className="font-serif font-bold text-base text-text-primary mt-1">Setup Wizard</h3>
          </div>

          <div className="space-y-3">
            {[
              { step: 1, label: 'Brokerage Profile', icon: Building2 },
              { step: 2, label: 'People & Roster', icon: Users },
              { step: 3, label: 'Deal Stages', icon: GitCommit },
              { step: 4, label: 'Listing Checklist', icon: ClipboardCheck },
              { step: 5, label: 'Communication', icon: Mail },
              { step: 6, label: 'Automation Rules', icon: ShieldCheck },
              { step: 7, label: 'Integrations Planning', icon: Layers },
              { step: 8, label: 'Finish & Launch', icon: Play },
            ].map((s) => {
              const Icon = s.icon;
              const isCurrent = currentStep === s.step;
              const isPassed = currentStep > s.step;
              return (
                <div key={s.step} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-bold transition-all ${
                    isCurrent 
                      ? 'bg-brand-green text-white border-transparent shadow-sm'
                      : isPassed
                      ? 'bg-brand-green-soft text-brand-green border-brand-green/20'
                      : 'bg-white text-text-tertiary border-border-subtle'
                  }`}>
                    {isPassed ? '✓' : s.step}
                  </div>
                  <span className={`text-[11px] font-semibold truncate ${
                    isCurrent ? 'text-text-primary font-bold' : 'text-text-secondary'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[10px] text-text-tertiary">
          shapework. Synthetic Demo Workspace Setup
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between p-8 bg-surface font-sans">
        
        {/* Step Rendering */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          
          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-serif font-bold text-sm text-text-primary">Step 1: Brokerage Profile Details</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">Configure operating metrics to initialize shapework analytics models.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Brokerage Workspace Name</label>
                  <input 
                    type="text" 
                    value={brokerageName}
                    onChange={(e) => setBrokerageName(e.target.value)}
                    className="w-full border border-border-subtle p-2.5 rounded-xl bg-secondary-surface focus:outline-none focus:border-brand-green focus:bg-surface transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Offices / Locations</label>
                  <input 
                    type="text" 
                    value={offices}
                    onChange={(e) => setOffices(e.target.value)}
                    className="w-full border border-border-subtle p-2.5 rounded-xl bg-secondary-surface focus:outline-none focus:border-brand-green focus:bg-surface transition-all font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Your Role</label>
                  <input 
                    type="text" 
                    value={primaryRole}
                    onChange={(e) => setPrimaryRole(e.target.value)}
                    className="w-full border border-border-subtle p-2.5 rounded-xl bg-secondary-surface focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Roster Size (Active Agents)</label>
                  <input 
                    type="number" 
                    value={agentCount}
                    onChange={(e) => setAgentCount(Number(e.target.value))}
                    className="w-full border border-border-subtle p-2.5 rounded-xl bg-secondary-surface focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Monthly Closing Volume ($)</label>
                  <input 
                    type="text" 
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(e.target.value)}
                    className="w-full border border-border-subtle p-2.5 rounded-xl bg-secondary-surface focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Software Stack</label>
                  <input 
                    type="text" 
                    value={primarySystems}
                    onChange={(e) => setPrimarySystems(e.target.value)}
                    className="w-full border border-border-subtle p-2.5 rounded-xl bg-secondary-surface focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: People */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-serif font-bold text-sm text-text-primary">Step 2: People and Operating Roles</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">Define coordination assignments and data access permissions.</p>
              </div>

              {/* Roster list */}
              <div className="border border-border-subtle rounded-xl divide-y divide-border-subtle overflow-hidden max-h-48 overflow-y-auto text-xs bg-stone-50/50">
                {people.map((p, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center gap-4 bg-white">
                    <div>
                      <span className="font-semibold text-text-primary">{p.name}</span>
                      <span className="text-[10px] text-text-secondary"> • {p.role}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-brand-green-soft text-brand-green font-bold rounded text-[9px]">
                      {p.permissions}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 items-end text-xs">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-text-secondary">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter name..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full border border-border-subtle p-2 rounded-xl focus:outline-none focus:border-brand-green"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddPerson}
                  className="w-full bg-brand-green hover:bg-brand-green-hover text-white py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Roster Member</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Pipeline stages */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-serif font-bold text-sm text-text-primary">Step 3: Deal Pipeline Stage Mapping</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">Customize transaction milestones locally. Click stages to edit labels.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {pipelineStages.map((stage, idx) => (
                  <div key={idx} className="p-2.5 border border-border-subtle rounded-xl space-y-1 bg-secondary-surface/30">
                    <span className="text-[9px] font-bold text-text-tertiary block font-mono">Stage #{idx+1}</span>
                    <input 
                      type="text" 
                      value={stage}
                      onChange={(e) => handleStageEdit(idx, e.target.value)}
                      className="w-full border-none bg-transparent p-0 focus:outline-none font-semibold text-text-primary focus:underline font-sans"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Listing Workflow */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-serif font-bold text-sm text-text-primary">Step 4: Pre-Launch Listing Checklist</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">Customize listing requirements before publishing to MLS syndicators.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {listingChecklist.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-border-subtle">
                    <div className="w-5 h-5 rounded bg-brand-green-soft text-brand-green flex items-center justify-center text-[10px] font-bold shrink-0">
                      {idx+1}
                    </div>
                    <input 
                      type="text" 
                      value={step}
                      onChange={(e) => handleChecklistEdit(idx, e.target.value)}
                      className="w-full border-none bg-transparent p-0 focus:outline-none text-text-secondary leading-tight font-sans"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Comm scope */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-serif font-bold text-sm text-text-primary">Step 5: Communication Ingestion Limits</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">Establish boundaries to protect client privacy and sensitive transaction data.</p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between p-3 border border-border-subtle rounded-xl bg-stone-50/50">
                  <div>
                    <span className="font-bold text-text-primary block">Business Communications Only</span>
                    <span className="text-[10px] text-text-tertiary">shapework automatically discards non-brokerage email signals.</span>
                  </div>
                  <button 
                    onClick={() => setBusinessOnly(!businessOnly)}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
                      businessOnly ? 'bg-brand-green' : 'bg-stone-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      businessOnly ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 border border-border-subtle rounded-xl bg-stone-50/50">
                  <div>
                    <span className="font-bold text-text-primary block">Sensitive Data Redaction</span>
                    <span className="text-[10px] text-text-tertiary">Redact social security numbers, banking route accounts, and phone data.</span>
                  </div>
                  <button 
                    onClick={() => setSensitiveDataRedaction(!sensitiveDataRedaction)}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
                      sensitiveDataRedaction ? 'bg-brand-green' : 'bg-stone-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      sensitiveDataRedaction ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-text-secondary">Monitored Folders / Labels</label>
                    <input 
                      type="text" 
                      value={monitoredFolders}
                      onChange={(e) => setMonitoredFolders(e.target.value)}
                      className="w-full border border-border-subtle p-2.5 rounded-xl bg-secondary-surface focus:outline-none text-text-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-text-secondary flex justify-between">
                      <span>Low-Confidence Review Threshold</span>
                      <span className="font-mono text-brand-green font-bold">{lowConfidenceReview}%</span>
                    </label>
                    <input 
                      type="range"
                      min="50"
                      max="95"
                      value={lowConfidenceReview}
                      onChange={(e) => setLowConfidenceReview(Number(e.target.value))}
                      className="w-full accent-brand-green mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Automation policy */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-serif font-bold text-sm text-text-primary">Step 6: Automation Rules & Safeguards</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">Control the level of AI autonomy when interacting with escrow files.</p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between p-3 border border-border-subtle rounded-xl bg-stone-50/50">
                  <div>
                    <span className="font-bold text-text-primary block">Human Approval for Outbound Messages</span>
                    <span className="text-[10px] text-text-tertiary">All AI-drafted email requests require coordinator authorization.</span>
                  </div>
                  <button 
                    onClick={() => setExternalApprovalReq(!externalApprovalReq)}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
                      externalApprovalReq ? 'bg-brand-green' : 'bg-stone-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      externalApprovalReq ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 border border-border-subtle rounded-xl bg-stone-50/50">
                  <div>
                    <span className="font-bold text-text-primary block">Material Date / Financial Safeguards</span>
                    <span className="text-[10px] text-text-tertiary">Gives warning checklists for contract date modifications.</span>
                  </div>
                  <button 
                    onClick={() => setDateChangeApprovalReq(!dateChangeApprovalReq)}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
                      dateChangeApprovalReq ? 'bg-brand-green' : 'bg-stone-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      dateChangeApprovalReq ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-text-secondary flex justify-between">
                      <span>Auto-Update Confidence Threshold</span>
                      <span className="font-mono text-brand-green font-bold">{autoUpdateThreshold}%</span>
                    </label>
                    <input 
                      type="range"
                      min="75"
                      max="98"
                      value={autoUpdateThreshold}
                      onChange={(e) => setAutoUpdateThreshold(Number(e.target.value))}
                      className="w-full accent-brand-green mt-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-text-secondary block">Emergency Safeguard Switch</label>
                    <button
                      onClick={() => setEmergencyPause(!emergencyPause)}
                      className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        emergencyPause 
                          ? 'bg-status-atrisk text-white border-transparent' 
                          : 'bg-white border-border-subtle text-status-atrisk hover:bg-red-50'
                      }`}
                    >
                      <AlertOctagon className="w-4 h-4" />
                      <span>{emergencyPause ? 'AUTOMATION SYSTEM PAUSED' : 'PAUSE ALL AUTOMATIONS'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Recommended integrations */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-serif font-bold text-sm text-text-primary">Step 7: Recommended Integrations Configuration</h4>
                <p className="text-[11px] text-text-secondary mt-0.5">Review credentials required for your selected brokerage systems.</p>
              </div>

              <div className="space-y-2.5 text-xs">
                {integrations.map((item, idx) => (
                  <div key={idx} className="p-3 border border-border-subtle rounded-xl flex items-center justify-between bg-white shadow-xs">
                    <div>
                      <span className="font-bold text-text-primary block">{item.name}</span>
                      <span className="text-[10px] text-text-secondary leading-normal">{item.description}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 text-text-secondary font-bold rounded text-[9px] shrink-0 font-mono">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 8: Onboarding Summary & Launch */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-green-soft text-brand-green flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-text-primary">Brokerage Workspace Initialized</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Nest Realty synthetic demo workspace is configured and ready for operations.</p>
                </div>
              </div>

              <div className="p-4 bg-secondary-surface border border-border-subtle rounded-2xl text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Organization Name:</span>
                  <span className="font-bold text-text-primary">{brokerageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Coordinators Assigned:</span>
                  <span className="font-semibold text-text-secondary">Ann Gunn, Diane Ross, Emma Watson</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Configured Deal Stages:</span>
                  <span className="font-semibold text-text-secondary truncate max-w-xs">{pipelineStages.join(' → ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Monitored Mailboxes:</span>
                  <span className="font-mono text-[10px] text-text-secondary">{monitoredMailboxes.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Outbound Messages:</span>
                  <span className="font-bold text-brand-green">Requires Human Approval</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex justify-between items-center pt-5 border-t border-border-subtle mt-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition-colors ${
              currentStep === 1 
                ? 'opacity-40 cursor-not-allowed border-stone-200 text-stone-400' 
                : 'border-border-subtle hover:bg-secondary-surface text-text-secondary'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentStep < 8 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-hover text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunch}
              className="flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-hover text-white px-6 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Launch Command Center</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
