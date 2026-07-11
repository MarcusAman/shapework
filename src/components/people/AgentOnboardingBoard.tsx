import React, { useState } from 'react';
import { 
  UserPlus, 
  CheckCircle, 
  CheckSquare,
  Square,
  DollarSign, 
  User, 
  Clock, 
  AlertTriangle,
  Send,
  Sparkles,
  Award
} from 'lucide-react';

const initialOnboardingRoster = [
  {
    id: 'onb_1',
    agentName: 'Arthur Pendragon',
    startDate: '2026-06-20',
    estimatedCost: 1250,
    checklist: [
      { id: 'step_1', name: 'Onboarding Agreement Signed', status: 'completed', owner: 'Ann Morrison' },
      { id: 'step_2', name: 'Profile & Database Record Created', status: 'completed', owner: 'Ann Morrison' },
      { id: 'step_3', name: 'Professional Headshot Scheduled', status: 'completed', owner: 'Arthur Pendragon' },
      { id: 'step_4', name: 'Bio Questionnaire Completed', status: 'overdue', owner: 'Arthur Pendragon' },
      { id: 'step_5', name: 'Brochures & Direct Mailers Drafted', status: 'pending', owner: 'Melissa Vance' },
      { id: 'step_6', name: 'Social Media Announcement Scheduled', status: 'pending', owner: 'Melissa Vance' },
      { id: 'step_7', name: 'Office Welcome Box Staged', status: 'pending', owner: 'Ann Morrison' },
      { id: 'step_8', name: 'CRM & Systems Access Credentials Issued', status: 'pending', owner: 'Ann Morrison' }
    ],
    missingInfo: 'Awaiting Arthur to submit bio questionnaire details.',
    bioDraftPrepared: false
  },
  {
    id: 'onb_2',
    agentName: 'Ginevra Weasley',
    startDate: '2026-06-25',
    estimatedCost: 1290,
    checklist: [
      { id: 'step_1', name: 'Onboarding Agreement Signed', status: 'completed', owner: 'Ann Morrison' },
      { id: 'step_2', name: 'Profile & Database Record Created', status: 'completed', owner: 'Ann Morrison' },
      { id: 'step_3', name: 'Professional Headshot Scheduled', status: 'pending', owner: 'Ginevra Weasley' },
      { id: 'step_4', name: 'Bio Questionnaire Completed', status: 'pending', owner: 'Ginevra Weasley' },
      { id: 'step_5', name: 'Brochures & Direct Mailers Drafted', status: 'pending', owner: 'Melissa Vance' },
      { id: 'step_6', name: 'Social Media Announcement Scheduled', status: 'pending', owner: 'Melissa Vance' },
      { id: 'step_7', name: 'Office Welcome Box Staged', status: 'pending', owner: 'Ann Morrison' },
      { id: 'step_8', name: 'CRM & Systems Access Credentials Issued', status: 'pending', owner: 'Ann Morrison' }
    ],
    missingInfo: null,
    bioDraftPrepared: false
  }
];

