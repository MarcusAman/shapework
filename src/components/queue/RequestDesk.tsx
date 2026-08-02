import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Mail, 
  MessageSquare, 
  Globe, 
  User, 
  AlertCircle, 
  Send, 
  CheckCircle, 
  UserCheck, 
  Zap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useOperatingMemoryStore } from '../../state/operatingMemoryStore';
import { createAuditEvent } from '../../utils/audit';

export default function RequestDesk() {
  const { agentRequests, setAgentRequests, secureLinks } = useOperatingMemoryStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'needs_clarification' | 'in_progress' | 'waiting_on_agent' | 'escalated' | 'completed'>('all');
  const [selectedId, setSelectedId] = useState<string>('req_vague_mktg');
  const [clarificationDraft, setClarificationDraft] = useState<string>('');

  const selectedRequest = agentRequests.find(r => r.id === selectedId) || agentRequests[0];

  useEffect(() => {
    if (selectedRequest) {
      // Find matching secure link if available
      const matchingLink = secureLinks.find(l => l.relatedRecordId === selectedRequest.id);
      if (matchingLink && selectedRequest.status === 'new') {
        setClarificationDraft(`Hi ${selectedRequest.requesterName}, we received your promo request. Please clarify the details here: ${window.location.origin}/link/clarify/${matchingLink.token}`);
      } else {
        setClarificationDraft(
          selectedRequest.status === 'waiting_on_agent'
            ? `Reminder nudge: Please submit the missing details here: ${window.location.origin}/link/clarify/clarify_todd_mktg`
            : `Hi ${selectedRequest.requesterName}, I saw your request. Could you clarify which property address this is for, and your desired launch date?`
        );
      }
    }
  }, [selectedId, selectedRequest, secureLinks]);

  const filteredRequests = agentRequests.filter(req => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'in_progress') return req.status === 'in_progress' || req.status === 'routed';
    return req.status === activeFilter;
  });

  const handleUpdateStatus = (id: string, nextStatus: typeof agentRequests[0]['status'], note: string) => {
    setAgentRequests(prev => prev.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status: nextStatus,
          auditEvents: [...(req.auditEvents || []), `${note} at ${new Date().toLocaleTimeString()}`]
        };
      }
      return req;
    }));
  };

  const handleSendClarification = () => {
    if (!clarificationDraft.trim()) return;
    alert(`Clarification nudge dispatched to ${selectedRequest.requesterName}: "${clarificationDraft}"`);
    handleUpdateStatus(selectedRequest.id, 'waiting_on_agent', 'Clarification nudge sent to agent');
  };

  const handleRouteToTeam = (id: string, team: string, owner: string) => {
    alert(`Request routed to ${team} (${owner})`);
    handleUpdateStatus(id, 'routed', `Routed to ${team} under ${owner}`);
  };

  const getSourceIcon = (source: typeof agentRequests[0]['source']) => {
    switch (source) {
      case 'sms': return <MessageSquare className="w-3.5 h-3.5 text-brand-primary" />;
      case 'email': return <Mail className="w-3.5 h-3.5 text-text-secondary" />;
      case 'secure_link': return <Globe className="w-3.5 h-3.5 text-brand-primary" />;
      default: return <User className="w-3.5 h-3.5 text-text-tertiary" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start font-sans text-left pb-10">
      
      {/* Col 1: Filters */}
      <div className="lg:col-span-1 bg-surface border border-border-soft rounded-2xl p-4 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border-soft pb-2 select-none">
          <Inbox className="w-4 h-4 text-brand-primary" />
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">Triage Filters</h2>
        </div>
        <div className="flex flex-col gap-1">
          {[
            { id: 'all', label: 'All Requests', count: agentRequests.length },
            { id: 'new', label: 'New Inbox', count: agentRequests.filter(r => r.status === 'new').length },
            { id: 'needs_clarification', label: 'Needs Clarification', count: agentRequests.filter(r => r.status === 'needs_clarification').length },
            { id: 'in_progress', label: 'Routed (Active)', count: agentRequests.filter(r => r.status === 'in_progress' || r.status === 'routed').length },
            { id: 'waiting_on_agent', label: 'Waiting on Agent', count: agentRequests.filter(r => r.status === 'waiting_on_agent').length },
            { id: 'escalated', label: 'Escalated to Owner', count: agentRequests.filter(r => r.status === 'escalated').length },
            { id: 'completed', label: 'Completed', count: agentRequests.filter(r => r.status === 'completed').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === tab.id 
                  ? 'bg-brand-soft text-brand-primary font-bold' 
                  : 'text-text-secondary hover:bg-stone-50 hover:text-text-primary'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                tab.count > 0 ? 'bg-brand-primary text-white' : 'bg-stone-100 text-text-tertiary'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Col 2-3: Compact Queue */}
      <div className="lg:col-span-2 bg-surface border border-border-soft rounded-2xl overflow-hidden shadow-card">
        <div className="h-12 border-b border-border-soft px-4 flex items-center bg-surface-muted justify-between select-none">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Inbound Request Desk ({filteredRequests.length} matching)
          </span>
          <span className="text-[10px] text-text-tertiary">Select message to process</span>
        </div>
        <div className="divide-y divide-border-soft max-h-[550px] overflow-y-auto">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((req) => {
              const isSelected = req.id === selectedId;
              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedId(req.id)}
                  className={`p-4 transition-all cursor-pointer border-l-4 ${
                    isSelected 
                      ? 'bg-stone-50 border-brand-primary' 
                      : 'hover:bg-stone-50/50 border-transparent'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getSourceIcon(req.source)}
                        <span className="text-[9px] text-text-tertiary uppercase font-bold tracking-wider">
                          {req.source} · {req.requesterName} ({req.requesterRole})
                        </span>
                      </div>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        req.priority === 'urgent' ? 'bg-risk-red-soft text-risk-red' :
                        req.priority === 'high' ? 'bg-warning-soft text-warning' :
                        'bg-stone-100 text-text-secondary'
                      }`}>
                        {req.priority}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-text-primary text-sm leading-snug">{req.title}</h4>
                    <p className="text-xs text-text-secondary line-clamp-1 italic font-medium">
                      "{req.rawMessage}"
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[10px] text-text-tertiary">
                      <span>Status: <strong className="text-brand-primary font-semibold capitalize">{req.status.replace('_', ' ')}</strong></span>
                      <span>•</span>
                      <span>Due: {req.dueDate || 'No deadline'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-xs text-text-tertiary italic">
              No requests found matching this filter state.
            </div>
          )}
        </div>
      </div>

      {/* Col 4: Request Detail & Action Center */}
      <div className="lg:col-span-1 bg-surface border border-border-soft rounded-2xl p-4 shadow-card space-y-4">
        {selectedRequest ? (
          <div className="space-y-4">
            <div className="border-b border-border-soft pb-2 flex justify-between items-center select-none">
              <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">Triage Workspace</span>
              <span className="text-[9px] text-brand-primary font-bold uppercase bg-brand-soft px-1.5 py-0.2 rounded">
                {selectedRequest.status.replace('_', ' ')}
              </span>
            </div>

            {/* Raw Message */}
            <div className="space-y-1">
              <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider block">Raw Message</span>
              <div className="p-3 bg-stone-50 border border-border-soft/60 rounded-xl text-xs text-text-secondary leading-relaxed font-medium italic">
                "{selectedRequest.rawMessage}"
              </div>
            </div>

            {/* AI Summary */}
            <div className="space-y-1 bg-brand-soft/20 border border-brand-primary/10 p-3 rounded-xl">
              <span className="text-[9px] text-brand-primary font-bold uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-brand-primary" />
                AI Extraction Summary
              </span>
              <p className="text-xs text-text-primary leading-normal font-medium">
                {selectedRequest.structuredSummary}
              </p>
            </div>

            {/* Missing Information Checklist */}
            {selectedRequest.missingInfo && selectedRequest.missingInfo.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] text-risk-red font-bold uppercase tracking-wider block">Missing Fields Detected</span>
                <div className="space-y-1 text-xs text-text-secondary font-medium">
                  {selectedRequest.missingInfo.map((info, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-risk-red shrink-0" />
                      <span>{info}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Routing */}
            <div className="space-y-1 bg-stone-50 p-3 rounded-xl border border-border-soft/60 text-xs">
              <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider block">Recommended Routing</span>
              <p className="font-bold text-text-primary mt-1">{selectedRequest.recommendedAction}</p>
              <div className="text-[10px] text-text-secondary mt-1">
                Assignee: <strong className="text-text-primary">{selectedRequest.assignedOwner} ({selectedRequest.assignedTeam})</strong>
              </div>
            </div>

            {/* Secure Link Simulation block */}
            {selectedRequest.status === 'waiting_on_agent' && (
              <div className="p-3 bg-brand-soft/30 border border-brand-primary/10 rounded-xl space-y-2">
                <span className="text-[9px] text-brand-primary font-bold uppercase block select-none">Secure Clarification Link</span>
                <button
                  onClick={() => window.open(`/link/clarify/clarify_todd_mktg`, '_blank')}
                  className="w-full py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Open Agent Portal</span>
                  <ArrowRight className="w-3 h-3 text-white" />
                </button>
                <span className="text-[8px] text-text-tertiary block leading-snug">Submitting the agent form in the new tab will automatically resolve missing info here.</span>
              </div>
            )}

            {/* Clarification Draft */}
            <div className="space-y-2">
              <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider block">Draft Clarification</span>
              <textarea
                value={clarificationDraft}
                onChange={(e) => setClarificationDraft(e.target.value)}
                placeholder={`Ask ${selectedRequest.requesterName} for missing details...`}
                className="w-full p-2 text-xs border border-border-soft rounded-lg focus:outline-none focus:border-brand-primary bg-stone-50 font-medium"
                rows={3}
              />
              <button
                onClick={handleSendClarification}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-text-primary rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Clarification Request</span>
              </button>
            </div>

            {/* Main Action Buttons */}
            <div className="pt-2 flex flex-col gap-2 border-t border-border-soft">
              {selectedRequest.status !== 'completed' && (
                <>
                  <button
                    onClick={() => handleRouteToTeam(selectedRequest.id, selectedRequest.assignedTeam, selectedRequest.assignedOwner)}
                    className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Route to Assignee</span>
                  </button>
                  
                  {selectedRequest.status !== 'escalated' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'escalated', 'Escalated to Owner (Alex Carter)')}
                      className="w-full py-2 border border-risk-red text-risk-red hover:bg-risk-red-soft rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Escalate to Owner</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'completed', 'Marked resolved')}
                    className="w-full py-2 border border-border-medium hover:bg-stone-50 text-text-secondary rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-success mr-1.5" />
                    <span>Mark Completed</span>
                  </button>
                </>
              )}
            </div>

            {/* Audit History */}
            <div className="space-y-1.5 border-t border-border-soft pt-3">
              <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-wider block">Audit Trail</span>
              <div className="space-y-1 text-[10px] text-text-tertiary">
                {(selectedRequest.auditEvents || []).slice(-4).map((evt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-brand-primary font-bold">•</span>
                    <span className="leading-snug">{evt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 text-text-tertiary min-h-[300px]">
            <Inbox className="w-8 h-8 opacity-45 mb-2" />
            <p className="text-xs font-bold uppercase">No request selected</p>
          </div>
        )}
      </div>

    </div>
  );
}
