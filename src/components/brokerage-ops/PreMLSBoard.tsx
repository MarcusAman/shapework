/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2, MessageSquare, Clock, CheckCircle, AlertTriangle,
  ArrowRight, Search, Plus, Filter, Users, Send, FileText, Check, Shield
} from 'lucide-react';

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
    matchedAgents: ['Sarah Jenkins', 'Jessica Miller', 'Matt Orr'],
    createdAt: '2 hours ago'
  },
  {
    id: 'pocket-102',
    address: '104 Main St, Historic Downtown Wilmington, NC',
    price: 620000,
    specs: '3 Bed • 2 Bath • 2,100 sqft',
    office: 'Wilmington',
    listingAgent: 'Sarah Jenkins',
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
    matchedAgents: ['Matt Orr', 'Sarah Jenkins', 'Jessica Keenan', 'Marcus Vance'],
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
        matchedAgents: ['Sarah Jenkins', 'Marcus Vance', 'Eric Knight'],
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
    <div className="space-y-6 font-sans text-[#F6F7F1]">
      
      {/* Header & Overview */}
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
              <span className="px-3.5 py-1 bg-[#004d40] text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/30">
                Pre-MLS & Pocket Matching Engine
              </span>
              <span className="text-xs text-[#D0D6BB]">NCREC 21-Day Clock Enabled</span>
            </div>
            <h2 className="font-serif text-2xl font-black text-white tracking-tight mt-2">
              Internal Off-Market & Pre-MLS Match Board
            </h2>
            <p className="text-xs text-[#D0D6BB] max-w-3xl leading-relaxed mt-1">
              Agents text coming-soon properties to shapework via SMS. shapework instantly matches active buyer criteria across all 74 Nest agents, sends 1-click SMS broadcasts, and creates 3-way intro threads with single-use flyers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 bg-black/40 border border-white/10 rounded-2xl text-center">
              <span className="text-[10px] text-[#D0D6BB] block uppercase font-sans">Active Pockets</span>
              <strong className="text-xl text-white font-black">{pocketListings.length} Listings</strong>
            </div>
            <div className="p-3 bg-black/40 border border-white/10 rounded-2xl text-center">
              <span className="text-[10px] text-[#D0D6BB] block uppercase font-sans">Avg Buyer Match</span>
              <strong className="text-xl text-white font-black">3.2 / Listing</strong>
            </div>
          </div>
        </div>
      </div>

      {/* NCREC Rule A.0108 21-Day Compliance Banner */}
      <div 
        className="p-5 rounded-[24px] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-sans text-xs text-left"
        style={{
          background: 'rgba(0, 43, 36, 0.85)',
          border: '1px solid rgba(0, 229, 201, 0.3)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00E5C9]" />
            <span className="font-mono font-bold text-[#00E5C9] uppercase text-[10px] tracking-wider">
              NCREC Rule A.0108 Compliance Engine • 21-Day Coming Soon Limits
            </span>
          </div>
          <p className="text-white font-medium">
            All 3 active pocket listings are compliant. Automatic SMS warnings trigger at <strong>Day 14</strong> (7 days remaining) and <strong>Day 19</strong> (48 hours to mandatory FlexMLS launch).
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('📱 Simulating NCREC Day 14 Warning SMS to Marcus Vance: "7 days remaining for 312 Mayfaire Town Center Way before mandatory FlexMLS launch under NCREC Rule A.0108."')}
          className="px-3.5 py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-[10px] font-mono font-bold uppercase transition-all shrink-0 cursor-pointer border border-[#00E5C9]/40"
        >
          Simulate Day 14 NCREC SMS Warning 📱
        </button>
      </div>

      {/* SMS Intake Bar */}
      <div 
        className="rounded-[28px] p-6 text-left shadow-xl"
        style={{
          background: 'rgba(246, 247, 241, 0.10)',
          border: '1px solid rgba(246, 247, 241, 0.18)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <form onSubmit={handleSimulateNewPocket} className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-white block">
              Simulate Inbound Agent SMS Listing Broadcast
            </label>
            <input
              type="text"
              value={newPropertyText}
              onChange={(e) => setNewPropertyText(e.target.value)}
              placeholder="e.g. Just took a pocket at 508 Landfall Dr, 4 bed, $1.1M, coming next month"
              className="w-full px-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder:text-[#D0D6BB]/50 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={simulatingText}
            className="px-6 py-3 bg-[#00635C] hover:bg-[#007c73] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0 md:mt-5"
          >
            {simulatingText ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Matching Roster Buyers...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Simulate Agent SMS Broadcast</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Grid of Pocket Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pocketListings.map((listing) => (
          <div
            key={listing.id}
            className="rounded-[28px] p-6 space-y-4 text-left shadow-xl hover:border-white/30 transition-all group"
            style={{
              background: 'rgba(246, 247, 241, 0.10)',
              border: '1px solid rgba(246, 247, 241, 0.18)',
              backdropFilter: 'blur(18px)'
            }}
          >
            {/* Top Bar */}
            <div className="space-y-2 border-b border-white/10 pb-4">
              <div className="flex justify-between items-start">
                <span className="px-3 py-1 bg-emerald-950/60 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
                  {listing.status === 'active_pocket' ? 'Active Pocket' : 'Intro Active'}
                </span>
                <span className="text-[10px] text-[#D0D6BB]">{listing.createdAt}</span>
              </div>

              <h3 className="font-serif text-base font-black text-white group-hover:text-emerald-300 transition-colors leading-tight">
                {listing.address}
              </h3>
              <p className="text-xs text-[#D0D6BB]">{listing.specs}</p>
              
              <div className="text-xl font-extrabold text-emerald-400">
                ${listing.price.toLocaleString()}
              </div>
            </div>

            {/* Listing Details & Agent */}
            <div className="p-3.5 bg-black/30 border border-white/10 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#D0D6BB]">
                <span>Listing Agent:</span>
                <strong className="text-white font-semibold">{listing.listingAgent}</strong>
              </div>

              <div className="flex justify-between items-center text-[#D0D6BB]">
                <span>NCREC 21-Day Clock:</span>
                <span className="text-white font-bold">Day {listing.ncrecDayCount} of 21</span>
              </div>

              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(listing.ncrecDayCount / 21) * 100}%` }}
                />
              </div>
            </div>

            {/* Matched Roster Agents */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#D0D6BB]/70">Matched Roster Agents ({listing.matchedBuyersCount}):</span>
                <span className="text-emerald-400 font-bold">100% Criteria Match</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {listing.matchedAgents.map((agent, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 bg-black/30 border border-white/10 rounded-full text-[10px] text-white font-medium"
                  >
                    {agent}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleTrigger3WayIntro(listing)}
              className="w-full py-3 bg-[#004d40] hover:bg-[#00635c] border border-emerald-400/40 text-white font-bold rounded-full text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99]"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Generate 3-Way SMS Agent Intro</span>
            </button>
          </div>
        ))}
      </div>

      {/* 3-Way SMS Intro Modal */}
      {activeIntroModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#002b23] border border-white/20 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>3-Way SMS Intro Thread Generator</span>
              </h3>
              <button
                onClick={() => setActiveIntroModal(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 font-mono space-y-1">
                <div className="text-[#D0D6BB]">Property: <strong className="text-white font-sans">{activeIntroModal.address}</strong></div>
                <div className="text-[#D0D6BB]">Listing Agent: <strong className="text-white font-sans">{activeIntroModal.listingAgent}</strong></div>
                <div className="text-[#D0D6BB]">Buyer Agents to Intro: <strong className="text-emerald-300 font-sans">{activeIntroModal.matchedAgents.join(', ')}</strong></div>
              </div>

              {introSent ? (
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center space-y-1 animate-fadeIn">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="text-emerald-300 font-bold">3-Way SMS Intro Thread Created!</p>
                  <p className="text-[11px] text-[#D0D6BB]/70 font-mono">Single-use property flyer link sent to buyer agents via Twilio Gateway.</p>
                </div>
              ) : (
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[#D0D6BB] leading-relaxed">
                  "Hey {activeIntroModal.matchedAgents[0]} & {activeIntroModal.listingAgent}! Connecting you regarding the pre-MLS listing at {activeIntroModal.address}. View single-use flyer: <strong>https://shapework.app/flyer/pocket-{activeIntroModal.id}.pdf</strong>"
                </div>
              )}
            </div>

            {!introSent && (
              <button
                onClick={handleConfirmSendIntro}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>Confirm & Send 3-Way SMS Intro</span>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