export default function AgentOnboardingBoard() {
  const [agents, setAgents] = useState(initialOnboardingRoster);
  const [selectedId, setSelectedId] = useState<string>('onb_1');
  const [draftBioText, setDraftBioText] = useState<string>('');

  const selectedAgent = agents.find(a => a.id === selectedId) || agents[0];

  const handleToggleStep = (agentId: string, stepId: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        const updatedChecklist = a.checklist.map(step => {
          if (step.id === stepId) {
            return {
              ...step,
              status: step.status === 'completed' ? 'pending' : 'completed'
            };
          }
          return step;
        });
        return {
          ...a,
          checklist: updatedChecklist
        };
      }
      return a;
    }));
  };

  const handlePrepareDraft = () => {
    setDraftBioText(
      `Arthur Pendragon joins Nest Realty with a robust background in residential escrow management and transaction compliance. Known for his detail-oriented advisory approach, Arthur specializes in guiding home sellers through complex inspections and escrow closures. His focus is on providing a stress-free transition for families in the local area.`
    );
    setAgents(prev => prev.map(a => {
      if (a.id === selectedAgent.id) {
        return {
          ...a,
          bioDraftPrepared: true
        };
      }
      return a;
    }));
  };

  const handleApproveBio = () => {
    alert('Agent welcome bio approved. Synced to direct mail marketing files.');
    setDraftBioText('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-sans text-left pb-10">
      
      {/* Col 1: Onboarding Roster */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-surface border border-border-soft rounded-2xl p-4 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-border-soft pb-2">
            <UserPlus className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Onboarding Roster</h3>
          </div>

          <div className="space-y-2">
            {agents.map((item) => {
              const isSelected = item.id === selectedId;
              const completedCount = item.checklist.filter(s => s.status === 'completed').length;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected 
                      ? 'bg-stone-50 border-brand-primary shadow-sm' 
                      : 'border-border-soft hover:bg-stone-50/50'
                  }`}
                >
                  <h4 className="font-serif font-bold text-text-primary text-sm">{item.agentName}</h4>
                  <div className="flex justify-between items-center text-[10px] text-text-secondary font-medium">
                    <span>Started: {item.startDate}</span>
                    <span className="font-bold text-brand-primary">${item.estimatedCost.toLocaleString()} setup</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-text-tertiary">
                      <span>Tasks Complete</span>
                      <span>{completedCount} / {item.checklist.length} done</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-primary transition-all duration-300"
                        style={{ width: `${(completedCount / item.checklist.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Col 2-3: Steps Board */}
      <div className="lg:col-span-2 bg-surface border border-border-soft rounded-2xl p-5 shadow-card space-y-5">
        <div className="border-b border-border-soft pb-3 flex flex-wrap items-center justify-between gap-3 select-none">
          <div>
            <h3 className="font-serif font-bold text-lg text-text-primary">{selectedAgent.agentName}</h3>
            <p className="text-xs text-text-secondary">Onboarding Start: <strong>{selectedAgent.startDate}</strong> · Setup Cost: <strong>${selectedAgent.estimatedCost}</strong></p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-50 rounded-lg border border-border-soft/60 text-xs font-semibold">
            <DollarSign className="w-3.5 h-3.5 text-brand-primary" />
            <span>Target Cost Budget OK</span>
          </div>
        </div>

        {/* Missing Info Warning */}
        {selectedAgent.missingInfo && (
          <div className="p-3 bg-warning-soft border border-warning/15 rounded-xl flex items-start gap-2.5 text-xs text-warning leading-normal font-medium select-none">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase text-[10px]">Awaiting Agent:</span>
              {selectedAgent.missingInfo}
            </div>
          </div>
        )}

        {/* Bio Copywriting Assist */}
        {selectedAgent.id === 'onb_1' && (
          <div className="p-4 border border-brand-primary/10 bg-brand-soft/20 rounded-xl space-y-3">
            <span className="text-[10px] text-brand-primary font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Onboarding Bio Assistant
            </span>
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              Arthur uploaded a resume folder but did not provide his bio biography. Let's auto-draft the bio using the resume.
            </p>
            {draftBioText ? (
              <div className="space-y-3">
                <div className="p-3 bg-surface border border-border-soft rounded-lg text-xs leading-relaxed text-text-primary font-medium italic">
                  "{draftBioText}"
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleApproveBio}
                    className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Approve and Sync Bio
                  </button>
                  <button
                    onClick={() => setDraftBioText('')}
                    className="px-3 py-1.5 border border-border-medium text-text-secondary hover:bg-stone-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handlePrepareDraft}
                className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Draft Bio from Resume
              </button>
            )}
          </div>
        )}

        {/* Checklist */}
        <div className="space-y-3">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Onboarding Checklist Tasks</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedAgent.checklist.map((step) => {
              const isDone = step.status === 'completed';
              const isOverdue = step.status === 'overdue';
              return (
                <div 
                  key={step.id}
                  onClick={() => handleToggleStep(selectedAgent.id, step.id)}
                  className={`p-3 border rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:bg-stone-50 ${
                    isDone 
                      ? 'border-success-soft bg-success-soft/5 text-text-secondary' 
                      : isOverdue
                      ? 'border-risk-red/20 bg-risk-red-soft/20 text-text-primary'
                      : 'border-border-soft bg-surface text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button className="shrink-0 text-brand-primary focus:outline-none">
                      {isDone ? (
                        <CheckSquare className="w-4 h-4 text-success" />
                      ) : (
                        <Square className={`w-4 h-4 ${isOverdue ? 'text-risk-red' : 'text-text-tertiary'}`} />
                      )}
                    </button>
                    <div className="min-w-0">
                      <span className={`text-xs block font-semibold truncate ${isDone ? 'line-through opacity-70' : ''}`}>
                        {step.name}
                      </span>
                      <span className="text-[9px] text-text-tertiary block mt-0.5 leading-none">
                        Owner: {step.owner}
                      </span>
                    </div>
                  </div>
                  {isOverdue && (
                    <span className="text-[7px] font-bold text-risk-red uppercase bg-risk-red-soft px-1.5 py-0.2 rounded shrink-0">
                      Overdue
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
