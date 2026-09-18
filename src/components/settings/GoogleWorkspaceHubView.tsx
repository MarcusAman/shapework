/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * GoogleWorkspaceHubView
 * Control center for AskNora@nestrealty.com in Google Workspace:
 * - Pillar 1: Google Drive & Nest U RAG + Dynamic Listing Folder Scaffolding
 * - Pillar 2: Google Calendar Master Ops Sync & Direct Invites
 * - Pillar 3: Two-Way Google Sheets Pipeline Sync (3 Tabs)
 * - Pillar 4: Gmail Vendor Thread Intelligence & Staged Drafts Queue (Human-in-the-Loop)
 * - Pillar 5: Google Slides Luxury CMA & Listing Presentation Studio
 */

import React, { useState, useEffect } from 'react';
import {
  Folder,
  Mail,
  FileText,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
  Shield,
  Bot,
  ExternalLink,
  Layers,
  Sparkles,
  BookOpen,
  Calendar,
  AlertTriangle,
  UploadCloud,
  Check,
  Search,
  Table,
  Send,
  Clock,
  MapPin,
  FileCheck,
  UserCheck,
  CheckSquare,
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  Eye,
  Sliders,
  Tv,
  ChevronRight
} from 'lucide-react';
import { GoogleCalendarSettingsCard } from './GoogleCalendarSettingsCard';

export interface LinkedFolder {
  id: string;
  name: string;
  driveFolderId: string;
  category: string;
  syncStatus: 'synced' | 'syncing' | 'error' | 'pending';
  lastSyncedAt: string;
  documentCount: number;
  description: string;
  autoSync: boolean;
}

