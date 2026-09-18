import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  UserCheck, 
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Lock,
  User,
  ExternalLink,
  X,
  Plus,
  CornerDownRight,
  UserPlus,
  Send,
  HelpCircle,
  FileCode,
  ShieldAlert,
  Archive,
  ChevronRight
} from 'lucide-react';
import EmptyState from '../ui/EmptyState';

interface WorkQueueProps {
  state: any;
}

export default function WorkQueue({ state }: WorkQueueProps) {
  const {
    fetchState,
    activeProfile,
    auditEvents = [],
    profiles = []
  } = state;

  const workItems = (state.shapeworkJobs || []).map((job: any) => {
    const step = (state.shapeworkJobSteps || []).find((s: any) => s.jobId === job.id && s.id === job.currentStep)
               || (state.shapeworkJobSteps || []).filter((s: any) => s.jobId === job.id)[0];
    return {
      id: job.id,
      workspaceId: job.workspaceId,
      type: job.workflowKey || 'general',
      title: job.workflowName || job.requestText || 'Task',
      source: 'system',
      relatedType: 'transaction',
      relatedId: job.signalId || null,
      relatedLabel: job.requestText || '',
      ownerRole: step?.assignedRole || 'operations_lead',
      priority: job.ownerWorthy ? 'high' : 'medium',
      status: job.status === 'completed' ? 'completed' : 'pending',
      recommendedNextAction: step?.description || '',
      approvalRequired: job.humanReviewRequired || false,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    };
  });

  const getOwnerDisplay = (item: any) => {
    if (item.assignedStaffMemberId) {
      const p = profiles.find((x: any) => x.id === item.assignedStaffMemberId);
      if (p) {
        return { name: p.name, role: p.role, isUnassigned: p.status === 'inactive' };
      }
    }
    if (item.assignedOwnerName) {
      return { name: item.assignedOwnerName, role: item.assignedOwnerRole || item.ownerRole, isUnassigned: false };
    }
    const activeStaff = profiles.filter((p: any) => p.role === item.ownerRole && p.status !== 'inactive');
    if (activeStaff.length > 0) {
      return { name: activeStaff[0].name, role: item.ownerRole, isUnassigned: false };
    }
    return { name: 'Unassigned', role: item.ownerRole, isUnassigned: true };
  };

  const getBackupDisplay = (item: any) => {
    if (item.backupStaffMemberId) {
      const p = profiles.find((x: any) => x.id === item.backupStaffMemberId);
      if (p) {
        return { name: p.name, role: p.role, isUnassigned: p.status === 'inactive' };
      }
    }
    if (item.backupOwnerName) {
      return { name: item.backupOwnerName, role: item.backupOwnerRole || item.backupOwnerRole, isUnassigned: false };
    }
    const backupRole = item.backupOwnerRole || (item.ownerRole === 'owner' ? 'operations_lead' : 'owner');
    const activeStaff = profiles.filter((p: any) => p.role === backupRole && p.status !== 'inactive');
    if (activeStaff.length > 0) {
      return { name: activeStaff[0].name, role: backupRole, isUnassigned: false };
    }
    return { name: 'None', role: '', isUnassigned: true };
  };

  // Unified filters state
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Selection & Drawer states
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals inside drawer
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [approvalTitle, setApprovalTitle] = useState('');
  const [approvalDraft, setApprovalDraft] = useState('');
  const [reminderMethod, setReminderMethod] = useState<'email' | 'sms'>('email');

  // Detail drawer notes state
  const [noteText, setNoteText] = useState('');

  // Bulk actions forms state
  const [bulkOwner, setBulkOwner] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkNote, setBulkNote] = useState('');

  // Listen to keyboard ESC to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedItemId(null);
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live age counting timer state
  const [timeTick, setTimeTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeSitting = (createdAtStr: string, currentTick: number) => {
    if (!createdAtStr) return '00:00:00';
    const createdTime = new Date(createdAtStr).getTime();
    if (isNaN(createdTime)) return '00:00:00';
    
    const diffMs = Math.max(0, currentTick - createdTime);
    const totalSeconds = Math.floor(diffMs / 1000);
    
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);
    
    const pad = (num: number) => String(num).padStart(2, '0');
    
    const secStr = pad(seconds);
    const minStr = pad(minutes);
    const hrStr = pad(hours);
    
    if (days >= 1) {
      return `${pad(days)}:${hrStr}:${minStr}:${secStr}`;
    }
    return `${hrStr}:${minStr}:${secStr}`;
  };

  // Helper to map type to category
  const getItemCategory = (item: any): string => {
    const type = item.type?.toLowerCase() || '';
    const relatedType = item.relatedType?.toLowerCase() || '';
    const title = item.title?.toLowerCase() || '';

    if (type === 'compliance' || type.includes('compliance') || type.includes('risk') || type === 'missing_document') return 'compliance';
    if (type === 'marketing' || type.includes('marketing') || type.includes('request')) return 'marketing';
    if (type === 'transaction' || type.includes('transaction') || relatedType === 'transaction') return 'transactions';
    if (type === 'office_signage' || type.includes('office') || type.includes('sign') || type.includes('facilities') || type.includes('supplies')) return 'office_signage';
    if (type === 'finance' || type.includes('finance') || type.includes('commission') || type.includes('payment') || title.includes('commission')) return 'finance';
    if (type === 'integration' || type.includes('integration') || type.includes('sync_error')) return 'integrations';
    
    if (relatedType === 'compliance') return 'compliance';
    if (relatedType === 'marketing') return 'marketing';
    if (relatedType === 'transaction') return 'transactions';
    if (relatedType === 'office_signage' || relatedType === 'office' || relatedType === 'signage') return 'office_signage';
    if (relatedType === 'finance') return 'finance';
    if (relatedType === 'integration') return 'integrations';
    
    return 'general';
  };

  // Filter list
  const filteredList = workItems.filter((item: any) => {
    // Exclude completed items from other views
    if (activeFilter !== 'completed' && item.status === 'completed') return false;

    if (activeFilter === 'mine') {
      return item.assignedStaffMemberId === activeProfile?.id || item.ownerRole === activeProfile?.role;
    }
    if (activeFilter === 'leadership') {
      const cat = getItemCategory(item);
      return cat === 'general' || item.ownerRole === 'regional_leader' || item.ownerRole === 'platform_admin' || (item.title || '').toLowerCase().includes('ryan');
    }
    if (activeFilter === 'compliance') {
      const cat = getItemCategory(item);
      return cat === 'compliance' || cat === 'transactions';
    }
    if (activeFilter === 'accounting') {
      return getItemCategory(item) === 'finance';
    }
    if (activeFilter === 'marketing') {
      return getItemCategory(item) === 'marketing';
    }
    if (activeFilter === 'operations') {
      return getItemCategory(item) === 'office_signage';
    }
    if (activeFilter === 'triage') {
      return !item.assignedStaffMemberId && !item.ownerRole;
    }
    if (activeFilter === 'overdue') {
      return item.status === 'overdue' || item.priority === 'critical';
    }
    if (activeFilter === 'needs_approval') {
      return item.approvalRequired === true || item.status === 'needs_approval';
    }
    if (activeFilter === 'blocked') {
      return item.status === 'blocked';
    }
    if (activeFilter === 'completed') {
      return item.status === 'completed';
    }
    return true;
  });

  const selectedItem = workItems.find((w: any) => w.id === selectedItemId);

  // Clear batch selection on filter change
  useEffect(() => {
    setSelectedItemIds([]);
  }, [activeFilter]);

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/work-items/${itemId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          userName: activeProfile?.name || 'Operations Lead',
          userRole: activeProfile?.role || 'operations_lead'
        })
      });
      if (res.ok) {
        await fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDetailFields = async (fields: any) => {
    if (!selectedItemId) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/work-items/${selectedItemId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          userName: activeProfile?.name || 'Operations Lead',
          userRole: activeProfile?.role || 'operations_lead'
        })
      });
      if (res.ok) {
        await fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await handleSaveDetailFields({ notes: noteText });
    setNoteText('');
  };

  const handleEscalate = async () => {
    const ownerPerson = profiles.find((p: any) => p.role === 'owner' && p.status !== 'inactive');
    await handleSaveDetailFields({
      isEscalated: true,
      ownerRole: 'owner',
      assignedStaffMemberId: ownerPerson ? ownerPerson.id : null,
      priority: 'owner_worthy'
    });
  };

  const handleCreateApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !approvalTitle.trim() || !approvalDraft.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/action/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: approvalTitle,
          draftContent: approvalDraft,
          transactionId: selectedItem.relatedId,
          propertyAddress: selectedItem.relatedLabel,
          actionType: 'outbound_approval'
        })
      });
      if (res.ok) {
        await handleSaveDetailFields({
          status: 'needs_approval',
          notes: `Created approval request: "${approvalTitle}"`
        });
        setShowApprovalModal(false);
        setApprovalTitle('');
        setApprovalDraft('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendReminder = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      const recipient = profiles.find((p: any) => p.role === selectedItem.ownerRole && p.status === 'active');
      if (!recipient) {
        alert('No active staff member found for this role.');
        setIsProcessing(false);
        return;
      }

      const res = await fetch('/api/notifications/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: recipient.id,
          actionType: 'complete_work_item',
          workItemId: selectedItem.id,
          contextText: `Gentle Reminder: A task "${selectedItem.title}" requires your action.`
        })
      });

      if (res.ok) {
        await handleSaveDetailFields({
          notes: `Sent ${reminderMethod} reminder chaser to ${recipient.name}.`
        });
        setShowReminderModal(false);
      } else {
        alert('Failed to send reminder. Cooldown may be active.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Safe Bulk Operations
  const handleBulkAction = async () => {
    if (selectedItemIds.length === 0) return;
    setIsProcessing(true);
    try {
      for (const id of selectedItemIds) {
        const payload: any = {};
        if (bulkOwner) payload.ownerRole = bulkOwner;
        if (bulkStatus) payload.status = bulkStatus;
        if (bulkNote) payload.notes = bulkNote;

        await fetch(`/api/work-items/${id}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            userName: activeProfile?.name || 'Operations Lead',
            userRole: activeProfile?.role || 'operations_lead'
          })
        });
      }
      setSelectedItemIds([]);
      setBulkOwner('');
      setBulkStatus('');
      setBulkNote('');
      await fetchState();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === filteredList.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredList.map(item => item.id));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'owner_worthy':
        return 'bg-rose-50 text-rose-800 border border-rose-200';
      case 'high':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      case 'medium':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      default:
        return 'bg-stone-100 text-stone-700 border border-stone-200';
    }
  };

  // Unified filters definition
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'mine', label: 'Mine' },
    { id: 'leadership', label: 'Ryan / Leadership' },
    { id: 'compliance', label: 'BIC / Compliance' },
    { id: 'accounting', label: 'Accounting' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'operations', label: 'Operations' },
    { id: 'triage', label: 'Triage' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'needs_approval', label: 'Needs Approval' },
    { id: 'blocked', label: 'Blocked' },
    { id: 'completed', label: 'Completed' }
  ];

  // Audit event logs related to the selected item
  const relatedAudits = selectedItem ? auditEvents.filter((a: any) => 
    a.action_description?.toLowerCase().includes(selectedItem.id.toLowerCase()) ||
    a.action_description?.toLowerCase().includes(selectedItem.title.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6 font-sans text-xs text-[var(--sw-text-primary)] select-text text-left relative">
      
      {/* Title */}
      <div className="border-b border-[var(--sw-border)] pb-4 flex justify-between items-center select-none">
        <div>
          <h1 className="text-xl font-bold text-[var(--sw-text-primary)] tracking-tight">Work Queue</h1>
          <p className="mt-1 text-[var(--sw-text-secondary)] font-medium font-sans">Everything shapework is routing, tracking, or waiting on for active tenant workspaces.</p>
        </div>
      </div>

      {/* Unified Filters Toolbar */}
      <div className="flex flex-wrap gap-1.5 border-b border-[var(--sw-border)] pb-4 select-none">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeFilter === filter.id
                ? 'bg-[#00635C] border-[#00635C] text-white font-bold shadow-xs'
                : 'bg-[var(--sw-surface)] border-[var(--sw-border)] text-[var(--sw-text-secondary)] hover:text-[var(--sw-text-primary)] hover:bg-[var(--sw-canvas)]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedItemIds.length > 0 && (
        <div 
          className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 animate-fade-in select-none"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.15)'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00635C] animate-pulse" />
            <span className="font-bold text-white text-[11px]">{selectedItemIds.length} tasks selected for bulk editing</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[10px] text-[#D0D6BB]">Assign Owner:</span>
              <select
                value={bulkOwner}
                onChange={(e) => setBulkOwner(e.target.value)}
                className="p-1.5 border border-[rgba(246,247,241,0.18)] rounded-lg bg-[#01362D] text-[#F6F7F1] text-[10px]"
              >
                <option value="">-- No change --</option>
                <option value="owner">Owner</option>
                <option value="operations_lead">Operations Lead</option>
                <option value="transaction_coordinator">Transaction Coordinator</option>
                <option value="marketing_coordinator">Marketing Coordinator</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[10px] text-[#D0D6BB]">Status:</span>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="p-1.5 border border-[rgba(246,247,241,0.18)] rounded-lg bg-[#01362D] text-[#F6F7F1] text-[10px]"
              >
                <option value="">-- No change --</option>
                <option value="pending">Pending</option>
                <option value="deferred">Deferred</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Bulk note comment..."
              value={bulkNote}
              onChange={(e) => setBulkNote(e.target.value)}
              className="p-1.5 border border-[rgba(246,247,241,0.18)] rounded-lg bg-[#01362D] text-[#F6F7F1] text-[10px] w-48 text-xs font-sans placeholder-[rgba(246,247,241,0.35)] focus:outline-none focus:border-emerald-500/50"
            />

            <button
              onClick={handleBulkAction}
              disabled={isProcessing}
              className="py-1.5 px-3.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: List of triage cards */}
      <div className="rounded-[20px] overflow-hidden shadow-xs bg-[var(--sw-surface)] border border-[var(--sw-border)]">
        <table className="w-full text-left table-fixed">
          <thead className="bg-[var(--sw-canvas)] border-b border-[var(--sw-border)] text-[10px] font-bold text-[var(--sw-text-secondary)] uppercase tracking-wider select-none">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedItemIds.length === filteredList.length && filteredList.length > 0}
                  onChange={toggleSelectAll}
                  className="cursor-pointer"
                />
              </th>
              <th className="p-3 w-1/3">Task Details</th>
              <th className="p-3">Category</th>
              <th className="p-3">Assigned Person</th>
              <th className="p-3">Due Date</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Source</th>
              <th className="p-3">Time Sitting</th>
              <th className="p-3 text-right pr-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--sw-border)]">
            {filteredList.map((item) => (
              <tr 
                key={item.id} 
                className={`hover:bg-[var(--sw-canvas)] cursor-pointer transition-all duration-150 ${selectedItemId === item.id ? 'bg-emerald-50/60' : ''}`}
                onClick={() => {
                  setSelectedItemId(item.id);
                  setIsDrawerOpen(true);
                }}
              >
                <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedItemIds.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                    className="cursor-pointer"
                  />
                </td>
                <td className="py-3 px-3 font-semibold text-[var(--sw-text-primary)]">
                  <div className="space-y-0.5">
                    <span className="block truncate font-bold text-[var(--sw-text-primary)]">{item.title}</span>
                    <span className="text-[10px] text-[var(--sw-text-secondary)] block font-normal truncate">{item.relatedLabel || 'Workspace Global'}</span>
                  </div>
                </td>
                <td className="py-3 px-3 capitalize font-medium text-[10px] text-[var(--sw-text-secondary)]">
                  {getItemCategory(item).replace('_', ' ')}
                </td>
                <td className="py-3 px-3">
                  {(() => {
                    const owner = getOwnerDisplay(item);
                    if (owner.isUnassigned) {
                      return (
                        <div className="space-y-1">
                          <span className="font-bold text-rose-700">Unassigned</span>
                          <span className="block text-[8px] px-1.5 py-0.5 bg-rose-50 text-rose-800 rounded border border-rose-200 font-mono uppercase font-bold w-max">
                            {owner.role.replace(/_/g, ' ')} needed
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-0.5 text-[var(--sw-text-primary)]">
                        <span className="font-bold text-[var(--sw-text-primary)]">{owner.name}</span>
                        <span className="block text-[9px] text-[var(--sw-text-secondary)] font-mono capitalize">
                          {owner.role.replace(/_/g, ' ')}
                        </span>
                      </div>
                    );
                  })()}
                </td>
                <td className="py-3 px-3 font-mono font-medium text-[10px] text-[var(--sw-text-secondary)]">
                  {item.dueDate || '12 Hrs standard'}
                </td>
                <td className="py-3 px-3">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                </td>
                <td className="py-3 px-3 text-[var(--sw-text-secondary)] truncate capitalize font-mono text-[10px]">{item.sourceSystem || item.source || 'System'}</td>
                <td className="py-3 px-3 text-[#00635C] font-mono text-[10px] font-bold tracking-wider">{formatTimeSitting(item.createdAt, timeTick)}</td>
                <td className="py-3 px-3 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setIsDrawerOpen(true);
                    }}
                    className="px-3 py-1 bg-[var(--sw-canvas)] border border-[var(--sw-border)] hover:bg-stone-100 text-[var(--sw-text-primary)] rounded-lg text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
            {filteredList.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8">
                  <EmptyState
                    icon={Inbox}
                    title="No tasks match filter criteria"
                    description="Your filter results are clean. Adjust parameters or tabs to view other active brokerage records."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL DRAWER OVERLAY */}
      {isDrawerOpen && selectedItem && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex justify-end animate-fade-in select-none">
          <div className="w-full max-w-xl bg-[var(--sw-surface)] h-full shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto animate-slide-left text-left select-text relative border-l border-[var(--sw-border)] text-[var(--sw-text-primary)]">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-start border-b border-[var(--sw-border)] pb-4">
              <div className="space-y-1">
                <span className="font-mono font-bold text-[9px] text-[var(--sw-text-secondary)] uppercase tracking-wider block">Work Item Operations Panel</span>
                <h3 className="font-serif font-black text-[var(--sw-text-primary)] text-sm leading-snug">{selectedItem.title}</h3>
                <p className="text-[10px] text-[var(--sw-text-secondary)]">
                  ID: <span className="font-mono">{selectedItem.id}</span> · Created: {new Date(selectedItem.createdAt).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 hover:bg-[var(--sw-canvas)] rounded-lg transition-all cursor-pointer border border-transparent hover:border-[var(--sw-border)] text-[var(--sw-text-secondary)] hover:text-[var(--sw-text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic details */}
            <div className="grid grid-cols-2 gap-4 text-[11px] bg-[var(--sw-canvas)] p-4 rounded-[20px] border border-[var(--sw-border)] text-[var(--sw-text-primary)]">
              <div>
                <span className="text-[9px] text-[var(--sw-text-secondary)] font-bold uppercase block">Assigned Owner</span>
                {(() => {
                  const owner = getOwnerDisplay(selectedItem);
                  return (
                    <div className="space-y-0.5 mt-0.5">
                      <span className={`font-bold ${owner.isUnassigned ? 'text-rose-700' : 'text-[var(--sw-text-primary)]'}`}>{owner.name}</span>
                      <span className="block text-[9px] text-[var(--sw-text-secondary)] font-mono capitalize">{owner.role.replace(/_/g, ' ')}</span>
                    </div>
                  );
                })()}
              </div>
              <div>
                <span className="text-[9px] text-[var(--sw-text-secondary)] font-bold uppercase block">Backup Owner</span>
                {(() => {
                  const backup = getBackupDisplay(selectedItem);
                  return (
                    <div className="space-y-0.5 mt-0.5">
                      <span className="font-bold text-[var(--sw-text-primary)]">{backup.name}</span>
                      {backup.role && <span className="block text-[9px] text-[var(--sw-text-secondary)] font-mono capitalize">{backup.role.replace(/_/g, ' ')}</span>}
                    </div>
                  );
                })()}
              </div>
              <div className="border-t border-[var(--sw-border)] pt-2.5">
                <span className="text-[9px] text-[var(--sw-text-secondary)] font-bold uppercase block">Source System</span>
                <span className="font-mono text-[var(--sw-text-primary)] capitalize">{selectedItem.sourceSystem || selectedItem.source || 'System'}</span>
              </div>
              <div className="border-t border-[var(--sw-border)] pt-2.5">
                <span className="text-[9px] text-[var(--sw-text-secondary)] font-bold uppercase block">Target Due Date</span>
                <span className="font-mono text-[var(--sw-text-primary)]">{selectedItem.dueDate || '12 Hrs standard'}</span>
              </div>
              <div className="border-t border-[var(--sw-border)] pt-2.5 col-span-2 flex justify-between">
                <div>
                  <span className="text-[9px] text-[var(--sw-text-secondary)] font-bold uppercase block">Related Record</span>
                  <span className="font-bold text-[var(--sw-text-primary)]">{selectedItem.relatedLabel || 'Workspace Global'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[var(--sw-text-secondary)] font-bold uppercase block text-right">Priority Level</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase block mt-1 text-center ${getPriorityColor(selectedItem.priority)}`}>
                    {selectedItem.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Recommended next action */}
            <div className="space-y-1 bg-[rgba(0,99,92,0.15)] border border-[rgba(0,99,92,0.3)] p-4 rounded-xl text-white">
              <span className="font-bold text-[#D0D6BB] text-[10px] uppercase tracking-wider block">Recommended Next Action</span>
              <p className="text-xs leading-relaxed font-medium">
                {selectedItem.recommendedNextAction || 'Review active document and confirm checklist compliance criteria.'}
              </p>
            </div>

            {/* Audit log trail for this task */}
            <div className="space-y-2">
              <span className="font-bold text-white text-[10px] uppercase tracking-wider block">Related Audit Log Trail</span>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {relatedAudits.map((a: any) => (
                  <div key={a.id} className="p-2 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-lg text-[9px] flex justify-between gap-4 font-mono text-[#D0D6BB]">
                    <span className="text-white truncate">{a.action_description}</span>
                    <span className="text-[#D0D6BB]/70 text-right whitespace-nowrap">{new Date(a.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
                {relatedAudits.length === 0 && (
                  <p className="text-[10px] text-[#D0D6BB] italic">No recent audit log operations captured for this record.</p>
                )}
              </div>
            </div>

            {/* Notes history log */}
            <div className="space-y-2">
              <span className="font-bold text-white text-[10px] uppercase tracking-wider block">Operator Activity Notes</span>
              
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                {(selectedItem.notes || []).map((n: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-lg text-[10px]">
                    <div className="flex justify-between items-center select-none">
                      <strong className="text-white">{n.author}</strong>
                      <span className="text-[8px] text-[#D0D6BB]/70 font-mono">{new Date(n.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-[#D0D6BB] mt-1 font-medium">{n.text}</p>
                  </div>
                ))}
                {(!selectedItem.notes || selectedItem.notes.length === 0) && (
                  <p className="text-[10px] text-[#D0D6BB]/70 italic select-none font-medium">No custom operator notes added to this task.</p>
                )}
              </div>

              {/* Add note form */}
              <form onSubmit={handleAddNote} className="flex gap-2 select-none">
                <input
                  type="text"
                  placeholder="Type an activity note comment..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1 p-2 border border-[rgba(246,247,241,0.18)] rounded-xl text-xs bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 placeholder-[rgba(246,247,241,0.3)]"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !noteText.trim()}
                  className="py-1 px-3.5 bg-[rgba(246,247,241,0.08)] border border-[rgba(246,247,241,0.18)] hover:bg-[rgba(246,247,241,0.15)] text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Add Note
                </button>
              </form>
            </div>

            {/* Gated approval notice */}
            {selectedItem.approvalRequired && selectedItem.status !== 'completed' && (
              <div className="bg-amber-950/40 border border-amber-800 p-4 rounded-xl flex gap-3 select-none">
                <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-[10px] block">Gated Approval Required</span>
                  <span className="text-[10px] text-amber-250 leading-normal block">
                    Outbound communications and system writebacks are locked. Manual signoff is required.
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons drawer footer */}
            <div className="border-t border-[#e4decb] pt-4 space-y-4 select-none">
              
              {/* Primary Actions row */}
              <div className="flex flex-wrap gap-2 items-center">
                {selectedItem.status === 'completed' ? (
                  <div className="flex items-center gap-1.5 text-green-700 font-bold py-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Task Completed</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedItem.id, 'completed')}
                      disabled={isProcessing}
                      className="py-2 px-4 bg-[#18382b] hover:bg-[#1f4938] text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                    >
                      {selectedItem.approvalRequired ? 'Approve & Release' : 'Complete Task'}
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(selectedItem.id, 'deferred')}
                      disabled={isProcessing}
                      className="py-2 px-3.5 bg-white border border-[#e4decb] hover:bg-[#fcfbf7] text-[#4b5563] font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Defer Task
                    </button>

                    {selectedItem.ownerRole !== 'owner' && (
                      <button
                        onClick={handleEscalate}
                        disabled={isProcessing}
                        className="py-2 px-3.5 bg-red-50 hover:bg-red-100/70 text-red-700 border border-red-200 font-bold rounded-xl text-xs cursor-pointer ml-auto"
                      >
                        Escalate to Owner
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Extended Actions Row (Approval generation and reminders) */}
              {selectedItem.status !== 'completed' && (
                <div className="flex gap-2 border-t border-stone-100 pt-3">
                  <button
                    onClick={() => {
                      setApprovalTitle(`Approval: Resolve ${selectedItem.title}`);
                      setApprovalDraft(`The system is requesting formal approval to write back resolved data for task: "${selectedItem.title}".`);
                      setShowApprovalModal(true);
                    }}
                    className="py-1.5 px-3 bg-white border border-[#e4decb] hover:bg-[#eaf2ee]/20 hover:border-[#18382b] text-[#18382b] font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Approval Request</span>
                  </button>

                  <button
                    onClick={() => setShowReminderModal(true)}
                    className="py-1.5 px-3 bg-white border border-[#e4decb] hover:bg-stone-50 text-text-secondary font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-text-tertiary" />
                    <span>Send Reminder Nudge</span>
                  </button>
                </div>
              )}

              {/* Inline fields modifiers */}
              {selectedItem.status !== 'completed' && (
                <div className="space-y-3 border-t border-[rgba(246,247,241,0.12)] pt-3">
                  <span className="text-[10px] font-bold text-[#D0D6BB] uppercase block">Triage Options</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#D0D6BB] font-bold uppercase block">Reassign Staff Member</label>
                      <select
                        value={selectedItem.assignedStaffMemberId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const p = profiles.find((x: any) => x.id === val);
                          handleSaveDetailFields({
                            assignedStaffMemberId: val || null,
                            ownerRole: p ? p.role : selectedItem.ownerRole
                          });
                        }}
                        className="w-full p-1.5 border border-[rgba(246,247,241,0.18)] rounded-lg bg-[#01362D] text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Unassigned --</option>
                        {profiles.filter((p: any) => p.status !== 'inactive').map((p: any) => (
                          <option key={p.id} value={p.id} className="bg-[#01362D] text-white">
                            {p.name} ({p.role.replace(/_/g, ' ')})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[#D0D6BB] font-bold uppercase block">Set Backup Staff</label>
                      <select
                        value={selectedItem.backupStaffMemberId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const p = profiles.find((x: any) => x.id === val);
                          handleSaveDetailFields({
                            backupStaffMemberId: val || null,
                            backupOwnerRole: p ? p.role : selectedItem.backupOwnerRole
                          });
                        }}
                        className="w-full p-1.5 border border-[rgba(246,247,241,0.18)] rounded-lg bg-[#01362D] text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- No Backup --</option>
                        {profiles.filter((p: any) => p.status !== 'inactive').map((p: any) => (
                          <option key={p.id} value={p.id} className="bg-[#01362D] text-white">
                            {p.name} ({p.role.replace(/_/g, ' ')})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#D0D6BB] font-bold uppercase block">Change Priority</label>
                      <select
                        value={selectedItem.priority}
                        onChange={(e) => handleSaveDetailFields({ priority: e.target.value })}
                        className="w-full p-1.5 border border-[rgba(246,247,241,0.18)] rounded-lg bg-[#01362D] text-white text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="owner_worthy" className="bg-[#01362D] text-white">Owner-worthy</option>
                        <option value="critical" className="bg-[#01362D] text-white">Critical</option>
                        <option value="high" className="bg-[#01362D] text-white">High</option>
                        <option value="medium" className="bg-[#01362D] text-white">Medium</option>
                        <option value="low" className="bg-[#01362D] text-white">Low</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[#D0D6BB] font-bold uppercase block">Change Due Date</label>
                      <input
                        type="text"
                        value={selectedItem.dueDate || ''}
                        onChange={(e) => handleSaveDetailFields({ dueDate: e.target.value })}
                        placeholder="e.g. 24 Hrs standard"
                        className="w-full p-1.5 border border-[rgba(246,247,241,0.18)] rounded-lg bg-[#01362D] text-white text-xs placeholder-[rgba(246,247,241,0.3)] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* INLINE MODAL: Create Approval Proposal */}
            {showApprovalModal && (
              <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
                <div className="bg-[#01362D] border border-[rgba(246,247,241,0.18)] rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl select-text text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-[rgba(246,247,241,0.12)]">
                    <h4 className="font-serif font-black text-sm text-white">Propose Approval Request</h4>
                    <button 
                      onClick={() => setShowApprovalModal(false)}
                      className="p-1 hover:bg-[rgba(246,247,241,0.08)] rounded-lg border border-transparent hover:border-[rgba(246,247,241,0.18)]"
                    >
                      <X className="w-4 h-4 text-[#D0D6BB]" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateApproval} className="space-y-3 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-[#D0D6BB] block">Proposal Title</label>
                      <input
                        type="text"
                        required
                        value={approvalTitle}
                        onChange={(e) => setApprovalTitle(e.target.value)}
                        className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-lg focus:outline-none focus:border-emerald-500/50 bg-[#01362D] text-white text-xs font-sans font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#D0D6BB] block">Draft / Payload Content</label>
                      <textarea
                        required
                        value={approvalDraft}
                        onChange={(e) => setApprovalDraft(e.target.value)}
                        className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-lg focus:outline-none focus:border-emerald-500/50 bg-[#01362D] text-white text-xs font-sans font-medium"
                        rows={4}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer text-center transition-colors"
                    >
                      Propose to Owner &rarr;
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* INLINE MODAL: Send Reminder Nudge */}
            {showReminderModal && (
              <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
                <div className="bg-[#01362D] border border-[rgba(246,247,241,0.18)] rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl select-text text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-[rgba(246,247,241,0.12)]">
                    <h4 className="font-serif font-black text-sm text-white">Send Reminder Nudge</h4>
                    <button 
                      onClick={() => setShowReminderModal(false)}
                      className="p-1 hover:bg-[rgba(246,247,241,0.08)] rounded-lg border border-transparent hover:border-[rgba(246,247,241,0.18)]"
                    >
                      <X className="w-4 h-4 text-[#D0D6BB]" />
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    <p className="text-[11px] text-[#D0D6BB] leading-normal font-medium">
                      Select delivery channel for the gentle secure link reminder chaser.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setReminderMethod('email')}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                          reminderMethod === 'email'
                            ? 'bg-[#00635C] text-white border-[rgba(246,247,241,0.22)] shadow-sm'
                            : 'border-[rgba(246,247,241,0.18)] text-[#D0D6BB] hover:bg-[rgba(246,247,241,0.08)]'
                        }`}
                      >
                        Email Channel
                      </button>
                      <button
                        type="button"
                        onClick={() => setReminderMethod('sms')}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                          reminderMethod === 'sms'
                            ? 'bg-[#00635C] text-white border-[rgba(246,247,241,0.22)] shadow-sm'
                            : 'border-[rgba(246,247,241,0.18)] text-[#D0D6BB] hover:bg-[rgba(246,247,241,0.08)]'
                        }`}
                      >
                        SMS Text Channel
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendReminder}
                      disabled={isProcessing}
                      className="w-full py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer text-center transition-colors"
                    >
                      Send Nudge Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
