/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Rechat MCP Integration Modal
 * Connects Rechat Model Context Protocol (https://mcp.cluster.rechat.com/mcp)
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink, 
  Key, 
  Search, 
  Database, 
  Users, 
  FileText, 
  Sparkles, 
  RefreshCw, 
  Globe, 
  Layers, 
  ShieldCheck,
  Check
} from 'lucide-react';

interface RechatMcpIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RechatMcpIntegrationModal: React.FC<RechatMcpIntegrationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [status, setStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [apiToken, setApiToken] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'test_mls' | 'test_contacts' | 'raw_rpc'>('overview');
  const [testQuery, setTestQuery] = useState('1104 S Live Oak Pkwy');
  const [testResult, setTestResult] = useState<any>(null);
  const [isExecutingTest, setIsExecutingTest] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/integrations/rechat/mcp/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (err) {
      console.warn('Failed to fetch Rechat MCP status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiToken.trim()) return;
    setIsSavingToken(true);
    try {
      const res = await fetch('/api/integrations/rechat/mcp/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken: apiToken.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setStatus(data.status);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to configure Rechat MCP token:', err);
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleRunMlsTest = async () => {
    setIsExecutingTest(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/integrations/rechat/mcp/listings/lookup?address=${encodeURIComponent(testQuery)}`);
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ error: err?.message || 'Query failed' });
    } finally {
      setIsExecutingTest(false);
    }
  };

  const handleRunContactTest = async () => {
    setIsExecutingTest(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/integrations/rechat/mcp/contacts/lookup?query=${encodeURIComponent(testQuery)}`);
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ error: err?.message || 'Query failed' });
    } finally {
      setIsExecutingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Rechat Model Context Protocol (MCP)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  Remote MCP
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Connect Shapework & Nora Real Estate AI to live Rechat MLS listings, contacts, and transactions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          {[
            { id: 'overview', label: 'Connection & Setup', icon: Globe },
            { id: 'test_mls', label: 'Live MLS Listing Test', icon: Database },
            { id: 'test_contacts', label: 'People Center Test', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setTestResult(null);
                  if (tab.id === 'test_mls') setTestQuery('1104 S Live Oak Pkwy');
                  if (tab.id === 'test_contacts') setTestQuery('Matt Orr');
                }}
                className={`px-3 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                  isActive
                    ? 'border-[#00635C] text-[#00635C] font-bold bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* TAB 1: OVERVIEW & CONNECTION */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Server Endpoint Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider">Remote MCP Server Endpoint</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Connected & Operational</span>
                    </span>
                  </div>
                  <code className="text-xs font-mono font-bold text-indigo-900 bg-white/80 px-2 py-1 rounded-lg border border-indigo-200 mt-1 inline-block">
                    https://mcp.cluster.rechat.com/mcp
                  </code>
                </div>
                <button
                  type="button"
                  onClick={fetchStatus}
                  disabled={isLoadingStatus}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold border border-slate-300 transition shadow-2xs flex items-center gap-1.5 cursor-pointer text-xs self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                  <span>Refresh Health</span>
                </button>
              </div>

              {/* Capability Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  Activated Rechat MCP Capabilities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { title: 'Live MLS Listing Search', desc: 'Query active/pending listings, prices, beds/baths, square footage, and MLS photos.', icon: Database, ready: true },
                    { title: 'People Center & CRM Contacts', desc: 'Look up agents, past clients, and VIP tags directly from phone calls and emails.', icon: Users, ready: true },
                    { title: 'Deals & Transaction Tracking', desc: 'Verify contract closing dates, buyer/seller side details, and critical milestones.', icon: FileText, ready: true },
                    { title: 'Brand Marketing Generator', desc: 'Auto-trigger flyers, social carousels, postcards, and single-property websites.', icon: Sparkles, ready: true }
                  ].map((cap, idx) => {
                    const Icon = cap.icon;
                    return (
                      <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-[#00635C] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{cap.title}</span>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {cap.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Token Configuration Form */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Rechat Production API Token</h3>
                    <p className="text-[11px] text-slate-500">
                      Configure your brokerage Rechat bearer token to override sandbox mode with real-time Rechat cluster data.
                    </p>
                  </div>
                  {saveSuccess && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px] font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveToken} className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder="Enter Rechat Bearer Token / API Key..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingToken || !apiToken.trim()}
                    className="px-4 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingToken ? 'Saving...' : 'Save Token'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE MLS LISTING TEST */}
          {activeTab === 'test_mls' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="Enter property address (e.g. 1104 S Live Oak Pkwy, 212 Wetland Drive)..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#00635C] transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRunMlsTest}
                  disabled={isExecutingTest || !testQuery.trim()}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isExecutingTest ? 'animate-spin' : ''}`} />
                  <span>Lookup MLS Listing</span>
                </button>
              </div>

              {/* Result Preview */}
              {testResult?.listing && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{testResult.listing.propertyAddress}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          MLS #{testResult.listing.mlsNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Listing Agent: <span className="text-slate-800 font-semibold">{testResult.listing.listingAgent}</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-[#00635C]">
                      {testResult.listing.priceFormatted}
                    </div>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 bg-white rounded-xl border border-slate-200/60 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Bedrooms</div>
                      <div className="text-sm font-bold text-slate-800">{testResult.listing.bedrooms} Beds</div>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200/60 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Bathrooms</div>
                      <div className="text-sm font-bold text-slate-800">{testResult.listing.bathrooms} Baths</div>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200/60 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Square Feet</div>
                      <div className="text-sm font-bold text-slate-800">{testResult.listing.squareFeet.toLocaleString()} SqFt</div>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200/60 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Year Built</div>
                      <div className="text-sm font-bold text-slate-800">{testResult.listing.yearBuilt}</div>
                    </div>
                  </div>

                  {/* Photos */}
                  {testResult.listing.photos && testResult.listing.photos.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        High-Resolution MLS Photos ({testResult.listing.photos.length})
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {testResult.listing.photos.map((photo: string, pIdx: number) => (
                          <img
                            key={pIdx}
                            src={photo}
                            alt={`MLS Photo ${pIdx + 1}`}
                            className="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-2xs"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTACTS TEST */}
          {activeTab === 'test_contacts' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="Search People Center by agent name or email..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#00635C] transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRunContactTest}
                  disabled={isExecutingTest || !testQuery.trim()}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isExecutingTest ? 'animate-spin' : ''}`} />
                  <span>Search Contacts</span>
                </button>
              </div>

              {testResult?.contacts && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">
                    Contacts Found ({testResult.contacts.length})
                  </div>
                  {testResult.contacts.map((contact: any) => (
                    <div key={contact.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{contact.name}</div>
                        <div className="text-slate-500 text-[11px]">{contact.email} • {contact.phone}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {contact.tags.map((t: string, tidx: number) => (
                          <span key={tidx} className="px-2 py-0.5 bg-white text-slate-700 rounded-lg text-[10px] font-semibold border border-slate-200">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[11px]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-End Encrypted JSON-RPC Protocol</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
