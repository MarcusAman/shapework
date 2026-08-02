import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, User, Plus, Trash2, Check, Play, Share2, FileText, ArrowRight,
  Shield, AlertTriangle, Layers, BookOpen, Link, Settings, Info, Search,
  ChevronRight, ChevronLeft, HelpCircle, File, Folder, Download, Eye, Zap, CheckCircle, Printer,
  MessageSquare, Users, Mail, PenTool, Home, Phone, Calendar, ArrowUp, ArrowDown, Palette, Edit3, Database
} from 'lucide-react';
import { 
  orgChartService, OrgPosition, OrgRole, OrgSop, OrgConnection, EscalationPolicy, RoutingMatrixItem, OrgModel, OrgKnowledgeDocument, OrgKnowledgeStatus, OrgKnowledgeSourceType, DEFAULT_KNOWLEDGE_DOCUMENTS, OrgPositionStatus, AvatarCropSettings, OrgLogicNode
} from '../../services/orgChartService';
import SOPStudio from '../sops/SOPStudio';
import RoleProfileModal from '../people/RoleProfileModal';
import LocationSelectorDropdown from '../ui/LocationSelectorDropdown';

interface OrgAvatarProps {
  name: string;
  avatarUrl?: string;
  avatarCrop?: AvatarCropSettings;
  size?: number;
  className?: string;
}

export function OrgAvatar({ name, avatarUrl, avatarCrop, size = 40, className = '' }: OrgAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = useMemo(() => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const hasAvatar = avatarUrl && !imgError;

  const defaultCrop: AvatarCropSettings = {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    cropShape: 'circle'
  };

  const crop = avatarCrop || defaultCrop;

  const shapeClass = 
    crop.cropShape === 'square' ? 'rounded-none' :
    crop.cropShape === 'rounded' ? 'rounded-xl' :
    'rounded-full';

  const scaleFactor = size / 200;
  const tx = (crop.x || 0) * scaleFactor;
  const ty = (crop.y || 0) * scaleFactor;

  return (
    <div
      className={`${shapeClass} flex items-center justify-center font-bold text-white font-mono shrink-0 select-none overflow-hidden relative ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${Math.max(8, Math.floor(size * 0.35))}px`,
        backgroundColor: hasAvatar ? 'transparent' : '#00635C',
        border: '1px solid rgba(246, 247, 241, 0.18)'
      }}
    >
      {hasAvatar ? (
        <img
          src={avatarUrl}
          alt={`${name} profile image`}
          onError={() => setImgError(true)}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '120%',
            height: '120%',
            objectFit: 'cover',
            transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${crop.scale || 1}) rotate(${crop.rotation || 0}deg)`,
            transformOrigin: 'center center'
          }}
          className="transition-all duration-75"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

interface AvatarCropEditorProps {
  avatarUrl: string;
  name: string;
  initialCrop?: AvatarCropSettings;
  onSave: (crop: AvatarCropSettings) => void;
  onCancel: () => void;
}
export function AvatarCropEditor({ avatarUrl, name, initialCrop, onSave, onCancel }: AvatarCropEditorProps) {
  const [crop, setCrop] = useState<AvatarCropSettings>(
    initialCrop || { x: 0, y: 0, scale: 1, rotation: 0, cropShape: 'circle' }
  );

  const handleZoom = (amount: number) => {
    setCrop(prev => ({
      ...prev,
      scale: Math.max(0.75, Math.min(3.0, Math.round((prev.scale + amount) * 100) / 100))
    }));
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right', amount: number) => {
    setCrop(prev => {
      let dx = prev.x;
      let dy = prev.y;
      if (direction === 'up') dy -= amount;
      if (direction === 'down') dy += amount;
      if (direction === 'left') dx -= amount;
      if (direction === 'right') dx += amount;
      return { ...prev, x: dx, y: dy };
    });
  };

  const handleRotate = (amount: number) => {
    setCrop(prev => ({
      ...prev,
      rotation: ((prev.rotation || 0) + amount) % 360
    }));
  };

  const handleReset = () => {
    setCrop({
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      cropShape: 'circle'
    });
  };

  const shapeClass = 
    crop.cropShape === 'square' ? 'rounded-none' :
    crop.cropShape === 'rounded' ? 'rounded-2xl' :
    'rounded-full';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-sans select-none animate-fade-in">
      <div className="w-full max-w-md bg-[#013028] border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-left">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h4 className="text-xs font-serif font-black text-white uppercase tracking-wider">
            Edit Avatar Position & Crop
          </h4>
          <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Large preview frame */}
        <div className="flex justify-center items-center py-6 bg-black/20 rounded-2xl border border-white/5 relative overflow-hidden">
          <div 
            className={`w-[200px] h-[200px] relative border-2 border-emerald-500/50 shadow-inner overflow-hidden bg-[#00635C] ${shapeClass}`}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${name} cropping preview`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '120%',
                  height: '120%',
                  objectFit: 'cover',
                  transform: `translate(-50%, -50%) translate(${crop.x || 0}px, ${crop.y || 0}px) scale(${crop.scale || 1}) rotate(${crop.rotation || 0}deg)`,
                  transformOrigin: 'center center'
                }}
                className="transition-all duration-75"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50 font-mono text-sm font-bold">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Shape selector */}
        <div className="flex flex-col gap-2 text-xs text-[#D0D6BB]">
          <span className="text-[9px] font-bold font-mono uppercase tracking-wider block text-white/50">Crop Frame Shape</span>
          <div className="flex gap-2">
            {(['circle', 'rounded', 'square'] as const).map(shape => (
              <button
                key={shape}
                type="button"
                onClick={() => setCrop(prev => ({ ...prev, cropShape: shape }))}
                className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  crop.cropShape === shape
                    ? 'bg-[#00635C] border-emerald-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        {/* Controls Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Movement controls */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-bold font-mono uppercase text-[#D0D6BB] block text-white/50">Position</span>
            <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
              <div />
              <button
                type="button"
                onClick={() => handleMove('up', 5)}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg flex items-center justify-center cursor-pointer text-[10px]"
                title="Move Up"
              >
                ▲
              </button>
              <div />

              <button
                type="button"
                onClick={() => handleMove('left', 5)}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg flex items-center justify-center cursor-pointer text-[10px]"
                title="Move Left"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg flex items-center justify-center cursor-pointer text-[9px] font-bold"
                title="Reset Position"
              >
                ↺
              </button>
              <button
                type="button"
                onClick={() => handleMove('right', 5)}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg flex items-center justify-center cursor-pointer text-[10px]"
                title="Move Right"
              >
                ▶
              </button>

              <div />
              <button
                type="button"
                onClick={() => handleMove('down', 5)}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg flex items-center justify-center cursor-pointer text-[10px]"
                title="Move Down"
              >
                ▼
              </button>
              <div />
            </div>
          </div>

          {/* Zoom & Rotation controls */}
          <div className="flex flex-col gap-3 font-mono text-[10px]">
            <div>
              <span className="text-[9px] font-bold uppercase text-[#D0D6BB] block mb-1">Zoom</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleZoom(-0.05)}
                  className="flex-1 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-lg cursor-pointer text-xs"
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => handleZoom(0.05)}
                  className="flex-1 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-lg cursor-pointer text-xs"
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-bold uppercase text-[#D0D6BB] block mb-1">Rotate</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleRotate(-15)}
                  className="flex-1 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg cursor-pointer"
                >
                  ↺ -15°
                </button>
                <button
                  type="button"
                  onClick={() => handleRotate(15)}
                  className="flex-1 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg cursor-pointer"
                >
                  🗘 +15°
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="flex gap-3 border-t border-white/10 pt-4 font-mono text-[10px] uppercase">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-xl transition-colors cursor-pointer text-center font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(crop)}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-white/20 rounded-xl transition-all cursor-pointer text-center font-bold"
          >
            Save Crop
          </button>
        </div>
      </div>
    </div>
  );
}


interface OrgChartWizardPageProps {
  onClose?: () => void;
  state: any;
  fullPage?: boolean;
  embeddedTab?: 'visual' | 'guided' | 'routing';
}

export default function OrgChartWizardPage({ onClose, state, embeddedTab }: OrgChartWizardPageProps) {
  const workspaceId = state.workspaceId || 'nest-realty-demo';
  const workspaceName = workspaceId === 'nest-realty-demo' ? 'Nest Realty' : 'Workspace';

  // --- CORE STATE ---
  const [activeProfilePerson, setActiveProfilePerson] = useState<any | null>(null);
  const [autoExportPdf, setAutoExportPdf] = useState<boolean>(false);
  const [model, setModel] = useState<OrgModel>({
    positions: [],
    roles: [],
    sops: [],
    connections: [],
    escalationPolicies: [],
    routingMatrix: [],
    knowledgeDocuments: []
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [posStepFilter, setPosStepFilter] = useState<'all' | 'active' | 'open' | 'planned' | 'virtual_ai'>('all');

  type OrgChartTab = 'overview' | 'org_chart' | 'by_position' | 'routing' | 'workflow' | 'escalations' | 'sops_knowledge' | 'connected_tools' | 'guided';

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<OrgChartTab>(() => {
    if (embeddedTab) {
      if (embeddedTab === 'visual') return 'org_chart';
      if (embeddedTab === 'guided') return 'guided';
      if (embeddedTab === 'routing') return 'routing';
    }
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam) return tabParam as OrgChartTab;
    }
    return 'org_chart';
  });

  useEffect(() => {
    if (embeddedTab) {
      if (embeddedTab === 'visual') setActiveTab('org_chart');
      else if (embeddedTab === 'guided') setActiveTab('guided');
      else if (embeddedTab === 'routing') setActiveTab('routing');
    }
  }, [embeddedTab]);

  // Visual Map Canvas States
  const [pan, setPan] = useState({ x: 100, y: 50 });
  const [zoom, setZoom] = useState(1);
  const [activeViewMode, setActiveViewMode] = useState<'org' | 'workflow' | 'position'>('org');

  useEffect(() => {
    if (activeTab === 'org_chart') {
      setActiveViewMode('org');
    } else if (activeTab === 'by_position') {
      setActiveViewMode('position');
    } else if (activeTab === 'workflow') {
      setActiveViewMode('workflow');
    }
  }, [activeTab]);

  const [selectedElement, setSelectedElement] = useState<{ type: 'position' | 'role' | 'sop' | 'escalation' | 'logic_split' | 'intake_trigger' | 'connection'; id: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [escSearchQuery, setEscSearchQuery] = useState('');
  const [escStatusFilter, setEscStatusFilter] = useState('all');
  const [escOfficeFilter, setEscOfficeFilter] = useState('all');
  const [escRecipientFilter, setEscRecipientFilter] = useState('all');
  const [isPostAssignmentExpanded, setIsPostAssignmentExpanded] = useState(false);
  const [integrationsList, setIntegrationsList] = useState([
    { name: 'Gmail', status: 'Connected', category: 'Email Intake', uses: 'Live email intake parses incoming agent requests and creates intake tickets automatically.', role: 'Operations Team', lastSync: '2 mins ago', icon: Mail },
    { name: 'Google Calendar', status: 'Connected', category: 'Scheduling', uses: 'Schedules listing launch milestones, photographer bookings, and office room slots.', role: 'Operations Director', lastSync: '4 mins ago', icon: Calendar },
    { name: 'Google Drive', status: 'Connected', category: 'Document Storage', uses: 'Stores transaction documentation, listing photos, and compliance audit exports.', role: 'Transaction Coordinator', lastSync: '12 mins ago', icon: Folder },
    { name: 'MLS Data Feed (RESO)', status: 'Connected', category: 'Property Feed', uses: 'Pulls real-time RESO listing data, audits field quality, and auto-triggers launch SOP runs.', role: 'Transaction Coordinator', lastSync: '2 mins ago', icon: Database },
    { name: 'SMS / Phone Gateway', status: 'Connected', category: 'Notifications', uses: 'Dispatches critical escalation alerts to Ryan Crecelius and urgent compliance notices.', role: 'All Leadership', lastSync: '1 min ago', icon: Phone },
    { name: 'AI Voice/Chat Agents', status: 'Connected', category: 'Virtual Assistant', uses: 'Handles inbound voice queries from agents on compliance/closing procedures via Retell AI.', role: 'Virtual Assistant', lastSync: '3 mins ago', icon: Zap },
    { name: 'Brokerage Dashboard', status: 'Connected', category: 'Analytics', uses: 'Aggregates operational metrics, agent support ticket histories, and pipeline bottlenecks.', role: 'Broker Owner', lastSync: 'Just now', icon: Layers },
    { name: 'Dotloop', status: 'Available to Connect', category: 'Transaction Mgmt', uses: 'Monitors loop status updates, contract documents, signature trails, and closing dates.', role: 'BICs / Compliance', lastSync: 'Requires API key', icon: FileText },
    { name: 'DocuSign', status: 'Available to Connect', category: 'Digital Signatures', uses: 'Executes automated 4-point signature audits on closing packages and settlement disclosures.', role: 'BICs / Compliance', lastSync: 'Requires OAuth', icon: FileText },
    { name: 'Rechat', status: 'Available to Connect', category: 'Marketing CRM', uses: 'Synchronizes agent profiles, contact records, and active property marketing pipelines.', role: 'Marketing Coordinator', lastSync: 'Manual sync available', icon: Users },
    { name: 'QuickBooks', status: 'Requires Administrator', category: 'Accounting', uses: 'Processes agent invoices, commission payables, bill reimbursements, and office budgets.', role: 'Accounting Lead', lastSync: 'Admin setup required', icon: Layers },
    { name: 'Canva', status: 'In Development', category: 'Brand Templates', uses: 'Synchronizes official marketing templates, brand asset libraries, and agent flyer layouts.', role: 'Marketing Coordinator', lastSync: 'In dev sandbox', icon: Palette },
    { name: 'Basecamp', status: 'Coming Soon', category: 'Project Mgmt', uses: 'Manages collaborative workflows, staff checklists, and event coordination tasks.', role: 'General Staff', lastSync: 'Planned Q4', icon: Zap },
    { name: 'Microsoft Teams', status: 'Coming Soon', category: 'Communications', uses: 'Provides fallback chat coordination and staff video meeting links.', role: 'Operations', lastSync: 'Planned Q4', icon: MessageSquare }
  ]);
  const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<'reporting' | 'roles' | 'escalations' | 'sops'>('reporting');
  const [showReportingLines, setShowReportingLines] = useState(true);
  const [showEscalationLines, setShowEscalationLines] = useState(true);
  const [showSopLines, setShowSopLines] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [showOpenRoles, setShowOpenRoles] = useState(true);
  const [showPlannedRoles, setShowPlannedRoles] = useState(true);
  const [showVirtualAi, setShowVirtualAi] = useState(true);
  const [showAgents, setShowAgents] = useState(false);
  const [planningMode, setPlanningMode] = useState(false);
  const [isRoutingModalOpen, setIsRoutingModalOpen] = useState(false);
  const [routingModalStep, setRoutingModalStep] = useState<1 | 2 | 3 | 4>(1);
  const [editingRouteData, setEditingRouteData] = useState<RoutingMatrixItem | null>(null);
  const [isCreatingNewRoute, setIsCreatingNewRoute] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const nodePointerRef = useRef<{ id: string; startX: number; startY: number; moved: boolean } | null>(null);

  const [selectedSopForModal, setSelectedSopForModal] = useState<any>(null);
  const [sopModalOpen, setSopModalOpen] = useState(false);
  const [selectedEscalationForModal, setSelectedEscalationForModal] = useState<any>(null);
  const [escalationModalOpen, setEscalationModalOpen] = useState(false);

  // Real Backend OAuth Integration Sync
  useEffect(() => {
    if (activeTab !== 'connected_tools') return;

    const fetchStatuses = async () => {
      const providers = [
        { name: 'Gmail', provider: 'google', endpoint: '/api/integrations/google/status' },
        { name: 'Google Calendar', provider: 'google', endpoint: '/api/integrations/google/status' },
        { name: 'Google Drive', provider: 'google', endpoint: '/api/integrations/google/status' },
        { name: 'Rechat', provider: 'rechat', endpoint: '/api/integrations/rechat/status' },
        { name: 'Dotloop', provider: 'dotloop', endpoint: '/api/integrations/apination/dotloop/status' },
        { name: 'QuickBooks', provider: 'quickbooks', endpoint: '/api/integrations/quickbooks/status' },
        { name: 'Basecamp', provider: 'basecamp', endpoint: '/api/integrations/basecamp/status' },
        { name: 'Slack', provider: 'slack', endpoint: '/api/integrations/slack/status' },
        { name: 'Canva', provider: 'canva', endpoint: '/api/integrations/canva/status' },
        { name: 'Microsoft Teams', provider: 'microsoft', endpoint: '/api/integrations/microsoft/status' }
      ];

      const updatedList = [...integrationsList];
      let changed = false;

      await Promise.all(providers.map(async (p) => {
        try {
          const res = await fetch(`${p.endpoint}?workspaceId=${workspaceId}`, {
            headers: { 'x-workspace-id': workspaceId }
          });
          if (res.ok) {
            const data = await res.json();
            
            let status = 'Available to Connect';
            if (data.connected || data.status === 'connected' || data.status === 'active' || data.configured === true) {
              status = 'Connected';
            } else if (data.status === 'configured') {
              status = 'Configured';
            } else if (data.status === 'needs_attention') {
              status = 'Needs Attention';
            } else if (data.status === 'offline' || data.status === 'connection_offline') {
              status = 'Connection Offline';
            }

            const itemIdx = updatedList.findIndex(item => item.name === p.name);
            if (itemIdx !== -1 && updatedList[itemIdx].status !== status) {
              updatedList[itemIdx].status = status;
              if (status === 'Connected' && data.providerAccountEmail) {
                updatedList[itemIdx].lastSync = `account: ${data.providerAccountEmail}`;
              } else if (status === 'Connected') {
                updatedList[itemIdx].lastSync = 'Active';
              }
              changed = true;
            }
          }
        } catch (err) {
          console.warn(`[Integrations Status] Failed to fetch status for ${p.name}:`, err);
        }
      }));

      if (changed) {
        setIntegrationsList(updatedList);
      }
    };

    fetchStatuses();
  }, [activeTab, workspaceId, integrationsList]);

  const handleConnectTool = async (toolName: string, isConnected: boolean, idx: number) => {
    const providerMap: Record<string, { provider: string; connectPath: string; disconnectPath: string }> = {
      'Gmail': { provider: 'google', connectPath: '/api/integrations/google/connect', disconnectPath: '/api/integrations/google/disconnect' },
      'Google Calendar': { provider: 'google', connectPath: '/api/integrations/google/connect', disconnectPath: '/api/integrations/google/disconnect' },
      'Google Drive': { provider: 'google', connectPath: '/api/integrations/google/connect', disconnectPath: '/api/integrations/google/disconnect' },
      'Rechat': { provider: 'rechat', connectPath: '/api/integrations/rechat/oauth/start', disconnectPath: '/api/integrations/rechat/disconnect' },
      'Dotloop': { provider: 'dotloop', connectPath: '/api/integrations/api-nation/connect', disconnectPath: '/api/integrations/api-nation/disconnect' },
      'QuickBooks': { provider: 'quickbooks', connectPath: '/api/integrations/quickbooks/connect', disconnectPath: '/api/integrations/quickbooks/disconnect' },
      'Basecamp': { provider: 'basecamp', connectPath: '/api/integrations/basecamp/connect', disconnectPath: '/api/integrations/basecamp/disconnect' },
      'Slack': { provider: 'slack', connectPath: '/api/integrations/slack/connect', disconnectPath: '/api/integrations/slack/disconnect' },
      'Canva': { provider: 'canva', connectPath: '/api/integrations/canva/connect', disconnectPath: '/api/integrations/canva/disconnect' },
      'Microsoft Teams': { provider: 'microsoft', connectPath: '/api/integrations/microsoft/connect', disconnectPath: '/api/integrations/microsoft/disconnect' }
    };

    const target = providerMap[toolName];
    if (!target) {
      const updated = [...integrationsList];
      if (isConnected) {
        updated[idx].status = 'Available to Connect';
        updated[idx].lastSync = null;
      } else {
        updated[idx].status = 'Connected';
        updated[idx].lastSync = 'Just now';
      }
      setIntegrationsList(updated);
      return;
    }

    try {
      if (isConnected) {
        const res = await fetch(`${target.disconnectPath}?workspaceId=${workspaceId}`, {
          method: 'POST',
          headers: {
            'x-workspace-id': workspaceId,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const updated = [...integrationsList];
          updated[idx].status = 'Available to Connect';
          updated[idx].lastSync = null;
          setIntegrationsList(updated);
        } else {
          alert(`Failed to disconnect ${toolName}`);
        }
      } else {
        let connectUrl = '';
        if (target.provider === 'rechat') {
          connectUrl = `${target.connectPath}?workspaceId=${workspaceId}`;
        } else {
          const res = await fetch(`${target.connectPath}?workspaceId=${workspaceId}`, {
            headers: { 'x-workspace-id': workspaceId }
          });
          if (res.ok) {
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
              window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
              return;
            }
            const data = await res.json();
            connectUrl = data.url;
          } else {
            alert(`Failed to initiate connection for ${toolName}`);
            return;
          }
        }

        if (connectUrl) {
          const width = 600;
          const height = 600;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          const popup = window.open(
            connectUrl,
            'oauth-popup',
            `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
          );

          let listener: ((e: MessageEvent) => void) | null = null;
          
          const cleanUpListener = () => {
            if (listener) {
              window.removeEventListener('message', listener);
              listener = null;
            }
          };

          const interval = setInterval(async () => {
            try {
              const statusEndpoint = target.provider === 'dotloop'
                ? '/api/integrations/apination/dotloop/status'
                : `/api/integrations/${target.provider}/status`;
              const statusRes = await fetch(`${statusEndpoint}?workspaceId=${workspaceId}`, {
                headers: { 'x-workspace-id': workspaceId }
              });
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.connected || statusData.status === 'connected') {
                  popup?.close();
                  clearInterval(interval);
                  cleanUpListener();
                  const updated = [...integrationsList];
                  updated[idx].status = 'Connected';
                  if (statusData.providerAccountEmail) {
                    updated[idx].lastSync = `account: ${statusData.providerAccountEmail}`;
                  } else {
                    updated[idx].lastSync = 'Active';
                  }
                  setIntegrationsList(updated);
                }
              }
            } catch (pollErr) {
              console.warn('[OAuth Polling] Error checking connection status:', pollErr);
            }
          }, 1500);

          listener = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            const data = event.data;
            if (data && data.type === 'SHAPEWORK_GOOGLE_OAUTH_COMPLETE' && data.provider === 'google') {
              cleanUpListener();
              clearInterval(interval);
              popup?.close();
              
              if (data.status === 'success') {
                try {
                  const statusRes = await fetch(`/api/integrations/google/status?workspaceId=${workspaceId}`, {
                    headers: { 'x-workspace-id': workspaceId }
                  });
                  if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    const updated = [...integrationsList];
                    const googleCards = ['Gmail', 'Google Calendar', 'Google Drive'];
                    
                    googleCards.forEach(name => {
                      const itemIdx = updated.findIndex(item => item.name === name);
                      if (itemIdx !== -1) {
                        updated[itemIdx].status = 'Connected';
                        if (statusData.providerAccountEmail) {
                          updated[itemIdx].lastSync = `account: ${statusData.providerAccountEmail}`;
                        } else {
                          updated[itemIdx].lastSync = 'Active';
                        }
                      }
                    });
                    setIntegrationsList(updated);
                  }
                } catch (fetchErr) {
                  console.error('[OAuth PostMessage Status Fetch Failed]', fetchErr);
                }
              } else {
                alert(`Google authentication failed: ${data.error || 'Unknown error'}`);
              }
            }
          };

          window.addEventListener('message', listener);

          setTimeout(() => {
            clearInterval(interval);
            cleanUpListener();
          }, 120000);
        } else {
          alert(`Could not retrieve OAuth link for ${toolName}`);
        }
      }
    } catch (err: any) {
      console.error(`[Integrations Connect] Action failed for ${toolName}:`, err);
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleFitView = () => {
    // Filter positions based on checkbox filters
    const visible = model.positions.filter(p => {
      const status = p.status || 'active';
      const title = (p.title || '').toLowerCase();
      const isLeadershipOrStaff = ['pos_ryan', 'pos_coo', 'pos_ann', 'pos_james', 'pos_melissa', 'pos_bic', 'pos_eric', 'pos_va', 'pos_front_desk', 'pos_ai_ops'].includes(p.id) ||
        p.department === 'Leadership' ||
        p.department === 'Operations' ||
        p.department === 'Accounting' ||
        p.department === 'Marketing' ||
        p.department === 'Brokers-in-Charge' ||
        title.includes('broker-in-charge') ||
        title.includes('broker in charge') ||
        title.includes('director') ||
        title.includes('principal') ||
        title.includes('chief');
      const isAgentPos = !isLeadershipOrStaff;

      if (isAgentPos && !showAgents) return false;
      if (status === 'active' && !showActive) return false;
      if (status === 'open' && !showOpenRoles) return false;
      if (status === 'planned' && !showPlannedRoles) return false;
      if (status === 'wanted' && !showPlannedRoles) return false;
      if (status === 'fractional' && !showActive) return false;
      if (status === 'outsourced' && !showActive) return false;
      if (status === 'virtual_ai' && !showVirtualAi) return false;
      return true;
    });

    if (visible.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    visible.forEach(p => {
      const x = p.x ?? 100;
      const y = p.y ?? 100;
      if (x < minX) minX = x;
      if (x + 280 > maxX) maxX = x + 280; // cardWidth is 280
      if (y < minY) minY = y;
      if (y + 150 > maxY) maxY = y + 150;
    });

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;

    let containerWidth = 900;
    let containerHeight = 600;
    if (canvasContainerRef.current) {
      const clientW = canvasContainerRef.current.clientWidth;
      const clientH = canvasContainerRef.current.clientHeight;
      if (clientW > 0 && clientH > 0) {
        containerWidth = clientW;
        containerHeight = clientH;
      }
    }

    const padding = 60;
    const zX = (containerWidth - padding * 2) / boundsWidth;
    const zY = (containerHeight - padding * 2) / boundsHeight;
    const newZoom = Math.min(2.0, Math.max(0.5, Math.min(zX, zY)));

    const centerX = minX + boundsWidth / 2;
    const centerY = minY + boundsHeight / 2;
    const newPan = {
      x: containerWidth / 2 - centerX * newZoom,
      y: containerHeight / 2 - centerY * newZoom
    };

    setPan(newPan);
    setZoom(newZoom);
  };

  const handlePrintMap = () => {
    setSelectedElement(null);
    const visible = model.positions.filter(p => {
      const status = p.status || 'active';
      if (status === 'active' && !showActive) return false;
      if (status === 'open' && !showOpenRoles) return false;
      if (status === 'planned' && !showPlannedRoles) return false;
      if (status === 'wanted' && !showPlannedRoles) return false;
      if (status === 'fractional' && !showActive) return false;
      if (status === 'outsourced' && !showActive) return false;
      if (status === 'virtual_ai' && !showVirtualAi) return false;
      return true;
    });

    if (visible.length > 0) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      visible.forEach(p => {
        const x = p.x ?? 100;
        const y = p.y ?? 100;
        if (x < minX) minX = x;
        if (x + 320 > maxX) maxX = x + 320;
        if (y < minY) minY = y;
        if (y + 160 > maxY) maxY = y + 160;
      });

      const boundsWidth = maxX - minX;
      const boundsHeight = maxY - minY;

      const printWidth = 1100;
      const printHeight = 750;
      const padding = 40;

      const zX = (printWidth - padding * 2) / boundsWidth;
      const zY = (printHeight - padding * 2) / boundsHeight;
      const printZoom = Math.min(2.0, Math.max(0.4, Math.min(zX, zY)));

      const centerX = minX + boundsWidth / 2;
      const centerY = minY + boundsHeight / 2;
      const printPan = {
        x: printWidth / 2 - centerX * printZoom,
        y: printHeight / 2 - centerY * printZoom
      };

      setPan(printPan);
      setZoom(printZoom);
    }

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        handleFitView();
      }, 500);
    }, 150);
  };

  useEffect(() => {
    if (model.positions.length > 0) {
      const needsLayout = model.positions.some(
        p => p.x === undefined || p.y === undefined || (p.x === 0 && p.y === 0)
      );
      if (needsLayout) {
        handleAutoLayout();
      }
      // Auto-fit cards centered in view on initial navigation
      const timer1 = setTimeout(() => {
        handleFitView();
      }, 50);
      const timer2 = setTimeout(() => {
        handleFitView();
      }, 250);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [activeTab, activeViewMode, showAgents, model.positions.length]);

  // Synchronize coordinates for roles, SOPs, escalations, logic nodes if they don't have them in Workflow mode
  useEffect(() => {
    if ((activeTab === 'workflow' || (activeTab === 'visual' && activeViewMode === 'workflow')) && model.positions.length > 0) {
      let updated = false;
      const newModel = { ...model };

      if (!newModel.logicNodes) {
        newModel.logicNodes = [];
      }

      newModel.logicNodes = newModel.logicNodes.map((ln, idx) => {
        if (ln.x === undefined || ln.y === undefined || (ln.x === 0 && ln.y === 0)) {
          updated = true;
          return { ...ln, x: 200, y: 150 + idx * 180 };
        }
        return ln;
      });

      const sopCountByPos: Record<string, number> = {};
      const escCountByPos: Record<string, number> = {};
      const roleCountByPos: Record<string, number> = {};

      newModel.sops = newModel.sops.map((sop) => {
        if (sop.x === undefined || sop.y === undefined || (sop.x === 0 && sop.y === 0)) {
          updated = true;
          const posId = sop.ownerPositionId || 'pos_ryan';
          const currentIdx = sopCountByPos[posId] || 0;
          sopCountByPos[posId] = currentIdx + 1;
          
          const ownerPos = newModel.positions.find(p => p.id === posId);
          const px = ownerPos?.x ?? 500;
          const py = ownerPos?.y ?? 300;
          return { ...sop, x: px + 180, y: py + 120 + currentIdx * 90 };
        }
        return sop;
      });

      newModel.escalationPolicies = newModel.escalationPolicies.map((esc) => {
        if (esc.x === undefined || esc.y === undefined || (esc.x === 0 && esc.y === 0)) {
          updated = true;
          const posId = esc.fromPositionId || 'pos_ryan';
          const currentIdx = escCountByPos[posId] || 0;
          escCountByPos[posId] = currentIdx + 1;

          const ownerPos = newModel.positions.find(p => p.id === posId);
          const px = ownerPos?.x ?? 500;
          const py = ownerPos?.y ?? 300;
          return { ...esc, x: px - 180, y: py + 120 + currentIdx * 90 };
        }
        return esc;
      });

      newModel.roles = newModel.roles.map((role) => {
        if (role.x === undefined || role.y === undefined || (role.x === 0 && role.y === 0)) {
          updated = true;
          const posId = role.positionId || 'pos_ryan';
          const currentIdx = roleCountByPos[posId] || 0;
          roleCountByPos[posId] = currentIdx + 1;

          const ownerPos = newModel.positions.find(p => p.id === posId);
          const px = ownerPos?.x ?? 500;
          const py = ownerPos?.y ?? 300;
          return { ...role, x: px, y: py + 220 + currentIdx * 90 };
        }
        return role;
      });

      if (updated) {
        setModel(newModel);
        orgChartService.saveOrgChart(workspaceId, newModel);
      }
    }
  }, [activeTab, activeViewMode, model.positions.length]);

  // Dragging states
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, x_val: 0, y_val: 0 });

  // Connection overlay/drawer states
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectionDrawerOpen, setConnectionDrawerOpen] = useState(false);
  const [connFrom, setConnFrom] = useState('');
  const [connTo, setConnTo] = useState('');
  const [connType, setConnType] = useState<'reporting' | 'escalation' | 'sop' | 'ownership'>('reporting');
  const [connLabel, setConnLabel] = useState('');
  const [connCondition, setConnCondition] = useState('');
  const [connWindow, setConnWindow] = useState('24 hours');
  const [connSops, setConnSops] = useState<string[]>([]);
  const [connEscalations, setConnEscalations] = useState<string[]>([]);

  // Initials generator
  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // SVG Line curve helper
  const getCurvePath = (x1: number, y1: number, x2: number, y2: number) => {
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  };

  // Canvas interaction moves
  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvasBound = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - canvasBound.left;
    const mouseY = e.clientY - canvasBound.top;

    if (draggedNodeId) {
      const newX = Math.round((mouseX - pan.x) / zoom - dragStartOffset.x);
      const newY = Math.round((mouseY - pan.y) / zoom - dragStartOffset.y);
      
      const newModel = { ...model };
      let found = false;
      
      newModel.positions = newModel.positions.map(p => {
        if (p.id === draggedNodeId) {
          found = true;
          return { ...p, x: newX, y: newY };
        }
        return p;
      });
      
      if (!found) {
        newModel.roles = newModel.roles.map(r => {
          if (r.id === draggedNodeId) {
            found = true;
            return { ...r, x: newX, y: newY };
          }
          return r;
        });
      }
      
      if (!found) {
        newModel.sops = newModel.sops.map(s => {
          if (s.id === draggedNodeId) {
            found = true;
            return { ...s, x: newX, y: newY };
          }
          return s;
        });
      }
      
      if (!found) {
        newModel.escalationPolicies = newModel.escalationPolicies.map(e => {
          if (e.id === draggedNodeId) {
            found = true;
            return { ...e, x: newX, y: newY };
          }
          return e;
        });
      }
      
      if (!found && newModel.logicNodes) {
        newModel.logicNodes = newModel.logicNodes.map(ln => {
          if (ln.id === draggedNodeId) {
            found = true;
            return { ...ln, x: newX, y: newY };
          }
          return ln;
        });
      }
      
      setModel(newModel);
      setHasChanges(true);
      setSaveStatus('idle');
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan({ x: panStart.x_val + dx, y: panStart.y_val + dy });
    }
  };

  // Auto layout tree algorithm
  const handleAutoLayout = () => {
    const nodes = [...model.positions];
    if (nodes.length === 0) return;

    const depths: Record<string, number> = {};
    const getDepth = (id: string, visited = new Set<string>()): number => {
      if (depths[id] !== undefined) return depths[id];
      if (visited.has(id)) return 0;
      visited.add(id);

      const node = nodes.find(n => n.id === id);
      if (!node || !node.reportsToPositionId) {
        depths[id] = 0;
        return 0;
      }
      const d = 1 + getDepth(node.reportsToPositionId, visited);
      depths[id] = d;
      return d;
    };

    nodes.forEach(n => getDepth(n.id));

    const groups: Record<number, string[]> = {};
    nodes.forEach(n => {
      const d = depths[n.id] || 0;
      if (!groups[d]) groups[d] = [];
      groups[d].push(n.id);
    });

    const updatedPositions = nodes.map(node => {
      const d = depths[node.id] || 0;
      const nodesAtLevel = groups[d] || [];
      const idx = nodesAtLevel.indexOf(node.id);
      
      const levelWidth = 800;
      const spacing = nodesAtLevel.length > 1 ? levelWidth / (nodesAtLevel.length - 1) : 0;
      const startX = nodesAtLevel.length > 1 ? 150 : 500;
      
      const x = nodesAtLevel.length > 1 ? startX + idx * spacing : 500;
      const y = 80 + d * 220;

      return {
        ...node,
        x,
        y
      };
    });

    markChanged({
      ...model,
      positions: updatedPositions
    });
  };

  // Apply template helper
  const applyTemplate = (templateName: string) => {
    if (model.positions.length > 0) {
      if (!confirm("This will replace or add template positions to your current model. Existing positions will not be deleted. Do you want to proceed?")) {
        return;
      }
    }
    const templateModel = orgChartService.getTemplate(templateName, workspaceId);
    
    const mergedPositions = [...model.positions];
    templateModel.positions.forEach(tp => {
      if (!mergedPositions.some(p => p.id === tp.id)) {
        mergedPositions.push(tp);
      }
    });

    const mergedRoles = [...model.roles];
    templateModel.roles.forEach(tr => {
      if (!mergedRoles.some(r => r.id === tr.id)) {
        mergedRoles.push(tr);
      }
    });

    const mergedSops = [...model.sops];
    templateModel.sops.forEach(ts => {
      if (!mergedSops.some(s => s.id === ts.id)) {
        mergedSops.push(ts);
      }
    });

    const mergedEscalations = [...model.escalationPolicies];
    templateModel.escalationPolicies.forEach(te => {
      if (!mergedEscalations.some(e => e.id === te.id)) {
        mergedEscalations.push(te);
      }
    });

    const mergedMatrix = [...(model.routingMatrix || [])];
    templateModel.routingMatrix?.forEach(tm => {
      if (!mergedMatrix.some(m => m.category === tm.category)) {
        mergedMatrix.push(tm);
      } else {
        const idx = mergedMatrix.findIndex(m => m.category === tm.category);
        if (mergedMatrix[idx].primaryOwnerPositionId.startsWith('pos_blank') || mergedMatrix[idx].primaryOwnerPositionId === '') {
          mergedMatrix[idx] = tm;
        }
      }
    });

    markChanged({
      ...model,
      positions: mergedPositions,
      roles: mergedRoles,
      sops: mergedSops,
      escalationPolicies: mergedEscalations,
      routingMatrix: mergedMatrix
    });
  };

  // Visual connections selector
  const getVisualConnections = () => {
    const list: any[] = [];
    
    // 1. Reporting hierarchy
    model.positions.forEach(pos => {
      if (pos.reportsToPositionId) {
        list.push({
          id: `rep_${pos.id}_${pos.reportsToPositionId}`,
          workspaceId,
          type: 'reporting',
          fromPositionId: pos.id,
          toPositionId: pos.reportsToPositionId,
          label: 'Reports To',
          sopIds: [],
          escalationPolicyIds: [],
          createdAt: pos.createdAt,
          updatedAt: pos.updatedAt
        });
      }
    });

    // 2. Escalation connections
    model.escalationPolicies.forEach(policy => {
      if (policy.fromPositionId && policy.escalateToPositionId) {
        list.push({
          id: `esc_policy_${policy.id}`,
          workspaceId,
          type: 'escalation',
          fromPositionId: policy.fromPositionId,
          toPositionId: policy.escalateToPositionId,
          label: `Escalates To`,
          condition: policy.condition,
          responseWindow: policy.responseWindow,
          sopIds: [],
          escalationPolicyIds: [policy.id],
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt
        });
      }
    });

    // 3. Custom node-to-node connections
    if (model.connections) {
      model.connections.forEach(c => {
        list.push({
          id: c.id,
          workspaceId: c.workspaceId,
          type: 'sop',
          fromPositionId: c.fromPositionId,
          toPositionId: c.toPositionId,
          label: c.label,
          sopIds: c.sopIds,
          escalationPolicyIds: c.escalationPolicyIds,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        });
      });
    }

    // 4. Workflow view direct attachments
    if (activeViewMode === 'workflow') {
      model.roles.forEach(role => {
        if (role.positionId) {
          list.push({
            id: `role_conn_${role.id}`,
            workspaceId,
            type: 'ownership',
            fromPositionId: role.id,
            toPositionId: role.positionId,
            label: 'Belongs To',
            sopIds: [],
            escalationPolicyIds: [],
            createdAt: role.createdAt,
            updatedAt: role.updatedAt
          });
        }
      });

      model.sops.forEach(sop => {
        if (sop.ownerPositionId) {
          list.push({
            id: `sop_conn_${sop.id}`,
            workspaceId,
            type: 'sop',
            fromPositionId: sop.id,
            toPositionId: sop.ownerPositionId,
            label: 'SOP Owner',
            sopIds: [],
            escalationPolicyIds: [],
            createdAt: sop.createdAt,
            updatedAt: sop.updatedAt
          });
        }
      });

      model.escalationPolicies.forEach(policy => {
        if (policy.fromPositionId) {
          list.push({
            id: `esc_conn_from_${policy.id}`,
            workspaceId,
            type: 'escalation',
            fromPositionId: policy.id,
            toPositionId: policy.fromPositionId,
            label: 'Escalation Source',
            sopIds: [],
            escalationPolicyIds: [policy.id],
            createdAt: policy.createdAt,
            updatedAt: policy.updatedAt
          });
        }
        if (policy.escalateToPositionId) {
          list.push({
            id: `esc_conn_to_${policy.id}`,
            workspaceId,
            type: 'escalation',
            fromPositionId: policy.id,
            toPositionId: policy.escalateToPositionId,
            label: 'Escalates To',
            sopIds: [],
            escalationPolicyIds: [policy.id],
            createdAt: policy.createdAt,
            updatedAt: policy.updatedAt
          });
        }
      });

      if (model.logicNodes) {
        model.logicNodes.forEach(node => {
          if (node.branches) {
            node.branches.forEach((targetId, bIdx) => {
              list.push({
                id: `logic_conn_${node.id}_${targetId}_${bIdx}`,
                workspaceId,
                type: 'ownership',
                fromPositionId: node.id,
                toPositionId: targetId,
                label: node.conditions?.[bIdx] || 'Route',
                sopIds: [],
                escalationPolicyIds: [],
                createdAt: node.createdAt,
                updatedAt: node.updatedAt
              });
            });
          }
        });
      }
    }

    return list;
  };

  // Save visual connection changes
  const handleSaveConnectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connFrom || !connTo) return;

    if (connType === 'reporting') {
      const updatedPositions = model.positions.map(p => 
        p.id === connFrom ? { ...p, reportsToPositionId: connTo } : p
      );
      markChanged({
        ...model,
        positions: updatedPositions
      });
    } else if (connType === 'escalation') {
      const existing = model.escalationPolicies.find(ep => ep.fromPositionId === connFrom && ep.escalateToPositionId === connTo);
      if (existing) {
        const updatedPolicies = model.escalationPolicies.map(ep => 
          ep.id === existing.id 
            ? { ...ep, name: connLabel || ep.name, condition: connCondition || ep.condition, responseWindow: connWindow || ep.responseWindow } 
            : ep
        );
        markChanged({ ...model, escalationPolicies: updatedPolicies });
      } else {
        const newPolicy: EscalationPolicy = {
          id: `esc_${Date.now()}`,
          workspaceId,
          name: connLabel || 'New Escalation Policy',
          trigger: `Task overdue at ${connFrom}`,
          condition: connCondition || 'IF task overdue',
          fromPositionId: connFrom,
          escalateToPositionId: connTo,
          responseWindow: connWindow,
          urgency: 'normal',
          channels: ['dashboard', 'email'],
          requiredContext: [],
          recommendedNextAction: 'Review delay',
          saveToKnowledgeBase: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        markChanged({
          ...model,
          escalationPolicies: [...model.escalationPolicies, newPolicy]
        });
      }
    } else {
      const existingIdx = (model.connections || []).findIndex(c => c.id === selectedConnectionId);
      const newConn = {
        id: selectedConnectionId || `con_${Date.now()}`,
        workspaceId,
        fromPositionId: connFrom,
        toPositionId: connTo,
        label: connLabel,
        sopIds: connSops,
        escalationPolicyIds: connEscalations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let updatedConnections = [...(model.connections || [])];
      if (existingIdx > -1) {
        updatedConnections[existingIdx] = newConn;
      } else {
        updatedConnections.push(newConn);
      }
      markChanged({
        ...model,
        connections: updatedConnections
      });
    }

    setConnectionDrawerOpen(false);
    setSelectedConnectionId(null);
  };

  // Delete visual connection
  const handleDeleteConnection = (connId: string) => {
    if (connId.startsWith('rep_')) {
      const fromId = connId.split('_')[1];
      const updatedPositions = model.positions.map(p => 
        p.id === fromId ? { ...p, reportsToPositionId: undefined } : p
      );
      markChanged({
        ...model,
        positions: updatedPositions
      });
    } else if (connId.startsWith('esc_policy_')) {
      const policyId = connId.replace('esc_policy_', '');
      const updatedPolicies = model.escalationPolicies.filter(p => p.id !== policyId);
      markChanged({
        ...model,
        escalationPolicies: updatedPolicies
      });
    } else {
      const updatedConnections = (model.connections || []).filter(c => c.id !== connId);
      markChanged({
        ...model,
        connections: updatedConnections
      });
    }
    setConnectionDrawerOpen(false);
    setSelectedConnectionId(null);
  };

  // Add node from left palette near viewport center
  const handleAddPaletteNode = (type: 'position' | 'role' | 'sop' | 'escalation' | 'logic_split' | 'intake_trigger') => {
    const container = canvasContainerRef.current;
    const width = container ? container.clientWidth : 800;
    const height = container ? container.clientHeight : 500;
    const centerX = Math.round((width / 2 - pan.x) / zoom);
    const centerY = Math.round((height / 2 - pan.y) / zoom);

    const newModel = { ...model };

    if (type === 'position') {
      const newPos: OrgPosition = {
        id: `pos_new_${Date.now()}`,
        workspaceId,
        name: 'New Position',
        title: 'Title / Role',
        department: 'Operations',
        office: 'Wilmington',
        roleIds: [],
        status: 'open',
        x: centerX,
        y: centerY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newModel.positions.push(newPos);
      setSelectedElement({ type: 'position', id: newPos.id });
    } else if (type === 'role') {
      const newRole: OrgRole = {
        id: `role_new_${Date.now()}`,
        workspaceId,
        positionId: model.positions[0]?.id || '',
        name: 'New Role',
        description: 'New role responsibility',
        categories: ['Operations'],
        sopIds: [],
        escalationPolicyIds: [],
        x: centerX,
        y: centerY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newModel.roles.push(newRole);
      setSelectedElement({ type: 'role', id: newRole.id });
    } else if (type === 'sop') {
      const newSop: OrgSop = {
        id: `sop_new_${Date.now()}`,
        workspaceId,
        name: 'New SOP Document',
        trigger: 'Trigger event',
        ownerPositionId: model.positions[0]?.id || '',
        steps: ['Step 1', 'Step 2'],
        requiredInformation: ['Information required'],
        tags: [],
        x: centerX,
        y: centerY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newModel.sops.push(newSop);
      setSelectedElement({ type: 'sop', id: newSop.id });
    } else if (type === 'escalation') {
      const newEsc: EscalationPolicy = {
        id: `esc_new_${Date.now()}`,
        workspaceId,
        name: 'New Escalation Policy',
        trigger: 'SLA overdue trigger',
        condition: 'SLA is exceeded',
        escalateToPositionId: model.positions[0]?.id || '',
        responseWindow: '24 hours',
        urgency: 'normal',
        channels: ['dashboard', 'email'],
        requiredContext: ['Context reference'],
        recommendedNextAction: 'Review issue log',
        saveToKnowledgeBase: true,
        x: centerX,
        y: centerY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newModel.escalationPolicies.push(newEsc);
      setSelectedElement({ type: 'escalation', id: newEsc.id });
    } else if (type === 'logic_split' || type === 'intake_trigger') {
      if (!newModel.logicNodes) newModel.logicNodes = [];
      const newLogicNode: OrgLogicNode = {
        id: `logic_new_${Date.now()}`,
        workspaceId,
        type,
        label: type === 'intake_trigger' ? 'New Intake Trigger' : 'New Logic Split',
        description: type === 'intake_trigger' ? 'Inbound ticket intake channel' : 'Request type routing matrix split',
        conditions: type === 'logic_split' ? ['Marketing', 'Compliance', 'Operations'] : [],
        branches: [],
        x: centerX,
        y: centerY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newModel.logicNodes.push(newLogicNode);
      setSelectedElement({ type: type as any, id: newLogicNode.id });
    }

    setModel(newModel);
    orgChartService.saveOrgChart(workspaceId, newModel);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // Update properties inline for inspector panel
  const handleUpdateElementInline = (field: string, value: any) => {
    if (!selectedElement) return;
    const { type, id } = selectedElement;
    const newModel = { ...model };

    if (type === 'position') {
      newModel.positions = newModel.positions.map(p => 
        p.id === id ? { ...p, [field]: value, updatedAt: new Date().toISOString() } : p
      );
    } else if (type === 'role') {
      newModel.roles = newModel.roles.map(r => 
        r.id === id ? { ...r, [field]: value, updatedAt: new Date().toISOString() } : r
      );
    } else if (type === 'sop') {
      newModel.sops = newModel.sops.map(s => 
        s.id === id ? { ...s, [field]: value, updatedAt: new Date().toISOString() } : s
      );
    } else if (type === 'escalation') {
      newModel.escalationPolicies = newModel.escalationPolicies.map(e => 
        e.id === id ? { ...e, [field]: value, updatedAt: new Date().toISOString() } : e
      );
    } else if (type === 'logic_split' || type === 'intake_trigger') {
      if (newModel.logicNodes) {
        newModel.logicNodes = newModel.logicNodes.map(ln => 
          ln.id === id ? { ...ln, [field]: value, updatedAt: new Date().toISOString() } : ln
        );
      }
    } else if (type === 'connection') {
      if (newModel.visualConnections) {
        newModel.visualConnections = newModel.visualConnections.map(c => 
          c.id === id ? { ...c, [field]: value, updatedAt: new Date().toISOString() } : c
        );
      }
      newModel.connections = newModel.connections.map(c => 
        c.id === id ? { ...c, [field]: value, updatedAt: new Date().toISOString() } : c
      );
    }

    setModel(newModel);
    orgChartService.saveOrgChart(workspaceId, newModel);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // Delete node or connection from inspector
  const handleDeleteSelectedElement = () => {
    if (!selectedElement) return;
    const { type, id } = selectedElement;
    const newModel = { ...model };

    if (type === 'position') {
      newModel.positions = newModel.positions.filter(p => p.id !== id);
      newModel.connections = newModel.connections.filter(c => c.fromPositionId !== id && c.toPositionId !== id);
      if (newModel.visualConnections) {
        newModel.visualConnections = newModel.visualConnections.filter(c => c.fromPositionId !== id && c.toPositionId !== id);
      }
    } else if (type === 'role') {
      newModel.roles = newModel.roles.filter(r => r.id !== id);
    } else if (type === 'sop') {
      newModel.sops = newModel.sops.filter(s => s.id !== id);
    } else if (type === 'escalation') {
      newModel.escalationPolicies = newModel.escalationPolicies.filter(e => e.id !== id);
    } else if (type === 'logic_split' || type === 'intake_trigger') {
      if (newModel.logicNodes) {
        newModel.logicNodes = newModel.logicNodes.filter(ln => ln.id !== id);
      }
    } else if (type === 'connection') {
      newModel.connections = newModel.connections.filter(c => c.id !== id);
      if (newModel.visualConnections) {
        newModel.visualConnections = newModel.visualConnections.filter(c => c.id !== id);
      }
    }

    setModel(newModel);
    orgChartService.saveOrgChart(workspaceId, newModel);
    setSelectedElement(null);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // Position View Dashboard Component
  const renderPositionViewDashboard = () => {
    const activePos = model.positions.find(p => p.id === activePositionId) || model.positions[0];
    if (!activePos) {
      return (
        <div className="flex-1 flex items-center justify-center bg-[#01362D] text-white p-8 text-center">
          <p className="text-sm opacity-60 font-mono">No positions defined in this workspace.</p>
        </div>
      );
    }

    const posRoles = model.roles.filter(r => r.positionId === activePos.id);
    const posSops = model.sops.filter(s => s.ownerPositionId === activePos.id);
    const posEscalations = model.escalationPolicies.filter(e => e.fromPositionId === activePos.id || e.escalateToPositionId === activePos.id);

    return (
      <div className="flex-grow flex min-h-0 bg-[#013028] text-white font-sans w-full">
        {/* Left Side Position Selector Column */}
        <div className="w-72 border-r border-white/10 bg-[#012620]/75 flex flex-col min-h-0 shrink-0">
          <div className="p-4 border-b border-white/5 space-y-2">
            <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#D0D6BB]/60 text-left">Select Position</h4>
            <div className="relative">
              <input
                type="text"
                placeholder="filter seats..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 pl-7 text-[11px] text-white focus:outline-none focus:border-emerald-500 lowercase"
              />
              <Search className="w-3 h-3 text-[#D0D6BB]/50 absolute left-2.5 top-2.5" />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto p-2 space-y-1">
            {model.positions
              .filter(p => {
                if (searchQuery) {
                  return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.title.toLowerCase().includes(searchQuery.toLowerCase());
                }
                return true;
              })
              .map(p => {
                const isActive = p.id === activePos.id;
                const status = p.status || 'active';
                
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActivePositionId(p.id);
                      setSelectedElement({ type: 'position', id: p.id });
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                      isActive 
                        ? 'bg-[#00635C]/30 border-emerald-500/50 shadow-[0_2px_10px_rgba(0,0,0,0.2)]' 
                        : 'bg-transparent border-transparent hover:bg-white/5'
                    }`}
                  >
                    {status === 'active' || status === 'fractional' || status === 'outsourced' ? (
                      <OrgAvatar name={p.name} avatarUrl={p.avatarUrl} avatarCrop={p.avatarCrop} size={36} className="border border-white/10" />
                    ) : status === 'virtual_ai' ? (
                      <div className="w-[36px] h-[36px] rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0 text-xs">🤖</div>
                    ) : (
                      <div className="w-[36px] h-[36px] rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center shrink-0 text-xs font-bold">+</div>
                    )}
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex justify-between items-center gap-1">
                        <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                        {p.connectedTools && p.connectedTools.length > 0 && (
                          <div className="flex gap-0.5 shrink-0">
                            {p.connectedTools.slice(0, 3).map((tool) => {
                              const toolIcons: Record<string, any> = {
                                'Gmail': Mail,
                                'Google Calendar': Calendar,
                                'Google Drive': Folder,
                                'Rechat': Users,
                                'Dotloop': FileText,
                                'QuickBooks': Layers,
                                'Basecamp': Zap,
                                'Slack': MessageSquare,
                                'Canva': Palette,
                                'Microsoft Teams': MessageSquare
                              };
                              const ToolIcon = toolIcons[tool] || Zap;
                              return (
                                <ToolIcon key={tool} className="w-2.5 h-2.5 text-emerald-400" title={tool} />
                              );
                            })}
                            {p.connectedTools.length > 3 && (
                              <span className="text-[7px] text-[#D0D6BB]/50 font-mono font-bold">+{p.connectedTools.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] text-[#D0D6BB]/60 truncate font-mono uppercase">{p.title}</p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right Side Position Detail Dashboard */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Dashboard Profile Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-4">
              {activePos.status === 'active' || activePos.status === 'fractional' || activePos.status === 'outsourced' ? (
                <OrgAvatar name={activePos.name} avatarUrl={activePos.avatarUrl} avatarCrop={activePos.avatarCrop} size={72} className="border border-white/10 shadow-lg" />
              ) : activePos.status === 'virtual_ai' ? (
                <div className="w-[72px] h-[72px] rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-lg text-3xl">🤖</div>
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center shrink-0 shadow-lg text-[#D0D6BB]/40 text-xl font-bold">+</div>
              )}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-serif font-black tracking-tight text-white">{activePos.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[8px] font-mono uppercase font-bold">
                    {activePos.status || 'active'}
                  </span>
                </div>
                <p className="text-xs font-mono uppercase text-[#D0D6BB]/70">{activePos.title}</p>
                <div className="flex flex-wrap items-center gap-4 text-[10px] text-[#D0D6BB]/50 pt-1 font-mono">
                  {activePos.department && <span>Dept: <span className="text-[#D0D6BB]">{activePos.department}</span></span>}
                  {activePos.office && <span>Office: <span className="text-[#D0D6BB]">{activePos.office}</span></span>}
                  {activePos.connectedTools && activePos.connectedTools.length > 0 && (
                    <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                      <span className="text-[8px] text-[#D0D6BB]/40 uppercase font-bold">Connected Tools:</span>
                      <div className="flex items-center gap-1">
                        {activePos.connectedTools.map((tool) => {
                          const toolIcons: Record<string, any> = {
                            'Gmail': Mail,
                            'Google Calendar': Calendar,
                            'Google Drive': Folder,
                            'Rechat': Users,
                            'Dotloop': FileText,
                            'QuickBooks': Layers,
                            'Basecamp': Zap,
                            'Slack': MessageSquare,
                            'Canva': Palette,
                            'Microsoft Teams': MessageSquare
                          };
                          const ToolIcon = toolIcons[tool] || Zap;
                          return (
                            <span key={tool} className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/10 text-[8px] font-medium leading-none">
                              <ToolIcon className="w-2.5 h-2.5" />
                              {tool}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingId(activePos.id);
                setDrawerType('position');
                setDrawerMode('edit');
                setDrawerOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-colors shadow cursor-pointer"
            >
              Edit Seat Details
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles & Responsibilities */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5 text-left">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-teal-300 border-b border-white/5 pb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Responsibilities ({posRoles.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {posRoles.map(role => {
                  const roleSops = model.sops.filter(s => role.sopIds?.includes(s.id) || (s.roleId === role.id));
                  return (
                    <div key={role.id} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-1.5 text-left">
                      <h5 className="text-xs font-bold text-white">{role.name}</h5>
                      <p className="text-[10px] text-[#D0D6BB]/80 leading-relaxed">{role.description}</p>
                      {role.defaultSla && <div className="text-[8px] font-mono text-teal-400 mt-1 uppercase leading-none">SLA Window: {role.defaultSla}</div>}
                      
                      {roleSops.length > 0 && (
                        <div className="pt-1.5 border-t border-white/5 space-y-1">
                          <span className="text-[7.5px] font-mono uppercase text-[#D0D6BB]/40 block font-bold leading-none">Related SOPs:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {roleSops.map(s => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSopForModal(s);
                                  setSopModalOpen(true);
                                }}
                                className="text-[8.5px] text-emerald-400 font-sans hover:underline cursor-pointer bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.5 rounded text-left truncate max-w-[200px]"
                              >
                                📋 {s.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {posRoles.length === 0 && (
                  <p className="text-xs text-[#D0D6BB]/40 italic py-4">No responsibilities assigned to this seat.</p>
                )}
              </div>
            </div>

            {/* SOPs & Knowledge Documents */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5 text-left">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-green-300 border-b border-white/5 pb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                SOPs & Checklists ({posSops.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {posSops.map(sop => (
                  <button
                    key={sop.id}
                    type="button"
                    onClick={() => {
                      setSelectedSopForModal(sop);
                      setSopModalOpen(true);
                    }}
                    className="w-full text-left p-3 bg-black/20 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-xl space-y-1 transition-all cursor-pointer block"
                  >
                    <h5 className="text-xs font-bold text-white hover:underline">{sop.name}</h5>
                    <div className="text-[9px] text-[#D0D6BB] leading-normal"><span className="text-[#D0D6BB]/40 font-mono uppercase">Trigger:</span> {sop.trigger}</div>
                    <div className="text-[8px] text-green-400 mt-1 font-mono uppercase">Steps Checklist: {sop.steps.length} actions (Click to read)</div>
                  </button>
                ))}
                {posSops.length === 0 && (
                  <p className="text-xs text-[#D0D6BB]/40 italic py-4">No SOP documentation owned by this seat.</p>
                )}
              </div>
            </div>
            
            {/* Escalation Policy Paths */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5 text-left">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-amber-300 border-b border-white/5 pb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Escalation Fallbacks ({posEscalations.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {posEscalations.map(esc => {
                  const targetName = model.positions.find(p => p.id === esc.escalateToPositionId)?.name || 'Principal Broker';
                  return (
                    <button
                      key={esc.id}
                      type="button"
                      onClick={() => {
                        setSelectedEscalationForModal(esc);
                        setEscalationModalOpen(true);
                      }}
                      className="w-full text-left p-3 bg-black/20 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 rounded-xl space-y-1 transition-all cursor-pointer block"
                    >
                      <h5 className="text-xs font-bold text-white hover:underline">{esc.name}</h5>
                      <div className="text-[9px] text-[#D0D6BB]"><span className="text-amber-400 font-bold uppercase text-[7px] font-mono pr-1">{esc.urgency}</span> Escalates to: <span className="text-white font-bold">{targetName}</span></div>
                      <div className="text-[8px] text-[#D0D6BB]/60 font-mono uppercase">SLA fallback: {esc.responseWindow}</div>
                    </button>
                  );
                })}
                {posEscalations.length === 0 && (
                  <p className="text-xs text-[#D0D6BB]/40 italic py-4">No escalation triggers configured for this seat.</p>
                )}
              </div>
            </div>

            {/* Operating Model Details */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 text-left">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[#D0D6BB] border-b border-white/5 pb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Operating Matrix
              </h4>
              
              <div className="space-y-3 font-mono text-[10px] text-[#D0D6BB]">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>Reports To:</span>
                  <span className="text-white">{model.positions.find(p => p.id === activePos.reportsToPositionId)?.name || '(Top Level Broker)'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>Backup Seat Owner:</span>
                  <span className="text-white">{model.positions.find(p => p.id === activePos.backupPositionId)?.name || '(None)'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>Urgency priority:</span>
                  <span className="text-amber-400 font-bold uppercase">{activePos.priority || 'Normal'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>Estimated Cost / Budget:</span>
                  <span className="text-emerald-400 font-bold">{activePos.estimatedCost || 'N/A'}</span>
                </div>
              </div>

              {activePos.businessCase && (
                <div className="space-y-1 text-xs">
                  <h5 className="text-[9px] font-mono text-[#D0D6BB]/50 uppercase tracking-wider">Business Case / Gaps</h5>
                  <p className="p-3 bg-black/20 border border-white/5 rounded-xl text-[#D0D6BB] leading-relaxed text-[11px] font-sans">{activePos.businessCase}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Left Node Palette Component
  const renderLeftNodePalette = () => {
    const paletteItems = [
      { type: 'position', label: 'Position / Seat', desc: 'Active, open, or AI seat', icon: User, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' },
      { type: 'role', label: 'Role / Responsibility', desc: 'Accountability owned by seat', icon: Layers, color: 'text-teal-400 border-teal-500/30 bg-teal-950/20' },
      { type: 'sop', label: 'SOP / Knowledge', desc: 'Guidance and checklists', icon: BookOpen, color: 'text-green-400 border-green-500/30 bg-green-950/20' },
      { type: 'escalation', label: 'Escalation Policy', desc: 'SLA priority routing fallback', icon: AlertTriangle, color: 'text-amber-400 border-amber-500/30 bg-amber-950/20' },
      { type: 'logic_split', label: 'Logic Split', desc: 'Conditional branch route', icon: Shield, color: 'text-violet-400 border-violet-500/30 bg-violet-950/20' },
      { type: 'intake_trigger', label: 'Intake Trigger', desc: 'Inbound channel entry point', icon: Play, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20' }
    ] as const;

    return (
      <div className="w-64 border-r border-white/10 bg-[#012a23]/95 backdrop-blur-md p-4 flex flex-col gap-4 shrink-0 text-white font-sans">
        <div className="space-y-1">
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#D0D6BB]">Add to canvas</h3>
          <p className="text-[10px] text-[#D0D6BB]/60 leading-relaxed">Click any node to spawn it at the center of the active canvas.</p>
        </div>
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
          {paletteItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => handleAddPaletteNode(item.type)}
                className={`w-full text-left p-3 rounded-xl border hover:border-white/30 hover:bg-white/5 transition-all flex gap-3 items-start group cursor-pointer ${item.color}`}
              >
                <div className="p-2 rounded-lg bg-black/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold truncate">{item.label}</h4>
                  <p className="text-[9px] opacity-70 leading-normal line-clamp-2">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Right Inspector HUD component
  const renderRightInspector = () => {
    if (!selectedElement) {
      return null;
    }

    const { type, id } = selectedElement;

    if (type === 'position') {
      const pos = model.positions.find(p => p.id === id);
      if (!pos) return null;

      const posRoles = model.roles.filter(r => r.positionId === pos.id || pos.roleIds?.includes(r.id));
      const posSops = model.sops.filter(s => s.ownerPositionId === pos.id);
      const posKbs = model.knowledgeDocuments?.filter(d => d.ownerPositionId === pos.id) || [];
      const backupName = model.positions.find(p => p.id === pos.backupPositionId)?.name || 'None';
      const backupForPositions = model.positions.filter(p => p.backupPositionId === pos.id);
      const backupRoles = model.roles.filter(r => r.backupOwnerPositionId === pos.id);
      const backupSops = model.sops.filter(s => s.backupPositionId === pos.id);
      const backupRouting = (model.routingMatrix || []).filter(r => r.backupOwnerPositionId === pos.id);
      const backupPositions = model.positions.filter(p => p.backupPositionId === pos.id);

      return (
        <div className="w-80 border-l border-white/10 bg-[#012a23]/95 backdrop-blur-md p-5 flex flex-col gap-4 shrink-0 text-white font-sans overflow-y-auto inspector-panel-container">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400">Position Node</span>
              <h3 className="text-sm font-bold truncate max-w-[200px]">{pos.name}</h3>
            </div>
            <button onClick={() => setSelectedElement(null)} className="text-[#D0D6BB]/50 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Full Name</label>
              <input
                type="text"
                value={pos.name}
                onChange={e => handleUpdateElementInline('name', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Seat Title</label>
              <input
                type="text"
                value={pos.title}
                onChange={e => handleUpdateElementInline('title', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Seat Status</label>
              <select
                value={pos.status || 'active'}
                onChange={e => handleUpdateElementInline('status', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="active">Active Seat</option>
                <option value="open">Open / Vacant</option>
                <option value="planned">Planned (Future)</option>
                <option value="wanted">Wanted (Gap)</option>
                <option value="fractional">Fractional</option>
                <option value="outsourced">Outsourced</option>
                <option value="virtual_ai">AI / Virtual Role</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Department</label>
              <input
                type="text"
                value={pos.department || ''}
                onChange={e => handleUpdateElementInline('department', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Reports To</label>
              <select
                value={pos.reportsToPositionId || ''}
                onChange={e => handleUpdateElementInline('reportsToPositionId', e.target.value || undefined)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">(None - Top Level)</option>
                {model.positions.filter(p => p.id !== pos.id).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Backup Seat Owner</label>
              <select
                value={pos.backupPositionId || ''}
                onChange={e => handleUpdateElementInline('backupPositionId', e.target.value || undefined)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">(None)</option>
                {model.positions.filter(p => p.id !== pos.id).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Calculated Backup</span>
              <div className="px-3 py-2 bg-black/30 border border-white/5 rounded-lg text-emerald-400 font-bold">
                {backupName}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Assigned Roles</span>
                <button
                  type="button"
                  onClick={() => openAddDrawer('role')}
                  className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Add</span>
                </button>
              </div>
              <div className="space-y-1">
                {posRoles.map(r => (
                  <div key={r.id} className="p-2.5 bg-black/20 border border-white/5 rounded-xl text-left">
                    <div className="font-bold text-teal-300 text-[11px]">{r.name}</div>
                    <div className="text-[10px] text-[#D0D6BB]/70 mt-0.5 line-clamp-2 leading-relaxed">{r.description}</div>
                  </div>
                ))}
                {posRoles.length === 0 && (
                  <span className="text-[10px] text-[#D0D6BB]/40 italic block">No roles assigned.</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">SOPs & Knowledge Bases</span>
                <button
                  type="button"
                  onClick={() => openAddDrawer('sop')}
                  className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Add</span>
                </button>
              </div>
              <div className="space-y-1">
                {posSops.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSopForModal(s);
                      setSopModalOpen(true);
                    }}
                    className="w-full text-left p-2.5 bg-black/20 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-xl transition-all cursor-pointer block"
                  >
                    <div className="font-bold text-green-300 text-[11px] hover:underline">{s.name}</div>
                    <div className="text-[9px] text-[#D0D6BB]/60 mt-0.5">Trigger: {s.trigger}</div>
                    <span className="text-[8px] text-green-400 font-mono block mt-1 uppercase">Click to read document</span>
                  </button>
                ))}
                {posKbs.map(d => (
                  <div key={d.id} className="p-2.5 bg-black/20 border border-white/5 rounded-xl text-left">
                    <div className="font-bold text-sky-300 text-[11px]">{d.title}</div>
                    <div className="text-[9px] text-[#D0D6BB]/65 mt-0.5">File: {d.fileName} ({d.documentType})</div>
                    {d.aiSummary && <div className="text-[9px] text-[#D0D6BB]/40 mt-1 italic">{d.aiSummary}</div>}
                  </div>
                ))}
                {posSops.length === 0 && posKbs.length === 0 && (
                  <span className="text-[10px] text-[#D0D6BB]/40 italic block">No SOPs or Knowledge bases documented.</span>
                )}
              </div>
            </div>

            {/* Unified Backup Coverage & Responsibilities */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 block font-bold">Backup Coverage</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(pos.id);
                    setDrawerType('position');
                    setDrawerMode('edit');
                    setDrawerOpen(true);
                  }}
                  className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[9px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Add</span>
                </button>
              </div>
              <div className="space-y-1.5">
                {backupPositions.map(bp => (
                  <div key={bp.id} className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-left text-[10px]">
                    <span className="font-bold text-amber-300">Seat Backup for:</span> <span className="text-white">{bp.name} ({bp.title})</span>
                  </div>
                ))}
                
                {backupRoles.map(br => (
                  <div key={br.id} className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-left text-[10px]">
                    <span className="font-bold text-amber-300">Backup for Role:</span> <span className="text-white">{br.name}</span>
                  </div>
                ))}

                {backupSops.map(bs => (
                  <div key={bs.id} className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-left text-[10px]">
                    <span className="font-bold text-amber-300">Backup for SOP:</span> <span className="text-white">{bs.name}</span>
                  </div>
                ))}

                {backupRouting.map((br, rIdx) => (
                  <div key={rIdx} className="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-left text-[10px]">
                    <span className="font-bold text-amber-300">Backup for Request:</span> <span className="text-white">{br.category}</span>
                  </div>
                ))}

                {backupPositions.length === 0 && backupRoles.length === 0 && backupSops.length === 0 && backupRouting.length === 0 && (
                  <span className="text-[10px] text-[#D0D6BB]/40 italic block">No backup coverage assigned.</span>
                )}
              </div>
            </div>

            {/* Export Profile PDF & Open Full Settings */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setAutoExportPdf(true);
                  setActiveProfilePerson({
                    id: pos.id,
                    displayName: pos.name || pos.title,
                    email: pos.email || '',
                    phone: pos.phone || '',
                    photoUrl: pos.photoUrl || '',
                    title: pos.title,
                    status: pos.status || 'active',
                    personType: 'staff',
                    primaryOfficeName: pos.office || 'Wilmington'
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white border border-emerald-400/30 rounded-xl font-bold font-mono text-[10px] uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Profile (PDF)</span>
              </button>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(pos.id);
                    setDrawerType('position');
                    setDrawerMode('edit');
                    setDrawerOpen(true);
                  }}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold font-mono text-[10px] uppercase text-center cursor-pointer transition-colors"
                >
                  Open Full Settings
                </button>
              </div>
            </div>

            <button
              onClick={handleDeleteSelectedElement}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-4 text-xs font-mono uppercase text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Node
            </button>
          </div>
        </div>
      );
    }

    if (type === 'sop') {
      const sop = model.sops.find(s => s.id === id);
      if (!sop) return null;

      return (
        <div className="w-80 border-l border-white/10 bg-[#012a23]/95 backdrop-blur-md p-5 flex flex-col gap-4 shrink-0 text-white font-sans overflow-y-auto inspector-panel-container">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400">SOP Node</span>
              <h3 className="text-sm font-bold truncate max-w-[200px]">{sop.name}</h3>
            </div>
            <button onClick={() => setSelectedElement(null)} className="text-[#D0D6BB]/50 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">SOP Title</label>
              <input
                type="text"
                value={sop.name}
                onChange={e => handleUpdateElementInline('name', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Intake Trigger</label>
              <input
                type="text"
                value={sop.trigger}
                onChange={e => handleUpdateElementInline('trigger', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Owner Position</label>
              <select
                value={sop.ownerPositionId || ''}
                onChange={e => handleUpdateElementInline('ownerPositionId', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {model.positions.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Purpose</label>
              <textarea
                value={sop.purpose || ''}
                onChange={e => handleUpdateElementInline('purpose', e.target.value)}
                rows={3}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-sans text-xs resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingId(sop.id);
                setDrawerType('sop');
                setDrawerMode('edit');
                setDrawerOpen(true);
              }}
              className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold font-mono text-[10px] uppercase text-center cursor-pointer transition-colors"
            >
              Open Full SOP Editor
            </button>

            <button
              onClick={handleDeleteSelectedElement}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-4 text-xs font-mono uppercase text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Node
            </button>
          </div>
        </div>
      );
    }

    if (type === 'escalation') {
      const esc = model.escalationPolicies.find(e => e.id === id);
      if (!esc) return null;

      return (
        <div className="w-80 border-l border-white/10 bg-[#012a23]/95 backdrop-blur-md p-5 flex flex-col gap-4 shrink-0 text-white font-sans overflow-y-auto inspector-panel-container">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400">Escalation Policy</span>
              <h3 className="text-sm font-bold truncate max-w-[200px]">{esc.name}</h3>
            </div>
            <button onClick={() => setSelectedElement(null)} className="text-[#D0D6BB]/50 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Policy Name</label>
              <input
                type="text"
                value={esc.name}
                onChange={e => handleUpdateElementInline('name', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Trigger event</label>
              <input
                type="text"
                value={esc.trigger}
                onChange={e => handleUpdateElementInline('trigger', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">SLA Window</label>
              <input
                type="text"
                value={esc.responseWindow}
                onChange={e => handleUpdateElementInline('responseWindow', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Escalate To Seat</label>
              <select
                value={esc.escalateToPositionId || ''}
                onChange={e => handleUpdateElementInline('escalateToPositionId', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {model.positions.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Urgency Level</label>
              <select
                value={esc.urgency}
                onChange={e => handleUpdateElementInline('urgency', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">URGENT fallback</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingId(esc.id);
                setDrawerType('escalation');
                setDrawerMode('edit');
                setDrawerOpen(true);
              }}
              className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold font-mono text-[10px] uppercase text-center cursor-pointer transition-colors"
            >
              Open Full Policy Editor
            </button>

            <button
              onClick={handleDeleteSelectedElement}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-4 text-xs font-mono uppercase text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Node
            </button>
          </div>
        </div>
      );
    }

    if (type === 'logic_split' || type === 'intake_trigger') {
      const node = model.logicNodes?.find(l => l.id === id);
      if (!node) return null;

      return (
        <div className="w-80 border-l border-white/10 bg-[#012a23]/95 backdrop-blur-md p-5 flex flex-col gap-4 shrink-0 text-white font-sans overflow-y-auto inspector-panel-container">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-violet-400">{type === 'logic_split' ? 'Logic Split' : 'Intake Trigger'}</span>
              <h3 className="text-sm font-bold truncate max-w-[200px]">{node.label}</h3>
            </div>
            <button onClick={() => setSelectedElement(null)} className="text-[#D0D6BB]/50 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Label / Name</label>
              <input
                type="text"
                value={node.label}
                onChange={e => handleUpdateElementInline('label', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Description</label>
              <textarea
                value={node.description || ''}
                onChange={e => handleUpdateElementInline('description', e.target.value)}
                rows={3}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-sans text-xs resize-none"
              />
            </div>

            {type === 'logic_split' && (
              <div className="space-y-2">
                <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60 block">Routing Branch Options</label>
                <div className="space-y-1.5">
                  {(node.conditions || []).map((cond, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={cond}
                        onChange={e => {
                          const branches = [...(node.conditions || [])];
                          branches[idx] = e.target.value;
                          handleUpdateElementInline('conditions', branches);
                        }}
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const branches = (node.conditions || []).filter((_, i) => i !== idx);
                          handleUpdateElementInline('conditions', branches);
                        }}
                        className="p-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const branches = [...(node.conditions || []), `Branch Option ${ (node.conditions || []).length + 1 }`];
                      handleUpdateElementInline('conditions', branches);
                    }}
                    className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 rounded-lg text-[10px] font-bold text-center cursor-pointer transition-colors"
                  >
                    + Add Condition Path
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleDeleteSelectedElement}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-4 text-xs font-mono uppercase text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Node
            </button>
          </div>
        </div>
      );
    }

    if (type === 'connection') {
      const conn = getVisualConnections().find(c => c.id === id);
      if (!conn) return null;

      const fromPos = model.positions.find(p => p.id === conn.fromPositionId);
      const toPos = model.positions.find(p => p.id === conn.toPositionId);

      const getPosDetails = (pos: any) => {
        if (!pos) return null;
        const posRoles = model.roles.filter(r => r.positionId === pos.id || pos.roleIds?.includes(r.id));
        const posSops = model.sops.filter(s => s.ownerPositionId === pos.id);
        const posKbs = model.knowledgeDocuments?.filter(d => d.ownerPositionId === pos.id) || [];
        return { pos, roles: posRoles, sops: posSops, kbs: posKbs };
      };

      const fromDetails = getPosDetails(fromPos);
      const toDetails = getPosDetails(toPos);

      return (
        <div className="w-80 border-l border-white/10 bg-[#012a23]/95 backdrop-blur-md p-5 flex flex-col gap-4 shrink-0 text-white font-sans overflow-y-auto inspector-panel-container">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#10b981]">Connection Path</span>
              <h3 className="text-sm font-bold truncate max-w-[200px]">{conn.label || 'Connection Path'}</h3>
            </div>
            <button onClick={() => setSelectedElement(null)} className="text-[#D0D6BB]/50 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Path Label</label>
              <input
                type="text"
                value={conn.label || ''}
                onChange={e => handleUpdateElementInline('label', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Path Condition</label>
              <input
                type="text"
                value={conn.condition || ''}
                onChange={e => handleUpdateElementInline('condition', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. if category === 'Marketing'"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Response Window (SLA)</label>
              <input
                type="text"
                value={conn.responseWindow || ''}
                onChange={e => handleUpdateElementInline('responseWindow', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                placeholder="24 hours"
              />
            </div>

            {/* Connected Seats Details Accordion */}
            <div className="space-y-3.5 border-t border-white/5 pt-3.5">
              <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400">Connected Positions</h4>
              
              {fromDetails && (
                <div className="p-3 bg-black/25 border border-white/5 rounded-xl space-y-2">
                  <div>
                    <span className="text-[8px] font-mono uppercase text-[#D0D6BB]/50 block">Source / Parent</span>
                    <strong className="text-white text-xs block">{fromDetails.pos.name}</strong>
                    <span className="text-[9px] text-[#D0D6BB]/70">{fromDetails.pos.title}</span>
                  </div>
                  
                  {fromDetails.roles.length > 0 && (
                    <div className="text-[9px] text-[#D0D6BB]/80">
                      <span className="text-[#D0D6BB]/50 block font-mono text-[8px] uppercase">Roles:</span>
                      <div className="pl-1.5 border-l border-white/5 mt-0.5 space-y-0.5">
                        {fromDetails.roles.map(r => <div key={r.id} className="text-teal-300 font-medium truncate">{r.name}</div>)}
                      </div>
                    </div>
                  )}

                  {fromDetails.sops.length > 0 && (
                    <div className="text-[9px] text-[#D0D6BB]/80">
                      <span className="text-[#D0D6BB]/50 block font-mono text-[8px] uppercase">SOPs:</span>
                      <div className="pl-1.5 border-l border-white/5 mt-0.5 space-y-0.5">
                        {fromDetails.sops.map(s => <div key={s.id} className="text-green-300 font-medium truncate">{s.name}</div>)}
                      </div>
                    </div>
                  )}

                  {fromDetails.kbs.length > 0 && (
                    <div className="text-[9px] text-[#D0D6BB]/80">
                      <span className="text-[#D0D6BB]/50 block font-mono text-[8px] uppercase">Knowledge:</span>
                      <div className="pl-1.5 border-l border-white/5 mt-0.5 space-y-0.5">
                        {fromDetails.kbs.map(k => <div key={k.id} className="text-sky-300 font-medium truncate">{k.title}</div>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {toDetails && (
                <div className="p-3 bg-black/25 border border-white/5 rounded-xl space-y-2">
                  <div>
                    <span className="text-[8px] font-mono uppercase text-[#D0D6BB]/50 block">Target / Child</span>
                    <strong className="text-white text-xs block">{toDetails.pos.name}</strong>
                    <span className="text-[9px] text-[#D0D6BB]/70">{toDetails.pos.title}</span>
                  </div>
                  
                  {toDetails.roles.length > 0 && (
                    <div className="text-[9px] text-[#D0D6BB]/80">
                      <span className="text-[#D0D6BB]/50 block font-mono text-[8px] uppercase">Roles:</span>
                      <div className="pl-1.5 border-l border-white/5 mt-0.5 space-y-0.5">
                        {toDetails.roles.map(r => <div key={r.id} className="text-teal-300 font-medium truncate">{r.name}</div>)}
                      </div>
                    </div>
                  )}

                  {toDetails.sops.length > 0 && (
                    <div className="text-[9px] text-[#D0D6BB]/80">
                      <span className="text-[#D0D6BB]/50 block font-mono text-[8px] uppercase">SOPs:</span>
                      <div className="pl-1.5 border-l border-white/5 mt-0.5 space-y-0.5">
                        {toDetails.sops.map(s => <div key={s.id} className="text-green-300 font-medium truncate">{s.name}</div>)}
                      </div>
                    </div>
                  )}

                  {toDetails.kbs.length > 0 && (
                    <div className="text-[9px] text-[#D0D6BB]/80">
                      <span className="text-[#D0D6BB]/50 block font-mono text-[8px] uppercase">Knowledge:</span>
                      <div className="pl-1.5 border-l border-white/5 mt-0.5 space-y-0.5">
                        {toDetails.kbs.map(k => <div key={k.id} className="text-sky-300 font-medium truncate">{k.title}</div>)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleDeleteSelectedElement}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-4 text-xs font-mono uppercase text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Disconnect Path
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render visual org map
  function renderVisualOrgMap() {
    const getNodeCoordinates = (nodeId: string): { x: number; y: number } | null => {
      const pos = model.positions.find(p => p.id === nodeId);
      if (pos) return { x: pos.x || 0, y: pos.y || 0 };
      const role = model.roles.find(r => r.id === nodeId);
      if (role) return { x: role.x || 0, y: role.y || 0 };
      const sop = model.sops.find(s => s.id === nodeId);
      if (sop) return { x: sop.x || 0, y: sop.y || 0 };
      const esc = model.escalationPolicies.find(e => e.id === nodeId);
      if (esc) return { x: esc.x || 0, y: esc.y || 0 };
      const ln = model.logicNodes?.find(n => n.id === nodeId);
      if (ln) return { x: ln.x || 0, y: ln.y || 0 };
      return null;
    };

    const visualConns = getVisualConnections();
    
    // Filter positions based on visibility checkbox states
    const visiblePositions = model.positions.filter(p => {
      const status = p.status || 'active';
      const title = (p.title || '').toLowerCase();
      const isLeadershipOrStaff = ['pos_ryan', 'pos_coo', 'pos_ann', 'pos_james', 'pos_melissa', 'pos_bic', 'pos_eric', 'pos_va', 'pos_front_desk', 'pos_ai_ops'].includes(p.id) ||
        p.department === 'Leadership' ||
        p.department === 'Operations' ||
        p.department === 'Accounting' ||
        p.department === 'Marketing' ||
        p.department === 'Brokers-in-Charge' ||
        title.includes('broker-in-charge') ||
        title.includes('broker in charge') ||
        title.includes('director') ||
        title.includes('principal') ||
        title.includes('chief');
      const isAgentPos = !isLeadershipOrStaff;

      if (isAgentPos && !showAgents) return false;
      if (status === 'active' && !showActive) return false;
      if (status === 'open' && !showOpenRoles) return false;
      if (status === 'planned' && !showPlannedRoles) return false;
      if (status === 'wanted' && !showPlannedRoles) return false;
      if (status === 'fractional' && !showActive) return false;
      if (status === 'outsourced' && !showActive) return false;
      if (status === 'virtual_ai' && !showVirtualAi) return false;
      return true;
    });

    // Filter connections based on visibility checkbox states and visible positions
    const filteredConns = visualConns.filter(c => {
      const fromVisible = visiblePositions.some(p => p.id === c.fromPositionId);
      const toVisible = visiblePositions.some(p => p.id === c.toPositionId);
      if (!fromVisible || !toVisible) return false;

      if (c.type === 'reporting') return showReportingLines;
      if (c.type === 'escalation') return showEscalationLines;
      if (c.type === 'sop') return showSopLines;
      return true;
    });

    console.log('[VISUAL MAP]', {
      positions: model.positions.length,
      filteredPositions: visiblePositions.length,
      connections: filteredConns.length,
      canvasWidth: canvasContainerRef.current?.clientWidth || 0,
      canvasHeight: canvasContainerRef.current?.clientHeight || 0,
      pan,
      zoom
    });

    if (model.positions.length === 0) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center bg-[#01362D] text-white p-8 space-y-6 min-h-[500px]">
          <div className="text-[#D0D6BB] text-center max-w-sm">
            <h3 className="text-sm font-serif font-black uppercase tracking-wider text-white">No org positions found</h3>
            <p className="text-xs opacity-80 mt-2 leading-relaxed">Load the Brokerage Default template or add your first position to begin building your operational map.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => applyTemplate('Brokerage Default')}
              className="px-4 py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] shadow-md rounded-xl text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition-colors"
            >
              Load Brokerage Template
            </button>
            <button
              onClick={() => openAddDrawer('position')}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition-colors"
            >
              Add Position
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-grow flex flex-col min-h-0 text-left relative select-none">
        {/* Toolbar */}
        <div className="sticky top-0 z-30 px-3 py-1.5 bg-[#012a23]/92 backdrop-blur-md border-b border-white/10 flex flex-row items-center justify-between gap-1.5 font-mono text-[8px] uppercase shrink-0 visual-org-map-toolbar overflow-x-auto whitespace-nowrap scrollbar-none">
          {/* Left Group */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Switcher */}
            <div className="flex gap-0.5 bg-black/25 p-0.5 rounded-md border border-white/5 shrink-0">
              {[
                { mode: 'org', label: 'Org View', icon: Layers },
                { mode: 'position', label: 'Position View', icon: User }
              ].map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setActiveViewMode(mode as any);
                    setSelectedElement(null);
                  }}
                  className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                    activeViewMode === mode
                      ? 'bg-[#00635C] text-white shadow'
                      : 'text-[#D0D6BB]/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {label}
                </button>
              ))}
            </div>



            {activeViewMode !== 'position' && (
              <>
                <button
                  type="button"
                  onClick={() => openAddDrawer('position')}
                  className="px-2 py-1 bg-[#00635C] hover:bg-[#004d47] text-white border border-white/10 rounded-md font-bold cursor-pointer text-[8px]"
                >
                  + Add Position
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const defaultFrom = selectedElement && selectedElement.type === 'position' ? selectedElement.id : '';
                    setConnFrom(defaultFrom);
                    setConnTo('');
                    setConnLabel('');
                    setConnCondition('');
                    setConnWindow('24 hours');
                    setConnSops([]);
                    setConnEscalations([]);
                    setSelectedConnectionId(null);
                    setConnType('reporting');
                    setConnectionDrawerOpen(true);
                  }}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-md font-bold cursor-pointer text-[8px]"
                >
                  + Connect
                </button>
                <button
                  type="button"
                  onClick={handleFitView}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-md font-bold cursor-pointer text-[8px]"
                >
                  Fit View
                </button>
                <button
                  type="button"
                  onClick={handlePrintMap}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white border border-white/20 rounded-md font-bold cursor-pointer flex items-center gap-1 text-[8px] print:hidden"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Map
                </button>
              </>
            )}
          </div>

          {/* Center & Right Combined Group */}
          {activeViewMode !== 'position' && (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Inline Filters */}
              <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                {[
                  { label: 'Show Agents', checked: showAgents, setter: setShowAgents, color: 'accent-emerald-400' },
                  { label: 'Active', checked: showActive, setter: setShowActive, color: 'accent-emerald-500' },
                  { label: 'Vacant', checked: showOpenRoles, setter: setShowOpenRoles, color: 'accent-red-500' },
                  { label: 'Planned Gaps', checked: showPlannedRoles, setter: setShowPlannedRoles, color: 'accent-sky-500' },
                  { label: 'AI/Virtual', checked: showVirtualAi, setter: setShowVirtualAi, color: 'accent-emerald-400' },
                  { label: 'Reporting Lines', checked: showReportingLines, setter: setShowReportingLines, color: 'accent-emerald-500' },
                  { label: 'Escalations', checked: showEscalationLines, setter: setShowEscalationLines, color: 'accent-amber-500' },
                  { label: 'SOP Links', checked: showSopLines, setter: setShowSopLines, color: 'accent-green-500' }
                ].map((f, fIdx) => (
                  <label key={fIdx} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/25 border border-white/5 text-[#D0D6BB] text-[8px] font-mono cursor-pointer hover:bg-white/5 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={f.checked}
                      onChange={() => f.setter(!f.checked)}
                      className={`rounded ${f.color} bg-black/30 border-white/20 w-2.5 h-2.5`}
                    />
                    {f.label}
                  </label>
                ))}
              </div>

              {/* Planning Mode Checkbox */}
              <label className="flex items-center gap-1 px-2 py-0.5 border border-amber-500/30 bg-amber-500/10 rounded-md text-amber-300 font-bold uppercase tracking-wider text-[8px] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={planningMode}
                  onChange={(e) => setPlanningMode(e.target.checked)}
                  className="rounded accent-amber-500 bg-black/30 border-white/20 w-2.5 h-2.5"
                />
                Planning Mode
              </label>
            </div>
          )}
        </div>

        {/* Main Workspace Area */}
        <div className="flex-grow flex min-h-0 relative">
          
          {/* Left Node Palette (Workflow View Only) */}
          {activeViewMode === 'workflow' && renderLeftNodePalette()}
          
          {/* Center Canvas or Position View Dashboard */}
          {activeViewMode === 'position' ? (
            renderPositionViewDashboard()
          ) : (
            <div 
              ref={canvasContainerRef}
              className="flex-grow min-h-0 relative overflow-hidden cursor-grab active:cursor-grabbing border-t border-white/10 visual-org-map-canvas-shell"
              style={{
                backgroundImage: activeViewMode === 'workflow'
                  ? 'radial-gradient(rgba(246, 247, 241, 0.12) 1.2px, transparent 1.2px), radial-gradient(circle at center, #014c3f 0%, #01241e 100%)'
                  : 'radial-gradient(rgba(246, 247, 241, 0.08) 1.2px, transparent 1.2px), radial-gradient(circle at center, #014c3f 0%, #01241e 100%)',
                backgroundSize: '20px 20px, 100% 100%'
              }}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest('.canvas-node-card') || (e.target as HTMLElement).closest('.connection-line')) return;
                setIsPanning(true);
                setPanStart({ x: e.clientX, y: e.clientY, x_val: pan.x, y_val: pan.y });
              }}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={() => {
                setIsPanning(false);
                if (draggedNodeId) {
                  orgChartService.saveOrgChart(workspaceId, model);
                }
                setDraggedNodeId(null);
              }}
              onPointerLeave={() => {
                setIsPanning(false);
                if (draggedNodeId) {
                  orgChartService.saveOrgChart(workspaceId, model);
                }
                setDraggedNodeId(null);
              }}
              onWheel={(e) => {
                const zoomDelta = -e.deltaY * 0.001;
                setZoom(prev => Math.min(2.0, Math.max(0.5, prev + zoomDelta)));
              }}
            >
              {/* Zoom/Pan wrapper */}
              <div 
                className="absolute inset-0 origin-top-left transition-transform duration-75 pointer-events-none"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  width: '4000px',
                  height: '3000px'
                }}
              >
                {/* SVG connection lines */}
                <style>{`
                  @media print {
                    @page {
                      size: landscape !important;
                      margin: 0 !important;
                    }
                    
                    body * {
                      visibility: hidden !important;
                    }
                    
                    .visual-org-map-canvas-shell,
                    .visual-org-map-canvas-shell * {
                      visibility: visible !important;
                    }
                    
                    .visual-org-map-canvas-shell {
                      position: fixed !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100vw !important;
                      height: 100vh !important;
                      background-color: #ffffff !important;
                      background-image: none !important;
                      overflow: visible !important;
                      border: none !important;
                      z-index: 99999 !important;
                    }
                    
                    body {
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                      background-color: #ffffff !important;
                      color: #0f172a !important;
                    }

                    /* Print-friendly high-contrast seat cards */
                    .canvas-node-card {
                      background-color: #ffffff !important;
                      background: #ffffff !important;
                      border: 2px solid #0f172a !important;
                      box-shadow: none !important;
                    }

                    .canvas-node-card h4,
                    .canvas-node-card span,
                    .canvas-node-card div,
                    .canvas-node-card h5,
                    .canvas-node-card li {
                      color: #0f172a !important;
                    }

                    .canvas-node-card border-b {
                      border-color: rgba(15, 23, 42, 0.15) !important;
                    }

                    /* Make connection paths high-contrast */
                    .connection-line path {
                      stroke-opacity: 1 !important;
                    }

                    /* Hide the flowing running neon overlays to save ink */
                    .flowing-glow-line {
                      display: none !important;
                      visibility: hidden !important;
                    }
                    
                    .print-hidden, button, input, .visual-org-map-toolbar, .sticky-mode-switcher {
                      display: none !important;
                      visibility: hidden !important;
                    }
                  }

                  /* Wilmington Pilot Glow & Flow Animations */
                  @keyframes ryan-pulse {
                    0%, 100% {
                      box-shadow: 0 0 10px rgba(16, 185, 129, 0.3), 0 0 2px rgba(16, 185, 129, 0.1);
                      border-color: rgba(16, 185, 129, 0.4);
                    }
                    50% {
                      box-shadow: 0 0 22px rgba(16, 185, 129, 0.75), 0 0 8px rgba(16, 185, 129, 0.3);
                      border-color: rgba(16, 185, 129, 0.8);
                    }
                  }
                  .ryan-node-card {
                    animation: ryan-pulse 3.5s infinite ease-in-out !important;
                    border-color: rgba(16, 185, 129, 0.5) !important;
                  }
                  
                  @keyframes running-glow {
                    to {
                      stroke-dashoffset: -20;
                    }
                  }
                  .flowing-glow-line {
                    stroke-dasharray: 6, 14;
                    animation: running-glow 1.2s linear infinite;
                  }
                  
                  @keyframes border-neon {
                    0%, 100% { border-color: rgba(16, 185, 129, 0.3); }
                    50% { border-color: rgba(52, 211, 153, 0.85); }
                  }
                  .ai-node-glow {
                    animation: border-neon 3s infinite ease-in-out;
                  }
                  
                  .canvas-node-card {
                    transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
                  }
                  .canvas-node-card:hover {
                    transform: translateY(-4px) scale(1.02) !important;
                    box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.4), 0 0 15px rgba(16, 185, 129, 0.25) !important;
                    border-color: rgba(16, 185, 129, 0.5) !important;
                  }
                  
                  @keyframes vacant-pulse {
                    0%, 100% {
                      box-shadow: 0 0 6px rgba(239, 68, 68, 0.15), 0 0 1px rgba(239, 68, 68, 0.1);
                      border-color: rgba(239, 68, 68, 0.25);
                    }
                    50% {
                      box-shadow: 0 0 14px rgba(239, 68, 68, 0.45), 0 0 5px rgba(239, 68, 68, 0.2);
                      border-color: rgba(239, 68, 68, 0.55);
                    }
                  }
                  .vacant-node-pulse {
                    animation: vacant-pulse 4s infinite ease-in-out !important;
                    border-style: dashed !important;
                  }

                  /* Mobile-responsive styles for the inspector panel */
                  @media (max-width: 767px) {
                    .role-map-root-container .inspector-panel-container {
                      position: fixed !important;
                      right: 0 !important;
                      top: 73px !important;
                      bottom: 0 !important;
                      z-index: 50 !important;
                      width: 85% !important;
                      max-width: 320px !important;
                      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.6) !important;
                      border-left: 1px solid rgba(255, 255, 255, 0.15) !important;
                      background-color: #01201b !important;
                    }
                    /* Hide stats inspector on mobile completely */
                    .role-map-root-container .inspector-stats-panel {
                      display: none !important;
                    }
                  }

                  /* Extra micro-animations */
                  @keyframes active-btn-pulse {
                    0%, 100% { box-shadow: 0 0 4px rgba(0, 99, 92, 0.4); }
                    50% { box-shadow: 0 0 12px rgba(0, 99, 92, 0.8), 0 0 2px rgba(52, 211, 153, 0.4); }
                  }
                  .pulse-active-btn {
                    animation: active-btn-pulse 2.5s infinite ease-in-out;
                  }

                  /* ── Staggered Card Entrance ────────────────────────── */
                  @keyframes orgCardEntrance {
                    0% {
                      opacity: 0;
                      transform: translateY(28px) scale(0.92);
                      filter: blur(4px);
                    }
                    60% {
                      opacity: 1;
                      filter: blur(0px);
                    }
                    100% {
                      opacity: 1;
                      transform: translateY(0) scale(1);
                      filter: blur(0px);
                    }
                  }
                  .canvas-node-card {
                    animation: orgCardEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
                  }
                  .canvas-node-card:nth-child(1)  { animation-delay: 0.04s; }
                  .canvas-node-card:nth-child(2)  { animation-delay: 0.09s; }
                  .canvas-node-card:nth-child(3)  { animation-delay: 0.14s; }
                  .canvas-node-card:nth-child(4)  { animation-delay: 0.19s; }
                  .canvas-node-card:nth-child(5)  { animation-delay: 0.24s; }
                  .canvas-node-card:nth-child(6)  { animation-delay: 0.29s; }
                  .canvas-node-card:nth-child(7)  { animation-delay: 0.34s; }
                  .canvas-node-card:nth-child(8)  { animation-delay: 0.39s; }
                  .canvas-node-card:nth-child(9)  { animation-delay: 0.44s; }
                  .canvas-node-card:nth-child(10) { animation-delay: 0.49s; }
                  .canvas-node-card:nth-child(n+11) { animation-delay: 0.54s; }

                  /* ── Idle Breathing Pulse (very subtle) ─────────────── */
                  @keyframes cardBreathe {
                    0%, 100% {
                      box-shadow: 0 4px 16px -3px rgba(0, 0, 0, 0.3), 0 0 0 rgba(16, 185, 129, 0);
                    }
                    50% {
                      box-shadow: 0 6px 22px -3px rgba(0, 0, 0, 0.35), 0 0 8px rgba(16, 185, 129, 0.06);
                    }
                  }
                  .canvas-node-card:not(:hover):not(.ryan-node-card):not(.ai-node-glow):not(.vacant-node-pulse) {
                    animation: orgCardEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards,
                               cardBreathe 5s ease-in-out infinite 1s;
                  }

                  /* ── Enhanced Card Hover ────────────────────────────── */

                  @keyframes grid-glow {
                    0%, 100% { opacity: 0.9; }
                    50% { opacity: 1; }
                  }
                  .visual-org-map-canvas-shell {
                    animation: grid-glow 6s infinite ease-in-out;
                  }

                  @keyframes sop-glow {
                    0%, 100% { background-color: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.15); }
                    50% { background-color: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.45); }
                  }
                  .sop-pulse-tag {
                    animation: sop-glow 3s infinite ease-in-out;
                  }

                  /* Redefine Tailwind text sizes for our page wrapper to bump up font size by 2px to 4px */
                  .role-map-root-container .text-\[6px\] { font-size: 9.5px !important; }
                  .role-map-root-container .text-\[6\.5px\] { font-size: 10px !important; }
                  .role-map-root-container .text-\[7px\] { font-size: 10.5px !important; }
                  .role-map-root-container .text-\[7\.5px\] { font-size: 11px !important; }
                  .role-map-root-container .text-\[8px\] { font-size: 11.5px !important; }
                  .role-map-root-container .text-\[8\.5px\] { font-size: 12px !important; }
                  .role-map-root-container .text-\[9px\] { font-size: 12.5px !important; }
                  .role-map-root-container .text-\[10px\] { font-size: 13.5px !important; }
                  .role-map-root-container .text-xs { font-size: 14.5px !important; }
                  .role-map-root-container .text-sm { font-size: 16.5px !important; }
                  .role-map-root-container .text-base { font-size: 18.5px !important; }
                  .role-map-root-container .text-lg { font-size: 20.5px !important; }
                  .role-map-root-container .text-xl { font-size: 23px !important; }
                  .role-map-root-container .text-2xl { font-size: 27px !important; }
                  .role-map-root-container .text-3xl { font-size: 32px !important; }
                  
                  /* Ensure inputs and selects also scale up */
                  .role-map-root-container input,
                  .role-map-root-container select,
                  .role-map-root-container textarea,
                  .role-map-root-container button {
                    font-size: 13.5px !important;
                  }

                  .role-map-root-container svg text {
                    font-size: 11px !important;
                  }
                `}</style>
                <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                  <defs>
                    <marker id="arrow-reporting" markerWidth="8" markerHeight="8" refX="28" refY="4" orient="auto">
                      <path d="M0,0 L8,4 L0,8 Z" fill="#D0D6BB" />
                    </marker>
                    <marker id="arrow-escalation" markerWidth="8" markerHeight="8" refX="28" refY="4" orient="auto">
                      <path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b" />
                    </marker>
                    <marker id="arrow-sop" markerWidth="8" markerHeight="8" refX="28" refY="4" orient="auto">
                      <path d="M0,0 L8,4 L0,8 Z" fill="#10b981" />
                    </marker>
                  </defs>
                  
                  {filteredConns.map((conn) => {
                    const fromCoords = getNodeCoordinates(conn.fromPositionId);
                    const toCoords = getNodeCoordinates(conn.toPositionId);
                    if (!fromCoords || !toCoords) return null;

                    const isWorkflow = activeViewMode === 'workflow';
                    const fromWidth = isWorkflow ? 240 : 300;
                    const toWidth = isWorkflow ? 240 : 300;
                    const fromHeight = isWorkflow ? 100 : 160;
                    const toHeight = isWorkflow ? 100 : 160;

                    let x1 = fromCoords.x + fromWidth / 2;
                    let y1 = fromCoords.y;
                    let x2 = toCoords.x + toWidth / 2;
                    let y2 = toCoords.y;

                    if (Math.abs(fromCoords.y - toCoords.y) < 50) {
                      // Horizontally aligned: connect left/right edges
                      y1 = fromCoords.y + fromHeight / 2;
                      y2 = toCoords.y + toHeight / 2;
                      if (fromCoords.x > toCoords.x) {
                        x1 = fromCoords.x;
                        x2 = toCoords.x + toWidth;
                      } else {
                        x1 = fromCoords.x + fromWidth;
                        x2 = toCoords.x;
                      }
                    } else if (fromCoords.y > toCoords.y) {
                      // Source is below target: connect from top of source to bottom of target
                      y1 = fromCoords.y;
                      y2 = toCoords.y + toHeight;
                    } else {
                      // Source is above target: connect from bottom of source to top of target
                      y1 = fromCoords.y + fromHeight;
                      y2 = toCoords.y;
                    }

                    const isSelected = selectedElement?.type === 'connection' && selectedElement?.id === conn.id;

                    let strokeColor = 'rgba(208, 214, 187, 0.45)';
                    let dashArray = '';
                    let marker = 'url(#arrow-reporting)';
                    
                    if (conn.type === 'escalation') {
                      strokeColor = '#f59e0b';
                      dashArray = '4,4';
                      marker = 'url(#arrow-escalation)';
                    } else if (conn.type === 'sop') {
                      strokeColor = '#10b981';
                      dashArray = '1,3';
                      marker = 'url(#arrow-sop)';
                    } else if (conn.type === 'ownership') {
                      strokeColor = '#2dd4bf';
                      dashArray = '2,2';
                      marker = '';
                    }

                    const pathD = getCurvePath(x1, y1, x2, y2);
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;

                    return (
                      <g key={conn.id} className="connection-line group">
                        <path
                          d={pathD}
                          stroke="transparent"
                          strokeWidth={14}
                          fill="none"
                          className="cursor-pointer pointer-events-auto"
                          onClick={() => {
                            setSelectedElement({ type: 'connection', id: conn.id });
                          }}
                        />
                        <path
                          d={pathD}
                          stroke={isSelected ? "#f59e0b" : strokeColor}
                          strokeWidth={isSelected ? 3 : 1.5}
                          strokeDasharray={dashArray}
                          fill="none"
                          markerEnd={marker}
                          className="transition-all"
                        />
                        {/* Flowing running-glow line */}
                        <path
                          d={pathD}
                          stroke={conn.type === 'escalation' ? '#fbbf24' : conn.type === 'sop' ? '#34d399' : '#a7f3d0'}
                          strokeWidth={isSelected ? 2 : 1.2}
                          fill="none"
                          className="flowing-glow-line pointer-events-none opacity-70"
                        />
                        <circle
                          cx={midX}
                          cy={midY}
                          r={6}
                          fill={isSelected ? "#f59e0b" : "transparent"}
                          className="group-hover:fill-emerald-400 transition-colors pointer-events-auto cursor-pointer"
                          onClick={() => setSelectedElement({ type: 'connection', id: conn.id })}
                        />

                        {conn.label && (zoom >= 0.6 || isSelected) && (
                          <g 
                            className="cursor-pointer pointer-events-auto transition-opacity"
                            onClick={() => setSelectedElement({ type: 'connection', id: conn.id })}
                          >
                            <rect
                              x={midX - 55}
                              y={midY - 9}
                              width={110}
                              height={18}
                              rx={9}
                              fill="#012620"
                              stroke={isSelected ? "#f59e0b" : "rgba(255,255,255,0.12)"}
                              strokeWidth={1}
                            />
                            <text
                              x={midX}
                              y={midY + 3}
                              textAnchor="middle"
                              fill="#D0D6BB"
                              fontSize="7.5px"
                              fontWeight="800"
                              fontFamily="monospace"
                              className="uppercase tracking-wider"
                            >
                              {conn.label.length > 20 ? conn.label.substring(0, 17) + '...' : conn.label}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
                
                {/* Canvas Node Cards */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* 1. Positions */}
                  {model.positions
                    .filter(p => {
                      const status = p.status || 'active';
                      const title = (p.title || '').toLowerCase();
                      const isLeadershipOrStaff = ['pos_ryan', 'pos_coo', 'pos_ann', 'pos_james', 'pos_melissa', 'pos_bic', 'pos_eric', 'pos_va', 'pos_front_desk', 'pos_ai_ops'].includes(p.id) ||
                        p.department === 'Leadership' ||
                        p.department === 'Operations' ||
                        p.department === 'Accounting' ||
                        p.department === 'Marketing' ||
                        p.department === 'Brokers-in-Charge' ||
                        title.includes('broker-in-charge') ||
                        title.includes('broker in charge') ||
                        title.includes('director') ||
                        title.includes('principal') ||
                        title.includes('chief');
                      const isAgentPos = !isLeadershipOrStaff;

                      if (isAgentPos && !showAgents) return false;
                      if (status === 'active' && !showActive) return false;
                      if (status === 'open' && !showOpenRoles) return false;
                      if (status === 'planned' && !showPlannedRoles) return false;
                      if (status === 'wanted' && !showPlannedRoles) return false;
                      if (status === 'fractional' && !showActive) return false;
                      if (status === 'outsourced' && !showActive) return false;
                      if (status === 'virtual_ai' && !showVirtualAi) return false;
                      return true;
                    })
                    .map((pos) => {
                      const nodeX = pos.x || 100;
                      const nodeY = pos.y || 100;

                      const posRoles = model.roles.filter(r => r.positionId === pos.id);
                      const sopsCount = model.sops.filter(s => s.ownerPositionId === pos.id).length;
                      const escCount = model.escalationPolicies.filter(e => e.escalateToPositionId === pos.id).length;

                      const isSelected = selectedElement?.type === 'position' && selectedElement?.id === pos.id;
                      const status = pos.status || 'active';
                      
                      let highlightClass = "border-white/10 hover:border-white/25 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] transition-all duration-200";
                      if (isSelected) {
                        highlightClass = "border-amber-400 shadow-[0_0_22px_rgba(245,158,11,0.5)] scale-[1.02] z-20";
                      } else if (status === 'virtual_ai') {
                        highlightClass = "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] transition-all duration-200";
                      } else if (['open', 'planned', 'wanted'].includes(status)) {
                        highlightClass = "border-dashed border-white/20 hover:border-white/40 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all duration-200";
                      }

                      const isFutureRole = ['open', 'planned', 'wanted'].includes(status);

                      return (
                        <div
                          key={pos.id}
                          onPointerDown={(e) => {
                            if ((e.target as HTMLElement).closest('button')) return;
                            nodePointerRef.current = { id: pos.id, startX: e.clientX, startY: e.clientY, moved: false };
                          }}
                          onPointerMove={(e) => {
                            if (nodePointerRef.current && nodePointerRef.current.id === pos.id) {
                              const dist = Math.hypot(e.clientX - nodePointerRef.current.startX, e.clientY - nodePointerRef.current.startY);
                              if (dist > 5) {
                                nodePointerRef.current.moved = true;
                              }
                            }
                          }}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button')) return;
                            
                            // If user clicked & dragged the card, do not toggle right drawer
                            if (nodePointerRef.current && nodePointerRef.current.moved) {
                              nodePointerRef.current = null;
                              return;
                            }

                            // Single click pops open the right side drawer
                            setSelectedElement({ type: 'position', id: pos.id });
                            setActivePositionId(pos.id);
                            nodePointerRef.current = null;
                          }}
                          onDoubleClick={(e) => {
                            if ((e.target as HTMLElement).closest('button')) return;
                            // Double click brings up right drawer and full profile viewer
                            setSelectedElement({ type: 'position', id: pos.id });
                            setActivePositionId(pos.id);

                            if (pos.name && !['open', 'planned', 'wanted'].includes(pos.status || 'active')) {
                              setActiveProfilePerson({
                                id: pos.id,
                                displayName: pos.name,
                                email: pos.email,
                                phone: pos.phone,
                                photoUrl: pos.avatarUrl,
                                title: pos.title,
                                status: pos.status === 'virtual_ai' ? 'active' : (pos.status || 'active'),
                                personType: pos.status === 'virtual_ai' ? 'leadership' : 'staff'
                              });
                            }
                          }}
                          className={`absolute position-card canvas-node-card ${pos.id === 'pos_ryan' ? 'ryan-node-card w-[320px] p-5.5' : 'w-[300px] p-5'} ${status === 'virtual_ai' ? 'ai-node-glow' : ''} ${isFutureRole ? 'vacant-node-pulse' : ''} bg-[#012620]/90 backdrop-blur-md border rounded-[24px] flex flex-col gap-3 pointer-events-auto cursor-pointer ${highlightClass}`}
                          style={{
                            left: `${nodeX}px`,
                            top: `${nodeY}px`,
                          }}
                        >
                          {/* Lighting Backing Glow around card */}
                          {!isFutureRole ? (
                            <div className="absolute -inset-4 bg-[#D0D6BB]/5 blur-[25px] rounded-[32px] -z-10 pointer-events-none" />
                          ) : (
                            <div className="absolute -inset-4 bg-white/5 blur-[15px] rounded-[32px] -z-10 pointer-events-none" />
                          )}
                          {status === 'virtual_ai' && (
                            <div className="absolute -inset-4 bg-emerald-400/10 blur-[30px] rounded-[32px] -z-10 pointer-events-none" />
                          )}
                          {isSelected && (
                            <div className="absolute -inset-6 bg-amber-400/15 blur-[20px] rounded-[32px] -z-10 pointer-events-none" />
                          )}
                          <div 
                            className="flex justify-between items-start cursor-grab active:cursor-grabbing select-none border-b border-white/5 pb-2.5"
                            onPointerDown={(e) => {
                              if ((e.target as HTMLElement).closest('button')) return;
                              setDraggedNodeId(pos.id);
                              
                              const canvasBound = canvasContainerRef.current!.getBoundingClientRect();
                              const mouseX = e.clientX - canvasBound.left;
                              const mouseY = e.clientY - canvasBound.top;

                              setDragStartOffset({
                                x: (mouseX - pan.x) / zoom - nodeX,
                                y: (mouseY - pan.y) / zoom - nodeY
                              });
                            }}
                          >
                            <div className="flex items-center gap-2.5 max-w-[200px]">
                              {status === 'active' || status === 'fractional' || status === 'outsourced' ? (
                                <OrgAvatar name={pos.name} avatarUrl={pos.avatarUrl} avatarCrop={pos.avatarCrop} size={48} className="border border-white/10 shadow-sm" />
                              ) : status === 'virtual_ai' ? (
                                <div className="w-[48px] h-[48px] rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-sm text-emerald-300">
                                  <span className="text-lg">🤖</span>
                                </div>
                              ) : (
                                <div className="w-[48px] h-[48px] rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center shrink-0 shadow-sm text-[#D0D6BB]/40 hover:text-white hover:bg-white/10 transition-colors">
                                  <span className="text-sm font-bold">+</span>
                                </div>
                              )}
                              <div className="space-y-0.5 text-left truncate">
                                <h4 className="font-sans font-extrabold text-white truncate text-[15px] tracking-tight drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)]">{pos.name}</h4>
                                <span className="text-[10.5px] font-semibold uppercase text-emerald-300 block truncate">{pos.title}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[8.5px] font-mono uppercase text-[#D0D6BB] max-w-[85px] truncate">
                                {pos.department || 'Staff'}
                              </span>
                              {isFutureRole && (
                                <span className="px-1.5 py-0.2 bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[8.5px] font-mono uppercase font-bold rounded">
                                  {status.toUpperCase()}
                                </span>
                              )}
                              {status === 'virtual_ai' && (
                                <span className="px-1.5 py-0.2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[8.5px] font-mono uppercase font-bold rounded">
                                  AI Agent
                                </span>
                              )}
                            </div>
                          </div>

                          {status === 'virtual_ai' ? (
                            <div className="space-y-1.5 text-left text-[11px] font-mono text-[#D0D6BB] flex-1">
                              <div className="text-[10px] truncate">Tools: <span className="text-white">{pos.phone || 'Gemini API'}</span></div>
                              <div className="text-[10px] truncate">Backup Owner: <span className="text-white">{
                                model.positions.find(p => p.id === pos.backupPositionId)?.name || 'Ann Gunn'
                              }</span></div>
                              <div className="flex justify-between items-center border-t border-white/5 pt-1 mt-1 text-[10px]">
                                <span>{posRoles.length} Skills</span>
                                <span className="text-emerald-300">Routing active</span>
                              </div>
                            </div>
                          ) : isFutureRole ? (
                            <div className="space-y-1.5 text-left text-[11px] font-mono text-[#D0D6BB] flex-1">
                              <div className="p-1.5 bg-amber-950/40 border border-amber-500/30 rounded-lg text-[10px] font-mono text-amber-300 flex items-center justify-between gap-1">
                                <span className="font-bold uppercase tracking-wider">⚡ Vacancy Coverage</span>
                                <span className="text-white/90">
                                  Backup: {model.positions.find(p => p.id === pos.backupPositionId)?.name || 'Ann Gunn'}
                                </span>
                              </div>
                              {pos.coverageGap && (
                                <div className="text-white leading-relaxed truncate" title={pos.coverageGap}>
                                  Gap: <span className="text-[#D0D6BB]/80">{pos.coverageGap}</span>
                                </div>
                              )}
                              <div className="space-y-0.5 border-t border-white/5 pt-1 mt-1 text-[10px] text-[#D0D6BB]/60 flex justify-between">
                                <span>Priority: <span className="text-white">{pos.priority || 'Normal'}</span></span>
                                {pos.estimatedCost && <span>Budget: <span className="text-emerald-300">{pos.estimatedCost}</span></span>}
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-1 text-center font-mono text-[11px] flex-1">
                              <div className="bg-black/35 p-1.5 rounded-xl border border-white/5">
                                <span className="text-white font-extrabold block text-sm">{posRoles.length}</span>
                                <span className="text-[8.5px] text-[#D0D6BB]/40 block uppercase">Roles</span>
                              </div>
                              <div className="bg-black/35 p-1.5 rounded-xl border border-white/5">
                                <span className="text-emerald-300 font-extrabold block text-sm">{sopsCount}</span>
                                <span className="text-[8.5px] text-[#D0D6BB]/40 block uppercase">SOPs</span>
                              </div>
                              <div className="bg-black/35 p-1.5 rounded-xl border border-white/5">
                                <span className="text-amber-300 font-extrabold block text-sm">{escCount}</span>
                                <span className="text-[8.5px] text-[#D0D6BB]/40 block uppercase">Escs</span>
                              </div>
                            </div>
                          )}

                          {/* List SOPs owned by this position or its roles */}
                          {(() => {
                            const roleIds = posRoles.map(r => r.id);
                            const posSopsList = model.sops.filter(s => s.ownerPositionId === pos.id || roleIds.includes(s.roleId || ''));
                            if (posSopsList.length > 0 && !isFutureRole) {
                              return (
                                <div className="space-y-1 text-left border-t border-white/5 pt-1.5 mt-0.5">
                                  <span className="text-[9.5px] font-mono uppercase text-[#D0D6BB]/40 block font-bold leading-none">SOPs & Checklists:</span>
                                  <div className="flex flex-col gap-0.5 max-h-[52px] overflow-y-auto pr-0.5 pointer-events-auto">
                                    {posSopsList.map(s => (
                                      <button
                                        key={s.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSopForModal(s);
                                          setSopModalOpen(true);
                                        }}
                                        className="text-[10.5px] text-emerald-400 font-sans truncate text-left hover:underline cursor-pointer flex items-center gap-1 w-full bg-transparent border-none p-0 leading-tight"
                                      >
                                        📋 <span className="truncate">{s.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          <div className="flex justify-between items-center text-[10px] font-mono text-[#D0D6BB]/40 border-t border-white/5 pt-2">
                            <span>{pos.office || 'Corporate'}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(pos.id);
                                  setDrawerType('position');
                                  setDrawerMode('edit');
                                  setDrawerOpen(true);
                                }}
                                className="text-emerald-400 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 text-[8px] uppercase font-mono"
                              >
                                Edit Seat
                              </button>
                              <span className="text-[#D0D6BB]/25">|</span>
                              <span className="text-emerald-400 font-bold hover:underline cursor-pointer" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedElement({ type: 'position', id: pos.id });
                              }}>Configure Seat</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* 2. Roles */}
                  {activeViewMode === 'workflow' && model.roles
                    .filter(r => {
                      if (searchQuery) {
                        return r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
                      }
                      return true;
                    })
                    .map((role) => {
                      const rx = role.x || 100;
                      const ry = role.y || 100;
                      const isSelected = selectedElement?.type === 'role' && selectedElement?.id === role.id;
                      
                      return (
                        <div
                          key={role.id}
                          onClick={() => setSelectedElement({ type: 'role', id: role.id })}
                          onDoubleClick={() => {
                            setEditingId(role.id);
                            setDrawerType('role');
                            setDrawerMode('edit');
                            setDrawerOpen(true);
                          }}
                          className={`absolute canvas-node-card w-[240px] bg-teal-950/20 backdrop-blur-md border ${isSelected ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] z-20' : 'border-teal-500/30'} rounded-xl p-3 flex flex-col gap-2 pointer-events-auto cursor-pointer`}
                          style={{ left: `${rx}px`, top: `${ry}px` }}
                        >
                          <div 
                            className="flex justify-between items-center border-b border-teal-500/10 pb-1.5 cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => {
                              setDraggedNodeId(role.id);
                              const canvasBound = canvasContainerRef.current!.getBoundingClientRect();
                              setDragStartOffset({
                                x: ((e.clientX - canvasBound.left) - pan.x) / zoom - rx,
                                y: ((e.clientY - canvasBound.top) - pan.y) / zoom - ry
                              });
                            }}
                          >
                            <span className="text-[7.5px] font-mono text-teal-300 uppercase tracking-widest font-bold">Role Node</span>
                            <span className="text-[6.5px] font-mono px-1 bg-teal-500/20 text-teal-300 rounded border border-teal-500/30">SLA: {role.defaultSla || '24h'}</span>
                          </div>
                          <div className="text-left font-sans text-xs">
                            <h4 className="font-bold text-white truncate">{role.name}</h4>
                            <p className="text-[10px] text-[#D0D6BB]/75 mt-1 line-clamp-2 leading-relaxed">{role.description}</p>
                          </div>
                        </div>
                      );
                    })}

                  {/* 3. SOPs */}
                  {activeViewMode === 'workflow' && model.sops
                    .filter(s => {
                      if (searchQuery) {
                        return s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.purpose || '').toLowerCase().includes(searchQuery.toLowerCase());
                      }
                      return true;
                    })
                    .map((sop) => {
                      const sx = sop.x || 100;
                      const sy = sop.y || 100;
                      const isSelected = selectedElement?.type === 'sop' && selectedElement?.id === sop.id;

                      return (
                        <div
                          key={sop.id}
                          onClick={() => setSelectedElement({ type: 'sop', id: sop.id })}
                          onDoubleClick={() => {
                            setEditingId(sop.id);
                            setDrawerType('sop');
                            setDrawerMode('edit');
                            setDrawerOpen(true);
                          }}
                          className={`absolute canvas-node-card w-[240px] bg-green-950/20 backdrop-blur-md border ${isSelected ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] z-20' : 'border-green-500/30'} rounded-xl p-3 flex flex-col gap-2 pointer-events-auto cursor-pointer`}
                          style={{ left: `${sx}px`, top: `${sy}px` }}
                        >
                          <div 
                            className="flex justify-between items-center border-b border-green-500/10 pb-1.5 cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => {
                              setDraggedNodeId(sop.id);
                              const canvasBound = canvasContainerRef.current!.getBoundingClientRect();
                              setDragStartOffset({
                                x: ((e.clientX - canvasBound.left) - pan.x) / zoom - sx,
                                y: ((e.clientY - canvasBound.top) - pan.y) / zoom - sy
                              });
                            }}
                          >
                            <span className="text-[7.5px] font-mono text-green-300 uppercase tracking-widest font-bold">SOP / Knowledge</span>
                            <span className="text-[6.5px] font-mono px-1 bg-green-500/20 text-green-300 rounded border border-green-500/30">Steps: {sop.steps.length}</span>
                          </div>
                          <div className="text-left font-sans text-xs">
                            <h4 className="font-bold text-white truncate">{sop.name}</h4>
                            <p className="text-[10px] text-[#D0D6BB]/75 mt-1 line-clamp-1 truncate">Trigger: {sop.trigger}</p>
                          </div>
                        </div>
                      );
                    })}

                  {/* 4. Escalations */}
                  {activeViewMode === 'workflow' && model.escalationPolicies
                    .filter(e => {
                      if (searchQuery) {
                        return e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.trigger.toLowerCase().includes(searchQuery.toLowerCase());
                      }
                      return true;
                    })
                    .map((esc) => {
                      const ex = esc.x || 100;
                      const ey = esc.y || 100;
                      const isSelected = selectedElement?.type === 'escalation' && selectedElement?.id === esc.id;

                      return (
                        <div
                          key={esc.id}
                          onClick={() => setSelectedElement({ type: 'escalation', id: esc.id })}
                          onDoubleClick={() => {
                            setEditingId(esc.id);
                            setDrawerType('escalation');
                            setDrawerMode('edit');
                            setDrawerOpen(true);
                          }}
                          className={`absolute canvas-node-card w-[240px] bg-amber-950/20 backdrop-blur-md border ${isSelected ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] z-20' : 'border-amber-500/30'} rounded-xl p-3 flex flex-col gap-2 pointer-events-auto cursor-pointer`}
                          style={{ left: `${ex}px`, top: `${ey}px` }}
                        >
                          <div 
                            className="flex justify-between items-center border-b border-amber-500/10 pb-1.5 cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => {
                              setDraggedNodeId(esc.id);
                              const canvasBound = canvasContainerRef.current!.getBoundingClientRect();
                              setDragStartOffset({
                                x: ((e.clientX - canvasBound.left) - pan.x) / zoom - ex,
                                y: ((e.clientY - canvasBound.top) - pan.y) / zoom - ey
                              });
                            }}
                          >
                            <span className="text-[7.5px] font-mono text-amber-300 uppercase tracking-widest font-bold">Escalation Policy</span>
                            <span className="text-[6.5px] font-mono px-1 bg-red-500/20 text-red-300 rounded border border-red-500/30 uppercase">{esc.urgency}</span>
                          </div>
                          <div className="text-left font-sans text-xs">
                            <h4 className="font-bold text-white truncate">{esc.name}</h4>
                            <p className="text-[10px] text-[#D0D6BB]/75 mt-1 line-clamp-1 truncate">Limit: {esc.responseWindow}</p>
                          </div>
                        </div>
                      );
                    })}

                  {/* 5. Logic splits / Intake Triggers */}
                  {activeViewMode === 'workflow' && model.logicNodes && model.logicNodes
                    .filter(node => {
                      if (searchQuery) {
                        return node.label.toLowerCase().includes(searchQuery.toLowerCase());
                      }
                      return true;
                    })
                    .map((node) => {
                      const lx = node.x || 100;
                      const ly = node.y || 100;
                      const isSelected = (selectedElement?.type === 'logic_split' || selectedElement?.type === 'intake_trigger') && selectedElement?.id === node.id;
                      const isTrigger = node.type === 'intake_trigger';

                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedElement({ type: node.type as any, id: node.id })}
                          className={`absolute canvas-node-card w-[240px] bg-violet-950/20 backdrop-blur-md border ${isSelected ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] z-20' : isTrigger ? 'border-cyan-500/30' : 'border-violet-500/30'} rounded-xl p-3 flex flex-col gap-2 pointer-events-auto cursor-pointer`}
                          style={{ left: `${lx}px`, top: `${ly}px` }}
                        >
                          <div 
                            className="flex justify-between items-center border-b border-violet-500/10 pb-1.5 cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => {
                              setDraggedNodeId(node.id);
                              const canvasBound = canvasContainerRef.current!.getBoundingClientRect();
                              setDragStartOffset({
                                x: ((e.clientX - canvasBound.left) - pan.x) / zoom - lx,
                                y: ((e.clientY - canvasBound.top) - pan.y) / zoom - ly
                              });
                            }}
                          >
                            <span className={`text-[7.5px] font-mono ${isTrigger ? 'text-cyan-300' : 'text-violet-300'} uppercase tracking-widest font-bold`}>
                              {isTrigger ? 'Intake Trigger' : 'Logic Split'}
                            </span>
                            {!isTrigger && (
                              <span className="text-[6.5px] font-mono px-1 bg-violet-500/20 text-violet-300 rounded border border-violet-500/30">Paths: {node.conditions?.length || 0}</span>
                            )}
                          </div>
                          <div className="text-left font-sans text-xs">
                            <h4 className="font-bold text-white truncate">{node.label}</h4>
                            <p className="text-[10px] text-[#D0D6BB]/75 mt-1 line-clamp-1 truncate">{node.description || 'Intake channel split'}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Floating Map Legend */}
                <div className="absolute print-hidden bottom-4 right-4 bg-[#012620]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl select-none z-10 text-left space-y-2.5 max-w-[245px]">
                  <div>
                    <h5 className="text-[9px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-1">Line Connections</h5>
                    <div className="space-y-1.5 font-mono text-[8px] text-[#D0D6BB] mt-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-0.5 bg-[#D0D6BB] inline-block opacity-60" />
                        <span>Reporting Structure (Solid)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-0.5 border-t border-dashed border-[#f59e0b] inline-block" />
                        <span>Escalation Path (Dashed)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-0.5 border-t border-dotted border-[#10b981] inline-block" />
                        <span>SOP / Knowledge (Dotted)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-[9px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-1">Position Indicators</h5>
                    <div className="space-y-1.5 font-mono text-[8px] text-[#D0D6BB] mt-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-3 bg-black/45 border border-white/20 rounded inline-block" />
                        <span>Solid Card = Active Position</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-3 bg-black/45 border border-dashed border-white/30 rounded inline-block" />
                        <span>Dashed Card = Open/Wanted/Planned Seat</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-3 bg-black/45 border border-emerald-500/50 shadow-[0_0_6px_rgba(16,185,129,0.5)] rounded inline-block" />
                        <span>Glowing Card = AI/Virtual Role</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Floating Positions Notice Fallback */}
              {visiblePositions.length > 0 && (
                <div className="absolute print-hidden bottom-4 left-4 z-10 px-4 py-2 bg-[#012620]/95 backdrop-blur-md border border-white/10 text-[#D0D6BB] text-[10px] font-mono rounded-xl pointer-events-auto shadow-md">
                  Positions loaded but not visible. Click{' '}
                  <button
                    type="button"
                    onClick={handleFitView}
                    className="underline font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    Fit View
                  </button>
                  .
                </div>
              )}
            </div>
          )}

          {/* Right Inspector Panel */}
          {renderRightInspector()}
        </div>
      </div>
    );
  }

  // Markdown Export Modal State
  const [exportContent, setExportContent] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'standard' | 'retell'>('standard');
  const [exportFilter, setExportFilter] = useState<'all' | 'ask_nest_ops' | 'retell' | 'active'>('all');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'queued'>('idle');

  // Step 3 filters & search
  const [step3Search, setStep3Search] = useState('');
  const [step3Filter, setStep3Filter] = useState<'all' | 'manual_sop' | 'pdf' | 'doc' | 'link' | 'needs_review' | 'active' | 'retell' | 'ask_nest_ops'>('all');

  // Drawer / Inspector overlay states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<'position' | 'role' | 'sop' | 'escalation' | 'document' | 'link' | null>(null);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Step 2 Selection state
  const [activePositionId, setActivePositionId] = useState<string>('');
  const [activeRoleId, setActiveRoleId] = useState<string>('');

  // Playground Test states
  const [testQuery, setTestQuery] = useState('I need a lockbox for 123 Oak Island Dr by tomorrow.');
  const [testResult, setTestResult] = useState<any>(null);

  // Load Initial Data
  useEffect(() => {
    const rawData = orgChartService.getOrgChart(workspaceId);
    
    // Auto layout positions if any lack proper coordinates or are all at (0,0)
    const positionsNeedLayout = rawData.positions.some(p => p.x === undefined || p.y === undefined || (p.x === 0 && p.y === 0));
    if (positionsNeedLayout && rawData.positions.length > 0) {
      const nodes = [...rawData.positions];
      const depths: Record<string, number> = {};
      const getDepth = (id: string, visited = new Set<string>()): number => {
        if (depths[id] !== undefined) return depths[id];
        if (visited.has(id)) return 0;
        visited.add(id);
        const node = nodes.find(n => n.id === id);
        if (!node || !node.reportsToPositionId) {
          depths[id] = 0;
          return 0;
        }
        const d = 1 + getDepth(node.reportsToPositionId, visited);
        depths[id] = d;
        return d;
      };
      nodes.forEach(n => getDepth(n.id));
      const groups: Record<number, string[]> = {};
      nodes.forEach(n => {
        const d = depths[n.id] || 0;
        if (!groups[d]) groups[d] = [];
        groups[d].push(n.id);
      });
      rawData.positions = nodes.map(node => {
        const d = depths[node.id] || 0;
        const nodesAtLevel = groups[d] || [];
        const idx = nodesAtLevel.indexOf(node.id);
        const levelWidth = 800;
        const spacing = nodesAtLevel.length > 1 ? levelWidth / (nodesAtLevel.length - 1) : 0;
        const startX = nodesAtLevel.length > 1 ? 150 : 500;
        const x = nodesAtLevel.length > 1 ? startX + idx * spacing : 500;
        const y = 80 + d * 220;
        return { ...node, x, y };
      });
    }

    const data = rawData;
    
    // Load docs from backend REST API
    fetch(`/api/org-knowledge?workspaceId=${workspaceId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Received HTML response instead of JSON (likely expired session)');
        }
        return res.json();
      })
      .then(backendDocs => {
        if (Array.isArray(backendDocs)) {
          const merged = [...(data.knowledgeDocuments || [])];
          backendDocs.forEach(bDoc => {
            const idx = merged.findIndex(d => d.id === bDoc.id);
            if (idx > -1) {
              merged[idx] = bDoc;
            } else {
              merged.push(bDoc);
            }
          });
          data.knowledgeDocuments = merged;
        }
        setModel(data);
      })
      .catch(err => {
        console.error("Failed loading backend knowledge docs", err);
        setModel(data);
      });

    setHasChanges(false);
    setSaveStatus('idle');
    if (data.positions.length > 0) {
      setActivePositionId(data.positions[0].id);
      const posRoles = data.roles.filter(r => r.positionId === data.positions[0].id);
      if (posRoles.length > 0) {
        setActiveRoleId(posRoles[0].id);
      }
    }
  }, [workspaceId]);

  const markChanged = (newModel: OrgModel) => {
    setModel(newModel);
    setHasChanges(true);
    setSaveStatus('idle');
    orgChartService.saveOrgChart(workspaceId, newModel);
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      orgChartService.saveOrgChart(workspaceId, model);
      setSaveStatus('saved');
      setHasChanges(false);
    }, 800);
  };

  const triggerSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('queued');
    }, 1200);
  };

  const handleExport = () => {
    const md = exportFormat === 'standard'
      ? orgChartService.exportOrgChartToKnowledgeBase(workspaceId, model, exportFilter)
      : orgChartService.exportRetellKB(workspaceId, model);
    setExportContent(md);
  };

  // --- DRAWER OPEN/CLOSE HELPERS ---
  const openAddDrawer = (type: 'position' | 'role' | 'sop' | 'escalation' | 'document' | 'link') => {
    setDrawerType(type);
    setDrawerMode('add');
    setEditingId(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (type: 'position' | 'role' | 'sop' | 'escalation' | 'document' | 'link', id: string) => {
    setDrawerType(type);
    setDrawerMode('edit');
    setEditingId(id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerType(null);
    setEditingId(null);
  };

  // --- SELECTION SYNC ---
  const selectPosition = (posId: string) => {
    setActivePositionId(posId);
    const posRoles = model.roles.filter(r => r.positionId === posId);
    if (posRoles.length > 0) {
      setActiveRoleId(posRoles[0].id);
    } else {
      setActiveRoleId('');
    }
  };

  // --- CORE SUBMIT ACTIONS ---
  const handleAddPositionSubmit = (data: Partial<OrgPosition>) => {
    const newId = `pos_${Date.now()}`;
    const newPos: OrgPosition = {
      id: newId,
      workspaceId,
      name: data.name || 'New Seat Name',
      title: data.title || 'Untitled Seat',
      department: data.department || 'Operations',
      office: data.office || 'Wilmington',
      email: data.email || '',
      phone: data.phone || '',
      reportsToPositionId: data.reportsToPositionId,
      backupPositionId: data.backupPositionId,
      visibilityLevel: data.visibilityLevel || 'internal',
      avatarUrl: data.avatarUrl,
      avatarCrop: data.avatarCrop,
      status: data.status || 'active',
      targetHireDate: data.targetHireDate,
      priority: data.priority || 'normal',
      estimatedCost: data.estimatedCost,
      businessCase: data.businessCase,
      hiringNotes: data.hiringNotes,
      coverageGap: data.coverageGap,
      roleIds: [],
      connectedTools: data.connectedTools || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    markChanged({
      ...model,
      positions: [...model.positions, newPos]
    });
    selectPosition(newId);
    closeDrawer();
  };

  const handleEditPositionSubmit = (id: string, updates: Partial<OrgPosition>) => {
    const updated = model.positions.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
    markChanged({ ...model, positions: updated });
    closeDrawer();
  };

  const handleAddRoleSubmit = (data: Partial<OrgRole>) => {
    const newId = `role_${Date.now()}`;
    const newRole: OrgRole = {
      id: newId,
      workspaceId,
      positionId: data.positionId || activePositionId,
      name: data.name || 'New Responsibility',
      description: data.description || '',
      categories: data.categories || ['Other / Unknown'],
      defaultSla: data.defaultSla || '24 hours',
      backupOwnerPositionId: data.backupOwnerPositionId,
      sopIds: [],
      escalationPolicyIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedPositions = model.positions.map(p => {
      if (p.id === (data.positionId || activePositionId)) {
        return { ...p, roleIds: [...p.roleIds, newId] };
      }
      return p;
    });

    markChanged({
      ...model,
      positions: updatedPositions,
      roles: [...model.roles, newRole]
    });
    setActiveRoleId(newId);
    closeDrawer();
  };

  const handleEditRoleSubmit = (id: string, updates: Partial<OrgRole>) => {
    const updated = model.roles.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
    markChanged({ ...model, roles: updated });
    closeDrawer();
  };

  const handleAddSopSubmit = (data: Partial<OrgSop>) => {
    const newId = `sop_${Date.now()}`;
    const newSop: OrgSop = {
      id: newId,
      workspaceId,
      name: data.name || 'New SOP Checklist',
      trigger: data.trigger || 'When a trigger occurs',
      purpose: data.purpose || '',
      ownerPositionId: data.ownerPositionId || activePositionId,
      roleId: data.roleId || activeRoleId || undefined,
      steps: data.steps || ['Step 1'],
      requiredInformation: data.requiredInformation || ['Information required'],
      tags: data.tags || ['general'],
      completionCriteria: data.completionCriteria,
      notificationRules: data.notificationRules,
      escalationNotes: data.escalationNotes,
      requestCategories: data.requestCategories,
      status: data.status || 'active',
      includeInAskNestOps: data.includeInAskNestOps ?? true,
      includeInRetell: data.includeInRetell ?? true,
      includeInRouting: data.includeInRouting ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    markChanged({
      ...model,
      sops: [...model.sops, newSop]
    });
    closeDrawer();
  };

  const handleEditSopSubmit = (id: string, updates: Partial<OrgSop>) => {
    const updated = model.sops.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s);
    markChanged({ ...model, sops: updated });
    closeDrawer();
  };

  const handleAddEscalationSubmit = (data: Partial<EscalationPolicy>) => {
    const newId = `esc_${Date.now()}`;
    const newEsc: EscalationPolicy = {
      id: newId,
      workspaceId,
      name: data.name || 'New Escalation Policy',
      trigger: data.trigger || 'Trigger event description',
      condition: data.condition || 'IF task overdue 24h',
      escalateToPositionId: data.escalateToPositionId || model.positions[0]?.id || '',
      responseWindow: data.responseWindow || '24 hours',
      urgency: data.urgency || 'normal',
      channels: data.channels || ['dashboard', 'email'],
      requiredContext: data.requiredContext || [],
      recommendedNextAction: data.recommendedNextAction || '',
      saveToKnowledgeBase: data.saveToKnowledgeBase ?? true,
      fallbackActivePositionId: data.fallbackActivePositionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    markChanged({
      ...model,
      escalationPolicies: [...model.escalationPolicies, newEsc]
    });
    closeDrawer();
  };

  const handleEditEscalationSubmit = (id: string, updates: Partial<EscalationPolicy>) => {
    const updated = model.escalationPolicies.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e);
    markChanged({ ...model, escalationPolicies: updated });
    closeDrawer();
  };

  const handleAddDocSubmit = (newDoc: OrgKnowledgeDocument) => {
    const updated = [...(model.knowledgeDocuments || []), newDoc];
    markChanged({ ...model, knowledgeDocuments: updated });
    
    if (newDoc.status === 'processing') {
      setTimeout(() => {
        const latestModel = orgChartService.getOrgChart(workspaceId);
        const processed = (latestModel.knowledgeDocuments || []).map(d =>
          d.id === newDoc.id ? { ...d, status: 'ready' as const, aiSummary: d.aiSummary || 'Automatically extracted summary details from the processed source.' } : d
        );
        markChanged({ ...latestModel, knowledgeDocuments: processed });
      }, 2000);
    }
    closeDrawer();
  };

  const handleEditDocSubmit = (id: string, updates: Partial<OrgKnowledgeDocument>) => {
    const updated = (model.knowledgeDocuments || []).map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d);
    markChanged({ ...model, knowledgeDocuments: updated });
    
    if (updates.status === 'processing') {
      setTimeout(() => {
        const latestModel = orgChartService.getOrgChart(workspaceId);
        const processed = (latestModel.knowledgeDocuments || []).map(d =>
          d.id === id ? { ...d, status: 'ready' as const } : d
        );
        markChanged({ ...latestModel, knowledgeDocuments: processed });
      }, 2000);
    }
    closeDrawer();
  };

  // --- DELETE HELPER ---
  const deleteItem = async (type: 'position' | 'role' | 'sop' | 'escalation' | 'document', id: string) => {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === 'position') {
        const remainingPos = model.positions.filter(p => p.id !== id);
        const remainingRoles = model.roles.filter(r => r.positionId !== id);
        const remainingMatrix = (model.routingMatrix || []).map(row => {
          let primary = row.primaryOwnerPositionId;
          let backup = row.backupOwnerPositionId;
          if (primary === id) primary = remainingPos[0]?.id || '';
          if (backup === id) backup = remainingPos[0]?.id || '';
          return { ...row, primaryOwnerPositionId: primary, backupOwnerPositionId: backup };
        });

        markChanged({
          ...model,
          positions: remainingPos,
          roles: remainingRoles,
          routingMatrix: remainingMatrix
        });
        if (activePositionId === id && remainingPos.length > 0) {
          selectPosition(remainingPos[0].id);
        }
      } else if (type === 'role') {
        const remainingRoles = model.roles.filter(r => r.id !== id);
        const updatedPositions = model.positions.map(p => ({
          ...p,
          roleIds: p.roleIds.filter(rid => rid !== id)
        }));
        markChanged({
          ...model,
          positions: updatedPositions,
          roles: remainingRoles
        });
        if (activeRoleId === id) {
          setActiveRoleId(remainingRoles.filter(r => r.positionId === activePositionId)[0]?.id || '');
        }
      } else if (type === 'sop') {
        const remainingSops = model.sops.filter(s => s.id !== id);
        markChanged({
          ...model,
          sops: remainingSops
        });
      } else if (type === 'escalation') {
        const remainingEsc = model.escalationPolicies.filter(e => e.id !== id);
        markChanged({
          ...model,
          escalationPolicies: remainingEsc
        });
      } else if (type === 'document') {
        try {
          await fetch(`/api/org-knowledge/${id}`, { method: 'DELETE' });
        } catch (e) {
          console.error("Delete call to API failed", e);
        }
        const remainingDocs = (model.knowledgeDocuments || []).filter(d => d.id !== id);
        markChanged({
          ...model,
          knowledgeDocuments: remainingDocs
        });
      }
    }
  };

  const toggleDocToggle = (docId: string, setting: 'includeInAskNestOps' | 'includeInRetell' | 'includeInRouting') => {
    const updated = (model.knowledgeDocuments || []).map(doc => {
      if (doc.id === docId) {
        const newVal = !doc[setting];
        // If updating backend, queue a silent PUT
        fetch(`/api/org-knowledge/${docId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [setting]: newVal })
        }).catch(err => console.error("Failed putting setting update", err));

        return { ...doc, [setting]: newVal, updatedAt: new Date().toISOString() };
      }
      return doc;
    });
    markChanged({ ...model, knowledgeDocuments: updated });
  };

  const toggleSopSetting = (sopId: string, setting: 'includeInAskNestOps' | 'includeInRetell' | 'includeInRouting') => {
    const updated = model.sops.map(sop => {
      if (sop.id === sopId) {
        return { ...sop, [setting]: !sop[setting], updatedAt: new Date().toISOString() };
      }
      return sop;
    });
    markChanged({ ...model, sops: updated });
  };

  const handleRunDocExtraction = async (docId: string) => {
    try {
      const res = await fetch(`/api/org-knowledge/${docId}/extract`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.document) {
        const updated = (model.knowledgeDocuments || []).map(d => d.id === docId ? data.document : d);
        markChanged({ ...model, knowledgeDocuments: updated });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- PLAYGROUND MOCK NLP RUNNER ---
  const runTestPlayground = () => {
    const query = testQuery.toLowerCase();
    let category = 'Unknown owner';
    let primaryId = 'pos_ryan';
    let backupId = 'pos_bic';
    let sla = '24 hours';
    let matchedSops: OrgSop[] = [];
    let matchedEscalations: EscalationPolicy[] = [];

    // Simple keyword checks
    if (query.includes('coo') || query.includes('staff management') || query.includes('recruitment')) {
      category = 'Operations leadership';
      primaryId = 'pos_coo';
      backupId = 'pos_ryan';
      sla = '24 hours';
    } else if (query.includes('front') || query.includes('desk') || query.includes('reception') || query.includes('hospitality')) {
      category = 'Guest Services & Reception';
      primaryId = 'pos_front_desk';
      backupId = 'pos_coo';
      sla = '8 hours';
    } else if (query.includes('assistant') && (query.includes('virtual') || query.includes('posting') || query.includes('format'))) {
      category = 'Marketing / Admin Support';
      primaryId = 'pos_va';
      backupId = 'pos_melissa';
      sla = '24 hours';
    } else if (query.includes('ai') || query.includes('triage') || query.includes('bot') || query.includes('lookup')) {
      category = 'AI Intake Triage';
      primaryId = 'pos_ai_ops';
      backupId = 'pos_ann';
      sla = '5 minutes';
    } else if (query.includes('lockbox') || query.includes('key')) {
      category = 'Lockboxes / keys';
      primaryId = 'pos_ann';
      backupId = 'pos_ryan';
      sla = '12 hours';
      matchedSops = model.sops.filter(s => s.id === 'sop_lockbox');
      matchedEscalations = model.escalationPolicies.filter(e => e.id === 'esc_showing_blocked');
    } else if (query.includes('commission') || query.includes('pay') || query.includes('invoice') || query.includes('receipt') || query.includes('bill')) {
      category = 'Accounting / commissions';
      primaryId = 'pos_james';
      backupId = 'pos_ryan';
      sla = '24 hours';
      matchedSops = model.sops.filter(s => s.id === 'sop_commission');
      matchedEscalations = model.escalationPolicies.filter(e => e.id === 'esc_deal_at_risk');
    } else if (query.includes('compliance') || query.includes('contract') || query.includes('legal') || query.includes('addendum')) {
      category = 'Compliance';
      primaryId = 'pos_bic';
      backupId = 'pos_ryan';
      sla = '24 hours';
      matchedSops = model.sops.filter(s => s.id === 'sop_compliance');
      matchedEscalations = model.escalationPolicies.filter(e => e.id === 'esc_compliance_risk');
    } else if (query.includes('marketing') || query.includes('branding') || query.includes('flyer') || query.includes('card') || query.includes('social')) {
      category = 'Marketing request';
      primaryId = 'pos_melissa';
      backupId = 'pos_ryan';
      sla = '24 hours';
      matchedSops = model.sops.filter(s => s.id === 'sop_listing_launch');
    } else if (query.includes('office') || query.includes('room') || query.includes('supply')) {
      category = 'Office supplies';
      primaryId = 'pos_ann';
      backupId = 'pos_ryan';
      sla = '48 hours';
    }

    let futureOwnerName = '';
    let futureOwnerStatus = '';

    const originalPrimaryObj = model.positions.find(p => p.id === primaryId) || model.positions[0];
    const status = originalPrimaryObj?.status || 'active';

    if (status === 'open' || status === 'planned' || status === 'wanted') {
      futureOwnerName = originalPrimaryObj.name;
      futureOwnerStatus = status;

      // Find an active fallback owner
      let fallbackId = originalPrimaryObj.backupPositionId || originalPrimaryObj.reportsToPositionId || 'pos_ann';
      let fallbackObj = model.positions.find(p => p.id === fallbackId);
      if (!fallbackObj || (fallbackObj.status && fallbackObj.status !== 'active')) {
        fallbackId = 'pos_ann';
        fallbackObj = model.positions.find(p => p.id === fallbackId);
      }
      if (!fallbackObj || (fallbackObj.status && fallbackObj.status !== 'active')) {
        fallbackId = 'pos_ryan';
        fallbackObj = model.positions.find(p => p.id === fallbackId);
      }

      primaryId = fallbackId;
    }

    const primaryObj = model.positions.find(p => p.id === primaryId) || model.positions[0];
    const backupObj = model.positions.find(p => p.id === backupId) || model.positions[1];

    const matchedDocs = (model.knowledgeDocuments || []).filter(doc => 
      doc.requestCategories.includes(category) && doc.includeInRouting
    );

    setTestResult({
      category,
      primaryName: primaryObj?.name || 'Unassigned',
      primaryTitle: primaryObj?.title || 'Unknown Title',
      backupName: backupObj?.name || 'Unassigned',
      sla,
      sops: matchedSops,
      escalations: matchedEscalations,
      knowledgeDocuments: matchedDocs,
      futureOwnerName,
      futureOwnerStatus
    });
  };

  useEffect(() => {
    if (currentStep === 5) {
      runTestPlayground();
    }
  }, [currentStep, model]);

  // Unified items filter list for step 3
  const getFilteredSopsAndDocs = () => {
    const s = step3Search.toLowerCase();
    
    // 1. Filter manual sops
    const matchingSops = model.sops.filter(sop => {
      const matchesSearch = 
        sop.name.toLowerCase().includes(s) || 
        (sop.purpose || '').toLowerCase().includes(s) ||
        (sop.tags || []).some(t => t.toLowerCase().includes(s)) ||
        (sop.requestCategories || []).some(c => c.toLowerCase().includes(s));
      
      const matchesPosition = !activePositionId || sop.ownerPositionId === activePositionId;
      const matchesRole = !activeRoleId || sop.roleId === activeRoleId;

      if (!matchesSearch || !matchesPosition || !matchesRole) return false;

      if (step3Filter === 'manual_sop') return true;
      if (step3Filter === 'active') return sop.status !== 'draft';
      if (step3Filter === 'needs_review') return sop.status === 'needs_review';
      if (step3Filter === 'retell') return sop.includeInRetell === true;
      if (step3Filter === 'ask_nest_ops') return sop.includeInAskNestOps === true;
      
      // If filtering for PDFs/Docs/Links, manual sops are excluded
      if (['pdf', 'doc', 'link'].includes(step3Filter)) return false;

      return true; // step3Filter === 'all'
    });

    // 2. Filter uploaded documents & links
    const matchingDocs = (model.knowledgeDocuments || []).filter(doc => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(s) ||
        (doc.fileName || '').toLowerCase().includes(s) ||
        (doc.aiSummary || '').toLowerCase().includes(s) ||
        doc.tags.some(t => t.toLowerCase().includes(s)) ||
        doc.requestCategories.some(c => c.toLowerCase().includes(s));

      const matchesPosition = !activePositionId || doc.ownerPositionId === activePositionId;
      const matchesRole = !activeRoleId || doc.ownerRoleId === activeRoleId;

      if (!matchesSearch || !matchesPosition || !matchesRole) return false;

      if (step3Filter === 'manual_sop') return false;
      if (step3Filter === 'pdf') return doc.sourceType === 'pdf';
      if (step3Filter === 'doc') return ['doc', 'docx'].includes(doc.sourceType);
      if (step3Filter === 'link') return doc.sourceType === 'link';
      if (step3Filter === 'active') return doc.status === 'active';
      if (step3Filter === 'needs_review') return doc.status === 'needs_review';
      if (step3Filter === 'retell') return doc.includeInRetell === true;
      if (step3Filter === 'ask_nest_ops') return doc.includeInAskNestOps === true;

      return true; // step3Filter === 'all'
    });

    return { sops: matchingSops, docs: matchingDocs };
  };

  const { sops: filteredStep3Sops, docs: filteredStep3Docs } = getFilteredSopsAndDocs();

  return (
    <>
      <div className="w-full h-full flex flex-col bg-[#01362D] text-[#F6F7F1] font-sans relative overflow-hidden border-none shadow-none role-map-root-container">
      
      {/* --- TOP HEADER BAR (Section Tabs & Metrics) --- */}
      <div className="h-[56px] min-h-[56px] max-h-[56px] px-6 border-b border-[rgba(246,247,241,0.12)] bg-[#012620] flex items-center justify-between shrink-0 gap-4 text-left visual-org-map-header select-none">
        {/* Left: Back Button + Section Tabs */}
        <div className="flex items-center gap-3 flex-grow min-w-0">
          {(onClose || !embeddedTab) && (
            <button
              onClick={onClose || (() => window.location.assign('/app/settings'))}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[#D0D6BB] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase shrink-0 mr-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}

          {/* Org Chart Section Tabs */}
          <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/10 items-center shrink-0">
            {[
              { id: 'org_chart', label: 'Org Chart' },
              { id: 'overview', label: 'Overview' },
              { id: 'by_position', label: 'By Position' },
              { id: 'routing', label: 'Request Routing' },
              { id: 'escalations', label: 'Escalations' },
              { id: 'connected_tools', label: 'Connected Tools' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-[#00635C] text-white shadow-md border-white/20'
                    : 'bg-transparent text-[#D0D6BB]/70 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Seat Metrics Summary & Save Changes */}
        <div className="flex items-center gap-3 shrink-0">
          
          <div className="hidden lg:flex items-center gap-2.5 border-l border-white/15 pl-2.5 font-mono text-[8.5px]">
            <div>
              <span className="text-[#D0D6BB]/50 uppercase mr-0.5">Total:</span>
              <span className="font-bold text-white">{model.positions.length}</span>
            </div>
            <div>
              <span className="text-rose-300/60 uppercase mr-0.5">Vacant:</span>
              <span className="font-bold text-rose-300">{model.positions.filter(p => p.status === 'open').length}</span>
            </div>
            <div>
              <span className="text-sky-300/60 uppercase mr-0.5">Planned:</span>
              <span className="font-bold text-sky-300">{model.positions.filter(p => p.status === 'planned').length}</span>
            </div>
            <div>
              <span className="text-emerald-400/60 uppercase mr-0.5">AI:</span>
              <span className="font-bold text-emerald-300">{model.positions.filter(p => p.status === 'virtual_ai').length}</span>
            </div>
          </div>

          {hasChanges ? (
            <span className="text-[8px] text-amber-300 font-mono font-bold uppercase tracking-wider animate-pulse ml-1">Unsaved</span>
          ) : (
            <span className="text-[8px] text-[#D0D6BB]/50 font-mono uppercase tracking-wider ml-1">Saved ✓</span>
          )}

          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ml-1 ${
              hasChanges 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-white/20' 
                : 'bg-white/5 border border-white/5 text-[#D0D6BB]/40 cursor-default'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>

        {/* --- STEPPER PROGRESS BAR & MULTI-COLUMN LAYOUT --- */}
        {activeTab === 'guided' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#01362D] text-left">
            {/* Left Navigation: Vertical Stepper */}
            <div className="w-full md:w-60 shrink-0 bg-[#012a23] border-r border-white/10 p-5 flex flex-col justify-between select-none">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider block font-mono">
                  Guided Progress
                </span>
                <div className="flex flex-col gap-2">
                  {[
                    { num: 1, label: 'Positions', desc: 'Seats' },
                    { num: 2, label: 'Roles', desc: 'Ownership' },
                    { num: 3, label: 'SOPs & Knowledge', desc: 'Knowledge Base' },
                    { num: 4, label: 'Escalations', desc: 'Rules' },
                    { num: 5, label: 'Preview', desc: 'AI Routing' }
                  ].map((step, idx) => {
                    const isCurrent = currentStep === step.num;
                    const isPast = currentStep > step.num;
                    return (
                      <button
                        key={step.num}
                        onClick={() => setCurrentStep(step.num as any)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                          isCurrent 
                            ? 'bg-[#00635C] border border-white/10 shadow-sm'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[10px] font-black transition-all shrink-0 ${
                          isCurrent 
                            ? 'bg-emerald-400 border-emerald-300 text-[#01362D]' 
                            : isPast 
                              ? 'bg-[#00635C] border-[#00635C] text-white' 
                              : 'border-white/20 text-[#D0D6BB]/40'
                        }`}>
                          {step.num}
                        </div>
                        <div>
                          <span className={`text-[10px] font-bold block uppercase tracking-wider ${
                            isCurrent ? 'text-white' : 'text-[#D0D6BB]/75'
                          }`}>
                            {step.label}
                          </span>
                          <span className="text-[8px] font-mono uppercase text-[#D0D6BB]/40 block">{step.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 text-[9px] text-[#D0D6BB]/40 leading-relaxed font-sans">
                Follow this 5-step process to configure the full operational structure for {workspaceName}.
              </div>
            </div>

            {/* Center Column: Step Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="w-full max-w-5xl mx-auto space-y-6">
            
            {/* STEP HEADER TEXTS */}
            {currentStep === 1 && (() => {
              const openCount = model.positions.filter(p => p.status === 'open').length;
              const plannedCount = model.positions.filter(p => p.status === 'planned' || p.status === 'wanted').length;
              const aiCount = model.positions.filter(p => p.status === 'virtual_ai').length;

              const planningSeats = model.positions.filter(p => ['open', 'planned', 'wanted'].includes(p.status || ''));
              let highestPrioritySeat: OrgPosition | null = null;
              let maxPriorityVal = 0;
              const priorityMap: Record<string, number> = { low: 1, normal: 2, high: 3, urgent: 4 };
              planningSeats.forEach(p => {
                const val = priorityMap[p.priority || 'normal'] || 2;
                if (val > maxPriorityVal) {
                  maxPriorityVal = val;
                  highestPrioritySeat = p;
                }
              });

              let totalMonthlyCost = 0;
              model.positions.forEach(p => {
                if (['open', 'planned', 'wanted'].includes(p.status || '') && p.estimatedCost) {
                  const matches = p.estimatedCost.match(/\d[\d,.]*/);
                  if (matches) {
                    const val = parseFloat(matches[0].replace(/,/g, ''));
                    if (!isNaN(val)) {
                      if (p.estimatedCost.toLowerCase().includes('yr') || p.estimatedCost.toLowerCase().includes('annual')) {
                        totalMonthlyCost += val / 12;
                      } else {
                        totalMonthlyCost += val;
                      }
                    }
                  }
                }
              });

              return (
                <div className="space-y-4 border-b border-white/5 pb-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">Who are the seats in the organization?</h3>
                      <p className="text-[11px] text-[#D0D6BB] mt-1 font-sans">
                        Configure the personnel or functional seats that represent task handlers and decision-makers in this workspace.
                      </p>
                    </div>
                    <button
                      onClick={() => openAddDrawer('position')}
                      className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)] rounded-xl text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Add Position
                    </button>
                  </div>

                  {/* Planning Gaps Summary Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#012a23]/60 border border-white/10 p-4 rounded-2xl text-left">
                    <div className="md:col-span-4 border-b border-white/5 pb-2 mb-1 flex justify-between items-center">
                      <span className="text-[9px] font-mono font-bold uppercase text-amber-300">⚠️ Planning Gaps & Staffing Forecast</span>
                      <span className="text-[8px] font-mono text-[#D0D6BB]/50 uppercase">{openCount + plannedCount + aiCount} future seats identified</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[7px] font-mono uppercase text-[#D0D6BB]/50 block">Open Seats</span>
                      <strong className="text-white text-xs font-serif font-black block">{openCount} Approved Roles</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[7px] font-mono uppercase text-[#D0D6BB]/50 block">Planned Seats</span>
                      <strong className="text-white text-xs font-serif font-black block">{plannedCount} Future / Wanted</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[7px] font-mono uppercase text-[#D0D6BB]/50 block">Highest Priority Gap</span>
                      <strong className="text-amber-400 text-xs font-serif font-black block truncate">
                        {highestPrioritySeat ? (highestPrioritySeat as OrgPosition).name : 'None'}
                      </strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[7px] font-mono uppercase text-[#D0D6BB]/50 block">Est. Cost Impact</span>
                      <strong className="text-emerald-400 text-xs font-serif font-black block">
                        {totalMonthlyCost > 0 ? `$${Math.round(totalMonthlyCost).toLocaleString()}/mo` : 'TBD'}
                      </strong>
                    </div>
                  </div>

                  {/* Step 1 Filters Segmented Control */}
                  <div className="flex gap-1.5 bg-black/15 p-1 rounded-xl border border-white/5 max-w-md">
                    {(['all', 'active', 'open', 'planned', 'virtual_ai'] as const).map(filterType => (
                      <button
                        key={filterType}
                        type="button"
                        onClick={() => setPosStepFilter(filterType)}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                          posStepFilter === filterType
                            ? 'bg-[#00635C] text-white'
                            : 'text-[#D0D6BB]/40 hover:text-white'
                        }`}
                      >
                        {filterType === 'virtual_ai' ? 'AI/Virtual' : filterType}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {currentStep === 2 && (
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">What does each seat own?</h3>
                  <p className="text-[11px] text-[#D0D6BB] mt-1 font-sans">
                    Define operational roles and request categories assigned to each organizational seat.
                  </p>
                </div>
                <button
                  onClick={() => openAddDrawer('role')}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)] rounded-xl text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add Role
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">How should that work be handled?</h3>
                  <p className="text-[11px] text-[#D0D6BB] mt-1 font-sans">
                    Upload policies, checklists, PDFs, templates, and instructions that help each role handle work correctly.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddDrawer('sop')}
                    className="px-3.5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] rounded-xl text-[9px] font-mono font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Create SOP
                  </button>
                  <button
                    onClick={() => openAddDrawer('document')}
                    className="px-3.5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] rounded-xl text-[9px] font-mono font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Upload Document
                  </button>
                  <button
                    onClick={() => openAddDrawer('link')}
                    className="px-3.5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] rounded-xl text-[9px] font-mono font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Add Link
                  </button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">What happens when something is late, risky, or unclear?</h3>
                  <p className="text-[11px] text-[#D0D6BB] mt-1 font-sans">
                    Configure automated rules to escalate tickets to backup owners or notify channels under custom operational triggers.
                  </p>
                </div>
                <button
                  onClick={() => openAddDrawer('escalation')}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)] rounded-xl text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add Escalation Policy
                </button>
              </div>
            )}

            {currentStep === 5 && (
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">How will Ask Nest Ops route real requests?</h3>
                  <p className="text-[11px] text-[#D0D6BB] mt-1 font-sans">
                    Simulate real-life agent scenarios to verify task ownership matching and checklist mapping rules.
                  </p>
                </div>
              </div>
            )}

            {/* STEP CONTENT SWITCH PANELS */}
            
            {/* --- STEP 1: POSITIONS --- */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {model.positions.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                    <User className="w-8 h-8 mx-auto text-[#D0D6BB]/50 mb-3" />
                    <p className="text-xs text-[#D0D6BB]">No positions yet. Add the first seat in the organization.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {model.positions
                      .filter(pos => {
                        const status = pos.status || 'active';
                        if (posStepFilter === 'all') return true;
                        if (posStepFilter === 'active') return status === 'active' || status === 'fractional' || status === 'outsourced';
                        if (posStepFilter === 'open') return status === 'open';
                        if (posStepFilter === 'planned') return status === 'planned' || status === 'wanted';
                        if (posStepFilter === 'virtual_ai') return status === 'virtual_ai';
                        return true;
                      })
                      .map(pos => {
                        const posRoles = model.roles.filter(r => r.positionId === pos.id);
                        const sopsCount = model.sops.filter(s => s.ownerPositionId === pos.id).length;
                        const escCount = model.escalationPolicies.filter(e => e.escalateToPositionId === pos.id).length;
                        const status = pos.status || 'active';
                        const isFuture = ['open', 'planned', 'wanted'].includes(status);
                        
                        let cardBorderClass = "border-white/10 hover:border-white/20";
                        if (status === 'virtual_ai') {
                          cardBorderClass = "border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
                        } else if (isFuture) {
                          cardBorderClass = "border-dashed border-white/20 hover:border-white/40";
                        }

                        return (
                          <div 
                            key={pos.id}
                            className={`bg-black/15 border rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:-translate-y-0.5 transition-all text-left ${cardBorderClass} ${status === 'planned' ? 'opacity-70 hover:opacity-100' : ''}`}
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  {status === 'active' || status === 'fractional' || status === 'outsourced' ? (
                                    <OrgAvatar name={pos.name} avatarUrl={pos.avatarUrl} avatarCrop={pos.avatarCrop} size={44} className="border border-[#D0D6BB]/20 shadow-sm" />
                                  ) : status === 'virtual_ai' ? (
                                    <div className="w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                                      <span>🤖</span>
                                    </div>
                                  ) : (
                                    <div className="w-11 h-11 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-[#D0D6BB]/40">
                                      <span className="font-bold">+</span>
                                    </div>
                                  )}
                                  <div className="space-y-0.5">
                                    <h4 className="font-serif font-black text-xs text-white uppercase tracking-wide"><span>{pos.name}</span></h4>
                                    <span className="text-[10px] font-mono uppercase text-[#D0D6BB]/80 block">{pos.title}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-mono uppercase text-[#D0D6BB] shrink-0">
                                    {pos.department || 'Staff'}
                                  </span>
                                  {status !== 'active' && (
                                    <span className={`px-1.5 py-0.2 text-[6px] font-mono uppercase font-bold rounded ${
                                      status === 'open' ? 'bg-red-950/40 border border-red-500/30 text-red-300' :
                                      status === 'virtual_ai' ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' :
                                      status === 'wanted' ? 'bg-emerald-950/40 border border-emerald-500/30 text-[#D0D6BB]' :
                                      status === 'planned' ? 'bg-blue-950/40 border border-blue-500/30 text-blue-300' :
                                      status === 'fractional' ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-300' :
                                      'bg-purple-950/40 border border-purple-500/30 text-purple-300'
                                    }`}>
                                      {status === 'virtual_ai' ? 'AI Agent' : status}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {isFuture ? (
                                <div className="space-y-1 bg-white/5 p-2 rounded-xl text-[10px] font-mono text-[#D0D6BB] space-y-1">
                                  {pos.priority && (
                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                      <span>Priority:</span>
                                      <span className={`font-bold ${
                                        pos.priority === 'urgent' ? 'text-red-400' :
                                        pos.priority === 'high' ? 'text-amber-400' : 'text-white'
                                      }`}>{pos.priority.toUpperCase()}</span>
                                    </div>
                                  )}
                                  {pos.coverageGap && (
                                    <div className="pt-0.5 text-2xs truncate">
                                      Gap: <span className="text-white">{pos.coverageGap}</span>
                                    </div>
                                  )}
                                  {pos.estimatedCost && (
                                    <div className="pt-0.5 text-2xs">
                                      Cost: <span className="text-emerald-400">{pos.estimatedCost}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                                  <div className="bg-black/25 p-2 rounded-xl border border-white/5">
                                    <span className="text-white text-xs font-black block">{posRoles.length}</span>
                                    <span className="text-[8px] text-[#D0D6BB]/40 block uppercase">roles</span>
                                  </div>
                                  <div className="bg-black/25 p-2 rounded-xl border border-white/5">
                                    <span className="text-white text-xs font-black block">{sopsCount}</span>
                                    <span className="text-[8px] text-[#D0D6BB]/40 block uppercase">SOPs</span>
                                  </div>
                                  <div className="bg-black/25 p-2 rounded-xl border border-white/5">
                                    <span className="text-white text-xs font-black block">{escCount}</span>
                                    <span className="text-[8px] text-[#D0D6BB]/40 block uppercase">escalations</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="border-t border-white/5 pt-3.5 flex items-center justify-between text-[9px] text-[#D0D6BB]/50 font-mono">
                              <span>{status === 'virtual_ai' ? 'Cloud Agent' : pos.office || 'Corporate'}</span>
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => {
                                    setActivePositionId(pos.id);
                                    openAddDrawer('role');
                                  }}
                                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[#D0D6BB] border border-white/10 rounded-lg text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer"
                                  disabled={status === 'virtual_ai'}
                                  style={{ opacity: status === 'virtual_ai' ? 0.3 : 1 }}
                                >
                                  + Role
                                </button>
                                <button 
                                  onClick={() => openEditDrawer('position', pos.id)}
                                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                              <button 
                                onClick={() => deleteItem('position', pos.id)}
                                className="p-1.5 hover:bg-red-500/20 text-red-300 rounded-lg transition-colors border border-transparent hover:border-red-500/10 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- STEP 2: ROLES --- */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
                {/* Left Panel: Position select list */}
                <div className="lg:col-span-1 space-y-2.5">
                  <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Select Position Seat</span>
                  <div className="space-y-1.5">
                    {model.positions.map(pos => {
                      const isSelected = activePositionId === pos.id;
                      const roleCount = model.roles.filter(r => r.positionId === pos.id).length;
                      return (
                        <button
                          key={pos.id}
                          onClick={() => selectPosition(pos.id)}
                          className={`w-full p-3 rounded-xl border transition-all text-left flex justify-between items-center cursor-pointer ${
                            isSelected 
                              ? 'bg-white/10 border-white/20 text-white font-bold' 
                              : 'bg-black/15 border-white/5 text-[#D0D6BB] hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <OrgAvatar name={pos.name} avatarUrl={pos.avatarUrl} avatarCrop={pos.avatarCrop} size={28} className="border border-white/5 shadow-sm" />
                            <div>
                              <span className="text-xs block leading-tight">{pos.name}</span>
                              <span className="text-[8px] font-mono uppercase text-[#D0D6BB]/40 block mt-0.5">{pos.title}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-black/25 text-[8px] font-mono text-white">
                            {roleCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Panel: Role editor summary */}
                <div className="lg:col-span-3 space-y-4">
                  <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Active Responsibilities & Mappings</span>
                  
                  {model.roles.filter(r => r.positionId === activePositionId).length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                      <p className="text-xs text-[#D0D6BB]">No roles mapped to this seat yet. Click "+ Add Role" to assign a responsibility.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {model.roles.filter(r => r.positionId === activePositionId).map(role => (
                        <div key={role.id} className="p-4 rounded-xl bg-black/15 border border-white/10 flex flex-col justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-white block">{role.name}</span>
                              <span className="px-2 py-0.5 rounded bg-black/20 text-[8px] font-mono text-[#D0D6BB] border border-white/5">
                                SLA: {role.defaultSla || '24h'}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#D0D6BB]/75 leading-relaxed font-sans">{role.description}</p>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[8px] font-mono uppercase tracking-wider text-[#D0D6BB]/40 block">Assigned Request Categories</span>
                            <div className="flex flex-wrap gap-1">
                              {role.categories.map((c, i) => (
                                <span key={i} className="px-2 py-0.5 bg-[#00635C]/30 text-[#D0D6BB] text-[8px] rounded border border-white/5 font-mono">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] text-[#D0D6BB]/60 font-mono">
                            <span>SOP checklists: {model.sops.filter(s => s.roleId === role.id).length}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditDrawer('role', role.id)}
                                className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white border border-white/10 rounded text-[9px] font-bold font-mono tracking-wide uppercase transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteItem('role', role.id)}
                                className="p-1 hover:bg-red-500/20 text-red-300 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- STEP 3: SOPS & KNOWLEDGE --- */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
                {/* Left Panel: Position & Role selectors & Filter lists */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Choose Position</span>
                    <select
                      value={activePositionId}
                      onChange={(e) => selectPosition(e.target.value)}
                      className="w-full p-2 bg-[#012620] border border-white/10 rounded-xl text-white text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="">-- All Positions --</option>
                      {model.positions.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Choose Role</span>
                    <select
                      value={activeRoleId}
                      onChange={(e) => setActiveRoleId(e.target.value)}
                      className="w-full p-2 bg-[#012620] border border-white/10 rounded-xl text-white text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="">-- All Roles --</option>
                      {model.roles.filter(r => !activePositionId || r.positionId === activePositionId).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Categories */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Source Filters</span>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: 'all', label: 'All Sources' },
                        { id: 'manual_sop', label: 'Manual SOPs' },
                        { id: 'pdf', label: 'PDF Files' },
                        { id: 'doc', label: 'Doc Files' },
                        { id: 'link', label: 'Links & Refs' },
                        { id: 'active', label: 'Active Only' },
                        { id: 'needs_review', label: 'Needs Review' },
                        { id: 'retell', label: 'Retell Synced' },
                        { id: 'ask_nest_ops', label: 'Ask Nest Ops' }
                      ].map(filterBtn => (
                        <button
                          key={filterBtn.id}
                          onClick={() => setStep3Filter(filterBtn.id as any)}
                          className={`w-full p-2 text-left text-[11px] rounded-lg transition-colors flex justify-between items-center cursor-pointer ${
                            step3Filter === filterBtn.id
                              ? 'bg-[#00635C] text-white font-bold'
                              : 'bg-black/10 text-[#D0D6BB] hover:bg-white/5'
                          }`}
                        >
                          <span>{filterBtn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Cards displaying checklists, policies, pdfs, and links */}
                <div className="lg:col-span-3 space-y-4">
                  
                  {/* Search Bar */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#D0D6BB]/60" />
                      <input
                        type="text"
                        value={step3Search}
                        onChange={(e) => setStep3Search(e.target.value)}
                        placeholder="Search SOP checklists and document files by title, tags, role, category..."
                        className="w-full pl-9 pr-4 py-2 bg-black/25 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Document & Checklist List */}
                  {filteredStep3Sops.length === 0 && filteredStep3Docs.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                      <FileText className="w-8 h-8 mx-auto text-[#D0D6BB]/30 mb-3" />
                      <p className="text-xs text-[#D0D6BB]">No matching SOPs or uploaded knowledge document assets found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* 1. Manual SOPs Cards */}
                      {filteredStep3Sops.map(sop => {
                        const ownerPos = model.positions.find(p => p.id === sop.ownerPositionId);
                        return (
                          <div key={sop.id} className="p-4 rounded-2xl bg-black/15 border border-white/10 flex flex-col justify-between gap-3 text-left hover:border-white/15 transition-all">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span className="text-xs font-bold text-white block leading-tight">{sop.name}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-mono text-emerald-300 tracking-wide uppercase">
                                  Manual SOP
                                </span>
                              </div>
                              <p className="text-[10px] text-[#D0D6BB] leading-relaxed line-clamp-2">{sop.purpose}</p>
                              
                              <div className="bg-black/25 p-2 rounded-xl border border-white/5 text-[9px] font-mono space-y-1 text-[#D0D6BB]/90">
                                <div><strong className="text-white">Trigger:</strong> {sop.trigger}</div>
                                <div className="flex gap-4 pt-0.5">
                                  <span>Steps: <strong className="text-white">{sop.steps.length}</strong></span>
                                  <span>Required Fields: <strong className="text-white">{sop.requiredInformation.length}</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Sync Status Toggles */}
                            <div className="border-t border-white/5 pt-2 space-y-2">
                              <div className="flex flex-wrap gap-2 text-[9px] font-mono">
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[#D0D6BB] hover:text-white">
                                  <input 
                                    type="checkbox" 
                                    checked={sop.includeInRouting ?? true} 
                                    onChange={() => toggleSopSetting(sop.id, 'includeInRouting')}
                                    className="rounded border-white/20 bg-black/30 accent-emerald-600 w-3 h-3" 
                                  />
                                  Routing
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[#D0D6BB] hover:text-white">
                                  <input 
                                    type="checkbox" 
                                    checked={sop.includeInRetell ?? true} 
                                    onChange={() => toggleSopSetting(sop.id, 'includeInRetell')}
                                    className="rounded border-white/20 bg-black/30 accent-emerald-600 w-3 h-3" 
                                  />
                                  Retell KB
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[#D0D6BB] hover:text-white">
                                  <input 
                                    type="checkbox" 
                                    checked={sop.includeInAskNestOps ?? true} 
                                    onChange={() => toggleSopSetting(sop.id, 'includeInAskNestOps')}
                                    className="rounded border-white/20 bg-black/30 accent-emerald-600 w-3 h-3" 
                                  />
                                  Ask Nest Ops
                                </label>
                              </div>

                              <div className="flex items-center justify-between text-[9px] font-mono text-[#D0D6BB]/40">
                                <span className="truncate max-w-[120px]">{ownerPos?.title || 'Unassigned Seat'}</span>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => openEditDrawer('sop', sop.id)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded text-[9px] font-bold uppercase transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteItem('sop', sop.id)}
                                    className="p-1 hover:bg-red-500/20 text-red-300 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* 2. Uploaded Documents & Links Cards */}
                      {filteredStep3Docs.map(doc => {
                        const ownerPos = model.positions.find(p => p.id === doc.ownerPositionId);
                        const isLink = doc.sourceType === 'link';
                        const docIcon = isLink ? <Link className="w-4 h-4 text-orange-400 shrink-0" /> : <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />;
                        
                        return (
                          <div key={doc.id} className="p-4 rounded-2xl bg-black/15 border border-white/10 flex flex-col justify-between gap-3 text-left hover:border-white/15 transition-all">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-2">
                                  {docIcon}
                                  <span className="text-xs font-bold text-white block leading-tight">{doc.title}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded border text-[8px] font-mono tracking-wide uppercase ${
                                  isLink 
                                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' 
                                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                                }`}>
                                  {doc.sourceType.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#D0D6BB] leading-relaxed line-clamp-2">{doc.aiSummary}</p>
                              
                              <div className="bg-black/25 p-2 rounded-xl border border-white/5 text-[9px] font-mono space-y-1 text-[#D0D6BB]/80">
                                <div><strong className="text-white">File Name:</strong> {doc.fileName || 'N/A'}</div>
                                <div className="flex justify-between">
                                  <span>Size: <strong className="text-white">{doc.fileSizeBytes ? `${(doc.fileSizeBytes / 1024).toFixed(0)} KB` : 'N/A'}</strong></span>
                                  <div className="flex items-center gap-1">
                                    <span>Extraction: </span>
                                    <button
                                      disabled={doc.extractionStatus === 'extracted'}
                                      onClick={() => handleRunDocExtraction(doc.id)}
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                        doc.extractionStatus === 'extracted'
                                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                                          : doc.extractionStatus === 'pending_extraction'
                                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20 hover:bg-amber-500/25 cursor-pointer'
                                            : 'bg-red-500/15 text-red-300 border border-red-500/20'
                                      }`}
                                    >
                                      {doc.extractionStatus.toUpperCase()}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Sync Status Toggles */}
                            <div className="border-t border-white/5 pt-2 space-y-2">
                              <div className="flex flex-wrap gap-2 text-[9px] font-mono">
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[#D0D6BB] hover:text-white">
                                  <input 
                                    type="checkbox" 
                                    checked={doc.includeInRouting} 
                                    onChange={() => toggleDocToggle(doc.id, 'includeInRouting')}
                                    className="rounded border-white/20 bg-black/30 accent-emerald-600 w-3 h-3" 
                                  />
                                  Routing
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[#D0D6BB] hover:text-white">
                                  <input 
                                    type="checkbox" 
                                    checked={doc.includeInRetell} 
                                    onChange={() => toggleDocToggle(doc.id, 'includeInRetell')}
                                    className="rounded border-white/20 bg-black/30 accent-emerald-600 w-3 h-3" 
                                  />
                                  Retell KB
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[#D0D6BB] hover:text-white">
                                  <input 
                                    type="checkbox" 
                                    checked={doc.includeInAskNestOps} 
                                    onChange={() => toggleDocToggle(doc.id, 'includeInAskNestOps')}
                                    className="rounded border-white/20 bg-black/30 accent-emerald-600 w-3 h-3" 
                                  />
                                  Ask Nest Ops
                                </label>
                              </div>

                              <div className="flex items-center justify-between text-[9px] font-mono text-[#D0D6BB]/40">
                                <span className="truncate max-w-[120px]">{ownerPos?.title || 'Unassigned Seat'}</span>
                                <div className="flex gap-1">
                                  {doc.storagePath && (
                                    <a
                                      href={`/api/org-knowledge/${doc.id}/download`}
                                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded text-[9px] font-bold uppercase transition-colors"
                                    >
                                      Download
                                    </a>
                                  )}
                                  <button
                                    onClick={() => openEditDrawer(isLink ? 'link' : 'document', doc.id)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded text-[9px] font-bold uppercase transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteItem('document', doc.id)}
                                    className="p-1 hover:bg-red-500/20 text-red-300 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  )}

                </div>
              </div>
            )}

            {/* --- STEP 4: ESCALATIONS --- */}
            {currentStep === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
                {/* Left Panel: Escalation selector lists */}
                <div className="lg:col-span-1 space-y-2.5">
                  <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Escalation Mappings</span>
                  <div className="space-y-1.5">
                    {model.escalationPolicies.map(esc => {
                      const isSelected = activeRoleId === esc.id; // Recycle state hook
                      return (
                        <button
                          key={esc.id}
                          onClick={() => openEditDrawer('escalation', esc.id)}
                          className={`w-full p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                            isSelected 
                              ? 'bg-white/10 border-white/20 text-white font-bold' 
                              : 'bg-black/15 border-white/5 text-[#D0D6BB] hover:bg-white/5'
                          }`}
                        >
                          <span className="text-xs block leading-tight">{esc.name}</span>
                          <span className="text-[8px] text-amber-300 font-mono uppercase block mt-0.5">{esc.urgency}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Panel: Rule editor summary */}
                <div className="lg:col-span-3 space-y-4">
                  <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Plain-English Rule Summary</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {model.escalationPolicies.map(esc => {
                      const target = model.positions.find(p => p.id === esc.escalateToPositionId);
                      
                      return (
                        <div key={esc.id} className="p-4 rounded-xl bg-black/15 border border-white/10 flex flex-col justify-between gap-4">
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-white block">{esc.name}</span>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-1 font-mono text-[9px] text-[#D0D6BB] leading-relaxed">
                              <div>
                                <span className="text-amber-300 uppercase font-bold">IF:</span> {esc.condition}
                              </div>
                              <div className="pt-1.5 border-t border-white/5 mt-1.5">
                                <span className="text-emerald-300 uppercase font-bold">THEN:</span> Escalate to <span className="inline-flex items-center gap-1"><OrgAvatar name={target ? target.name : ''} avatarUrl={target?.avatarUrl} avatarCrop={target?.avatarCrop} size={14} className="border border-white/10" /><strong className="text-white">{target ? target.name : 'Unknown'}</strong></span> ({esc.responseWindow} window)
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] text-[#D0D6BB]/60 font-mono">
                            <span>Channels: {(esc.channels || []).join(', ')}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditDrawer('escalation', esc.id)}
                                className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white border border-white/10 rounded text-[9px] font-bold font-mono tracking-wide uppercase transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteItem('escalation', esc.id)}
                                className="p-1 hover:bg-red-500/20 text-red-300 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* --- STEP 5: PREVIEW & ROUTING MATRIX --- */}
            {currentStep === 5 && (
              <div className="space-y-6 text-left">
                
                {/* Routing preview tester */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  <div className="bg-black/15 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Simulation Playground</span>
                      <p className="text-[10px] text-[#D0D6BB] mt-1 font-sans">
                        Select one of our preset request scenarios or type your own to verify routing mappings.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'I need a lockbox for 123 Oak Island Dr by tomorrow.',
                        'I need listing flyers for 456 River Wynd.',
                        'I have a commission question for a closing this week.',
                        'I have a compliance question about a contract.',
                        'The office AC is not working.'
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => {
                            setTestQuery(preset);
                            // Trigger match immediately
                            setTimeout(() => runTestPlayground(), 50);
                          }}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono text-[#D0D6BB] text-left max-w-full truncate cursor-pointer transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <textarea
                        value={testQuery}
                        onChange={(e) => setTestQuery(e.target.value)}
                        placeholder="Type standard transaction request..."
                        rows={3}
                        className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={runTestPlayground}
                      className="w-full py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-white/10 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Run Simulation
                    </button>
                  </div>

                  <div className="bg-black/20 border border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4">
                    {testResult ? (
                      <div className="space-y-4">
                        <div className="border-b border-white/5 pb-2">
                          <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/50 uppercase">Analysis Results</span>
                          <h4 className="text-xs font-bold text-white mt-1">Matched Category: <span className="text-emerald-300">{testResult.category}</span></h4>
                        </div>

                        {testResult.futureOwnerName && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] rounded-xl font-mono text-left space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-[11px]">
                              <span>⚠️ Staffing Gap Alert</span>
                            </div>
                            <p className="leading-relaxed">
                              This request maps to future seat <strong className="text-white">{testResult.futureOwnerName}</strong> (status: <span className="text-white font-bold">{testResult.futureOwnerStatus}</span>, which is not staffed yet).
                            </p>
                            <p className="leading-relaxed">
                              Routed to fallback active owner: <strong className="text-white">{testResult.primaryName}</strong>.
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                          <div className="bg-black/15 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[8px] text-[#D0D6BB] uppercase block">Primary Owner</span>
                            <strong className="text-white block mt-0.5">{testResult.primaryName}</strong>
                            <span className="text-[8px] text-[#D0D6BB]/40 block">{testResult.primaryTitle}</span>
                          </div>
                          <div className="bg-black/15 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[8px] text-[#D0D6BB] uppercase block">Backup Owner</span>
                            <strong className="text-white block mt-0.5">{testResult.backupName}</strong>
                          </div>
                        </div>

                        <div className="space-y-2 text-[9px] font-mono text-[#D0D6BB]">
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span>SLA Window:</span>
                            <span className="text-white font-bold">{testResult.sla}</span>
                          </div>
                        </div>

                        {testResult.sops.length > 0 && (
                          <div className="space-y-1 bg-teal-500/5 border border-teal-500/10 p-2.5 rounded-xl">
                            <span className="text-[8px] font-mono font-bold text-teal-300 uppercase block">Triggered SOP Checklist</span>
                            <span className="text-[10px] text-white font-bold block">{testResult.sops[0].name}</span>
                            <span className="text-[9px] text-[#D0D6BB] block truncate">{testResult.sops[0].purpose}</span>
                          </div>
                        )}

                        {testResult.knowledgeDocuments && testResult.knowledgeDocuments.length > 0 && (
                          <div className="space-y-1 bg-indigo-500/5 border border-indigo-500/10 p-2.5 rounded-xl">
                            <span className="text-[8px] font-mono font-bold text-indigo-300 uppercase block">Triggered Knowledge Sources</span>
                            {testResult.knowledgeDocuments.map((doc: any) => (
                              <div key={doc.id} className="flex justify-between text-[10px] text-white">
                                <span className="font-bold">{doc.title}</span>
                                <span className="text-[8px] font-mono uppercase text-[#D0D6BB]/50">{doc.fileName}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {testResult.escalations.length > 0 && (
                          <div className="space-y-1 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl">
                            <span className="text-[8px] font-mono font-bold text-amber-300 uppercase block">Escalation Policy</span>
                            <span className="text-[10px] text-white font-bold block">{testResult.escalations[0].name}</span>
                            <span className="text-[9px] text-[#D0D6BB] block">Condition: {testResult.escalations[0].condition}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center p-4">
                        <p className="text-[10px] text-[#D0D6BB]/60 italic">Submit a simulation query to preview routing outputs.</p>
                      </div>
                    )}
                  </div>

                </div>

                {/* Routing Matrix Sub-table */}
                <div className="space-y-3.5 pt-4 border-t border-white/5">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Routing Matrix Mappings</span>
                    <p className="text-[10px] text-[#D0D6BB] font-sans mt-0.5">Edit category parameters directly below.</p>
                  </div>
                  
                  <div className="overflow-x-auto border border-white/10 rounded-2xl bg-black/25">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-[#D0D6BB] font-mono text-[9px] uppercase">
                          <th className="p-3">Category</th>
                          <th className="p-3">Primary Owner</th>
                          <th className="p-3">Backup Owner</th>
                          <th className="p-3">SLA</th>
                          <th className="p-3">Escalation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(model.routingMatrix || []).map((row, idx) => (
                          <tr key={idx} className="border-b border-white/5 last:border-b-0 hover:bg-white/2">
                            <td className="p-3 font-semibold text-white">{row.category}</td>
                            <td className="p-3">
                              <select
                                value={row.primaryOwnerPositionId}
                                onChange={(e) => {
                                  const updated = (model.routingMatrix || []).map((r, i) => i === idx ? { ...r, primaryOwnerPositionId: e.target.value } : r);
                                  markChanged({ ...model, routingMatrix: updated });
                                }}
                                className="p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white focus:outline-none text-xs cursor-pointer"
                              >
                                {model.positions.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={row.backupOwnerPositionId}
                                onChange={(e) => {
                                  const updated = (model.routingMatrix || []).map((r, i) => i === idx ? { ...r, backupOwnerPositionId: e.target.value } : r);
                                  markChanged({ ...model, routingMatrix: updated });
                                }}
                                className="p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white focus:outline-none text-xs cursor-pointer"
                              >
                                {model.positions.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={row.sla}
                                onChange={(e) => {
                                  const updated = (model.routingMatrix || []).map((r, i) => i === idx ? { ...r, sla: e.target.value } : r);
                                  markChanged({ ...model, routingMatrix: updated });
                                }}
                                className="p-1.5 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none text-xs font-mono w-24"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={row.escalationPolicyId || ''}
                                onChange={(e) => {
                                  const updated = (model.routingMatrix || []).map((r, i) => i === idx ? { ...r, escalationPolicyId: e.target.value || undefined } : r);
                                  markChanged({ ...model, routingMatrix: updated });
                                }}
                                className="p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white focus:outline-none text-xs cursor-pointer"
                              >
                                <option value="">None (Standard SLA)</option>
                                {model.escalationPolicies.map(esc => (
                                  <option key={esc.id} value={esc.id}>{esc.name}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Stepper Footer Controls */}
          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between shrink-0 select-none">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1) as any)}
              disabled={currentStep === 1}
              className={`px-4 py-2 border rounded-xl text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                currentStep === 1 
                  ? 'border-white/5 text-[#D0D6BB]/20 cursor-not-allowed' 
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={() => setCurrentStep(prev => Math.min(5, prev + 1) as any)}
              disabled={currentStep === 5}
              className={`px-4 py-2 border rounded-xl text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                currentStep === 5 
                  ? 'border-white/5 text-[#D0D6BB]/20 cursor-not-allowed' 
                  : 'bg-[#00635C] hover:bg-[#004d47] border-white/20 text-white'
              }`}
            >
              Next
            </button>
          </div>
        </div>

        {/* Right Column: Contextual Help & Forecast Panel */}
        <div className="w-full md:w-80 shrink-0 bg-[#012a23] border-l border-white/10 p-5 text-left flex flex-col gap-5 overflow-y-auto">
          {/* Section 1: Help/Tips depending on Step */}
          <div className="space-y-3.5">
            <span className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider block font-mono border-b border-white/5 pb-1">
              Contextual Tips
            </span>
            {currentStep === 1 && (
              <div className="space-y-3 text-xs text-[#D0D6BB] leading-relaxed">
                <h4 className="font-serif font-black text-white uppercase tracking-wider">Seats & Positions</h4>
                <p>Positions represent seats in the brokerage. You can configure active employees, planned recruits, fractional seats, and AI tools.</p>
                <p className="bg-black/25 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-amber-300">
                  <strong>Tip:</strong> Define open or planned positions to plan future team scaling.
                </p>
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-3 text-xs text-[#D0D6BB] leading-relaxed">
                <h4 className="font-serif font-black text-white uppercase tracking-wider">Roles & Responsibilities</h4>
                <p>Assign specific areas of responsibility (e.g. compliance, marketing) to seats so tickets route correctly.</p>
                <p className="bg-black/25 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-[#D0D6BB]">
                  <strong>Tip:</strong> An unstaffed seat's roles will automatically route to its fallback active manager.
                </p>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-3 text-xs text-[#D0D6BB] leading-relaxed">
                <h4 className="font-serif font-black text-white uppercase tracking-wider">SOPs & Knowledge</h4>
                <p>Upload files or checklists. Ask Nest Ops uses these files to guide agents with exact execution details.</p>
                <p className="bg-black/25 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-[#D0D6BB]">
                  <strong>Tip:</strong> Attach checklists to the primary position that owns the operational workflow.
                </p>
              </div>
            )}
            {currentStep === 4 && (
              <div className="space-y-3 text-xs text-[#D0D6BB] leading-relaxed">
                <h4 className="font-serif font-black text-white uppercase tracking-wider">Escalation Policies</h4>
                <p>Define logic rules (SLA windows, notification channels) for handoffs if the primary owner is slow to respond.</p>
                <p className="bg-black/25 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-amber-300">
                  <strong>Note:</strong> If the target position is unstaffed, choosing an active fallback manager is required.
                </p>
              </div>
            )}
            {currentStep === 5 && (
              <div className="space-y-3 text-xs text-[#D0D6BB] leading-relaxed">
                <h4 className="font-serif font-black text-white uppercase tracking-wider">AI Routing Playground</h4>
                <p>Type in mock client/agent requests to simulate ticket triage. Verify routing paths and check for staffing warnings.</p>
                <p className="bg-black/25 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-emerald-400">
                  <strong>Example:</strong> Try typing: "The lockbox is jammed on Edgewater."
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Gaps & Planning Summary */}
          <div className="space-y-3 border-t border-white/5 pt-4">
            <span className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider block font-mono border-b border-white/5 pb-1">
              Hiring & Staffing Forecast
            </span>
            {(() => {
              const activeCount = model.positions.filter(p => !p.status || p.status === 'active' || p.status === 'fractional' || p.status === 'outsourced').length;
              const openCount = model.positions.filter(p => p.status === 'open' || p.status === 'wanted').length;
              const plannedCount = model.positions.filter(p => p.status === 'planned').length;
              const aiCount = model.positions.filter(p => p.status === 'virtual_ai').length;
              
              const priorityMap: Record<string, number> = { low: 1, normal: 2, high: 3, urgent: 4 };
              const neededSeats = model.positions
                .filter(p => ['open', 'planned', 'wanted'].includes(p.status || ''))
                .sort((a, b) => (priorityMap[b.priority || 'normal'] || 2) - (priorityMap[a.priority || 'normal'] || 2));

              return (
                <div className="space-y-3 font-mono text-[10px] text-[#D0D6BB]">
                  <div className="grid grid-cols-2 gap-2 text-center text-[9px]">
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                      <strong className="text-white text-xs block">{activeCount}</strong>
                      <span>Staffed</span>
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                      <strong className="text-amber-400 text-xs block">{openCount + plannedCount}</strong>
                      <span>Gaps/Planned</span>
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5 col-span-2">
                      <strong className="text-emerald-300 text-xs block">{aiCount} Positions</strong>
                      <span>AI Integrated Agents</span>
                    </div>
                  </div>

                  {neededSeats.length > 0 && (
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <span className="text-[9px] uppercase text-[#D0D6BB]/50 block font-bold">Needs Hiring/Staffing:</span>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {neededSeats.map(seat => (
                          <div key={seat.id} className="flex justify-between items-center bg-black/15 p-2 rounded-lg border border-white/5 text-[9px]">
                            <div className="truncate pr-1">
                              <div className="font-bold text-white truncate">{seat.name}</div>
                              <div className="text-[8px] text-[#D0D6BB]/60 truncate">{seat.title}</div>
                            </div>
                            <span className={`px-1.5 py-0.2 rounded font-bold shrink-0 text-[7px] uppercase ${
                              seat.priority === 'urgent' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              seat.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-white/5 text-[#D0D6BB]'
                            }`}>
                              {seat.priority || 'normal'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      )}

        {activeTab === 'overview' && (
          <div className="flex-grow overflow-y-auto p-6 space-y-6 text-left bg-[#013028]">
            <div className="max-w-[1200px] mx-auto space-y-6">
              {/* Header */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-serif font-black text-white uppercase tracking-tight">Wilmington Workspace Overview</h3>
                  <p className="text-xs text-[#D0D6BB]">Operational intelligence, roles, and automated routing parameters.</p>
                </div>
                <div className="flex gap-2">
                  {false && (
                    <button onClick={() => window.print()} className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5 print:hidden">
                      <Printer className="w-3.5 h-3.5" />
                      Print Model
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('by_position')}
                  className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00635C] rounded-2xl space-y-1.5 text-left transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#00635C]"
                  title="View Position Overview"
                >
                  <span className="text-xs font-sans font-bold text-[#D0D6BB] block uppercase tracking-wider group-hover:text-white transition-colors">Total Seats</span>
                  <span className="text-3xl font-serif font-black text-white block">{model.positions.length}</span>
                  <span className="text-[10px] text-[#D0D6BB]/70 block font-sans">View position roster ➔</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('by_position')}
                  className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-500/50 rounded-2xl space-y-1.5 text-left transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-rose-500"
                  title="View Vacant Position Gaps"
                >
                  <span className="text-xs font-sans font-bold text-rose-300/80 block uppercase tracking-wider group-hover:text-rose-200 transition-colors">Vacant Gaps</span>
                  <span className="text-3xl font-serif font-black text-rose-400 block">{model.positions.filter(p => p.status === 'open').length}</span>
                  <span className="text-[10px] text-[#D0D6BB]/70 block font-sans">View vacant seats ➔</span>
                </button>

                <button
                  type="button"
                  onClick={() => state?.setCurrentTab && state.setCurrentTab('Knowledge / SOPs')}
                  className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 rounded-2xl space-y-1.5 text-left transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  title="Open SOP Library"
                >
                  <span className="text-xs font-sans font-bold text-emerald-300/80 block uppercase tracking-wider group-hover:text-emerald-200 transition-colors">Active SOPs</span>
                  <span className="text-3xl font-serif font-black text-emerald-400 block">{model.sops.length}</span>
                  <span className="text-[10px] text-[#D0D6BB]/70 block font-sans">Open SOP Library ➔</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('escalations')}
                  className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 rounded-2xl space-y-1.5 text-left transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-500"
                  title="Open Escalation Policies"
                >
                  <span className="text-xs font-sans font-bold text-amber-300/80 block uppercase tracking-wider group-hover:text-amber-200 transition-colors">Escalation Rules</span>
                  <span className="text-3xl font-serif font-black text-amber-300 block">{model.escalationPolicies.length}</span>
                  <span className="text-[10px] text-[#D0D6BB]/70 block font-sans">View escalation policies ➔</span>
                </button>
              </div>

              {/* Roster & Escalation Fallback Settings */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/10 pb-3 gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider font-sans">Active Roster & Escalation Fallback Settings</h4>
                    <p className="text-[11px] text-[#D0D6BB]/70 font-sans mt-0.5">Defines who should receive an escalation when the primary recipient is unavailable or does not respond. (Configurations, not active incidents)</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('escalations')}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[#D0D6BB] hover:text-white rounded-xl text-[10px] font-sans font-bold uppercase transition-colors cursor-pointer"
                    >
                      View Policies
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setDrawerType('position');
                        setDrawerMode('add');
                        setDrawerOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-[10px] font-sans font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      + Add Team Member
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {model.positions.map(p => {
                    const backup = model.positions.find(x => x.id === p.backupPositionId);
                    const roles = model.roles.filter(r => r.positionId === p.id || p.roleIds?.includes(r.id));
                    const sops = model.sops.filter(s => s.ownerPositionId === p.id);
                    const kbs = (model.knowledgeDocuments || []).filter(kd => kd.ownerPositionId === p.id || kd.uploadedBy === p.name);
                    const routing = (model.routingMatrix || []).filter(r => r.primaryOwnerPositionId === p.id);

                    return (
                      <div key={p.id} className="p-4 bg-black/20 border border-white/5 rounded-xl flex flex-col justify-between gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <OrgAvatar name={p.name} avatarUrl={p.avatarUrl} avatarCrop={p.avatarCrop} size={40} className="border border-white/10" />
                            <div>
                              <h5 className="text-xs font-bold text-white">{p.name}</h5>
                              <span className="text-[9px] font-mono text-[#D0D6BB]/60 uppercase block leading-tight">{p.title}</span>
                              <div className="text-[9px] text-[#D0D6BB]/40 mt-1 space-y-0.5 font-sans leading-none">
                                {p.email && <div className="truncate max-w-[160px]">{p.email}</div>}
                                {p.phone && <div>{p.phone}</div>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-mono text-[#D0D6BB]/40 block uppercase leading-none">Backup</span>
                            <span className="text-xs font-semibold text-emerald-300">{backup ? backup.name : '(None)'}</span>
                          </div>
                        </div>

                        {/* Roles, SOPs, Knowledge, and Routing Grid */}
                        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/5 text-[9px]">
                          <div>
                            <span className="text-[8px] font-mono text-[#D0D6BB]/35 block uppercase font-bold mb-1">Roles & Routing</span>
                            <div className="flex flex-wrap gap-1">
                              {roles.length > 0 ? (
                                roles.map(r => (
                                  <span key={r.id} className="px-1.5 py-0.5 bg-teal-500/10 text-teal-300 rounded border border-teal-500/10 font-sans text-[8px]" title={r.description}>
                                    {r.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[#D0D6BB]/35 italic">No roles</span>
                              )}
                              {routing.map(r => (
                                <span key={r.category} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-300 rounded border border-blue-500/10 font-sans text-[8px]" title={`Primary Owner for ${r.category}`}>
                                  ➔ {r.category}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[8px] font-mono text-[#D0D6BB]/35 block uppercase font-bold mb-1">SOPs & Knowledge</span>
                            <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto pr-1">
                              {sops.map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSopForModal(s);
                                    setSopModalOpen(true);
                                  }}
                                  className="text-[8.5px] text-emerald-400 font-sans truncate text-left hover:underline cursor-pointer bg-transparent border-none p-0 leading-tight w-full"
                                  title={s.purpose}
                                >
                                  📋 {s.name}
                                </button>
                              ))}
                              {kbs.map(k => (
                                <div key={k.id} className="text-[8px] text-amber-300 font-sans truncate" title={k.fileName}>
                                  📄 {k.fileName}
                                </div>
                              ))}
                              {sops.length === 0 && kbs.length === 0 && (
                                <span className="text-[#D0D6BB]/35 italic text-[8px]">No documents</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Connected Tools (OAuth) Roster View */}
                        {p.connectedTools && p.connectedTools.length > 0 && (
                          <div className="pt-2.5 border-t border-white/5 space-y-1">
                            <span className="text-[8px] font-mono text-[#D0D6BB]/35 block uppercase font-bold">Personal Connected Tools (OAuth)</span>
                            <div className="flex flex-wrap gap-1">
                              {p.connectedTools.map((tool) => {
                                const toolIcons: Record<string, any> = {
                                  'Gmail': Mail,
                                  'Google Calendar': Calendar,
                                  'Google Drive': Folder,
                                  'Rechat': Users,
                                  'Dotloop': FileText,
                                  'QuickBooks': Layers,
                                  'Basecamp': Zap,
                                  'Slack': MessageSquare,
                                  'Canva': Palette,
                                  'Microsoft Teams': MessageSquare
                                };
                                const ToolIcon = toolIcons[tool] || Zap;
                                return (
                                  <span key={tool} className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/10 text-[8px] font-sans font-medium">
                                    <ToolIcon className="w-2.5 h-2.5" />
                                    {tool}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Roster Actions */}
                        <div className="flex items-center gap-2 mt-1 border-t border-white/5 pt-2.5 w-full justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(p.id);
                              setDrawerType('position');
                              setDrawerMode('edit');
                              setDrawerOpen(true);
                            }}
                            className="text-[9px] font-mono text-[#D0D6BB]/60 hover:text-white transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <span className="text-white/10 text-[9px] font-mono">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${p.name}?`)) {
                                const newModel = { ...model };
                                newModel.positions = newModel.positions.filter(pos => pos.id !== p.id);
                                newModel.connections = newModel.connections.filter(c => c.fromPositionId !== p.id && c.toPositionId !== p.id);
                                if (newModel.visualConnections) {
                                  newModel.visualConnections = newModel.visualConnections.filter(c => c.fromPositionId !== p.id && c.toPositionId !== p.id);
                                }
                                markChanged(newModel);
                              }
                            }}
                            className="text-[9px] font-mono text-rose-400/80 hover:text-rose-300 transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'org_chart' || activeTab === 'workflow') && renderVisualOrgMap()}

        {activeTab === 'by_position' && renderPositionViewDashboard()}

        {activeTab === 'routing' && (() => {
          const routingRules = model.routingMatrix || [];
          const filteredRoutingRules = routingRules.filter(row => 
            row.category.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
            (row.description && row.description.toLowerCase().includes(routeSearchQuery.toLowerCase()))
          );
          const activeRouteCategory = selectedRouteId || (filteredRoutingRules[0]?.category || '');
          const activeRoute = routingRules.find(r => r.category === activeRouteCategory);

          const toolLibraries = [
            {
              name: 'Communication',
              tools: [
                { name: 'Gmail', icon: Mail, color: 'text-red-400 bg-red-400/10' },
                { name: 'Slack', icon: MessageSquare, color: 'text-purple-400 bg-purple-400/10' },
                { name: 'Microsoft Teams', icon: MessageSquare, color: 'text-blue-400 bg-blue-400/10' },
                { name: 'SMS / Phone', icon: Phone, color: 'text-emerald-400 bg-emerald-400/10' }
              ]
            },
            {
              name: 'Transactions & Files',
              tools: [
                { name: 'Rechat', icon: Home, color: 'text-amber-400 bg-amber-400/10' },
                { name: 'Dotloop', icon: PenTool, color: 'text-sky-400 bg-sky-400/10' },
                { name: 'Google Drive', icon: Folder, color: 'text-yellow-400 bg-yellow-400/10' },
                { name: 'Google Calendar', icon: Calendar, color: 'text-indigo-400 bg-indigo-400/10' },
                { name: 'Canva', icon: Palette, color: 'text-pink-400 bg-pink-400/10' }
              ]
            },
            {
              name: 'Operations & AI',
              tools: [
                { name: 'AI Voice/Chat Agents', icon: Zap, color: 'text-teal-400 bg-teal-400/10' },
                { name: 'QuickBooks', icon: Settings, color: 'text-green-400 bg-green-400/10' },
                { name: 'Basecamp', icon: Layers, color: 'text-orange-400 bg-orange-400/10' },
                { name: 'Brokerage Dashboard', icon: Info, color: 'text-slate-400 bg-slate-400/10' }
              ]
            }
          ];

          const getRecommendedTools = (categoryName: string) => {
            const cat = categoryName.toLowerCase();
            if (cat.includes('compliance') || cat.includes('close') || cat.includes('closing') || cat.includes('contract') || cat.includes('legal') || cat.includes('signature')) {
              return ['Dotloop', 'Google Drive', 'Gmail', 'Brokerage Dashboard'];
            }
            if (cat.includes('agent') || cat.includes('question') || cat.includes('support') || cat.includes('help') || cat.includes('chat') || cat.includes('voice')) {
              return ['AI Voice/Chat Agents', 'Slack', 'Gmail', 'SMS / Phone'];
            }
            if (cat.includes('finance') || cat.includes('bill') || cat.includes('commission') || cat.includes('accounting') || cat.includes('audit')) {
              return ['QuickBooks', 'Google Drive', 'Brokerage Dashboard'];
            }
            if (cat.includes('calendar') || cat.includes('schedule') || cat.includes('meeting') || cat.includes('event')) {
              return ['Google Calendar', 'Gmail', 'Slack', 'Microsoft Teams'];
            }
            return ['Gmail', 'Slack', 'Brokerage Dashboard', 'AI Voice/Chat Agents'];
          };

          const getPlainLanguageSummary = (row: RoutingMatrixItem) => {
            const primary = model.positions.find(p => p.id === row.primaryOwnerPositionId);
            const backup = model.positions.find(p => p.id === row.backupOwnerPositionId);
            const policy = model.escalationPolicies.find(e => e.id === row.escalationPolicyId);
            const policyTarget = policy ? model.positions.find(p => p.id === policy.escalateToPositionId) : null;
            const officeText = row.officeCondition?.office && row.officeCondition.office !== 'All Offices' ? ` (for Office: ${row.officeCondition.office})` : '';

            return `When a request for "${row.displayName || row.category || '...'}" is received${officeText}, it will route by position to ${primary ? primary.title : '...'} (${primary ? primary.name : 'Unassigned'}). If they are unavailable, ${backup ? backup.name : 'No Backup'} (${backup ? backup.title : ''}) acts as backup coverage. Expected SLA: ${row.sla || '4 hours'}${policy ? `, escalating to ${policyTarget ? policyTarget.name : 'policy target'}` : ''}.`;
          };

          const updateActiveRoute = (updates: Partial<RoutingMatrixItem>) => {
            if (!activeRoute) return;
            const updated = routingRules.map(r => r.category === activeRoute.category ? { ...r, ...updates } : r);
            if (updates.category && updates.category !== activeRoute.category) {
              setSelectedRouteId(updates.category);
            }
            markChanged({ ...model, routingMatrix: updated });
          };

          const deleteRoute = (categoryToDelete?: string) => {
            const targetCat = categoryToDelete || activeRoute?.category;
            if (!targetCat) return;
            if (confirm(`Are you sure you want to delete the routing rule for "${targetCat}"?`)) {
              const updated = routingRules.filter(r => r.category !== targetCat);
              markChanged({ ...model, routingMatrix: updated });
              if (selectedRouteId === targetCat || !selectedRouteId) {
                setSelectedRouteId(updated[0]?.category || '');
              }
            }
          };

          return (
            <div className="flex-1 overflow-y-auto p-6 text-left bg-[#013028] font-sans">
              <div className="w-full max-w-7xl mx-auto space-y-6">
                
                {/* Header area */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-serif font-black text-white uppercase tracking-tight">Request Routing</h3>
                    <p className="text-xs text-[#D0D6BB] font-sans mt-1">Configure default owners, response times, and automated next steps for inbound requests.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRouteData({
                        category: `New Category ${model.routingMatrix?.length ? model.routingMatrix.length + 1 : 1}`,
                        description: '',
                        exampleRequest: '',
                        primaryOwnerPositionId: model.positions[0]?.id || '',
                        backupOwnerPositionId: model.positions[0]?.id || '',
                        sla: '24 hours',
                        status: 'draft',
                        postAssignmentSteps: ['Log intake ticket', 'Notify assignee', 'Monitor response window']
                      });
                      setIsCreatingNewRoute(true);
                      setRoutingModalStep(1);
                      setIsRoutingModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 animate-pulse"
                  >
                    <Plus className="w-4 h-4" /> Add Routing Rule
                  </button>
                </div>

                {/* SOP & SLA Integration Guidance Banner */}
                <div className="bg-emerald-950/25 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 text-left">
                  <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">SOP & SLA Integration</h4>
                    <p className="text-[11px] text-[#D0D6BB] leading-relaxed font-sans">
                      Request Routing rules map inbound client/agent signals directly to the standard operating checklists you build under the <strong>SOPs & Knowledge</strong> tab. 
                      When an inbound request matches a category configured here, its corresponding SOP is automatically fetched, assigned, and tracked against the escalation policy.
                    </p>
                  </div>
                </div>

                {/* Two Panel Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Left Panel: Search & List */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-4">
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#D0D6BB]/50 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={routeSearchQuery}
                        onChange={(e) => setRouteSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-black/25 border border-white/10 rounded-xl text-white text-xs focus:outline-none placeholder-[#D0D6BB]/40"
                      />
                    </div>

                    <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                      {filteredRoutingRules.map((row, idx) => {
                        const primary = model.positions.find(p => p.id === row.primaryOwnerPositionId);
                        const backup = model.positions.find(p => p.id === row.backupOwnerPositionId);
                        const sop = model.sops.find(s => s.id === row.sopId);
                        const isSelected = activeRouteCategory === (row.displayName || row.category);
                        const office = row.officeCondition?.office || 'All Offices';

                        // Check for duplicate rules (matching category and officeCondition)
                        const duplicates = routingRules.filter(r => r.category === row.category && (r.officeCondition?.office || 'All Offices') === office);
                        const isDuplicate = duplicates.length > 1;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedRouteId(row.displayName || row.category)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer block ${
                              isSelected
                                ? 'bg-[#004D47] border-emerald-500/40 text-white shadow-lg'
                                : 'bg-black/15 border-white/5 hover:border-white/15 text-[#D0D6BB]'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-1 min-w-0">
                                <h4 className="text-xs font-bold font-serif text-white truncate">
                                  {row.displayName || row.category}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#D0D6BB] text-[9px] font-sans font-medium">
                                    Office: {office}
                                  </span>
                                  {isDuplicate && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[8px] font-mono font-bold uppercase border border-amber-500/30" title="Duplicate rule detected for this category and office">
                                      Duplicate Rule
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                  row.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                                  row.status === 'draft' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/50'
                                }`}>
                                  {row.status || 'active'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingRouteData({ ...row });
                                    setIsCreatingNewRoute(false);
                                    setRoutingModalStep(1);
                                    setIsRoutingModalOpen(true);
                                  }}
                                  className="p-1 hover:bg-emerald-500/20 text-[#D0D6BB] hover:text-white rounded transition-all cursor-pointer"
                                  title="Configure Rule in Wizard"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteRoute(row.category);
                                  }}
                                  className="p-1 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-all cursor-pointer"
                                  title="Delete Routing Rule"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {row.description && (
                              <p className="text-[10px] opacity-75 mt-1.5 line-clamp-1">{row.description}</p>
                            )}

                            <div className="space-y-1 mt-3 pt-2.5 border-t border-white/5 text-[10px] font-sans">
                              <div className="flex justify-between items-center text-[#D0D6BB]">
                                <span>Position: <strong className="text-white">{primary ? primary.title : 'Unassigned'}</strong></span>
                                <span className="text-[#D0D6BB]/60 text-[9px] font-mono">SLA: {row.sla}</span>
                              </div>
                              <div className="flex justify-between items-center text-emerald-300 font-semibold text-[10px]">
                                <span>Active Person: <strong>{primary ? primary.name : 'None'}</strong></span>
                                {backup && <span className="text-[#D0D6BB]/70 text-[9px] font-normal">Backup: {backup.name.split(' ')[0]}</span>}
                              </div>
                              {sop && (
                                <div className="text-[9px] text-[#D0D6BB]/60 truncate pt-0.5">
                                  Mapped SOP: <span className="text-emerald-400 font-mono">{sop.title}</span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}

                      {filteredRoutingRules.length === 0 && (
                        <div className="text-center py-6 text-xs text-[#D0D6BB]/40 font-mono">
                          No rules found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Panel: Editor Form */}
                  <div className="lg:col-span-2">
                    {activeRoute ? (
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                        
                        {/* Dynamic Plain Language Summary */}
                        <div className="bg-[#012520] border border-white/10 rounded-2xl p-4 text-xs leading-relaxed text-emerald-300 font-serif italic">
                          <strong className="text-white block font-sans font-bold uppercase tracking-wider text-[9px] not-italic mb-1 text-emerald-400">Plain-Language Summary:</strong>
                          "{getPlainLanguageSummary(activeRoute)}"
                        </div>

                        {/* Step-by-Step Conversational Builder */}
                        <div className="space-y-6 text-xs font-sans text-left">
                          
                          {/* Step 1 */}
                          <div className="bg-black/20 border border-white/5 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[11px] font-mono font-bold text-emerald-400 shrink-0">01</span>
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-none">What kind of request is this?</h4>
                                <p className="text-[9px] text-[#D0D6BB]/50 mt-1">Name this rule and specify what type of messages it handles.</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#D0D6BB]/70 uppercase font-mono block">Rule / Category Name</label>
                                <input
                                  type="text"
                                  value={activeRoute.category}
                                  onChange={(e) => updateActiveRoute({ category: e.target.value })}
                                  placeholder="e.g. Compliance Review"
                                  className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#D0D6BB]/70 uppercase font-mono block">Active Status</label>
                                <select
                                  value={activeRoute.status || 'active'}
                                  onChange={(e) => updateActiveRoute({ status: e.target.value as any })}
                                  className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                                >
                                  <option value="active">Active (Running)</option>
                                  <option value="draft">Draft (Saved only)</option>
                                  <option value="archived">Archived (Inactive)</option>
                                </select>
                              </div>

                              {/* Structured Office Condition */}
                              <div className="space-y-1 md:col-span-2 p-3 bg-black/25 border border-white/5 rounded-xl">
                                <label className="text-[9px] font-bold text-emerald-400 uppercase font-sans tracking-wider block">Office Routing Condition</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                  <div>
                                    <label className="text-[8px] font-mono text-[#D0D6BB]/60 uppercase block">Operator</label>
                                    <select
                                      value={activeRoute.officeCondition?.operator || 'is'}
                                      onChange={(e) => updateActiveRoute({
                                        officeCondition: {
                                          office: activeRoute.officeCondition?.office || 'All Offices',
                                          operator: e.target.value as any
                                        }
                                      })}
                                      className="w-full p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs focus:outline-none cursor-pointer"
                                    >
                                      <option value="is">Is</option>
                                      <option value="is_not">Is not</option>
                                      <option value="is_any_of">Is any of</option>
                                      <option value="is_not_any_of">Is not any of</option>
                                      <option value="is_unknown">Is unknown</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[8px] font-mono text-[#D0D6BB]/60 uppercase block">Target Office</label>
                                    <select
                                      value={activeRoute.officeCondition?.office || 'All Offices'}
                                      onChange={(e) => updateActiveRoute({
                                        officeCondition: {
                                          office: e.target.value,
                                          operator: activeRoute.officeCondition?.operator || 'is'
                                        }
                                      })}
                                      className="w-full p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs focus:outline-none cursor-pointer"
                                    >
                                      <option value="All Offices">All Offices (Default Workspace)</option>
                                      <option value="Mayfaire">Mayfaire</option>
                                      <option value="Carolina Beach">Carolina Beach</option>
                                      <option value="Hampstead">Hampstead</option>
                                      <option value="Remote / Home">Remote / Home</option>
                                    </select>
                                  </div>
                                </div>
                                <p className="text-[9px] text-[#D0D6BB]/60 mt-1 font-sans">
                                  Routes requests by <strong>Request Category + Office + Position</strong> to dynamically resolve the active team member without hardcoding individuals.
                                </p>
                              </div>

                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[9px] font-bold text-[#D0D6BB]/70 uppercase font-mono block">Simple Description</label>
                                <textarea
                                  value={activeRoute.description || ''}
                                  onChange={(e) => updateActiveRoute({ description: e.target.value })}
                                  rows={2}
                                  placeholder="What questions or files does this rule handle? (e.g. Questions about commission checks and closing documents)"
                                  className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                                />
                              </div>

                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[9px] font-bold text-[#D0D6BB]/70 uppercase font-mono block">Example Message (Intake Example)</label>
                                <input
                                  type="text"
                                  value={activeRoute.exampleRequest || ''}
                                  onChange={(e) => updateActiveRoute({ exampleRequest: e.target.value })}
                                  placeholder="e.g. 'How do I submit my closing package for BIC review?'"
                                  className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Step 2 */}
                          <div className="bg-black/20 border border-white/5 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[11px] font-mono font-bold text-emerald-400 shrink-0">02</span>
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-none">Who is responsible for this?</h4>
                                <p className="text-[9px] text-[#D0D6BB]/50 mt-1">Assign a primary owner and a backup person to cover if they are busy.</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#D0D6BB]/70 uppercase font-mono block">Primary Owner (First Responder)</label>
                                <select
                                  value={activeRoute.primaryOwnerPositionId}
                                  onChange={(e) => updateActiveRoute({ primaryOwnerPositionId: e.target.value })}
                                  className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                                >
                                  {model.positions.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#D0D6BB]/70 uppercase font-mono block">Backup Owner (Backup Coverage)</label>
                                <select
                                  value={activeRoute.backupOwnerPositionId}
                                  onChange={(e) => updateActiveRoute({ backupOwnerPositionId: e.target.value })}
                                  className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                                >
                                  {model.positions.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Step 3 */}
                          <div className="bg-black/20 border border-white/5 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[11px] font-mono font-bold text-emerald-400 shrink-0">03</span>
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-none">Response Speed & Escalation</h4>
                                <p className="text-[9px] text-[#D0D6BB]/50 mt-1">Define reply expectations and who should step in if things get delayed.</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#D0D6BB]/70 uppercase font-mono block">Expected Reply Speed (SLA)</label>
                                <input
                                  type="text"
                                  value={activeRoute.sla}
                                  onChange={(e) => updateActiveRoute({ sla: e.target.value })}
                                  placeholder="e.g. 2 hours, 24 hours"
                                  className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#D0D6BB]/70 uppercase font-mono block">Send Alerts To (Notification Channel)</label>
                                <select
                                  value={activeRoute.notificationMethod || 'Email & Dashboard'}
                                  onChange={(e) => updateActiveRoute({ notificationMethod: e.target.value })}
                                  className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                                >
                                  <option value="Email & Dashboard">Email & Dashboard Alert</option>
                                  <option value="SMS Text Alert">SMS Text Alert</option>
                                  <option value="Slack Channel Notification">Slack Channel Notification</option>
                                  <option value="All Methods">All Channels</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#D0D6BB]/70 uppercase font-mono block">Escalate If Delayed (Response Window)</label>
                                <input
                                  type="text"
                                  value={activeRoute.escalateWhen || ''}
                                  onChange={(e) => updateActiveRoute({ escalateWhen: e.target.value })}
                                  placeholder="e.g. If unresolved after 4 hours"
                                  className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#D0D6BB]/70 uppercase font-mono block">Escalate To (Escalation Path)</label>
                                <select
                                  value={activeRoute.escalationPolicyId || ''}
                                  onChange={(e) => updateActiveRoute({ escalationPolicyId: e.target.value || undefined })}
                                  className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                                >
                                  <option value="">-- No Escalation --</option>
                                  {model.escalationPolicies.map(esc => (
                                    <option key={esc.id} value={esc.id}>{esc.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Step 4 */}
                          <div className="bg-black/20 border border-white/5 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[11px] font-mono font-bold text-emerald-400 shrink-0">04</span>
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-none">Link Connected Apps & SOP Checklist</h4>
                                <p className="text-[9px] text-[#D0D6BB]/50 mt-1">Optionally tie this request category to a connected tool and standard SOP rules.</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#D0D6BB]/70 uppercase font-mono block">Linked Software Tool</label>
                                <select
                                  value={activeRoute.toolConnected || ''}
                                  onChange={(e) => updateActiveRoute({ toolConnected: e.target.value })}
                                  className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                                >
                                  <option value="">-- No Connected Tool --</option>
                                  {['Gmail', 'Google Calendar', 'Google Drive', 'Rechat', 'Dotloop', 'QuickBooks', 'Canva', 'Basecamp', 'Slack', 'Microsoft Teams', 'SMS / Phone', 'AI Voice/Chat Agents', 'Brokerage Dashboard'].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#D0D6BB]/70 uppercase font-mono block">Attached SOP Checklist</label>
                                <select
                                  value={activeRoute.sopId || ''}
                                  onChange={(e) => updateActiveRoute({ sopId: e.target.value })}
                                  className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                                >
                                  <option value="">-- No SOP Attached --</option>
                                  {model.sops.map(sop => (
                                    <option key={sop.id} value={sop.id}>{sop.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Common Tools Library Selector */}
                              <div className="md:col-span-2 space-y-2 border-t border-white/5 pt-3 mt-1 text-left">
                                <span className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Or select a tool from your libraries:</span>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {toolLibraries.map(lib => (
                                    <div key={lib.name} className="p-2.5 bg-black/15 border border-white/5 rounded-xl space-y-2">
                                      <span className="text-[8px] font-mono text-[#D0D6BB]/50 uppercase font-bold block leading-none">{lib.name}</span>
                                      <div className="grid grid-cols-2 gap-1.5">
                                        {lib.tools.map(tool => {
                                          const isSelected = activeRoute.toolConnected === tool.name;
                                          const recommendedList = getRecommendedTools(activeRoute.category);
                                          const isRecommended = recommendedList.includes(tool.name);
                                          const ToolIcon = tool.icon;
                                          
                                          return (
                                            <button
                                              key={tool.name}
                                              type="button"
                                              onClick={() => updateActiveRoute({ toolConnected: tool.name })}
                                              className={`p-2 rounded-lg border text-left flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] ${
                                                isSelected
                                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                                                  : isRecommended
                                                  ? 'bg-emerald-550/5 border-dashed border-emerald-500/20 text-[#D0D6BB] hover:border-emerald-500/40'
                                                  : 'bg-transparent border-white/5 text-[#D0D6BB]/60 hover:border-white/15'
                                              }`}
                                            >
                                              <ToolIcon className={`w-3 h-3 shrink-0 ${tool.color.split(' ')[0]}`} />
                                              <div className="min-w-0">
                                                <span className="text-[8.5px] block truncate leading-tight font-sans">{tool.name}</span>
                                                {isRecommended && !isSelected && (
                                                  <span className="text-[6.5px] text-emerald-400 font-mono uppercase block mt-0.5 leading-none">Suggested</span>
                                                )}
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          </div>

                        </div>

                        {/* Collapsible: What happens after assignment? */}
                        <div className="border border-white/10 rounded-2xl overflow-hidden font-sans">
                          <button
                            type="button"
                            onClick={() => setIsPostAssignmentExpanded(!isPostAssignmentExpanded)}
                            className="w-full p-4 bg-white/5 hover:bg-white/10 flex justify-between items-center text-xs font-bold text-white transition-colors cursor-pointer"
                          >
                            <span>What happens after assignment? (Timeline checklist)</span>
                            <span className="text-[10px] text-[#D0D6BB]/50">{isPostAssignmentExpanded ? 'Collapse' : 'Expand'}</span>
                          </button>
                          
                          {isPostAssignmentExpanded && (
                            <div className="p-4 bg-black/20 space-y-4 border-t border-white/10">
                              <div className="space-y-3">
                                {(activeRoute.postAssignmentSteps || ['Log intake ticket', 'Notify assignee', 'Monitor response window']).map((step, idx, arr) => (
                                  <div key={idx} className="flex gap-2.5 items-center">
                                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[9px] font-mono font-bold text-emerald-400 shrink-0">
                                      {idx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={step}
                                      onChange={(e) => {
                                        const stepsCopy = [...arr];
                                        stepsCopy[idx] = e.target.value;
                                        updateActiveRoute({ postAssignmentSteps: stepsCopy });
                                      }}
                                      className="flex-1 p-2 bg-black/20 border border-white/10 rounded text-white text-xs"
                                    />
                                    <div className="flex gap-1 shrink-0">
                                      {idx > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const stepsCopy = [...arr];
                                            const tmp = stepsCopy[idx];
                                            stepsCopy[idx] = stepsCopy[idx - 1];
                                            stepsCopy[idx - 1] = tmp;
                                            updateActiveRoute({ postAssignmentSteps: stepsCopy });
                                          }}
                                          className="p-1 text-[#D0D6BB] hover:bg-white/10 rounded cursor-pointer"
                                        >
                                          <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      {idx < arr.length - 1 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const stepsCopy = [...arr];
                                            const tmp = stepsCopy[idx];
                                            stepsCopy[idx] = stepsCopy[idx + 1];
                                            stepsCopy[idx + 1] = tmp;
                                            updateActiveRoute({ postAssignmentSteps: stepsCopy });
                                          }}
                                          className="p-1 text-[#D0D6BB] hover:bg-white/10 rounded cursor-pointer"
                                        >
                                          <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const stepsCopy = arr.filter((_, i) => i !== idx);
                                        updateActiveRoute({ postAssignmentSteps: stepsCopy });
                                      }}
                                      className="p-1.5 text-red-300 hover:bg-red-500/10 rounded shrink-0 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const currentSteps = activeRoute.postAssignmentSteps || ['Log intake ticket', 'Notify assignee', 'Monitor response window'];
                                  updateActiveRoute({ postAssignmentSteps: [...currentSteps, 'New tracking action step'] });
                                }}
                                className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 cursor-pointer transition-colors"
                              >
                                + Add Step
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Save & Delete Buttons */}
                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                          <button
                            type="button"
                            onClick={deleteRoute}
                            className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-500/20 text-red-300 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Delete Rule
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-[#D0D6BB]/50">Changes save automatically</span>
                            <button
                              type="button"
                              onClick={() => {
                                alert('All rule modifications have been updated in Firestore.');
                              }}
                              className="px-5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-white/20 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center text-xs text-[#D0D6BB]/40 font-serif italic">
                        Select a request category from the left panel to edit its routing configuration, or create a new routing rule.
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Conversational Routing Wizard Modal */}
              {isRoutingModalOpen && editingRouteData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-[#012a23] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white font-sans">
                    
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/20 shrink-0">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Step-by-Step Configuration Wizard</span>
                        <h3 className="text-sm font-serif font-black uppercase text-white tracking-tight mt-0.5">
                          {isCreatingNewRoute ? 'Create New Routing Rule' : `Configure Routing: ${editingRouteData.category}`}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRoutingModalOpen(false);
                          setEditingRouteData(null);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-[#D0D6BB] hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Step Tracker Indicator */}
                    <div className="px-6 py-3 bg-black/10 border-b border-white/5 flex items-center justify-between text-[10px] font-mono shrink-0">
                      <div className="flex gap-4">
                        {[
                          { step: 1, label: '01 Define Request' },
                          { step: 2, label: '02 Who Handles' },
                          { step: 3, label: '03 SLA & Speed' },
                          { step: 4, label: '04 Apps & Checklists' }
                        ].map(s => (
                          <div
                            key={s.step}
                            className={`flex items-center gap-1.5 ${
                              routingModalStep === s.step ? 'text-emerald-400 font-bold' :
                              routingModalStep > s.step ? 'text-[#D0D6BB]/70 line-through font-bold' : 'text-[#D0D6BB]/40 font-bold'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] border ${
                              routingModalStep === s.step ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold' :
                              routingModalStep > s.step ? 'border-emerald-500/30 text-emerald-500/70' : 'border-white/10 text-[#D0D6BB]/40'
                            }`}>
                              {s.step}
                            </span>
                            <span>{s.label.split(' ')[1]}</span>
                          </div>
                        ))}
                      </div>
                      <span className="text-[#D0D6BB]/60 uppercase">Step {routingModalStep} of 4</span>
                    </div>

                    {/* Body Scroll Area */}
                    <div className="p-6 overflow-y-auto flex-1 space-y-5 text-left">
                      
                      {/* Step 1: Define Request */}
                      {routingModalStep === 1 && (
                        <div className="space-y-4">
                          <div className="bg-emerald-650/15 border border-emerald-500/20 rounded-2xl p-4 space-y-2.5 text-xs text-[#D0D6BB] leading-relaxed">
                            <strong className="text-white block uppercase tracking-wider text-[9px] font-mono font-bold text-emerald-400">Step 1: The Request Category (What is the issue?)</strong>
                            <p>
                              A <strong>Request Category</strong> is a specific type of question, task, or file that agents submit (like a Commission Check Question or a Listing Agreement review). Defining this lets our system route incoming messages to the right team member automatically.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Rule Name (Category Name)</label>
                              <input
                                type="text"
                                value={editingRouteData.category}
                                onChange={(e) => setEditingRouteData({ ...editingRouteData, category: e.target.value })}
                                placeholder="e.g. Compliance Review"
                                className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Active Status</label>
                              <select
                                value={editingRouteData.status || 'active'}
                                onChange={(e) => setEditingRouteData({ ...editingRouteData, status: e.target.value as any })}
                                className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                              >
                                <option value="active">Active (Running)</option>
                                <option value="draft">Draft (Saved only)</option>
                                <option value="archived">Archived (Inactive)</option>
                              </select>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Simple Description</label>
                              <textarea
                                value={editingRouteData.description || ''}
                                onChange={(e) => setEditingRouteData({ ...editingRouteData, description: e.target.value })}
                                rows={3}
                                placeholder="What questions or files does this rule handle? (e.g. Questions about commission checks and closing documents)"
                                className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                              />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Example Message (Intake Example)</label>
                              <input
                                type="text"
                                value={editingRouteData.exampleRequest || ''}
                                onChange={(e) => setEditingRouteData({ ...editingRouteData, exampleRequest: e.target.value })}
                                placeholder="e.g. 'How do I submit my closing package for BIC review?'"
                                className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Assign Responsibility */}
                      {routingModalStep === 2 && (
                        <div className="space-y-4">
                          <div className="bg-emerald-650/15 border border-emerald-500/20 rounded-2xl p-4 space-y-2.5 text-xs text-[#D0D6BB] leading-relaxed">
                            <strong className="text-white block uppercase tracking-wider text-[9px] font-mono font-bold text-emerald-400">Step 2: Assign Responsibility (Who handles this?)</strong>
                            <p>
                              Assigning a primary and backup owner ensures that every request has a clear first responder, and a designated backup who is automatically authorized to cover if the primary owner is out of office, busy, or on vacation.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Primary Owner (First Responder)</label>
                              <select
                                value={editingRouteData.primaryOwnerPositionId}
                                onChange={(e) => setEditingRouteData({ ...editingRouteData, primaryOwnerPositionId: e.target.value })}
                                className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                              >
                                {model.positions.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Backup Owner (Backup Coverage)</label>
                              <select
                                value={editingRouteData.backupOwnerPositionId}
                                onChange={(e) => setEditingRouteData({ ...editingRouteData, backupOwnerPositionId: e.target.value })}
                                className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                              >
                                {model.positions.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Response Speed & Escalation */}
                      {routingModalStep === 3 && (
                        <div className="space-y-4">
                          <div className="bg-emerald-650/15 border border-emerald-500/20 rounded-2xl p-4 space-y-2.5 text-xs text-[#D0D6BB] leading-relaxed">
                            <strong className="text-white block uppercase tracking-wider text-[9px] font-mono font-bold text-emerald-400">Step 3: Response Speed & Escalation (When should it be answered?)</strong>
                            <p>
                              SLA (Service Level Agreement) sets the expectation for how fast the agent should receive a reply. If a request is not answered within this window, the system escalates it to a supervisor or escalation path so that files never get stuck or delayed before critical real estate deadlines.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Expected Reply Speed (SLA)</label>
                              <input
                                type="text"
                                value={editingRouteData.sla}
                                onChange={(e) => setEditingRouteData({ ...editingRouteData, sla: e.target.value })}
                                placeholder="e.g. 2 hours, 24 hours"
                                className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Send Alerts To (Notification Channel)</label>
                              <select
                                value={editingRouteData.notificationMethod || 'Email & Dashboard'}
                                onChange={(e) => setEditingRouteData({ ...editingRouteData, notificationMethod: e.target.value })}
                                className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                              >
                                <option value="Email & Dashboard">Email & Dashboard Alert</option>
                                <option value="SMS Text Alert">SMS Text Alert</option>
                                <option value="Slack Channel Notification">Slack Channel Notification</option>
                                <option value="All Methods">All Channels</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Escalate If Delayed (Response Window)</label>
                              <input
                                type="text"
                                value={editingRouteData.escalateWhen || ''}
                                onChange={(e) => setEditingRouteData({ ...editingRouteData, escalateWhen: e.target.value })}
                                placeholder="e.g. If unresolved after 4 hours"
                                className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Escalate To (Escalation Path)</label>
                              <select
                                value={editingRouteData.escalationPolicyId || ''}
                                onChange={(e) => setEditingRouteData({ ...editingRouteData, escalationPolicyId: e.target.value || undefined })}
                                className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                              >
                                <option value="">-- No Escalation --</option>
                                {model.escalationPolicies.map(esc => (
                                  <option key={esc.id} value={esc.id}>{esc.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Integrations & Checklists */}
                      {routingModalStep === 4 && (
                        <div className="space-y-4">
                          <div className="bg-emerald-650/15 border border-emerald-500/20 rounded-2xl p-4 space-y-2.5 text-xs text-[#D0D6BB] leading-relaxed">
                            <strong className="text-white block uppercase tracking-wider text-[9px] font-mono font-bold text-emerald-400">Step 4: Integrations & Checklists (Optional integrations)</strong>
                            <p>
                              Attaching an SOP (Standard Operating Procedure) Checklist provides the assignee with a step-by-step checklist of what actions to take after they are assigned. Connecting software tools allows the system to read files, sync calendars, or post updates to Slack automatically.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Linked Software Tool</label>
                              <select
                                value={editingRouteData.toolConnected || ''}
                                onChange={(e) => setEditingRouteData({ ...editingRouteData, toolConnected: e.target.value })}
                                className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                              >
                                <option value="">-- No Connected Tool --</option>
                                {['Gmail', 'Google Calendar', 'Google Drive', 'Rechat', 'Dotloop', 'QuickBooks', 'Canva', 'Basecamp', 'Slack', 'Microsoft Teams', 'SMS / Phone', 'AI Voice/Chat Agents', 'Brokerage Dashboard'].map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Attached SOP Checklist</label>
                              <select
                                value={editingRouteData.sopId || ''}
                                onChange={(e) => setEditingRouteData({ ...editingRouteData, sopId: e.target.value })}
                                className="w-full p-2.5 bg-black/35 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-xs font-sans cursor-pointer"
                              >
                                <option value="">-- No SOP Attached --</option>
                                {model.sops.map(sop => (
                                  <option key={sop.id} value={sop.id}>{sop.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Common Tools Library Selector inside modal */}
                            <div className="md:col-span-2 space-y-2 border-t border-white/5 pt-3 mt-1 text-left">
                              <span className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Suggested Tools (Based on your rule name):</span>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {toolLibraries.map(lib => (
                                  <div key={lib.name} className="p-2.5 bg-black/15 border border-white/5 rounded-xl space-y-2">
                                    <span className="text-[8px] font-mono text-[#D0D6BB]/50 uppercase font-bold block leading-none">{lib.name}</span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {lib.tools.map(tool => {
                                        const isSelected = editingRouteData.toolConnected === tool.name;
                                        const recommendedList = getRecommendedTools(editingRouteData.category);
                                        const isRecommended = recommendedList.includes(tool.name);
                                        const ToolIcon = tool.icon;
                                        
                                        return (
                                          <button
                                            key={tool.name}
                                            type="button"
                                            onClick={() => setEditingRouteData({ ...editingRouteData, toolConnected: tool.name })}
                                            className={`p-2 rounded-lg border text-left flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] ${
                                              isSelected
                                                ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                                                : isRecommended
                                                ? 'bg-emerald-550/5 border-dashed border-emerald-500/20 text-[#D0D6BB] hover:border-emerald-500/40'
                                                : 'bg-transparent border-white/5 text-[#D0D6BB]/60 hover:border-white/15'
                                            }`}
                                          >
                                            <ToolIcon className={`w-3 h-3 shrink-0 ${tool.color.split(' ')[0]}`} />
                                            <div className="min-w-0">
                                              <span className="text-[8.5px] block truncate leading-tight font-sans">{tool.name}</span>
                                              {isRecommended && !isSelected && (
                                                <span className="text-[6.5px] text-emerald-400 font-mono uppercase block mt-0.5 leading-none font-bold">Suggested</span>
                                              )}
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex justify-between items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRoutingModalOpen(false);
                          setEditingRouteData(null);
                        }}
                        className="px-4 py-2 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-[#D0D6BB] hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>

                      <div className="flex gap-2">
                        {routingModalStep > 1 && (
                          <button
                            type="button"
                            onClick={() => setRoutingModalStep((routingModalStep - 1) as any)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white cursor-pointer transition-colors"
                          >
                            Back
                          </button>
                        )}

                        {routingModalStep < 4 ? (
                          <button
                            type="button"
                            onClick={() => setRoutingModalStep((routingModalStep + 1) as any)}
                            className="px-5 py-2 bg-[#00635C] hover:bg-[#004d47] border border-white/20 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white cursor-pointer transition-colors"
                          >
                            Next Step
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              // Save Changes
                              const routingRules = model.routingMatrix || [];
                              let updated;
                              if (isCreatingNewRoute) {
                                updated = [...routingRules, editingRouteData];
                              } else {
                                updated = routingRules.map(r => r.category === selectedRouteId ? editingRouteData : r);
                              }
                              markChanged({ ...model, routingMatrix: updated });
                              setSelectedRouteId(editingRouteData.category);
                              setIsRoutingModalOpen(false);
                              setEditingRouteData(null);
                            }}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 border border-white/20 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white cursor-pointer transition-colors"
                          >
                            Save & Finish
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          );
        })()}

        {activeTab === 'escalations' && (
          <div className="flex-grow overflow-y-auto p-6 space-y-6 text-left bg-[#013028]">
            <div className="max-w-[1000px] mx-auto space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-lg font-serif font-black text-white uppercase tracking-tight">Escalation Policies</h3>
                  <p className="text-xs text-[#D0D6BB]">Define how tickets and operational delays escalate when response windows are breached.</p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddDrawer('escalation')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Escalation Policy
                </button>
              </div>

              {/* SOP SLA Escalation Guidance Banner */}
              <div className="bg-emerald-950/25 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 text-left">
                <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">SOP SLA Integration</h4>
                  <p className="text-[11px] text-[#D0D6BB] leading-relaxed font-sans">
                    Escalation policies define backup roles and automated SLA rules when an SOP checklist execution exceeds its target response window. 
                    These policies are linked to your SOP checklists under the <strong>SOPs & Knowledge</strong> tab to guarantee accountability.
                  </p>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="relative md:col-span-1">
                    <Search className="w-4 h-4 text-[#D0D6BB]/50 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search policies..."
                      value={escSearchQuery}
                      onChange={(e) => setEscSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none placeholder-[#D0D6BB]/40 font-sans"
                    />
                  </div>

                  <div>
                    <select
                      value={escStatusFilter}
                      onChange={(e) => setEscStatusFilter(e.target.value)}
                      className="w-full p-2 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none cursor-pointer font-sans"
                    >
                      <option value="all">All Statuses</option>
                      <option value="high">High Urgency</option>
                      <option value="medium">Medium Urgency</option>
                      <option value="low">Low Urgency</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={escOfficeFilter}
                      onChange={(e) => setEscOfficeFilter(e.target.value)}
                      className="w-full p-2 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none cursor-pointer font-sans"
                    >
                      <option value="all">All Offices</option>
                      <option value="Mayfaire">Mayfaire Office</option>
                      <option value="Carolina Beach">Carolina Beach Office</option>
                      <option value="Wilmington">Wilmington HQ</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={escRecipientFilter}
                      onChange={(e) => setEscRecipientFilter(e.target.value)}
                      className="w-full p-2 bg-black/35 border border-white/10 rounded-xl text-white text-xs focus:outline-none cursor-pointer font-sans"
                    >
                      <option value="all">All Recipients</option>
                      {model.positions.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {model.escalationPolicies
                  .filter(esc => {
                    const matchesSearch = !escSearchQuery || 
                      esc.name.toLowerCase().includes(escSearchQuery.toLowerCase()) || 
                      esc.trigger.toLowerCase().includes(escSearchQuery.toLowerCase());
                    const matchesStatus = escStatusFilter === 'all' || esc.urgency?.toLowerCase() === escStatusFilter.toLowerCase();
                    const matchesRecipient = escRecipientFilter === 'all' || esc.escalateToPositionId === escRecipientFilter;
                    const fromPos = model.positions.find(p => p.id === esc.fromPositionId);
                    const toPos = model.positions.find(p => p.id === esc.escalateToPositionId);
                    const matchesOffice = escOfficeFilter === 'all' || (fromPos?.office === escOfficeFilter || toPos?.office === escOfficeFilter);
                    return matchesSearch && matchesStatus && matchesRecipient && matchesOffice;
                  })
                  .map(esc => {
                    const fromPos = model.positions.find(p => p.id === esc.fromPositionId);
                    const toPos = model.positions.find(p => p.id === esc.escalateToPositionId);
                    return (
                      <button
                        key={esc.id}
                        type="button"
                        onClick={() => openEditDrawer('escalation', esc.id)}
                        className="w-full text-left p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 rounded-2xl transition-all cursor-pointer block space-y-3 font-sans"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-white hover:underline">{esc.name}</h4>
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[8px] font-mono uppercase font-bold">{esc.urgency}</span>
                        </div>
                        <div className="text-[11px] text-[#D0D6BB]/80 leading-relaxed"><span className="text-amber-400 font-bold uppercase text-[9px] font-mono pr-1">Trigger Condition:</span> {esc.trigger}</div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[#D0D6BB]/50 pt-2 border-t border-white/5">
                          <span>Escalates From: <strong className="text-white">{fromPos ? fromPos.name : 'Unknown'}</strong> ({fromPos ? fromPos.title : ''})</span>
                          <span>➔</span>
                          <span>Escalation Recipient: <strong className="text-white">{toPos ? toPos.name : 'Unknown'}</strong> ({toPos ? toPos.title : ''})</span>
                          <span>•</span>
                          <span>Target SLA: <strong className="text-amber-400">{esc.responseWindow}</strong></span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}


        {activeTab === 'connected_tools' && (
          <div className="flex-grow overflow-y-auto p-6 space-y-6 text-left bg-[#013028] font-sans">
            <div className="max-w-[1000px] mx-auto space-y-6">
              
              {/* Header card with action */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-serif font-black text-white uppercase tracking-tight">Connected Tools</h3>
                  <p className="text-xs text-[#D0D6BB] font-sans mt-1">Operational integrations connected to the Wilmington brokerage command center.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const toolName = prompt('Enter the name of the tool to connect:');
                    if (!toolName) return;
                    const role = prompt('Enter the assigned role/team for this tool:', 'Operations Team');
                    const uses = prompt('What does Shapework use this tool for?', 'Integrates brokerage workflows and automates coordination.');
                    if (toolName) {
                      setIntegrationsList([
                        ...integrationsList,
                        {
                          name: toolName,
                          status: 'Connected',
                          category: 'Custom Integration',
                          uses: uses || 'Custom brokerage integration.',
                          role: role || 'Operations Team',
                          lastSync: 'Just now',
                          icon: Zap
                        }
                      ]);
                    }
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Connected Tool
                </button>
              </div>

              {/* Grid of integration cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrationsList.map((tool, idx) => {
                  const IconComponent = tool.icon;
                  const isConnected = ['Connected', 'Configured', 'Simulated'].includes(tool.status);
                  
                  return (
                    <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between space-y-4 min-h-[220px] transition-all hover:border-white/20">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <span className={`px-2 py-0.5 rounded-full border text-[8px] font-mono uppercase font-bold ${
                            tool.status === 'Connected' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                            tool.status === 'Available to Connect' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' :
                            tool.status === 'In Development' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                            tool.status === 'Requires Administrator' ? 'bg-orange-500/15 text-orange-400 border-orange-500/20' :
                            tool.status === 'Coming Soon' ? 'bg-purple-500/15 text-purple-300 border-purple-500/20' :
                            'bg-white/5 text-[#D0D6BB]/50 border-white/10'
                          }`}>
                            {tool.status}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{tool.name}</h4>
                          <span className="text-[9px] font-mono text-[#D0D6BB]/50 uppercase block">{tool.category}</span>
                        </div>
                        <p className="text-[10px] text-[#D0D6BB]/75 leading-relaxed line-clamp-3">{tool.uses}</p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <div className="flex justify-between items-center text-[9px] font-mono text-[#D0D6BB]/50">
                          <span>Team: <strong className="text-white">{tool.role}</strong></span>
                          {tool.lastSync && (
                            <span>Sync: <strong className="text-emerald-400">{tool.lastSync}</strong></span>
                          )}
                        </div>

                        {tool.name === 'Rechat' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/directory/sync-rechat', { credentials: 'include', method: 'POST' });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Rechat Roster Sync Completed!\n\nAdded: ${data.summary.addedCount}\nUpdated: ${data.summary.updatedCount}\nNeeds Review: ${data.summary.needsReviewCount}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Rechat' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Rechat Roster Sync executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync Roster Now
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/rechat/sync-listing', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({
                                        propertyAddress: '142 Market St, Wilmington, NC',
                                        listingAgentName: 'Sarah Jenkins',
                                        listPrice: '$485,000',
                                        targetGoLiveDate: '2026-08-01',
                                        hasLockboxCode: true
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Listing Sync Received!\n\nProperty: 142 Market St\nAction: Auto-launched 'Listing Launch Checklist' SOP Run\nAssigned: Melissa Gagliardi (Marketing Coordinator)`);
                                    }
                                  } catch (e) {
                                    alert('Listing sync trigger executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Listing Auto-Intake
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Basecamp' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/basecamp/sync', { credentials: 'include', method: 'POST' });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Basecamp Todo Sync Completed!\n\nSynced Runs: ${data.syncedRunsCount}\nSynced Todos: ${data.syncedTodosCount}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Basecamp' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Basecamp Todo Sync executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync Basecamp Todos
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/basecamp/webhook', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({
                                        stepId: 'step_1',
                                        completed: true,
                                        completedBy: 'Ann Gunn (Basecamp Webhook)'
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Basecamp Webhook Simulated!\n\nAction: Completed step_1 on active SOP Run\nActor: Ann Gunn (Basecamp Webhook)`);
                                    }
                                  } catch (e) {
                                    alert('Basecamp Webhook simulated.');
                                  }
                                }}
                                className="flex-1 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Simulate Webhook
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Dotloop' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/dotloop/sync', { credentials: 'include', method: 'POST' });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Dotloop Transaction Sync Completed!\n\nVerified Loops: ${data.verifiedLoopsCount}\nPending BIC Audit: ${data.pendingBicReviewCount}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Dotloop' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Dotloop Loop Sync executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync Loops
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/dotloop/compliance/approve', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({
                                        notes: 'Broker-in-Charge verified mandatory disclosure signatures.'
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`BIC Compliance Approved!\n\nBroker-in-Charge: Jessica Keenan\nStatus: Approved & Logged to Audit Trail`);
                                    }
                                  } catch (e) {
                                    alert('BIC Compliance Approval executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Approve Compliance
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'QuickBooks' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/quickbooks/sync', { credentials: 'include', method: 'POST' });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`QuickBooks Bill Sync Completed!\n\nDraft Bills Created: ${data.draftBillsCount}\nTotal Payables Amount: ${data.totalPayablesAmount}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'QuickBooks' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('QuickBooks Bill Sync executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync QBO Bills
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/quickbooks/voucher/post', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({
                                        amount: 3450,
                                        payeeName: 'Sarah Jenkins (Listing Agent)',
                                        description: 'Commission Payout - 142 Market St'
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Commission Voucher Authorized!\n\nPayee: ${data.voucher.payeeName}\nAmount: $${data.voucher.amount}\nAuthorized By: ${data.voucher.authorizedBy}`);
                                    }
                                  } catch (e) {
                                    alert('Commission Voucher Post executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Post Voucher
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Gmail' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/gmail/sync', { credentials: 'include', method: 'POST' });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Gmail Inbox Sync Completed!\n\nExtracted Tickets: ${data.ticketsExtractedCount}\nAuto-routed: ${data.autoRoutedCount}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Gmail' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Gmail Inbox Sync executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync Inbound Emails
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/gmail/simulate-intake', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({
                                        senderEmail: 'agent.sarah@nestrealty.com',
                                        subject: 'New Listing Setup Request - 142 Market St',
                                        body: 'Please launch marketing materials for 142 Market St.',
                                        propertyAddress: '142 Market St',
                                        hasLockboxCode: false
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Email Intake Simulated!\n\nStatus: ${data.ticket.status}\nAssigned: ${data.ticket.assigneeName}\nAuto-reply Sent: ${data.autoReplySent ? 'Yes (Requested Lockbox Code)' : 'No'}`);
                                    }
                                  } catch (e) {
                                    alert('Email Intake Simulation executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Simulate Email Intake
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Slack' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/slack/dispatch-escalation', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ stage: 1, runTitle: 'Listing Launch Checklist - 142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Slack Block-Kit Alert Dispatched!\n\nChannel: ${data.channel}\nStage: ${data.stage}\nAction: Reassign to Ann Gunn button included`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Slack' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Slack Alert Dispatch executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Test Escalation
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/slack/webhook-callback', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ action: 'shield_override', actorName: 'Ryan Crecelius (Slack)' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Slack Interactive Webhook Executed!\n\nAction: ${data.actionExecuted}\nActor: ${data.actorName}\nAssignee Updated: ${data.run.currentAssigneeName}`);
                                    }
                                  } catch (e) {
                                    alert('Slack Webhook Callback executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Simulate Webhook
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Canva' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/canva/sync', { credentials: 'include', method: 'POST' });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Canva Brand Kit Synced!\n\nTemplates Synced: ${data.templatesSyncedCount}\nBrand Kit Verified: Yes`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Canva' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Canva Brand Kit Sync executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync Templates
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/canva/generate-collateral', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({
                                        propertyAddress: '142 Market St',
                                        agentLicenseNumber: 'NC-394821'
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Canva Collateral Generated!\n\nProperty: ${data.collateral.propertyAddress}\nBrand Compliant: ${data.collateral.brandCompliant ? 'Yes' : 'No'}\nFlyer Export URL: ${data.collateral.flyerUrl}`);
                                    }
                                  } catch (e) {
                                    alert('Canva Collateral Generation executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Generate Collateral
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Google Drive' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/drive/sync', { credentials: 'include', method: 'POST' });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Google Drive Folders Synced!\n\nRoot Folder: ${data.rootFolder}\nSubfolders Created: ${data.subfoldersCreatedCount}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Google Drive' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Google Drive Folders Sync executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync Folders
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/drive/export-audit-package', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`PDF Audit Package Exported!\n\nFile Name: ${data.pdfExport.fileName}\nRetention Tag: ${data.pdfExport.retentionTag}\nDrive URL: ${data.pdfExport.driveUrl}`);
                                    }
                                  } catch (e) {
                                    alert('PDF Audit Package Export executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Export PDF Audit
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Google Calendar' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/calendar/sync', { credentials: 'include', method: 'POST' });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Google Calendar Synced!\n\nCalendar: ${data.calendar}\nEvents Synced: ${data.eventsSyncedCount}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Google Calendar' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Google Calendar Sync executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync Events
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/calendar/schedule-milestone', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St', targetGoLiveDate: '2026-07-28' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Listing Milestones Scheduled!\n\nEvents Created: ${data.milestones.length}\nGo-Live Date: 2026-07-28\nTwo-Way Reschedule Sync: Active`);
                                    }
                                  } catch (e) {
                                    alert('Schedule Milestones executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Schedule Milestones
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'AI Voice/Chat Agents' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/ai-assistant/simulate-call', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ callerName: 'Sarah Jenkins (Agent)', transcriptQuery: 'What is the earnest money deposit deadline?' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Inbound Voice Query Processed!\n\nIntent: ${data.intentCategory}\nConfidence: ${(data.confidence * 100).toFixed(0)}%\nGrounded Answer: ${data.groundedAnswer}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'AI Voice/Chat Agents' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Inbound Voice Query simulation executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Test Voice Query
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/ai-assistant/simulate-voice-sop-launch', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St', callerPhone: '(910) 555-0192' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Voice-Initiated SOP Launch Executed!\n\nSOP Run: ${data.run.sopTitle}\nProperty: ${data.run.propertyAddress}\nSMS Tracking Link: ${data.smsPayload.message}`);
                                    }
                                  } catch (e) {
                                    alert('Voice SOP Launch simulation executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Simulate Voice SOP Launch
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'SMS / Phone' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/sms/dispatch-alert', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ recipientName: 'Ryan Crecelius', recipientPhone: '(910) 555-0199', propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`SMS Escalation Dispatched!\n\nRecipient: ${data.smsPayload.recipientName}\nPhone: ${data.smsPayload.recipientPhone}\nText: ${data.smsPayload.text}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'SMS / Phone' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('SMS Escalation dispatch executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Test SMS Escalation
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/sms/webhook-reply', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ fromPhone: '(910) 555-0199', messageBody: 'SHIELD' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`SMS Webhook Reply Executed!\n\nKeyword: ${data.keywordExecuted}\nFrom: ${data.actorName}\nAssignee Updated: ${data.run.currentAssigneeName}`);
                                    }
                                  } catch (e) {
                                    alert('SMS Webhook Reply simulation executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Simulate SMS Webhook
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Microsoft Teams' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/teams/dispatch-alert', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ targetChannel: '#Ops-Bridge', propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Teams Fallback Alert Dispatched!\n\nChannel: ${data.targetChannel}\nFailover Active: Yes\nAdaptive Card Card Actions: Approve Step, View SOP Run`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Microsoft Teams' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Teams Fallback Alert dispatch executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Fallback Alert
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/teams/generate-video-bridge', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Teams Ops Video Bridge Created!\n\nTopic: ${data.videoBridge.topic}\nOrganizers: ${data.videoBridge.organizers.join(', ')}\nMeeting URL: ${data.videoBridge.meetingUrl}`);
                                    }
                                  } catch (e) {
                                    alert('Ops Video Bridge generation executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Generate Video Bridge
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Brokerage Dashboard' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/analytics/metrics', { credentials: 'include' });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Executive Scorecard Aggregated!\n\nSLA Compliance: ${data.scorecard.slaComplianceRate}%\nIntegration Health: ${data.scorecard.integrationHealthScore}%\nActive Listings: ${data.scorecard.activePipelineVolume.activeListingLaunches}\nUnder-Contract Closings: ${data.scorecard.activePipelineVolume.underContractClosings}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Brokerage Dashboard' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Fetch Analytics Metrics executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Fetch Metrics
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/analytics/bottlenecks', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ applyOptimization: true })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`AI Bottleneck Audit Executed!\n\nTop Bottleneck: ${data.topBottlenecks[0].stepTitle} (${data.topBottlenecks[0].delayPercentage})\nAI Recommendation: ${data.aiRecommendation}\n1-Click SOP Optimization: Applied`);
                                    }
                                  } catch (e) {
                                    alert('Run Bottleneck Audit executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Run Bottleneck Audit
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Gmail' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/gmail/simulate-intake', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ senderEmail: 'sarah.j@nestrealty.com', subject: 'New Listing Intake Request - 142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Gmail Intake Processed!\n\nIntent: ${data.parsedIntent}\nProperty: ${data.propertyAddress}\nTicket Created: ${data.ticketCreated.title}\nAssigned: ${data.ticketCreated.assigneeName}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Gmail' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Simulate Email Intake executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Simulate Intake
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/gmail/auto-file-attachment', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ filename: 'Working_With_Real_Estate_Agents_Signed.pdf', propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`PDF Attachment Auto-Filed!\n\nFile: ${data.filename}\nDrive Path: ${data.drivePath}\nDotloop Linked: Yes`);
                                    }
                                  } catch (e) {
                                    alert('Auto-File Attachment executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Auto-File PDF
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/gmail/ingest', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ emailSubject: 'Need yard sign installation & lockbox for 142 Market St', senderEmail: 'sarah.jenkins@nestrealty.com', propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Gmail Ticket Ingested!\n\nSubject: ${data.emailSubject}\nCategory: ${data.category}\nProperty: ${data.propertyAddress}\nSLA Due: ${data.slaDueAt}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Gmail' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Ingest Ticket executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Ingest Ticket
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/gmail/route', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ ticketId: 'req_gmail_9821a' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Gmail Ticket Smart Routed!\n\nAssigned: ${data.assignedStaff}\nSlack Channel: ${data.slackChannel}\nAuto-Reply: Sent`);
                                    }
                                  } catch (e) {
                                    alert('Route Message executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Route Message
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'DocuSign' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/docusign/verify', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`DocuSign Signature Audit Completed!\n\nEnvelope ID: ${data.envelopeId}\nAudit Status: ${data.auditPassed ? 'PASSED 4/4' : 'FAILED'}\nSummary: ${data.verificationSummary}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'DocuSign' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Verify DocuSign Envelopes executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Verify Envelopes
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/docusign/compliance/approve', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`DocuSign Compliance Audit Approved!\n\nReviewer: ${data.reviewerName}\nStatus: ${data.complianceStatus}\nSOP Step Updated: ${data.updatedRunStep}`);
                                    }
                                  } catch (e) {
                                    alert('Approve DocuSign Audit executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Approve Audit
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'MLS Data Feed (RESO)' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/mls/sync', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St', mlsNumber: 'MLS-4028912', mlsStatus: 'ACTIVE' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`MLS Feed Synced!\n\nMLS ID: ${data.mlsNumber}\nStatus: ${data.mlsStatus}\nSOP Action: ${data.sopTriggered}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'MLS Data Feed (RESO)' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Sync MLS Feed executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync MLS Feed
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/mls/validate', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St', mlsNumber: 'MLS-4028912' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`MLS 5-Point Data Quality Audit!\n\nScore: ${data.auditScore}\nPhotos: ${data.validationDetails.photoCountAndResolution}\nRemarks: ${data.validationDetails.publicRemarksCompliance}`);
                                    }
                                  } catch (e) {
                                    alert('Validate Listing Data executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Validate Data
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Google Calendar' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/calendar/schedule-milestones', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St', launchDate: '2026-07-28' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Google Calendar Milestones Scheduled!\n\nProperty: ${data.propertyAddress}\nMedia Shoot: ${data.eventsCreated[0].date}\nOpen House: ${data.eventsCreated[1].date}\nSOP Step Completed: ${data.sopStepCompleted}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Google Calendar' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Auto-Schedule Milestones executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Schedule Milestones
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/calendar/sync', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ calendarId: 'calendar@nestrealty.com' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Google Calendar Synced!\n\nCalendar: ${data.calendarId}\nActive Events: ${data.activeEventsCount}`);
                                    }
                                  } catch (e) {
                                    alert('Sync Calendar Events executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync Events
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Google Drive' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/gdrive/provision', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Google Drive Folders Provisioned!\n\nProperty: ${data.propertyAddress}\nRoot Path: ${data.rootFolderPath}\nSubfolders: 4 Role-Gated Folders\nShareable Link: ${data.shareableLink}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Google Drive' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Provision Drive Folders executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Provision Folders
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/gdrive/sync', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Google Drive Documents Audited!\n\nTotal Files Found: ${data.documentAudit.totalFilesFound}\nContract Files Verified: ${data.documentAudit.contractsVerified ? 'YES' : 'NO'}\nSOP Status: ${data.sopMilestoneStatus}`);
                                    }
                                  } catch (e) {
                                    alert('Sync Document Files executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync Files
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Google Cloud' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/cloudrun/deploy', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ serviceName: 'shapework-server', region: 'us-east1' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`GCP Cloud Run Revision Deployed!\n\nService: ${data.serviceName}\nRevision: ${data.revisionName}\nImage: ${data.imageUri}\nStatus: ${data.status}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Google Cloud' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Deploy Revision executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Deploy Revision
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/cloudrun/health', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ serviceName: 'shapework-server' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`GCP Operations Health Audit Passed!\n\nService: ${data.serviceName}\nStatus: ${data.status}\nCPU Usage: ${data.metrics.cpuUtilization}\nMemory Usage: ${data.metrics.memoryUtilization}\nAvg Latency: ${data.metrics.avgLatencyMs}ms`);
                                    }
                                  } catch (e) {
                                    alert('Audit GCP Health executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Audit GCP Health
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Basecamp' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/basecamp/provision', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Basecamp Project Provisioned!\n\nProject: ${data.projectTitle}\nTo-Do Lists: ${data.todoListsCount} Mapped Lists\nTasks Created: ${data.totalTodosCreated} Tasks\nURL: ${data.basecampProjectUrl}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Basecamp' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Provision Project executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Provision Project
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/basecamp/post-campfire', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St', messageText: '⚡ Milestone Update: Media Shoot completed & uploaded for 142 Market St.' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Basecamp Campfire Message Posted!\n\nProperty: ${data.propertyAddress}\nMessage: '${data.messageSent}'\nStatus: ${data.status}`);
                                    }
                                  } catch (e) {
                                    alert('Post Campfire Alert executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Post Campfire
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Rechat' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/rechat/sync', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Rechat Contacts & Deals Synced!\n\nProperty: ${data.propertyAddress}\nContacts Synced: ${data.contactsSynced}\nActive Deals: ${data.activeDealsCount}\nCompleteness: ${data.contactCompleteness}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Rechat' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Sync Contacts & Deals executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync Contacts
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/rechat/trigger-campaign', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St', campaignType: 'JUST_LISTED_PACKAGE' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Rechat Campaign Triggered!\n\nCampaign: ${data.campaignType}\nCollateral: ${data.collateralCreated.length} Assets Created\nDeal Stage: ${data.dealStageAdvanced}\nAudience Reach: ${data.targetAudienceCount} Contacts`);
                                    }
                                  } catch (e) {
                                    alert('Trigger Campaign executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Trigger Campaign
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Canva' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/canva/generate', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St', price: '$475,000' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Canva Collateral Generated!\n\nProperty: ${data.propertyAddress}\nBrand Audit: PASSED (3/3)\nAssets Created: ${data.generatedAssets.length} (Flyer, IG Post, Brochure)\nDrive Location: ${data.driveLocation}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Canva' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Generate Canva Assets executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Generate Assets
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/canva/sync-templates', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ brandKitId: 'canva_bk_nestrealty_2026' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Canva Brand Kit Synced!\n\nBrand Kit: ${data.brandKitId}\nTemplates Active: ${data.templatesCount}`);
                                    }
                                  } catch (e) {
                                    alert('Sync Brand Templates executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Sync Templates
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'AI Voice/Chat Agents' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/voice/simulate-call', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ callerName: 'Robert Vance (Buyer Agent)', intentType: 'compliance_query' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`AI Voice Call Processed!\n\nCaller: ${data.callerName}\nIntent: ${data.parsedIntent}\nAI Action: ${data.aiResponseSummary}\nTicket Created: ${data.ticketCreated.title} (${data.ticketCreated.assigneeName})`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'AI Voice/Chat Agents' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Simulate Voice Call executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Simulate Call
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/sms/dispatch', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ recipientName: 'Ryan Crecelius', message: 'URGENT: Step #3 overdue for 142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`SMS Alert Dispatched!\n\nRecipient: ${data.recipient}\nStatus: ${data.status}\nMessage: '${data.messageSent}'`);
                                    }
                                  } catch (e) {
                                    alert('Dispatch SMS Alert executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Dispatch SMS
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'SMS / Phone' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/sms/dispatch', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ recipientName: 'Jessica Keenan (BIC)', message: 'COMPLIANCE AUDIT NOTICE: Closing loop #4028 requires sign-off' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`SMS Compliance Notice Sent!\n\nRecipient: ${data.recipient}\nStatus: ${data.status}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'SMS / Phone' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Dispatch SMS Notice executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Send SMS Alert
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Slack' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/slack/dispatch', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ channelName: '#ops-escalations', alertType: 'SLA_BREACH' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Slack Rich Block Card Sent!\n\nChannel: ${data.channel}\nAlert Type: ${data.alertType}\nProperty: ${data.propertyAddress}\nActions Included: 3 Interactive Buttons`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Slack' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Send Slack Alert executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Send Slack Alert
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/slack/webhook', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ command: '/ops-status' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Slack Slash Command Processed!\n\nCommand: ${data.commandExecuted}\nResponse:\n${data.responseText}`);
                                    }
                                  } catch (e) {
                                    alert('Simulate Slack Webhook executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Slash Command
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Microsoft Teams' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/slack/dispatch', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ channelName: 'Teams Operations Channel', alertType: 'COMPLIANCE_AUDIT' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Microsoft Teams Card Sent!\n\nChannel: Teams Operations Channel\nAlert: ${data.alertType}\nStatus: DELIVERED`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Microsoft Teams' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Send Teams Card executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Send Teams Card
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Brokerage Dashboard' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/analytics/export', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ format: 'CSV' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Brokerage Analytics Report Exported!\n\nOverall SLA: ${data.metricsSuite.overallSlaCompliance}\nActive Volume: ${data.metricsSuite.activePipelineVolume}\nTop Bottleneck: ${data.metricsSuite.topBottlenecks[0].step}\nDownload URL: ${data.downloadUrl}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Brokerage Dashboard' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Export Analytics Report executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Export Report
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/analytics/digest', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ recipients: ['ryan@nestrealty.com', 'jessica@nestrealty.com'] })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Weekly Executive Digest Dispatched!\n\nTitle: ${data.digestTitle}\nRecipients: ${data.recipients.join(', ')}\nStatus: DISPATCHED`);
                                    }
                                  } catch (e) {
                                    alert('Dispatch Executive Digest executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Send Digest
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'DocuSign / SignNow' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/docusign/send', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St', documentName: 'Listing Agreement & Disclosures' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`DocuSign Envelope Completed & Filed!\n\nProperty: ${data.propertyAddress}\nSigners Completed: ${data.recipients.length}\nDrive Path: ${data.driveLocation}\nSOP Step Completed: ${data.sopStepCompleted}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'DocuSign / SignNow' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Send Envelope executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Send Envelope
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/docusign/audit', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ envelopeId: 'ds_env_984f001' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`DocuSign Certificate Audit Verified!\n\nIP Logging: ${data.certificateDetails.ipVerification}\nHash Verification: ${data.certificateDetails.hashVerification}\nBIC Status: ${data.bicApprovalStatus}`);
                                    }
                                  } catch (e) {
                                    alert('Audit Signatures executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Audit Signatures
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Dotloop' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/dotloop/create-loop', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St', loopType: 'LISTING' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Dotloop Transaction Room Created!\n\nLoop Name: ${data.loopName}\nFolders Provisioned: ${data.foldersProvisioned} Folders\nURL: ${data.dotloopUrl}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Dotloop' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Create Loop executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Create Loop
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/dotloop/audit-signatures', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Dotloop Document Signatures Audited!\n\nDocuments Audited: ${data.totalDocumentsAudited}\nSignature Status: ${data.signatureStatus}\nBIC Approval: ${data.bicComplianceStatus}`);
                                    }
                                  } catch (e) {
                                    alert('Audit Signatures executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Audit Signatures
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'QuickBooks' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/quickbooks/generate-voucher', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St', salePrice: 475000, commissionRate: 0.03 })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`QuickBooks Commission Voucher Generated!\n\nVoucher ID: ${data.voucherId}\nGross Commission: $${data.financialSummary.grossCommission.toLocaleString()}\nAgent Payout (80%): $${data.financialSummary.agentPayout.toLocaleString()}\nFirm Retained (20%): $${data.financialSummary.brokerageRetained.toLocaleString()}\nStatus: ${data.voucherStatus}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'QuickBooks' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Generate Commission Voucher executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Generate Voucher
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/quickbooks/audit-balances', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`QuickBooks Vendor Expense Audit Passed!\n\nVendor Bills Audited: ${data.vendorBillsAudited.length}\nTotal Expenses: $${data.totalVendorExpense.toFixed(2)}\nUnreconciled Balance: $${data.unreconciledBalance.toFixed(2)}\nAudit Status: ${data.closingFinancialAudit}`);
                                    }
                                  } catch (e) {
                                    alert('Audit QuickBooks Balances executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Audit Balances
                              </button>
                            </div>
                          </div>
                        )}

                        {tool.name === 'Stripe' && (
                          <div className="space-y-1.5 pt-1 border-t border-white/5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/stripe/run-billing', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ billingPeriod: 'July 2026' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Stripe Agent Monthly Dues Billed!\n\nBilling Period: ${data.billingPeriod}\nAgents Billed: ${data.totalAgentsBilled}\nTotal Revenue Collected: $${data.totalDuesCollected.toLocaleString()}\nCollection Rate: ${data.successRate}`);
                                      setIntegrationsList(prev => prev.map(t => t.name === 'Stripe' ? { ...t, lastSync: 'Just now' } : t));
                                    }
                                  } catch (e) {
                                    alert('Run Monthly Billing executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Run Billing
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/ops/integrations/stripe/charge-transaction-fee', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ propertyAddress: '142 Market St', amount: 295.00 })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`Stripe Transaction Fee Auto-Deducted!\n\nProperty: ${data.propertyAddress}\nFee Charged: $${data.transactionFee.toFixed(2)}\nType: ${data.feeType}\nCharge ID: ${data.chargeId}\nStatus: ${data.status}`);
                                    }
                                  } catch (e) {
                                    alert('Charge Transaction Fee executed.');
                                  }
                                }}
                                className="flex-1 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[8px] font-mono font-bold uppercase transition-all cursor-pointer"
                              >
                                ⚡ Charge Fee
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => alert(`Configuring settings for ${tool.name}...`)}
                            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer"
                          >
                            Configure
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleConnectTool(tool.name, isConnected, idx)}
                            className={`flex-1 py-1.5 border rounded-lg text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                              isConnected
                                ? 'bg-red-500/10 hover:bg-red-500/15 border-red-500/20 text-red-300'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {isConnected ? 'Disconnect' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

      </div>

      {sopModalOpen && selectedSopForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 text-left">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSopModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#012a23] border border-white/10 rounded-[28px] p-8 shadow-2xl space-y-6 text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400">Standard Operating Procedure</span>
                <h3 className="text-lg font-serif font-black text-white">{selectedSopForModal.name}</h3>
              </div>
              <button type="button" onClick={() => setSopModalOpen(false)} className="text-[#D0D6BB]/50 hover:text-white cursor-pointer transition-colors p-1 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-xs font-sans">
              {selectedSopForModal.purpose && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Purpose</span>
                  <p className="text-white leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{selectedSopForModal.purpose}</p>
                </div>
              )}

              {selectedSopForModal.trigger && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Intake / Trigger Event</span>
                  <p className="text-emerald-300 font-mono leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{selectedSopForModal.trigger}</p>
                </div>
              )}

              {selectedSopForModal.steps && selectedSopForModal.steps.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Execution Checklist / Steps</span>
                  <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                    {selectedSopForModal.steps.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[9px] font-mono font-bold text-emerald-400 shrink-0 mt-0.5">{idx + 1}</span>
                        <span className="text-[#F6F7F1] leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSopForModal.requiredInformation && selectedSopForModal.requiredInformation.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Required Information</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedSopForModal.requiredInformation.map((info: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#D0D6BB] text-[10px] font-mono">{info}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSopForModal.output && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Expected Outcome / Output</span>
                  <p className="text-[#D0D6BB] leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{selectedSopForModal.output}</p>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSopModalOpen(false)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}

      {escalationModalOpen && selectedEscalationForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 text-left">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setEscalationModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#012a23] border border-white/10 rounded-[28px] p-8 shadow-2xl space-y-6 text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400">Escalation Policy & Fallback</span>
                <h3 className="text-lg font-serif font-black text-white">{selectedEscalationForModal.name}</h3>
              </div>
              <button type="button" onClick={() => setEscalationModalOpen(false)} className="text-[#D0D6BB]/50 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-xs font-sans">
              {selectedEscalationForModal.trigger && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Trigger Condition</span>
                  <p className="text-white leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{selectedEscalationForModal.trigger}</p>
                </div>
              )}

              {selectedEscalationForModal.condition && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Logic Rule</span>
                  <p className="text-amber-300 font-mono leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{selectedEscalationForModal.condition}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Urgency / Severity</span>
                  <span className="inline-block px-3 py-1 bg-red-950/40 border border-red-500/30 rounded-lg text-red-300 font-bold uppercase font-mono">{selectedEscalationForModal.urgency}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">SLA Response Window</span>
                  <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 font-bold font-mono">{selectedEscalationForModal.responseWindow}</span>
                </div>
              </div>

              {selectedEscalationForModal.channels && selectedEscalationForModal.channels.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Notification Channels</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedEscalationForModal.channels.map((ch: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-mono uppercase">{ch}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEscalationForModal.requiredContext && selectedEscalationForModal.requiredContext.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Required Context for Broker</span>
                  <div className="space-y-1 bg-black/20 p-3 rounded-xl border border-white/5">
                    {selectedEscalationForModal.requiredContext.map((ctx: string, idx: number) => (
                      <div key={idx} className="text-[#D0D6BB]">• {ctx}</div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEscalationForModal.recommendedNextAction && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D0D6BB]/50 block">Recommended Broker Action</span>
                  <p className="text-emerald-300 leading-relaxed bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/30">{selectedEscalationForModal.recommendedNextAction}</p>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setEscalationModalOpen(false)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONTEXTUAL SLIDE DRAWERS --- */}
      {drawerOpen && (
        <OrgChartDrawerOverlay
          workspaceId={workspaceId}
          type={drawerType!}
          mode={drawerMode}
          id={editingId}
          model={model}
          onClose={closeDrawer}
          onSubmitPosition={drawerMode === 'add' ? handleAddPositionSubmit : (updates) => handleEditPositionSubmit(editingId!, updates)}
          onUpdatePositionInline={(posId, updates) => {
            const updated = model.positions.map(p => p.id === posId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
            markChanged({ ...model, positions: updated });
          }}
          onSubmitRole={drawerMode === 'add' ? handleAddRoleSubmit : (updates) => handleEditRoleSubmit(editingId!, updates)}
          onSubmitSop={drawerMode === 'add' ? handleAddSopSubmit : (updates) => handleEditSopSubmit(editingId!, updates)}
          onSubmitEscalation={drawerMode === 'add' ? handleAddEscalationSubmit : (updates) => handleEditEscalationSubmit(editingId!, updates)}
          onSubmitDocument={drawerMode === 'add' ? handleAddDocSubmit : (updates) => handleEditDocSubmit(editingId!, updates)}
          onSubmitLink={drawerMode === 'add' ? handleAddDocSubmit : (updates) => handleEditDocSubmit(editingId!, updates)} // Recycle handlers for simplicity
          preselectedPositionId={activePositionId || undefined}
        />
      )}

      {connectionDrawerOpen && (
        <OrgChartConnectionDrawer
          isOpen={connectionDrawerOpen}
          id={selectedConnectionId}
          model={model}
          onClose={() => { setConnectionDrawerOpen(false); setSelectedConnectionId(null); }}
          onSave={handleSaveConnectionSubmit}
          onDelete={handleDeleteConnection}
          from={connFrom}
          to={connTo}
          type={connType}
          label={connLabel}
          condition={connCondition}
          window={connWindow}
          sops={connSops}
          escalations={connEscalations}
          setFrom={setConnFrom}
          setTo={setConnTo}
          setType={setConnType}
          setLabel={setConnLabel}
          setCondition={setConnCondition}
          setWindow={setConnWindow}
          setSops={setConnSops}
          setEscalations={setConnEscalations}
        />
      )}

      {/* --- EXPORT OVERLAY MODAL --- */}
      {exportContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-[#013028] border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D0D6BB]" />
                Exported SOP Knowledge Markdown
              </h3>
              <button
                onClick={() => setExportContent(null)}
                className="p-1 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Export Settings */}
            <div className="grid grid-cols-2 gap-4 bg-black/20 p-3 rounded-2xl border border-white/5 text-[11px] font-sans">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold font-mono text-[#D0D6BB] uppercase">Export Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => {
                    setExportFormat(e.target.value as any);
                    setTimeout(() => handleExport(), 50);
                  }}
                  className="w-full p-2 bg-[#012620] border border-white/10 rounded-xl text-white focus:outline-none cursor-pointer"
                >
                  <option value="standard">Standard Markdown (Ask Nest Ops & Wiki)</option>
                  <option value="retell">Retell Voice Agent optimized Markdown</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold font-mono text-[#D0D6BB] uppercase">Active Filters</label>
                <select
                  value={exportFilter}
                  disabled={exportFormat === 'retell'}
                  onChange={(e) => {
                    setExportFilter(e.target.value as any);
                    setTimeout(() => handleExport(), 50);
                  }}
                  className="w-full p-2 bg-[#012620] border border-white/10 rounded-xl text-white focus:outline-none cursor-pointer disabled:opacity-40"
                >
                  <option value="all">Export All Documents</option>
                  <option value="ask_nest_ops">Ask Nest Ops Integrated Only</option>
                  <option value="retell">Retell Voice Agent Integrated Only</option>
                  <option value="active">Active/Needs Review Only</option>
                </select>
              </div>
            </div>

            <textarea
              readOnly
              value={exportContent}
              className="flex-1 w-full p-4 bg-black/30 border border-white/10 rounded-2xl text-[10px] text-white font-mono focus:outline-none resize-none leading-relaxed h-[360px]"
            />

            <div className="flex justify-between items-center border-t border-white/10 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerSync}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Sync to Ask Nest Ops
                </button>
                {syncStatus === 'syncing' && (
                  <span className="text-[9px] text-[#D0D6BB] animate-pulse">Syncing...</span>
                )}
                {syncStatus === 'queued' && (
                  <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3" /> Queued
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportContent);
                    alert('SOP Knowledge Markdown copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-white/10 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => setExportContent(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-bold font-mono uppercase cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
            {syncStatus === 'queued' && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] rounded-xl font-mono text-center">
                Knowledge sync queued: Vector database update will take effect in a few minutes.
              </div>
            )}
          </div>
        </div>
      )}

      {activeProfilePerson && (
        <RoleProfileModal
          isOpen={!!activeProfilePerson}
          onClose={() => {
            setActiveProfilePerson(null);
            setAutoExportPdf(false);
          }}
          person={activeProfilePerson}
          workspaceId={workspaceId}
          autoDownloadPDF={autoExportPdf}
        />
      )}
    </>
  );
}

// --- CONTEXTUAL DRAWER OVERLAY SUBCOMPONENT ---
interface DrawerOverlayProps {
  type: 'position' | 'role' | 'sop' | 'escalation' | 'document' | 'link';
  mode: 'add' | 'edit';
  id: string | null;
  model: OrgModel;
  onClose: () => void;
  onSubmitPosition: (data: Partial<OrgPosition>) => void;
  onUpdatePositionInline?: (id: string, updates: Partial<OrgPosition>) => void;
  onSubmitRole: (data: Partial<OrgRole>) => void;
  onSubmitSop: (data: Partial<OrgSop>) => void;
  onSubmitEscalation: (data: Partial<EscalationPolicy>) => void;
  onSubmitDocument: (data: OrgKnowledgeDocument) => void;
  onSubmitLink: (data: OrgKnowledgeDocument) => void;
  preselectedPositionId?: string;
  workspaceId?: string;
}

function OrgChartDrawerOverlay({
  type, mode, id, model, onClose, onSubmitPosition, onUpdatePositionInline, onSubmitRole, onSubmitSop, onSubmitEscalation, onSubmitDocument, onSubmitLink, preselectedPositionId, workspaceId = 'nest-realty-demo'
}: DrawerOverlayProps) {

  // A. Local State for Position
  const [posName, setPosName] = useState('');
  const [posTitle, setPosTitle] = useState('');
  const [posDept, setPosDept] = useState('Operations');
  const [posOffice, setPosOffice] = useState('Wilmington');
  const [posEmail, setPosEmail] = useState('');
  const [posPhone, setPosPhone] = useState('');
  const [posReports, setPosReports] = useState('');
  const [posBackup, setPosBackup] = useState('');
  const [posVisibility, setPosVisibility] = useState<'internal' | 'leadership' | 'admin'>('internal');
  const [posAvatarUrl, setPosAvatarUrl] = useState('');
  const [posAvatarCrop, setPosAvatarCrop] = useState<AvatarCropSettings>({ x: 0, y: 0, scale: 1.2, rotation: 0, cropShape: 'circle', objectPosition: '50% 50%' });
  const [cropEditorOpen, setCropEditorOpen] = useState(false);
  const [posStatus, setPosStatus] = useState<OrgPositionStatus>('active');
  const [posTargetHireDate, setPosTargetHireDate] = useState('');
  const [posPriority, setPosPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [posEstimatedCost, setPosEstimatedCost] = useState('');
  const [posBusinessCase, setPosBusinessCase] = useState('');
  const [posHiringNotes, setPosHiringNotes] = useState('');
  const [posCoverageGap, setPosCoverageGap] = useState('');
  const [posConnectedTools, setPosConnectedTools] = useState<string[]>([]);
  const [authToolName, setAuthToolName] = useState<string | null>(null);

  // B. Local State for Role
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [roleSla, setRoleSla] = useState('24 hours');
  const [rolePosId, setRolePosId] = useState('');
  const [roleCategories, setRoleCategories] = useState<string[]>(['Other / Unknown']);
  const [roleBackupOwner, setRoleBackupOwner] = useState('');

  // C. Local State for SOP
  const [sopName, setSopName] = useState('');
  const [sopTrigger, setSopTrigger] = useState('');
  const [sopPurpose, setSopPurpose] = useState('');
  const [sopOwner, setSopOwner] = useState('');
  const [sopBackupOwner, setSopBackupOwner] = useState('');
  const [sopConnectedTool, setSopConnectedTool] = useState('');
  const [sopEscalationPolicyId, setSopEscalationPolicyId] = useState('');
  const [sopRoleId, setSopRoleId] = useState('');
  const [sopSteps, setSopSteps] = useState<string[]>(['Step 1']);
  const [sopFields, setSopFields] = useState<string[]>(['Required Parameter']);
  const [sopTags, setSopTags] = useState<string[]>(['general']);
  const [sopCompletionCriteria, setSopCompletionCriteria] = useState('');
  const [sopNotificationRules, setSopNotificationRules] = useState('');
  const [sopEscalationNotes, setSopEscalationNotes] = useState('');
  const [sopCategories, setSopCategories] = useState<string[]>([]);
  const [sopStatus, setSopStatus] = useState<OrgKnowledgeStatus>('active');
  const [sopIncludeAsk, setSopIncludeAsk] = useState(true);
  const [sopIncludeRetell, setSopIncludeRetell] = useState(true);
  const [sopIncludeRouting, setSopIncludeRouting] = useState(true);

  // D. Local State for Escalation Policy
  const [escName, setEscName] = useState('');
  const [escTrigger, setEscTrigger] = useState('');
  const [escCondition, setEscCondition] = useState('IF task overdue by 24h');
  const [escTarget, setEscTarget] = useState('');
  const [escFallbackTarget, setEscFallbackTarget] = useState('');
  const [escWindow, setEscWindow] = useState('24 hours');
  const [escUrgency, setEscUrgency] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [escChannels, setEscChannels] = useState<Array<'dashboard' | 'email' | 'sms' | 'phone' | 'slack' | 'teams'>>(['dashboard', 'email']);
  const [escContext, setEscContext] = useState<string[]>([]);
  const [escAction, setEscAction] = useState('');
  const [escSaveToKb, setEscSaveToKb] = useState(true);

  // E. Local State for Document Upload & unified importer
  const [docTitle, setDocTitle] = useState('');
  const [docSourceType, setDocSourceType] = useState<'pdf' | 'docx' | 'txt' | 'md' | 'url' | 'paste'>('pdf');
  const [docUrl, setDocUrl] = useState('');
  const [docPastedText, setDocPastedText] = useState('');
  const [docRelatedSopId, setDocRelatedSopId] = useState('');
  const [docOwnerPosition, setDocOwnerPosition] = useState('');
  const [docOwnerRole, setDocOwnerRole] = useState('');
  const [docCategories, setDocCategories] = useState<string[]>([]);
  const [docTags, setDocTags] = useState<string[]>([]);
  const [docClassType, setDocClassType] = useState<'policy' | 'sop' | 'checklist' | 'template' | 'training_guide' | 'vendor_document' | 'compliance_reference' | 'marketing_reference' | 'accounting_reference' | 'other'>('policy');
  const [docStatus, setDocStatus] = useState<OrgKnowledgeStatus>('active');
  const [docIncludeAsk, setDocIncludeAsk] = useState(true);
  const [docIncludeRetell, setDocIncludeRetell] = useState(true);
  const [docIncludeRouting, setDocIncludeRouting] = useState(true);
  const [docNotes, setDocNotes] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docFileName, setDocFileName] = useState('');
  const [docFileSize, setDocFileSize] = useState(0);
  const [docFileContentBase64, setDocFileContentBase64] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // F. Local State for Link Reference
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOwnerPosition, setLinkOwnerPosition] = useState('');
  const [linkOwnerRole, setLinkOwnerRole] = useState('');
  const [linkCategories, setLinkCategories] = useState<string[]>([]);
  const [linkTags, setLinkTags] = useState<string[]>([]);
  const [linkStatus, setLinkStatus] = useState<OrgKnowledgeStatus>('active');
  const [linkIncludeAsk, setLinkIncludeAsk] = useState(true);
  const [linkIncludeRetell, setLinkIncludeRetell] = useState(true);
  const [linkIncludeRouting, setLinkIncludeRouting] = useState(true);
  const [linkNotes, setLinkNotes] = useState('');

  // Sync / Load edit data
  useEffect(() => {
    if (mode === 'edit' && id) {
      if (type === 'position') {
        const item = model.positions.find(p => p.id === id);
        if (item) {
          setPosName(item.name);
          setPosTitle(item.title);
          setPosDept(item.department || 'Operations');
          setPosOffice(item.office || 'Wilmington');
          setPosEmail(item.email || '');
          setPosPhone(item.phone || '');
          setPosReports(item.reportsToPositionId || '');
          setPosBackup(item.backupPositionId || '');
          setPosVisibility(item.visibilityLevel || 'internal');
          setPosAvatarUrl(item.avatarUrl || '');
          setPosAvatarCrop(item.avatarCrop || { x: 0, y: 0, scale: 1.2, rotation: 0, cropShape: 'circle', objectPosition: '50% 50%' });
          setPosStatus(item.status || 'active');
          setPosTargetHireDate(item.targetHireDate || '');
          setPosPriority(item.priority || 'normal');
          setPosEstimatedCost(item.estimatedCost || '');
          setPosBusinessCase(item.businessCase || '');
          setPosHiringNotes(item.hiringNotes || '');
          setPosCoverageGap(item.coverageGap || '');
          setPosConnectedTools((item as any).connectedTools || []);
        }
      } else if (type === 'role') {
        const item = model.roles.find(r => r.id === id);
        if (item) {
          setRoleName(item.name);
          setRoleDesc(item.description);
          setRoleSla(item.defaultSla || '24 hours');
          setRolePosId(item.positionId);
          setRoleCategories(item.categories || []);
          setRoleBackupOwner(item.backupOwnerPositionId || '');
        }
      } else if (type === 'sop') {
        const item = model.sops.find(s => s.id === id);
        if (item) {
          setSopName(item.name);
          setSopTrigger(item.trigger);
          setSopPurpose(item.purpose || '');
          setSopOwner(item.ownerPositionId);
          setSopBackupOwner(item.backupPositionId || '');
          setSopConnectedTool(item.connectedTool || '');
          setSopEscalationPolicyId(item.escalationPolicyId || '');
          setSopRoleId(item.roleId || '');
          setSopSteps(item.steps || ['Step 1']);
          setSopFields(item.requiredInformation || ['Required Field']);
          setSopTags(item.tags || ['general']);
          setSopCompletionCriteria(item.completionCriteria || '');
          setSopNotificationRules(item.notificationRules || '');
          setSopEscalationNotes(item.escalationNotes || '');
          setSopCategories(item.requestCategories || []);
          setSopStatus(item.status || 'active');
          setSopIncludeAsk(item.includeInAskNestOps ?? true);
          setSopIncludeRetell(item.includeInRetell ?? true);
          setSopIncludeRouting(item.includeInRouting ?? true);
        }
      } else if (type === 'escalation') {
        const item = model.escalationPolicies.find(e => e.id === id);
        if (item) {
          setEscName(item.name);
          setEscTrigger(item.trigger);
          setEscCondition(item.condition);
          setEscTarget(item.escalateToPositionId);
          setEscFallbackTarget(item.fallbackActivePositionId || '');
          setEscWindow(item.responseWindow);
          setEscUrgency(item.urgency || 'normal');
          setEscChannels(item.channels || ['dashboard', 'email']);
          setEscContext(item.requiredContext || []);
          setEscAction(item.recommendedNextAction || '');
          setEscSaveToKb(item.saveToKnowledgeBase ?? true);
        }
      } else if (type === 'document' || type === 'link') {
        const item = (model.knowledgeDocuments || []).find(d => d.id === id);
        if (item) {
          if (type === 'document') {
            setDocTitle(item.title);
            setDocOwnerPosition(item.ownerPositionId || '');
            setDocOwnerRole(item.ownerRoleId || '');
            setDocCategories(item.requestCategories || []);
            setDocTags(item.tags || []);
            setDocClassType(item.documentType || 'policy');
            setDocStatus(item.status || 'active');
            setDocIncludeAsk(item.includeInAskNestOps);
            setDocIncludeRetell(item.includeInRetell);
            setDocIncludeRouting(item.includeInRouting);
            setDocNotes(item.aiSummary || '');
            setDocFileName(item.fileName || '');
            setDocFileSize(item.fileSizeBytes || 0);
          } else {
            setLinkTitle(item.title);
            setLinkUrl(item.sourceUrl || '');
            setLinkOwnerPosition(item.ownerPositionId || '');
            setLinkOwnerRole(item.ownerRoleId || '');
            setLinkCategories(item.requestCategories || []);
            setLinkTags(item.tags || []);
            setLinkStatus(item.status || 'active');
            setLinkIncludeAsk(item.includeInAskNestOps);
            setLinkIncludeRetell(item.includeInRetell);
            setLinkIncludeRouting(item.includeInRouting);
            setLinkNotes(item.aiSummary || '');
          }
        }
      }
    } else {
      // Set defaults for adds
      const defaultPosId = preselectedPositionId || (model.positions.length > 0 ? model.positions[0].id : '');
      if (defaultPosId) {
        setRolePosId(defaultPosId);
        setSopOwner(defaultPosId);
        setEscTarget(defaultPosId);
        setDocOwnerPosition(defaultPosId);
        setLinkOwnerPosition(defaultPosId);
        
        const posRoles = model.roles.filter(r => r.positionId === defaultPosId);
        if (posRoles.length > 0) {
          setSopRoleId(posRoles[0].id);
          setDocOwnerRole(posRoles[0].id);
          setLinkOwnerRole(posRoles[0].id);
        }
      }
    }
  }, [mode, id, type, model, preselectedPositionId]);

  // Handle position select updates in drawer forms
  const handlePositionChange = (posId: string, form: 'sop' | 'doc' | 'link') => {
    const roles = model.roles.filter(r => r.positionId === posId);
    const firstRoleId = roles.length > 0 ? roles[0].id : '';
    
    if (form === 'sop') {
      setSopOwner(posId);
      setSopRoleId(firstRoleId);
    } else if (form === 'doc') {
      setDocOwnerPosition(posId);
      setDocOwnerRole(firstRoleId);
    } else if (form === 'link') {
      setLinkOwnerPosition(posId);
      setLinkOwnerRole(firstRoleId);
    }
  };

  const handlePreFillRole = (templateName: string) => {
    if (templateName === 'Agent Onboarding') {
      setRoleName('Agent setup and onboarding');
      setRoleDesc('Coordinating initial software login details, license registration, and corporate access.');
      setRoleSla('24 hours');
      setRoleCategories(['IT / systems', 'Office supplies']);
    } else if (templateName === 'Listing Launch') {
      setRoleName('Listing marketing launch');
      setRoleDesc('Coordinating MLS parameters, photographer timelines, and marketing material distribution.');
      setRoleSla('12 hours');
      setRoleCategories(['Listing marketing', 'Marketing request']);
    } else if (templateName === 'Lockbox & Signage') {
      setRoleName('Sign and lockbox management');
      setRoleDesc('Handling Lockbox key access codes and local yard riders.');
      setRoleSla('12 hours');
      setRoleCategories(['Lockboxes / keys', 'Signs / riders']);
    }
  };

  const handlePreFillSop = (templateName: string) => {
    if (templateName === 'New-hire setup') {
      setSopName('New-hire setup');
      setSopTrigger('Agent onboarding agreement signed');
      setSopPurpose('Set up agent tool accounts.');
      setSopSteps(['Create email profile', 'Add to Slack workspace', 'Order default print business cards']);
      setSopFields(['Agent Full Name', 'Start Date', 'Support tier']);
      setSopTags(['onboarding', 'operations']);
    } else if (templateName === 'Listing launch checklist') {
      setSopName('Listing launch checklist');
      setSopTrigger('Listing agreement executed in Dotloop');
      setSopPurpose('Prepare new property advertising.');
      setSopSteps(['Confirm MLS draft fields', 'Schedule photographer arrival', 'Coordinate sign post install']);
      setSopFields(['Property Address', 'List Price', 'Showing instructions']);
      setSopTags(['marketing', 'listing']);
    } else if (templateName === 'Lockbox issue') {
      setSopName('Lockbox issue');
      setSopTrigger('Lockbox Jam or battery dead at property');
      setSopPurpose('Provide emergency property entry code.');
      setSopSteps(['Lookup device serial', 'Locate master backup code', 'Dispatch runner with replacement lockbox']);
      setSopFields(['Property Address', 'Serial code']);
      setSopTags(['lockbox', 'operations']);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    setDocFileName(file.name);
    setDocFileSize(file.size);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setDocFileContentBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleConnectPersonalOAuth = async (toolName: string, isLinked: boolean) => {
    const googleTools = ['Gmail', 'Google Calendar', 'Google Drive'];
    
    if (isLinked) {
      if (googleTools.includes(toolName)) {
        try {
          const res = await fetch(`/api/integrations/google/disconnect?workspaceId=${workspaceId}`, {
            method: 'POST',
            headers: {
              'x-workspace-id': workspaceId
            }
          });
          if (res.ok) {
            setPosConnectedTools(posConnectedTools.filter(t => !googleTools.includes(t)));
          } else {
            alert(`Failed to disconnect ${toolName}`);
          }
        } catch (err) {
          console.error(err);
          alert(`Disconnect error: ${err}`);
        }
      } else if (toolName === 'Canva') {
        try {
          const res = await fetch(`/api/integrations/canva/disconnect?workspaceId=${workspaceId}`, {
            method: 'POST',
            headers: {
              'x-workspace-id': workspaceId
            }
          });
          if (res.ok) {
            setPosConnectedTools(posConnectedTools.filter(t => t !== 'Canva'));
          } else {
            alert(`Failed to disconnect Canva`);
          }
        } catch (err) {
          console.error(err);
          alert(`Disconnect error: ${err}`);
        }
      } else {
        setPosConnectedTools(posConnectedTools.filter(t => t !== toolName));
      }
      return;
    }

    // Connect
    if (googleTools.includes(toolName)) {
      try {
        const res = await fetch(`/api/integrations/google/connect?workspaceId=${workspaceId}`, {
          headers: {
            'x-workspace-id': workspaceId
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            const width = 600;
            const height = 600;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;
            const popup = window.open(
              data.url,
              'oauth-popup',
              `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
            );

            const interval = setInterval(async () => {
              try {
                const statusRes = await fetch(`/api/integrations/google/status?workspaceId=${workspaceId}`, {
                  headers: {
                    'x-workspace-id': workspaceId
                  }
                });
                if (statusRes.ok) {
                  const statusData = await statusRes.json();
                  if (statusData.connected || statusData.status === 'connected') {
                    popup?.close();
                    clearInterval(interval);
                    setPosConnectedTools(prev => {
                      const next = [...prev];
                      googleTools.forEach(gt => {
                        if (!next.includes(gt)) next.push(gt);
                      });
                      return next;
                    });
                  }
                }
              } catch (pollErr) {
                console.warn('[OAuth Polling] Error checking connection status:', pollErr);
              }
            }, 1500);

            setTimeout(() => {
              clearInterval(interval);
            }, 120000);
          } else {
            alert('Could not retrieve Google OAuth login URL.');
          }
        } else {
          alert('Failed to connect to Google OAuth server.');
        }
      } catch (err) {
        console.error(err);
        alert(`OAuth error: ${err}`);
      }
    } else if (toolName === 'Canva') {
      try {
        const res = await fetch(`/api/integrations/canva/connect?workspaceId=${workspaceId}`, {
          headers: {
            'x-workspace-id': workspaceId
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            const width = 600;
            const height = 600;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;
            const popup = window.open(
              data.url,
              'oauth-popup',
              `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
            );

            const interval = setInterval(async () => {
              try {
                const statusRes = await fetch(`/api/integrations/canva/status?workspaceId=${workspaceId}`, {
                  headers: {
                    'x-workspace-id': workspaceId
                  }
                });
                if (statusRes.ok) {
                  const statusData = await statusRes.json();
                  if (statusData.connected || statusData.status === 'connected') {
                    popup?.close();
                    clearInterval(interval);
                    setPosConnectedTools(prev => {
                      if (!prev.includes('Canva')) return [...prev, 'Canva'];
                      return prev;
                    });
                  }
                }
              } catch (pollErr) {
                console.warn('[OAuth Polling] Error checking connection status:', pollErr);
              }
            }, 1500);

            setTimeout(() => {
              clearInterval(interval);
            }, 120000);
          } else {
            alert('Could not retrieve Canva OAuth login URL.');
          }
        } else {
          alert('Failed to connect to Canva OAuth server.');
        }
      } catch (err) {
        console.error(err);
        alert(`OAuth error: ${err}`);
      }
    } else {
      setAuthToolName(toolName);
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    if (type === 'position') {
      onSubmitPosition({
        name: posName,
        title: posTitle,
        department: posDept,
        office: posOffice,
        email: posEmail,
        phone: posPhone,
        reportsToPositionId: posReports || undefined,
        backupPositionId: posBackup || undefined,
        visibilityLevel: posVisibility,
        avatarUrl: posAvatarUrl || undefined,
        avatarCrop: posAvatarCrop,
        status: posStatus,
        targetHireDate: posTargetHireDate || undefined,
        priority: posPriority,
        estimatedCost: posEstimatedCost || undefined,
        businessCase: posBusinessCase || undefined,
        hiringNotes: posHiringNotes || undefined,
        coverageGap: posCoverageGap || undefined,
        connectedTools: posConnectedTools
      });
    } else if (type === 'role') {
      onSubmitRole({
        positionId: rolePosId,
        name: roleName,
        description: roleDesc,
        categories: roleCategories,
        defaultSla: roleSla,
        backupOwnerPositionId: roleBackupOwner || undefined
      });
    } else if (type === 'sop') {
      onSubmitSop({
        name: sopName,
        trigger: sopTrigger,
        purpose: sopPurpose,
        ownerPositionId: sopOwner,
        backupPositionId: sopBackupOwner || undefined,
        roleId: sopRoleId || undefined,
        steps: sopSteps,
        requiredInformation: sopFields,
        tags: sopTags,
        completionCriteria: sopCompletionCriteria || undefined,
        notificationRules: sopNotificationRules || undefined,
        escalationNotes: sopEscalationNotes || undefined,
        requestCategories: sopCategories,
        status: sopStatus,
        includeInAskNestOps: sopIncludeAsk,
        includeInRetell: sopIncludeRetell,
        includeInRouting: sopIncludeRouting,
        connectedTool: sopConnectedTool || undefined,
        escalationPolicyId: sopEscalationPolicyId || undefined
      });
    } else if (type === 'escalation') {
      const targetPos = model.positions.find(p => p.id === escTarget);
      const targetStatus = targetPos?.status || 'active';
      if (['open', 'planned', 'wanted'].includes(targetStatus) && !escFallbackTarget) {
        alert('Please select an active fallback owner for this unstaffed escalation target.');
        return;
      }
      onSubmitEscalation({
        name: escName,
        trigger: escTrigger,
        condition: escCondition,
        escalateToPositionId: escTarget,
        fallbackActivePositionId: escFallbackTarget || undefined,
        responseWindow: escWindow,
        urgency: escUrgency,
        channels: escChannels,
        requiredContext: escContext,
        recommendedNextAction: escAction,
        saveToKnowledgeBase: escSaveToKb
      });
    } else if (type === 'document') {
      if (mode === 'add') {
        if (!docFileContentBase64) {
          setUploadError('Please select a valid document file to upload.');
          return;
        }
        setUploading(true);
        try {
          const res = await fetch('/api/org-knowledge/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspaceId: model.positions[0]?.workspaceId || 'nest-realty-demo',
              fileName: docFileName,
              fileContent: docFileContentBase64,
              ownerPositionId: docOwnerPosition || undefined,
              ownerRoleId: docOwnerRole || undefined,
              requestCategories: docCategories,
              tags: docTags,
              documentType: docClassType,
              includeInAskNestOps: docIncludeAsk,
              includeInRetell: docIncludeRetell,
              includeInRouting: docIncludeRouting
            })
          });
          const data = await res.json();
          setUploading(false);
          if (data.success && data.document) {
            onSubmitDocument(data.document);
          } else {
            setUploadError(data.error || 'Failed uploading document.');
          }
        } catch (err: any) {
          setUploading(false);
          setUploadError(err.message || 'Error occurred uploading file.');
        }
      } else {
        // Edit Mode
        const updates = {
          title: docTitle,
          ownerPositionId: docOwnerPosition || undefined,
          ownerRoleId: docOwnerRole || undefined,
          requestCategories: docCategories,
          tags: docTags,
          documentType: docClassType,
          status: docStatus,
          includeInAskNestOps: docIncludeAsk,
          includeInRetell: docIncludeRetell,
          includeInRouting: docIncludeRouting,
          aiSummary: docNotes
        };
        onSubmitDocument({ id: id!, ...updates } as any);
      }
    } else if (type === 'link') {
      if (mode === 'add') {
        const newLinkDoc: OrgKnowledgeDocument = {
          id: `kd_link_${Date.now()}`,
          workspaceId: model.positions[0]?.workspaceId || 'nest-realty-demo',
          title: linkTitle || 'Reference Link',
          sourceType: 'link',
          documentType: 'other',
          ownerPositionId: linkOwnerPosition || undefined,
          ownerRoleId: linkOwnerRole || undefined,
          requestCategories: linkCategories,
          tags: linkTags,
          status: linkStatus,
          sourceUrl: linkUrl,
          aiSummary: linkNotes,
          extractionStatus: 'extracted',
          includeInAskNestOps: linkIncludeAsk,
          includeInRetell: linkIncludeRetell,
          includeInRouting: linkIncludeRouting,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        onSubmitLink(newLinkDoc);
      } else {
        const updates = {
          title: linkTitle,
          sourceUrl: linkUrl,
          ownerPositionId: linkOwnerPosition || undefined,
          ownerRoleId: linkOwnerRole || undefined,
          requestCategories: linkCategories,
          tags: linkTags,
          status: linkStatus,
          aiSummary: linkNotes,
          includeInAskNestOps: linkIncludeAsk,
          includeInRetell: linkIncludeRetell,
          includeInRouting: linkIncludeRouting
        };
        onSubmitLink({ id: id!, ...updates } as any);
      }
    }
  };

  const allCategories = [
    'Agent question', 'Compliance', 'Contract / transaction issue',
    'Accounting / commissions', 'Payables / bills / receipts', 'Marketing request',
    'Listing marketing', 'Agent branding', 'Business cards / print materials',
    'Signs / riders', 'Lockboxes / keys', 'Office supplies', 'Room reservation',
    'Vendor / maintenance', 'Event support', 'IT / systems', 'Leadership decision'
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="w-full max-w-lg bg-[#013028] border-l border-white/20 h-full flex flex-col justify-between text-left p-6 shadow-2xl relative animate-slide-in"
      >
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div>
              <span className="text-[9px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider block">
                Drawer Config
              </span>
              <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider mt-0.5">
                {mode === 'add' ? 'Add' : 'Edit'} {type === 'document' ? 'Document' : type === 'link' ? 'Link Reference' : type.toUpperCase()}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
            
            {/* A. POSITION FIELDS */}
            {type === 'position' && (
              <div className="space-y-4">
                {/* Position Status Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Position Type</label>
                  <select
                    value={posStatus}
                    onChange={(e) => setPosStatus(e.target.value as OrgPositionStatus)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active employee / current seat</option>
                    <option value="open">Open role — approved but not hired</option>
                    <option value="wanted">Wanted role — needed but not approved yet</option>
                    <option value="planned">Planned future role</option>
                    <option value="fractional">Fractional / contractor</option>
                    <option value="outsourced">Outsourced partner</option>
                    <option value="virtual_ai">Virtual / AI role</option>
                  </select>
                </div>

                {/* Conditional Fields based on posStatus */}
                {posStatus === 'active' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Person Name</label>
                      <input
                        type="text"
                        required
                        value={posName}
                        onChange={(e) => setPosName(e.target.value)}
                        placeholder="e.g. Ann Gunn"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00635C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Job Title / Seat</label>
                      <input
                        type="text"
                        required
                        value={posTitle}
                        onChange={(e) => setPosTitle(e.target.value)}
                        placeholder="e.g. Operations Director"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00635C]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Department</label>
                        <select
                          value={posDept}
                          onChange={(e) => setPosDept(e.target.value)}
                          className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                        >
                          <option value="Operations">Operations</option>
                          <option value="Leadership">Leadership</option>
                          <option value="Accounting">Accounting</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Compliance">Compliance</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Office Location</label>
                        <input
                          type="text"
                          value={posOffice}
                          onChange={(e) => setPosOffice(e.target.value)}
                          className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Email</label>
                        <input
                          type="email"
                          value={posEmail}
                          onChange={(e) => setPosEmail(e.target.value)}
                          placeholder="name@nestrealty.com"
                          className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Phone</label>
                        <input
                          type="text"
                          value={posPhone}
                          onChange={(e) => setPosPhone(e.target.value)}
                          placeholder="910-555-0100"
                          className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Reports To</label>
                      <select
                        value={posReports}
                        onChange={(e) => setPosReports(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">None (Top Level)</option>
                        {model.positions.filter(p => p.id !== id).map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Backup Owner</label>
                      <select
                        value={posBackup}
                        onChange={(e) => setPosBackup(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">None (No Backup)</option>
                        {model.positions.filter(p => p.id !== id).map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 p-3 bg-black/20 border border-white/5 rounded-xl">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-[#D0D6BB] uppercase font-sans tracking-wider flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Visibility Level</span>
                        </label>
                      </div>
                      <p className="text-[10px] text-[#D0D6BB]/70 leading-relaxed font-sans">
                        Controls who can view this position configuration in the directory and org views. <strong>It does not change who owns or receives routed work.</strong>
                      </p>
                      <select
                        value={posVisibility}
                        onChange={(e) => setPosVisibility(e.target.value as any)}
                        className="w-full p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs focus:outline-none cursor-pointer font-sans"
                      >
                        <option value="internal">Internal (Visible to all workspace staff)</option>
                        <option value="leadership">Leadership Only (Restricted to Management & Owners)</option>
                        <option value="admin">Admin / Compliance Board Only (Restricted to Admins)</option>
                      </select>
                      <div className="text-[9px] text-[#D0D6BB]/50 font-sans leading-tight pt-1">
                        • Internal: Workspace-wide display access.<br />
                        • Leadership: Office leadership & BIC view only.<br />
                        • Admin: System administrator view only.
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Avatar / Profile Image URL</label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="text"
                          value={posAvatarUrl}
                          onChange={(e) => setPosAvatarUrl(e.target.value)}
                          placeholder="e.g. /org-avatars/ryan.png"
                          className="flex-1 p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                        />
                        <div className="shrink-0 flex flex-col items-center gap-1">
                          <span className="text-[8px] font-mono text-[#D0D6BB]/40 uppercase">Preview</span>
                          <OrgAvatar name={posName} avatarUrl={posAvatarUrl} avatarCrop={posAvatarCrop} size={36} className="border border-white/10" />
                        </div>
                      </div>
                      {posAvatarUrl && (
                        <div className="mt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setCropEditorOpen(true)}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded text-[8px] font-mono font-bold uppercase transition-colors cursor-pointer"
                          >
                            Edit Crop
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Personal Connected Tools (OAuth) */}
                    <div className="space-y-2 pt-3 border-t border-white/10">
                      <label className="text-[9px] font-bold text-teal-300 uppercase font-mono block tracking-wider">
                        Personal Connected Tools (OAuth)
                      </label>
                      <p className="text-[10px] text-[#D0D6BB]/60 leading-normal mb-2">
                        Link personal app logins to sync emails, transaction milestones, and chat tasks.
                      </p>

                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { name: 'Gmail', icon: Mail },
                          { name: 'Google Calendar', icon: Calendar },
                          { name: 'Google Drive', icon: Folder },
                          { name: 'Rechat', icon: Users },
                          { name: 'Dotloop', icon: FileText },
                          { name: 'QuickBooks', icon: Layers },
                          { name: 'Canva', icon: Palette },
                          { name: 'Basecamp', icon: Zap },
                          { name: 'Slack', icon: MessageSquare },
                          { name: 'Microsoft Teams', icon: MessageSquare }
                        ].map((t) => {
                          const Icon = t.icon;
                          const isLinked = posConnectedTools.includes(t.name);

                          return (
                            <div key={t.name} className="flex justify-between items-center bg-black/20 border border-white/5 rounded-xl p-2.5 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-white/5 border border-white/10 rounded-lg text-white">
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-sans text-xs text-white font-medium">{t.name}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.2 rounded font-mono text-[7px] uppercase font-bold border ${
                                  isLinked 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-white/5 text-[#D0D6BB]/40 border-white/5'
                                }`}>
                                  {isLinked ? 'Linked (OAuth)' : 'Not Connected'}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleConnectPersonalOAuth(t.name, isLinked)}
                                  className={`px-2 py-1 rounded text-[8px] font-mono font-bold uppercase border transition-all cursor-pointer ${
                                    isLinked
                                      ? 'bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/20 text-rose-300'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 text-emerald-300'
                                  }`}
                                >
                                  {isLinked ? 'Disconnect' : 'Connect'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Open / Wanted / Planned / Fractional / Outsourced form layout */}
                {['open', 'wanted', 'planned', 'fractional', 'outsourced'].includes(posStatus) && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Seat Name / Identifier</label>
                      <input
                        type="text"
                        required
                        value={posName}
                        onChange={(e) => setPosName(e.target.value)}
                        placeholder="e.g. COO, Front Desk Assistant"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00635C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Proposed Job Title</label>
                      <input
                        type="text"
                        required
                        value={posTitle}
                        onChange={(e) => setPosTitle(e.target.value)}
                        placeholder="e.g. Chief Operating Officer"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00635C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Department</label>
                      <select
                        value={posDept}
                        onChange={(e) => setPosDept(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Operations">Operations</option>
                        <option value="Leadership">Leadership</option>
                        <option value="Accounting">Accounting</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Compliance">Compliance</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Reports To</label>
                      <select
                        value={posReports}
                        onChange={(e) => setPosReports(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">None (Top Level)</option>
                        {model.positions.filter(p => p.id !== id).map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Priority</label>
                        <select
                          value={posPriority}
                          onChange={(e) => setPosPriority(e.target.value as any)}
                          className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                        >
                          <option value="low">LOW</option>
                          <option value="normal">NORMAL</option>
                          <option value="high">HIGH</option>
                          <option value="urgent">URGENT</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Target Hire Date</label>
                        <input
                          type="text"
                          value={posTargetHireDate}
                          onChange={(e) => setPosTargetHireDate(e.target.value)}
                          placeholder="e.g. Q4 2026, 2026-10-01"
                          className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Estimated Cost (monthly/annual)</label>
                      <input
                        type="text"
                        value={posEstimatedCost}
                        onChange={(e) => setPosEstimatedCost(e.target.value)}
                        placeholder="e.g. $6,000/mo or $75,000/yr"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Coverage Gap / Operational Need</label>
                      <input
                        type="text"
                        value={posCoverageGap}
                        onChange={(e) => setPosCoverageGap(e.target.value)}
                        placeholder="e.g. Operational bottleneck overhead, signs setup bottleneck"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Business Case / Justification</label>
                      <textarea
                        value={posBusinessCase}
                        onChange={(e) => setPosBusinessCase(e.target.value)}
                        placeholder="Why is this role needed now?"
                        rows={3}
                        className="w-full p-2.5 bg-black/25 border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Hiring Notes</label>
                      <textarea
                        value={posHiringNotes}
                        onChange={(e) => setPosHiringNotes(e.target.value)}
                        placeholder="Candidate requirements, source agency, or status logs..."
                        rows={2}
                        className="w-full p-2.5 bg-black/25 border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Virtual / AI position form layout */}
                {posStatus === 'virtual_ai' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">AI Role / Agent Name</label>
                      <input
                        type="text"
                        required
                        value={posName}
                        onChange={(e) => setPosName(e.target.value)}
                        placeholder="e.g. AI Ops Assistant"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00635C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">AI Title / Function</label>
                      <input
                        type="text"
                        required
                        value={posTitle}
                        onChange={(e) => setPosTitle(e.target.value)}
                        placeholder="e.g. AI Coworker, Automated Triage Bot"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00635C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Department</label>
                      <select
                        value={posDept}
                        onChange={(e) => setPosDept(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Operations">Operations</option>
                        <option value="Leadership">Leadership</option>
                        <option value="Accounting">Accounting</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Compliance">Compliance</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Reports To / Owner</label>
                      <select
                        value={posReports}
                        onChange={(e) => setPosReports(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">None (Top Level)</option>
                        {model.positions.filter(p => p.id !== id).map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">AI Core Responsibilities / Capabilities</label>
                      <textarea
                        value={posBusinessCase}
                        onChange={(e) => setPosBusinessCase(e.target.value)}
                        placeholder="e.g. Intake triage, SOP lookup, missing-info collection..."
                        rows={3}
                        className="w-full p-2.5 bg-black/25 border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Channels / Tools Used (Comma-separated)</label>
                      <input
                        type="text"
                        value={posPhone}
                        onChange={(e) => setPosPhone(e.target.value)}
                        placeholder="e.g. Email, Slack, Retell, API integrations"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Human Fallback / Escalation Owner</label>
                      <select
                        value={posBackup}
                        onChange={(e) => setPosBackup(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">None</option>
                        {model.positions.filter(p => p.id !== id && p.status !== 'virtual_ai').map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">SOPs / Knowledge Docs Accessible</label>
                      <textarea
                        value={posHiringNotes}
                        onChange={(e) => setPosHiringNotes(e.target.value)}
                        placeholder="e.g. All brokerage SOPs, commission guidelines, room bookings..."
                        rows={2}
                        className="w-full p-2.5 bg-black/25 border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* B. ROLE FIELDS */}
            {type === 'role' && (
              <div className="space-y-4">
                
                {mode === 'add' && (
                  <div className="bg-black/15 p-2.5 rounded-xl border border-white/5 space-y-1.5">
                    <label className="text-[8px] font-bold font-mono text-[#D0D6BB] uppercase block">Prefill Responsibility Template</label>
                    <select
                      onChange={(e) => handlePreFillRole(e.target.value)}
                      defaultValue=""
                      className="w-full p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white text-[11px] cursor-pointer"
                    >
                      <option value="" disabled>-- Select a template --</option>
                      <option value="Agent Onboarding">Agent Onboarding</option>
                      <option value="Listing Launch">Listing Launch</option>
                      <option value="Lockbox & Signage">Lockbox & Signage</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Responsibility Owner Seat</label>
                  <select
                    value={rolePosId}
                    onChange={(e) => setRolePosId(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Role Name / Responsibility</label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Closing verification"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Description</label>
                  <textarea
                    required
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    rows={3}
                    placeholder="Describe exactly what tasks this role is accountable for..."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Target SLA Window</label>
                  <input
                    type="text"
                    value={roleSla}
                    onChange={(e) => setRoleSla(e.target.value)}
                    placeholder="e.g. 24 hours, 4 hours"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Request Categories Mapping</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto bg-black/20 p-2.5 rounded-xl border border-white/5">
                    {allCategories.map(cat => {
                      const isChecked = roleCategories.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-1.5 text-white cursor-pointer select-none text-[10px]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setRoleCategories(roleCategories.filter(x => x !== cat));
                              } else {
                                setRoleCategories([...roleCategories, cat]);
                              }
                            }}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20"
                          />
                          {cat}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Backup Owner Seat Override</label>
                  <select
                    value={roleBackupOwner}
                    onChange={(e) => setRoleBackupOwner(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">None (Use Seat Default)</option>
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* C. SOP FIELDS */}
            {type === 'sop' && (
              <div className="space-y-4">
                
                {/* SUGGESTED TEMPLATE SELECTOR */}
                {mode === 'add' && (
                  <div className="bg-black/15 p-2.5 rounded-xl border border-white/5 space-y-1.5">
                    <label className="text-[8px] font-bold font-mono text-[#D0D6BB] uppercase block">Suggest SOP Template</label>
                    <select
                      onChange={(e) => handlePreFillSop(e.target.value)}
                      defaultValue=""
                      className="w-full p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white text-[11px] cursor-pointer"
                    >
                      <option value="" disabled>-- Select suggested template --</option>
                      <option value="New-hire setup">New-hire setup</option>
                      <option value="Listing launch checklist">Listing launch checklist</option>
                      <option value="Lockbox issue">Lockbox issue</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">SOP Name</label>
                  <input
                    type="text"
                    required
                    value={sopName}
                    onChange={(e) => setSopName(e.target.value)}
                    placeholder="e.g. Commission request"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Owner Position</label>
                  <select
                    value={sopOwner}
                    onChange={(e) => handlePositionChange(e.target.value, 'sop')}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Backup Owner Position</label>
                  <select
                    value={sopBackupOwner}
                    onChange={(e) => setSopBackupOwner(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- No Backup Owner --</option>
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Attached Owner Role</label>
                  <select
                    value={sopRoleId}
                    onChange={(e) => setSopRoleId(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- No Attached Role --</option>
                    {model.roles.filter(r => r.positionId === sopOwner).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Trigger Condition</label>
                  <input
                    type="text"
                    required
                    value={sopTrigger}
                    onChange={(e) => setSopTrigger(e.target.value)}
                    placeholder="e.g. When closing package is received"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Purpose / Goal</label>
                  <textarea
                    value={sopPurpose}
                    onChange={(e) => setSopPurpose(e.target.value)}
                    rows={2}
                    placeholder="Describe the target outcome of this checklist..."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Related Connected Tool</label>
                  <select
                    value={sopConnectedTool}
                    onChange={(e) => setSopConnectedTool(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- No Related Tool --</option>
                    {['Gmail', 'Google Calendar', 'Google Drive', 'Rechat', 'Dotloop', 'QuickBooks', 'Basecamp', 'Slack', 'Microsoft Teams', 'SMS / Phone', 'AI Voice/Chat Agents', 'Brokerage Dashboard'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Related Escalation Policy</label>
                  <select
                    value={sopEscalationPolicyId}
                    onChange={(e) => setSopEscalationPolicyId(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- No Related Escalation Policy --</option>
                    {model.escalationPolicies.map(esc => (
                      <option key={esc.id} value={esc.id}>{esc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Execution Steps</label>
                    <button
                      type="button"
                      onClick={() => setSopSteps([...sopSteps, 'New step'])}
                      className="text-[9px] font-bold text-teal-300 uppercase hover:underline cursor-pointer"
                    >
                      + Add Step
                    </button>
                  </div>
                  {sopSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => {
                          const updated = [...sopSteps];
                          updated[idx] = e.target.value;
                          setSopSteps(updated);
                        }}
                        className="flex-1 p-1.5 bg-black/20 border border-white/10 rounded text-white"
                      />
                      <div className="flex gap-1 shrink-0">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...sopSteps];
                              const temp = updated[idx];
                              updated[idx] = updated[idx - 1];
                              updated[idx - 1] = temp;
                              setSopSteps(updated);
                            }}
                            className="p-1 text-[#D0D6BB] hover:bg-white/10 rounded cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {idx < sopSteps.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...sopSteps];
                              const temp = updated[idx];
                              updated[idx] = updated[idx + 1];
                              updated[idx + 1] = temp;
                              setSopSteps(updated);
                            }}
                            className="p-1 text-[#D0D6BB] hover:bg-white/10 rounded cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSopSteps(sopSteps.filter((_, i) => i !== idx))}
                        className="p-1.5 text-red-300 hover:bg-red-500/10 rounded shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Required Caller Details</label>
                    <button
                      type="button"
                      onClick={() => setSopFields([...sopFields, 'New Parameter'])}
                      className="text-[9px] font-bold text-teal-300 uppercase hover:underline cursor-pointer"
                    >
                      + Add Parameter
                    </button>
                  </div>
                  {sopFields.map((field, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <input
                        type="text"
                        value={field}
                        onChange={(e) => {
                          const updated = [...sopFields];
                          updated[idx] = e.target.value;
                          setSopFields(updated);
                        }}
                        className="flex-1 p-1.5 bg-black/20 border border-white/10 rounded text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setSopFields(sopFields.filter((_, i) => i !== idx))}
                        className="p-1.5 text-red-300 hover:bg-red-500/10 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Extended SOP details */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Completion Criteria</label>
                  <input
                    type="text"
                    value={sopCompletionCriteria}
                    onChange={(e) => setSopCompletionCriteria(e.target.value)}
                    placeholder="e.g. Escrow receipt fully logged and shared in thread."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Notification Rules</label>
                  <input
                    type="text"
                    value={sopNotificationRules}
                    onChange={(e) => setSopNotificationRules(e.target.value)}
                    placeholder="e.g. Notify Ryan on Slack if deal is at risk."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Escalation Notes</label>
                  <textarea
                    value={sopEscalationNotes}
                    onChange={(e) => setSopEscalationNotes(e.target.value)}
                    rows={1}
                    placeholder="e.g. Escalate to Ryan after 24 hours of delay."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">SOP Tag List (Comma separated)</label>
                  <input
                    type="text"
                    value={sopTags.join(', ')}
                    onChange={(e) => setSopTags(e.target.value.split(',').map(x => x.trim()).filter(Boolean))}
                    placeholder="e.g. finance, closing"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Trigger Categories</label>
                  <div className="grid grid-cols-2 gap-1 bg-black/25 p-2 rounded-xl max-h-24 overflow-y-auto">
                    {allCategories.map(cat => {
                      const isChecked = sopCategories.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-1 text-[9px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSopCategories(sopCategories.filter(x => x !== cat));
                              } else {
                                setSopCategories([...sopCategories, cat]);
                              }
                            }}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20 w-3 h-3"
                          />
                          {cat}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Status</label>
                    <select
                      value={sopStatus}
                      onChange={(e) => setSopStatus(e.target.value as any)}
                      className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white cursor-pointer"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="needs_review">Needs Review</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5 font-mono text-[10px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={sopIncludeRouting} 
                      onChange={() => setSopIncludeRouting(!sopIncludeRouting)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Use for AI Routing
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={sopIncludeRetell} 
                      onChange={() => setSopIncludeRetell(!sopIncludeRetell)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Include in Retell custom voice agent
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={sopIncludeAsk} 
                      onChange={() => setSopIncludeAsk(!sopIncludeAsk)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Include in Ask Nest Ops
                  </label>
                </div>
              </div>
            )}

            {/* D. ESCALATION POLICY FIELDS */}
            {type === 'escalation' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Escalation Policy Name</label>
                  <input
                    type="text"
                    required
                    value={escName}
                    onChange={(e) => setEscName(e.target.value)}
                    placeholder="e.g. Critical closing delay"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#D0D6BB] uppercase font-sans tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Trigger Condition</span>
                  </label>
                  <p className="text-[10px] text-[#D0D6BB]/70 font-sans">
                    The specific operational event or threshold that triggers this escalation.
                  </p>
                  <input
                    type="text"
                    required
                    value={escTrigger}
                    onChange={(e) => setEscTrigger(e.target.value)}
                    placeholder="e.g. Showing blocked by lockbox failure"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none font-sans text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Plain English Logic Rule</label>
                  <input
                    type="text"
                    required
                    value={escCondition}
                    onChange={(e) => setEscCondition(e.target.value)}
                    placeholder="e.g. IF lockbox issue unresolved after 4 hours"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none font-sans text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#D0D6BB] uppercase font-sans tracking-wider block">Escalation Recipient</label>
                  <p className="text-[10px] text-[#D0D6BB]/70 font-sans">
                    Target position that receives this escalated request. (Note: Initial request ownership is set by Request Routing rules.)
                  </p>
                  <select
                    value={escTarget}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEscTarget(val);
                      const selectedStatus = model.positions.find(p => p.id === val)?.status || 'active';
                      if (!['open', 'planned', 'wanted'].includes(selectedStatus)) {
                        setEscFallbackTarget('');
                      }
                    }}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>

                  {['open', 'planned', 'wanted'].includes(model.positions.find(p => p.id === escTarget)?.status || '') && (
                    <div className="space-y-1 mt-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left">
                      <span className="text-[9px] font-mono font-bold text-amber-300 uppercase block">
                        ⚠️ Staffing Gap Alert
                      </span>
                      <span className="text-[9px] text-[#D0D6BB] block leading-relaxed">
                        This escalation target is not staffed yet. Choose an active fallback owner.
                      </span>
                      <select
                        required
                        value={escFallbackTarget}
                        onChange={(e) => setEscFallbackTarget(e.target.value)}
                        className="w-full p-2 mt-1.5 bg-black/40 border border-amber-500/30 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Select Active Fallback Owner --</option>
                        {model.positions
                          .filter(p => !p.status || p.status === 'active' || p.status === 'fractional' || p.status === 'outsourced')
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                          ))
                        }
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Response window</label>
                  <input
                    type="text"
                    value={escWindow}
                    onChange={(e) => setEscWindow(e.target.value)}
                    placeholder="e.g. 2 hours, Same day"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Urgency Urgency</label>
                  <select
                    value={escUrgency}
                    onChange={(e) => setEscUrgency(e.target.value as any)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="low">LOW</option>
                    <option value="normal">NORMAL</option>
                    <option value="high">HIGH</option>
                    <option value="urgent">URGENT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Notification Channels</label>
                  <div className="flex flex-wrap gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                    {['dashboard', 'email', 'sms', 'phone', 'slack', 'teams'].map(c => {
                      const isChecked = escChannels.includes(c as any);
                      return (
                        <label key={c} className="flex items-center gap-1.5 text-white cursor-pointer select-none text-[10px]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setEscChannels(escChannels.filter(x => x !== c));
                              } else {
                                setEscChannels([...escChannels, c as any]);
                              }
                            }}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20"
                          />
                          {c.toUpperCase()}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Actionable Next Steps</label>
                  <textarea
                    value={escAction}
                    onChange={(e) => setEscAction(e.target.value)}
                    rows={2}
                    placeholder="Describe specific next steps target receiver should trigger..."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* E. UNIFIED KNOWLEDGE IMPORTER FIELDS */}
            {type === 'document' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Source Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'pdf', label: 'PDF File' },
                      { id: 'docx', label: 'DOCX File' },
                      { id: 'txt', label: 'TXT File' },
                      { id: 'md', label: 'Markdown' },
                      { id: 'url', label: 'Website URL' },
                      { id: 'paste', label: 'Pasted Text' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setDocSourceType(st.id as any);
                          setDocFileName('');
                          setDocFileSize(0);
                          setDocFileContentBase64('');
                        }}
                        className={`py-2 px-1 rounded-xl text-[10px] font-mono font-bold uppercase transition-all border cursor-pointer ${
                          docSourceType === st.id
                            ? 'bg-[#00635C] text-white border-[#007c73]'
                            : 'bg-black/25 text-[#D0D6BB]/60 border-white/5 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload Content */}
                {['pdf', 'docx', 'txt', 'md'].includes(docSourceType) && mode === 'add' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Upload {docSourceType.toUpperCase()} File</label>
                    <div className="border-2 border-dashed border-white/15 hover:border-white/30 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-black/15">
                      <input 
                        type="file" 
                        required={!docFileName}
                        accept={
                          docSourceType === 'pdf' ? '.pdf' :
                          docSourceType === 'docx' ? '.docx' :
                          docSourceType === 'txt' ? '.txt' : '.md'
                        }
                        onChange={handleFileChange} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Eye className="w-8 h-8 text-[#D0D6BB]/40 mx-auto mb-2" />
                      <span className="text-[11px] text-white font-bold block">Drag & Drop or Click to Browse</span>
                      <span className="text-[9px] text-[#D0D6BB]/50 block mt-1">Accepted: .{docSourceType} (Max 10MB)</span>
                    </div>
                    {docFileName && (
                      <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 text-[9px] font-mono text-emerald-300 flex justify-between items-center">
                        <span>Selected: {docFileName}</span>
                        <span>{(docFileSize / 1024).toFixed(0)} KB</span>
                      </div>
                    )}
                  </div>
                )}

                {/* URL Content */}
                {docSourceType === 'url' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Website URL</label>
                    <input
                      type="url"
                      required
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      placeholder="https://nestrealty.com/operating-standards"
                      className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                    />
                  </div>
                )}

                {/* Pasted Text Content */}
                {docSourceType === 'paste' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Pasted Documentation Content</label>
                    <textarea
                      required
                      value={docPastedText}
                      onChange={(e) => setDocPastedText(e.target.value)}
                      rows={4}
                      placeholder="Paste your operational policies, checklist steps, or markdown text here..."
                      className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none text-xs"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Document Title</label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. Wilmington Commission Standards"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Related SOP Checklist</label>
                  <select
                    value={docRelatedSopId}
                    onChange={(e) => setDocRelatedSopId(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white cursor-pointer"
                  >
                    <option value="">-- No Related SOP --</option>
                    {model.sops.map(sop => (
                      <option key={sop.id} value={sop.id}>{sop.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Owner Position Seat</label>
                  <select
                    value={docOwnerPosition}
                    onChange={(e) => handlePositionChange(e.target.value, 'doc')}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Owner Role Assignment</label>
                  <select
                    value={docOwnerRole}
                    onChange={(e) => setDocOwnerRole(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- No Attached Role --</option>
                    {model.roles.filter(r => r.positionId === docOwnerPosition).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Request Categories Mapping</label>
                  <div className="grid grid-cols-2 gap-1 bg-black/25 p-2 rounded-xl max-h-24 overflow-y-auto">
                    {allCategories.map(cat => {
                      const isChecked = docCategories.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-1 text-[9px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setDocCategories(docCategories.filter(x => x !== cat));
                              } else {
                                setDocCategories([...docCategories, cat]);
                              }
                            }}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20 w-3 h-3"
                          />
                          {cat}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Document Classification Type</label>
                  <select
                    value={docClassType}
                    onChange={(e) => setDocClassType(e.target.value as any)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white cursor-pointer"
                  >
                    <option value="policy">Policy</option>
                    <option value="sop">SOP Checklist</option>
                    <option value="checklist">Checklist</option>
                    <option value="template">Template</option>
                    <option value="training_guide">Training Guide</option>
                    <option value="vendor_document">Vendor Document</option>
                    <option value="compliance_reference">Compliance Reference</option>
                    <option value="marketing_reference">Marketing Reference</option>
                    <option value="accounting_reference">Accounting Reference</option>
                    <option value="other">Other Reference</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Status</label>
                    <select
                      value={docStatus}
                      onChange={(e) => setDocStatus(e.target.value as any)}
                      className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white cursor-pointer"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="needs_review">Needs Review</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Document Notes / Summary</label>
                  <textarea
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    rows={2}
                    placeholder="Enter summary details or notes about the document contents..."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">SOP Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={docTags.join(', ')}
                    onChange={(e) => setDocTags(e.target.value.split(',').map(x => x.trim()).filter(Boolean))}
                    placeholder="e.g. policy, onboard"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5 font-mono text-[10px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={docIncludeRouting} 
                      onChange={() => setDocIncludeRouting(!docIncludeRouting)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Use for AI Routing
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={docIncludeRetell} 
                      onChange={() => setDocIncludeRetell(!docIncludeRetell)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Include in Retell custom voice agent
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={docIncludeAsk} 
                      onChange={() => setDocIncludeAsk(!docIncludeAsk)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Include in Ask Nest Ops
                  </label>
                </div>
              </div>
            )}

            {/* F. LINK REFERENCE FIELDS */}
            {type === 'link' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Link Title</label>
                  <input
                    type="text"
                    required
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="e.g. Dotloop portal link"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Destination URL</label>
                  <input
                    type="url"
                    required
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="e.g. https://dotloop.com"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Owner Position Seat</label>
                  <select
                    value={linkOwnerPosition}
                    onChange={(e) => handlePositionChange(e.target.value, 'link')}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Owner Role Assignment</label>
                  <select
                    value={linkOwnerRole}
                    onChange={(e) => setLinkOwnerRole(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- No Attached Role --</option>
                    {model.roles.filter(r => r.positionId === linkOwnerPosition).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Request Categories Mapping</label>
                  <div className="grid grid-cols-2 gap-1 bg-black/25 p-2 rounded-xl max-h-24 overflow-y-auto">
                    {allCategories.map(cat => {
                      const isChecked = linkCategories.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-1 text-[9px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setLinkCategories(linkCategories.filter(x => x !== cat));
                              } else {
                                setLinkCategories([...linkCategories, cat]);
                              }
                            }}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20 w-3 h-3"
                          />
                          {cat}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Reference Summary / Notes</label>
                  <textarea
                    value={linkNotes}
                    onChange={(e) => setLinkNotes(e.target.value)}
                    rows={2}
                    placeholder="Enter summary details or notes about the link contents..."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={linkTags.join(', ')}
                    onChange={(e) => setLinkTags(e.target.value.split(',').map(x => x.trim()).filter(Boolean))}
                    placeholder="e.g. portal, support"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5 font-mono text-[10px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={linkIncludeRouting} 
                      onChange={() => setLinkIncludeRouting(!linkIncludeRouting)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Use for AI Routing
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={linkIncludeRetell} 
                      onChange={() => setLinkIncludeRetell(!linkIncludeRetell)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Include in Retell custom voice agent
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={linkIncludeAsk} 
                      onChange={() => setLinkIncludeAsk(!linkIncludeAsk)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Include in Ask Nest Ops
                  </label>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-300 rounded-xl font-mono text-center">
                {uploadError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-bold font-mono uppercase cursor-pointer"
              >
                Cancel
              </button>
              {type === 'document' && mode === 'add' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setDocStatus('draft');
                      const btn = document.getElementById('hidden-document-submit-btn');
                      setTimeout(() => btn?.click(), 50);
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocStatus('processing');
                      const btn = document.getElementById('hidden-document-submit-btn');
                      setTimeout(() => btn?.click(), 50);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-white/20 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer"
                  >
                    Process Document
                  </button>
                  {/* Hidden submit trigger */}
                  <button id="hidden-document-submit-btn" type="submit" className="hidden" />
                </>
              ) : (
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-white/20 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Processing...' : mode === 'add' ? (type === 'position' ? 'Create position' : type === 'role' ? 'Create role' : type === 'sop' ? 'Save SOP' : type === 'escalation' ? 'Save Policy' : 'Add Item') : 'Save Changes'}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>

      {cropEditorOpen && (
        <AvatarCropEditor
          avatarUrl={posAvatarUrl}
          name={posName}
          initialCrop={posAvatarCrop}
          onSave={(newCrop) => {
            setPosAvatarCrop(newCrop);
            setCropEditorOpen(false);
            if (mode === 'edit' && id) {
              onUpdatePositionInline?.(id, { avatarCrop: newCrop });
            }
          }}
          onCancel={() => setCropEditorOpen(false)}
        />
      )}

      {authToolName && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#01251e] border border-emerald-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h4 className="text-sm font-serif font-black text-white uppercase tracking-tight">Authorize {authToolName}</h4>
              </div>
              <button type="button" onClick={() => setAuthToolName(null)} className="text-[#D0D6BB]/50 hover:text-white transition-colors cursor-pointer bg-transparent border-none">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[11px] text-[#D0D6BB]/75 leading-relaxed">
              Nest Realty Wilmington Command Center requests permission to link <strong>{posName || 'this seat'}</strong> to your personal <strong>{authToolName}</strong> account via secure OAuth.
            </p>

            <div className="bg-black/20 border border-white/5 rounded-xl p-3 space-y-2 text-[10px] font-mono text-[#D0D6BB]/80">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" /> Read / Send Emails & Tasks
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" /> Synchronize transaction files
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" /> Write activity and operational logs
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-mono text-[#D0D6BB]/60 uppercase block">Account Email Address</label>
              <input
                type="email"
                required
                placeholder="username@domain.com"
                className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                id="oauth-email-input"
                defaultValue={posEmail || ''}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAuthToolName(null)}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('oauth-email-input') as HTMLInputElement;
                  const email = input?.value || posEmail || 'user@nestrealty.com';
                  
                  if (!posConnectedTools.includes(authToolName)) {
                    setPosConnectedTools([...posConnectedTools, authToolName]);
                  }
                  
                  if (!posEmail && email) {
                    setPosEmail(email);
                  }
                  
                  setAuthToolName(null);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer border-none"
              >
                Authorize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrgChartConnectionDrawer({
  isOpen,
  id,
  model,
  onClose,
  onSave,
  onDelete,
  from,
  to,
  type,
  label,
  condition,
  window,
  sops,
  escalations,
  setFrom,
  setTo,
  setType,
  setLabel,
  setCondition,
  setWindow,
  setSops,
  setEscalations
}: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[360px] bg-[#013028] border-l border-white/10 shadow-2xl p-6 flex flex-col gap-5 text-left font-sans animate-slide-in">
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">
          {id ? 'Edit Connection Line' : 'Add Connection Line'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/10"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(e); }} className="flex-1 overflow-y-auto space-y-4 text-xs">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">From Position (Source)</label>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
            className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
          >
            <option value="" disabled>-- Select Position --</option>
            {model.positions.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">To Position (Target)</label>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
          >
            <option value="" disabled>-- Select Position --</option>
            {model.positions.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Relationship Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
          >
            <option value="reporting">Reporting Line (solid pistachio)</option>
            <option value="escalation">Escalation Policy Path (dashed gold)</option>
            <option value="sop">SOP / Knowledge Connection (dotted emerald)</option>
            <option value="ownership">Custom Connection / Ownership</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Line Label / Title</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Compliance Escalation"
            className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
          />
        </div>

        {type === 'escalation' && (
          <div className="space-y-3 p-3 bg-black/20 rounded-xl border border-white/5">
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-[#D0D6BB] uppercase font-mono block">Trigger Condition</label>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. IF task overdue 48h"
                className="w-full p-1.5 bg-[#012620] border border-white/10 rounded text-white text-[11px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-[#D0D6BB] uppercase font-mono block">SLA Response Window</label>
              <input
                type="text"
                value={window}
                onChange={(e) => setWindow(e.target.value)}
                placeholder="e.g. 24 hours"
                className="w-full p-1.5 bg-[#012620] border border-white/10 rounded text-white text-[11px]"
              />
            </div>
          </div>
        )}

        {type === 'sop' && (
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Link Checklist SOPs</label>
            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 max-h-32 overflow-y-auto space-y-1">
              {model.sops.map((sop: any) => {
                const isChecked = sops.includes(sop.id);
                return (
                  <label key={sop.id} className="flex items-center gap-2 text-[10px] text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSops(sops.filter((x: string) => x !== sop.id));
                        } else {
                          setSops([...sops, sop.id]);
                        }
                      }}
                      className="rounded border-white/20 bg-black/30 accent-emerald-600"
                    />
                    {sop.name}
                  </label>
                );
              })}
              {model.sops.length === 0 && (
                <span className="text-[9px] text-[#D0D6BB]/40 italic block">No SOPs documented.</span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-4 border-t border-white/10">
          {id && (
            <button
              type="button"
              onClick={() => onDelete(id)}
              className="mr-auto px-3 py-2 bg-red-600/25 hover:bg-red-600/35 border border-red-500/20 text-red-300 rounded-xl text-[9px] font-bold font-mono uppercase cursor-pointer"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[9px] font-bold font-mono uppercase cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-white/20 rounded-xl text-[9px] font-bold font-mono uppercase tracking-wider cursor-pointer"
          >
            Save Line
          </button>
        </div>
      </form>
    </div>
  );
}
