/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CustomCompModal: Add Custom Off-Market Comp or Private Pocket Listing
 */

import React, { useState } from 'react';
import { 
  X, Plus, Home, DollarSign, MapPin, Sparkles, 
  CheckCircle2, Image as ImageIcon, ShieldCheck, Award
} from 'lucide-react';
import { LuxuryPropertyComp } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface CustomCompModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompAdded: (comp: LuxuryPropertyComp) => void;
  defaultNeighborhood?: string;
}

export const CustomCompModal: React.FC<CustomCompModalProps> = ({
  isOpen,
  onClose,
  onCompAdded,
  defaultNeighborhood = 'Landfall Golf & Country Club'
}) => {
  const { toast } = useToast();
  const [address, setAddress] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>(defaultNeighborhood);
  const [status, setStatus] = useState<LuxuryPropertyComp['status']>('closed');
  const [listPrice, setListPrice] = useState<string>('1275000');
  const [soldPrice, setSoldPrice] = useState<string>('1250000');
  const [beds, setBeds] = useState<string>('4');
  const [baths, setBaths] = useState<string>('3.5');
  const [heatedSqFt, setHeatedSqFt] = useState<string>('3400');
  const [lotAcres, setLotAcres] = useState<string>('0.55');
  const [yearBuilt, setYearBuilt] = useState<string>('2020');
  const [garageBays, setGarageBays] = useState<string>('3');
  const [hasPool, setHasPool] = useState<boolean>(true);
  const [hasDock, setHasDock] = useState<boolean>(false);
  const [hasGolfView, setHasGolfView] = useState<boolean>(true);
  const [conditionScore, setConditionScore] = useState<string>('9');
  const [daysOnMarket, setDaysOnMarket] = useState<string>('8');
  const [listingAgent, setListingAgent] = useState<string>('Ryan Crecelius');
  const [mlsNumber, setMlsNumber] = useState<string>('');
  const [highlights, setHighlights] = useState<string>('');
  const [heroPhoto, setHeroPhoto] = useState<string>('https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast.error({ title: 'Missing Address', description: 'Please enter a valid property address.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<LuxuryPropertyComp> = {
        propertyAddress: address.includes(',') ? address : `${address}, Wilmington, NC 28405`,
        neighborhood,
        status,
        listPrice: Number(listPrice) || 1200000,
        soldPrice: status === 'closed' ? Number(soldPrice) || Number(listPrice) : undefined,
        beds: Number(beds) || 4,
        baths: Number(baths) || 3.5,
        heatedSqFt: Number(heatedSqFt) || 3300,
        lotAcres: Number(lotAcres) || 0.5,
        yearBuilt: Number(yearBuilt) || 2020,
        garageBays: Number(garageBays) || 2,
        hasPool,
        hasDock,
        hasGolfView,
        conditionScore: Number(conditionScore) || 9,
        daysOnMarket: Number(daysOnMarket) || 7,
        listingAgent,
        mlsNumber: mlsNumber || (status === 'pocket_exclusive' ? `POCKET #${Math.floor(1000 + Math.random() * 9000)}` : `MLS #${Math.floor(10000000 + Math.random() * 900000)}`),
        propertyHighlights: highlights || 'Custom luxury comp registered via Nest Ops Spatial Console.',
        heroPhoto,
        photos: [
          { url: heroPhoto, caption: 'Primary Elevation', category: 'exterior' }
        ],
        amenities: [
          hasPool ? 'Heated Pool' : '',
          hasDock ? 'Deepwater Dock' : '',
          hasGolfView ? 'Golf Views' : '',
          `${garageBays}-Car Garage`
        ].filter(Boolean)
      };

      const res = await fetch('/api/comps/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.comp) {
        toast.success({
          title: 'Custom Comp Added',
          description: `${data.comp.propertyAddress.split(',')[0]} is now active on the spatial map!`
        });
        onCompAdded(data.comp);
        onClose();
      } else {
        throw new Error(data.error || 'Failed to add comp');
      }
    } catch (err: any) {
      toast.error({ title: 'Error Adding Comp', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs font-sans text-left animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00635C] text-white flex items-center justify-center font-bold text-xs">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Custom Comp / Pocket Listing</h3>
              <p className="text-xs text-slate-500">Add off-market sales, builder transactions, or custom MLS comps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Address & Neighborhood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Property Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. 1020 Pembroke Jones Dr"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Neighborhood</label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none bg-white cursor-pointer"
              >
                <option value="Landfall Golf & Country Club">Landfall Golf & Country Club</option>
                <option value="Wrightsville Beach">Wrightsville Beach</option>
                <option value="Autumn Hall / Mayfaire">Autumn Hall / Mayfaire</option>
                <option value="Figure Eight Island">Figure Eight Island</option>
                <option value="Historic Downtown Wilmington">Historic Downtown Wilmington</option>
              </select>
            </div>
          </div>

          {/* Status & Pricing */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Listing Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none bg-white cursor-pointer"
              >
                <option value="closed">Closed (Sold)</option>
                <option value="active">Active Listing</option>
                <option value="pending">Under Contract</option>
                <option value="pocket_exclusive">Pocket Exclusive</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">List Price ($)</label>
              <input
                type="number"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Sold Price ($)</label>
              <input
                type="number"
                disabled={status !== 'closed'}
                value={status === 'closed' ? soldPrice : ''}
                placeholder={status !== 'closed' ? 'N/A' : '1250000'}
                onChange={(e) => setSoldPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Specs: SqFt, Beds, Baths, Lot */}
          <div className="grid grid-cols-4 gap-2.5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Heated SqFt</label>
              <input
                type="number"
                value={heatedSqFt}
                onChange={(e) => setHeatedSqFt(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00635C] outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Beds / Baths</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={beds}
                  onChange={(e) => setBeds(e.target.value)}
                  className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 outline-none text-center"
                />
                <input
                  type="number"
                  step="0.5"
                  value={baths}
                  onChange={(e) => setBaths(e.target.value)}
                  className="w-1/2 px-2 py-2 rounded-xl border border-slate-200 outline-none text-center"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Year Built</label>
              <input
                type="number"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Garage Bays</label>
              <input
                type="number"
                value={garageBays}
                onChange={(e) => setGarageBays(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Luxury Amenity Toggles */}
          <div className="bg-[#F7F8F5] p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
              Luxury Feature Checklist (For Appraisal Matrix)
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPool}
                  onChange={(e) => setHasPool(e.target.checked)}
                  className="rounded text-[#00635C] focus:ring-[#00635C]"
                />
                <span className="font-medium text-slate-800">Heated Swimming Pool</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDock}
                  onChange={(e) => setHasDock(e.target.checked)}
                  className="rounded text-[#00635C] focus:ring-[#00635C]"
                />
                <span className="font-medium text-slate-800">Deepwater Boat Dock</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasGolfView}
                  onChange={(e) => setHasGolfView(e.target.checked)}
                  className="rounded text-[#00635C] focus:ring-[#00635C]"
                />
                <span className="font-medium text-slate-800">Golf Fairway View</span>
              </label>
            </div>
          </div>

          {/* Photo & Highlights */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">Photo URL</label>
            <input
              type="text"
              value={heroPhoto}
              onChange={(e) => setHeroPhoto(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-[11px] outline-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#00635C] hover:bg-[#004d47] text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Placing Comp...' : 'Add Comp to Map'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
