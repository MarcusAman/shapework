import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle, 
  ArrowRight,
  Star,
  Send,
  Mail,
  Clock,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import { createAuditEvent } from '../../utils/audit';

const initialClosedDeals = [
  {
    id: 'tx-1',
    propertyAddress: '102 Pine Street',
    clientName: 'Arthur Pendragon',
    closingDate: '2026-06-28',
    agentName: 'Emma Watson',
    reviewStatus: 'draft_prepared',
    emailDraft: 'Thank you for working with our team. If you have a moment, we would appreciate your feedback on your experience. Google Review Link: https://g.page/nest-realty/review'
  },
  {
    id: 'tx-2',
    propertyAddress: '109 Woodlawn Drive',
    clientName: 'Merlin Ambrosius',
    closingDate: '2026-06-29',
    agentName: 'Emma Watson',
    reviewStatus: 'needs_agent_approval',
    emailDraft: 'Thank you for working with our team. If you have a moment, we would appreciate your feedback on your experience. Google Review Link: https://g.page/nest-realty/review'
  }
];

export default function ReviewRequestTrigger() {
  const [deals, setDeals] = useState(initialClosedDeals);
  const [selectedId, setSelectedId] = useState<string>('tx-1');

  const selectedDeal = deals.find(d => d.id === selectedId) || deals[0];

  const handleSendRequest = async (id: string) => {
    try {
      const res = await fetch('/api/action/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Google Review Request: ${selectedDeal.propertyAddress}`,
          description: `Outbound post-closing review request email to client ${selectedDeal.clientName}.`,
          actionType: 'draft_email',
          draftContent: selectedDeal.emailDraft,
          targetRecipient: selectedDeal.clientName,
          propertyAddress: selectedDeal.propertyAddress,
          transactionId: id
        })
      });
      if (res.ok) {
        alert(`Google Review Request draft submitted to Approvals Queue.`);
        setDeals(prev => prev.map(d => {
          if (d.id === id) {
            return {
              ...d,
              reviewStatus: 'awaiting_approval'
            };
          }
          return d;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveAgentSend = async (id: string) => {
    try {
      const res = await fetch('/api/action/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Google Review Request: ${selectedDeal.propertyAddress} (Needs Agent Release)`,
          description: `Post-closing review request requiring agent verification before client dispatch.`,
          actionType: 'draft_email',
          draftContent: selectedDeal.emailDraft,
          targetRecipient: selectedDeal.clientName,
          propertyAddress: selectedDeal.propertyAddress,
          transactionId: id
        })
      });
      if (res.ok) {
        alert('Review request draft queued for approvals and agent release notification.');
        setDeals(prev => prev.map(d => {
          if (d.id === id) {
            return {
              ...d,
              reviewStatus: 'awaiting_approval'
            };
          }
          return d;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-sans text-left pb-10">
      
      {/* Col 1: Roster */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-surface border border-border-soft rounded-2xl p-4 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-border-soft pb-2">
            <Award className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Happy Closings</h3>
          </div>

          <div className="space-y-2">
            {deals.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected 
                      ? 'bg-stone-50 border-brand-primary shadow-sm' 
                      : 'border-border-soft hover:bg-stone-50/50'
                  }`}
                >
                  <h4 className="font-serif font-bold text-text-primary text-sm">{item.propertyAddress}</h4>
                  <div className="flex justify-between items-center text-[10px] text-text-secondary font-medium">
                    <span>Client: {item.clientName}</span>
                    <span>Closed: {item.closingDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase pt-1">
                    <span className="flex items-center gap-1 text-[var(--sw-green-900)] bg-[var(--sw-mint-100)] px-1.5 rounded">
                      Closed Transaction
                    </span>
                    <span className="text-text-tertiary">
                      {item.reviewStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Col 2-3: Review Draft Detail */}
      <div className="lg:col-span-2 bg-surface border border-border-soft rounded-2xl p-5 shadow-card space-y-5">
        <div className="border-b border-border-soft pb-3 select-none">
          <h3 className="font-serif font-bold text-lg text-text-primary">Google Review Dispatch Desk</h3>
          <p className="text-xs text-text-secondary mt-0.5">Automated prompts staged immediately post-closing for happy clients.</p>
        </div>

        {selectedDeal ? (
          <div className="space-y-4">
            <div className="p-4 bg-stone-50 border border-border-soft rounded-xl text-xs space-y-2 font-medium">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="font-bold text-text-primary uppercase text-[10px] tracking-wider">Review Request Email Draft</span>
              </div>
              <div className="p-3 bg-surface border border-border-subtle rounded-lg italic leading-relaxed text-text-secondary">
                "{selectedDeal.emailDraft}"
              </div>
              <div className="text-[10px] text-text-tertiary flex gap-3 pt-1">
                <span>Client: <strong>{selectedDeal.clientName}</strong></span>
                <span>•</span>
                <span>Agent: <strong>{selectedDeal.agentName}</strong></span>
              </div>
            </div>

            {/* Constraints notice */}
            <div className="p-3 bg-stone-50 border border-border-soft/60 rounded-xl text-[10px] text-text-tertiary flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-3.5 h-3.5 text-text-tertiary shrink-0 mt-0.5" />
              <span>
                <strong>Sandbox Policy:</strong> External messages will not be sent automatically. Click below to manually dispatch or queue the agent review notification.
              </span>
            </div>

            <div className="flex gap-2">
              {selectedDeal.reviewStatus !== 'sent' ? (
                <>
                  <button
                    onClick={() => handleSendRequest(selectedDeal.id)}
                    className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request to Client</span>
                  </button>
                  <button
                    onClick={() => handleApproveAgentSend(selectedDeal.id)}
                    className="px-4 py-2 border border-border-medium hover:bg-stone-50 text-text-secondary text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Send to Agent for Review
                  </button>
                </>
              ) : (
                <span className="px-3 py-1.5 bg-success-soft text-success text-xs font-bold rounded-lg border border-success/15 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Request Dispatched Successfully
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-text-tertiary italic">
            Select a deal from the list to preview the Google review dispatch.
          </div>
        )}
      </div>

    </div>
  );
}
