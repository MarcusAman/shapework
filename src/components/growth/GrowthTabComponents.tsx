/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Database,
  RefreshCw,
  Sliders,
  ChevronRight,
  Link2,
  Mail,
  Users,
  CheckCircle,
  Briefcase,
  ArrowRight,
  Clock,
  ArrowUpRight,
  Activity,
  FileText,
  Zap,
  Settings,
  ChevronLeft,
  Phone,
  AlertTriangle,
  Building,
  Target,
  X,
  PlusCircle,
  Check,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  PlusSquare
} from 'lucide-react';

// ==========================================
// 1. OVERVIEW TAB
// ==========================================
export function OverviewTab({
  contacts,
  campaigns,
  tasks,
  replies,
  overviewSubView,
  handleUpdateTaskStatus,
  handleUpdateProspectStage,
  getRecruits,
  getFilteredProspects,
  formatCurrency,
  setActiveTab,
  setOverviewSubView,
  logs
}: any) {
  if (overviewSubView === 'dashboard') {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left animate-fade-in">
        {/* Main Stats and Action Panel */}
        <div className="xl:col-span-2 space-y-6">
          {/* Quick Metrics rollup */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sw-card-raised p-4 bg-white">
              <span className="text-[10px] font-bold text-text-tertiary uppercase font-mono">Total Contacts</span>
              <h3 className="text-xl font-bold text-[var(--sw-green-900)] mt-1">{contacts.length}</h3>
            </div>
            <div className="sw-card-raised p-4 bg-white">
              <span className="text-[10px] font-bold text-text-tertiary uppercase font-mono">Active Campaigns</span>
              <h3 className="text-xl font-bold text-blue-600 mt-1">
                {campaigns.filter((c: any) => c.status === 'active').length}
              </h3>
            </div>
            <div className="sw-card-raised p-4 bg-white">
              <span className="text-[10px] font-bold text-text-tertiary uppercase font-mono">Domain Health</span>
              <h3 className="text-xl font-bold text-emerald-600 mt-1">Healthy</h3>
            </div>
            <div className="sw-card-raised p-4 bg-white">
              <span className="text-[10px] font-bold text-text-tertiary uppercase font-mono">Operator Tasks</span>
              <h3 className="text-xl font-bold text-amber-600 mt-1">
                {tasks.filter((t: any) => t.status === 'pending').length}
              </h3>
            </div>
          </div>

          {/* Recommended Next Actions */}
          <div className="sw-card-raised p-5 bg-white space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Recommended Operator Actions</h3>
            <div className="divide-y divide-stone-100">
              {campaigns.some((c: any) => c.status === 'blocked_by_compliance') && (
                <div className="py-3 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Compliance Block Detected</h4>
                    <p className="text-[10px] text-text-tertiary mt-0.5">
                      Your campaign is blocked by compliance checklist requirements. Check unsubscribes and verified domains.
                    </p>
                    <button
                      onClick={() => setActiveTab('compliance')}
                      className="text-[10px] text-brand-green font-bold hover:underline mt-1.5 flex items-center gap-0.5 cursor-pointer"
                    >
                      Remediate now <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              {replies.some((r: any) => !r.isHandled) ? (
                <div className="py-3 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Hot Replies Awaiting Review</h4>
                    <p className="text-[10px] text-text-tertiary mt-0.5">
                      You have unhandled outbound replies in your relationship growth queue.
                    </p>
                    <button
                      onClick={() => setActiveTab('inbox')}
                      className="text-[10px] text-brand-green font-bold hover:underline mt-1.5 flex items-center gap-0.5 cursor-pointer"
                    >
                      Open Reply Inbox <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-3 flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">All Inboxes Caught Up</h4>
                    <p className="text-[10px] text-text-tertiary mt-0.5">
                      No unhandled replies detected. Keep nurturing relationships.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hot Replies Ledger */}
          <div className="sw-card-raised p-5 bg-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Hot Relationship Signals</h3>
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="min-w-full divide-y divide-stone-200 text-xs">
                <thead className="bg-stone-50 text-text-secondary">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold font-mono">Sender</th>
                    <th className="px-4 py-2.5 text-left font-bold font-mono">Classification</th>
                    <th className="px-4 py-2.5 text-left font-bold font-mono">Body Snippet</th>
                    <th className="px-4 py-2.5 text-right font-bold font-mono">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {replies.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-text-tertiary">
                        No replies received yet.
                      </td>
                    </tr>
                  ) : (
                    replies.slice(0, 5).map((r: any) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3 font-semibold">{r.fromEmail}</td>
                        <td className="px-4 py-3">
                          <span className="bg-brand-green-soft text-brand-green px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
                            Interested Recruit
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-tertiary text-[11px] truncate max-w-xs">{r.body}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setActiveTab('inbox')}
                            className="text-[10px] text-brand-green font-bold hover:underline cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Quick Tasks & Logs */}
        <div className="space-y-6">
          <div className="sw-card-raised p-5 bg-white space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Today's Tasks</h3>
            <div className="space-y-2.5">
              {tasks.filter((t: any) => t.status === 'pending' || t.status === 'open').length === 0 ? (
                <p className="text-xs text-text-tertiary text-center py-4">No pending tasks for today.</p>
              ) : (
                tasks
                  .filter((t: any) => t.status === 'pending' || t.status === 'open')
                  .map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-start gap-2.5 p-2 bg-stone-50 rounded-lg hover:bg-stone-100/80 transition-colors"
                    >
                      <button
                        onClick={() => handleUpdateTaskStatus(t.id, 'completed')}
                        className="mt-0.5 shrink-0 border border-stone-300 rounded hover:border-green-500 h-4 w-4 flex items-center justify-center cursor-pointer"
                      >
                        <Check className="w-3 h-3 text-white hover:text-green-500" />
                      </button>
                      <div>
                        <h4 className="text-[11px] font-bold text-text-secondary">{t.title}</h4>
                        <p className="text-[9px] text-text-tertiary mt-0.5">{t.description}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Growth Engine Console Output logs */}
          <div className="sw-card-raised p-5 bg-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Growth Engine Telemetry</h3>
            <div className="bg-stone-900 rounded-lg p-3 text-[10px] font-mono text-stone-200 space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
              {logs.map((log: string, i: number) => (
                <div key={i} className="truncate">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Else, show CRM Pipeline view for Playwright legacy test compatibility
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start select-none">
        {[
          {
            id: 'Target',
            label: 'Prospect Pool',
            count: getRecruits().filter((p: any) => p.stage === 'Target').length,
            border: 'border-t-2 border-t-stone-400'
          },
          {
            id: 'Contacted',
            label: 'Contacted',
            count: getRecruits().filter((p: any) => p.stage === 'Contacted').length,
            border: 'border-t-2 border-t-blue-400'
          },
          {
            id: 'Interviewing',
            label: 'Interviewing',
            count: getRecruits().filter((p: any) => p.stage === 'Interviewing').length,
            border: 'border-t-2 border-t-amber-400'
          },
          {
            id: 'Offered',
            label: 'Offered Split',
            count: getRecruits().filter((p: any) => p.stage === 'Offered').length,
            border: 'border-t-2 border-t-purple-400'
          },
          {
            id: 'Signed',
            label: 'Signed / Onboarding',
            count: getRecruits().filter((p: any) => p.stage === 'Signed').length,
            border: 'border-t-2 border-t-brand-green'
          }
        ].map((col) => {
          const colRecruits = getRecruits().filter((p: any) => (p.stage || 'Target') === col.id);
          return (
            <div
              key={col.id}
              className={`bg-stone-50 border border-[var(--sw-border)] rounded-xl p-3 space-y-3 shrink-0 min-h-[500px] flex flex-col ${col.border}`}
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                  {col.label}
                </span>
                <span className="text-[10px] font-bold font-mono bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded-full">
                  {col.count}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[600px] scrollbar-thin">
                {colRecruits.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-stone-300 rounded-lg p-6 text-center text-text-tertiary text-[10px]">
                    No Candidates
                  </div>
                ) : (
                  colRecruits.map((p: any) => (
                    <div
                      key={p.id}
                      className="bg-white border border-[var(--sw-border)] rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-2 text-left cursor-grab active:cursor-grabbing"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-text-primary text-[11px] leading-tight truncate">
                            {p.firstName} {p.lastName}
                          </span>
                          <span
                            className={`px-1 rounded font-mono font-bold text-[8px] uppercase shrink-0 ${
                              p.priority === 'High'
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : p.priority === 'Medium'
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {p.priority}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-tertiary flex items-center gap-1 mt-1 font-medium">
                          <Building className="w-3 h-3 shrink-0" />
                          {p.company || 'Unknown Current'}
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono font-bold block mt-1">
                          {formatCurrency(p.annualVolume || p.annual_volume || 0)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                        <span className="text-[9px] text-[var(--sw-muted)] font-mono">{p.lastAction || 'Identified'}</span>
                        <select
                          value={p.stage || 'Target'}
                          onChange={(e) => handleUpdateProspectStage(p.id, e.target.value as any)}
                          className="text-[9px] bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 font-bold cursor-pointer"
                        >
                          <option value="Target">Pool</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Interviewing">Intv</option>
                          <option value="Offered">Offer</option>
                          <option value="Signed">Signed</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 2. AUDIENCES TAB
// ==========================================
export function AudiencesTab({
  audiences,
  selectedAudienceId,
  setSelectedAudienceId,
  audienceContacts,
  contacts,
  csvPaste,
  setCsvPaste,
  handleCsvImport,
  newAudienceName,
  setNewAudienceName,
  newAudienceDesc,
  setNewAudienceDesc,
  handleCreateAudience,
  manualContact,
  setManualContact,
  handleAddManualContact
}: any) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left animate-fade-in">
      {/* Main Area: Audiences and Contacts Ledger */}
      <div className="xl:col-span-2 space-y-6">
        {/* Seeded Audiences Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {audiences.map((aud: any) => (
            <div
              key={aud.id}
              onClick={() => setSelectedAudienceId(aud.id)}
              className={`sw-card-raised p-4 bg-white cursor-pointer border-2 transition-all ${
                selectedAudienceId === aud.id ? 'border-brand-green bg-stone-50/40' : 'border-transparent'
              }`}
            >
              <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-text-primary">{aud.name}</h4>
                <span className="bg-stone-100 text-text-secondary px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                  {audienceContacts.filter((ac: any) => ac.audienceId === aud.id).length} contacts
                </span>
              </div>
              <p className="text-[10px] text-text-tertiary mt-2">{aud.description}</p>
            </div>
          ))}
        </div>

        {/* List of Contacts in selected Audience */}
        {selectedAudienceId && (
          <div className="sw-card-raised p-5 bg-white space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                Contacts in {audiences.find((a: any) => a.id === selectedAudienceId)?.name}
              </h3>
            </div>
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="min-w-full divide-y divide-stone-200 text-xs">
                <thead className="bg-stone-50 text-text-secondary">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-bold font-mono">Name</th>
                    <th className="px-4 py-2.5 text-left font-bold font-mono">Email</th>
                    <th className="px-4 py-2.5 text-left font-bold font-mono">Source</th>
                    <th className="px-4 py-2.5 text-left font-bold font-mono">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {audienceContacts.filter((ac: any) => ac.audienceId === selectedAudienceId).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-text-tertiary">
                        No contacts in this audience. Add one below.
                      </td>
                    </tr>
                  ) : (
                    audienceContacts
                      .filter((ac: any) => ac.audienceId === selectedAudienceId)
                      .map((ac: any) => {
                        const c = contacts.find((item: any) => item.id === ac.contactId);
                        if (!c) return null;
                        return (
                          <tr key={ac.id}>
                            <td className="px-4 py-3 font-semibold">
                              {c.firstName} {c.lastName}
                            </td>
                            <td className="px-4 py-3">{c.email}</td>
                            <td className="px-4 py-3 text-text-tertiary">
                              <span
                                className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                                  ['purchased_list', 'scraped_data'].includes(c.source)
                                    ? 'bg-red-50 text-red-600 border border-red-200'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                }`}
                              >
                                {c.source}
                              </span>
                            </td>
                            <td className="px-4 py-3 uppercase text-text-tertiary text-[9px] font-mono font-bold">
                              {c.type || c.contactType}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CSV Ingestion */}
        {selectedAudienceId && (
          <div className="sw-card-raised p-5 bg-white space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Bulk CSV Import</h3>
              <p className="text-[10px] text-text-tertiary mt-0.5">
                Paste list of contacts as CSV (format: email, firstName, lastName)
              </p>
            </div>
            <textarea
              value={csvPaste}
              onChange={(e) => setCsvPaste(e.target.value)}
              placeholder="e.g. john@kw.com, John, Doe"
              rows={3}
              className="w-full p-2.5 border border-stone-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-green bg-stone-50/50 font-sans"
            />
            <button onClick={handleCsvImport} className="sw-btn sw-btn-primary px-4 py-2 text-xs font-bold cursor-pointer">
              Parse & Ingest CSV
            </button>
          </div>
        )}
      </div>

      {/* Right Sidebar: Create Audience & Ingest Form */}
      <div className="space-y-6">
        <div className="sw-card-raised p-5 bg-white space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Create Audience</h3>
          <form onSubmit={handleCreateAudience} className="space-y-3">
            <input
              type="text"
              value={newAudienceName}
              onChange={(e) => setNewAudienceName(e.target.value)}
              placeholder="Audience Name"
              className="w-full p-2 border border-stone-200 rounded-lg text-xs"
            />
            <input
              type="text"
              value={newAudienceDesc}
              onChange={(e) => setNewAudienceDesc(e.target.value)}
              placeholder="Description"
              className="w-full p-2 border border-stone-200 rounded-lg text-xs"
            />
            <button
              type="submit"
              className="w-full sw-btn sw-btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <PlusSquare className="w-4 h-4" /> Create Card
            </button>
          </form>
        </div>

        {selectedAudienceId && (
          <div className="sw-card-raised p-5 bg-white space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Add Single Contact</h3>
            <form onSubmit={handleAddManualContact} className="space-y-3">
              <input
                type="text"
                value={manualContact.firstName}
                onChange={(e) => setManualContact({ ...manualContact, firstName: e.target.value })}
                placeholder="First Name"
                className="w-full p-2 border border-stone-200 rounded-lg text-xs"
              />
              <input
                type="text"
                value={manualContact.lastName}
                onChange={(e) => setManualContact({ ...manualContact, lastName: e.target.value })}
                placeholder="Last Name"
                className="w-full p-2 border border-stone-200 rounded-lg text-xs"
              />
              <input
                type="email"
                value={manualContact.email}
                onChange={(e) => setManualContact({ ...manualContact, email: e.target.value })}
                placeholder="Email (Required)"
                className="w-full p-2 border border-stone-200 rounded-lg text-xs"
              />
              <select
                value={manualContact.type}
                onChange={(e) => setManualContact({ ...manualContact, type: e.target.value })}
                className="w-full p-2 border border-stone-200 rounded-lg text-xs bg-white"
              >
                <option value="lead">Lead</option>
                <option value="past_client">Past Client</option>
                <option value="buyer_lead">Buyer Lead</option>
                <option value="seller_lead">Seller Lead</option>
                <option value="agent_recruit">Agent Recruit</option>
                <option value="referral_partner">Referral Partner</option>
              </select>
              <select
                value={manualContact.source}
                onChange={(e) => setManualContact({ ...manualContact, source: e.target.value })}
                className="w-full p-2 border border-stone-200 rounded-lg text-xs bg-white font-mono"
              >
                <option value="website_lead">website_lead</option>
                <option value="event_attendee">event_attendee</option>
                <option value="referral_partner">referral_partner</option>
                <option value="purchased_list">purchased_list (Risky)</option>
                <option value="scraped_data">scraped_data (Prohibited)</option>
              </select>
              <button type="submit" className="w-full sw-btn sw-btn-primary py-2 text-xs font-bold cursor-pointer">
                Add & Map Contact
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. PLAYBOOKS TAB
// ==========================================
export function PlaybooksTab({ playbooks, handleApplyPlaybook }: any) {
  return (
    <div className="space-y-6 text-left animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {playbooks.map((pb: any) => (
          <div key={pb.id} className="sw-card-raised p-5 bg-white flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="bg-brand-green-soft text-brand-green px-1.5 py-0.5 rounded font-mono font-bold text-[9px] uppercase">
                  {pb.targetAudienceType || pb.target_audience_type || 'Audience'}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9px] ${
                    pb.suggestedTone === 'warm' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  {pb.suggestedTone || pb.suggested_tone || 'Tone'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-text-primary">{pb.name}</h3>
              <p className="text-[11px] text-text-tertiary leading-relaxed">{pb.description}</p>
            </div>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[10px] text-text-tertiary font-mono">
                {pb.sequenceLength || pb.sequence_length || 1} Steps
              </span>
              <button
                onClick={() => handleApplyPlaybook(pb)}
                className="px-3 py-1.5 bg-brand-900 text-white rounded text-[10px] font-bold hover:bg-brand-800 transition-all cursor-pointer"
              >
                Start Campaign
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 4. CAMPAIGNS TAB
// ==========================================
export function CampaignsTab({
  campaigns,
  playbooks,
  audiences,
  handleToggleCampaign,
  handleDeleteCampaign,
  setActiveTab
}: any) {
  return (
    <div className="space-y-6 text-left animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Relationship Outreach Campaigns</h3>
        <button
          onClick={() => setActiveTab('sequence')}
          className="sw-btn sw-btn-primary px-3 py-1.5 text-xs font-bold cursor-pointer"
        >
          Create Campaign
        </button>
      </div>

      <div className="overflow-x-auto border border-stone-200 rounded-xl bg-white">
        <table className="min-w-full divide-y divide-stone-200 text-xs">
          <thead className="bg-stone-50 text-text-secondary select-none">
            <tr>
              <th className="px-4 py-3 text-left font-bold font-mono">Campaign Name</th>
              <th className="px-4 py-3 text-left font-bold font-mono">Audience</th>
              <th className="px-4 py-3 text-left font-bold font-mono">Playbook</th>
              <th className="px-4 py-3 text-left font-bold font-mono">Status</th>
              <th className="px-4 py-3 text-left font-bold font-mono">Compliance</th>
              <th className="px-4 py-3 text-right font-bold font-mono">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 bg-white">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">
                  No active campaigns. Setup one in the Sequence Builder.
                </td>
              </tr>
            ) : (
              campaigns.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-semibold text-text-primary">{c.name}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {audiences.find((a: any) => a.id === c.audienceId)?.name || 'Mapped Audience'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {playbooks.find((p: any) => p.id === c.playbookId)?.name || 'Outreach Pattern'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        c.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : c.status === 'blocked_by_compliance'
                          ? 'bg-red-100 text-red-700 font-bold'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9px] ${
                        c.complianceStatus === 'passed'
                          ? 'text-green-600 bg-green-50'
                          : c.complianceStatus === 'failed'
                          ? 'text-red-600 bg-red-50'
                          : 'text-stone-500 bg-stone-50'
                      }`}
                    >
                      {c.complianceStatus || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                    <button
                      onClick={() => handleToggleCampaign(c.id)}
                      className="px-2 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-[10px] font-bold text-text-secondary cursor-pointer"
                    >
                      {c.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(c.id)}
                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded text-[10px] font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 5. SEQUENCE BUILDER TAB
// ==========================================
export function SequenceBuilderTab({
  campaignForm,
  setCampaignForm,
  audiences,
  sendingDomains,
  sequenceSteps,
  setSequenceSteps,
  handleRunCompliance,
  isCheckingCompliance,
  complianceResult,
  getPreviewText,
  handleSaveCampaign
}: any) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left animate-fade-in">
      {/* Main sequence structure builder */}
      <div className="xl:col-span-2 space-y-6">
        <div className="sw-card-raised p-5 bg-white space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Campaign Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary font-mono">Campaign Name</label>
              <input
                type="text"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="e.g. Past Clients Summer Nurture"
                className="w-full p-2 border border-stone-200 rounded-lg text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary font-mono">Target Audience</label>
              <select
                value={campaignForm.audienceId}
                onChange={(e) => setCampaignForm({ ...campaignForm, audienceId: e.target.value })}
                className="w-full p-2 border border-stone-200 rounded-lg text-xs bg-white"
              >
                <option value="">Select Audience...</option>
                {audiences.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary font-mono">Sending Domain Credentials</label>
              <select
                value={campaignForm.sendingDomainId}
                onChange={(e) => setCampaignForm({ ...campaignForm, sendingDomainId: e.target.value })}
                className="w-full p-2 border border-stone-200 rounded-lg text-xs bg-white"
              >
                <option value="">Select Domain...</option>
                {sendingDomains.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.domain} ({d.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary font-mono">CTA / Value Proposition</label>
              <input
                type="text"
                value={campaignForm.cta}
                onChange={(e) => setCampaignForm({ ...campaignForm, cta: e.target.value })}
                placeholder="e.g. Get a local construction report"
                className="w-full p-2 border border-stone-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Steps sequence list */}
        <div className="sw-card-raised p-5 bg-white space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Sequence Email Steps</h3>
            <button
              onClick={() =>
                setSequenceSteps([
                  ...sequenceSteps,
                  { stepNumber: sequenceSteps.length + 1, delayDays: 3, subject: '', body: '' }
                ])
              }
              className="px-2 py-1 text-[10px] font-bold bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded cursor-pointer"
            >
              + Add Step
            </button>
          </div>

          <div className="space-y-4">
            {sequenceSteps.map((step: any, idx: number) => (
              <div key={idx} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold font-mono">Step {step.stepNumber}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-tertiary">Delay (Days)</span>
                    <input
                      type="number"
                      value={step.delayDays}
                      onChange={(e) =>
                        setSequenceSteps(
                          sequenceSteps.map((s: any, i: number) =>
                            i === idx ? { ...s, delayDays: Number(e.target.value) } : s
                          )
                        )
                      }
                      className="w-12 p-1 border border-stone-200 rounded text-center text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={step.subject}
                    onChange={(e) =>
                      setSequenceSteps(
                        sequenceSteps.map((s: any, i: number) => (i === idx ? { ...s, subject: e.target.value } : s))
                      )
                    }
                    placeholder="Subject Line"
                    className="w-full p-2 border border-stone-200 rounded-lg text-xs bg-white"
                  />
                  <textarea
                    value={step.body}
                    onChange={(e) =>
                      setSequenceSteps(
                        sequenceSteps.map((s: any, i: number) => (i === idx ? { ...s, body: e.target.value } : s))
                      )
                    }
                    placeholder="Email Body (Markdown supported, use {{first_name}}, {{unsubscribe_link}})"
                    rows={4}
                    className="w-full p-2 border border-stone-200 rounded-lg text-xs bg-white font-sans"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Compliance details and launch controls */}
      <div className="space-y-6">
        <div className="sw-card-raised p-5 bg-white space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Compliance Checks</h3>
          <p className="text-[10px] text-text-tertiary">
            Before launching relationship campaigns, we run mandatory compliance checks.
          </p>
          <button
            onClick={handleRunCompliance}
            disabled={isCheckingCompliance}
            className="w-full sw-btn sw-btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isCheckingCompliance ? 'Evaluating...' : 'Run Compliance Check'}
          </button>

          {complianceResult && (
            <div
              className={`p-3 rounded-lg border text-xs space-y-2 ${
                complianceResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {complianceResult.success ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                <span>{complianceResult.success ? 'Ready to Launch' : 'Compliance Warning'}</span>
              </div>
              {complianceResult.success ? (
                <p className="text-[10px]">{complianceResult.details}</p>
              ) : (
                <ul className="list-disc pl-4 text-[10px] space-y-1">
                  {complianceResult.failures.map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Preview Substitutions panel */}
        {sequenceSteps[0]?.body && (
          <div className="sw-card-raised p-5 bg-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Outbound Variable Preview</h3>
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-sans leading-relaxed text-text-secondary select-none">
              <div className="font-bold border-b pb-1 mb-1.5">Subject: {getPreviewText(sequenceSteps[0].subject)}</div>
              <div className="whitespace-pre-line">{getPreviewText(sequenceSteps[0].body)}</div>
            </div>
          </div>
        )}

        {/* Save and Launch button controls */}
        <div className="flex gap-2">
          <button
            onClick={() => handleSaveCampaign(false)}
            className="flex-1 sw-btn sw-btn-primary py-2 bg-stone-200 hover:bg-stone-300 text-text-primary border border-stone-300 text-xs font-bold cursor-pointer"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSaveCampaign(true)}
            className="flex-1 sw-btn sw-btn-primary py-2 text-xs font-bold cursor-pointer"
          >
            Launch Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. REPLY INBOX TAB
// ==========================================
export function ReplyInboxTab({
  replies,
  replyClassifications,
  contacts,
  simReply,
  setSimReply,
  handleSimulateReply,
  simResult
}: any) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left animate-fade-in">
      {/* Main replies queue */}
      <div className="xl:col-span-2 sw-card-raised p-5 bg-white space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Outbound Inbound Replies Queue</h3>
        <div className="space-y-4">
          {replies.length === 0 ? (
            <p className="text-xs text-text-tertiary text-center py-8">
              No email replies received. Simulate an inbound reply on the right panel.
            </p>
          ) : (
            replies.map((r: any) => {
              const classification = replyClassifications.find((rc: any) => rc.replyId === r.id);
              return (
                <div key={r.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <span className="font-bold text-xs text-text-primary">{r.fromEmail}</span>
                      <span className="text-[10px] text-text-tertiary block mt-0.5">
                        Received: {new Date(r.receivedAt).toLocaleString()}
                      </span>
                    </div>
                    <span className="bg-brand-green-soft text-brand-green px-1.5 py-0.5 rounded font-mono font-bold text-[9px] uppercase">
                      {classification?.classification || classification?.intent || 'interested_agent_recruit'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed bg-white border border-stone-200 p-2.5 rounded-lg font-mono">
                    {r.body}
                  </p>
                  {r.recommendedAction || classification?.summary ? (
                    <div className="text-[10px] text-brand-green font-bold flex items-center gap-1.5 bg-brand-green-soft/40 px-2 py-1 rounded">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>
                        Recommended Action: {r.recommendedAction || classification?.summary || 'Schedule call & send splits.'}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Sidebar: Webhook simulator */}
      <div className="sw-card-raised p-5 bg-white space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Inbound Webhook Simulator</h3>
        <p className="text-[10px] text-text-tertiary">
          Simulate a customer or recruit replying to a campaign email. This triggers AI classification and adds
          follow-up operator tasks.
        </p>
        <form onSubmit={handleSimulateReply} className="space-y-3">
          <div>
            <label className="text-[9px] font-bold text-text-secondary font-mono uppercase block">Sender Email</label>
            <select
              value={simReply.email}
              onChange={(e) => setSimReply({ ...simReply, email: e.target.value })}
              className="w-full p-2 border border-stone-200 rounded-lg text-xs bg-white mt-1"
            >
              <option value="">Select Target...</option>
              {contacts.map((c: any) => (
                <option key={c.id} value={c.email}>
                  {c.email} ({c.firstName || 'Recruit'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-bold text-text-secondary font-mono uppercase block">
              Email Response Content
            </label>
            <textarea
              value={simReply.body}
              onChange={(e) => setSimReply({ ...simReply, body: e.target.value })}
              rows={4}
              className="w-full p-2 border border-stone-200 rounded-lg text-xs mt-1 bg-stone-50/50 focus:bg-white"
            />
          </div>
          <button type="submit" className="w-full sw-btn sw-btn-primary py-2 text-xs font-bold cursor-pointer">
            Inject Simulated Reply
          </button>
        </form>

        {simResult && (
          <div className="p-3 bg-stone-900 text-stone-200 rounded-lg text-[10px] font-mono space-y-1.5 border border-stone-800">
            <div className="text-brand-green font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Webhook processed:
            </div>
            <div>Classification: {simResult.intent || simResult.classification}</div>
            <div className="truncate">Task ID: {simResult.taskId}</div>
            <div>Action: Created high-priority follow-up task.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 7. TASKS TAB
// ==========================================
export function TasksTab({ tasks, handleUpdateTaskStatus }: any) {
  return (
    <div className="space-y-6 text-left animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Relationship Tasks & Checklists</h3>
      </div>
      <div className="sw-card-raised p-5 bg-white">
        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="min-w-full divide-y divide-stone-200 text-xs">
            <thead className="bg-stone-50 text-text-secondary select-none">
              <tr>
                <th className="px-4 py-2.5 text-left font-bold font-mono">Task</th>
                <th className="px-4 py-2.5 text-left font-bold font-mono">Details</th>
                <th className="px-4 py-2.5 text-left font-bold font-mono">Status</th>
                <th className="px-4 py-2.5 text-right font-bold font-mono">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-text-tertiary">
                    No relationship tasks. Try simulating a reply webhook.
                  </td>
                </tr>
              ) : (
                tasks.map((t: any) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-semibold text-text-primary">{t.title}</td>
                    <td className="px-4 py-3 text-text-tertiary">{t.description}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.status === 'pending' || t.status === 'open' ? (
                        <button
                          onClick={() => handleUpdateTaskStatus(t.id, 'completed')}
                          className="px-2 py-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded text-[9px] font-bold cursor-pointer"
                        >
                          Complete
                        </button>
                      ) : (
                        <span className="text-[10px] text-text-tertiary font-mono">Closed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. SENDING DOMAINS TAB
// ==========================================
export function SendingDomainsTab({
  sendingDomains,
  handleVerifyDomain,
  handleAddDomain,
  newDomain,
  setNewDomain,
  providerMode = 'demo',
  apiKeyConfigured = false,
  webhookSecretConfigured = false
}: any) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left animate-fade-in">
      <div className="xl:col-span-2 space-y-6">
        {/* Provider Mode Banner */}
        <div className="p-4 rounded-xl border bg-stone-50 border-stone-200 flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-text-tertiary">Active Provider Configuration</span>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-sm font-bold text-text-primary">Resend Integration</h3>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                providerMode === 'production' ? 'bg-rose-100 text-rose-700' : providerMode === 'test' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {providerMode} mode
              </span>
            </div>
          </div>
          <div className="flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${apiKeyConfigured ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className="text-text-secondary">API Key: {apiKeyConfigured ? 'Configured' : 'Missing'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${webhookSecretConfigured ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className="text-text-secondary">Webhook Secret: {webhookSecretConfigured ? 'Configured' : 'Missing'}</span>
            </div>
          </div>
        </div>

        {providerMode === 'production' && !apiKeyConfigured && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex flex-col gap-1.5">
            <span className="font-bold">⚠️ Setup Required</span>
            <span>Production mode is active but RESEND_API_KEY is not configured in the environment. Outbound outreach sending will be blocked until configured.</span>
          </div>
        )}

        {/* List of active sending domains */}
        {sendingDomains.length === 0 ? (
          <div className="sw-card-raised p-8 text-center text-text-tertiary text-xs">
            No sending domains configured. Setup a custom domain to start outreach.
          </div>
        ) : (
          sendingDomains.map((d: any) => {
            const canLaunch = d.status === 'verified' && !d.isPaused && (providerMode !== 'production' || apiKeyConfigured);
            return (
              <div key={d.id} className="sw-card-raised p-5 bg-white space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      {d.domain}
                      {d.isPaused && (
                        <span className="px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded text-[9px] font-bold uppercase">Paused</span>
                      )}
                    </h4>
                    <span className="text-[10px] text-text-tertiary block mt-0.5 font-medium">
                      Daily Limit: {d.dailyLimit || d.daily_sending_limit || 100} emails | ID: {d.id || 'N/A'}
                    </span>
                    {d.lastCheckedAt && (
                      <span className="text-[9px] text-text-tertiary block mt-0.5 font-mono">
                        Last checked: {new Date(d.lastCheckedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        d.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {d.status}
                    </span>
                    {d.status !== 'verified' && (
                      <button
                        onClick={() => handleVerifyDomain(d.id)}
                        className="px-2 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-[9px] font-bold text-text-secondary cursor-pointer"
                      >
                        Recheck DNS
                      </button>
                    )}
                  </div>
                </div>

                {/* Health Warning Badges */}
                <div className="flex gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                    d.bounceWarningStatus === 'critical' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    Bounce Health: {d.bounceWarningStatus || 'healthy'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                    d.complaintWarningStatus === 'critical' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    Complaint Health: {d.complaintWarningStatus || 'healthy'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                    canLaunch ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-700'
                  }`}>
                    Launch Ready: {canLaunch ? 'Yes' : 'No'}
                  </span>
                </div>

                {/* DNS Records Table */}
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold font-mono text-text-tertiary uppercase">
                      DNS Records Required {providerMode === 'demo' && '(Simulated)'}
                    </span>
                    {providerMode === 'demo' && (
                      <span className="text-[8px] font-bold text-amber-600 uppercase">Demo Simulation</span>
                    )}
                  </div>
                  <div className="space-y-1.5 pt-1 text-[10px] font-mono text-text-secondary">
                    <div className="flex justify-between border-b pb-1 gap-2">
                      <span className="font-bold">TXT @</span>
                      <span className="text-text-tertiary truncate max-w-sm">{d.dnsRecords?.[0]?.value || `v=spf1 include:feedback.resend.com ~all`}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1 gap-2">
                      <span className="font-bold">CNAME resend-dkim1</span>
                      <span className="text-text-tertiary truncate max-w-sm">{d.dnsRecords?.[1]?.value || `dkim1.resend.com`}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="font-bold">TXT _dmarc</span>
                      <span className="text-text-tertiary truncate max-w-sm">{d.dnsRecords?.[2]?.value || `v=DMARC1; p=none;`}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Right Sidebar: Setup Domain */}
      <div className="sw-card-raised p-5 bg-white space-y-4 h-fit">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Setup Custom Domain</h3>
        <p className="text-[10px] text-text-tertiary">
          Configure SPF and DKIM details using Resend provider abstraction to launch outbound outreach campaigns.
        </p>
        <form onSubmit={handleAddDomain} className="space-y-3">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="e.g. mail.nestrealty.com"
            className="w-full p-2 border border-stone-200 rounded-lg text-xs"
            disabled={providerMode === 'production' && !apiKeyConfigured}
          />
          <button
            type="submit"
            className="w-full sw-btn sw-btn-primary py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
            disabled={providerMode === 'production' && !apiKeyConfigured}
          >
            Configure Domain Records
          </button>
        </form>
        {providerMode === 'demo' && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[9px] leading-relaxed">
            <strong>Demo Mode Active:</strong> Added domains will be auto-generated with mock DNS settings and can be immediately verified for simulation.
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 9. COMPLIANCE TAB
// ==========================================
export function ComplianceTab({
  suppressionList,
  complianceChecks,
  newSuppressionEmail,
  setNewSuppressionEmail,
  newSuppressionReason,
  setNewSuppressionReason,
  handleAddSuppression
}: any) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left animate-fade-in">
      {/* Compliance checker metrics and suppression lists */}
      <div className="xl:col-span-2 space-y-6">
        {/* Suppression list ledger */}
        <div className="sw-card-raised p-5 bg-white space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Mailing Suppression List</h3>
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="min-w-full divide-y divide-stone-200 text-xs">
              <thead className="bg-stone-50 text-text-secondary">
                <tr>
                  <th className="px-4 py-2.5 text-left font-bold font-mono">Suppressed Email</th>
                  <th className="px-4 py-2.5 text-left font-bold font-mono">Reason</th>
                  <th className="px-4 py-2.5 text-left font-bold font-mono">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {suppressionList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-text-tertiary">
                      No suppressed emails found.
                    </td>
                  </tr>
                ) : (
                  suppressionList.map((s: any) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-semibold text-text-primary">{s.email}</td>
                      <td className="px-4 py-3 uppercase text-red-600 font-mono font-bold text-[10px]">{s.reason}</td>
                      <td className="px-4 py-3 text-text-tertiary">{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance checks run log history */}
        <div className="sw-card-raised p-5 bg-white space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Compliance Checks Ledger</h3>
          <div className="space-y-2">
            {complianceChecks.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-4">No compliance audits run yet.</p>
            ) : (
              complianceChecks.map((audit: any) => (
                <div
                  key={audit.id}
                  className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs flex justify-between items-start gap-4"
                >
                  <div>
                    <span className="font-bold text-text-primary">Audit: {audit.id}</span>
                    <ul className="text-[10px] text-text-tertiary mt-0.5 list-disc pl-4 space-y-0.5">
                      {Array.isArray(audit.findings) && audit.findings.length > 0 ? (
                        audit.findings.map((f: string, i: number) => <li key={i}>{f}</li>)
                      ) : (
                        <li>Verified details passed CAN-SPAM specifications.</li>
                      )}
                    </ul>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase ${
                      audit.checksPassed || audit.passed ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                    }`}
                  >
                    {audit.checksPassed || audit.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Add to suppression */}
      <div className="sw-card-raised p-5 bg-white space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Add Email to Suppression</h3>
        <p className="text-[10px] text-text-tertiary">
          Manually suppress mailing updates to prevent bounces, complaints, or compliance warnings.
        </p>
        <form onSubmit={handleAddSuppression} className="space-y-3">
          <input
            type="email"
            value={newSuppressionEmail}
            onChange={(e) => setNewSuppressionEmail(e.target.value)}
            placeholder="bruce@wayne.co"
            className="w-full p-2 border border-stone-200 rounded-lg text-xs"
          />
          <select
            value={newSuppressionReason}
            onChange={(e) => setNewSuppressionReason(e.target.value)}
            className="w-full p-2 border border-stone-200 rounded-lg text-xs bg-white"
          >
            <option value="unsubscribe">unsubscribe</option>
            <option value="bounce">bounce</option>
            <option value="complaint">complaint</option>
            <option value="manual">manual block</option>
          </select>
          <button type="submit" className="w-full sw-btn sw-btn-primary py-2 text-xs font-bold cursor-pointer">
            Add to Suppression List
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 10. ANALYTICS TAB
// ==========================================
export function AnalyticsTab({
  filteredProspects,
  getRecruits,
  formatCurrency,
  searchTerm,
  setSearchTerm,
  productionFilter,
  setProductionFilter,
  priorityFilter,
  setPriorityFilter,
  setSelectedProspect
}: any) {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Funnel Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="sw-card-raised p-4 bg-white">
          <span className="text-[9px] font-bold text-text-tertiary uppercase font-mono">Total Tracked</span>
          <h3 className="text-xl font-bold text-[var(--sw-green-900)] mt-1">{filteredProspects.length}</h3>
        </div>
        <div className="sw-card-raised p-4 bg-white">
          <span className="text-[9px] font-bold text-text-tertiary uppercase font-mono">Recruits Contacted</span>
          <h3 className="text-xl font-bold text-blue-600 mt-1">
            {getRecruits().filter((c: any) => c.stage === 'Contacted').length}
          </h3>
        </div>
        <div className="sw-card-raised p-4 bg-white">
          <span className="text-[9px] font-bold text-text-tertiary uppercase font-mono">Interviewing</span>
          <h3 className="text-xl font-bold text-amber-600 mt-1">
            {getRecruits().filter((c: any) => c.stage === 'Interviewing').length}
          </h3>
        </div>
        <div className="sw-card-raised p-4 bg-white">
          <span className="text-[9px] font-bold text-text-tertiary uppercase font-mono">Offered Split</span>
          <h3 className="text-xl font-bold text-purple-600 mt-1">
            {getRecruits().filter((c: any) => c.stage === 'Offered').length}
          </h3>
        </div>
        <div className="sw-card-raised p-4 bg-white">
          <span className="text-[9px] font-bold text-text-tertiary uppercase font-mono">Hired / Signed</span>
          <h3 className="text-xl font-bold text-brand-green mt-1">
            +{getRecruits().filter((c: any) => c.stage === 'Signed').length}
          </h3>
        </div>
      </div>

      {/* Visual Conversion Funnel Chart */}
      <div className="sw-card-raised bg-white p-5 space-y-4">
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
            Recruiting Conversion Funnel
          </h3>
          <p className="text-[11px] text-[var(--sw-muted)] mt-0.5">Stages and candidate counts in recruiting funnel.</p>
        </div>

        <div className="grid grid-cols-5 gap-3 pt-2">
          {[
            { stage: 'Target', label: 'Target Pool', color: 'bg-stone-300' },
            { stage: 'Contacted', label: 'Contacted', color: 'bg-blue-300' },
            { stage: 'Interviewing', label: 'Interviewing', color: 'bg-amber-300' },
            { stage: 'Offered', label: 'Offered Split', color: 'bg-purple-300' },
            { stage: 'Signed', label: 'Signed Affiliation', color: 'bg-brand-green' }
          ].map((item) => {
            const count = getRecruits().filter((p: any) => p.stage === item.stage).length;
            const pct = getRecruits().length ? Math.round((count / getRecruits().length) * 100) : 0;
            return (
              <div key={item.stage} className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold text-text-secondary">{item.label}</span>
                  <span className="font-bold text-text-primary">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 rounded bg-stone-100 overflow-hidden">
                  <div
                    className={`h-full rounded ${item.color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidates Ledger & Intelligence Table */}
      <div className="sw-card-raised bg-white p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
              Market Talents Database
            </h3>
            <p className="text-[11px] text-[var(--sw-muted)] mt-0.5">
              Top-producing local agents currently tracked in MLS feeds.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidate or brokerage..."
                className="pl-8 pr-3 py-1.5 border border-[var(--sw-border)] rounded-lg text-[11px] font-medium w-48 focus:outline-none focus:border-brand-green bg-stone-50/50"
              />
            </div>

            <select
              value={productionFilter}
              onChange={(e) => setProductionFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-[var(--sw-border)] rounded-lg text-[11px] font-medium focus:outline-none focus:border-brand-green bg-stone-50/50"
            >
              <option value="All">All Production</option>
              <option value="High-Producers $10M+">High-Producers $10M+</option>
              <option value="Mid-Producers $5M-$10M">Mid-Producers $5M-$10M</option>
              <option value="Rookies <$5M">Rookies &lt;$5M</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-[var(--sw-border)] rounded-lg text-[11px] font-medium focus:outline-none focus:border-brand-green bg-stone-50/50"
            >
              <option value="All">All Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-[var(--sw-border)] rounded-xl bg-white">
          <table className="min-w-full divide-y divide-[var(--sw-border)] text-[11px]">
            <thead className="bg-stone-50 font-mono text-text-secondary select-none">
              <tr>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Candidate & Brokerage</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Annual Production</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Funnel Stage</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Last Activity</th>
                <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sw-border)] bg-white">
              {filteredProspects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">
                    No candidates match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProspects.map((p: any) => (
                  <tr key={p.id} className="hover:bg-stone-50/55 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-text-primary">{p.name}</div>
                      <div className="text-[10px] text-text-tertiary flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 shrink-0" />
                        {p.current_brokerage}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-text-primary">{formatCurrency(p.annual_volume)}</div>
                      <div className="text-[9px] text-[var(--sw-muted)] mt-0.5">{p.production_segment}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          p.stage === 'Signed'
                            ? 'bg-success-soft text-success'
                            : p.stage === 'Offered'
                            ? 'bg-purple-50 text-purple-600 border border-purple-200'
                            : p.stage === 'Interviewing'
                            ? 'bg-warning-soft text-warning'
                            : p.stage === 'Contacted'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {p.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono font-bold text-[9px] ${
                          p.priority === 'High'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : p.priority === 'Medium'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {p.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary font-mono">
                      <div>{p.last_action || 'Registered'}</div>
                      <div className="text-[9px] text-text-tertiary mt-0.5">
                        {new Date(p.last_contact).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedProspect(p)}
                        className="px-2 py-1 bg-white hover:bg-stone-100 border border-[var(--sw-border)] rounded text-[10px] font-bold text-text-secondary cursor-pointer transition-all"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 11. INTEGRATIONS TAB
// ==========================================
export function IntegrationsTab({
  channels,
  handleToggleChannelConnection,
  handleSyncChannel,
  syncingChannelId
}: any) {
  return (
    <div className="space-y-6 text-left animate-fade-in">
      <div>
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Recruiting Data Channels
        </h3>
        <p className="text-[11px] text-[var(--sw-muted)] mt-0.5">
          Active data synchronization connections powering the relationship growth engines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channels.map((chan: any) => (
          <div key={chan.id} className="sw-card-raised p-5 bg-white flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="bg-stone-100 text-text-secondary px-1.5 py-0.5 rounded font-mono font-bold text-[9px]">
                  {chan.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    chan.connected ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {chan.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-text-primary">{chan.name}</h3>
              <p className="text-[11.5px] text-text-tertiary leading-relaxed">{chan.description}</p>
            </div>

            <div className="pt-3 border-t border-stone-100 text-[10px] text-text-tertiary font-mono space-y-1.5">
              <div className="flex justify-between">
                <span>Records Synced</span>
                <span className="font-bold text-text-primary">{chan.records_synchronized}</span>
              </div>
              <div className="flex justify-between">
                <span>Errors Count</span>
                <span className="font-bold text-text-primary">{chan.errors_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Synced</span>
                <span className="font-bold text-text-primary">
                  {chan.last_sync ? new Date(chan.last_sync).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleToggleChannelConnection(chan.id)}
                className="flex-1 px-3 py-1.5 border border-stone-200 text-text-secondary rounded text-[10px] font-bold hover:bg-stone-50 transition-all cursor-pointer text-center"
              >
                {chan.connected ? 'Disconnect' : 'Connect'}
              </button>
              {chan.connected && (
                <button
                  onClick={() => handleSyncChannel(chan.id)}
                  disabled={syncingChannelId === chan.id}
                  className="flex-1 px-3 py-1.5 bg-brand-900 text-white rounded text-[10px] font-bold hover:bg-brand-800 transition-all cursor-pointer disabled:opacity-50 text-center"
                >
                  {syncingChannelId === chan.id ? 'Syncing...' : 'Sync Now'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
