import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Calendar, 
  Camera, 
  MapPin, 
  FileText, 
  AlertTriangle,
  Play,
  ArrowRight,
  Clock,
  Sparkles,
  User
} from 'lucide-react';

const initialListingLaunchItems = [
  {
    id: 'launch_1',
    propertyAddress: '209 Ridge Court',
    agentName: 'Todd Howard',
    targetLaunchDate: '2026-07-07',
    currentStage: 'marketing_assets',
    checklist: [
      { id: 'step_1', name: 'Listing Agreement Received', status: 'completed', owner: 'Melissa Vance', date: '2026-06-25' },
      { id: 'step_2', name: 'Seller Disclosure Received', status: 'completed', owner: 'Melissa Vance', date: '2026-06-26' },
      { id: 'step_3', name: 'Photography Scheduled', status: 'completed', owner: 'Todd Howard', date: '2026-06-27' },
      { id: 'step_4', name: 'Photos Received & Audited', status: 'overdue', owner: 'Photographer (Vendor)', date: '2026-06-28' },
      { id: 'step_5', name: 'MLS Data Entry Drafted', status: 'pending', owner: 'Melissa Vance', date: '2026-07-02' },
      { id: 'step_6', name: 'Marketing Flyer & E-blast Prepared', status: 'pending', owner: 'Melissa Vance', date: '2026-07-03' },
      { id: 'step_7', name: 'Yard Sign Installed', status: 'pending', owner: 'Sign Vendor', date: '2026-07-05' },
      { id: 'step_8', name: 'Goes Live on MLS', status: 'pending', owner: 'Todd Howard', date: '2026-07-07' }
    ],
    blockingIssue: 'Waiting on photographer to upload high-res drone package.',
    signOrdered: true,
    signInstallStatus: 'Pending Delivery'
  },
  {
    id: 'launch_2',
    propertyAddress: '105 Colonial Avenue',
    agentName: 'Emma Watson',
    targetLaunchDate: '2026-07-15',
    currentStage: 'prep',
    checklist: [
      { id: 'step_1', name: 'Listing Agreement Received', status: 'completed', owner: 'Melissa Vance', date: '2026-06-28' },
      { id: 'step_2', name: 'Seller Disclosure Received', status: 'pending', owner: 'Emma Watson', date: '2026-07-02' },
      { id: 'step_3', name: 'Photography Scheduled', status: 'pending', owner: 'Emma Watson', date: '2026-07-05' },
      { id: 'step_4', name: 'Photos Received & Audited', status: 'pending', owner: 'Photographer (Vendor)', date: '2026-07-08' },
      { id: 'step_5', name: 'MLS Data Entry Drafted', status: 'pending', owner: 'Melissa Vance', date: '2026-07-10' },
      { id: 'step_6', name: 'Marketing Flyer & E-blast Prepared', status: 'pending', owner: 'Melissa Vance', date: '2026-07-12' },
      { id: 'step_7', name: 'Yard Sign Installed', status: 'pending', owner: 'Sign Vendor', date: '2026-07-14' },
      { id: 'step_8', name: 'Goes Live on MLS', status: 'pending', owner: 'Emma Watson', date: '2026-07-15' }
    ],
    blockingIssue: null,
    signOrdered: false,
    signInstallStatus: 'Not Ordered'
  }
];

export default function ListingLaunchBoard() {
  const [items, setItems] = useState(initialListingLaunchItems);
  const [selectedId, setSelectedId] = useState<string>('launch_1');

  const selectedItem = items.find(item => item.id === selectedId) || items[0];

  const handleToggleStep = (listingId: string, stepId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === listingId) {
        const nextChecklist = item.checklist.map(step => {
          if (step.id === stepId) {
            return {
              ...step,
              status: step.status === 'completed' ? 'pending' : 'completed',
              date: new Date().toISOString().split('T')[0]
            };
          }
          return step;
        });
        return {
          ...item,
          checklist: nextChecklist
        };
      }
      return item;
    }));
  };

  const handleOrderSign = (listingId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === listingId) {
        return {
          ...item,
          signOrdered: true,
          signInstallStatus: 'Ordered (Sign Vendor notified)'
        };
      }
      return item;
    }));
    alert('Yard sign installation order dispatched to vendor.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-sans text-left pb-10">
      
      {/* Col 1: Listing Selector */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-surface border border-border-soft rounded-2xl p-4 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-border-soft pb-2">
            <Calendar className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Launch Roster</h3>
          </div>

          <div className="space-y-2">
            {items.map((listing) => {
              const isSelected = listing.id === selectedId;
              const completedCount = listing.checklist.filter(s => s.status === 'completed').length;
              return (
                <div
                  key={listing.id}
                  onClick={() => setSelectedId(listing.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected 
                      ? 'bg-stone-50 border-brand-primary shadow-sm' 
                      : 'border-border-soft hover:bg-stone-50/50'
                  }`}
                >
                  <h4 className="font-serif font-bold text-text-primary text-sm">{listing.propertyAddress}</h4>
                  <div className="flex justify-between items-center text-[10px] text-text-secondary font-medium">
                    <span>Agent: {listing.agentName}</span>
                    <span>Launch: {listing.targetLaunchDate}</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-text-tertiary">
                      <span>Launch Progress</span>
                      <span>{completedCount} / {listing.checklist.length} done</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-primary transition-all duration-300"
                        style={{ width: `${(completedCount / listing.checklist.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Col 2-3: Milestones Checklist */}
      <div className="lg:col-span-2 bg-surface border border-border-soft rounded-2xl p-5 shadow-card space-y-5">
        <div className="border-b border-border-soft pb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif font-bold text-lg text-text-primary">{selectedItem.propertyAddress}</h3>
            <p className="text-xs text-text-secondary">Assigned Agent: <strong>{selectedItem.agentName}</strong> · Target Live Date: <strong>{selectedItem.targetLaunchDate}</strong></p>
          </div>

          <div className="flex gap-2">
            {!selectedItem.signOrdered ? (
              <button
                onClick={() => handleOrderSign(selectedItem.id)}
                className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Order Yard Sign
              </button>
            ) : (
              <span className="px-2.5 py-1 bg-success-soft text-success text-[10px] font-bold rounded-lg border border-success/15">
                Sign Ordered
              </span>
            )}
          </div>
        </div>

        {/* Blocking Issue */}
        {selectedItem.blockingIssue && (
          <div className="p-3 bg-warning-soft border border-warning/15 rounded-xl flex items-start gap-2.5 text-xs text-warning leading-normal font-medium select-none">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase text-[10px]">Blocking Issue:</span>
              {selectedItem.blockingIssue}
            </div>
          </div>
        )}

        {/* Checklist Board */}
        <div className="space-y-3">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Launch Checklist Items</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedItem.checklist.map((step) => {
              const isDone = step.status === 'completed';
              const isOverdue = step.status === 'overdue';
              return (
                <div 
                  key={step.id}
                  onClick={() => handleToggleStep(selectedItem.id, step.id)}
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
                        Owner: {step.owner} {step.date ? `(Done ${step.date})` : ''}
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
