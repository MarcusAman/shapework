/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SolarExposureSimulatorView: Interactive Solar Exposure & Pool Sunlight Simulator
 * Solstice Sun Arc (Summer vs Winter), Time-of-Day Slider (7 AM - 7 PM),
 * Direct Pool Sunlight % Tracker, and Rooftop Solar Generation Potential.
 */

import React, { useState, useEffect } from 'react';
import { 
  Sun, Moon, Compass, Waves, Zap, Clock, Calendar, 
  Sparkles, ShieldCheck, ArrowRight, Activity
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface SolarExposureSimulatorViewProps {
  subjectProperty: LuxuryPropertyComp;
}

export const SolarExposureSimulatorView: React.FC<SolarExposureSimulatorViewProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [season, setSeason] = useState<'summer' | 'winter' | 'equinox'>('summer');
  const [timeHour, setTimeHour] = useState<number>(14); // 2:00 PM
  const [solarData, setSolarData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comps/solar-exposure/${subjectProperty.id}?season=${season}&hour=${timeHour}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.solarProfile) {
          setSolarData(data.solarProfile);
        } else {
          setSolarData(PropertyCompsRepository.getSolarExposureProfile(subjectProperty.id, { season, timeHour }));
        }
      })
      .catch(() => {
        setSolarData(PropertyCompsRepository.getSolarExposureProfile(subjectProperty.id, { season, timeHour }));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subjectProperty.id, season, timeHour]);

  if (loading || !solarData) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-500 font-bold animate-pulse border border-slate-200">
        Simulating solar path, pool sunlight exposure & rooftop irradiance...
      </div>
    );
  }

  const { currentSunMetrics, hourlySunPath, solarRoofCapacity } = solarData;

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Master Solar Banner */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-600" /> Solar & Pool Micro-Climate
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">{currentSunMetrics.rearLanaiOrientation}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Solar Exposure & Pool Sunlight Simulator
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            3D solar arc simulation tracking seasonal sunlight angles, swimming pool direct sunlight hours, and rooftop photovoltaic generation potential.
          </p>
        </div>

        {/* Live Pool Sunlight Stat */}
        <div className="bg-[#F7F8F5] border border-slate-200 p-5 rounded-2xl text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Direct Pool Sunlight Coverage
          </span>
          <div className="text-3xl font-black text-amber-600 font-mono mt-0.5">
            {currentSunMetrics.poolSunlightCoveragePercent}%
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Solar Altitude: {currentSunMetrics.solarAltitudeDegrees}° • {timeHour > 12 ? timeHour - 12 : timeHour}:00 {timeHour >= 12 ? 'PM' : 'AM'}
          </span>
        </div>
      </div>

      {/* 2. Interactive Solar Controls Bar */}
      <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Season Solstice Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Select Solstice / Season:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSeason('summer')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                season === 'summer'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-[#F7F8F5] text-slate-600 hover:bg-slate-200'
              }`}
            >
              Summer Solstice
            </button>
            <button
              type="button"
              onClick={() => setSeason('equinox')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                season === 'equinox'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-[#F7F8F5] text-slate-600 hover:bg-slate-200'
              }`}
            >
              Spring / Fall
            </button>
            <button
              type="button"
              onClick={() => setSeason('winter')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                season === 'winter'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-[#F7F8F5] text-slate-600 hover:bg-slate-200'
              }`}
            >
              Winter Solstice
            </button>
          </div>
        </div>

        {/* Time of Day Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Simulate Time of Day:</span>
            </label>
            <span className="font-mono font-extrabold text-sm text-amber-700">
              {timeHour > 12 ? timeHour - 12 : timeHour}:00 {timeHour >= 12 ? 'PM' : 'AM'}
            </span>
          </div>
          <input
            type="range"
            min={7}
            max={19}
            step={1}
            value={timeHour}
            onChange={(e) => setTimeHour(parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>7:00 AM (Sunrise)</span>
            <span>1:00 PM (Solar Noon)</span>
            <span>7:00 PM (Sunset)</span>
          </div>
        </div>
      </div>

      {/* 3. Hourly Solar Progression Curve Grid */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Diurnal Sunlight & Pool Exposure Curve</h3>
              <p className="text-[11px] text-slate-500">Peak pool sunlight: <strong className="text-slate-800">{currentSunMetrics.peakPoolSunlightHours}</strong>.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {hourlySunPath.map((item: any) => {
            const isSelected = item.hour === timeHour;
            return (
              <div
                key={item.hour}
                onClick={() => setTimeHour(item.hour)}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer space-y-1 ${
                  isSelected 
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs' 
                    : 'bg-[#F7F8F5] border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-500 block font-mono">{item.timeLabel}</span>
                <div className="text-base font-black text-amber-700 font-mono">
                  {item.poolSunlightCoveragePercent}%
                </div>
                <span className="text-[9px] text-slate-400 font-mono block">Alt {item.solarAltitudeDeg}°</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Pool Lighting & Solar Roof Potential */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pool & Lanai Exposure Summary */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Waves className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-900">Pool & Outdoor Lanai Light Orientation</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Rear Lanai Orientation:</span>
              <span className="font-bold text-slate-900">{currentSunMetrics.rearLanaiOrientation}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Peak Direct Pool Sun Window:</span>
              <span className="font-bold text-emerald-800">{currentSunMetrics.peakPoolSunlightHours}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Morning Shade Protection:</span>
              <span className="font-bold text-slate-800">Protected until 9:30 AM (Comfortable Breakfast)</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-600">Golden Hour Sunset Exposure:</span>
              <span className="font-bold text-amber-700">Direct sunset fairway view (5:30 PM - 7:30 PM)</span>
            </div>
          </div>
        </div>

        {/* Rooftop Solar Generation Potential */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Rooftop Solar & Energy Irradiance</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Solar Irradiance Score:</span>
              <span className="font-mono font-black text-[#00635C]">{solarRoofCapacity.roofIrradianceScore} / 100 (Optimal)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Usable South-Facing Roof Area:</span>
              <span className="font-mono font-bold text-slate-900">{solarRoofCapacity.usableRoofSqFt.toLocaleString()} SqFt</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Est. Solar System Capacity:</span>
              <span className="font-mono font-bold text-slate-900">{solarRoofCapacity.estimatedSystemCapacityKw} kW DC</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-extrabold text-emerald-800">
              <span>Estimated Annual Electric Savings:</span>
              <span className="font-mono font-black">+${solarRoofCapacity.estimatedAnnualElectricSavings.toLocaleString()}/yr</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
