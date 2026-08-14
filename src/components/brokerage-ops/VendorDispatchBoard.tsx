/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Inspection Repair Addendum Contractor Dispatch Board — Phase C Light-Mode Redesign
 * Refactored to canonical Shapework B1/B2/B3 design primitives.
 */

import React, { useState } from 'react';
import {
  Wrench, CheckCircle, Clock, AlertTriangle, MessageSquare, FileText,
  DollarSign, Shield, Camera, Send, Filter, Search, Plus, UserCheck, ChevronRight, Check
} from 'lucide-react';
import {
  Card,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  MetricTile,
  MetricGroup,
  DataTable,
  Modal,
  SegmentedControl
} from '../ui';

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
  const [simulatingUpload, setSimulatingUpload] = useState(false);
  const [officeFilter, setOfficeFilter] = useState<string>('all');

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
    <div className="space-y-6 text-left select-none">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand" icon={<Wrench className="w-3.5 h-3.5" />}>
              Hybrid Repair Dispatch Engine
            </Badge>
            <span className="text-xs text-[var(--sw-text-secondary)] font-medium">Form 310-T Auto-Parse • $1,000 BIC Threshold</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--sw-text-primary)] mt-1.5">
            Inspection Repair Addendum Contractor Dispatch Board
          </h1>
          <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5 max-w-3xl leading-relaxed">
            Parses Form 310-T repair addendums, dispatches quotes via SMS, enforces $1,000 BIC approvals, and verifies completion photos before closing funds disbursement.
          </p>
        </div>

        <SegmentedControl
          value={officeFilter}
          onChange={setOfficeFilter}
          options={[
            { id: 'all', label: 'All Offices' },
            { id: 'Mayfaire', label: 'Mayfaire' },
            { id: 'Wilmington', label: 'Downtown' },
          ]}
        />
      </div>

      {/* Metrics Row */}
      <MetricGroup columns={3}>
        <MetricTile
          label="Active Repair Tickets"
          value={`${tickets.length} Tickets`}
          sublabel="Form 310-T inspection repairs"
          variant="brand"
          icon={<Wrench className="w-4 h-4" />}
        />
        <MetricTile
          label="BIC Approval Queue"
          value={`${tickets.filter(t => t.bicApprovalRequired && !t.bicApproved).length} Pending`}
          sublabel="Over $1,000 threshold requirement"
          variant="warning"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <MetricTile
          label="Verified Photos"
          value={`${tickets.filter(t => t.status === 'photo_verified' || t.status === 'completed').length} Verified`}
          sublabel="Completion photos & contractor invoices"
          variant="success"
          icon={<Camera className="w-4 h-4" />}
        />
      </MetricGroup>

      {/* Tickets List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">Repair Dispatch Tickets ({tickets.length})</h3>

        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--sw-border)] pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[var(--sw-text-primary)]">{ticket.propertyAddress}</span>
                    <Badge variant="neutral">{ticket.repairCategory}</Badge>
                    <span className="text-xs font-mono text-[var(--sw-text-secondary)]">{ticket.transactionRef}</span>
                  </div>
                  <p className="text-xs text-[var(--sw-text-secondary)]">{ticket.repairDescription}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-bold text-sm text-[var(--brand-primary)]">${ticket.estimatedCost.toLocaleString()}</span>
                  <StatusBadge status={ticket.status === 'photo_verified' ? 'healthy' : ticket.status === 'bic_approval_pending' ? 'awaiting_approval' : 'active'} size="sm" />
                </div>
              </div>

              {/* Actions & Vendor Detail */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4 text-[var(--sw-text-secondary)]">
                  <span>Vendor: <strong className="text-[var(--sw-text-primary)]">{ticket.assignedVendor}</strong></span>
                  <span>Agent: <strong className="text-[var(--sw-text-primary)]">{ticket.agentName}</strong></span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {ticket.bicApprovalRequired && !ticket.bicApproved && (
                    <Button variant="danger" size="sm" onClick={() => handleBicApproveQuote(ticket.id)}>
                      Approve Quote (${ticket.estimatedCost})
                    </Button>
                  )}

                  {ticket.status === 'work_in_progress' && (
                    <Button variant="secondary" size="sm" loading={simulatingUpload} onClick={() => handleSimulateContractorPhotoSMS(ticket.id)}>
                      Simulate Contractor Photo SMS 📱
                    </Button>
                  )}

                  {ticket.status === 'photo_verified' && (
                    <Button variant="primary" size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={() => handleAgentSignoff(ticket.id)}>
                      Sign Off Repair
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
