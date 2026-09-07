/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SchoolDistrictView: School District & Academic Ratings Intelligence Console
 * Assigned Public NHCS Schools (Wrightsville Beach Elem 10/10, Noble Middle 9/10, Hoggard High 9/10),
 * Premier Private Academies (Cape Fear Academy A+), GreatSchools Metrics, and Bus Route Schedules.
 */

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Award, Star, BookOpen, Bus, Clock, 
  MapPin, CheckCircle2, Building, ShieldCheck, Sparkles, Navigation, Users
} from 'lucide-react';
import { LuxuryPropertyComp, PropertyCompsRepository } from '../../../server/persistence/propertyCompsRepository';
import { useToast } from '../ui';

interface SchoolDistrictViewProps {
  subjectProperty: LuxuryPropertyComp;
}

export const SchoolDistrictView: React.FC<SchoolDistrictViewProps> = ({
  subjectProperty
}) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comps/school-district/${subjectProperty.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          setProfile(data.profile);
        } else {
          setProfile(PropertyCompsRepository.getSchoolDistrictProfile(subjectProperty.id));
        }
      })
      .catch(() => {
        setProfile(PropertyCompsRepository.getSchoolDistrictProfile(subjectProperty.id));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subjectProperty.id]);

  if (loading || !profile) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-500 font-bold animate-pulse border border-slate-200">
        Loading New Hanover County school assignments & academic ratings...
      </div>
    );
  }

  const { districtName, districtRating, publicSchools, privateAcademies, districtSummary } = profile;

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Master School District Summary Banner */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-[#00635C]" /> Top Tier Academic Zone
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">{districtRating}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            School District & Academic Ratings Overlay
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Official {districtName} assigned public schools and premier coastal private academies serving {subjectProperty.neighborhood}.
          </p>
        </div>

        {/* Academic Score Badge */}
        <div className="bg-[#F7F8F5] border border-slate-200 p-5 rounded-2xl text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Assigned Elementary Rating
          </span>
          <div className="text-3xl font-black text-[#00635C] font-mono mt-0.5 flex items-center justify-end gap-1">
            <span>10/10</span>
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Wrightsville Beach Elem • Top 1% in North Carolina
          </span>
        </div>
      </div>

      {/* 2. Key Academic Statistics Strip */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Average Assigned Public Rating
          </span>
          <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
            {districtSummary.averagePublicRating} / 10
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            GreatSchools District Composite
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Closest School Distance
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            {districtSummary.closestSchoolDistanceMiles} Miles
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            4-Minute Drive / Bus Route
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            High School Program
          </span>
          <div className="text-lg font-black text-purple-900 font-mono mt-0.5">
            IB World School
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Hoggard High AP Capstone
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Top Private Academy
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            Cape Fear Academy
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            A+ Niche (#1 in Wilmington)
          </span>
        </div>
      </div>

      {/* 3. Category Toggle (Public vs Private) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-[#F7F8F5] border border-slate-200 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('public')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'public'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#00635C]" />
            <span>Assigned NHCS Public Schools ({publicSchools.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('private')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'private'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-purple-600" />
            <span>Premier Private Academies ({privateAcademies.length})</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
          Guaranteed NHCS Neighborhood School Zone
        </span>
      </div>

      {/* 4. Assigned Public Schools Grid */}
      {activeTab === 'public' && (
        <div className="space-y-4">
          {publicSchools.map((school: any, idx: number) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {school.level} ({school.gradesServed})
                    </span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {school.ncPercentileRank}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {school.distanceMiles} Miles ({school.driveTimeMinutes} Min Drive)
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{school.schoolName}</h3>
                  <p className="text-xs text-slate-500 font-mono">{school.schoolAddress}</p>
                </div>

                {/* Rating Badge */}
                <div className="flex items-center gap-3 bg-[#F7F8F5] border border-slate-200 px-4 py-3 rounded-2xl">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">GreatSchools</span>
                    <span className="text-2xl font-black text-[#00635C] font-mono leading-none">
                      {school.greatSchoolsRating}/10
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00635C] flex items-center justify-center font-black text-sm shadow-2xs">
                    ★
                  </div>
                </div>
              </div>

              {/* Metrics & Proficiency Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#F7F8F5] p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Student-Teacher Ratio</span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">{school.studentTeacherRatio}</span>
                </div>
                <div className="bg-[#F7F8F5] p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Enrollment</span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">{school.studentCount} Students</span>
                </div>
                <div className="bg-[#F7F8F5] p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Math Proficiency</span>
                  <span className="text-sm font-black text-[#00635C] font-mono">{school.mathProficiencyPercent}%</span>
                </div>
                <div className="bg-[#F7F8F5] p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Reading Proficiency</span>
                  <span className="text-sm font-black text-[#00635C] font-mono">{school.readingProficiencyPercent}%</span>
                </div>
              </div>

              {/* Highlights & Bus Route */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Academic Highlights */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Academic & Curriculum Highlights
                  </span>
                  {school.highlights.map((h: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                {/* NHCS Bus Route Logistics */}
                <div className="bg-[#F7F8F5] p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Bus className="w-3.5 h-3.5 text-[#00635C]" />
                      <span>{school.busRoute.routeNumber}</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Direct Route
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Morning Pick-up:</span>
                    <span className="font-mono font-bold text-slate-900">{school.busRoute.pickupTime}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Afternoon Drop-off:</span>
                    <span className="font-mono font-bold text-slate-900">{school.busRoute.dropoffTime}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    Stop: <strong>{school.busRoute.busStopLocation}</strong>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 5. Premier Private Academies Grid */}
      {activeTab === 'private' && (
        <div className="space-y-4">
          {privateAcademies.map((school: any, idx: number) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                      {school.category} ({school.gradesServed})
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {school.distanceMiles} Miles ({school.driveTimeMinutes} Min Drive)
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{school.schoolName}</h3>
                  <p className="text-xs text-slate-500 font-mono">{school.schoolAddress}</p>
                </div>

                {/* Niche Rating Badge */}
                <div className="flex items-center gap-3 bg-[#F7F8F5] border border-slate-200 px-4 py-3 rounded-2xl">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Niche Grade</span>
                    <span className="text-2xl font-black text-purple-900 font-mono leading-none">
                      {school.nicheRating}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-sm shadow-2xs">
                    🎓
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#F7F8F5] p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Annual Tuition</span>
                  <span className="text-sm font-black text-slate-900 font-mono">${school.annualTuition.toLocaleString()}/yr</span>
                </div>
                <div className="bg-[#F7F8F5] p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Student-Teacher Ratio</span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">{school.studentTeacherRatio}</span>
                </div>
                <div className="bg-[#F7F8F5] p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Enrollment</span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">{school.studentCount} Students</span>
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-1.5 text-xs pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Academy Highlights
                </span>
                {school.highlights.map((h: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-slate-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
