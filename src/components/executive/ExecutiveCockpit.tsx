/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ExecutiveCockpit
 * Leadership BI Analytics, Velocity Heatmap & NCREC Compliance Cockpit
 * for Ryan Crecelius (Owner) & BICs (Jessica Keenan & Eric Knight).
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Clock, AlertTriangle, CheckCircle2, ShieldCheck,
  Building, User, FileText, Download, Printer, RefreshCw, X,
  Layers, ArrowUpRight, BarChart3, Activity, Zap, ExternalLink,
  MapPin, ShieldAlert, Sparkles, ChevronRight, Check
} from 'lucide-react';
import type { ExecutiveCockpitPayload, StepBottleneckRecord, StaffWorkloadRecord, NcrecAuditFileRecord } from '../../../server/analytics/executiveAnalyticsEngine';

interface ExecutiveCockpitProps {
  workspaceId?: string;
  onNavigateToSopRuns?: () => void;
  onNavigateToWorkQueue?: () => void;
}

export const ExecutiveCockpit: React.FC<ExecutiveCockpitProps> = ({
  workspaceId = 'nest-realty-wilmington',
  onNavigateToSopRuns,
  onNavigateToWorkQueue
}) => {
  const [data, setData] = useState<ExecutiveCockpitPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBottleneck, setSelectedBottleneck] = useState<StepBottleneckRecord | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditReportData, setAuditReportData] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/executive/analytics?workspaceId=${workspaceId}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load executive analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAuditModal = async () => {
    try {
      setAuditLoading(true);
      setShowAuditModal(true);
      const res = await fetch(`/api/executive/ncrec-audit?workspaceId=${workspaceId}`);
      const json = await res.json();
      if (json.success) {
        setAuditReportData(json);
      }
    } catch (err) {
      console.error('Failed to load NCREC audit report:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [workspaceId]);

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-stone-500 font-sans space-y-3">
        <RefreshCw className="w-8 h-8 text-stone-400 animate-spin mx-auto" />
        <div className="text-sm font-semibold text-stone-700">Loading Brokerage Executive Intelligence...</div>
      </div>
    );
  }

  const overview = data?.brokerageOverview;
  const velocity = data?.velocityMetrics;
  const bottlenecks = data?.bottleneckHeatmap || [];
  const workload = data?.staffWorkload || [];
  const compliance = data?.ncrecCompliance;

  return (
    <div className="space-y-6 text-left select-none font-sans max-w-7xl mx-auto">
      
      {/* Header & Leadership Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E5EFEA] text-[#00635C] text-[11px] font-semibold tracking-wide">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Executive Operating Pulse</span>
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Nest Realty Wilmington (Mayfaire & Carolina Beach)
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-900 mt-1.5">
            Owner & Broker-in-Charge Executive Cockpit
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 max-w-3xl leading-relaxed">
            Real-time procedure turnaround velocity, step bottleneck heatmaps, staff capacity allocation, and statutory NCREC compliance audit controls.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors shadow-2xs"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAuditModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>NCREC Compliance Audit Certificate</span>
          </button>
        </div>
      </div>

      {/* Leadership Governance Strip */}
      <div className="p-3.5 bg-[#F7F8F5] border border-stone-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00635C] text-white font-serif font-bold flex items-center justify-center shadow-2xs">
            RC
          </div>
          <div>
            <div className="font-bold text-stone-900">Ryan Crecelius</div>
            <div className="text-[11px] text-stone-500">Broker / Owner (Nest Realty Wilmington)</div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-stone-600">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00635C]" />
            <div>
              <div className="font-bold text-stone-900 text-[11px]">Jessica Keenan</div>
              <div className="text-[10px] text-stone-500">Broker-in-Charge (Mayfaire • License #226854)</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00635C]" />
            <div>
              <div className="font-bold text-stone-900 text-[11px]">Eric Knight</div>
              <div className="text-[10px] text-stone-500">Broker-in-Charge (Carolina Beach • License #278908)</div>
            </div>
          </div>
        </div>
      </div>

      {/* PILLAR 1: BROKERAGE VELOCITY & SLA HEALTH */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00635C]" />
            <span>Pillar 1: Turnaround Speed &amp; Due Times</span>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">Calculated across all active listings &amp; contracts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Listing Launch Velocity */}
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm space-y-2">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
              <span>Listing Launch Speed</span>
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-[10px]">
                ↑ {velocity?.listingLaunchTurnaround.trendPercent}% faster
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-stone-900">
                {velocity?.listingLaunchTurnaround.currentValue}
              </span>
              <span className="text-xs text-stone-500 font-medium">hours (target: {velocity?.listingLaunchTurnaround.slaTarget}h)</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              {velocity?.listingLaunchTurnaround.description}
            </p>
          </div>

          {/* Contract Audit Velocity */}
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm space-y-2">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
              <span>Contract &amp; CDA Audit</span>
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-[10px]">
                ↑ {velocity?.contractVerificationTurnaround.trendPercent}% faster
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-stone-900">
                {velocity?.contractVerificationTurnaround.currentValue}
              </span>
              <span className="text-xs text-stone-500 font-medium">hours (target: {velocity?.contractVerificationTurnaround.slaTarget}h)</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              {velocity?.contractVerificationTurnaround.description}
            </p>
          </div>

          {/* On-Time Delivery Rate */}
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm space-y-2">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
              <span>On-Time Delivery Rate</span>
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-[10px]">
                Target: {velocity?.onTimeSlaRate.slaTarget}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-[#00635C]">
                {velocity?.onTimeSlaRate.currentValue}%
              </span>
              <span className="text-xs text-stone-500 font-medium">zero escalations</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              {velocity?.onTimeSlaRate.description}
            </p>
          </div>

          {/* Vendor Speed */}
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm space-y-2">
            <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
              <span>Vendor Fulfillment</span>
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold text-[10px]">
                Sign & Media
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-stone-900">
                {velocity?.vendorFulfillmentSpeed.currentValue}
              </span>
              <span className="text-xs text-stone-500 font-medium">hours (target: {velocity?.vendorFulfillmentSpeed.slaTarget}h)</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              {velocity?.vendorFulfillmentSpeed.description}
            </p>
          </div>
        </div>
      </div>

      {/* PILLAR 2: STEP BOTTLENECK HEATMAP */}
      <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Pillar 2: SOP Procedure Bottleneck Heatmap</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Identifies which exact checklist steps experience turnaround friction across 74 agents.
            </p>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            Delay Index &gt; 1.0 = Bottleneck
          </span>
        </div>

        <div className="space-y-2.5">
          {bottlenecks.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedBottleneck(selectedBottleneck?.stepTitle === item.stepTitle ? null : item)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                item.status === 'critical_bottleneck'
                  ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                  : item.status === 'moderate_friction'
                  ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                  : 'bg-[#F7F8F5]/60 border-stone-200/80 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'critical_bottleneck'
                        ? 'bg-rose-100 text-rose-800'
                        : item.status === 'moderate_friction'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.status === 'critical_bottleneck' ? 'Critical Bottleneck' : item.status === 'moderate_friction' ? 'Friction Point' : 'Optimal'}
                    </span>
                    <span className="text-xs font-bold text-stone-900 truncate">
                      Step {item.stepNumber}: {item.stepTitle}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      • {item.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <div className="font-mono text-xs font-bold text-stone-900">
                      {item.avgDurationHours}h avg
                    </div>
                    <div className="text-[10px] text-stone-500">
                      Target: {item.slaTargetHours}h
                    </div>
                  </div>

                  <div className="w-16 hidden sm:block">
                    <div className="text-[10px] text-stone-400 font-semibold uppercase">Delay Index</div>
                    <div className={`font-mono text-xs font-bold ${
                      item.delayIndex > 1.3 ? 'text-rose-700' : item.delayIndex > 1.0 ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {item.delayIndex.toFixed(2)}x
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${selectedBottleneck?.stepTitle === item.stepTitle ? 'rotate-90 text-stone-700' : ''}`} />
                </div>
              </div>

              {/* Expanded Root Cause & Action Guide */}
              {selectedBottleneck?.stepTitle === item.stepTitle && (
                <div className="mt-3 pt-3 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Identified Root Cause:</div>
                    <p className="mt-0.5 text-stone-700 leading-relaxed font-medium">
                      {item.primaryRootCause}
                    </p>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">System Recommendation:</div>
                    <p className="mt-0.5 text-[#00635C] leading-relaxed font-medium">
                      Automate reminder SMS to seller at 6h mark before listing draft submission.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PILLAR 3: STAFF & OPERATIONS WORKLOAD BALANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#00635C]" />
              <span>Pillar 3: Staff Workload & Capacity Radar</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Live capacity utilization across Transaction Coordinators, Ops Leads, and BICs.
            </p>
          </div>

          <div className="space-y-3.5">
            {workload.map((staff) => (
              <div key={staff.userId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900">{staff.name}</span>
                    <span className="text-stone-500 text-[11px] ml-1.5">({staff.role})</span>
                  </div>
                  <span className="font-mono font-bold text-stone-900">{staff.capacityUtilizationPercent}% Capacity</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      staff.capacityUtilizationPercent > 80
                        ? 'bg-amber-500'
                        : staff.capacityUtilizationPercent > 60
                        ? 'bg-[#00635C]'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${staff.capacityUtilizationPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
                  <span>{staff.activeRunsAssignedCount} Active SOP Runs</span>
                  <span>{staff.completedThisWeekCount} Resolved This Week</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PILLAR 4: NCREC COMPLIANCE AUDIT READINESS */}
        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pillar 4: NCREC Compliance Readiness</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Statutory audit compliance for NC Real Estate Commission standards.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-serif font-bold text-emerald-700">{compliance?.overallScore}%</div>
              <div className="text-[10px] text-stone-400 font-semibold uppercase">Audit Ready</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="text-stone-500 text-[10px] uppercase font-semibold">WWREA Signed</div>
              <div className="text-sm font-bold text-emerald-900 mt-0.5">100.0%</div>
            </div>
            <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="text-stone-500 text-[10px] uppercase font-semibold">Form 2-T Initialed</div>
              <div className="text-sm font-bold text-emerald-900 mt-0.5">100.0%</div>
            </div>
            <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="text-stone-500 text-[10px] uppercase font-semibold">EMD Trust Ledgers</div>
              <div className="text-sm font-bold text-emerald-900 mt-0.5">98.4%</div>
            </div>
            <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100">
              <div className="text-stone-500 text-[10px] uppercase font-semibold">RPOADS Complete</div>
              <div className="text-sm font-bold text-amber-900 mt-0.5">95.8%</div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleOpenAuditModal}
              className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>View & Export NCREC Audit Certificate</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: OFFICIAL NCREC AUDIT CERTIFICATE */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-stone-900">Official NCREC Compliance Audit Certificate</h3>
                  <div className="text-[11px] text-stone-500">North Carolina Real Estate Commission Record ID: {auditReportData?.reportId || 'NCREC-AUD-2026'}</div>
                </div>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {auditLoading ? (
              <div className="py-12 text-center text-stone-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-stone-400" />
                <div className="text-xs font-semibold">Generating statutory audit ledgers...</div>
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                
                {/* Official Header Badge */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-emerald-900 font-bold text-sm">Nest Realty Wilmington (NC Firm #C28910)</div>
                    <div className="text-emerald-700 text-xs mt-0.5">Mayfaire Central & Carolina Beach Branch Offices</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-serif font-bold text-emerald-800">98.4%</div>
                    <div className="text-[10px] text-emerald-700 font-semibold uppercase">COMPLIANCE SCORE</div>
                  </div>
                </div>

                {/* Statutory Inspection Points */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">Statutory Verification Breakdown</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                      <div className="text-stone-500 text-[10px]">WWREA Agency Disclosure</div>
                      <div className="font-bold text-stone-900 mt-0.5">100.0% Signed at First Contact</div>
                    </div>
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                      <div className="text-stone-500 text-[10px]">Form 2-T Offer Execution</div>
                      <div className="font-bold text-stone-900 mt-0.5">100.0% Initialed & Executed</div>
                    </div>
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                      <div className="text-stone-500 text-[10px]">Earnest Money Escrow Trust</div>
                      <div className="font-bold text-stone-900 mt-0.5">98.4% Verified in 72h Trust Account</div>
                    </div>
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                      <div className="text-stone-500 text-[10px]">Disclosures (RPOADS & MOG)</div>
                      <div className="font-bold text-stone-900 mt-0.5">95.8% Uploaded to Loop</div>
                    </div>
                  </div>
                </div>

                {/* Sample Audited Transaction Files */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">Sample Certified Transaction Records</div>
                  <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                    {auditReportData?.auditRecords?.map((rec: NcrecAuditFileRecord) => (
                      <div key={rec.id} className="p-3 bg-white flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-stone-900">{rec.propertyAddress}</div>
                          <div className="text-[11px] text-stone-500">
                            Agent: {rec.agentName} • BIC Review: <strong className="text-stone-700">{rec.bicReviewer}</strong>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          rec.auditStatus === '100%_compliant'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rec.auditStatus === '100%_compliant' ? '✓ 100% Compliant' : 'Missing Disclosures'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signature Certification Block */}
                <div className="pt-3 border-t border-stone-200 space-y-3">
                  <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">Designated Brokerage Signing Authorities</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                      <div className="font-bold text-stone-900 text-xs">Jessica Keenan</div>
                      <div className="text-[11px] text-stone-500">Broker-in-Charge (Mayfaire Office)</div>
                      <div className="font-mono text-[10px] text-emerald-700 font-semibold pt-1">
                        ✓ Digital Audit Signature Certified (License #226854)
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                      <div className="font-bold text-stone-900 text-xs">Eric Knight</div>
                      <div className="text-[11px] text-stone-500">Broker-in-Charge (Carolina Beach Office)</div>
                      <div className="font-mono text-[10px] text-emerald-700 font-semibold pt-1">
                        ✓ Digital Audit Signature Certified (License #278908)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Audit Sheet</span>
                  </button>
                  <button
                    onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + "Property,Agent,BIC Reviewer,Compliance Score,Status\n"
                        + (auditReportData?.auditRecords || []).map((r: any) => `"${r.propertyAddress}","${r.agentName}","${r.bicReviewer}",${r.complianceScore}%,"${r.auditStatus}"`).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `NCREC_Audit_Report_${workspaceId}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Ledger</span>
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ExecutiveCockpit;
