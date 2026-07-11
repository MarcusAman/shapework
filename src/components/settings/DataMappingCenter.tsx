/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  UserCheck, 
  Layers, 
  FileText, 
  Check, 
  X, 
  HelpCircle, 
  PlusCircle, 
  CheckSquare 
} from 'lucide-react';

export default function DataMappingCenter() {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'deals' | 'documents'>('users');
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched' | 'possible_match'>('all');

  // Simulated mapping states
  const [users, setUsers] = useState([
    { id: 'u1', externalName: 'Diane Ross (Rechat)', externalEmail: 'diane@nestrealty.com', internalName: 'Diane Ross', internalRole: 'Transaction Coordinator', confidence: 'high', status: 'possible_match' },
    { id: 'u2', externalName: 'Sarah Jenkins (Rechat)', externalEmail: 'sarah@nestrealty.com', internalName: 'Sarah Jenkins', internalRole: 'Operations Lead', confidence: 'high', status: 'matched' },
    { id: 'u4', externalName: 'Ann (Rechat)', externalEmail: 'ann@nestrealty.com', internalName: 'Ann', internalRole: 'Admin', confidence: 'high', status: 'matched' },
    { id: 'u5', externalName: 'Melissa Gagliardi (Rechat)', externalEmail: 'melissa.gagliardi@nestrealty.com', internalName: 'Melissa Gagliardi', internalRole: 'Admin', confidence: 'high', status: 'matched' },
    { id: 'u6', externalName: 'James Fort (Rechat)', externalEmail: 'james.fort@nestrealty.com', internalName: 'James Fort', internalRole: 'Admin', confidence: 'high', status: 'matched' },
    { id: 'u7', externalName: 'Ryan (Rechat)', externalEmail: 'ryan@nestrealty.com', internalName: 'Ryan', internalRole: 'Admin', confidence: 'high', status: 'matched' },
    { id: 'u3', externalName: 'Agent Cooper (Rechat)', externalEmail: 'cooper@nestrealty.com', internalName: '', internalRole: '', confidence: 'none', status: 'unmatched' }
  ]);

  const [deals, setDeals] = useState([
    { id: 'd1', externalTitle: '109 Woodlawn Dr (Dotloop)', externalStatus: 'Active', internalTitle: '109 Woodlawn - escrow', confidence: 'high', status: 'possible_match' },
    { id: 'd2', externalTitle: '1600 Evergreen Terr (Dotloop)', externalStatus: 'Under Contract', internalTitle: 'Evergreen Terr - sale', confidence: 'high', status: 'matched' },
    { id: 'd3', externalTitle: '42 Wallaby Way (Dotloop)', externalStatus: 'Archived', internalTitle: '', confidence: 'none', status: 'unmatched' }
  ]);

  const [docs, setDocs] = useState([
    { id: 'dc1', externalTitle: 'Mutual Release Form.pdf (Dotloop)', checklistItem: 'Mutual Release Agreement', confidence: 'high', status: 'possible_match' },
    { id: 'dc2', externalTitle: 'Lead Paint Disclosure.pdf (Dotloop)', checklistItem: 'Lead Disclosure Form', confidence: 'high', status: 'matched' }
  ]);

  const handleConfirmUser = (id: string, name: string, role: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, internalName: name || 'Diane Ross', internalRole: role || 'Transaction Coordinator', status: 'matched' } : u));
  };

  const handleRejectUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, internalName: '', internalRole: '', status: 'unmatched' } : u));
  };

  const handleConfirmDeal = (id: string, matchedTitle: string) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, internalTitle: matchedTitle || 'New Deal Alignment', status: 'matched' } : d));
  };

  const handleRejectDeal = (id: string) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, internalTitle: '', status: 'unmatched' } : d));
  };

  const handleCreateUserPlaceholder = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, internalName: u.externalName.replace(' (Rechat)', ''), internalRole: 'agent', status: 'matched' } : u));
  };

  const handleCreateDealPlaceholder = (id: string) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, internalTitle: d.externalTitle.replace(' (Dotloop)', ''), status: 'matched' } : d));
  };

  const handleBulkConfirm = () => {
    if (activeSubTab === 'users') {
      setUsers(prev => prev.map(u => u.status === 'possible_match' ? { ...u, status: 'matched' } : u));
    } else if (activeSubTab === 'deals') {
      setDeals(prev => prev.map(d => d.status === 'possible_match' ? { ...d, status: 'matched' } : d));
    } else {
      setDocs(prev => prev.map(dc => dc.status === 'possible_match' ? { ...dc, status: 'matched' } : dc));
    }
    alert('Bulk confirmed all high-confidence suggestions.');
  };

  return (
    <div className="space-y-6 font-sans text-xs text-text-secondary leading-normal text-left">
      
      {/* Subtab Navigation */}
      <div className="flex justify-between items-center border-b border-border-soft pb-2 select-none">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'users' ? 'bg-brand-primary text-white' : 'hover:bg-stone-100 text-text-secondary'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>User Mappings</span>
          </button>

          <button
            onClick={() => setActiveSubTab('deals')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'deals' ? 'bg-brand-primary text-white' : 'hover:bg-stone-100 text-text-secondary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Deals & Loops</span>
          </button>

          <button
            onClick={() => setActiveSubTab('documents')}
            className={`px-3 py-1.5 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'documents' ? 'bg-brand-primary text-white' : 'hover:bg-stone-100 text-text-secondary'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Compliance Documents</span>
          </button>
        </div>

        <div className="flex gap-2">
          {/* Bulk Action */}
          <button
            onClick={handleBulkConfirm}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/50 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Bulk Confirm High-Confidence</span>
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex gap-1.5 select-none">
        {(['all', 'matched', 'unmatched', 'possible_match'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold border transition-all cursor-pointer ${
              filter === f 
                ? 'bg-stone-150 border-stone-300 text-text-primary' 
                : 'bg-white border-border-soft hover:bg-stone-50 text-text-tertiary'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main List */}
      <div className="border border-border-soft rounded-2xl overflow-hidden bg-white shadow-sm">
        
        {activeSubTab === 'users' && (
          <div className="divide-y divide-border-soft">
            {users
              .filter(u => filter === 'all' || u.status === filter)
              .map(user => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-stone-50/50 transition-all">
                  <div className="space-y-1 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary text-sm">{user.externalName}</span>
                      <span className="text-[10px] text-text-tertiary">{user.externalEmail}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {user.status === 'matched' ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider">
                          Matched to: {user.internalName} ({user.internalRole})
                        </span>
                      ) : user.status === 'possible_match' ? (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          <span>Suggested Match: {user.internalName}</span>
                        </span>
                      ) : (
                        <span className="text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider">
                          Unmatched
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {user.status === 'possible_match' && (
                      <>
                        <button
                          onClick={() => handleConfirmUser(user.id, user.internalName, user.internalRole)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-all cursor-pointer"
                          title="Confirm Match Linkage"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectUser(user.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-all cursor-pointer"
                          title="Reject Suggestion"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {user.status === 'unmatched' && (
                      <button
                        onClick={() => handleCreateUserPlaceholder(user.id)}
                        className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-border-soft rounded-lg text-text-primary font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Seize Role invite</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeSubTab === 'deals' && (
          <div className="divide-y divide-border-soft">
            {deals
              .filter(d => filter === 'all' || d.status === filter)
              .map(deal => (
                <div key={deal.id} className="p-4 flex items-center justify-between hover:bg-stone-50/50 transition-all">
                  <div className="space-y-1 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary text-sm">{deal.externalTitle}</span>
                      <span className="text-[10px] text-text-tertiary">Status: {deal.externalStatus}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {deal.status === 'matched' ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider">
                          Mapped to Deal: {deal.internalTitle}
                        </span>
                      ) : deal.status === 'possible_match' ? (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          <span>Suggested Target: {deal.internalTitle}</span>
                        </span>
                      ) : (
                        <span className="text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider">
                          Unmatched Loop
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {deal.status === 'possible_match' && (
                      <>
                        <button
                          onClick={() => handleConfirmDeal(deal.id, deal.internalTitle)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-all cursor-pointer"
                          title="Link and Sync"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectDeal(deal.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-all cursor-pointer"
                          title="Reject Alignment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {deal.status === 'unmatched' && (
                      <button
                        onClick={() => handleCreateDealPlaceholder(deal.id)}
                        className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-border-soft rounded-lg text-text-primary font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Create Deal Placeholder</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeSubTab === 'documents' && (
          <div className="divide-y divide-border-soft">
            {docs
              .filter(dc => filter === 'all' || dc.status === filter)
              .map(doc => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-stone-50/50 transition-all">
                  <div className="space-y-1 pr-6">
                    <span className="font-bold text-text-primary text-sm block">{doc.externalTitle}</span>
                    
                    <div className="flex items-center gap-1.5 mt-1">
                      {doc.status === 'matched' ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider">
                          Mapped to checklist task: {doc.checklistItem}
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          <span>Suggested target task: {doc.checklistItem}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {doc.status === 'possible_match' && (
                      <>
                        <button
                          onClick={() => {
                            setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'matched' } : d));
                          }}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-all cursor-pointer"
                          title="Confirm Attachment Link"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'unmatched' } : d));
                          }}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-all cursor-pointer"
                          title="Reject Association"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

      </div>
    </div>
  );
}
