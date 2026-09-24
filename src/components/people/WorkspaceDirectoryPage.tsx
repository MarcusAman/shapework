import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Grid, 
  List, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Building, 
  Clock, 
  User, 
  Copy, 
  Calendar, 
  Award,
  RefreshCw,
  X,
  AlertTriangle,
  ChevronRight,
  Info,
  Upload,
  MoreVertical
} from 'lucide-react';
import { orgChartService } from '../../services/orgChartService';
import { invalidateWorkspaceDirectoryCache } from '../../utils/directoryCache';
import {
  aggregateDirectoryBannerCounts,
  DIRECTORY_BANNER_COUNTS_EVENT,
  displayDirectoryPhone,
  displayDirectoryTitle,
  formatProfileTitle,
  getDirectoryOfficeFilterOptions,
  getDirectoryTypeFilterOptions,
  isBicPerson,
  matchesOfficeFilter,
  matchesTypeFilter,
  normalizeOfficeLabel,
  normalizePersonType,
  planDirectoryLoadFailure,
  sanitizeDirectoryPhone,
  typeFilterLabel,
} from '../../utils/directoryWave1Fixes';
import { apiClient } from '../../utils/apiClient';
import { NEST_FULL_ROSTER_72 } from '../../../server/persistence/nestRosterSeed';
import RoleProfileModal from './RoleProfileModal';
import AgentRetentionHub from './AgentRetentionHub';

class ApiResponseError extends Error {
  status: number;
  code: string;
  diagnosticPreview?: string;

  constructor(options: { status: number; code: string; message: string; diagnosticPreview?: string }) {
    super(options.message);
    this.name = 'ApiResponseError';
    this.status = options.status;
    this.code = options.code;
    this.diagnosticPreview = options.diagnosticPreview;
  }
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const body = await response.text();

    throw new ApiResponseError({
      status: response.status,
      code: "unexpected_response_type",
      message: "The Directory service returned an unexpected response.",
      diagnosticPreview: body.slice(0, 200)
    });
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new ApiResponseError({
      status: response.status,
      code: payload.error ?? "request_failed",
      message: payload.message ?? "The Directory could not be loaded."
    });
  }

  return payload as T;
}

interface DirectoryPerson {
  id: string;
  workspaceId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  displayName: string;
  title?: string;
  role?: string;
  team?: string;
  personType: 'leadership' | 'staff' | 'agent' | 'assistant' | 'contractor' | 'other';
  officeIds: string[];
  officeNames: string[];
  primaryOfficeId?: string;
  primaryOfficeName?: string;
  email?: string;
  alternateEmail?: string;
  phone?: string;
  alternatePhone?: string;
  photoUrl?: string;
  profileUrl?: string;
  schedulingUrl?: string;
  status: 'active' | 'inactive' | 'unknown' | 'needs_review';
  isBrokerInCharge?: boolean;
  isTeamLeader?: boolean;
  rawRole?: string;
  sourceParserVersion?: string;
  communicationPreference?: string;
  tags: string[];
  source: 'google_sheet' | 'manual' | 'google_workspace' | 'nest_rechat_roster';
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
  notes?: string;
}

interface SyncPreview {
  summary: {
    totalRowsFound: number;
    validRecords: number;
    newCount: number;
    updatedCount: number;
    unchangedCount: number;
    duplicateCount: number;
    invalidCount: number;
    missingCount: number;
  };
  newPeople: DirectoryPerson[];
  updatedPeople: { existing: DirectoryPerson; proposed: DirectoryPerson }[];
  unchangedPeople: DirectoryPerson[];
  duplicates: any[];
  invalid: any[];
  missingPeople: DirectoryPerson[];
}

interface WorkspaceDirectoryPageProps {
  state: {
    workspaceId?: string;
    activeProfile?: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    setCurrentTab: (tab: string) => void;
  };
}

