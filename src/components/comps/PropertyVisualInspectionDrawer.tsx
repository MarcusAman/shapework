/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PropertyVisualInspectionDrawer: High-Resolution Architectural Gallery & Street View Inspection
 */

import React, { useState } from 'react';
import { 
  X, Image as ImageIcon, MapPin, Eye, Compass, 
  ExternalLink, User, Phone, Mail, Award, CheckCircle2, ChevronLeft, ChevronRight, Layers, Maximize2
} from 'lucide-react';
import { LuxuryPropertyComp } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface PropertyVisualInspectionDrawerProps {
  property: LuxuryPropertyComp | null;
  isOpen: boolean;
  onClose: () => void;
  onSimulateOffer?: (property: LuxuryPropertyComp) => void;
}

export const PropertyVisualInspectionDrawer: React.FC<PropertyVisualInspectionDrawerProps> = ({
  property,
  isOpen,
  onClose,
  onSimulateOffer
}) => {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [activeViewMode, setActiveViewMode] = useState<'photos' | 'street_view'>('photos');

  if (!isOpen || !property) return null;

  const photos = property.photos && property.photos.length > 0
    ? property.photos
    : [
        { url: property.heroPhoto, caption: 'Primary Elevation', category: 'exterior' as const }
      ];

  const filteredPhotos = activeCategory === 'all'
    ? photos
    : photos.filter(p => p.category === activeCategory);

  const currentPhoto = filteredPhotos[selectedPhotoIndex] || filteredPhotos[0] || photos[0];

  const handleNextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev + 1) % filteredPhotos.length);
  };

  const handlePrevPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  const price = property.soldPrice || property.listPrice;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-left font-sans animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-slideInRight">
          
          {/* 1. Header Bar */}
          <div className="px-6 py-4 bg-[#F7F8F5] border-b border-slate-200 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  {property.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-500 font-mono">{property.mlsNumber}</span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                {property.propertyAddress.split(',')[0]}
              </h2>
              <p className="text-xs text-slate-500">{property.neighborhood} • {property.city}, {property.state}</p>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Visual View Mode Tabs */}
          <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveViewMode('photos')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activeViewMode === 'photos' ? 'bg-[#00635C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Architectural Photos ({photos.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('street_view')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activeViewMode === 'street_view' ? 'bg-[#00635C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Google Street & Aerial View
              </button>
            </div>

            <span className="font-extrabold text-sm text-[#00635C]">
              ${price.toLocaleString()}
            </span>
          </div>

          {/* 3. Main Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* View Mode: Photos */}
            {activeViewMode === 'photos' && (
              <div className="space-y-4">
                {/* Hero Showcase Frame */}
                <div className="relative w-full h-72 sm:h-80 bg-slate-900 rounded-2xl overflow-hidden shadow-md group">
                  <img 
                    src={currentPhoto.url} 
                    alt={currentPhoto.caption}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
                  />

                  {/* Left / Right Nav Arrows */}
                  {filteredPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevPhoto}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextPhoto}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Caption Overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3.5 text-white flex items-center justify-between text-xs">
                    <span className="font-medium truncate">{currentPhoto.caption}</span>
                    <span className="text-[10px] font-mono opacity-80 shrink-0">
                      {selectedPhotoIndex + 1} of {filteredPhotos.length}
                    </span>
                  </div>
                </div>

                {/* Photo Thumbnail Strip */}
                {filteredPhotos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {filteredPhotos.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                          selectedPhotoIndex === idx ? 'border-[#00635C] scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* View Mode: Google Street & Aerial View Embed */}
            {activeViewMode === 'street_view' && (
              <div className="space-y-4">
                <div className="relative w-full h-80 bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
                  <iframe
                    title="Google Street View Preview"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(property.propertyAddress)}&t=k&z=17&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full border-none"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-800 border border-slate-200 shadow-xs">
                    📍 Satellite GIS View • {property.coordinates.lat.toFixed(4)}°N, {Math.abs(property.coordinates.lng).toFixed(4)}°W
                  </div>
                </div>
              </div>
            )}

            {/* Property Specs Grid */}
            <div className="bg-[#F7F8F5] border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Luxury Property Specifications
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Price / SqFt</span>
                  <span className="font-extrabold text-slate-900 text-sm font-mono">${property.pricePerSqFt}/sf</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Heated Space</span>
                  <span className="font-bold text-slate-900">{property.heatedSqFt.toLocaleString()} SqFt</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Beds & Baths</span>
                  <span className="font-bold text-slate-900">{property.beds} Bed, {property.baths} Bath</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Lot & Garage</span>
                  <span className="font-bold text-slate-900">{property.lotAcres} Ac • {property.garageBays} Bay</span>
                </div>
              </div>

              {/* Amenities */}
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Amenities & Architectural Highlights
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {property.amenities.map((a, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-medium">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {property.propertyHighlights && (
                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                  "{property.propertyHighlights}"
                </p>
              )}
            </div>

            {/* Listing Agent Contact Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00635C] text-white flex items-center justify-center font-bold text-xs">
                  {property.listingAgent.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{property.listingAgent}</span>
                  <span className="text-[11px] text-slate-500">{property.listingBrokerage}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${property.agentPhone}`}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="Call Agent"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href={`mailto:${property.agentEmail}`}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="Email Agent"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Action Bar */}
            {onSimulateOffer && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onSimulateOffer(property);
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-[#00635C] hover:bg-[#004d47] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  Simulate Form 2-T Offer for {property.propertyAddress.split(',')[0]}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
