import React, { useState, useEffect, useMemo } from 'react';
import { orgChartService } from '../../services/orgChartService';
import { SOP_TEMPLATES, SOPTemplate, SOPField, SOPStep, SOPDecision } from './sopTemplates';
import SOPLibrary from './SOPLibrary';
import SOPCreateMenu from './SOPCreateMenu';
import SOPWizard from './SOPWizard';
import SOPDocumentView from './SOPDocumentView';
import SOPProcessView from './SOPProcessView';
import SOPRunView from './SOPRunView';
import SOPVersionComparison from './SOPVersionComparison';
import AIFieldAssistant from './AIFieldAssistant';
import SOPQualityReview from './SOPQualityReview';
import StaffSOPTemplateModal from './StaffSOPTemplateModal';
import { AskToDocumentModal } from './AskToDocumentModal';
import { SOPDocumentUploadModal } from './SOPDocumentUploadModal';
import { SOPCreationChoiceModal } from './SOPCreationChoiceModal';
import { Download, FileText } from 'lucide-react';
import { useToast } from '../ui';

interface SOPStudioProps {
  state: any;
  embedded?: boolean;
  readOnly?: boolean;
}

export default function SOPStudio({ state, embedded = false, readOnly = false }: SOPStudioProps) {
  const { activeProfile, directoryPeople = [] } = state || {};
  const wsId = state?.workspaceId || 'nest-realty-demo';

  // View state: 'library' | 'create_options' | 'wizard' | 'details'
  const [currentView, setCurrentView] = useState<'library' | 'create_options' | 'wizard' | 'details'>('library');
  const [showStaffTemplateModal, setShowStaffTemplateModal] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOpenAskModal = () => setShowAskModal(true);
    const handleOpenStaffTemplate = () => setShowStaffTemplateModal(true);
    const handleOpenNewSop = () => {
      setIsUploadModalOpen(false);
      setShowStaffTemplateModal(false);
      setShowAskModal(false);
      setIsChoiceModalOpen(true);
    };

    const handleOpenUploadModal = () => setIsUploadModalOpen(true);

    window.addEventListener('open-ask-sop-modal', handleOpenAskModal);
    window.addEventListener('open-invite-sop-modal', handleOpenAskModal);
    window.addEventListener('open-staff-sop-template', handleOpenStaffTemplate);
    window.addEventListener('open-new-sop-modal', handleOpenNewSop);
    window.addEventListener('open-upload-sop-modal', handleOpenUploadModal);

    return () => {
      window.removeEventListener('open-ask-sop-modal', handleOpenAskModal);
      window.removeEventListener('open-invite-sop-modal', handleOpenAskModal);
      window.removeEventListener('open-staff-sop-template', handleOpenStaffTemplate);
      window.removeEventListener('open-new-sop-modal', handleOpenNewSop);
      window.removeEventListener('open-upload-sop-modal', handleOpenUploadModal);
    };
  }, []);
  
  // Data lists
  const [sops, setSops] = useState<any[]>(() => (state?.opsSops && state.opsSops.length > 0) ? state.opsSops : SOP_TEMPLATES);
  const [runs, setRuns] = useState<any[]>(() => state?.opsRuns || []);
  const [loading, setLoading] = useState(false);

  // Selected details state
  const [selectedSop, setSelectedSop] = useState<any | null>(null);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [selectedViewTab, setSelectedViewTab] = useState<'document' | 'process' | 'run' | 'review'>('document');
  const [showAskModal, setShowAskModal] = useState(false);

  // Version Comparison
  const [compareVersions, setCompareVersions] = useState<{ verA: any; verB: any } | null>(null);

  // Stepper Stage
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [publishErrors, setPublishErrors] = useState<string[]>([]);

  // Sub-modals for Wizard items
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFieldIdx, setEditingFieldIdx] = useState<number | null>(null);
  const [fieldForm, setFieldForm] = useState<Partial<SOPField>>({
    name: '',
    description: '',
    dataType: 'text',
    required: 'yes'
  });

  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [editingStepIdx, setEditingStepIdx] = useState<number | null>(null);
  const [stepForm, setStepForm] = useState<Partial<SOPStep>>({
    title: '',
    instruction: '',
    assignedRole: 'operations_lead',
    backupRole: 'owner',
    type: 'manual',
    evidenceRequired: '',
    expectedDuration: '1h'
  });

  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [editingDecisionIdx, setEditingDecisionIdx] = useState<number | null>(null);
  const [decisionForm, setDecisionForm] = useState<Partial<SOPDecision>>({
    title: '',
    condition: '',
    action: ''
  });

  // Current SOP form state
  const [sopForm, setSopForm] = useState<any>({
    id: '',
    sopId: '',
    title: '',
    department: 'Operations',
    ownerRole: 'operations_lead',
    ownerUserId: '',
    backupRole: 'owner',
    backupUserId: '',
    finalApproverUserId: '',
    escalationRecipientRole: 'owner',
    purpose: '',
    expectedOutcome: '',
    scope: '',
    exclusions: '',
    tags: [],
    triggerType: 'manual_start',
    trigger: '',
    triggerConditions: '',
    requiredInfo: [],
    steps: [],
    decisions: [],
    escalationBehavior: {
      expectedResponse: 'Expected Response: 1 hour',
      followUpDue: 'Follow-up Due: 12 hours',
      escalateAfter: 'Escalate After: 24 hours',
      recipientRole: 'owner'
    },
    completionEvidence: {
      type: 'manual',
      description: ''
    },
    governance: {
      reviewFrequencyDays: 90,
      visibility: 'workspace',
      trainingRequired: false,
      acknowledgementRequired: false,
      effectiveDate: new Date().toISOString().split('T')[0],
      reviewers: []
    },
    version: '1.0',
    status: 'draft',
    versions: [],
    changeSummary: 'Initial draft configuration'
  });

  // Load intermediate form state from localStorage on mount/workspace change
  useEffect(() => {
    const saved = localStorage.getItem(`sop_wizard_intermediate_state_${wsId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.sopId) {
          setSopForm(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved SOP wizard state:', e);
      }
    }
  }, [wsId]);

  // Persist intermediate form state to localStorage on changes
  useEffect(() => {
    if (sopForm && (sopForm.title || sopForm.purpose || (sopForm.steps && sopForm.steps.length > 0))) {
      localStorage.setItem(`sop_wizard_intermediate_state_${wsId}`, JSON.stringify(sopForm));
    }
  }, [sopForm, wsId]);

  // Window event listeners for TopBar actions
  useEffect(() => {
    const handleOpenUpload = () => setIsUploadModalOpen(true);
    const handleOpenAsk = () => setShowAskModal(true);
    const handleOpenStaffTemplate = () => setShowStaffTemplateModal(true);

    window.addEventListener('open-upload-sop-modal', handleOpenUpload);
    window.addEventListener('open-ask-to-document-modal', handleOpenAsk);
    window.addEventListener('open-staff-sop-template-modal', handleOpenStaffTemplate);

    return () => {
      window.removeEventListener('open-upload-sop-modal', handleOpenUpload);
      window.removeEventListener('open-ask-to-document-modal', handleOpenAsk);
      window.removeEventListener('open-staff-sop-template-modal', handleOpenStaffTemplate);
    };
  }, []);

  // Fetch roles and positions from local operating model
  const { positions = [] } = useMemo(() => {
    return orgChartService.getOrgChart(wsId);
  }, [wsId]);

  // Load SOPs & Runs
  const loadData = async () => {
    setLoading(true);
    try {
      let loadedSops: any[] = [];
      try {
        const altRes = await fetch(`/api/sops?workspaceId=${wsId}`);
        if (altRes.ok) {
          const altData = await altRes.json();
          const combined = [
            ...(altData.sops || []),
            ...(altData.drafts || []).filter((d: any) => !(altData.sops || []).some((s: any) => s.id === d.id))
          ];
          loadedSops = combined.map((d: any) => ({
            id: d.id,
            sopId: d.id,
            title: d.title,
            department: d.department || 'Operations',
            ownerRole: d.processOwner || d.ownerRole || 'operations_lead',
            processOwner: d.processOwner || d.ownerRole || 'Admin Coordinator',
            author: d.author || d.createdBy || d.processOwner || 'Nest Team',
            createdBy: d.createdBy || d.author || d.processOwner || 'Nest Team',
            publisher: d.publisher || d.reviewer || '',
            purpose: d.purpose || '',
            scope: d.scope || '',
            trigger: d.trigger || '',
            status: d.status || 'published',
            version: typeof d.version === 'number' ? `${d.version}.0` : (d.version || '1.0'),
            steps: (d.orderedSteps || []).map((st: any) => ({
              id: st.id || `st_${st.stepNumber}`,
              stepNumber: st.stepNumber,
              instruction: st.action,
              role: st.role,
              systemUsed: st.systemUsed
            })),
            decisions: d.decisions || [],
            exceptions: d.exceptions || [],
            escalationPaths: d.escalationPaths || [],
            completionEvidence: {
              type: 'manual',
              description: d.completionEvidence || ''
            },
            sourceDocument: d.sourceDocument,
            workspaceId: wsId
          }));
        }
      } catch (err) {
        console.warn('Failed to load from /api/sops:', err);
      }

      if (loadedSops.length === 0) {
        const sopsRes = await fetch(`/api/ops/sops?workspaceId=${wsId}`);
        if (sopsRes.ok) {
          const sopsData = await sopsRes.json();
          loadedSops = sopsData.sops || [];
        }
      }

      // Deduplicate loaded SOPs by ID and normalized title
      const uniqueMap = new Map<string, any>();
      for (const s of loadedSops) {
        if (!s) continue;
        const titleKey = (s.title || s.name || '').trim().toLowerCase();
        const key = titleKey || s.sopId || s.id;
        if (key && !uniqueMap.has(key)) {
          uniqueMap.set(key, s);
        }
      }
      const deduplicatedSops = Array.from(uniqueMap.values());
      setSops(deduplicatedSops);

      const runsRes = await fetch(`/api/ops/sops/runs?workspaceId=${wsId}`);
      if (runsRes.ok) {
        const runsData = await runsRes.json();
        const loadedRuns = runsData.runs || [];
        setRuns(loadedRuns);

        // Auto-load run from path if present
        if (typeof window !== 'undefined' && window.location.pathname.includes('/sops/runs/')) {
          const runId = window.location.pathname.split('/').pop();
          const matchedRun = loadedRuns.find((r: any) => r.id === runId);
          if (matchedRun) {
            const matchedSop = loadedSops.find((s: any) => s.sopId === matchedRun.sopId);
            if (matchedSop) {
              setSelectedSop(matchedSop);
              setSelectedRun(matchedRun);
              setSelectedViewTab('run');
              setCurrentView('details');
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load SOP data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action') || params.get('view') || params.get('modal');
      if (action === 'staff_authoring' || action === 'sop_authoring' || action === 'staff_invite') {
        setShowStaffTemplateModal(true);
      }
    }
  }, [wsId]);

  // Synchronize browser URL history with SOP Studio views/runs for E2E tests
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefix = window.location.pathname.startsWith('/demo') ? '/demo' : '/app';
    if (currentView === 'details' && selectedViewTab === 'run' && selectedRun?.id) {
      const targetPath = `${prefix}/sops/runs/${selectedRun.id}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    } else {
      const targetPath = `${prefix}/sops`;
      if (window.location.pathname.includes('/sops/runs/') && window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  }, [currentView, selectedViewTab, selectedRun]);

  // Duplication Action
  const handleSelectDuplicate = async (sopId: string) => {
    const sourceSop = sops.find(s => s.sopId === sopId && s.status === 'published') || sops.find(s => s.sopId === sopId);
    if (!sourceSop) return;

    const newId = `sop_${Date.now()}`;
    const duplicateData = {
      ...sourceSop,
      id: `${newId}_draft`,
      sopId: newId,
      title: `${sourceSop.title} (Copy)`,
      version: '1.0',
      status: 'draft',
      versions: [],
      changeSummary: `Cloned duplicate from ${sourceSop.title}`
    };

    setSopForm(duplicateData);
    setWizardStep(1);
    setCurrentView('wizard');
  };

  // AI draft creation action
  const handleSelectAI = async (brief: string) => {
    const res = await fetch('/api/ops/sops/generate-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptText: brief })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'AI Drafting service is currently offline.');
    }
    const data = await res.json();
    if (data.sop) {
      setSops([data.sop, ...sops]);
      setSopForm(data.sop);
      setWizardStep(1);
      setCurrentView('wizard');
    }
  };

  // Clone from templates
  const handleSelectTemplate = (template: SOPTemplate) => {
    const freshSopId = `sop_${Date.now()}`;
    const newForm = {
      id: `${freshSopId}_draft`,
      sopId: freshSopId,
      workspaceId: wsId,
      title: template.title,
      department: template.department,
      ownerRole: template.ownerRole,
      backupRole: template.backupRole,
      escalationRecipientRole: template.escalationBehavior?.recipientRole || 'owner',
      purpose: template.purpose,
      expectedOutcome: template.expectedOutcome,
      scope: template.scope,
      exclusions: template.exclusions,
      tags: [...template.tags],
      triggerType: template.triggerType,
      trigger: template.trigger,
      triggerConditions: (template as any).triggerConditions || '',
      requiredInfo: template.requiredInfo.map((f, i) => ({ id: `field_${freshSopId}_${i}`, ...f })),
      steps: template.steps.map((s, i) => ({ id: `step_${freshSopId}_${i}`, ...s })),
      decisions: template.decisions.map((d, i) => ({ id: `dec_${freshSopId}_${i}`, ...d })),
      escalationBehavior: { ...template.escalationBehavior },
      completionEvidence: template.completionEvidence ? JSON.parse(JSON.stringify(template.completionEvidence)) : ({ requiredProof: 'notes', signoffRequired: false } as any),
      governance: {
        ...template.governance,
        effectiveDate: new Date().toISOString().split('T')[0]
      },
      status: 'draft',
      version: '1.0',
      versions: [],
      changeSummary: 'Cloned default template'
    };

    setSopForm(newForm);
    setWizardStep(1);
    setCurrentView('wizard');
  };

  const handleStartCreateOptions = () => {
    setIsChoiceModalOpen(true);
  };

  const handleSelectBlank = () => {
    const freshSopId = `sop_${Date.now()}`;
    setSopForm({
      id: `${freshSopId}_draft`,
      sopId: freshSopId,
      workspaceId: wsId,
      title: '',
      department: 'Operations',
      ownerRole: 'operations_lead',
      ownerUserId: '',
      backupRole: 'owner',
      backupUserId: '',
      finalApproverUserId: '',
      escalationRecipientRole: 'owner',
      purpose: '',
      expectedOutcome: '',
      scope: '',
      exclusions: '',
      tags: [],
      triggerType: 'manual_start',
      trigger: '',
      triggerConditions: '',
      requiredInfo: [],
      steps: [],
      decisions: [],
      escalationBehavior: {
        expectedResponse: 'Expected Response: 1 hour',
        followUpDue: 'Follow-up Due: 12 hours',
        escalateAfter: 'Escalate After: 24 hours',
        recipientRole: 'owner'
      },
      completionEvidence: {
        type: 'manual',
        description: ''
      },
      governance: {
        reviewFrequencyDays: 90,
        visibility: 'workspace',
        trainingRequired: false,
        acknowledgementRequired: false,
        effectiveDate: new Date().toISOString().split('T')[0],
        reviewers: []
      },
      status: 'draft',
      version: '1.0',
      versions: [],
      changeSummary: 'Initial empty blank draft'
    });
    setWizardStep(1);
    setCurrentView('wizard');
  };

  // Reorder helpers
  const handleMoveField = (idx: number, dir: 'up' | 'down') => {
    const fields = [...sopForm.requiredInfo];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;
    const temp = fields[idx];
    fields[idx] = fields[targetIdx];
    fields[targetIdx] = temp;
    setSopForm({ ...sopForm, requiredInfo: fields });
  };

  const handleMoveStep = (idx: number, dir: 'up' | 'down') => {
    const steps = [...sopForm.steps];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const temp = steps[idx];
    steps[idx] = steps[targetIdx];
    steps[targetIdx] = temp;
    setSopForm({ ...sopForm, steps });
  };

  const handleDuplicateStep = (idx: number) => {
    const step = sopForm.steps[idx];
    const steps = [...sopForm.steps];
    steps.splice(idx + 1, 0, {
      ...step,
      id: `step_${Date.now()}_dup`,
      title: `${step.title} (Copy)`
    });
    setSopForm({ ...sopForm, steps });
  };

  // Validation calculations
  const ownershipValidation = useMemo(() => {
    const errors: string[] = [];
    if (!sopForm.ownerRole) return errors;

    const ownerPos = positions.find(p => p.id === sopForm.ownerRole);
    if (!ownerPos) {
      errors.push(`Process Owner position "${sopForm.ownerRole}" does not exist in the operating model.`);
    } else {
      if (!ownerPos.name || ownerPos.status === 'open' || ownerPos.status === 'planned') {
        errors.push(`Process Owner position "${ownerPos.title}" is vacant (not yet filled).`);
      } else {
        const dirPerson = directoryPeople.find(p => p.email === ownerPos.email || `${p.firstName} ${p.lastName}` === ownerPos.name);
        if (dirPerson && dirPerson.status === 'inactive') {
          errors.push(`Selected owner ${ownerPos.name} is marked inactive in the directory.`);
        }
      }
      if (!ownerPos.backupPositionId) {
        errors.push(`Missing backup: Process Owner position "${ownerPos.title}" has no backup coverage defined.`);
      }
    }

    if (sopForm.backupRole) {
      const primaryPos = positions.find(p => p.id === sopForm.backupRole);
      if (!primaryPos) {
        errors.push(`Primary Handler position "${sopForm.backupRole}" does not exist in the operating model.`);
      } else {
        if (!primaryPos.name || primaryPos.status === 'open' || primaryPos.status === 'planned') {
          errors.push(`Warning: Selected Primary Handler "${primaryPos.title}" has no staff member assigned (vacant).`);
        } else {
          const dirPerson = directoryPeople.find(p => p.email === primaryPos.email || `${p.firstName} ${p.lastName}` === primaryPos.name);
          if (dirPerson && dirPerson.status === 'inactive') {
            errors.push(`Selected handler ${primaryPos.name} is marked inactive in the directory.`);
          }
        }
        if (!primaryPos.backupPositionId) {
          errors.push(`Missing backup: Primary Handler position "${primaryPos.title}" has no backup coverage defined.`);
        }
      }
    }

    if (sopForm.ownerRole && sopForm.backupRole && sopForm.ownerRole === sopForm.backupRole) {
      errors.push("Role collision: Process Owner and Primary Handler positions cannot be the same.");
    }
    if (sopForm.ownerRole && sopForm.escalationRecipientRole && sopForm.ownerRole === sopForm.escalationRecipientRole) {
      errors.push("Escalation warning: Process Owner and Escalation Recipient positions cannot be the same.");
    }

    return errors;
  }, [sopForm.ownerRole, sopForm.backupRole, sopForm.escalationRecipientRole, positions, directoryPeople]);

  const decisionPathErrors = useMemo(() => {
    const errors: string[] = [];
    const textTarget = JSON.stringify(sopForm.decisions);
    const stepIds = new Set(sopForm.steps.map((s: any) => s.id));
    
    sopForm.decisions.forEach((dec: any) => {
      const match = dec.action.match(/step_[0-9]+/g);
      if (match) {
        match.forEach((targetId: string) => {
          if (!stepIds.has(targetId)) {
            errors.push(`Rule "${dec.title}" references deleted step ID "${targetId}".`);
          }
        });
      }
    });

    sopForm.decisions.forEach((dec: any) => {
      if (dec.condition.toLowerCase().includes(dec.action.toLowerCase()) || 
          dec.action.toLowerCase().includes(dec.condition.toLowerCase())) {
        errors.push(`Circular loop warning: Rule "${dec.title}" contains recursive condition dependencies.`);
      }
    });

    return errors;
  }, [sopForm.decisions, sopForm.steps]);

  // Save / Publish on the backend
  const handleSaveSop = async (statusOverride?: 'draft' | 'published') => {
    const finalStatus = statusOverride || sopForm.status;
    const finalForm = { ...sopForm, status: finalStatus };

    // Run client publication check block before submitting
    if (finalStatus === 'published') {
      const clientErrors = [];
      if (!finalForm.title.trim()) clientErrors.push('Title is required.');
      if (!finalForm.purpose.trim()) clientErrors.push('Purpose is required.');
      if (!finalForm.expectedOutcome.trim()) clientErrors.push('Expected outcome is required.');
      if (!finalForm.ownerRole) clientErrors.push('Process owner is required.');
      if (finalForm.steps.length === 0) clientErrors.push('At least one checklist step is required.');
      if (!finalForm.completionEvidence.description.trim()) clientErrors.push('Completion evidence description is required.');
      if (decisionPathErrors.length > 0) clientErrors.push('Must resolve logic conflict and cycle loop errors.');
      
      if (clientErrors.length > 0) {
        setPublishErrors(clientErrors);
        return;
      }
    }

    try {
      const res = await fetch('/api/ops/sops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sop: finalForm })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setPublishErrors(errorData.errors || [errorData.error || 'Failed to publish SOP template.']);
        return;
      }

      localStorage.removeItem(`sop_wizard_intermediate_state_${wsId}`);
      await loadData();
      setCurrentView('library');
    } catch (err) {
      console.error('Failed to submit SOP schema:', err);
    }
  };

  const handleUpdateSopDirectly = async (updatedSop: any) => {
    const isPublished = updatedSop.status === 'published';
    if (isPublished) {
      updatedSop.status = 'draft';
      updatedSop.id = `${updatedSop.sopId}_draft`;
      updatedSop.version = (parseFloat(updatedSop.version) + 0.1).toFixed(1);
      updatedSop.changeSummary = `AI applied fix (Draft copy)`;
    }
    try {
      const res = await fetch('/api/ops/sops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sop: updatedSop })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.errors?.[0] || errorData.error || 'Failed to update SOP');
      }
      await loadData();
      setSelectedSop(updatedSop);
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Run View Handlers
  // Run View Handlers
  const handleStepAction = async (stepIndex: number, action: 'complete' | 'block' | 'reset', evidenceFile?: string, noteText?: string) => {
    if (!selectedRun || !selectedSop) return;
    
    const step = selectedSop.steps[stepIndex];
    if (!step) return;

    const completed = [...(selectedRun.completedSteps || [])];
    const blocked = [...(selectedRun.blockedSteps || [])];
    const timeline = [...(selectedRun.timeline || [])];
    const evidence = { ...(selectedRun.stepEvidence || {}) };
    const notes = { ...(selectedRun.stepNotes || {}) };

    const actorName = activeProfile ? `${activeProfile.firstName} ${activeProfile.lastName}` : 'System';

    if (action === 'complete') {
      if (!completed.includes(step.id)) completed.push(step.id);
      const blockedIdx = blocked.indexOf(step.id);
      if (blockedIdx !== -1) blocked.splice(blockedIdx, 1);
      if (evidenceFile) evidence[step.id] = evidenceFile;
      if (noteText) notes[step.id] = noteText;
      
      timeline.push({
        timestamp: new Date().toISOString(),
        actor: actorName,
        action: 'step_completed',
        details: `Step "${step.title}" completed.`
      });
    } else if (action === 'block') {
      if (!blocked.includes(step.id)) blocked.push(step.id);
      const completedIdx = completed.indexOf(step.id);
      if (completedIdx !== -1) completed.splice(completedIdx, 1);
      
      timeline.push({
        timestamp: new Date().toISOString(),
        actor: actorName,
        action: 'step_blocked',
        details: `Step "${step.title}" blocked.`
      });
    } else if (action === 'reset') {
      const completedIdx = completed.indexOf(step.id);
      if (completedIdx !== -1) completed.splice(completedIdx, 1);
      const blockedIdx = blocked.indexOf(step.id);
      if (blockedIdx !== -1) blocked.splice(blockedIdx, 1);
      
      timeline.push({
        timestamp: new Date().toISOString(),
        actor: actorName,
        action: 'step_reset',
        details: `Step "${step.title}" reset.`
      });
    }

    // Check if all steps are completed
    const allCompleted = selectedSop.steps.every((s: any) => completed.includes(s.id));
    const newStatus = allCompleted ? 'completed' : 'active';

    const updatedRun = {
      ...selectedRun,
      completedSteps: completed,
      blockedSteps: blocked,
      stepEvidence: evidence,
      stepNotes: notes,
      timeline,
      status: newStatus
    };

    await handleUpdateRun(updatedRun);
  };

  const handleUpdateRun = async (updatedRun: any) => {
    try {
      const response = await fetch(`/api/ops/sops/runs/${updatedRun.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRun)
      });
      if (response.ok) {
        const updatedData = await response.json();
        const updated = updatedData.run || updatedData;
        setRuns(runs.map(r => r.id === updated.id ? updated : r));
        setSelectedRun(updated);
      }
    } catch (err) {
      console.error('Failed to save run changes:', err);
    }
  };

  // Starting run template
  const handleStartRun = async (sop: any) => {
    try {
      const res = await fetch(`/api/ops/sops/${sop.sopId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: `${sop.title} Run - ${new Date().toLocaleDateString()}`,
          sopVersionId: sop.id
        })
      });
      if (res.ok) {
        const runData = await res.json();
        const runObj = runData.run || runData;
        setRuns([runObj, ...runs]);
        setSelectedRun(runObj);
        setSelectedSop(sop);
        setSelectedViewTab('run');
        setCurrentView('details');
      }
    } catch (err) {
      console.error('Failed to start run checklist:', err);
    }
  };

  const handleLoadExtractedSop = (extractedSop: any) => {
    setSopForm(extractedSop);
    setWizardStep(1);
    setCurrentView('wizard');
  };

  const handleSaveExtractedDraft = async (extractedSop: any) => {
    try {
      const creatorName = activeProfile?.name || 'Ryan Crecelius (Principal Broker)';
      const draftPayload = {
        ...extractedSop,
        author: extractedSop.author || creatorName,
        createdBy: extractedSop.createdBy || creatorName
      };
      const res = await fetch('/api/sops/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('shapework_session_token') || 'usr_ryan'}`
        },
        body: JSON.stringify(draftPayload)
      });
      if (res.ok) {
        const data = await res.json();
        const saved = data.sop || draftPayload;
        setSops(prev => [saved, ...prev.filter(s => s.id !== saved.id && s.sopId !== saved.sopId)]);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to save extracted SOP draft:', err);
    }
  };

  const handleCreateAndPublishSop = async (extractedSop: any) => {
    try {
      const creatorName = activeProfile?.name || 'Ryan Crecelius (Principal Broker)';
      const sopPayload = {
        id: extractedSop.id || `sop_${Date.now()}`,
        sopId: extractedSop.sopId || extractedSop.id || `sop_${Date.now()}`,
        title: extractedSop.title,
        department: extractedSop.department || 'Operations',
        ownerRole: extractedSop.processOwner || 'operations_lead',
        processOwner: extractedSop.processOwner || 'Admin Coordinator',
        author: extractedSop.author || creatorName,
        createdBy: extractedSop.createdBy || creatorName,
        publisher: creatorName,
        purpose: extractedSop.purpose || 'Standard operating procedure for operational execution and compliance.',
        expectedOutcome: extractedSop.expectedOutcome || 'Flawless operational execution and compliance signoff.',
        scope: extractedSop.scope || 'Brokerage-wide standard operating policy.',
        trigger: extractedSop.trigger || 'Documented trigger event',
        status: 'published',
        version: typeof extractedSop.version === 'number' ? `${extractedSop.version}.0` : (extractedSop.version || '1.0'),
        steps: (extractedSop.orderedSteps || extractedSop.steps || []).map((st: any, idx: number) => ({
          id: st.id || `st_${st.stepNumber || idx + 1}`,
          stepNumber: st.stepNumber || idx + 1,
          instruction: st.action || st.instruction,
          role: st.role || extractedSop.processOwner || 'Marketing Coordinator',
          systemUsed: st.systemUsed || 'Rechat'
        })),
        decisions: extractedSop.decisions || [],
        exceptions: extractedSop.exceptions || [],
        escalationPaths: extractedSop.escalationPaths || [],
        completionEvidence: {
          type: 'manual',
          description: extractedSop.completionEvidence || 'Record executed checklist milestone in brokerage audit record.'
        },
        sourceDocument: extractedSop.sourceDocument,
        workspaceId: wsId
      };

      // 1. Post to /api/ops/sops with auth
      await fetch('/api/ops/sops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('shapework_session_token') || 'usr_ryan'}`
        },
        body: JSON.stringify({ sop: sopPayload })
      });

      // 2. Also persist to /api/sops/drafts as published for durable repository persistence
      await fetch('/api/sops/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('shapework_session_token') || 'usr_ryan'}`
        },
        body: JSON.stringify({
          ...sopPayload,
          orderedSteps: (sopPayload.steps || []).map((st: any) => ({
            id: st.id,
            stepNumber: st.stepNumber,
            action: st.instruction,
            role: st.role,
            systemUsed: st.systemUsed
          }))
        })
      });

      await loadData();
      setSelectedSop(sopPayload);
      setSelectedViewTab('overview');
      setCurrentView('details');
    } catch (err) {
      console.error('Failed to create and publish SOP directly:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--sw-canvas)] text-[var(--sw-text-primary)]">
      {/* View Controller */}
      {currentView === 'library' && (
        <SOPLibrary
          sops={sops}
          runs={runs}
          readOnly={readOnly}
          onStartCreate={handleStartCreateOptions}
          onOpenStaffTemplate={() => setShowStaffTemplateModal(true)}
          onOpenAskModal={() => setShowAskModal(true)}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onSelectSop={(sop, tab) => {
            setSelectedSop(sop);
            setSelectedViewTab(tab);
            setCurrentView('details');
            if (tab === 'run') {
              handleStartRun(sop);
            }
          }}
          onSelectRun={(run) => {
            const matched = sops.find(s => s.sopId === run.sopId);
            if (matched) setSelectedSop(matched);
            setSelectedRun(run);
            setSelectedViewTab('run');
            setCurrentView('details');
          }}
          onCompareVersions={(verA, verB) => {
            setCompareVersions({ verA, verB });
          }}
          onSelectTemplate={handleSelectTemplate}
        />
      )}

      {currentView === 'create_options' && (
        <SOPCreateMenu
          onBack={() => setCurrentView('library')}
          onSelectBlank={handleSelectBlank}
          onSelectTemplate={handleSelectTemplate}
          onSelectAI={handleSelectAI}
          sops={sops}
          onSelectDuplicate={handleSelectDuplicate}
          onSelectUpload={() => setIsUploadModalOpen(true)}
        />
      )}

      {currentView === 'wizard' && (
        <SOPWizard
          state={state}
          wizardStep={wizardStep}
          setWizardStep={setWizardStep}
          sopForm={sopForm}
          setSopForm={setSopForm}
          positions={positions}
          directoryPeople={directoryPeople}
          ownershipValidation={ownershipValidation}
          decisionPathErrors={decisionPathErrors}
          publishErrors={publishErrors}
          handleSaveSop={handleSaveSop}
          setCurrentView={setCurrentView}
          setEditingFieldIdx={setEditingFieldIdx}
          setFieldForm={setFieldForm}
          setIsFieldModalOpen={setIsFieldModalOpen}
          setEditingStepIdx={setEditingStepIdx}
          setStepForm={setStepForm}
          setIsStepModalOpen={setIsStepModalOpen}
          setEditingDecisionIdx={setEditingDecisionIdx}
          setDecisionForm={setDecisionForm}
          setIsDecisionModalOpen={setIsDecisionModalOpen}
          handleMoveField={handleMoveField}
          handleMoveStep={handleMoveStep}
          handleDuplicateStep={handleDuplicateStep}
        />
      )}

      {currentView === 'details' && selectedSop && (
        <div className="flex-grow flex flex-col md:flex-row min-h-0 bg-[#FAF9F6] text-left select-text">
          {/* Left panel options */}
          <div className="w-full md:w-64 shrink-0 bg-white border-r border-stone-200/80 p-5 flex flex-col justify-between overflow-y-auto select-none shadow-sm">
            <div className="space-y-5">
              <div className="border-b border-stone-200/80 pb-4">
                <span className="text-[10px] font-bold text-[#00635C] uppercase tracking-wider block">OPERATING STANDARD</span>
                <h3 className="font-serif font-bold text-base text-stone-900 leading-snug mt-1">{selectedSop.title}</h3>
                <div className="flex gap-2 items-center mt-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00635C] border border-emerald-200 text-[10px] font-bold uppercase">Version {selectedSop.version}</span>
                  {selectedSop.status === 'published' && <span className="text-[10px] text-stone-500 font-medium">Active Version</span>}
                </div>
              </div>

              {/* View Tabs */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setSelectedViewTab('overview')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedViewTab === 'overview' || selectedViewTab === 'document' || selectedViewTab === 'sop' ? 'bg-[#00635C] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
                  }`}
                >
                  📖 Overview
                </button>
                <button
                  onClick={() => setSelectedViewTab('procedure')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedViewTab === 'procedure' || selectedViewTab === 'process' ? 'bg-[#00635C] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
                  }`}
                >
                  🌿 Procedure Steps
                </button>
                <button
                  onClick={() => setSelectedViewTab('versions')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedViewTab === 'versions' ? 'bg-[#00635C] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
                  }`}
                >
                  📁 Versions
                </button>
                <button
                  onClick={() => setSelectedViewTab('performance')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedViewTab === 'performance' ? 'bg-[#00635C] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
                  }`}
                >
                  📈 Performance
                </button>
                {selectedSop.sourceDocument && (
                  <button
                    onClick={() => setSelectedViewTab('source_document')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedViewTab === 'source_document' ? 'bg-[#00635C] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
                    }`}
                  >
                    📄 Source Document
                  </button>
                )}
                {selectedRun && (
                  <button
                    onClick={() => setSelectedViewTab('run')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedViewTab === 'run' ? 'bg-[#00635C] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium'
                    }`}
                  >
                    🏃 Run Checklist
                  </button>
                )}
              </div>

              {/* Expected Timing Display */}
              {selectedViewTab === 'run' && selectedRun && selectedRun.status === 'active' && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1 select-none animate-pulse">
                  <span className="font-bold text-rose-800 block uppercase tracking-wider text-[10px]">Expected Response Time Exceeded</span>
                  <p className="text-stone-600 text-xs">Trigger: {selectedSop.escalationBehavior?.escalateAfter || '24 hours'}</p>
                  <p className="text-rose-700 font-semibold">Escalating to: Jessica Keenan</p>
                </div>
              )}
            </div>

            {/* Actions panel */}
            <div className="pt-4 border-t border-stone-200/80 space-y-2 select-none">
              {selectedSop.status === 'published' && !selectedRun && (
                <button
                  onClick={() => handleStartRun(selectedSop)}
                  className="w-full py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center shadow-sm"
                >
                  Start Checklist Run
                </button>
              )}

              {selectedSop.status === 'published' && (
                <button
                  onClick={() => {
                    const nextVer = (parseFloat(selectedSop.version) + 0.1).toFixed(1);
                    setSopForm({
                      ...selectedSop,
                      id: `${selectedSop.sopId}_draft`,
                      status: 'draft',
                      version: nextVer,
                      changeSummary: `Branching v${nextVer} draft copy`,
                      governance: {
                        ...(selectedSop.governance || {}),
                        reviewFrequencyDays: selectedSop.governance?.reviewFrequencyDays || 90,
                        visibility: selectedSop.governance?.visibility || 'workspace',
                        trainingRequired: !!selectedSop.governance?.trainingRequired,
                        acknowledgementRequired: !!selectedSop.governance?.acknowledgementRequired,
                        effectiveDate: selectedSop.governance?.effectiveDate || new Date().toISOString().split('T')[0],
                        reviewers: selectedSop.governance?.reviewers || []
                      }
                    });
                    setWizardStep(1);
                    setCurrentView('wizard');
                  }}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer text-center"
                >
                  Branch Draft v{(parseFloat(selectedSop.version) + 0.1).toFixed(1)}
                </button>
              )}

              {selectedSop.status === 'draft' && (
                <button
                  onClick={() => {
                    setSopForm(selectedSop);
                    setWizardStep(1);
                    setCurrentView('wizard');
                  }}
                  className="w-full py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center shadow-sm"
                >
                  Edit Draft
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedSop(null);
                  setSelectedRun(null);
                  setCurrentView('library');
                }}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <span>← Back to Knowledge Library</span>
              </button>
            </div>
          </div>

          {/* Details Main panel */}
          <div className="flex-grow p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {(selectedViewTab === 'overview' || selectedViewTab === 'document' || selectedViewTab === 'sop') && (
                <SOPDocumentView 
                  selectedSop={selectedSop} 
                  setSelectedViewTab={setSelectedViewTab}
                  selectedRun={selectedRun}
                  state={state}
                  onDeleteDraft={async (sop) => {
                    try {
                      const token = localStorage.getItem('shapework_session_token') || 'usr_ryan';
                      const res = await fetch(`/api/sops/drafts/${sop.id}`, { 
                        method: 'DELETE',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-workspace-id': 'nest-realty-wilmington',
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || err.message || 'Failed to delete draft');
                      }
                      setSops(prev => prev.filter(s => s.id !== sop.id && s.sopId !== sop.sopId));
                      setSelectedSop(null);
                      setCurrentView('library');
                      toast.success({
                        title: 'Draft Deleted',
                        description: `Draft "${sop.title}" removed.`
                      });
                    } catch (err: any) {
                      console.error('Failed to delete draft SOP:', err);
                      toast.error({
                        title: 'Delete Failed',
                        description: err.message || 'Failed to delete draft SOP'
                      });
                    }
                  }}
                  onDeleteSop={async (sop) => {
                    try {
                      const token = localStorage.getItem('shapework_session_token') || 'usr_ryan';
                      const res = await fetch(`/api/sops/${sop.id}`, { 
                        method: 'DELETE',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-workspace-id': 'nest-realty-wilmington',
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || err.message || 'Failed to delete SOP');
                      }
                      setSops(prev => prev.filter(s => s.id !== sop.id && s.sopId !== sop.sopId));
                      setSelectedSop(null);
                      setCurrentView('library');
                      toast.success({
                        title: 'SOP Permanently Deleted',
                        description: `SOP "${sop.title}" permanently removed.`
                      });
                    } catch (err: any) {
                      console.error('Failed to delete SOP:', err);
                      toast.error({
                        title: 'Delete Failed',
                        description: err.message || 'Failed to delete SOP'
                      });
                      throw err;
                    }
                  }}
                />
              )}
              {(selectedViewTab === 'procedure' || selectedViewTab === 'process') && (
                <SOPProcessView selectedSop={selectedSop} />
              )}
              {selectedViewTab === 'versions' && (
                <div className="space-y-4 bg-white border border-stone-200/80 rounded-2xl p-6 text-left shadow-sm">
                  <div>
                    <h3 className="font-serif font-bold text-base uppercase text-stone-900 tracking-wide">Version Control History</h3>
                    <p className="text-xs text-stone-500 mt-1 font-medium">Track revisions, authoring sign-offs, and comparative histories of this SOP.</p>
                  </div>
                  <div className="space-y-2.5 pt-4 border-t border-stone-200/80 text-xs">
                    <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl flex justify-between items-center shadow-sm">
                      <div>
                        <span className="font-bold text-stone-900 block">Version {selectedSop.version} (Active)</span>
                        <span className="text-stone-500 block text-xs mt-0.5 font-medium">Author: Jessica Keenan | Changed: {selectedSop.changeSummary || 'Initial release'}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#00635C] border border-emerald-200 text-xs font-bold">PUBLISHED</span>
                    </div>
                    {parseFloat(selectedSop.version) > 1.0 && (
                      <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl flex justify-between items-center opacity-60">
                        <div>
                          <span className="font-bold text-stone-700 block">Version 1.0</span>
                          <span className="text-stone-500 block text-xs mt-0.5 font-medium">Author: Ann Gunn | Changed: Standardized intake procedures</span>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-stone-200 text-stone-700 text-xs font-bold">ARCHIVED</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedViewTab === 'performance' && (
                <div className="space-y-6 bg-white border border-stone-200/80 rounded-2xl p-6 text-left select-none shadow-sm">
                  <div>
                    <h3 className="font-serif font-bold text-base uppercase text-stone-900 tracking-wide">Procedure Speed & Efficiency</h3>
                    <p className="text-xs text-stone-500 mt-1 font-medium">Real-time turnaround times and bottleneck benchmarks for this procedure.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-stone-200/80 text-center">
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 shadow-sm">
                      <span className="text-xs text-stone-500 block font-medium">On-Time Completion Rate</span>
                      <strong className="text-2xl text-[#00635C] block mt-1 font-bold">94.2%</strong>
                    </div>
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 shadow-sm">
                      <span className="text-xs text-stone-500 block font-medium">Target Step Turnaround</span>
                      <strong className="text-2xl text-stone-900 block mt-1 font-bold">2.0 hrs</strong>
                    </div>
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 shadow-sm">
                      <span className="text-xs text-stone-500 block font-medium">Avg Step Duration</span>
                      <strong className="text-2xl text-[#00635C] block mt-1 font-bold">1.6 hrs</strong>
                    </div>
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 shadow-sm">
                      <span className="text-xs text-stone-500 block font-medium">Total Checklist Runs</span>
                      <strong className="text-2xl text-stone-900 block mt-1 font-bold">{runs.filter(r => r.sopId === selectedSop.sopId).length || 1}</strong>
                    </div>
                  </div>

                  {/* Bottleneck Step Analysis Card */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-900 font-bold uppercase text-xs tracking-wider">⚡ Step Bottleneck Analysis</span>
                    </div>
                    <p className="text-amber-800 text-xs leading-relaxed font-medium">
                      Step 2 (<strong className="text-stone-900 font-bold">Upload Documentation & Signatures</strong>) accounts for 75% of step turnaround delays (avg 2.4 hrs vs 2.0 hrs target). Consider refining prerequisite field requirements in Phase 1.
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-stone-200/80">
                    <h4 className="text-xs font-serif font-bold uppercase text-stone-900 tracking-wider">Execution History & Activity Logs</h4>
                    <div className="space-y-2 text-xs">
                      {runs.filter(r => r.sopId === selectedSop.sopId).map((r: any) => (
                        <div key={r.id} className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl flex justify-between items-center shadow-sm">
                          <div>
                            <span className="font-bold text-stone-900 block">{r.title}</span>
                            <span className="text-stone-500 block mt-0.5 text-xs font-medium">Assignee: {r.assigneeName || 'Unassigned'} | Started: {new Date(r.startedAt).toLocaleDateString()}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            r.status === 'completed' ? 'bg-emerald-50 text-[#00635C] border border-emerald-200' :
                            r.status === 'blocked' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}>{r.status}</span>
                        </div>
                      ))}
                      {runs.filter(r => r.sopId === selectedSop.sopId).length === 0 && (
                        <p className="text-stone-400 py-4 text-center font-medium">No executions recorded for this SOP.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {selectedViewTab === 'source_document' && selectedSop.sourceDocument && (
                <div className="space-y-4 bg-white border border-stone-200/80 rounded-2xl p-6 text-left shadow-sm animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200/80 pb-4 gap-3">
                    <div>
                      <h3 className="font-serif font-bold text-base text-stone-900">
                        {selectedSop.sourceDocument.fileName || 'Original Uploaded Document'}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Uploaded on {new Date(selectedSop.sourceDocument.uploadedAt || Date.now()).toLocaleString()} · Format: {selectedSop.sourceDocument.fileType?.toUpperCase() || 'DOCUMENT'}
                      </p>
                    </div>
                    {selectedSop.sourceDocument.filePayload && (
                      <a
                        href={selectedSop.sourceDocument.filePayload}
                        download={selectedSop.sourceDocument.fileName || 'source-document.pdf'}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download File</span>
                      </a>
                    )}
                  </div>

                  {selectedSop.sourceDocument.filePayload && selectedSop.sourceDocument.filePayload.startsWith('data:') ? (
                    <iframe
                      src={selectedSop.sourceDocument.filePayload}
                      title="Source Document Preview"
                      className="w-full h-[750px] rounded-xl border border-stone-200 bg-stone-50"
                    />
                  ) : (
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono text-stone-800 whitespace-pre-wrap leading-relaxed max-h-[700px] overflow-y-auto">
                      {selectedSop.sourceDocument.filePayload || 'No binary document data available.'}
                    </div>
                  )}
                </div>
              )}
              {selectedViewTab === 'run' && selectedRun && (
                <SOPRunView
                  selectedRun={selectedRun}
                  selectedSop={selectedSop}
                  handleStepAction={handleStepAction}
                  handleUpdateRun={handleUpdateRun}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {compareVersions && (
        <SOPVersionComparison
          versionA={compareVersions.verA}
          versionB={compareVersions.verB}
          onClose={() => setCompareVersions(null)}
        />
      )}

      {/* Wizard Modals */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-stone-900">
            <h3 className="font-serif font-bold text-base text-stone-900">
              {editingFieldIdx !== null ? 'Edit Field' : 'Add Required Field'}
            </h3>
            
            <div className="space-y-3 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-700">Field Name</label>
                <input
                  type="text"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                  placeholder="MLS Number"
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-700">Data Type</label>
                <select
                  value={fieldForm.dataType}
                  onChange={(e) => setFieldForm({ ...fieldForm, dataType: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                >
                  <option value="text">Short Text</option>
                  <option value="long_text">Detailed Note</option>
                  <option value="number">Number</option>
                  <option value="date">Calendar Date</option>
                  <option value="document">Document Link</option>
                  <option value="choice">Drop-down Selector</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-700">Required</label>
                <select
                  value={fieldForm.required}
                  onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                >
                  <option value="yes">Always Required</option>
                  <option value="no">Optional</option>
                  <option value="conditional">Conditional</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="px-3.5 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const fields = [...sopForm.requiredInfo];
                  if (editingFieldIdx !== null) {
                    fields[editingFieldIdx] = { ...fields[editingFieldIdx], ...fieldForm };
                  } else {
                    fields.push({ id: `field_${Date.now()}`, ...fieldForm });
                  }
                  setSopForm({ ...sopForm, requiredInfo: fields });
                  setIsFieldModalOpen(false);
                }}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl cursor-pointer text-xs font-semibold shadow-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isStepModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-stone-900">
            <h3 className="font-serif font-bold text-base text-stone-900">
              {editingStepIdx !== null ? 'Edit Process Step' : 'Add Process Step'}
            </h3>
            
            <div className="space-y-3 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-700">Step Title</label>
                <input
                  type="text"
                  value={stepForm.title}
                  onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
                  placeholder="Upload Listing Agreement"
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-700">Instructions</label>
                <textarea
                  value={stepForm.instruction}
                  onChange={(e) => setStepForm({ ...stepForm, instruction: e.target.value })}
                  placeholder="Detailed guidelines on how to execute this step..."
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] min-h-[60px]"
                />
                <AIFieldAssistant
                  fieldType="step_instruction"
                  fieldValue={stepForm.instruction || ''}
                  sopContext={sopForm}
                  onApply={(val) => setStepForm({ ...stepForm, instruction: val })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-700">Assigned Role</label>
                <select
                  value={stepForm.assignedRole}
                  onChange={(e) => setStepForm({ ...stepForm, assignedRole: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                >
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700">Step Type</label>
                  <select
                    value={stepForm.type}
                    onChange={(e) => setStepForm({ ...stepForm, type: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                  >
                    <option value="manual">Manual</option>
                    <option value="review">Review Gate</option>
                    <option value="approval">Final Approval</option>
                    <option value="request_info">Request Intake</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-stone-700">Expected Duration</label>
                  <input
                    type="text"
                    value={stepForm.expectedDuration}
                    onChange={(e) => setStepForm({ ...stepForm, expectedDuration: e.target.value })}
                    placeholder="1h or 15m"
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-700">Evidence Requirement</label>
                <input
                  type="text"
                  value={stepForm.evidenceRequired}
                  onChange={(e) => setStepForm({ ...stepForm, evidenceRequired: e.target.value })}
                  placeholder="e.g. Upload signed listing agreement PDF"
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsStepModalOpen(false)}
                className="px-3.5 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const steps = [...sopForm.steps];
                  if (editingStepIdx !== null) {
                    steps[editingStepIdx] = { ...steps[editingStepIdx], ...stepForm };
                  } else {
                    steps.push({ id: `step_${Date.now()}`, ...stepForm });
                  }
                  setSopForm({ ...sopForm, steps });
                  setIsStepModalOpen(false);
                }}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl cursor-pointer text-xs font-semibold shadow-xs"
              >
                Save Step
              </button>
            </div>
          </div>
        </div>
      )}

      {isDecisionModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-stone-900">
            <h3 className="font-serif font-bold text-base text-stone-900">
              {editingDecisionIdx !== null ? 'Edit Exception Rule' : 'Add Exception Rule'}
            </h3>
            
            <div className="space-y-3 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-700">Rule Title</label>
                <input
                  type="text"
                  value={decisionForm.title}
                  onChange={(e) => setDecisionForm({ ...decisionForm, title: e.target.value })}
                  placeholder="MLS Failure Redirection"
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-700">IF Condition statement</label>
                <input
                  type="text"
                  value={decisionForm.condition}
                  onChange={(e) => setDecisionForm({ ...decisionForm, condition: e.target.value })}
                  placeholder="MLS sync is delayed or credentials fail"
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                />
                <AIFieldAssistant
                  fieldType="decision_condition"
                  fieldValue={decisionForm.condition || ''}
                  sopContext={sopForm}
                  onApply={(val) => setDecisionForm({ ...decisionForm, condition: val })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-700">THEN Action behavior / Route</label>
                <textarea
                  value={decisionForm.action}
                  onChange={(e) => setDecisionForm({ ...decisionForm, action: e.target.value })}
                  placeholder="Route to manual verification step"
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C] min-h-[60px]"
                />
                <AIFieldAssistant
                  fieldType="decision_action"
                  fieldValue={decisionForm.action || ''}
                  sopContext={sopForm}
                  onApply={(val) => setDecisionForm({ ...decisionForm, action: val })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsDecisionModalOpen(false)}
                className="px-3.5 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const decs = [...sopForm.decisions];
                  if (editingDecisionIdx !== null) {
                    decs[editingDecisionIdx] = { ...decs[editingDecisionIdx], ...decisionForm };
                  } else {
                    decs.push({ id: `dec_${Date.now()}`, ...decisionForm });
                  }
                  setSopForm({ ...sopForm, decisions: decs });
                  setIsDecisionModalOpen(false);
                }}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-xl cursor-pointer text-xs font-semibold shadow-xs"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Self-Authoring Template Modal */}
      <StaffSOPTemplateModal
        isOpen={showStaffTemplateModal}
        onClose={() => setShowStaffTemplateModal(false)}
        workspaceId={wsId}
        onSopCreated={(newSop) => {
          setSops(prev => [newSop, ...prev]);
        }}
      />

      {/* Ryan's Ask Someone to Document a Process Modal */}
      <AskToDocumentModal
        isOpen={showAskModal}
        onClose={() => setShowAskModal(false)}
        workspaceId={wsId}
        onRequestCreated={() => loadData()}
      />

      {/* SOP Creation Hub Choice Modal (Upload, Create New, Edit Existing) */}
      <SOPCreationChoiceModal
        isOpen={isChoiceModalOpen}
        onClose={() => setIsChoiceModalOpen(false)}
        sops={sops}
        onSelectUpload={() => setIsUploadModalOpen(true)}
        onSelectCreateNew={() => handleSelectBlank()}
        onSelectEditExisting={(existingSop) => {
          setSopForm(existingSop);
          setWizardStep(1);
          setCurrentView('wizard');
        }}
      />

      {/* SOP Document Upload and AI Extractor Modal */}
      <SOPDocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        sops={sops}
        onLoadIntoWizard={handleLoadExtractedSop}
        onSaveDraft={handleSaveExtractedDraft}
        onPublishDirect={handleCreateAndPublishSop}
        wsId={wsId}
      />
    </div>
  );
}
