/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NoraContractSentinelView: NC Form 2-T Contract Anomaly & Due Diligence Risk Sentinel
 * Real-time AI legal & risk audit engine for NCREC Standard Form 2-T Offer to Purchase contracts.
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, FileText, 
  Copy, Clock, DollarSign, Calendar, Scale, Sparkles, Check, 
  ArrowRight, Search, FileCode, Landmark, Waves
} from 'lucide-react';
import { useToast } from '../ui';
import { 
  ContractAuditPayload, ContractSentinelReport, SAMPLE_NC_CONTRACTS, NoraContractSentinelRepository 
} from '../../../server/persistence/noraContractSentinelRepository';

export const NoraContractSentinelView: React.FC = () => {
  const { toast } = useToast();
  const [samples, setSamples] = useState<any[]>(SAMPLE_NC_CONTRACTS);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('contract_landfall_clean');
  const [report, setReport] = useState<ContractSentinelReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'verified'>('all');
  const [copiedClauseId, setCopiedClauseId] = useState<string | null>(null);

  // Load sample or scan contract
  const loadContractAudit = async (sampleId: string) => {
    const selected = samples.find(s => s.id === sampleId) || samples[0];
    if (!selected) return;

    setLoading(true);
    try {
      const res = await fetch('/api/nora/contract-sentinel/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selected.payload)
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        setReport(NoraContractSentinelRepository.inspectContract(selected.payload));
      }
    } catch {
      setReport(NoraContractSentinelRepository.inspectContract(selected.payload));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/nora/contract-sentinel/samples')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.samples) {
          setSamples(data.samples);
        }
      })
      .catch(() => {});

    loadContractAudit(selectedSampleId);
  }, []);

  const handleSelectSample = (id: string) => {
    setSelectedSampleId(id);
    loadContractAudit(id);
  };

  const handleCopyClause = (clause: string, id: string) => {
    navigator.clipboard.writeText(clause);
    setCopiedClauseId(id);
    toast.success({
      title: 'Remediation Clause Copied',
      description: 'NCREC Form 2A11-T clause ready to paste into counter-offer.'
    });
    setTimeout(() => setCopiedClauseId(null), 3000);
  };

  if (!report) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-500 font-bold animate-pulse border border-slate-200">
        Nora AI scanning NC Form 2-T legal provisions, Due Diligence deadlines & statutory disclosures...
      </div>
    );
  }

  const filteredAnomalies = report.anomalies.filter(a => {
    if (activeFilter === 'all') return true;
    return a.severity === activeFilter;
  });

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-[#00635C] bg-emerald-50 border-emerald-300';
    if (score >= 65) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-rose-700 bg-rose-50 border-rose-300';
  };

  return (
    <div className="w-full space-y-6 text-left font-sans animate-fadeIn">
      
      {/* 1. Master Sentinel Header Banner */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <Scale className="w-3 h-3 text-[#00635C]" /> NCREC Legal Risk Sentinel
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">Form 2-T Edition</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Nora Contract Anomaly & Due Diligence Sentinel
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Automated legal risk audit for North Carolina Offer to Purchase contracts (Form 2-T) inspecting non-refundable Due Diligence exposure, financing contingencies, and coastal CAMA mandates.
          </p>
        </div>

        {/* Safety Score Gauge */}
        <div className={`border p-5 rounded-3xl text-right shrink-0 ${getScoreColor(report.overallSafetyScore)}`}>
          <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-70">
            Contract Safety Score
          </span>
          <div className="text-4xl font-black font-mono mt-0.5">
            {report.overallSafetyScore}<span className="text-sm font-normal text-slate-500">/100</span>
          </div>
          <span className="text-[11px] font-bold block mt-1">
            {report.riskSummary.overallVerdict}
          </span>
        </div>
      </div>

      {/* 2. Sample Contract Selector Bar */}
      <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#00635C]" />
          <label className="text-xs font-bold text-slate-700">Select Contract Scenario:</label>
        </div>

        <div className="flex-1 max-w-xl">
          <select
            value={selectedSampleId}
            onChange={(e) => handleSelectSample(e.target.value)}
            className="w-full text-xs font-bold text-slate-900 bg-[#F7F8F5] border border-slate-200 rounded-xl p-2.5 cursor-pointer hover:border-slate-300 focus:ring-[#00635C] transition"
          >
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Audited Price:</span>
          <span className="font-extrabold text-slate-900">${report.purchasePrice.toLocaleString()}</span>
        </div>
      </div>

      {/* 3. Due Diligence Timeline & Settlement Gantt */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00635C]" />
            <h3 className="text-sm font-bold text-slate-900">NC Form 2-T Critical Timeline Audit</h3>
          </div>
          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
            report.timelineAudit.isDdpAdequateForFinancing ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {report.timelineAudit.isDdpAdequateForFinancing ? 'Financing Safe' : 'Financing Alert'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#F7F8F5] border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Step 1: Effective Date</span>
            <div className="text-sm font-extrabold text-slate-900">{report.timelineAudit.effectiveDate}</div>
            <span className="text-[11px] text-slate-500 block">DDF Delivery Deadline: 5:00 PM Effective Date</span>
          </div>

          <div className={`p-4 rounded-2xl border space-y-1 ${
            report.timelineAudit.isDdpAdequateForFinancing ? 'bg-[#F7F8F5] border-slate-200' : 'bg-rose-50/80 border-rose-200'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Step 2: DDP Expiration (5:00 PM Rule)</span>
            <div className={`text-sm font-black ${report.timelineAudit.isDdpAdequateForFinancing ? 'text-[#00635C]' : 'text-rose-700'}`}>
              {report.timelineAudit.dueDiligenceExpirationDate}
            </div>
            <span className="text-[11px] text-slate-500 block">All inspections & loan approvals must conclude</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F8F5] border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Step 3: Settlement Date</span>
            <div className="text-sm font-extrabold text-slate-900">{report.timelineAudit.settlementDate}</div>
            <span className="text-[11px] text-slate-500 block">{report.timelineAudit.daysBetweenDdpAndClosing} Days Buffer After Due Diligence</span>
          </div>
        </div>
      </div>

      {/* 4. Categorized Anomalies List */}
      <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#00635C]" />
            <h3 className="text-sm font-bold text-slate-900">Legal Anomalies & Sentinel Findings</h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-[#F7F8F5] border border-slate-200 p-1 rounded-xl gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All ({report.anomalies.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('critical')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeFilter === 'critical' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700'
              }`}
            >
              Critical ({report.riskSummary.criticalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('warning')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeFilter === 'warning' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-800'
              }`}
            >
              Warnings ({report.riskSummary.warningCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('verified')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeFilter === 'verified' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-800'
              }`}
            >
              Verified ({report.riskSummary.verifiedCount})
            </button>
          </div>
        </div>

        {/* Anomaly Cards */}
        <div className="space-y-4">
          {filteredAnomalies.map((anom) => {
            const isCritical = anom.severity === 'critical';
            const isWarning = anom.severity === 'warning';
            const isVerified = anom.severity === 'verified';

            return (
              <div
                key={anom.id}
                className={`p-5 rounded-2xl border transition space-y-3 ${
                  isCritical 
                    ? 'bg-rose-50/50 border-rose-200' 
                    : isWarning 
                      ? 'bg-amber-50/50 border-amber-200' 
                      : 'bg-emerald-50/40 border-emerald-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        isCritical ? 'bg-rose-600 text-white' : isWarning ? 'bg-amber-600 text-white' : 'bg-emerald-700 text-white'
                      }`}>
                        {anom.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">{anom.category}</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900">{anom.title}</h4>
                  </div>

                  {anom.statutoryReference && (
                    <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                      {anom.statutoryReference}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{anom.description}</p>

                <div className="bg-white/80 border border-slate-200/80 p-3 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Financial & Operational Impact:</span>
                  <p className="font-bold text-slate-800">{anom.riskImpact}</p>
                </div>

                {anom.remediationClause && (
                  <div className="bg-white border border-emerald-200 p-4 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-[#00635C] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#00635C]" /> Recommended Form 2A11-T Remediation Clause
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyClause(anom.remediationClause!, anom.id)}
                        className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-[#00635C] font-extrabold rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        {copiedClauseId === anom.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Clause</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-slate-700 bg-[#F7F8F5] p-3 rounded-lg border border-slate-200 text-[11px] leading-relaxed select-all">
                      {anom.remediationClause}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
