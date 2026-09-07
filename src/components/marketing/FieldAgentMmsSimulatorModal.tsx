/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FieldAgentMmsSimulatorModal
 * Interactive mobile simulator allowing operators and brokers to simulate real field MMS
 * with photo attachments (preset or live file upload), voice memos, and NLP address extraction.
 */

import React, { useState, useRef } from 'react';
import {
  Smartphone,
  Send,
  Sparkles,
  Camera,
  Mic,
  Folder,
  Tv,
  CheckCircle2,
  ExternalLink,
  Layers,
  Clock,
  MapPin,
  Tag,
  FileText,
  User,
  X,
  Upload,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

interface FieldAgentMmsSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PhotoItem {
  id: string;
  name: string;
  url: string;
  type: string;
}

const DEFAULT_SAMPLE_PHOTOS: PhotoItem[] = [
  {
    id: 'photo_1',
    name: 'Front Elevation',
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=90',
    type: 'Exterior'
  },
  {
    id: 'photo_2',
    name: 'Gourmet Kitchen',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=90',
    type: 'Kitchen'
  },
  {
    id: 'photo_3',
    name: 'Great Room & Glazing',
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=90',
    type: 'Living'
  },
  {
    id: 'photo_4',
    name: 'Coastal Covered Loggia',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=90',
    type: 'Outdoor'
  }
];

const PRESET_BROKERS = [
  { name: 'Jessica Keenan', phone: '+19105550188', role: 'Broker-in-Charge / Specialist', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80' },
  { name: 'Matt Orr', phone: '+19106128283', role: 'Agent (REALTOR®)', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80' },
  { name: 'Dawn Thurston', phone: '+19105550166', role: 'Luxury Specialist', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80' },
  { name: 'Ryan Crecelius (BIC)', phone: '+19104097120', role: 'Principal Broker & Owner', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' }
];

export const FieldAgentMmsSimulatorModal: React.FC<FieldAgentMmsSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSimulatedPackageCreated
}) => {
  const [selectedBroker, setSelectedBroker] = useState(PRESET_BROKERS[0]);
  const [address, setAddress] = useState('304 Ocean Blvd, Wrightsville Beach, NC 28480');
  const [price, setPrice] = useState('$1,895,000');
  const [bedsBaths, setBedsBaths] = useState('4 Beds / 3.5 Baths');
  const [messageBody, setMessageBody] = useState('New Luxury Listing launch package! Photos attached. Need 8.5x11 flyer, yard sign post, 3-slide story, and Google Slides pitch deck.');
  const [includeVoiceMemo, setIncludeVoiceMemo] = useState(true);
  
  const [availablePhotos, setAvailablePhotos] = useState<PhotoItem[]>(DEFAULT_SAMPLE_PHOTOS);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>(['photo_1', 'photo_2', 'photo_3']);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [resultRecord, setResultRecord] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const togglePhoto = (id: string) => {
    setSelectedPhotos(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File, index: number) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newId = `custom_photo_${Date.now()}_${index}`;
        const newPhoto: PhotoItem = {
          id: newId,
          name: file.name.split('.')[0] || 'Uploaded Photo',
          url: dataUrl,
          type: 'Upload'
        };
        setAvailablePhotos(prev => [newPhoto, ...prev]);
        setSelectedPhotos(prev => [newId, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setResultRecord(null);

    const activePhotoUrls = availablePhotos
      .filter(p => selectedPhotos.includes(p.id))
      .map(p => p.url);

    try {
      const res = await fetch('/api/marketing/mms-messages/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPhone: selectedBroker.phone,
          body: `${address} — ${price} (${bedsBaths}). ${messageBody}`,
          mediaUrls: activePhotoUrls,
          audioVoiceMemoUrl: includeVoiceMemo ? 'https://actions.google.com/sounds/v1/speech/hello.ogg' : undefined
        })
      });

      const data = await res.json();
      if (data.success && data.mmsRecord) {
        setResultRecord(data);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Error simulating MMS:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00635C] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Field Agent MMS & Photo Asset Ingest</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate real field broker texts & photos to Nora hotline <strong className="text-slate-800 font-mono">(910) 507-2047</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSimulate} className="space-y-5">
          {/* 1. Broker Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Sending Broker (72-Agent Roster)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_BROKERS.map(broker => {
                const isSelected = selectedBroker.phone === broker.phone;
                return (
                  <button
                    key={broker.phone}
                    type="button"
                    onClick={() => setSelectedBroker(broker)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 border-[#00635C] text-[#00635C] shadow-2xs'
                        : 'bg-slate-50 border-slate-200/80 hover:bg-white text-slate-700'
                    }`}
                  >
                    <img src={broker.avatar} alt={broker.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{broker.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{broker.phone}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Listing Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Property Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 1420 South Live Oak Pkwy, Wilmington NC"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Price</label>
              <input
                type="text"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="$1,895,000"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Beds / Baths</label>
              <input
                type="text"
                value={bedsBaths}
                onChange={e => setBedsBaths(e.target.value)}
                placeholder="4 Beds / 3.5 Baths"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
              />
            </div>
          </div>

          {/* 3. Text Message Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Text Message Instructions</label>
            <textarea
              rows={2}
              value={messageBody}
              onChange={e => setMessageBody(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C] resize-none"
            />
          </div>

          {/* 4. Photo Asset Attachments (Preset + Real Device Upload) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#00635C]" />
                <span>Attached Photos ({selectedPhotos.length} Selected)</span>
              </label>
              
              {/* Real File Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-[#00635C] hover:text-[#004d47] flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200"
              >
                <Upload className="w-3 h-3" />
                <span>Upload From Device</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {availablePhotos.map(photo => {
                const isChecked = selectedPhotos.includes(photo.id);
                return (
                  <div
                    key={photo.id}
                    onClick={() => togglePhoto(photo.id)}
                    className={`relative rounded-xl border overflow-hidden cursor-pointer group transition ${
                      isChecked ? 'border-[#00635C] ring-2 ring-[#00635C]/30 shadow-xs' : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={photo.url} alt={photo.name} className="w-full h-20 object-cover" />
                    <div className="p-1.5 bg-white text-[10px] flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate">{photo.name}</span>
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-slate-100 text-slate-600">{photo.type}</span>
                    </div>
                    {isChecked && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#00635C] text-white flex items-center justify-center text-[10px] shadow-xs">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Voice Memo Toggle */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <input
              type="checkbox"
              id="voiceMemo"
              checked={includeVoiceMemo}
              onChange={e => setIncludeVoiceMemo(e.target.checked)}
              className="w-4 h-4 text-[#00635C] rounded border-slate-300 focus:ring-[#00635C] cursor-pointer"
            />
            <label htmlFor="voiceMemo" className="text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer">
              <Mic className="w-3.5 h-3.5 text-purple-600" />
              <span>Attach voice memo transcript (*"Hey Nora, double-sided print feature sheets & custom yard sign..."*)</span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Processing Real End-to-End Pipeline...' : `Simulate Text Message from ${selectedBroker.name}`}</span>
            </button>
          </div>
        </form>

        {/* Real-Time Telemetry Result Card */}
        {resultRecord && (
          <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Autonomous Ingest Completed</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Persisted to Disk & Live Synced
              </span>
            </div>

            {/* Generated Artifacts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={resultRecord.mmsRecord.driveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#00635C] transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-[#00635C]" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Google Drive Asset Pack</div>
                    <div className="text-[10px] text-slate-500">Scaffolded 4 Subfolders + Photos</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00635C]" />
              </a>

              <a
                href={resultRecord.mmsRecord.googleSlidesUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#00635C] transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Tv className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">8-Slide Google Slides CMA</div>
                    <div className="text-[10px] text-slate-500">Bound Specs & Comps</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
              </a>
            </div>

            {/* SMS Receipt Preview */}
            <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <span>Auto SMS Receipt Dispatched to {resultRecord.mmsRecord.fromPhone}</span>
                <span className="text-emerald-400">✓ Delivered</span>
              </div>
              <p className="whitespace-pre-line leading-relaxed text-slate-300 font-sans text-xs">
                {resultRecord.mmsRecord.smsReceiptBody}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