export default function WorkspaceDirectoryPage({ state }: WorkspaceDirectoryPageProps) {
  const workspaceId = state.workspaceId || 'nest-realty-demo';
  const currentUser = state.activeProfile;

  // Permissions based on user role/email
  const canSync = useMemo(() => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toLowerCase().trim();
    const email = (currentUser.email || '').toLowerCase().trim();
    if (role === 'admin' || role === 'operations_lead' || email === 'admin@shapework.co' || email === 'matt@shapework.co' || email === 'adam@shapework.co') {
      return true;
    }
    const wsId = (state.workspaceId || '').toLowerCase().trim();
    const isWilmington = wsId === 'nest-realty-demo' || wsId === 'nest-realty-wilmington' || wsId === 'active-brokerage';
    if (isWilmington && email === 'ryan@nestrealty.com') {
      return true;
    }
    return false;
  }, [currentUser, state.workspaceId]);

  const canManage = useMemo(() => {
    if (!currentUser) return true; // Default to admin access in demo console
    const role = (currentUser.role || '').toLowerCase().trim();
    const email = (currentUser.email || '').toLowerCase().trim();
    const adminEmails = [
      'matt@shapework.co',
      'adam@shapework.co',
      'marcus@shapework.co',
      'ryan@nestrealty.com',
      'admin@shapework.co'
    ];
    if (adminEmails.includes(email) || role === 'admin' || role === 'owner' || role === 'operations_lead' || role === 'regional_leader') {
      return true;
    }
    const wsId = (state.workspaceId || '').toLowerCase().trim();
    const isWilmington = wsId === 'nest-realty-demo' || wsId === 'nest-realty-wilmington' || wsId === 'active-brokerage';
    if (isWilmington && email === 'ryan@nestrealty.com') {
      return true;
    }
    return false;
  }, [currentUser, state.workspaceId]);

  // Component States
  const [people, setPeople] = useState<DirectoryPerson[]>([]);
  const [rosterSource, setRosterSource] = useState<'live' | 'demo' | 'error' | 'empty'>('empty');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiResponseError | null>(null);
  
  // View Preferences
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('directory_view_mode') as 'grid' | 'list') || 'grid';
  });
  const [directoryMode, setDirectoryMode] = useState<'roster' | 'retention'>('roster');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOffice, setFilterOffice] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterBic, setFilterBic] = useState('all');
  const [filterInfo, setFilterInfo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [sortBy, setSortBy] = useState('name_az');

  // Detail Drawer State
  const [selectedPerson, setSelectedPerson] = useState<DirectoryPerson | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sync Preview Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncPreview, setSyncPreview] = useState<SyncPreview | null>(null);
  const [loadingSyncPreview, setLoadingSyncPreview] = useState(false);
  const [selectedMissingIds, setSelectedMissingIds] = useState<Set<string>>(new Set());
  const [isApplyingSync, setIsApplyingSync] = useState(false);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Import Wizard State
  const [importStep, setImportStep] = useState(1);
  const [importSource, setImportSource] = useState<'google_sheets' | 'csv' | 'paste' | null>(null);
  const [importUrl, setImportUrl] = useState('');
  const [importFileContent, setImportFileContent] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importPasteText, setImportPasteText] = useState('');
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importColumnMappings, setImportColumnMappings] = useState<any>({});
  const [importPreviewData, setImportPreviewData] = useState<SyncPreview | null>(null);
  const [importApplying, setImportApplying] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; updated: number; archived: number; receiptId?: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [detectedNestSignature, setDetectedNestSignature] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formPersonId, setFormPersonId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    preferredName: '',
    title: '',
    role: '',
    team: '',
    primaryOfficeName: 'Mayfaire',
    additionalOffices: '',
    personType: 'agent' as DirectoryPerson['personType'],
    email: '',
    alternateEmail: '',
    phone: '',
    alternatePhone: '',
    photoUrl: '',
    profileUrl: '',
    schedulingUrl: '',
    status: 'active' as DirectoryPerson['status'],
    isBrokerInCharge: false,
    licenseNumber: '',
    anniversary: '',
    startDate: '',
    address: '',
    cityStateZip: '',
    tags: '',
    notes: ''
  });

  const [isDisplayNameManuallyEdited, setIsDisplayNameManuallyEdited] = useState(false);
  const [possibleDuplicatePerson, setPossibleDuplicatePerson] = useState<DirectoryPerson | null>(null);
  const [isDuplicateWarningOpen, setIsDuplicateWarningOpen] = useState(false);
  const [bypassDuplicateCheck, setBypassDuplicateCheck] = useState(false);

  useEffect(() => {
    if (!isDisplayNameManuallyEdited && !isEditing) {
      setFormValues(prev => ({
        ...prev,
        displayName: `${prev.firstName} ${prev.lastName}`.trim()
      }));
    }
  }, [formValues.firstName, formValues.lastName, isDisplayNameManuallyEdited, isEditing]);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Import Wizard Control Flows
  const handleLoadHeaders = async () => {
    setImportError(null);
    setLoadingSyncPreview(true);
    try {
      let body: any = { headersOnly: true };
      if (importSource === 'google_sheets') {
        if (!importUrl || !importUrl.includes('docs.google.com/spreadsheets')) {
          throw new Error('Please enter a valid Google Sheets URL (docs.google.com/spreadsheets).');
        }
        body.type = 'google_sheets';
        body.url = importUrl.trim();
      } else if (importSource === 'csv') {
        if (!importFileContent) {
          throw new Error('Please select or upload a valid CSV roster file.');
        }
        body.type = 'csv';
        body.fileContent = importFileContent;
        body.fileName = importFileName;
      } else if (importSource === 'paste') {
        if (!importPasteText.trim()) {
          throw new Error('Please paste your roster table data first.');
        }
        body.type = 'paste';
        body.pasteText = importPasteText;
      } else {
        throw new Error('Invalid import source.');
      }

      const res = await fetch(`/api/directory/sync/preview?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId 
        },
        body: JSON.stringify(body)
      });

      const data = await readJsonResponse<{
        headers: string[];
        isNestSignature?: boolean;
        defaultMapping?: any;
      }>(res);

      setImportHeaders(data.headers || []);
      setDetectedNestSignature(Boolean(data.isNestSignature));
      if (data.defaultMapping) {
        setImportColumnMappings(data.defaultMapping);
      }
      setImportStep(2);
    } catch (err: any) {
      setImportError(err.message || 'Failed to process roster headers.');
    } finally {
      setLoadingSyncPreview(false);
    }
  };

  const handleCreatePreview = async () => {
    setImportError(null);
    setLoadingSyncPreview(true);
    try {
      let body: any = {
        headersOnly: false,
        columnMappings: importColumnMappings
      };

      const res = await fetch('/api/directory/import-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setImportPreviewData(data);
      
      const missingIds = new Set<string>();
      if (data.missingPeople) {
        data.missingPeople.forEach((p: any) => missingIds.add(p.id));
      }
      setSelectedMissingIds(missingIds);
      setImportStep(4);
    } catch (err: any) {
      setImportError(err.message || 'Error creating preview.');
    } finally {
      setLoadingSyncPreview(false);
    }
  };

  const handleApplyImport = async () => {
    setImportError(null);
    setImportApplying(true);
    try {
      let body: any = { 
        columnMappings: importColumnMappings,
        deactivateIds: Array.from(selectedMissingIds)
      };
      if (importSource === 'google_sheets') {
        body.type = 'google_sheets';
        body.url = importUrl.trim();
      } else if (importSource === 'csv') {
        body.type = 'csv';
        body.fileContent = importFileContent;
      } else if (importSource === 'paste') {
        body.type = 'paste';
        body.pastedText = importPasteText;
      }

      const res = await fetch(`/api/directory/sync/apply?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 
          'x-workspace-id': workspaceId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        let parsedErr;
        try { parsedErr = JSON.parse(errText); } catch {}
        throw new Error(parsedErr?.error || parsedErr?.message || errText || 'Failed to apply import.');
      }

      const data = await res.json();
      setImportResult({
        added: data.summary?.added || 0,
        updated: data.summary?.updated || 0,
        archived: data.summary?.archived || 0,
        receiptId: data.receiptId
      });
      setNotification({ message: 'Roster imported successfully!', type: 'success' });
      loadPeople();
      setImportStep(5);
    } catch (err: any) {
      setImportError(err.message || 'Error applying changes.');
    } finally {
      setImportApplying(false);
    }
  };

  const handleCloseImportWizard = () => {
    setIsImportWizardOpen(false);
    setImportStep(1);
    setImportSource(null);
    setImportUrl('');
    setImportFileContent('');
    setImportFileName('');
    setImportPasteText('');
    setImportHeaders([]);
    setImportColumnMappings({});
    setImportPreviewData(null);
    setImportResult(null);
    setImportError(null);
    setDetectedNestSignature(false);
  };

  const handleUsePositionalNestImport = async () => {
    setImportColumnMappings('nest_rechat_roster_v1');
    setImportError(null);
    setLoadingSyncPreview(true);
    try {
      let body: any = { 
        columnMapping: 'nest_rechat_roster_v1'
      };
      if (importSource === 'google_sheets') {
        body.type = 'google_sheets';
        body.url = importUrl.trim();
      } else if (importSource === 'csv') {
        body.type = 'csv';
        body.fileContent = importFileContent;
      } else if (importSource === 'paste') {
        body.type = 'paste';
        body.pastedText = importPasteText;
      }

      const res = await fetch(`/api/directory/sync/preview?workspaceId=${workspaceId}`, {
        method: 'POST',
        headers: { 
          'x-workspace-id': workspaceId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        let parsedErr;
        try { parsedErr = JSON.parse(errText); } catch {}
        throw new Error(parsedErr?.error || parsedErr?.message || errText || 'Failed to generate preview.');
      }

      const data = await res.json();
      setImportPreviewData(data);
      
      const missingIds = new Set<string>();
      if (data.missingPeople) {
        data.missingPeople.forEach((p: any) => missingIds.add(p.id));
      }
      setSelectedMissingIds(missingIds);
      setImportStep(4);
    } catch (err: any) {
      setImportError(err.message || 'Error creating preview.');
    } finally {
      setLoadingSyncPreview(false);
    }
  };

  // Load People — always send session cookie + Bearer via apiClient (never silent fake 74 in prod)
  const loadPeople = async () => {
    try {
      const res = await apiClient.get(
        `/api/directory?workspaceId=${encodeURIComponent(workspaceId)}`,
        { workspaceId },
      );
      const data = await readJsonResponse<{ directoryPeople: DirectoryPerson[] }>(res);
      if (data && data.directoryPeople && data.directoryPeople.length > 0) {
        setPeople(data.directoryPeople);
        setRosterSource('live');
        setError(null);
      } else {
        const plan = planDirectoryLoadFailure({ status: 200, message: 'Directory returned an empty roster.' });
        if (plan.action === 'use_demo') {
          setPeople(NEST_FULL_ROSTER_72 as any);
          setRosterSource('demo');
          setError(null);
        } else {
          setPeople([]);
          setRosterSource('empty');
          setError(plan.showError ? plan.message : null);
        }
      }
    } catch (err: any) {
      const status = typeof err?.status === 'number' ? err.status : 0;
      const plan = planDirectoryLoadFailure({
        status,
        message: err?.message,
      });
      console.warn('[Directory] load failed:', status, err?.message || err);
      if (plan.action === 'use_demo') {
        setPeople(NEST_FULL_ROSTER_72 as any);
        setRosterSource('demo');
        setError(null);
      } else {
        // Keep last-known if any; otherwise honest empty. Never invent hardcoded 74.
        setPeople((prev) => prev);
        setRosterSource('error');
        setError(plan.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeople();
  }, [workspaceId]);

  useEffect(() => {
    const handleOpenImport = () => setIsImportWizardOpen(true);
    const handleOpenAddPerson = () => handleOpenAdd();

    window.addEventListener('open-import-directory', handleOpenImport);
    window.addEventListener('open-add-person', handleOpenAddPerson);

    return () => {
      window.removeEventListener('open-import-directory', handleOpenImport);
      window.removeEventListener('open-add-person', handleOpenAddPerson);
    };
  }, []);


  // Publish live banner counts to TopBar directory chrome (kills hardcoded 74)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const banner = aggregateDirectoryBannerCounts(people);
    window.dispatchEvent(
      new CustomEvent(DIRECTORY_BANNER_COUNTS_EVENT, {
        detail: {
          ...banner,
          source: rosterSource,
          errorMessage: error,
        },
      }),
    );
  }, [people, rosterSource, error]);

  // Persist View Mode
  useEffect(() => {
    localStorage.setItem('directory_view_mode', viewMode);
  }, [viewMode]);

  // Clear notification helper
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Check Org Chart position mapping
  const occupiedPosition = useMemo(() => {
    if (!selectedPerson) return null;
    try {
      const orgModel = orgChartService.getOrgChart(workspaceId);
      if (orgModel && orgModel.positions) {
        return orgModel.positions.find(pos => 
          (pos.email && pos.email.toLowerCase() === selectedPerson.email?.toLowerCase()) || 
          (pos.name && pos.name.toLowerCase() === selectedPerson.displayName.toLowerCase())
        );
      }
    } catch (e) {
      console.error('Failed to query org chart model', e);
    }
    return null;
  }, [selectedPerson, workspaceId]);

  // Filtered & Sorted People list
  const processedPeople = useMemo(() => {
    let result = [...people];

    // Filter Status
    if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.displayName.toLowerCase().includes(query) ||
        (p.title && p.title.toLowerCase().includes(query)) ||
        (p.email && p.email.toLowerCase().includes(query)) ||
        (p.phone && p.phone.toLowerCase().includes(query)) ||
        p.officeNames.some(o => o.toLowerCase().includes(query)) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // Filter Office (Wilmington → Mayfaire)
    if (filterOffice !== 'all') {
      result = result.filter(p => matchesOfficeFilter(p, filterOffice));
    }

    // Filter Type (Assistants → Staff; BIC supported as a type)
    if (filterType !== 'all') {
      result = result.filter(p => matchesTypeFilter(p, filterType));
    }

    // Filter Broker-in-Charge
    if (filterBic !== 'all') {
      const wantBic = filterBic === 'yes';
      result = result.filter(p => isBicPerson(p) === wantBic);
    }

    // Filter Contact completeness
    if (filterInfo !== 'all') {
      if (filterInfo === 'complete') {
        result = result.filter(p => p.email && p.phone);
      } else if (filterInfo === 'incomplete') {
        result = result.filter(p => !p.email || !p.phone);
      }
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name_az') {
        return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
      }
      if (sortBy === 'name_za') {
        return b.lastName.localeCompare(a.lastName) || b.firstName.localeCompare(a.firstName);
      }
      if (sortBy === 'office') {
        return (a.primaryOfficeName || '').localeCompare(b.primaryOfficeName || '');
      }
      if (sortBy === 'role') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'recently_updated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return 0;
    });

    return result;
  }, [people, searchQuery, filterOffice, filterType, filterBic, filterInfo, filterStatus, sortBy]);

  // Statistics Computations (Wave 1: derived from roster, Wilmington→Mayfaire, assistants→staff)
  const stats = useMemo(() => {
    const total = people.length;
    const active = people.filter(p => p.status === 'active' || !p.status).length;
    const needsReview = people.filter(p => p.status === 'needs_review').length;
    const inactive = people.filter(p => p.status === 'inactive').length;
    const banner = aggregateDirectoryBannerCounts(people);
    return {
      total,
      active: banner.totalActive,
      needsReview,
      inactive,
      wilmington: banner.mayfaireAgents,
      mayfaire: banner.mayfaireAgents,
      cb: banner.carolinaBeachAgents,
      bics: banner.bic,
      staff: banner.staff,
      leadership: banner.leadership,
      agents: banner.mayfaireAgents + banner.carolinaBeachAgents,
    };
  }, [people]);



  const renderCompletenessBadges = (person: DirectoryPerson) => {
    const badges = [];
    if (person.status === 'needs_review') {
      badges.push(
        <span key="needs_review" className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" />
          NEEDS REVIEW
        </span>
      );
    }
    if (!person.email) {
      badges.push(
        <span key="no_email" className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 text-red-300 border border-red-500/20">
          MISSING EMAIL
        </span>
      );
    }
    {
      const phoneInfo = sanitizeDirectoryPhone(person.phone);
      if (!phoneInfo.phone) {
        badges.push(
          <span key="no_phone" className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 text-red-300 border border-red-500/20">
            {phoneInfo.needsReview ? 'NEEDS REVIEW' : 'MISSING PHONE'}
          </span>
        );
      }
    }
    if (person.primaryOfficeName === 'Unknown') {
      badges.push(
        <span key="no_office" className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 text-red-300 border border-red-500/20">
          MISSING OFFICE
        </span>
      );
    }
    if (person.tags?.includes('role-needs-review')) {
      badges.push(
        <span key="no_role" className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 text-red-300 border border-red-500/20">
          MISSING ROLE
        </span>
      );
    }
    if (person.tags?.includes('source-marked-x')) {
      badges.push(
        <span key="marked_x" className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 text-red-300 border border-red-500/20">
          MARKED X
        </span>
      );
    }
    return badges;
  };

  // Open Form for Adding
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormPersonId(null);
    setIsDisplayNameManuallyEdited(false);
    setBypassDuplicateCheck(false);
    setPossibleDuplicatePerson(null);
    setFormValues({
      firstName: '',
      lastName: '',
      displayName: '',
      preferredName: '',
      title: '',
      role: '',
      team: '',
      primaryOfficeName: 'Mayfaire',
      additionalOffices: '',
      personType: 'agent',
      email: '',
      alternateEmail: '',
      phone: '',
      alternatePhone: '',
      photoUrl: '',
      profileUrl: '',
      schedulingUrl: '',
      status: 'active',
      isBrokerInCharge: false,
      licenseNumber: '',
      anniversary: '',
      startDate: '',
      address: '',
      cityStateZip: '',
      tags: '',
      notes: ''
    });
    setIsFormModalOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (person: DirectoryPerson) => {
    setIsEditing(true);
    setFormPersonId(person.id);
    setIsDisplayNameManuallyEdited(true);
    setBypassDuplicateCheck(false);
    setPossibleDuplicatePerson(null);
    
    const license = person.tags?.find(t => t.startsWith('license:'))?.replace('license:', '') || '';
    const anniversary = person.tags?.find(t => t.startsWith('anniversary:'))?.replace('anniversary:', '') || '';
    const startDate = person.tags?.find(t => t.startsWith('start_date:'))?.replace('start_date:', '') || '';
    const address = person.tags?.find(t => t.startsWith('address:'))?.replace('address:', '') || '';
    const cityStateZip = person.tags?.find(t => t.startsWith('city_state_zip:'))?.replace('city_state_zip:', '') || '';
    const extraTags = person.tags ? person.tags.filter(t => 
      !t.startsWith('license:') && 
      !t.startsWith('anniversary:') && 
      !t.startsWith('start_date:') && 
      !t.startsWith('address:') && 
      !t.startsWith('city_state_zip:')
    ).join(', ') : '';

    setFormValues({
      firstName: person.firstName,
      lastName: person.lastName,
      displayName: person.displayName,
      preferredName: person.preferredName || '',
      title: person.title || '',
      role: person.role || '',
      team: person.team || '',
      primaryOfficeName: normalizeOfficeLabel(person.primaryOfficeName) || 'Mayfaire',
      additionalOffices: person.officeNames ? person.officeNames.filter(o => o !== person.primaryOfficeName).join(', ') : '',
      personType: person.personType,
      email: person.email || '',
      alternateEmail: person.alternateEmail || '',
      phone: person.phone || '',
      alternatePhone: person.alternatePhone || '',
      photoUrl: person.photoUrl || '',
      profileUrl: person.profileUrl || '',
      schedulingUrl: person.schedulingUrl || '',
      status: person.status,
      isBrokerInCharge: !!person.isBrokerInCharge,
      licenseNumber: license,
      anniversary,
      startDate,
      address,
      cityStateZip,
      tags: extraTags,
      notes: person.notes || ''
    });
    setIsFormModalOpen(true);
  };

  // Form Submit (Create / Update)
  const handleFormSubmit = async (e: React.FormEvent, isBypassing = false) => {
    if (e) e.preventDefault();
    
    if (!formValues.firstName || !formValues.lastName) {
      setNotification({ message: 'First and Last name are required.', type: 'error' });
      return;
    }

    // 1. Duplicate check (unless bypassed)
    const activeBypass = isBypassing || bypassDuplicateCheck;
    if (!activeBypass) {
      const normEmail = formValues.email.trim().toLowerCase();
      const normPhone = formValues.phone.replace(/\D/g, '');
      const normName = `${formValues.firstName} ${formValues.lastName}`.trim().toLowerCase();
      const normOffice = formValues.primaryOfficeName;
      const normDispName = formValues.displayName.trim().toLowerCase();

      const duplicate = people.find(p => {
        if (isEditing && p.id === formPersonId) return false;
        
        const pEmail = p.email?.trim().toLowerCase();
        const pPhone = p.phone?.replace(/\D/g, '') || '';
        const pName = `${p.firstName} ${p.lastName}`.trim().toLowerCase();
        const pDispName = p.displayName?.trim().toLowerCase() || '';
        
        if (normEmail && pEmail === normEmail) return true;
        if (normPhone && pPhone === normPhone) return true;
        if (normName === pName && p.primaryOfficeName === normOffice) return true;
        if (normDispName && pDispName === normDispName) return true;
        return false;
      });

      if (duplicate) {
        setPossibleDuplicatePerson(duplicate);
        setIsDuplicateWarningOpen(true);
        return;
      }
    }

    // 2. Build payload with all fields
    const officeNames = [formValues.primaryOfficeName];
    if (formValues.additionalOffices) {
      formValues.additionalOffices.split(',').forEach(o => {
        const cleaned = o.trim();
        if (cleaned && !officeNames.includes(cleaned)) {
          officeNames.push(cleaned);
        }
      });
    }

    const payload: any = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      displayName: formValues.displayName.trim() || `${formValues.firstName} ${formValues.lastName}`.trim(),
      preferredName: formValues.preferredName.trim() || null,
      title: formValues.title.trim() || null,
      role: formValues.role.trim() || null,
      team: formValues.team.trim() || null,
      personType: formValues.personType,
      primaryOfficeName: formValues.primaryOfficeName,
      officeNames,
      email: formValues.email.trim() || null,
      alternateEmail: formValues.alternateEmail.trim() || null,
      phone: formValues.phone.trim() || null,
      alternatePhone: formValues.alternatePhone.trim() || null,
      photoUrl: formValues.photoUrl.trim() || null,
      profileUrl: formValues.profileUrl.trim() || null,
      schedulingUrl: formValues.schedulingUrl.trim() || null,
      status: formValues.status,
      isBrokerInCharge: formValues.isBrokerInCharge,
      notes: formValues.notes.trim() || null,
      tags: [] as string[]
    };

    // Construct tags
    if (formValues.tags) {
      formValues.tags.split(',').forEach(t => {
        const cleaned = t.trim();
        if (cleaned) payload.tags.push(cleaned);
      });
    }
    if (formValues.licenseNumber) payload.tags.push(`license:${formValues.licenseNumber.trim()}`);
    if (formValues.anniversary) payload.tags.push(`anniversary:${formValues.anniversary.trim()}`);
    if (formValues.startDate) payload.tags.push(`start_date:${formValues.startDate.trim()}`);
    if (formValues.address) payload.tags.push(`address:${formValues.address.trim()}`);
    if (formValues.cityStateZip) payload.tags.push(`city_state_zip:${formValues.cityStateZip.trim()}`);

    try {
      let res;
      if (isEditing && formPersonId) {
        res = await apiClient.put(
          `/api/directory/people/${formPersonId}?workspaceId=${encodeURIComponent(workspaceId)}`,
          payload,
          { workspaceId },
        );
      } else {
        res = await apiClient.post(
          `/api/directory/people?workspaceId=${encodeURIComponent(workspaceId)}`,
          payload,
          { workspaceId },
        );
      }

      const data = await readJsonResponse<any>(res);
      setNotification({ 
        message: isEditing ? 'Contact updated successfully!' : 'Contact added successfully!', 
        type: 'success' 
      });
      setIsFormModalOpen(false);
      setIsDuplicateWarningOpen(false);
      setBypassDuplicateCheck(false);
      setPossibleDuplicatePerson(null);
      
      const savedPerson: DirectoryPerson = data?.person || {
        id: formPersonId || `usr_${Date.now()}`,
        workspaceId,
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setPeople(prev => {
        const exists = prev.some(p => p.id === savedPerson.id);
        if (exists) {
          return prev.map(p => p.id === savedPerson.id ? { ...p, ...savedPerson } : p);
        }
        return [...prev, savedPerson];
      });

      setSelectedPerson(savedPerson);
      
      invalidateWorkspaceDirectoryCache(workspaceId);
      window.dispatchEvent(new CustomEvent('shapework_directory_mutated', { detail: { workspaceId, person: savedPerson } }));
      loadPeople();
    } catch (err: any) {
      setNotification({ message: err.message || 'Error saving contact information.', type: 'error' });
    }
  };

  // Archive Person
  const handleDeletePerson = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate/archive this person? They will be marked as inactive.')) {
      return;
    }
    try {
      const res = await apiClient.delete(
        `/api/directory/people/${id}?workspaceId=${encodeURIComponent(workspaceId)}`,
        { workspaceId },
      );
      await readJsonResponse<any>(res);
      setNotification({ message: 'Person deactivated successfully.', type: 'success' });
      setIsDrawerOpen(false);
      setSelectedPerson(null);
      setPeople(prev => prev.map(p => p.id === id ? { ...p, status: 'inactive' } : p));
      invalidateWorkspaceDirectoryCache(workspaceId);
      window.dispatchEvent(new CustomEvent('shapework_directory_mutated', { detail: { workspaceId, id } }));
      loadPeople();
    } catch (err: any) {
      setNotification({ message: err.message || 'Error deactivating person.', type: 'error' });
    }
  };

  // Helper for Person Initials
  const getInitials = (person: DirectoryPerson) => {
    return `${person.firstName[0] || ''}${person.lastName[0] || ''}`.toUpperCase();
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setNotification({ message: `${label} copied to clipboard!`, type: 'success' });
  };

  return (
    <div className="space-y-6 text-left animate-fade-in relative min-h-screen p-6 bg-[var(--sw-canvas)] text-[var(--sw-text-primary)]">
      <style>{`
        .directory-panel {
          background-color: #ffffff;
          border: 1px solid rgba(228, 228, 231, 0.8) !important;
          color: #18181b !important;
        }
        .directory-text-primary {
          color: #18181b !important;
        }
        .directory-text-secondary {
          color: #71717a !important;
        }
        .directory-placeholder::placeholder {
          color: #a1a1aa !important;
        }
        .directory-border {
          border-color: rgba(228, 228, 231, 0.8) !important;
        }
        .directory-input {
          background-color: #ffffff !important;
          border: 1px solid rgba(228, 228, 231, 0.8) !important;
          color: #18181b !important;
        }
        .directory-control-active {
          background-color: #00635C !important;
          color: #ffffff !important;
        }
        .directory-btn-disabled {
          color: #a1a1aa !important;
        }
        
        /* Modal Overrides */
        .modal-dark-overlay {
          background-color: rgba(0, 0, 0, 0.4) !important;
          backdrop-filter: blur(4px);
        }
        .modal-dark-content {
          background-color: #ffffff !important;
          border: 1px solid #e4e4e7 !important;
          color: #18181b !important;
        }
        .modal-dark-header {
          border-bottom: 1px solid #f4f4f5 !important;
          background-color: #ffffff !important;
        }
        .modal-dark-footer {
          border-top: 1px solid #f4f4f5 !important;
          background-color: #fafafa !important;
        }
      `}</style>
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border text-sm transition-all duration-300 transform translate-y-0 ${
          notification.type === 'success' 
            ? 'bg-[#00635C] border-emerald-600/30 text-white' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <XCircle className="w-4 h-4 text-red-500" />}
          <span>{notification.message}</span>
        </div>
      )}



      {/* Directory vs Retention Toggle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div>
          <h1 className="text-xl font-serif font-bold text-stone-900">People, Directory & Retention</h1>
          <p className="text-xs text-stone-500">Manage all {stats.active} people, leadership roles, and retention signals.</p>
        </div>
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs self-start sm:self-auto">
          <button
            onClick={() => setDirectoryMode('roster')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              directoryMode === 'roster' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Agent Directory ({stats.total})
          </button>
          <button
            onClick={() => setDirectoryMode('retention')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              directoryMode === 'retention' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Retention, Care & Videos
          </button>
        </div>
      </div>

      {directoryMode === 'retention' ? (
        <AgentRetentionHub />
      ) : (
        <>
          {/* Toolbar & Filter Options */}
          <div className="directory-panel rounded-[18px] p-4 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex border-b border-white/10 pb-1.5 overflow-x-auto gap-6 text-xs">
          {[
            { value: 'active', label: 'Active', count: stats.active, color: 'text-[#00635C] border-[#00635C]' },
            { value: 'needs_review', label: 'Needs Review', count: stats.needsReview, color: 'text-amber-700 border-amber-600' },
            { value: 'inactive', label: 'Inactive / Archived', count: stats.inactive, color: 'text-rose-700 border-rose-600' },
            { value: 'all', label: 'All Contacts', count: stats.total, color: 'text-[var(--sw-text-primary)] border-[var(--sw-text-primary)]' }
          ].map(tab => {
            const isActive = filterStatus === tab.value;
            return (
              <button
                key={tab.value}
                id={`status-tab-${tab.value}`}
                onClick={() => setFilterStatus(tab.value)}
                className={`pb-2 font-bold transition-all relative border-b-2 ${isActive ? `${tab.color} opacity-100` : 'border-transparent text-[var(--sw-text-secondary)] hover:text-[var(--sw-text-primary)] opacity-90'}`}
              >
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-emerald-50 border border-emerald-200' : 'bg-stone-100 border border-stone-200'}`}>
                    {tab.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 directory-text-secondary" />
            <input 
              type="text" 
              placeholder="Search by name, title, email, phone, office, or tags..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 directory-input rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 directory-placeholder"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex directory-border border rounded-xl overflow-hidden p-0.5 bg-black/25">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#00635C] text-white shadow-sm' : 'directory-text-secondary hover:text-white'}`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#00635C] text-white shadow-sm' : 'directory-text-secondary hover:text-white'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort selection */}
            <div className="relative flex items-center border directory-border rounded-xl bg-black/25 px-3 py-1.5 text-sm font-medium directory-text-primary">
              <ArrowUpDown className="w-4 h-4 directory-text-secondary mr-2" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent focus:outline-none pr-4 text-xs font-semibold cursor-pointer directory-text-primary"
              >
                <option value="name_az" className="bg-[#012a23]">Name A-Z</option>
                <option value="name_za" className="bg-[#012a23]">Name Z-A</option>
                <option value="office" className="bg-[#012a23]">Office Location</option>
                <option value="role" className="bg-[#012a23]">Role / Title</option>
                <option value="recently_updated" className="bg-[#012a23]">Recently Updated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Detailed Filters Expandable */}
        <div className="border-t directory-border pt-3 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="directory-text-secondary font-medium">Office:</span>
            <select 
              value={filterOffice} 
              onChange={(e) => setFilterOffice(e.target.value)}
              className="directory-input rounded-lg px-2 py-1 font-semibold focus:outline-none"
            >
              <option value="all" className="bg-[#012a23]">All Offices</option>
              {getDirectoryOfficeFilterOptions().map(office => (
                <option key={office} value={office} className="bg-[#012a23]">{office}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="directory-text-secondary font-medium">Type:</span>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="directory-input rounded-lg px-2 py-1 font-semibold focus:outline-none"
            >
              <option value="all" className="bg-[#012a23]">All Types</option>
              {getDirectoryTypeFilterOptions().map(t => (
                <option key={t} value={t} className="bg-[#012a23]">{typeFilterLabel(t)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="directory-text-secondary font-medium">BIC:</span>
            <select 
              value={filterBic} 
              onChange={(e) => setFilterBic(e.target.value)}
              className="directory-input rounded-lg px-2 py-1 font-semibold focus:outline-none"
            >
              <option value="all" className="bg-[#012a23]">All</option>
              <option value="yes" className="bg-[#012a23]">Broker-in-Charge</option>
              <option value="no" className="bg-[#012a23]">Not Broker-in-Charge</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="directory-text-secondary font-medium">Contact:</span>
            <select 
              value={filterInfo} 
              onChange={(e) => setFilterInfo(e.target.value)}
              className="directory-input rounded-lg px-2 py-1 font-semibold focus:outline-none"
            >
              <option value="all" className="bg-[#012a23]">All Records</option>
              <option value="complete" className="bg-[#012a23]">Complete (Email & Phone)</option>
              <option value="incomplete" className="bg-[#012a23]">Incomplete / Missing Info</option>
            </select>
          </div>

          {(filterOffice !== 'all' || filterType !== 'all' || filterBic !== 'all' || filterInfo !== 'all' || searchQuery !== '') && (
            <button 
              onClick={() => {
                setFilterOffice('all');
                setFilterType('all');
                setFilterBic('all');
                setFilterInfo('all');
                setSearchQuery('');
              }}
              className="text-[#D0D6BB] hover:text-white font-semibold ml-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 directory-panel rounded-[18px] shadow-sm">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <span className="text-sm font-medium text-[#D0D6BB] mt-4">Loading directory information...</span>
        </div>
      ) : error ? (
        <div className="directory-panel rounded-[18px] p-8 text-center max-w-xl mx-auto my-10 shadow-xs">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="text-base font-bold directory-text-primary mt-4">Directory unavailable</h3>
          <p className="text-xs directory-text-secondary mt-1.5">
            We could not load the directory records.
          </p>
          
          <button 
            onClick={loadPeople}
            disabled={loading}
            className="mt-5 px-5 py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Retrying...' : 'Try Again'}
          </button>

          {error && currentUser?.role === 'admin' && (
            <div className="mt-6 border-t directory-border pt-4 text-left">
              <details className="cursor-pointer group">
                <summary className="text-[11px] font-bold directory-text-secondary hover:directory-text-primary select-none outline-none">
                  View technical details
                </summary>
                <div className="mt-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-mono text-red-300 space-y-1 overflow-x-auto">
                  <div><strong>Status:</strong> {error.status || 500}</div>
                  <div><strong>Code:</strong> {error.code || 'UNKNOWN_ERROR'}</div>
                  <div><strong>Message:</strong> {error.message}</div>
                  {error.diagnosticPreview && (
                    <div>
                      <strong>Diagnostic Preview:</strong>
                      <pre className="mt-1 p-1.5 bg-black/35 border border-red-500/20 rounded text-[9px] whitespace-pre-wrap max-h-24 overflow-y-auto text-red-300">
                        {error.diagnosticPreview}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      ) : processedPeople.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 directory-panel rounded-[18px] shadow-sm px-6 text-center max-w-2xl mx-auto bg-white border border-stone-200">
          <Building className="w-16 h-16 text-stone-300" />
          {(canSync || canManage) ? (
            <>
              <h3 className="text-lg font-serif font-black uppercase text-stone-900 mt-6">No directory records yet</h3>
              <p className="text-sm text-stone-600 mt-2 max-w-md">
                Add a person manually or import the approved Nest Realty roster.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                {canSync && (
                  <button 
                    onClick={() => setIsImportWizardOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-800 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Upload className="w-4 h-4 text-[#00635C]" />
                    <span>Import Directory</span>
                  </button>
                )}
                {canManage && (
                  <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Person</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-serif font-black uppercase text-stone-900 mt-6">No directory records are available yet</h3>
              <p className="text-sm text-stone-600 mt-2 max-w-md">
                An authorized administrator can import the Nest Realty roster.
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="text-xs font-semibold directory-text-secondary">
            Showing {processedPeople.length} of {people.length} people
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {processedPeople.map((person) => (
                <div 
                  key={person.id}
                  onClick={() => {
                    setSelectedPerson(person);
                    setIsDrawerOpen(true);
                  }}
                  className={`directory-panel rounded-[18px] p-5 shadow-sm hover:shadow-md hover:directory-border transition-all text-left flex flex-col justify-between cursor-pointer relative group ${
                    person.status === 'inactive' ? 'opacity-60 bg-black/40' : ''
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg bg-[#01362D] shadow-sm select-none border border-white/10">
                        {getInitials(person)}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        {renderCompletenessBadges(person)}
                        {person.isBrokerInCharge && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            BIC
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          person.personType === 'leadership' 
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                            : person.personType === 'staff'
                            ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {(normalizePersonType(person.personType) === 'other' ? person.personType : normalizePersonType(person.personType)).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-base directory-text-primary group-hover:text-emerald-300 transition-colors">
                        {person.displayName}
                      </h3>
                      <p className="text-xs directory-text-secondary font-medium mt-0.5 truncate">
                        {displayDirectoryTitle(person.title, { group: person.team, isLeader: !!person.isTeamLeader }) || 'Agent'}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs directory-text-secondary border-t directory-border pt-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 directory-text-secondary shrink-0" />
                        <span className="font-medium directory-text-secondary">{person.primaryOfficeName || 'Nest Realty'}</span>
                      </div>
                      {person.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 directory-text-secondary shrink-0" />
                          <span className="truncate">{person.email}</span>
                        </div>
                      )}
                      {displayDirectoryPhone(person.phone) && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 directory-text-secondary shrink-0" />
                          <span>{displayDirectoryPhone(person.phone)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t directory-border mt-4 pt-3 justify-end directory-text-secondary">
                    {person.email && (
                      <a 
                        href={`mailto:${person.email}`} 
                        onClick={(e) => e.stopPropagation()} 
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors hover:text-white"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {displayDirectoryPhone(person.phone) && (
                      <a 
                        href={`tel:${displayDirectoryPhone(person.phone)}`} 
                        onClick={(e) => e.stopPropagation()} 
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors hover:text-white"
                        title="Call"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {canManage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(person);
                        }}
                        className="p-1.5 hover:bg-emerald-500/20 text-emerald-300 rounded-lg transition-colors border border-emerald-500/30 flex items-center gap-1 text-[11px] font-semibold"
                        title="Edit Employee"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPerson(person);
                        setIsDrawerOpen(true);
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors hover:text-white"
                      title="Open Profile Detail"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="directory-panel rounded-[18px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-black/25 border-b directory-border directory-text-secondary font-semibold text-xs uppercase tracking-wider">
                      <th className="p-4 pl-6">Person</th>
                      <th className="p-4">Office</th>
                      <th className="p-4">Role / Title</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedPeople.map((person) => (
                      <tr 
                        key={person.id}
                        onClick={() => {
                          setSelectedPerson(person);
                          setIsDrawerOpen(true);
                        }}
                        className={`border-b directory-border hover:bg-white/5 transition-colors cursor-pointer directory-text-primary ${
                          person.status === 'inactive' ? 'opacity-60 bg-black/40' : ''
                        }`}
                      >
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs bg-[#01362D] select-none border border-white/10">
                            {getInitials(person)}
                          </div>
                          <div>
                            <div className="font-semibold directory-text-primary">{person.displayName}</div>
                            {(person.isBrokerInCharge || person.role === 'Broker-in-Charge' || (person.title || '').toLowerCase().includes('broker-in-charge') || (person.title || '').toLowerCase().includes('bic')) && (
                              <span className="mt-0.5 inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                Broker-in-Charge
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-medium directory-text-secondary">{person.primaryOfficeName}</td>
                        <td className="p-4 text-xs font-medium directory-text-secondary">{displayDirectoryTitle(person.title, { group: person.team, isLeader: !!person.isTeamLeader }) || 'Agent'}</td>
                        <td className="p-4 font-mono text-xs directory-text-secondary">{person.email || '-'}</td>
                        <td className="p-4 text-xs directory-text-secondary">{displayDirectoryPhone(person.phone) || '-'}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              person.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : person.status === 'needs_review'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'bg-red-500/10 text-red-300 border border-red-500/30'
                            }`}>
                              {person.status.toUpperCase()}
                            </span>
                            {renderCompletenessBadges(person).filter(b => b.key !== 'needs_review')}
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {canManage && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(person);
                                }}
                                className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/30 text-xs font-semibold flex items-center gap-1"
                                title="Edit Employee"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            )}
                            {person.email && (
                              <a 
                                href={`mailto:${person.email}`} 
                                className="p-1 hover:bg-white/10 rounded directory-text-secondary hover:text-white"
                                title="Send Email"
                              >
                                <Mail className="w-4 h-4" />
                              </a>
                            )}
                            {displayDirectoryPhone(person.phone) && (
                              <a 
                                href={`tel:${displayDirectoryPhone(person.phone)}`} 
                                className="p-1 hover:bg-white/10 rounded directory-text-secondary hover:text-white"
                                title="Call"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => {
                                  setSelectedPerson(person);
                                  setIsDrawerOpen(true);
                                }}
                              className="p-1 hover:bg-white/10 rounded directory-text-secondary hover:text-white"
                              title="Details"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      </>
    )}

      {isDrawerOpen && selectedPerson && (
        <RoleProfileModal
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          person={selectedPerson}
          workspaceId={workspaceId}
          currentUserEmail={currentUser?.email}
          onEdit={(personToEdit) => {
            setIsDrawerOpen(false);
            handleOpenEdit(personToEdit as DirectoryPerson);
          }}
        />
      )}

      {/* Import Directory Wizard Modal */}
      {isImportWizardOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 modal-dark-overlay" onClick={() => !importApplying && handleCloseImportWizard()} />
          
          <div className="modal-dark-content rounded-[20px] shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden relative z-10 text-left animate-scale-in text-white border border-white/10">
            {/* Header */}
            <div className="p-6 bg-black/20 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-black uppercase tracking-wider text-white">Import Directory Wizard</h2>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-[#D0D6BB]/75">
                  <span className={importStep === 1 ? 'text-emerald-400 font-bold' : ''}>1. Source</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className={importStep === 2 ? 'text-emerald-400 font-bold' : ''}>2. Configure</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className={importStep === 3 ? 'text-emerald-400 font-bold' : ''}>3. Column Map</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className={importStep === 4 ? 'text-emerald-400 font-bold' : ''}>4. Preview</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className={importStep === 5 ? 'text-emerald-400 font-bold' : ''}>5. Summary</span>
                </div>
              </div>
              <button 
                onClick={handleCloseImportWizard}
                disabled={importApplying}
                className="p-2 hover:bg-white/10 rounded-lg text-[#D0D6BB] hover:text-white disabled:opacity-40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {importError && (
              <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{importError}</span>
              </div>
            )}

            {/* Step Body */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* STEP 1: CHOOSE SOURCE */}
              {importStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-[#D0D6BB] mb-6">Select how you want to import your broker roster database into Mayfaire and Carolina Beach workspaces.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => { setImportSource('google_sheets'); setImportStep(2); }}
                      className="flex flex-col items-center p-6 bg-black/25 hover:bg-white/5 border border-white/10 rounded-2xl text-center group transition-all duration-300"
                    >
                      <Building className="w-10 h-10 text-emerald-400 mb-3 group-hover:scale-105 transition-transform" />
                      <span className="font-semibold text-white">Google Sheets Sync</span>
                      <span className="text-xs text-[#D0D6BB]/75 mt-1">Directly sync from a shared spreadsheet.</span>
                    </button>

                    <button 
                      onClick={() => { setImportSource('csv'); setImportStep(2); }}
                      className="flex flex-col items-center p-6 bg-black/25 hover:bg-white/5 border border-white/10 rounded-2xl text-center group transition-all duration-300"
                    >
                      <Upload className="w-10 h-10 text-blue-400 mb-3 group-hover:scale-105 transition-transform" />
                      <span className="font-semibold text-white">Upload Roster File</span>
                      <span className="text-xs text-[#D0D6BB]/75 mt-1">Upload an exported .csv file.</span>
                    </button>

                    <button 
                      onClick={() => { setImportSource('paste'); setImportStep(2); }}
                      className="flex flex-col items-center p-6 bg-black/25 hover:bg-white/5 border border-white/10 rounded-2xl text-center group transition-all duration-300"
                    >
                      <Copy className="w-10 h-10 text-amber-400 mb-3 group-hover:scale-105 transition-transform" />
                      <span className="font-semibold text-white">Paste Roster Rows</span>
                      <span className="text-xs text-[#D0D6BB]/75 mt-1">Copy-paste rows from Excel or Sheets.</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CONFIGURE SOURCE */}
              {importStep === 2 && (
                <div className="space-y-4">
                  {importSource === 'google_sheets' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-[#D0D6BB] uppercase tracking-wider">Google Sheets URL</label>
                      <input 
                        type="url"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/35 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                      />
                      <span className="block text-[11px] text-[#D0D6BB]/75">Sheet must be shared or accessible to our workspace parser. Only docs.google.com sheet paths are allowed.</span>
                    </div>
                  )}

                  {importSource === 'csv' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-[#D0D6BB] uppercase tracking-wider">Select Roster File (.csv, .txt)</label>
                      <div className="border-2 border-dashed border-white/15 bg-black/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors relative">
                        <input 
                          type="file"
                          accept=".csv,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setImportFileName(file.name);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const text = event.target?.result as string || '';
                                setImportFileContent(text);
                                const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                                if (lines.length > 0 && (lines[0].startsWith('In Rechat') || lines.some(l => l.includes('In Rechat')))) {
                                  setDetectedNestSignature(true);
                                } else {
                                  setDetectedNestSignature(false);
                                }
                              };
                              reader.readAsText(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 text-[#D0D6BB] mb-2" />
                        <span className="text-sm font-medium text-white">
                          {importFileName ? `Selected: ${importFileName}` : 'Drag and drop or click to choose file'}
                        </span>
                        <span className="text-xs text-[#D0D6BB]/60 mt-1">Accepts CSV or tab-separated TXT rosters.</span>
                      </div>
                    </div>
                  )}

                  {importSource === 'paste' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-[#D0D6BB] uppercase tracking-wider">Paste Delimited Roster Rows</label>
                      <textarea 
                        value={importPasteText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setImportPasteText(val);
                          const lines = val.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                          if (lines.length > 0 && (lines[0].startsWith('In Rechat') || lines.some(l => l.includes('In Rechat')))) {
                            setDetectedNestSignature(true);
                          } else {
                            setDetectedNestSignature(false);
                          }
                        }}
                        rows={8}
                        className="w-full px-3 py-2 bg-black/35 border border-white/10 rounded-lg text-sm text-white font-mono placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="First Name	Last Name	Email	Phone	Office&#10;Mary	Hester	mary@nestrealty.com	(910) 555-1234	Mayfaire"
                      />
                      <span className="block text-[11px] text-[#D0D6BB]/75">Accepts tab-separated or comma-separated rows.</span>
                    </div>
                  )}

                  {detectedNestSignature && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/35 rounded-xl space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-sm font-semibold text-amber-300">Nest Realty Roster Signature Detected</h4>
                          <p className="text-xs text-[#D0D6BB] mt-1">This roster has no header row and contains tab-separated records. We can import it safely using deterministic positional mapping.</p>
                        </div>
                      </div>
                      <div className="flex gap-3 pl-8">
                        <button 
                          onClick={handleUsePositionalNestImport}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Use Positional Nest Roster Import
                        </button>
                        <button 
                          onClick={() => setDetectedNestSignature(false)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[#D0D6BB] rounded-lg text-xs font-semibold transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: COLUMN MAPPING */}
              {importStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-[#D0D6BB]">Map core database attributes to the columns identified in your source. We have auto-detected similar headers.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {[
                      { key: 'firstName', label: 'First Name *', desc: 'Given name of the contact' },
                      { key: 'lastName', label: 'Last Name *', desc: 'Surname of the contact' },
                      { key: 'email', label: 'Primary Email', desc: 'Office or login address' },
                      { key: 'phone', label: 'Primary Phone', desc: 'Office or mobile contact' },
                      { key: 'primaryOfficeName', label: 'Primary Office', desc: 'Base brokerage branch' },
                      { key: 'isBrokerInCharge', label: 'Broker-in-Charge Status', desc: 'BIC leadership flag' }
                    ].map(field => (
                      <div key={field.key} className="border border-white/5 bg-white/5 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <label className="block text-sm font-semibold text-white">{field.label}</label>
                          <span className="text-[11px] text-[#D0D6BB]/80 block mt-0.5">{field.desc}</span>
                        </div>
                        <select 
                          value={importColumnMappings[field.key] || ''}
                          onChange={(e) => setImportColumnMappings(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="mt-3 w-full px-3 py-2 bg-black/35 border border-white/10 rounded-lg text-xs text-white bg-[#012a23]"
                        >
                          <option value="">-- Skip / None --</option>
                          {importHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: PREVIEW CHANGES */}
              {importStep === 4 && (
                <div className="space-y-6">
                  {loadingSyncPreview ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                      <span className="text-sm font-semibold text-white mt-4">Generating side-by-side preview...</span>
                    </div>
                  ) : importPreviewData ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="border border-white/10 bg-white/5 rounded-xl p-3 text-center">
                          <span className="text-[10px] font-bold text-[#D0D6BB]/75 uppercase block">Found Rows</span>
                          <span className="text-lg font-bold text-white mt-0.5 block">{importPreviewData.summary.totalRowsFound}</span>
                        </div>
                        <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3 text-center">
                          <span className="text-[10px] font-bold text-emerald-300 uppercase block">New People</span>
                          <span className="text-lg font-bold text-emerald-300 mt-0.5 block">+{importPreviewData.summary.newCount}</span>
                        </div>
                        <div className="border border-blue-500/20 bg-blue-500/5 rounded-xl p-3 text-center">
                          <span className="text-[10px] font-bold text-blue-300 uppercase block">Updates</span>
                          <span className="text-lg font-bold text-blue-300 mt-0.5 block">~{importPreviewData.summary.updatedCount}</span>
                        </div>
                        <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-3 text-center">
                          <span className="text-[10px] font-bold text-red-300 uppercase block">Archiving</span>
                          <span className="text-lg font-bold text-red-300 mt-0.5 block">{selectedMissingIds.size}</span>
                        </div>
                      </div>

                      {/* Warnings */}
                      {(importPreviewData.duplicates.length > 0 || importPreviewData.invalid.length > 0) && (
                        <div className="border border-orange-500/20 bg-orange-500/5 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2 text-orange-300 text-xs font-bold">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Skipped Rows ({importPreviewData.duplicates.length + importPreviewData.invalid.length})</span>
                          </div>
                          <div className="max-h-24 overflow-y-auto space-y-1 mt-2 text-[11px] font-mono text-orange-200/90 pl-6">
                            {importPreviewData.duplicates.map((d, idx) => (
                              <div key={idx}>Row {d.rowNumber}: Duplicate Email [{d.email}] found for {d.name}. Skipped.</div>
                            ))}
                            {importPreviewData.invalid.map((d, idx) => (
                              <div key={idx}>Row {d.rowNumber}: Invalid [{d.reason}] for {d.name || 'Unnamed'}. Skipped.</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New People */}
                      {importPreviewData.newPeople.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-[#D0D6BB]/75 uppercase tracking-wider">New People to be Added</h3>
                          <div className="border border-white/10 rounded-xl max-h-36 overflow-y-auto bg-black/25">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-[#012a23] sticky top-0 text-[10px] font-bold uppercase text-[#D0D6BB] border-b border-white/10">
                                <tr>
                                  <th className="p-3 pl-4">Name</th>
                                  <th className="p-3">Office</th>
                                  <th className="p-3">Email</th>
                                  <th className="p-3 pr-4">Phone</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {importPreviewData.newPeople.map((p, idx) => (
                                  <tr key={idx} className="hover:bg-white/5">
                                    <td className="p-3 pl-4 font-semibold text-white">{p.displayName}</td>
                                    <td className="p-3 text-[#D0D6BB]">{p.primaryOfficeName}</td>
                                    <td className="p-3 font-mono text-[#D0D6BB]">{p.email || '-'}</td>
                                    <td className="p-3 pr-4 text-[#D0D6BB]">{p.phone || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Updated People Side by Side */}
                      {importPreviewData.updatedPeople.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-[#D0D6BB]/75 uppercase tracking-wider">Updates (Side-by-Side Diffs)</h3>
                          <div className="border border-white/10 rounded-xl max-h-40 overflow-y-auto bg-black/25">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-[#012a23] sticky top-0 text-[10px] font-bold uppercase text-[#D0D6BB] border-b border-white/10">
                                <tr>
                                  <th className="p-3 pl-4">Name</th>
                                  <th className="p-3">Field</th>
                                  <th className="p-3 text-red-300">Current Value</th>
                                  <th className="p-3 pr-4 text-emerald-300">Proposed Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {importPreviewData.updatedPeople.map((u, idx) => {
                                  const diffs: { field: string; current: string; proposed: string }[] = [];
                                  if (u.existing.primaryOfficeName !== u.proposed.primaryOfficeName) {
                                    diffs.push({ field: 'Office', current: u.existing.primaryOfficeName, proposed: u.proposed.primaryOfficeName });
                                  }
                                  if ((u.existing.title || '') !== (u.proposed.title || '')) {
                                    diffs.push({ field: 'Title', current: u.existing.title || '-', proposed: u.proposed.title || '-' });
                                  }
                                  if ((u.existing.phone || '') !== (u.proposed.phone || '')) {
                                    diffs.push({ field: 'Phone', current: u.existing.phone || '-', proposed: u.proposed.phone || '-' });
                                  }
                                  if (u.existing.isBrokerInCharge !== u.proposed.isBrokerInCharge) {
                                    diffs.push({ field: 'BIC Status', current: u.existing.isBrokerInCharge ? 'Yes' : 'No', proposed: u.proposed.isBrokerInCharge ? 'Yes' : 'No' });
                                  }

                                  if (diffs.length === 0) {
                                    diffs.push({ field: 'Metadata / Tags', current: u.existing.tags?.join(', ') || '-', proposed: u.proposed.tags?.join(', ') || '-' });
                                  }

                                  return diffs.map((d, dIdx) => (
                                    <tr key={`${idx}-${dIdx}`} className="hover:bg-white/5">
                                      {dIdx === 0 && (
                                        <td className="p-3 pl-4 font-semibold text-white" rowSpan={diffs.length}>
                                          {u.existing.displayName}
                                        </td>
                                      )}
                                      <td className="p-3 font-semibold text-[#D0D6BB]/80">{d.field}</td>
                                      <td className="p-3 text-red-300/80 font-mono line-through">{d.current}</td>
                                      <td className="p-3 pr-4 text-emerald-300 font-mono font-semibold">{d.proposed}</td>
                                    </tr>
                                  ));
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Missing People */}
                      {importPreviewData.missingPeople.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-[#D0D6BB]/75 uppercase tracking-wider">People Missing from Import</h3>
                            <span className="text-[9px] font-bold text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">Deactivate Selected</span>
                          </div>
                          <div className="border border-white/10 rounded-xl max-h-36 overflow-y-auto bg-black/25">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-[#012a23] sticky top-0 text-[10px] font-bold uppercase text-[#D0D6BB] border-b border-white/10">
                                <tr>
                                  <th className="p-3 pl-4 w-12">Deactivate</th>
                                  <th className="p-3">Name</th>
                                  <th className="p-3">Office</th>
                                  <th className="p-3 pr-4">Title / Role</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {importPreviewData.missingPeople.map((p, idx) => {
                                  const isChecked = selectedMissingIds.has(p.id);
                                  return (
                                    <tr key={idx} className="hover:bg-white/5">
                                      <td className="p-3 pl-4">
                                        <input 
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {
                                            const next = new Set(selectedMissingIds);
                                            if (isChecked) next.delete(p.id);
                                            else next.add(p.id);
                                            setSelectedMissingIds(next);
                                          }}
                                          className="rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer bg-black/35 border-white/10"
                                        />
                                      </td>
                                      <td className="p-3 font-semibold text-white">{p.displayName}</td>
                                      <td className="p-3 text-[#D0D6BB]">{p.primaryOfficeName}</td>
                                      <td className="p-3 pr-4 text-[#D0D6BB]">{p.title || 'Agent'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-[#D0D6BB]">No preview diffs loaded.</div>
                  )}
                </div>
              )}

              {/* STEP 5: IMPORT OUTCOME */}
              {importStep === 5 && importResult && (
                <div className="text-center py-8 space-y-6 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/35 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-black uppercase text-white">Roster Sync Complete</h3>
                    <p className="text-sm text-[#D0D6BB] mt-2">The import changes were successfully applied to the local directory registry.</p>
                  </div>
                  <div className="p-4 bg-black/35 rounded-xl border border-white/10 text-left space-y-2 text-sm text-[#D0D6BB]">
                    <div className="flex justify-between border-b border-white/5 pb-2 text-white font-semibold">
                      <span>Import Results</span>
                      <span>Count</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New People Added:</span>
                      <span className="text-emerald-400 font-semibold">+{importResult.added}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Existing Updated:</span>
                      <span className="text-blue-400 font-semibold">~{importResult.updated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>People Archived / Deactivated:</span>
                      <span className="text-red-400 font-semibold">-{importResult.archived}</span>
                    </div>
                    {importResult.receiptId && (
                      <div className="flex justify-between border-t border-white/5 pt-2 text-xs font-mono">
                        <span>Receipt ID:</span>
                        <span className="text-emerald-300 font-medium select-all">{importResult.receiptId}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[#D0D6BB]/75 flex items-center gap-1.5 justify-center">
                    <Info className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Audit logs saved successfully.</span>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="p-6 bg-black/20 border-t border-white/10 flex items-center justify-between">
              <div>
                {importStep > 1 && importStep < 5 && (
                  <button 
                    onClick={() => setImportStep(prev => prev - 1)}
                    disabled={loadingSyncPreview || importApplying}
                    className="px-4 py-2 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                  >
                    Back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleCloseImportWizard}
                  disabled={importApplying}
                  className="px-4 py-2 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                >
                  {importStep === 5 ? 'Close' : 'Cancel'}
                </button>
                
                {importStep === 2 && (
                  <button 
                    onClick={handleLoadHeaders}
                    disabled={loadingSyncPreview}
                    className="px-5 py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                  >
                    {loadingSyncPreview && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Load Columns</span>
                  </button>
                )}

                {importStep === 3 && (
                  <button 
                    onClick={handleCreatePreview}
                    disabled={loadingSyncPreview}
                    className="px-5 py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                  >
                    {loadingSyncPreview && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Generate Preview</span>
                  </button>
                )}

                {importStep === 4 && (
                  <button 
                    onClick={handleApplyImport}
                    disabled={importApplying}
                    className="px-5 py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                  >
                    {importApplying && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Apply Import changes</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add / Edit Contact Drawer */}
      {isFormModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] overflow-hidden text-left font-sans">
          <div 
            className="absolute inset-0 modal-dark-overlay transition-opacity duration-300"
            onClick={() => setIsFormModalOpen(false)}
          />
          
          <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-white border-l border-stone-200 shadow-2xl flex flex-col text-stone-900 z-20 animate-slide-in">
            <form onSubmit={handleFormSubmit} className="h-full flex flex-col overflow-hidden">
              <div className="p-6 flex items-center justify-between border-b border-stone-100 bg-white">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">
                    {isEditing ? 'Edit Person' : 'Add Person'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    {isEditing ? 'Edit contact details in the Mayfaire and Carolina Beach directory.' : 'Add a person to the Mayfaire and Carolina Beach directory.'}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Required Fields */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#00635C] uppercase tracking-wider">Required Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">First Name *</label>
                      <input 
                        type="text" 
                        required
                        value={formValues.firstName}
                        onChange={(e) => setFormValues(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. Mary Kaye"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Last Name *</label>
                      <input 
                        type="text" 
                        required
                        value={formValues.lastName}
                        onChange={(e) => setFormValues(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. Hester"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Display Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formValues.displayName}
                      onChange={(e) => {
                        setIsDisplayNameManuallyEdited(true);
                        setFormValues(prev => ({ ...prev, displayName: e.target.value }));
                      }}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                      placeholder="e.g. Mary Kaye Hester"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Primary Office *</label>
                      <select 
                        name="primaryOfficeName"
                        value={formValues.primaryOfficeName}
                        onChange={(e) => setFormValues(prev => ({ ...prev, primaryOfficeName: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900"
                      >
                        <option value="Mayfaire">Mayfaire</option>
                        <option value="Carolina Beach">Carolina Beach</option>
                        <option value="Home">Home / Remote</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Category *</label>
                      <select 
                        name="personType"
                        value={formValues.personType}
                        onChange={(e) => setFormValues(prev => ({ ...prev, personType: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900"
                      >
                        <option value="agent">Agent</option>
                        <option value="leadership">Leadership</option>
                        <option value="staff">Staff</option>
                        <option value="contractor">Contractor</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-6 items-center pt-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-stone-700 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={formValues.isBrokerInCharge}
                        onChange={(e) => setFormValues(prev => ({ ...prev, isBrokerInCharge: e.target.checked }))}
                        className="rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                      />
                      <span>Broker-in-Charge</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Status *</span>
                      <select 
                        value={formValues.status}
                        onChange={(e) => setFormValues(prev => ({ ...prev, status: e.target.value as any }))}
                        className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs focus:bg-white focus:outline-none text-stone-900"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <hr className="border-stone-100" />

                {/* 2. Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#00635C] uppercase tracking-wider">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Primary Email</label>
                      <input 
                        type="email" 
                        value={formValues.email}
                        onChange={(e) => setFormValues(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. name@nestrealty.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Alternate Email</label>
                      <input 
                        type="email" 
                        value={formValues.alternateEmail}
                        onChange={(e) => setFormValues(prev => ({ ...prev, alternateEmail: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="alt@gmail.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Primary Phone</label>
                      <input 
                        type="text" 
                        value={formValues.phone}
                        onChange={(e) => setFormValues(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. (910) 555-0199"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Alternate Phone</label>
                      <input 
                        type="text" 
                        value={formValues.alternatePhone}
                        onChange={(e) => setFormValues(prev => ({ ...prev, alternatePhone: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="(910) 555-0299"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-stone-100" />

                {/* 3. Professional details */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#00635C] uppercase tracking-wider">Professional details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Preferred Name</label>
                      <input 
                        type="text" 
                        value={formValues.preferredName}
                        onChange={(e) => setFormValues(prev => ({ ...prev, preferredName: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. MK"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Job Title</label>
                      <input 
                        type="text" 
                        value={formValues.title}
                        onChange={(e) => setFormValues(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. Broker"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Role</label>
                      <input 
                        type="text" 
                        value={formValues.role}
                        onChange={(e) => setFormValues(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. Sales Director"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Team / Department</label>
                      <input 
                        type="text" 
                        value={formValues.team}
                        onChange={(e) => setFormValues(prev => ({ ...prev, team: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. Wilmington Residential"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Additional Offices</label>
                    <input 
                      type="text" 
                      value={formValues.additionalOffices}
                      onChange={(e) => setFormValues(prev => ({ ...prev, additionalOffices: e.target.value }))}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                      placeholder="e.g. Carolina Beach, Hampstead (comma separated)"
                    />
                  </div>
                </div>

                <hr className="border-stone-100" />

                {/* 4. External Links & Photo Upload */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#00635C] uppercase tracking-wider">Profile Photo & External Links</h3>
                  
                  {/* Photo Upload & URL Section (ISS-008) */}
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">Profile Photo</label>
                    
                    <div className="flex items-center gap-4">
                      {/* Avatar Preview */}
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-[#00635C] text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-xs shrink-0 relative">
                        {formValues.photoUrl ? (
                          <img 
                            src={formValues.photoUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              // If image fails, clear src to fallback to initials
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{(formValues.firstName?.[0] || '') + (formValues.lastName?.[0] || 'U')}</span>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 shadow-2xs cursor-pointer transition">
                            <Upload className="w-3.5 h-3.5 text-[#00635C]" />
                            <span>Upload Image File</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (uploadEvent) => {
                                    if (uploadEvent.target?.result) {
                                      setFormValues(prev => ({ ...prev, photoUrl: uploadEvent.target!.result as string }));
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>

                          {formValues.photoUrl && (
                            <button
                              type="button"
                              onClick={() => setFormValues(prev => ({ ...prev, photoUrl: '' }))}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>

                        <input 
                          type="text" 
                          value={formValues.photoUrl}
                          onChange={(e) => setFormValues(prev => ({ ...prev, photoUrl: e.target.value }))}
                          className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400 font-mono"
                          placeholder="Or paste image URL (e.g. https://...)"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Profile URL</label>
                      <input 
                        type="text" 
                        value={formValues.profileUrl}
                        onChange={(e) => setFormValues(prev => ({ ...prev, profileUrl: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="https://nestrealty.com/mary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Scheduling URL</label>
                      <input 
                        type="text" 
                        value={formValues.schedulingUrl}
                        onChange={(e) => setFormValues(prev => ({ ...prev, schedulingUrl: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="https://calendly.com/mary"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-stone-100" />

                {/* 5. Extra Metadata */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#00635C] uppercase tracking-wider">Extra Metadata</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">License Number</label>
                      <input 
                        type="text" 
                        value={formValues.licenseNumber}
                        onChange={(e) => setFormValues(prev => ({ ...prev, licenseNumber: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. 289930"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Anniversary / Birthday</label>
                      <input 
                        type="text" 
                        value={formValues.anniversary}
                        onChange={(e) => setFormValues(prev => ({ ...prev, anniversary: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. 05-12"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Start Date</label>
                      <input 
                        type="date" 
                        value={formValues.startDate}
                        onChange={(e) => setFormValues(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Tags</label>
                      <input 
                        type="text" 
                        value={formValues.tags}
                        onChange={(e) => setFormValues(prev => ({ ...prev, tags: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. top-producer, bilingual (comma separated)"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Street Address</label>
                      <input 
                        type="text" 
                        value={formValues.address}
                        onChange={(e) => setFormValues(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. 102 Pine St"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">City, State, Zip</label>
                      <input 
                        type="text" 
                        value={formValues.cityStateZip}
                        onChange={(e) => setFormValues(prev => ({ ...prev, cityStateZip: e.target.value }))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                        placeholder="e.g. Wilmington, NC 28403"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-stone-100" />

                {/* 6. Notes */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#00635C] uppercase tracking-wider">Notes</h3>
                  <div>
                    <textarea 
                      value={formValues.notes}
                      onChange={(e) => setFormValues(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C] text-stone-900 placeholder-stone-400"
                      placeholder="Add any internal administrative notes here..."
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
                >
                  {isEditing ? 'Save Changes' : 'Create Person'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Duplicate Warning Modal */}
      {isDuplicateWarningOpen && possibleDuplicatePerson && (
        <div className="fixed inset-0 z-[60] overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDuplicateWarningOpen(false)} />
          
          <div className="modal-dark-content max-w-md w-full rounded-[20px] shadow-xl p-6 relative z-10 text-left border border-white/10 text-white animate-scale-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <h3 className="text-lg font-serif font-black uppercase tracking-wider text-white">Possible existing person found</h3>
                <p className="text-sm text-[#D0D6BB] mt-2">
                  A directory record with matching contact information may already exist.
                </p>
                <div className="mt-4 p-3 bg-black/25 rounded-lg border border-white/5 space-y-1.5 text-xs">
                  <div className="font-semibold text-white">{possibleDuplicatePerson.displayName}</div>
                  {possibleDuplicatePerson.email && <div className="text-[#D0D6BB]/75">Email: {possibleDuplicatePerson.email}</div>}
                  {possibleDuplicatePerson.phone && <div className="text-[#D0D6BB]/75">Phone: {possibleDuplicatePerson.phone}</div>}
                  <div className="text-[#D0D6BB]/75">Office: {possibleDuplicatePerson.primaryOfficeName}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={() => setIsDuplicateWarningOpen(false)}
                className="px-4 py-2 border border-white/10 hover:bg-white/10 rounded-xl text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPerson(possibleDuplicatePerson);
                  setIsDrawerOpen(true);
                  setIsDuplicateWarningOpen(false);
                  setIsFormModalOpen(false);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
              >
                View Existing Person
              </button>
              <button
                type="button"
                onClick={() => {
                  handleFormSubmit(null as any, true);
                }}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] rounded-xl text-white font-semibold shadow-sm transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}