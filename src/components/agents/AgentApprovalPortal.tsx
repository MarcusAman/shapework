/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  FolderCheck, 
  ShieldCheck, 
  Building, 
  MapPin, 
  Calendar, 
  Download, 
  Share2, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  Mail, 
  Smartphone,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface AgentApprovalPortalProps {
  token?: string;
  onApproveSuccess?: () => void;
}

export default function AgentApprovalPortal({ token = 'demo-token', onApproveSuccess }: AgentApprovalPortalProps) {
  const [isApproved, setIsApproved] = useState(false);
  const [approvedAt, setApprovedAt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssetIdx, setSelectedAssetIdx] = useState(0);

  const listingInfo = {
    address: '212 Wetland Park Dr',
    cityStateZip: 'Wilmington, NC 28405',
    price: '$925,000',
    bedsBathsSqft: '4 Beds • 3.5 Baths • 3,420 SqFt',
    launchDate: 'Aug 5, 2026',
    agentName: 'Ryan Crecelius',
    marketingLead: 'Melissa Gagliardi',
    driveFolderUrl: 'https://drive.google.com/drive/folders/nest-realty-wilmington-212-wetland'
  };

  const assets = [
    {
      id: 'flyer',
      title: '2-Page Luxury Print Flyer',
      desc: '8.5x11 high-resolution property brochure for open house presentation.',
      type: 'PDF Print Document',
      previewImg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'social',
      title: 'Instagram & Facebook Post',
      desc: '1080x1080 square graphic featuring primary photo & key features.',
      type: 'Social Asset',
      previewImg: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'postcard',
      title: 'Just Listed Direct Mail Postcard',
      desc: '6x9 oversized postcard tailored for surrounding neighborhood campaign.',
      type: 'Direct Mail',
      previewImg: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'rider',
      title: 'Yard Rider Signage Graphic',
      desc: 'High-contrast QR code rider graphic linking to property landing page.',
      type: 'Physical Signage',
      previewImg: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'landing',
      title: 'Single-Property Landing Page',
      desc: 'Interactive 3D tour landing page with instant lead capture form.',
      type: 'Web Portal',
      previewImg: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  const handleApprove = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsApproved(true);
      setApprovedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (onApproveSuccess) onApproveSuccess();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#001E18] text-[#F6F7F1] font-sans antialiased pb-16 selection:bg-[#00635C] selection:text-white">
      {/* Top Mobile Bar */}
      <div className="sticky top-0 z-40 bg-[#002B24]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00635C] flex items-center justify-center text-emerald-300 font-bold border border-emerald-400/30 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-serif font-black text-white uppercase tracking-wider block">Nest Realty OS</span>
            <span className="text-[10px] text-[#D0D6BB] font-mono block">1-Click Agent Approval Link</span>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Token Verified
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Listing Header Card */}
        <div className="bg-[#002B24]/70 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">Marketing Package Approval</span>
              <h1 className="text-xl font-serif font-black text-white mt-0.5">{listingInfo.address}</h1>
              <p className="text-xs text-[#D0D6BB] font-mono flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{listingInfo.cityStateZip}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-lg font-serif font-black text-white block">{listingInfo.price}</span>
              <span className="text-[10px] text-[#D0D6BB] font-mono block">{listingInfo.bedsBathsSqft}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
            <div className="bg-black/30 border border-white/10 rounded-2xl p-3">
              <span className="text-[9px] text-[#D0D6BB]/70 uppercase block font-bold">Target Launch Date</span>
              <span className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> {listingInfo.launchDate}
              </span>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-2xl p-3">
              <span className="text-[9px] text-[#D0D6BB]/70 uppercase block font-bold">Marketing Owner</span>
              <span className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-emerald-400" /> {listingInfo.marketingLead}
              </span>
            </div>
          </div>
        </div>

        {/* Action Status Banner */}
        {isApproved ? (
          <div className="bg-emerald-950/80 border border-emerald-400/50 rounded-3xl p-6 text-center space-y-3 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-serif font-black text-white uppercase tracking-wider">Package Approved & Dispatched!</h3>
              <p className="text-xs text-emerald-200 mt-1">
                Approved by {listingInfo.agentName} at {approvedAt}. All 5 collateral assets have been auto-synced to Google Drive.
              </p>
            </div>
            <a
              href={listingInfo.driveFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-2xl text-xs font-mono font-bold transition-all shadow-lg border border-emerald-400/40"
            >
              <FolderCheck className="w-4 h-4 text-emerald-300" />
              <span>Open Google Drive Listing Folder</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        ) : (
          <div className="bg-[#002B24]/90 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="space-y-1">
              <h3 className="text-base font-serif font-black text-white uppercase tracking-wider">Review & Approve Marketing Collateral</h3>
              <p className="text-xs text-[#D0D6BB]">
                Confirm these 5 design assets are ready for print & digital distribution for {listingInfo.address}.
              </p>
            </div>

            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="w-full py-4 bg-[#00635C] hover:bg-[#007c73] text-white rounded-2xl text-sm font-mono font-bold uppercase tracking-wider transition-all shadow-xl border border-emerald-400/40 flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-300" />
                  <span>Syncing to Google Drive...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>1-Tap Approve & Release Marketing Package</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Collateral Gallery Showcase */}
        <div className="bg-[#002B24]/70 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="font-serif font-black text-white text-base uppercase tracking-wider">
                Collateral Asset Preview ({assets.length})
              </h3>
              <p className="text-xs text-[#D0D6BB]">Tap any asset tab below to inspect full preview.</p>
            </div>
          </div>

          {/* Asset Selection Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {assets.map((asset, idx) => (
              <button
                key={asset.id}
                onClick={() => setSelectedAssetIdx(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedAssetIdx === idx
                    ? 'bg-[#00635C] text-white border-emerald-400/40 shadow-md'
                    : 'bg-black/30 text-[#D0D6BB]/70 hover:text-white border-white/5'
                }`}
              >
                {asset.title}
              </button>
            ))}
          </div>

          {/* Asset Detail Card */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video group shadow-xl">
              <img
                src={assets[selectedAssetIdx].previewImg}
                alt={assets[selectedAssetIdx].title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-5 flex flex-col justify-end">
                <span className="px-2.5 py-0.5 bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 rounded-full font-mono text-[9px] font-bold uppercase w-max mb-1">
                  {assets[selectedAssetIdx].type}
                </span>
                <h4 className="font-serif font-black text-white text-lg">{assets[selectedAssetIdx].title}</h4>
                <p className="text-xs text-[#D0D6BB] font-sans mt-0.5">{assets[selectedAssetIdx].desc}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono bg-black/30 border border-white/10 rounded-2xl p-4">
              <span className="text-[#D0D6BB]">Asset Status: <strong className="text-emerald-400">{isApproved ? 'Approved & Uploaded' : 'Pending Approval'}</strong></span>
              <a
                href={listingInfo.driveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 hover:underline flex items-center gap-1 font-bold"
              >
                <span>View File</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
