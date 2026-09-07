/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Pre-MLS & Off-Market Board — Phase C Light-Mode Redesign
 * Refactored to canonical Shapework B1/B2/B3 design primitives.
 */

import React, { useState } from 'react';
import {
  Building2, MessageSquare, Clock, CheckCircle, AlertTriangle,
  ArrowRight, Search, Plus, Filter, Users, Send, FileText, Check, Shield
} from 'lucide-react';
import {
  Card,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  MetricTile,
  MetricGroup,
  TextInput,
  Modal
} from '../ui';

interface PocketListing {
  id: string;
  address: string;
  price: number;
  specs: string;
  office: string;
  listingAgent: string;
  agentPhone: string;
  ncrecDayCount: number; // Out of 21 days
  matchedBuyersCount: number;
  status: 'active_pocket' | 'intro_in_progress' | 'mls_scheduled';
  matchedAgents: string[];
  createdAt: string;
}

const INITIAL_POCKET_LISTINGS: PocketListing[] = [
  {
    id: 'pocket-101',
    address: '312 Mayfaire Town Center Way, Wilmington, NC',
    price: 850000,
    specs: '4 Bed • 3.5 Bath • 3,200 sqft',
    office: 'Mayfaire',
    listingAgent: 'Marcus Vance',
    agentPhone: '(910) 555-0142',
    ncrecDayCount: 6,
    matchedBuyersCount: 3,
    status: 'active_pocket',
    matchedAgents: ['Jessica Keenan', 'Jessica Miller', 'Matt Orr'],
    createdAt: '2 hours ago'
  },
  {
    id: 'pocket-102',
    address: '104 Main St, Historic Downtown Wilmington, NC',
    price: 620000,
    specs: '3 Bed • 2 Bath • 2,100 sqft',
    office: 'Wilmington',
    listingAgent: 'Jessica Keenan',
    agentPhone: '(910) 555-0188',
    ncrecDayCount: 11,
    matchedBuyersCount: 2,
    status: 'intro_in_progress',
    matchedAgents: ['Eric Knight', 'Marcus Vance'],
    createdAt: 'Yesterday'
  },
  {
    id: 'pocket-103',
    address: '402 Waterfront Way, Wrightsville Beach, NC',
    price: 1250000,
    specs: '5 Bed • 4 Bath • 4,100 sqft',
    office: 'Mayfaire',
    listingAgent: 'Jessica Miller',
    agentPhone: '(910) 555-0199',
    ncrecDayCount: 3,
    matchedBuyersCount: 4,
    status: 'active_pocket',
    matchedAgents: ['Matt Orr', 'James Fort', 'Jessica Keenan', 'Marcus Vance'],
    createdAt: '3 hours ago'
  }
];

