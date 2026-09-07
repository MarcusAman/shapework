/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AcousticSoundscapeView: Ambient Acoustic Soundscape & Traffic Decibel Overlay
 * Measures baseline ambient noise (38.2 dBA), diurnal sound curves (32.5 dBA at night),
 * corridor distance attenuation (Military Cutoff & Eastwood Rd), and maritime pine buffer shielding.
 */

import React, { useState, useEffect } from 'react';
import { 
  Volume2, VolumeX, ShieldCheck, Waves, Compass, 
  Trees, Sparkles, CheckCircle2, ArrowRight, Gauge, Activity, Clock
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface AcousticSoundscapeViewProps {
  subjectProperty: LuxuryPropertyComp;
}

export const AcousticSoundscapeView: React.FC<AcousticSoundscapeViewProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [soundData, setSoundData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comps/acoustic-soundscape/${subjectProperty.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.soundscape) {
          setSoundData(data.soundscape);
        } else {
          setSoundData(PropertyCompsRepository.getAcousticSoundscapeProfile(subjectProperty.id));
        }
      })
      .catch(() => {
        setSoundData(PropertyCompsRepository.getAcousticSoundscapeProfile(subjectProperty.id));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subjectProperty.id]);

  if (loading || !soundData) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-500 font-bold animate-pulse border border-slate-200">
        Conducting GIS acoustic modeling, corridor attenuation & soundscape profiling...
      </div>
    );
  }

  const { sanctuaryScore, acousticClassification, epaGuidelineBenchmarkDba, baselineAmbientDba, dayNightAverageLevelDnlDba, diurnalSoundProfile, corridorDistanceAndAttenuation, naturalSoundBuffers } = soundData;

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Master Acoustic Banner */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-[#00635C]" /> GIS Acoustic Intelligence
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">{baselineAmbientDba} dBA Ambient</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Ambient Acoustic Soundscape & Noise Overlay
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Quantified ambient sound levels, diurnal noise curve, arterial traffic corridor distance attenuation, and maritime pine forest acoustic buffers.
          </p>
        </div>

        {/* Sanctuary Score Badge */}
        <div className="bg-[#F7F8F5] border border-emerald-200 p-5 rounded-3xl text-right shrink-0">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Acoustic Sanctuary Score
          </span>
          <div className="text-3xl sm:text-4xl font-black text-[#00635C] font-mono mt-0.5">
            {sanctuaryScore}<span className="text-sm font-normal text-slate-500">/100</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 block mt-1">
            {acousticClassification.split('(')[0]}
          </span>
        </div>
      </div>

      {/* 2. Key Decibel Metrics Strip */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Baseline Ambient Level
          </span>
          <div className="text-lg font-black text-[#00635C] font-mono mt-0.5">
            {baselineAmbientDba} dBA
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Whisper Quiet Level
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Nighttime Stillness
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            32.5 dBA
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Near Total Acoustic Calm
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            EPA Residential Limit
          </span>
          <div className="text-lg font-black text-slate-700 font-mono mt-0.5">
            {epaGuidelineBenchmarkDba} dBA
          </div>
          <span className="text-[11px] text-emerald-800 font-medium">
            -16.8 dBA Below Guideline
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Interior Sound Level
          </span>
          <div className="text-lg font-black text-emerald-800 font-mono mt-0.5">
            {naturalSoundBuffers.interiorSoundLevelDba} dBA
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            STC 34 Acoustic Glazing
          </span>
        </div>
      </div>

      {/* 3. Diurnal Sound Profile Across 24 Hours */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Diurnal Sound Level Curve (dBA)</h3>
              <p className="text-[11px] text-slate-500">Day/Night Average (DNL): <strong className="text-slate-800">{dayNightAverageLevelDnlDba} dBA</strong>.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            EPA Safe Zone
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {diurnalSoundProfile.map((p: any, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#F7F8F5] border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900">{p.period.split('(')[0]}</span>
                <span className="font-mono text-xs font-bold text-[#00635C] bg-emerald-100 px-2 py-0.5 rounded-full">
                  {p.avgDba} dBA
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">{p.period.split('(')[1]?.replace(')', '')}</span>
              <p className="text-[11px] text-slate-600 leading-snug pt-1 border-t border-slate-200/60">
                {p.dominantSounds}
              </p>
              <div className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{p.tranquilRating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Corridor Distance Attenuation & Natural Buffers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Corridor Distance & Attenuation */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Compass className="w-4 h-4 text-[#00635C]" />
            <h3 className="text-sm font-bold text-slate-900">Arterial Corridor Distance & Noise Attenuation</h3>
          </div>

          <div className="space-y-3 text-xs">
            {corridorDistanceAndAttenuation.map((c: any, idx: number) => (
              <div key={idx} className="p-3 bg-[#F7F8F5] rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">{c.corridorName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{c.distanceMiles} Miles {c.direction} • {c.audibilityScore}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-800 text-xs">{c.attenuationReductionDba} dBA</span>
                  <span className="text-[9px] text-slate-400 block uppercase">Sound Reduction</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Natural Sound Barriers & Glazing */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Trees className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Natural Sound Buffers & Acoustic Glazing</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Maritime Pine Canopy Depth:</span>
              <span className="font-bold text-slate-900">{naturalSoundBuffers.maritimePineCanopyDepthFeet} Feet ({naturalSoundBuffers.canopyNoiseReductionDba} dBA Buffer)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Perimeter Earthen Berm:</span>
              <span className="font-bold text-slate-900">{naturalSoundBuffers.perimeterEarthenBermHeightFeet}ft Height ({naturalSoundBuffers.bermNoiseReductionDba} dBA Barrier)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Architectural Glazing Spec:</span>
              <span className="font-bold text-emerald-800">{naturalSoundBuffers.architecturalGlazingSpec}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-600">Interior Ambient Noise:</span>
              <span className="font-mono font-black text-[#00635C]">{naturalSoundBuffers.interiorSoundLevelDba} dBA (Library Stillness)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
