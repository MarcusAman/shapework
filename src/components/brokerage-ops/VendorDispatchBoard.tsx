/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wrench, CheckCircle, Clock, AlertTriangle, MessageSquare, FileText,
  DollarSign, Shield, Camera, Send, Filter, Search, Plus, UserCheck, ChevronRight, Check
} from 'lucide-react';

interface RepairTicket {
  id: string;
  propertyAddress: string;
  transactionRef: string;
  repairCategory: 'HVAC' | 'Plumbing' | 'Roofing' | 'Electrical' | 'General';
  repairDescription: string;
  assignedVendor: string;
  vendorPhone: string;
  estimatedCost: number;
  bicApprovalRequired: boolean;
  bicApproved: boolean;
  status: 'quote_requested' | 'bic_approval_pending' | 'work_in_progress' | 'photo_verified' | 'completed';
  photoUrl?: string;
  invoiceUrl?: string;
  agentName: string;
  createdAt: string;
}

const INITIAL_REPAIR_TICKETS: RepairTicket[] = [
  {
    id: 'rep-801',
    propertyAddress: '312 Mayfaire Town Center Way, Wilmington, NC',
    transactionRef: '#TX-MAYFAIRE-312',
    repairCategory: 'HVAC',
    repairDescription: 'Replace secondary condensate drain pan & service heat pump unit (Form 310-T item 3)',
    assignedVendor: 'Cape Fear Heating & Air',
    vendorPhone: '(910) 555-0311',
    estimatedCost: 1450,
    bicApprovalRequired: true,
    bicApproved: true,
    status: 'photo_verified',
    photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
    invoiceUrl: 'https://shapework.app/invoices/inv-capefear1450.pdf',
    agentName: 'Marcus Vance',
    createdAt: '2 hours ago'
  },
  {
    id: 'rep-802',
    propertyAddress: '104 Main St, Historic Downtown Wilmington, NC',
    transactionRef: '#TX-104MAIN',
    repairCategory: 'Plumbing',
    repairDescription: 'Repair crawlspace line leak & install vapor barrier patch',
    assignedVendor: 'Wilmington Pro Plumbing',
    vendorPhone: '(910) 555-0844',
    estimatedCost: 850,
    bicApprovalRequired: false,
    bicApproved: false,
    status: 'work_in_progress',
    agentName: 'Sarah Jenkins',
    createdAt: 'Yesterday'
  },
  {
    id: 'rep-803',
    propertyAddress: '402 Waterfront Way, Wrightsville Beach, NC',
    transactionRef: '#TX-WATERFRONT-402',
    repairCategory: 'Roofing',
    repairDescription: 'Replace missing architectural shingles on east elevation ridge',
    assignedVendor: 'Port City Roofing Co.',
    vendorPhone: '(910) 555-0722',
    estimatedCost: 1850,
    bicApprovalRequired: true,
    bicApproved: false,
    status: 'bic_approval_pending',
    agentName: 'Jessica Miller',
    createdAt: '3 hours ago'
  }
];

