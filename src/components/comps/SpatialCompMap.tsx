/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SpatialCompMap: Full-Width High-Resolution Satellite Aerial & Luxury Vector GIS Map
 * Full-bleed canvas with floating macOS-style glassmorphism control pods, collapsible comp drawer,
 * Coastal Lifestyle Isochrones, Interactive Address Omnibox Search, and Spatial Polygon / Lasso Tool.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  MapPin, Navigation, Layers, Compass, Eye, ShieldCheck, 
  DollarSign, Home, Maximize2, ExternalLink, Plus, Minus, RotateCcw,
  ChevronRight, ChevronLeft, Award, Sparkles, Building2, Sliders, Clock, Map, Search, X,
  PenTool, Check, Trash2, Copy, Filter
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface SpatialCompMapProps {
  subjectProperty: LuxuryPropertyComp;
  comps: (LuxuryPropertyComp & { distanceMiles?: number })[];
  selectedCompId: string | null;
  onSelectComp: (comp: LuxuryPropertyComp) => void;
  radiusMiles: number;
  onRadiusChange: (radius: number) => void;
  onAddressResolved?: (res: any) => void;
  onPolygonFilterChange?: (res: any) => void;
}

// Convert Lat/Lng to Web Mercator Tile X/Y at Zoom level
function latLngToTile(lat: number, lng: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

// Convert Lat/Lng to Pixel Offset relative to center Lat/Lng at Zoom level
function latLngToPixelOffset(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number
) {
  const scale = 256 * Math.pow(2, zoom);
  
  // Center mercator coords
  const centerLatRad = (centerLat * Math.PI) / 180;
  const centerX = ((centerLng + 180) / 360) * scale;
  const centerY =
    ((1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2) * scale;

  // Target mercator coords
  const targetLatRad = (lat * Math.PI) / 180;
  const targetX = ((lng + 180) / 360) * scale;
  const targetY =
    ((1 - Math.log(Math.tan(targetLatRad) + 1 / Math.cos(targetLatRad)) / Math.PI) / 2) * scale;

  return {
    dx: targetX - centerX,
    dy: targetY - centerY
  };
}

// Invert Pixel Offset to Lat/Lng
function pixelOffsetToLatLng(
  dx: number,
  dy: number,
  centerLat: number,
  centerLng: number,
  zoom: number
) {
  const scale = 256 * Math.pow(2, zoom);
  
  const centerLatRad = (centerLat * Math.PI) / 180;
  const centerX = ((centerLng + 180) / 360) * scale;
  const centerY =
    ((1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2) * scale;

  const targetX = centerX + dx;
  const targetY = centerY + dy;

  const lng = (targetX / scale) * 360 - 180;
  const n = Math.PI - 2 * Math.PI * (targetY / scale);
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

  return { lat, lng };
}

export const SpatialCompMap: React.FC<SpatialCompMapProps> = ({
  subjectProperty,
  comps,
  selectedCompId,
  onSelectComp,
  radiusMiles,
  onRadiusChange,
  onAddressResolved,
  onPolygonFilterChange
}) => {
  const { toast } = useToast();
  const [mapType, setMapType] = useState<'satellite' | 'roadmap'>('satellite');
  const [zoom, setZoom] = useState<number>(14);
  const [hoveredComp, setHoveredComp] = useState<LuxuryPropertyComp | null>(null);
  const [hoveredLandmark, setHoveredLandmark] = useState<any | null>(null);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [showLifestyleLayer, setShowLifestyleLayer] = useState<boolean>(true);

  // Address Search Omnibox State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mapCanvasRef = useRef<HTMLDivElement>(null);

  // Polygon / Lasso Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [polygonVertices, setPolygonVertices] = useState<Array<{ lat: number; lng: number; dx: number; dy: number }>>([]);
  const [isPolygonClosed, setIsPolygonClosed] = useState<boolean>(false);
  const [polygonStats, setPolygonStats] = useState<any | null>(null);

  const allPoints = useMemo(() => [subjectProperty, ...comps], [subjectProperty, comps]);

  // Center Lat/Lng is subject property
  const centerLat = subjectProperty.coordinates.lat;
  const centerLng = subjectProperty.coordinates.lng;

  // Lifestyle Landmarks from Risk Profile
  const lifestyleProfile = useMemo(() => 
    PropertyCompsRepository.getCoastalRiskProfile(subjectProperty.id), 
    [subjectProperty.id]
  );

  // Calculate required tile grid around center (5x5 grid = 25 tiles for full-width expansive coverage)
  const centerTile = useMemo(() => latLngToTile(centerLat, centerLng, zoom), [centerLat, centerLng, zoom]);

  const tileGrid = useMemo(() => {
    const tiles: Array<{ x: number; y: number; key: string; offsetX: number; offsetY: number }> = [];
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const tx = centerTile.x + dx;
        const ty = centerTile.y + dy;
        tiles.push({
          x: tx,
          y: ty,
          key: `${zoom}_${tx}_${ty}`,
          offsetX: dx * 256,
          offsetY: dy * 256
        });
      }
    }
    return tiles;
  }, [centerTile, zoom]);

  // Tile URL Generator (True High-Res Satellite Aerial Tiles via Esri & Carto)
  const getTileUrl = (x: number, y: number, z: number, type: 'satellite' | 'roadmap') => {
    if (type === 'satellite') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    }
    const subdomains = ['a', 'b', 'c', 'd'];
    const s = subdomains[Math.abs(x + y) % subdomains.length];
    return `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
  };

  // Status Pin Helpers
  const getStatusBadgeColor = (status: LuxuryPropertyComp['status']) => {
    switch (status) {
      case 'subject':
        return 'bg-[#00635C] text-white ring-4 ring-[#00635C]/35 font-extrabold shadow-lg';
      case 'active':
        return 'bg-amber-600 text-white ring-2 ring-amber-400 font-bold shadow-md';
      case 'pending':
        return 'bg-blue-600 text-white ring-2 ring-blue-300 font-bold shadow-md';
      case 'closed':
        return 'bg-slate-800 text-white ring-2 ring-slate-400 font-bold shadow-md';
      case 'pocket_exclusive':
        return 'bg-purple-700 text-white ring-2 ring-purple-400 font-bold shadow-md';
      default:
        return 'bg-slate-800 text-white font-bold';
    }
  };

  const formatPriceAbbr = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2).replace(/\.00$/, '')}M`;
    }
    return `$${Math.round(price / 1000)}k`;
  };

  // Drag / Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDrawingMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isDrawingMode) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetCenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(14);
  };

  // Map Canvas Click Handler (Adds polygon vertices when in drawing mode)
  const handleMapCanvasClick = (e: React.MouseEvent) => {
    if (!isDrawingMode || isPolygonClosed) return;
    if (!mapCanvasRef.current) return;

    const rect = mapCanvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Center of map viewport
    const canvasCenterX = rect.width / 2;
    const canvasCenterY = rect.height / 2;

    // Offset relative to center (including panOffset)
    const dx = clickX - canvasCenterX - panOffset.x;
    const dy = clickY - canvasCenterY - panOffset.y;

    const { lat, lng } = pixelOffsetToLatLng(dx, dy, centerLat, centerLng, zoom);

    const newVertex = { lat, lng, dx, dy };
    const updated = [...polygonVertices, newVertex];
    setPolygonVertices(updated);

    if (updated.length === 1) {
      toast.info({
        title: 'Drawing Boundary',
        description: 'Click 2 or more points on the map, then click Complete Shape.'
      });
    }
  };

  // Complete Polygon Action
  const handleCompletePolygon = () => {
    if (polygonVertices.length < 3) {
      toast.error({
        title: 'Incomplete Boundary',
        description: 'Please click at least 3 points on the map to form a boundary.'
      });
      return;
    }

    setIsPolygonClosed(true);
    setIsDrawingMode(false);

    const coords = polygonVertices.map(v => ({ lat: v.lat, lng: v.lng }));
    const result = PropertyCompsRepository.filterCompsByPolygon(subjectProperty.id, coords);
    setPolygonStats(result.summary);

    if (onPolygonFilterChange) {
      onPolygonFilterChange(result);
    }

    toast.success({
      title: 'Custom Boundary Applied',
      description: `Isolated ${result.summary.totalPropertiesInside} properties within drawn micro-zone.`
    });
  };

  // Clear Polygon Action
  const handleClearPolygon = () => {
    setPolygonVertices([]);
    setIsPolygonClosed(false);
    setIsDrawingMode(false);
    setPolygonStats(null);

    if (onPolygonFilterChange) {
      onPolygonFilterChange(null);
    }

    toast.info({
      title: 'Boundary Cleared',
      description: `Restored standard ${radiusMiles}-mile radial filter.`
    });
  };

  // Live Autocomplete Suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      fetch(`/api/comps/address-search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.suggestions) {
            setSuggestions(data.suggestions);
          } else {
            setSuggestions(PropertyCompsRepository.getAddressSuggestions(searchQuery));
          }
        })
        .catch(() => {
          setSuggestions(PropertyCompsRepository.getAddressSuggestions(searchQuery));
        });
    } else {
      setSuggestions(PropertyCompsRepository.getAddressSuggestions(''));
    }
  }, [searchQuery]);

  // Click outside to close Omnibox suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAddress = async (selectedAddress: string) => {
    setIsSearchOpen(false);
    setIsResolving(true);

    try {
      let data: any = null;
      try {
        const res = await fetch('/api/comps/resolve-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addressQuery: selectedAddress })
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch {
        // Fallback to client-side repository geocoding
        data = null;
      }

      if (data && data.success && data.subjectProperty) {
        setPanOffset({ x: 0, y: 0 });
        setZoom(14);
        setSearchQuery(data.subjectProperty.propertyAddress.split(',')[0]);
        if (onAddressResolved) {
          onAddressResolved(data);
        }
        toast.success({
          title: 'Address & Neighborhood Geocoded',
          description: `Centered on ${data.subjectProperty.propertyAddress.split(',')[0]} (${data.subjectProperty.neighborhood}).`
        });
      } else {
        const fallback = PropertyCompsRepository.resolveAddressSearch(selectedAddress);
        setPanOffset({ x: 0, y: 0 });
        setZoom(14);
        setSearchQuery(fallback.subjectProperty.propertyAddress.split(',')[0]);
        if (onAddressResolved) {
          onAddressResolved({ success: true, ...fallback });
        }
        toast.success({
          title: 'Address & Neighborhood Geocoded',
          description: `Centered on ${fallback.subjectProperty.propertyAddress.split(',')[0]} (${fallback.subjectProperty.neighborhood}).`
        });
      }
    } catch (err: any) {
      toast.error({
        title: 'Geocoding Error',
        description: err.message || 'Unable to resolve address coordinates.'
      });
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm transition-all text-slate-900 font-sans">
      
      {/* 1. Full-Width Map Viewport Canvas Container */}
      <div 
        ref={mapCanvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleMapCanvasClick}
        className={`relative w-full h-[540px] sm:h-[600px] lg:h-[680px] bg-slate-950 overflow-hidden select-none ${
          isDrawingMode 
            ? 'cursor-crosshair' 
            : isDragging 
              ? 'cursor-grabbing' 
              : 'cursor-grab'
        }`}
      >
        
        {/* Dynamic Tile Layer (High-Resolution Satellite or Vector Roadmap) */}
        <div 
          className="absolute inset-0 pointer-events-none transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1792px] h-[1792px]">
            {tileGrid.map((tile) => (
              <img
                key={tile.key}
                src={getTileUrl(tile.x, tile.y, zoom, mapType)}
                alt=""
                className="absolute w-[256px] h-[256px] object-cover transition-opacity duration-300"
                style={{
                  left: `calc(50% + ${tile.offsetX}px)`,
                  top: `calc(50% + ${tile.offsetY}px)`
                }}
                loading="eager"
                decoding="async"
              />
            ))}
          </div>
        </div>

        {/* Photoreal Glass Overlay & Vignette Shader */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-black/30" />

        {/* Interactive SVG Layer: Polygon Boundary & Isochrones */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
          }}
        >
          <defs>
            <radialGradient id="isochroneBeachGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00635C" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00635C" stopOpacity="0.05" />
            </radialGradient>
            <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Drive-Time & Lifestyle Isochrone Rings */}
          {showLifestyleLayer && !isDrawingMode && (
            <g className="transition-opacity duration-300">
              {/* 5-Min Drive Band (Emerald) */}
              <circle
                cx="50%"
                cy="50%"
                r="110"
                fill="url(#isochroneBeachGlow)"
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
              {/* 10-Min Drive Band (Blue) */}
              <circle
                cx="50%"
                cy="50%"
                r="220"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="1.5"
                strokeDasharray="8 6"
                opacity="0.6"
              />
              {/* 15-Min Drive Band (Purple) */}
              <circle
                cx="50%"
                cy="50%"
                r="340"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="1.2"
                strokeDasharray="10 8"
                opacity="0.4"
              />
            </g>
          )}

          {/* Custom Drawn Polygon Layer */}
          {polygonVertices.length > 0 && (
            <g className="transition-all duration-150">
              <polygon
                points={polygonVertices.map(p => `calc(50% + ${p.dx}px),calc(50% + ${p.dy}px)`).join(' ')}
                fill="#00635C"
                fillOpacity="0.25"
                stroke="#10B981"
                strokeWidth="3"
                strokeDasharray={isPolygonClosed ? 'none' : '6 4'}
                filter="url(#emeraldGlow)"
              />
              {/* Vertex Markers */}
              {polygonVertices.map((p, idx) => (
                <circle
                  key={idx}
                  cx={`calc(50% + ${p.dx}px)`}
                  cy={`calc(50% + ${p.dy}px)`}
                  r="6"
                  fill="#FFFFFF"
                  stroke="#00635C"
                  strokeWidth="2.5"
                  className="animate-scaleUp"
                />
              ))}
            </g>
          )}
        </svg>

        {/* Interactive Property Markers Layer */}
        <div 
          className="absolute inset-0 pointer-events-none transition-transform duration-75 ease-out z-20"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
          }}
        >
          {allPoints.map((prop) => {
            const isSubject = prop.id === subjectProperty.id;
            const isSelected = prop.id === selectedCompId;
            const isHovered = hoveredComp?.id === prop.id;
            const offset = latLngToPixelOffset(
              prop.coordinates.lat,
              prop.coordinates.lng,
              centerLat,
              centerLng,
              zoom
            );

            const displayPrice = prop.soldPrice || prop.listPrice;

            return (
              <div
                key={prop.id}
                style={{
                  left: `calc(50% + ${offset.dx}px)`,
                  top: `calc(50% + ${offset.dy}px)`
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer transition-all duration-200 group"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSubject) onSelectComp(prop);
                }}
                onMouseEnter={() => setHoveredComp(prop)}
                onMouseLeave={() => setHoveredComp(null)}
              >
                {/* Pin Badge Pod */}
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-xl ${
                  isSubject
                    ? 'bg-[#00635C] text-white ring-4 ring-emerald-400/60 scale-110 z-30 font-black'
                    : isSelected
                      ? 'bg-emerald-600 text-white ring-4 ring-white scale-110 z-20'
                      : isHovered
                        ? 'bg-slate-900 text-white scale-105 z-20'
                        : getStatusBadgeColor(prop.status)
                }`}>
                  {isSubject ? (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-spin" />
                  ) : (
                    <MapPin className="w-3 h-3" />
                  )}
                  <span>{formatPriceAbbr(displayPrice)}</span>
                </div>

                {/* Floating Hover Card on Hover */}
                {(isHovered || isSelected) && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-slate-200 text-slate-900 text-left z-40 animate-fadeIn pointer-events-none">
                    <div className="relative rounded-xl overflow-hidden mb-2 h-24 bg-slate-100">
                      <img 
                        src={prop.heroPhoto} 
                        alt={prop.propertyAddress}
                        className="w-full h-full object-cover" 
                      />
                      <span className="absolute top-1.5 right-1.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                        {prop.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">
                      {prop.propertyAddress.split(',')[0]}
                    </h4>
                    <div className="flex items-center justify-between text-xs font-extrabold text-[#00635C] mt-0.5">
                      <span>${displayPrice.toLocaleString()}</span>
                      <span className="text-[11px] font-mono text-slate-500 font-normal">${prop.pricePerSqFt}/sf</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{prop.beds} beds • {prop.baths} baths</span>
                      <span>{prop.heatedSqFt.toLocaleString()} sqft</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 2. Top-Left Floating Interactive Address Search Omnibox */}
        <div ref={searchRef} className="absolute top-4 left-4 z-40 max-w-sm w-full">
          <div className="relative bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl flex items-center p-1.5 pl-3 gap-2">
            <Search className="w-4 h-4 text-[#00635C] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  handleSelectAddress(searchQuery);
                }
              }}
              placeholder="Search any address or subdivision..."
              className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions(PropertyCompsRepository.getAddressSuggestions(''));
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isResolving && (
              <div className="w-4 h-4 border-2 border-[#00635C] border-t-transparent rounded-full animate-spin shrink-0" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 animate-scaleUp z-50">
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectAddress(sug.address)}
                  className="p-2.5 hover:bg-emerald-50/80 transition cursor-pointer flex items-center justify-between text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {sug.address.split(',')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {sug.neighborhood} • {sug.beds || 4}b/{sug.baths || 3.5}ba • {sug.heatedSqFt ? `${sug.heatedSqFt.toLocaleString()} sf` : '3,200 sf'}
                    </div>
                  </div>
                  {sug.estimatedPrice ? (
                    <span className="text-xs font-black text-[#00635C] font-mono shrink-0 ml-2">
                      ${(sug.estimatedPrice / 1000000).toFixed(2)}M
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Top-Center Floating Glass Controls & Polygon Drawing Pod */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {isDrawingMode ? (
            /* Active Drawing Action Bar */
            <div className="bg-slate-900/95 text-white backdrop-blur-md border border-emerald-500/50 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-emerald-300">
                  {polygonVertices.length === 0 ? 'Click map to set points' : `${polygonVertices.length} Vertices Placed`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCompletePolygon}
                disabled={polygonVertices.length < 3}
                className="px-3 py-1 bg-[#00635C] hover:bg-[#004d47] text-white font-bold rounded-xl flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <Check className="w-3.5 h-3.5" />
                Complete Shape
              </button>
              <button
                type="button"
                onClick={handleClearPolygon}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 font-bold rounded-xl flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          ) : (
            /* Standard Map Controls */
            <div className="bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-1 text-slate-700">
              {/* Map Type Switcher */}
              <button
                type="button"
                onClick={() => setMapType('satellite')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  mapType === 'satellite' ? 'bg-[#00635C] text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Satellite</span>
              </button>

              <button
                type="button"
                onClick={() => setMapType('roadmap')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  mapType === 'roadmap' ? 'bg-[#00635C] text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Vector GIS</span>
              </button>

              {/* Polygon Drawing Mode Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (isPolygonClosed) {
                    handleClearPolygon();
                  } else {
                    setIsDrawingMode(true);
                    toast.info({
                      title: 'Draw Boundary Mode Active',
                      description: 'Click anywhere on the map to define custom polygon vertices.'
                    });
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isPolygonClosed 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-[#00635C]" />
                <span>{isPolygonClosed ? 'Clear Boundary' : 'Draw Boundary'}</span>
              </button>

              {/* Drive-Times Layer Toggle */}
              <button
                type="button"
                onClick={() => setShowLifestyleLayer(!showLifestyleLayer)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  showLifestyleLayer ? 'text-emerald-900 bg-emerald-50 font-bold' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Drive-Times</span>
              </button>

              {/* Radius Selector Pills */}
              <div className="flex items-center gap-1 pl-2 ml-1 border-l border-slate-200">
                {[0.5, 1.0, 2.0, 3.0, 5.0].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      if (isPolygonClosed) handleClearPolygon();
                      onRadiusChange(r);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      radiusMiles === r && !isPolygonClosed ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {r}m
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Floating Zoom & Recenter Controls (Top Left Stack) */}
        <div className="absolute top-20 left-4 z-30 flex flex-col gap-1 bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 shadow-lg text-slate-700">
          <button
            type="button"
            onClick={() => setZoom(prev => Math.min(17, prev + 1))}
            className="p-2 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(prev => Math.max(12, prev - 1))}
            className="p-2 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetCenter}
            className="p-2 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Recenter Subject Property"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* 5. Floating Top-Right Collapsible Comparables Flyout Drawer */}
        <div className={`absolute top-4 right-4 z-30 transition-all duration-300 ${
          isDrawerOpen ? 'w-80' : 'w-12'
        }`}>
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[580px]">
            
            {/* Drawer Header */}
            <div className="p-3 bg-[#F7F8F5] border-b border-slate-200 flex items-center justify-between">
              {isDrawerOpen ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Spatial Comps ({comps.length})
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold px-1.5 py-0.5 rounded bg-slate-200">
                    {isPolygonClosed ? 'Inside Boundary' : `Within ${radiusMiles} mi`}
                  </span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                title={isDrawerOpen ? 'Collapse Comps Drawer' : 'Expand Comps Drawer'}
              >
                {isDrawerOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Comps List Strip */}
            {isDrawerOpen && (
              <div className="p-3 space-y-2 overflow-y-auto divide-y divide-slate-100 max-h-[500px]">
                {comps.map((comp) => {
                  const isSelected = selectedCompId === comp.id;
                  const price = comp.soldPrice || comp.listPrice;
                  return (
                    <div
                      key={comp.id}
                      onClick={() => onSelectComp(comp)}
                      className={`pt-2 first:pt-0 cursor-pointer transition p-2 rounded-xl flex gap-2.5 items-center ${
                        isSelected ? 'bg-emerald-50/80 border border-emerald-300/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <img 
                        src={comp.heroPhoto} 
                        alt={comp.propertyAddress}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0" 
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {comp.propertyAddress.split(',')[0]}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-semibold shrink-0">
                            {comp.distanceMiles ? `${comp.distanceMiles} mi` : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#00635C]">
                            ${price.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ${comp.pricePerSqFt}/sf
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {comp.beds}b • {comp.baths}ba • {comp.heatedSqFt.toLocaleString()} sf • {comp.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 6. Floating Micro-Zone Real-Time Analytics Pod (Active when Polygon is Closed) */}
        {isPolygonClosed && polygonStats && (
          <div className="absolute bottom-4 right-4 z-30 bg-white/95 backdrop-blur-md border border-emerald-300 rounded-2xl p-4 shadow-2xl max-w-xs w-full space-y-2 animate-scaleUp text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#00635C]" /> Custom Micro-Zone
              </span>
              <span className="text-xs font-mono font-bold text-slate-600">
                {polygonStats.totalPropertiesInside} Properties
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#F7F8F5] p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Median Price</span>
                <span className="font-mono font-bold text-[#00635C]">${(polygonStats.medianPrice / 1000000).toFixed(2)}M</span>
              </div>
              <div className="bg-[#F7F8F5] p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg $/SqFt</span>
                <span className="font-mono font-bold text-slate-800">${polygonStats.avgPricePerSqFt}/sf</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearPolygon}
              className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Clear Custom Boundary
            </button>
          </div>
        )}

        {/* 7. Floating Bottom-Left Subject Property Anchor Card */}
        <div className="absolute bottom-4 left-4 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-2xl max-w-sm w-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              Subject Anchor Property
            </span>
            <span className="text-xs font-mono font-bold text-slate-600">{subjectProperty.mlsNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            <img 
              src={subjectProperty.heroPhoto} 
              alt={subjectProperty.propertyAddress}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0" 
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold text-slate-900 truncate">
                {subjectProperty.propertyAddress.split(',')[0]}
              </h4>
              <div className="text-sm font-black text-[#00635C]">
                ${subjectProperty.listPrice.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">
                {subjectProperty.heatedSqFt.toLocaleString()} SqFt • ${subjectProperty.pricePerSqFt}/sf • {subjectProperty.neighborhood}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