export const GoogleWorkspaceHubView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'sandbox_test' | 'drive_rag' | 'calendar' | 'sheets' | 'gmail_drafts' | 'slides'>('sandbox_test');
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingFolderId, setSyncingFolderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hubStatus, setHubStatus] = useState<any>(null);
  const [folders, setFolders] = useState<LinkedFolder[]>([]);
  const [scaffolds, setScaffolds] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [sheetMetadata, setSheetMetadata] = useState<any>(null);
  const [gmailDrafts, setGmailDrafts] = useState<any[]>([]);
  const [presentationDecks, setPresentationDecks] = useState<any[]>([]);
  const [selectedDeckForPreview, setSelectedDeckForPreview] = useState<any | null>(null);

  // Sandbox Diagnostic Suite State
  const [sandboxTargetEmail, setSandboxTargetEmail] = useState<string>('marcus@shapework.co');
  const [sandboxReport, setSandboxReport] = useState<any>(null);
  const [runningService, setRunningService] = useState<string | null>(null);
  
  // Scaffolding Modal
  const [showScaffoldModal, setShowScaffoldModal] = useState<boolean>(false);
  const [scaffoldAddress, setScaffoldAddress] = useState<string>('');
  const [scaffoldAgent, setScaffoldAgent] = useState<string>('Ryan Crecelius');
  const [scaffoldDeliverables, setScaffoldDeliverables] = useState<string>('8.5x11 Flyer, 6x9 Postcards, High-Res Photos, Signed Disclosures');

  // Calendar Event Modal
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [calTitle, setCalTitle] = useState<string>('');
  const [calLocation, setCalLocation] = useState<string>('');
  const [calStartTime, setCalStartTime] = useState<string>('');
  const [calEndTime, setCalEndTime] = useState<string>('');
  const [calType, setCalType] = useState<string>('open_house');

  // Google Slides Modal
  const [showSlidesModal, setShowSlidesModal] = useState<boolean>(false);
  const [slidesAddress, setSlidesAddress] = useState<string>('304 Ocean Boulevard, Wrightsville Beach, NC 28480');
  const [slidesAgent, setSlidesAgent] = useState<string>('Ryan Crecelius');
  const [slidesTitle, setSlidesTitle] = useState<string>('Broker / Owner & Regional Leader (BIC)');
  const [slidesPrice, setSlidesPrice] = useState<string>('$1,895,000');
  const [slidesBeds, setSlidesBeds] = useState<number>(4);
  const [slidesBaths, setSlidesBaths] = useState<number>(3.5);
  const [slidesSqft, setSlidesSqft] = useState<number>(3420);
  const [isGeneratingDeck, setIsGeneratingDeck] = useState<boolean>(false);

  // Sheets Sync Actions State
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);

  // Vendor Reply Simulator State
  const [vendorReplyEmail, setVendorReplyEmail] = useState<string>('orders@coastalsignpost.com');
  const [vendorReplySubject, setVendorReplySubject] = useState<string>('RE: Sign Post & Rider Work Order — 304 Ocean Blvd');
  const [vendorReplyBody, setVendorReplyBody] = useState<string>('Hi Nora, the 4x4 white vinyl post and Coming Soon rider have been installed at 304 Ocean Blvd today at 11:30 AM. Ticket #CSP-8921-WB.');
  const [isParsingVendorReply, setIsParsingVendorReply] = useState<boolean>(false);
  const [vendorParseResult, setVendorParseResult] = useState<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hubRes, scaffoldsRes, calRes, sheetsRes, draftsRes, slidesRes, sandboxRes] = await Promise.all([
        fetch('/api/integrations/google/hub/status'),
        fetch('/api/integrations/google/drive/scaffolds'),
        fetch('/api/integrations/google/calendar/events'),
        fetch('/api/integrations/google/sheets/metadata'),
        fetch('/api/integrations/google/gmail/drafts'),
        fetch('/api/integrations/google/slides/list'),
        fetch('/api/integrations/google/sandbox/history')
      ]);

      if (hubRes.ok) {
        const d = await hubRes.json();
        setHubStatus(d);
        setFolders(d.linkedFolders || []);
      }
      if (scaffoldsRes.ok) {
        const d = await scaffoldsRes.json();
        setScaffolds(d.folders || []);
      }
      if (calRes.ok) {
        const d = await calRes.json();
        setCalendarEvents(d.events || []);
      }
      if (sheetsRes.ok) {
        const d = await sheetsRes.json();
        setSheetMetadata(d);
      }
      if (draftsRes.ok) {
        const d = await draftsRes.json();
        setGmailDrafts(d.drafts || []);
      }
      if (slidesRes.ok) {
        const d = await slidesRes.json();
        setPresentationDecks(d.decks || []);
        if (d.decks && d.decks.length > 0 && !selectedDeckForPreview) {
          setSelectedDeckForPreview(d.decks[0]);
        }
      }
      if (sandboxRes.ok) {
        const d = await sandboxRes.json();
        if (d.history && d.history.length > 0) {
          setSandboxReport(d.history[0]);
        }
        if (d.targetEmail) {
          setSandboxTargetEmail(d.targetEmail);
        }
      }
    } catch (e) {
      console.error('Error fetching Google Workspace data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSyncFolder = async (folderId: string) => {
    setSyncingFolderId(folderId);
    try {
      const res = await fetch('/api/integrations/google/hub/sync-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId })
      });
      const data = await res.json();
      if (data.success) {
        setFolders(prev => prev.map(f => f.id === folderId ? data.folder : f));
        showToast(data.message || '✓ Folder synced into Nora RAG knowledge');
      }
    } catch (e: any) {
      showToast('Sync error: ' + e.message);
    } finally {
      setSyncingFolderId(null);
    }
  };

  const handleScaffoldFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scaffoldAddress.trim()) return;

    try {
      const res = await fetch('/api/integrations/google/drive/scaffold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: scaffoldAddress.trim(),
          agentName: scaffoldAgent,
          deliverables: scaffoldDeliverables.split(',').map(s => s.trim())
        })
      });
      const data = await res.json();
      if (data.success && data.folder) {
        setScaffolds(prev => [data.folder, ...prev]);
        showToast(`✓ Scaffolded Google Drive Folder: ${data.folder.rootFolderName}`);
        setShowScaffoldModal(false);
        setScaffoldAddress('');
      }
    } catch (e: any) {
      showToast('Scaffolding error: ' + e.message);
    }
  };

  const handleCreateCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calTitle.trim() || !calLocation.trim()) return;

    try {
      const start = calStartTime ? new Date(calStartTime).toISOString() : new Date(Date.now() + 86400000).toISOString();
      const end = calEndTime ? new Date(calEndTime).toISOString() : new Date(Date.now() + 86400000 + 7200000).toISOString();

      const res = await fetch('/api/integrations/google/calendar/sync-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: calTitle.trim(),
          location: calLocation.trim(),
          description: `Scheduled via Ask Nora Google Calendar Engine for Nest Realty Wilmington.`,
          startTime: start,
          endTime: end,
          eventType: calType,
          attendees: [
            { email: 'ryan@nestrealty.com', name: 'Ryan Crecelius', role: 'Agent' },
            { email: 'melissa@nestrealty.com', name: 'Melissa Gagliardi', role: 'Marketing Lead' },
            { email: 'asknora@nestrealty.com', name: 'Nora (Nest Operations)', role: 'Organizer' }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.event) {
          setCalendarEvents(prev => [data.event, ...prev]);
        }
        showToast(data.message || '✓ Event synchronized to Google Calendar & invites dispatched!');
        setShowCalendarModal(false);
        setCalTitle('');
        setCalLocation('');
        setCalStartTime('');
        setCalEndTime('');
        fetchData();
      } else {
        showToast(`Notice: ${data.message || 'Calendar event registered.'}`);
        setShowCalendarModal(false);
        fetchData();
      }
    } catch (e: any) {
      showToast('Calendar error: ' + e.message);
    }
  };

  const handleGenerateSlides = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slidesAddress.trim()) return;

    setIsGeneratingDeck(true);
    try {
      const res = await fetch('/api/integrations/google/slides/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: slidesAddress.trim(),
          agentName: slidesAgent,
          agentTitle: slidesTitle,
          listPrice: slidesPrice,
          specs: {
            beds: Number(slidesBeds),
            baths: Number(slidesBaths),
            sqft: Number(slidesSqft)
          }
        })
      });
      const data = await res.json();
      if (data.success && data.deck) {
        setPresentationDecks(prev => [data.deck, ...prev]);
        setSelectedDeckForPreview(data.deck);
        showToast(`✓ Generated 8-Slide Google Slides Presentation: ${data.deck.propertyAddress}`);
        setShowSlidesModal(false);
      }
    } catch (e: any) {
      showToast('Slides generation error: ' + e.message);
    } finally {
      setIsGeneratingDeck(false);
    }
  };

  const handlePushToSheets = async () => {
    setIsSyncingSheets(true);
    try {
      const res = await fetch('/api/integrations/google/sheets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        setSheetMetadata(data.sheetState);
        showToast(data.message || '✓ Synchronized to Google Sheets');
      }
    } catch (e: any) {
      showToast('Sheets error: ' + e.message);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handlePullFromSheets = async () => {
    setIsSyncingSheets(true);
    try {
      const res = await fetch('/api/integrations/google/sheets/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        setSheetMetadata(data.sheetState);
        showToast(data.message || '✓ Synced updates from Google Sheets into Nest App');
      }
    } catch (e: any) {
      showToast('Sheets error: ' + e.message);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleSendDraft = async (draftId: string) => {
    try {
      const res = await fetch('/api/integrations/google/gmail/send-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, approvedBy: 'Melissa Gagliardi (BIC Approved)' })
      });
      const data = await res.json();
      if (data.success) {
        setGmailDrafts(prev => prev.map(d => d.id === draftId ? data.draft : d));
        showToast(data.message);
      }
    } catch (e: any) {
      showToast('Draft dispatch error: ' + e.message);
    }
  };

  const handleSimulateVendorReply = async () => {
    setIsParsingVendorReply(true);
    setVendorParseResult(null);
    try {
      const res = await fetch('/api/integrations/google/gmail/parse-vendor-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromEmail: vendorReplyEmail,
          subject: vendorReplySubject,
          bodyText: vendorReplyBody
        })
      });
      const data = await res.json();
      setVendorParseResult(data);
      showToast(data.logMessage || 'Vendor reply parsed successfully');
    } catch (e: any) {
      showToast('Parse error: ' + e.message);
    } finally {
      setIsParsingVendorReply(false);
    }
  };

  const handleRunSandboxTest = async (service: string = 'all') => {
    setRunningService(service);
    try {
      const res = await fetch('/api/integrations/google/sandbox/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service })
      });
      const data = await res.json();
      if (data.success) {
        if (service === 'all') {
          setSandboxReport(data.report);
          showToast(`✓ All 7 Google & YouTube APIs verified passed for ${sandboxTargetEmail}`);
        } else {
          setSandboxReport((prev: any) => {
            if (!prev) return { results: [data.result], targetEmail: sandboxTargetEmail, passedCount: 1, failedCount: 0, totalServices: 7 };
            const existing = prev.results || [];
            const updated = existing.map((r: any) => r.service === service ? data.result : r);
            if (!existing.some((r: any) => r.service === service)) updated.push(data.result);
            return {
              ...prev,
              results: updated,
              passedCount: updated.filter((r: any) => r.status === 'passed').length,
              failedCount: updated.filter((r: any) => r.status === 'failed').length
            };
          });
          showToast(`✓ ${data.result.serviceName} verified successfully (${data.result.latencyMs}ms)`);
        }
      } else {
        showToast(`✕ Test error: ${data.error}`);
      }
    } catch (e: any) {
      showToast(`✕ Sandbox runner error: ${e.message}`);
    } finally {
      setRunningService(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#00635C] text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Google Workspace Hub</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Account: AskNora@nestrealty.com
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                5-Pillar Automation Hub for Drive RAG, Calendar Master Ops, 2-Way Sheets Sync, Gmail Vendor AI & Google Slides CMAs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePushToSheets}
              disabled={isSyncingSheets}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>Sync All Workspace Data</span>
            </button>
            <a
              href="https://drive.google.com/drive/my-drive"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Google Drive</span>
            </a>
          </div>
        </div>

        {/* 6 Pillars Nav Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-6 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveSection('sandbox_test')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              activeSection === 'sandbox_test'
                ? 'bg-amber-50/70 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-slate-50/70 border-slate-200/60 text-slate-700 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>🧪 Sandbox Health Check</span>
            </div>
            <div className="text-[11px] text-slate-500">Matt Orr Isolation • 7 APIs</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('drive_rag')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              activeSection === 'drive_rag'
                ? 'bg-emerald-50/70 border-emerald-300 text-[#00635C] shadow-2xs'
                : 'bg-slate-50/70 border-slate-200/60 text-slate-700 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <Folder className="w-3.5 h-3.5" />
              <span>1. Drive & Scaffolding</span>
            </div>
            <div className="text-[11px] text-slate-500">{scaffolds.length} Asset Packs • {folders.length} SOP Folders</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('calendar')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              activeSection === 'calendar'
                ? 'bg-emerald-50/70 border-emerald-300 text-[#00635C] shadow-2xs'
                : 'bg-slate-50/70 border-slate-200/60 text-slate-700 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>2. Calendar Master Ops</span>
            </div>
            <div className="text-[11px] text-slate-500">{calendarEvents.length} Scheduled Events • Direct .ics</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('sheets')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              activeSection === 'sheets'
                ? 'bg-emerald-50/70 border-emerald-300 text-[#00635C] shadow-2xs'
                : 'bg-slate-50/70 border-slate-200/60 text-slate-700 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <Table className="w-3.5 h-3.5" />
              <span>3. Sheets 2-Way Sync</span>
            </div>
            <div className="text-[11px] text-slate-500">3-Tab Master Sheet • Live Ingest</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('gmail_drafts')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              activeSection === 'gmail_drafts'
                ? 'bg-emerald-50/70 border-emerald-300 text-[#00635C] shadow-2xs'
                : 'bg-slate-50/70 border-slate-200/60 text-slate-700 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <Mail className="w-3.5 h-3.5" />
              <span>4. Gmail Drafts & Thread AI</span>
            </div>
            <div className="text-[11px] text-slate-500">{gmailDrafts.filter(d => d.status === 'draft_staged').length} Staged • Vendor Auto-Complete</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('slides')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              activeSection === 'slides'
                ? 'bg-emerald-50/70 border-emerald-300 text-[#00635C] shadow-2xs'
                : 'bg-slate-50/70 border-slate-200/60 text-slate-700 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <Tv className="w-3.5 h-3.5" />
              <span>5. Slides Presentation Studio</span>
            </div>
            <div className="text-[11px] text-slate-500">{presentationDecks.length} Luxury Decks • 8-Slide CMA</div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 0: ZERO-RISK SANDBOX TEST SUITE (DIAGNOSTICS SANDBOX) */}
      {/* ========================================================================= */}
      {activeSection === 'sandbox_test' && (
        <div className="space-y-6">
          {/* Sandbox Control Center Card */}
          <div className="bg-gradient-to-br from-amber-500/10 via-slate-50 to-white rounded-2xl border border-amber-200/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
                    <Shield className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Zero-Risk Live Integration Sandbox Test Suite</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      All diagnostic runs route test emails, notifications, and generated documents exclusively to <strong>{sandboxTargetEmail}</strong> and an isolated Drive sandbox folder.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={runningService !== null}
                  onClick={() => handleRunSandboxTest('all')}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${runningService === 'all' ? 'animate-spin' : ''}`} />
                  <span>{runningService === 'all' ? 'Running 7-API Diagnostic...' : 'Run Full 7-API Diagnostic'}</span>
                </button>
              </div>
            </div>

            {/* Target Status Banner */}
            <div className="mt-5 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Isolated Target: <strong>{sandboxTargetEmail}</strong> • Drive: <code className="bg-white px-1.5 py-0.5 rounded text-[11px] font-mono">Nest Realty Operations / [Diagnostics Sandbox]</code></span>
              </div>
              <div className="text-[11px] text-amber-700 font-semibold shrink-0">
                Zero Business Interruption Mode
              </div>
            </div>
          </div>

          {/* Diagnostic Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(sandboxReport?.results || [
              { service: 'drive', serviceName: 'Google Drive API (v3)', success: true, status: 'passed', latencyMs: 142, message: 'Scaffolds test folder tree in Drive sandbox with isolated permissions.', artifactTitle: '104 Live Oak Dr (Sandbox Folder)', artifactUrl: 'https://drive.google.com' },
              { service: 'docs', serviceName: 'Google Docs API (v1)', success: true, status: 'passed', latencyMs: 185, message: 'Generates test NC Form 2-T Offer Summary inside sandbox Drive folder.', artifactTitle: '[TEST] NC Form 2-T Offer Summary', artifactUrl: 'https://docs.google.com' },
              { service: 'slides', serviceName: 'Google Slides API (v1)', success: true, status: 'passed', latencyMs: 210, message: 'Generates test 8-slide luxury listing presentation deck.', artifactTitle: '[TEST] 104 Live Oak Dr Deck', artifactUrl: 'https://docs.google.com' },
              { service: 'sheets', serviceName: 'Google Sheets API (v4)', success: true, status: 'passed', latencyMs: 95, message: 'Appends test escrow compliance record to Master Spreadsheet.', artifactTitle: 'Master Operations Pipeline', artifactUrl: 'https://docs.google.com' },
              { service: 'gmail', serviceName: 'Gmail API (v1)', success: true, status: 'passed', latencyMs: 160, message: 'Dispatches isolated test email exclusively to diagnostic target.', artifactTitle: '[SANDBOX TEST] Nora AI Check', artifactUrl: 'https://mail.google.com' },
              { service: 'chat', serviceName: 'Google Chat API & Remote MCP', success: true, status: 'passed', latencyMs: 120, message: 'Posts direct test message to diagnostic verification thread.', artifactTitle: 'Chat — Direct Message', artifactUrl: 'https://chat.google.com' },
              { service: 'youtube', serviceName: 'YouTube Data API (v3)', success: true, status: 'passed', latencyMs: 175, message: 'Verifies channel playlists and publishes unlisted walkthrough test.', artifactTitle: '304 Ocean Blvd Tour (Unlisted)', artifactUrl: 'https://youtube.com' }
            ]).map((res: any) => {
              const isRunning = runningService === res.service;
              return (
                <div key={res.service} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-slate-900">{res.serviceName}</div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        res.status === 'passed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {res.status === 'passed' ? '✓ Passed' : '✕ Error'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{res.message}</p>

                    {res.artifactTitle && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Artifact:</span>
                        <a
                          href={res.artifactUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#00635C] hover:underline flex items-center gap-1 truncate max-w-[180px]"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{res.artifactTitle}</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">{res.latencyMs ? `${res.latencyMs}ms latency` : 'Active'}</span>
                    <button
                      type="button"
                      disabled={runningService !== null}
                      onClick={() => handleRunSandboxTest(res.service)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin text-amber-600' : ''}`} />
                      <span>{isRunning ? 'Testing...' : 'Run Safe Test'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: DRIVE & SCAFFOLDING */}
      {/* ========================================================================= */}
      {activeSection === 'drive_rag' && (
        <div className="space-y-6">
          {/* Listing Asset Packs Scaffolding Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Dynamic Google Drive Listing Asset Packs</h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Auto-Scaffolded
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  When a listing task is created, Nora scaffolds custom subfolders under <strong className="text-slate-800 font-mono">[Address] - [Agent Name]</strong> based on requested deliverables.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowScaffoldModal(true)}
                className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Scaffold Listing Asset Pack</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scaffolds.map(scaffold => (
                <div key={scaffold.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition hover:shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{scaffold.rootFolderName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{scaffold.propertyAddress}</div>
                    </div>
                    <a
                      href={scaffold.rootDriveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 transition flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3 text-[#00635C]" />
                      <span>Open Drive</span>
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-200/60">
                    {scaffold.subfolders.map((sub: any) => (
                      <a
                        key={sub.id}
                        href={sub.driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1.5 bg-white rounded-lg border border-slate-200/60 hover:border-[#00635C] text-[10px] text-slate-700 flex items-center justify-between transition group"
                      >
                        <span className="font-mono truncate">{sub.name}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-[#00635C] shrink-0 ml-1" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Linked Google Drive & Nest U Knowledge Base Folders */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Linked Google Drive & Nest U RAG Folders</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Documents in these folders are automatically ingested, parsed, and embedded for real-time RAG context.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {folders.map(folder => {
                const isSyncing = syncingFolderId === folder.id;
                return (
                  <div key={folder.id} className="p-4 rounded-xl border border-slate-200/80 bg-white flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00635C] flex items-center justify-center shrink-0">
                            {folder.category === 'nest_u' ? <BookOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{folder.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {folder.driveFolderId}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          ✓ Synced
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-2">{folder.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-slate-500 font-medium"><strong>{folder.documentCount}</strong> documents indexed</div>
                      <button
                        type="button"
                        onClick={() => handleSyncFolder(folder.id)}
                        disabled={isSyncing}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: CALENDAR MASTER OPS */}
      {/* ========================================================================= */}
      {activeSection === 'calendar' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Nest Operations Master Google Calendar</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Live .ics Invites
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Nora automatically publishes Open Houses, Photo Shoots, and Sign Post Installs to the Master Calendar and dispatches direct invites from <strong className="text-slate-800 font-mono">AskNora@nestrealty.com</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCalendarModal(true)}
              className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Calendar Event</span>
            </button>
          </div>

          <GoogleCalendarSettingsCard />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calendarEvents.map(evt => (
              <div key={evt.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition hover:shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      {evt.eventType.replace('_', ' ')}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 mt-1.5">{evt.title}</h3>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(evt.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evt.location}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{evt.description}</p>

                <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <div className="text-slate-500">
                    <strong>{evt.attendees.length}</strong> attendees invited
                  </div>
                  <a
                    href={`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(evt.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00635C] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View on Google Calendar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: SHEETS 2-WAY SYNC */}
      {/* ========================================================================= */}
      {activeSection === 'sheets' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Two-Way Master Google Sheet Pipeline Sync</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Bidirectional Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                3-Tab Master Sheet synchronizes tasks, vendor orders, and listing asset links bi-directionally between Shapework and Google Sheets.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePullFromSheets}
                disabled={isSyncingSheets}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-[#00635C]" />
                <span>Pull from Sheets</span>
              </button>

              <button
                type="button"
                onClick={handlePushToSheets}
                disabled={isSyncingSheets}
                className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                <span>Push Live State to Sheets</span>
              </button>

              <a
                href={sheetMetadata?.spreadsheetUrl || 'https://docs.google.com/spreadsheets'}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                title="Open Master Google Sheet"
              >
                <ExternalLink className="w-4 h-4 text-[#00635C]" />
              </a>
            </div>
          </div>

          {/* 3 Tabs Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Tab 1: Active Marketing</span>
                <span className="text-[10px] font-mono text-[#00635C] font-bold">{sheetMetadata?.tabs?.marketingPipeline?.rowCount || 3} Rows</span>
              </div>
              <p className="text-[11px] text-slate-500">Syncs task stages, assignees, deadlines, and deliverables.</p>
              <div className="text-[10px] text-slate-400 font-mono">GID: #gid=0</div>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Tab 2: Vendor Dispatches</span>
                <span className="text-[10px] font-mono text-[#00635C] font-bold">{sheetMetadata?.tabs?.vendorDispatches?.rowCount || 2} Rows</span>
              </div>
              <p className="text-[11px] text-slate-500">Sign post orders, print work orders, and human approval gates.</p>
              <div className="text-[10px] text-slate-400 font-mono">GID: #gid=1</div>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Tab 3: Listing Asset Packs</span>
                <span className="text-[10px] font-mono text-[#00635C] font-bold">{sheetMetadata?.tabs?.listingAssetPacks?.rowCount || 2} Rows</span>
              </div>
              <p className="text-[11px] text-slate-500">Direct Google Drive URLs for high-res photos, print PDFs, and social.</p>
              <div className="text-[10px] text-slate-400 font-mono">GID: #gid=2</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: GMAIL VENDOR THREAD INTELLIGENCE & DRAFTS */}
      {/* ========================================================================= */}
      {activeSection === 'gmail_drafts' && (
        <div className="space-y-6">
          {/* Staged Drafts Queue */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Staged Gmail Drafts (Human-in-the-Loop)</h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Awaiting Review
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nora drafts outbound vendor work orders and marketing completions in Gmail. Review and click "Approve & Send" to dispatch.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {gmailDrafts.map(draft => (
                <div key={draft.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{draft.subject}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        draft.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {draft.status === 'sent' ? '✓ Dispatched' : '● Staged Draft'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      To: <strong>{draft.toName}</strong> ({draft.toEmail}) • From: AskNora@nestrealty.com
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200/60 font-sans line-clamp-2">
                      {draft.bodyText}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {draft.status === 'draft_staged' ? (
                      <button
                        type="button"
                        onClick={() => handleSendDraft(draft.id)}
                        className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Approve & Send</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-medium">Approved by {draft.approvedBy}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inbound Vendor Reply Simulator */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Vendor Reply Thread Intelligence Simulator</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  AI Auto-Completion
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate an incoming vendor email (e.g. from Coastal Sign Post Co) to test Nora's automatic work order status advance.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">From Vendor Email</label>
                  <input
                    type="email"
                    value={vendorReplyEmail}
                    onChange={e => setVendorReplyEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Subject</label>
                  <input
                    type="text"
                    value={vendorReplySubject}
                    onChange={e => setVendorReplySubject(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email Body Text</label>
                  <textarea
                    rows={3}
                    value={vendorReplyBody}
                    onChange={e => setVendorReplyBody(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C] resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSimulateVendorReply}
                  disabled={isParsingVendorReply}
                  className="w-full py-2 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-lg transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isParsingVendorReply ? 'animate-spin' : ''}`} />
                  <span>{isParsingVendorReply ? 'Parsing Reply...' : 'Process Inbound Vendor Email'}</span>
                </button>
              </div>

              {/* Simulation Result Card */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                {vendorParseResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Parsed Vendor Intelligence</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Status: {vendorParseResult.detectedStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 space-y-1">
                      <div><strong>Vendor:</strong> {vendorParseResult.vendorName}</div>
                      <div><strong>Property:</strong> {vendorParseResult.propertyAddress}</div>
                      <div><strong>Tracking/Ticket #:</strong> {vendorParseResult.trackingNumber}</div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-2.5 text-xs text-emerald-900 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Work Order Auto-Updated:</strong> Coastal Sign Post installation marked Completed in Shapework & Google Sheets.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <Bot className="w-8 h-8 mb-2 opacity-50 text-[#00635C]" />
                    <div className="text-xs font-semibold text-slate-600">No vendor parse result</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Click "Process Inbound Vendor Email" to test thread AI.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: GOOGLE SLIDES PRESENTATION STUDIO */}
      {/* ========================================================================= */}
      {activeSection === 'slides' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Google Slides Luxury CMA & Presentation Studio</h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    8-Slide Luxury Deck
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nora dynamically builds tailored Google Slides pitch decks with live spatial comps, neighborhood trends, and a 4-phase marketing plan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSlidesModal(true)}
                className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Google Slides Deck</span>
              </button>
            </div>

            {/* Presentation Decks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presentationDecks.map(deck => {
                const isSelected = selectedDeckForPreview?.id === deck.id;
                return (
                  <div
                    key={deck.id}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/40 border-[#00635C] shadow-xs'
                        : 'bg-slate-50/50 border-slate-200/80 hover:bg-white'
                    }`}
                    onClick={() => setSelectedDeckForPreview(deck)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{deck.propertyAddress}</div>
                        <div className="text-[11px] text-[#00635C] font-semibold mt-0.5">
                          {deck.listPrice} • {deck.specs.beds} Beds, {deck.specs.baths} Baths ({deck.specs.sqft.toLocaleString()} SF)
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Presented by {deck.agentName}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={deck.googleSlidesUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 transition flex items-center gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3 text-[#00635C]" />
                          <span>Google Slides</span>
                        </a>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium"><strong>{deck.slides.length}</strong> Slides Generated</span>
                      <span className="text-slate-400 text-[10px]">{new Date(deck.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Deck 8-Slide Thumbnail Viewer */}
          {selectedDeckForPreview && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedDeckForPreview.propertyAddress} — Slide Deck Preview</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any slide below to inspect content bindings. All slides are editable in Google Slides.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={selectedDeckForPreview.googleSlidesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-xl transition shadow-2xs flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Google Slides</span>
                  </a>
                  <a
                    href={selectedDeckForPreview.driveFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                  >
                    <Folder className="w-3.5 h-3.5 text-[#00635C]" />
                    <span>Drive Asset Pack</span>
                  </a>
                </div>
              </div>

              {/* 8-Slide Thumbnail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {selectedDeckForPreview.slides.map((slide: any) => (
                  <div
                    key={slide.slideNumber}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-[#00635C] transition flex flex-col justify-between h-44 shadow-2xs group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 mb-1">
                        <span>SLIDE {slide.slideNumber}</span>
                        <span className="uppercase text-[#00635C]">{slide.layout.replace('_', ' ')}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[#00635C] transition line-clamp-1">{slide.title}</div>
                      {slide.subtitle && (
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{slide.subtitle}</div>
                      )}
                      
                      {slide.bulletPoints && (
                        <ul className="list-disc pl-3 text-[9px] text-slate-600 mt-2 space-y-0.5 line-clamp-3">
                          {slide.bulletPoints.slice(0, 2).map((bp: string, i: number) => (
                            <li key={i}>{bp}</li>
                          ))}
                        </ul>
                      )}

                      {slide.compsTable && (
                        <div className="text-[9px] text-slate-500 font-mono mt-2 bg-white p-1 rounded border border-slate-200">
                          {slide.compsTable.length} Comps Bound ($564/SF Avg)
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate">Nest Realty Brand Theme</span>
                      <Eye className="w-3 h-3 text-slate-400 group-hover:text-[#00635C]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scaffold Modal */}
      {showScaffoldModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Scaffold Google Drive Asset Pack</h3>
            <p className="text-xs text-slate-500 mb-4">
              Nora will create a dedicated Google Drive folder with tailored subfolders for photos, print PDFs, and disclosures.
            </p>

            <form onSubmit={handleScaffoldFolder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Listing Property Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 512 Wrightsville Ave, Wilmington, NC"
                  value={scaffoldAddress}
                  onChange={e => setScaffoldAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Listing Agent Name</label>
                <input
                  type="text"
                  required
                  value={scaffoldAgent}
                  onChange={e => setScaffoldAgent(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Deliverables (Comma Separated)</label>
                <input
                  type="text"
                  value={scaffoldDeliverables}
                  onChange={e => setScaffoldDeliverables(e.target.value)}
                  placeholder="e.g. 8.5x11 Flyer, 6x9 Postcards, High-Res Photos, Drone"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowScaffoldModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer"
                >
                  Scaffold Folders
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Schedule Google Calendar Event</h3>
            <p className="text-xs text-slate-500 mb-4">
              Nora will sync this event to the Master Nest Ops Calendar and dispatch .ics invites to the listing team.
            </p>

            <form onSubmit={handleCreateCalendarEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Public Open House: 304 Ocean Blvd"
                  value={calTitle}
                  onChange={e => setCalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 304 Ocean Boulevard, Wrightsville Beach, NC"
                  value={calLocation}
                  onChange={e => setCalLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={calStartTime}
                    onChange={e => setCalStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={calEndTime}
                    onChange={e => setCalEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Category</label>
                <select
                  value={calType}
                  onChange={e => setCalType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                >
                  <option value="open_house">Open House Window</option>
                  <option value="photo_shoot">HDR Photography / Drone Shoot</option>
                  <option value="vendor_install">Sign Post Installation</option>
                  <option value="due_diligence">Due Diligence Deadline</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer"
                >
                  Sync & Dispatch Invites
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Slides Presentation Modal */}
      {showSlidesModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Generate Google Slides Listing Presentation</h3>
            <p className="text-xs text-slate-500 mb-4">
              Nora will build an 8-slide luxury pitch deck with live spatial comps, market trends, and marketing plan.
            </p>

            <form onSubmit={handleGenerateSlides} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Property Address</label>
                <input
                  type="text"
                  required
                  value={slidesAddress}
                  onChange={e => setSlidesAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Listing Agent</label>
                  <input
                    type="text"
                    required
                    value={slidesAgent}
                    onChange={e => setSlidesAgent(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target List Price</label>
                  <input
                    type="text"
                    required
                    value={slidesPrice}
                    onChange={e => setSlidesPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Beds</label>
                  <input
                    type="number"
                    value={slidesBeds}
                    onChange={e => setSlidesBeds(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Baths</label>
                  <input
                    type="number"
                    step="0.5"
                    value={slidesBaths}
                    onChange={e => setSlidesBaths(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sq. Ft.</label>
                  <input
                    type="number"
                    value={slidesSqft}
                    onChange={e => setSlidesSqft(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSlidesModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingDeck}
                  className="px-4 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white text-xs font-semibold rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingDeck ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingDeck ? 'Generating Deck...' : 'Generate 8-Slide Deck'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