export default function PreMLSBoard() {
  const [pocketListings, setPocketListings] = useState<PocketListing[]>(INITIAL_POCKET_LISTINGS);
  const [simulatingText, setSimulatingText] = useState(false);
  const [newPropertyText, setNewPropertyText] = useState('');
  const [activeIntroModal, setActiveIntroModal] = useState<PocketListing | null>(null);
  const [introSent, setIntroSent] = useState(false);

  const handleSimulateNewPocket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropertyText.trim()) return;

    setSimulatingText(true);

    setTimeout(() => {
      const newListing: PocketListing = {
        id: `pocket-${Date.now()}`,
        address: newPropertyText.includes('NC') ? newPropertyText : `${newPropertyText}, Wilmington, NC`,
        price: 920000,
        specs: '4 Bed • 3 Bath • 2,900 sqft',
        office: 'Wilmington',
        listingAgent: 'Matt Orr',
        agentPhone: '(910) 555-0173',
        ncrecDayCount: 1,
        matchedBuyersCount: 3,
        status: 'active_pocket',
        matchedAgents: ['James Fort', 'Marcus Vance', 'Eric Knight'],
        createdAt: 'Just now'
      };

      setPocketListings([newListing, ...pocketListings]);
      setNewPropertyText('');
      setSimulatingText(false);
    }, 1200);
  };

  const handleTrigger3WayIntro = (listing: PocketListing) => {
    setActiveIntroModal(listing);
    setIntroSent(false);
  };

  const handleConfirmSendIntro = () => {
    setIntroSent(true);
    setTimeout(() => {
      if (activeIntroModal) {
        setPocketListings(pocketListings.map(p => 
          p.id === activeIntroModal.id ? { ...p, status: 'intro_in_progress' } : p
        ));
      }
      setTimeout(() => {
        setActiveIntroModal(null);
        setIntroSent(false);
      }, 1000);
    }, 800);
  };

  return (
    <div className="space-y-6 text-left select-none">
      
      {/* Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand" icon={<Building2 className="w-3.5 h-3.5" />}>
              Pre-MLS & Pocket Matching Engine
            </Badge>
            <span className="text-xs text-[var(--sw-text-secondary)] font-medium">NCREC 21-Day Clock Enabled</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--sw-text-primary)] mt-1.5">
            Internal Off-Market & Pre-MLS Match Board
          </h1>
          <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5 max-w-3xl leading-relaxed">
            Agents text coming-soon properties to Shapework via SMS. Shapework instantly matches active buyer criteria across all 74 Nest agents and triggers 3-way intro threads.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <MetricGroup columns={3}>
        <MetricTile
          label="Active Pockets"
          value={`${pocketListings.length} Listings`}
          sublabel="Internal off-market properties"
          variant="brand"
        />
        <MetricTile
          label="Avg Buyer Match"
          value="3.2 / Listing"
          sublabel="Matched agent buyer profiles"
          variant="success"
        />
        <MetricTile
          label="NCREC Clock Guard"
          value="21 Days Limit"
          sublabel="0 Rule A.0108 compliance violations"
          variant="success"
          icon={<Shield className="w-4 h-4" />}
        />
      </MetricGroup>

      {/* NCREC Rule A.0108 21-Day Compliance Banner */}
      <Card className="border-l-4 border-l-[var(--brand-secondary)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--brand-secondary)]" />
            <span className="font-mono font-bold text-[var(--brand-secondary)] uppercase text-[10px] tracking-wider">
              NCREC Rule A.0108 Compliance Engine • 21-Day Limits
            </span>
          </div>
          <p className="text-xs text-[var(--sw-text-primary)] font-medium">
            All active pocket listings are compliant. Automatic SMS warnings trigger at <strong>Day 14</strong> (7 days remaining) and <strong>Day 19</strong> (48 hours to mandatory FlexMLS launch).
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => alert('📱 Simulating NCREC Day 14 Warning SMS to Marcus Vance: "7 days remaining for 312 Mayfaire Town Center Way before mandatory FlexMLS launch under NCREC Rule A.0108."')}
        >
          Simulate Day 14 Warning SMS 📱
        </Button>
      </Card>

      {/* SMS Intake Bar */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[var(--brand-secondary)]" />
          <h3 className="text-sm font-bold text-[var(--sw-text-primary)]">Simulate Agent SMS Property Intake</h3>
        </div>

        <form onSubmit={handleSimulateNewPocket} className="flex items-center gap-3">
          <div className="flex-1">
            <TextInput
              placeholder="e.g. Texting 'New pocket listing: 504 Lumina Ave, 4 bed $1.1M'..."
              value={newPropertyText}
              onChange={(e) => setNewPropertyText(e.target.value)}
            />
          </div>
          <Button variant="primary" size="md" loading={simulatingText} type="submit" icon={<Send className="w-3.5 h-3.5" />}>
            Simulate SMS
          </Button>
        </form>
      </Card>

      {/* Pocket Listings Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">Active Pocket Listings ({pocketListings.length})</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pocketListings.map((listing) => (
            <Card key={listing.id} className="space-y-3 p-5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--sw-text-primary)]">{listing.address}</h4>
                    <span className="text-xs text-[var(--sw-text-secondary)]">{listing.specs}</span>
                  </div>
                  <StatusBadge status={listing.status === 'active_pocket' ? 'active' : 'approved'} size="sm" />
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="font-bold text-[var(--brand-primary)] text-sm">${listing.price.toLocaleString()}</span>
                  <span className="text-[var(--sw-text-secondary)]">Agent: {listing.listingAgent}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--sw-border)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-[var(--sw-text-secondary)]">
                  <Users className="w-3.5 h-3.5 text-[var(--brand-secondary)]" />
                  <span>{listing.matchedBuyersCount} buyer matches</span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleTrigger3WayIntro(listing)}
                >
                  Create 3-Way Intro
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Intro Modal */}
      {activeIntroModal && (
        <Modal
          isOpen={!!activeIntroModal}
          onClose={() => setActiveIntroModal(null)}
          title="Create 3-Way SMS Intro Thread"
          subtitle={`Connecting listing agent ${activeIntroModal.listingAgent} with matched agent buyers.`}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setActiveIntroModal(null)}>Cancel</Button>
              <Button variant="primary" size="sm" loading={introSent} onClick={handleConfirmSendIntro}>
                {introSent ? 'Intro Sent!' : 'Send SMS Intro'}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-[var(--sw-text-secondary)]">
              This will automatically dispatch single-use property flyers and start a 3-way text thread with <strong>{activeIntroModal.listingAgent}</strong>.
            </p>
            <Card className="p-3 bg-[var(--sw-canvas)] text-xs">
              <span className="font-bold text-[var(--sw-text-primary)]">{activeIntroModal.address}</span>
              <p className="text-[var(--sw-text-secondary)] mt-0.5">${activeIntroModal.price.toLocaleString()} • {activeIntroModal.specs}</p>
            </Card>
          </div>
        </Modal>
      )}
    </div>
  );
}