export default function VendorDispatchBoard() {
  const [tickets, setTickets] = useState<RepairTicket[]>(INITIAL_REPAIR_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [manualOverrideVendor, setManualOverrideVendor] = useState('');
  const [simulatingUpload, setSimulatingUpload] = useState(false);
  const [officeFilter, setOfficeFilter] = useState<'all' | 'Mayfaire' | 'Carolina Beach' | 'Wilmington'>('all');

  const handleBicApproveQuote = (ticketId: string) => {
    setTickets(tickets.map(t => 
      t.id === ticketId ? { ...t, bicApproved: true, status: 'work_in_progress' } : t
    ));
  };

  const handleSimulateContractorPhotoSMS = (ticketId: string) => {
    setSimulatingUpload(true);
    setTimeout(() => {
      setTickets(tickets.map(t => 
        t.id === ticketId ? {
          ...t,
          status: 'photo_verified',
          photoUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60',
          invoiceUrl: `https://shapework.app/invoices/inv-${t.id}.pdf`
        } : t
      ));
      setSimulatingUpload(false);
    }, 1200);
  };

  const handleAgentSignoff = (ticketId: string) => {
    setTickets(tickets.map(t => 
      t.id === ticketId ? { ...t, status: 'completed' } : t
    ));
  };

  return (
    <div className="space-y-6 font-sans text-[#F6F7F1]">
      
      {/* Header & Mode Explanation */}
      <div 
        className="rounded-[28px] p-7 space-y-3 text-left shadow-xl"
        style={{
          background: 'rgba(246, 247, 241, 0.10)',
          border: '1px solid rgba(246, 247, 241, 0.18)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30">
                Hybrid Repair Dispatch Engine
              </span>
              <span className="text-xs text-[#D0D6BB]">Form 310-T Auto-Parse • $1,000 BIC Threshold</span>
            </div>
            <h2 className="font-serif text-2xl font-black text-white tracking-tight mt-2">
              Inspection Repair Addendum Contractor Dispatch Board
            </h2>
            <p className="text-xs text-[#D0D6BB] max-w-3xl leading-relaxed mt-1">
              Automatically parses repair addendums, dispatches quote requests to vetted local contractors via SMS, enforces $1,000 BIC approvals, and verifies completion photos before closing funds disbursement.
            </p>
          </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[10px] font-mono text-[#D0D6BB] uppercase">Filter Office Location:</span>
              <button
                type="button"
                onClick={() => setOfficeFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  officeFilter === 'all' ? 'bg-[#00635C] text-white border border-emerald-400/40' : 'bg-black/30 text-[#D0D6BB] border border-white/10'
                }`}
              >
                All Offices ({tickets.length})
              </button>
              <button
                type="button"
                onClick={() => setOfficeFilter('Mayfaire')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  officeFilter === 'Mayfaire' ? 'bg-[#00635C] text-white border border-emerald-400/40' : 'bg-black/30 text-[#D0D6BB] border border-white/10'
                }`}
              >
                Mayfaire Office
              </button>
              <button
                type="button"
                onClick={() => setOfficeFilter('Carolina Beach')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  officeFilter === 'Carolina Beach' ? 'bg-[#00635C] text-white border border-emerald-400/40' : 'bg-black/30 text-[#D0D6BB] border border-white/10'
                }`}
              >
                Carolina Beach Office
              </button>
              <button
                type="button"
                onClick={() => setOfficeFilter('Wilmington')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  officeFilter === 'Wilmington' ? 'bg-[#00635C] text-white border border-emerald-400/40' : 'bg-black/30 text-[#D0D6BB] border border-white/10'
                }`}
              >
                Downtown Wilmington Office
              </button>
            </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 bg-black/40 border border-white/10 rounded-2xl text-center">
              <span className="text-[10px] text-[#D0D6BB] block uppercase font-sans">Active Repairs</span>
              <strong className="text-xl text-white font-black">{tickets.length} Tickets</strong>
            </div>
            <div className="p-3 bg-black/40 border border-white/10 rounded-2xl text-center">
              <span className="text-[10px] text-[#D0D6BB] block uppercase font-sans">BIC Approval Queue</span>
              <strong className="text-xl text-white font-black">
                {tickets.filter(t => t.bicApprovalRequired && !t.bicApproved).length} Pending
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Pillar Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
        <div 
          className="rounded-[24px] p-5 space-y-1 shadow-lg"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <strong className="text-white font-semibold flex items-center gap-2 font-serif text-sm">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>1. Auto-Extract & Manual Choice</span>
          </strong>
          <p className="text-[#D0D6BB] text-[11px] leading-relaxed">
            Auto-parses Form 310-T addendums while giving agents instant manual override to select preferred contractors.
          </p>
        </div>

        <div 
          className="rounded-[24px] p-5 space-y-1 shadow-lg"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <strong className="text-white font-semibold flex items-center gap-2 font-serif text-sm">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>2. $1,000 BIC Approval Queue</span>
          </strong>
          <p className="text-[#D0D6BB] text-[11px] leading-relaxed">
            Any repair quote exceeding $1,000 automatically triggers a 1-click approval ticket to BIC Eric Knight / Jessica Keenan.
          </p>
        </div>

        <div 
          className="rounded-[24px] p-5 space-y-1 shadow-lg"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <strong className="text-white font-semibold flex items-center gap-2 font-serif text-sm">
            <Camera className="w-4 h-4 text-emerald-300" />
            <span>3. Contractor Photo Verification</span>
          </strong>
          <p className="text-[#D0D6BB] text-[11px] leading-relaxed">
            Contractors text completion photos & invoices to SMS line. AI OCR verifies details & triggers 1-click agent sign-off.
          </p>
        </div>
      </div>

      {/* Active Repair Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="rounded-[28px] p-6 flex flex-col justify-between space-y-5 text-left shadow-xl hover:border-white/30 transition-all"
            style={{
              background: 'rgba(246, 247, 241, 0.10)',
              border: '1px solid rgba(246, 247, 241, 0.18)',
              backdropFilter: 'blur(18px)'
            }}
          >
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-emerald-950/60 text-emerald-300 text-[10px] font-mono font-bold uppercase rounded-full border border-emerald-500/30">
                  {ticket.repairCategory} Repair
                </span>
                <span className="text-[10px] font-mono text-[#D0D6BB]/60">{ticket.transactionRef}</span>
              </div>

              <h3 className="text-base font-bold text-white leading-tight">
                {ticket.propertyAddress}
              </h3>
              <p className="text-xs text-[#D0D6BB] leading-relaxed">
                "{ticket.repairDescription}"
              </p>
            </div>

            {/* Contractor & Cost Details */}
            <div className="p-4 bg-black/30 border border-white/10 rounded-2xl space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center text-[#D0D6BB]">
                <span>Assigned Vendor:</span>
                <strong className="text-white font-sans font-semibold">{ticket.assignedVendor}</strong>
              </div>

              <div className="flex justify-between items-center text-[#D0D6BB]">
                <span>Estimated Cost:</span>
                <strong className="text-emerald-400 font-bold">${ticket.estimatedCost.toLocaleString()}</strong>
              </div>

              <div className="flex justify-between items-center text-[#D0D6BB]">
                <span>BIC Threshold (&gt;$1k):</span>
                {ticket.bicApprovalRequired ? (
                  ticket.bicApproved ? (
                    <span className="text-emerald-400 font-bold">✓ Approved</span>
                  ) : (
                    <span className="text-amber-300 font-bold">⚠️ Pending Approval</span>
                  )
                ) : (
                  <span className="text-white/60">Not Required (&lt;$1k)</span>
                )}
              </div>
            </div>

            {/* Status & Actions */}
            <div className="space-y-3">
              {ticket.bicApprovalRequired && !ticket.bicApproved && (
                <button
                  onClick={() => handleBicApproveQuote(ticket.id)}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-black font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Shield className="w-4 h-4 fill-black" />
                  <span>1-Click BIC Approval (${ticket.estimatedCost})</span>
                </button>
              )}

              {ticket.status === 'work_in_progress' && (
                <button
                  onClick={() => handleSimulateContractorPhotoSMS(ticket.id)}
                  disabled={simulatingUpload}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  {simulatingUpload ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Verifying Contractor Photo...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Simulate Contractor SMS Photo Upload</span>
                    </>
                  )}
                </button>
              )}

              {ticket.status === 'photo_verified' && (
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Photo & Invoice Verified</span>
                    </div>
                    <p className="text-[11px] text-[#D0D6BB]/70 font-mono">Invoice matched quote amount (${ticket.estimatedCost}).</p>
                  </div>
                  
                  <button
                    onClick={() => handleAgentSignoff(ticket.id)}
                    className="w-full py-3 bg-[#004d40] hover:bg-[#00635c] border border-emerald-400/40 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <UserCheck className="w-4 h-4 text-amber-300" />
                    <span>Agent 1-Click Repair Completion Sign-Off</span>
                  </button>
                </div>
              )}

              {ticket.status === 'completed' && (
                <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center text-xs font-mono text-emerald-300 font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Repair Complete • Ready for Closing Disbursement</span>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
