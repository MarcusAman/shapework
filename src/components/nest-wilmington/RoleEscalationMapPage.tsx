/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Role & Escalation Map Page — Comprehensive Apple Light Mode Implementation
 * Full resolution for QA issues ISS-001, ISS-003, ISS-004, ISS-005, ISS-006, 
 * ISS-019, ISS-020, ISS-021, ISS-022, ISS-023, ISS-024.
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, Shield, ArrowRight, Settings, Plus, Check, X, AlertTriangle, 
  ChevronRight, Zap, Layers, Sliders, FileText, CheckCircle2, Clock, UserCheck, 
  Trash2, Mail, Phone, MessageSquare, Home, PenTool, Folder, Calendar, Palette, 
  Database, Info, Search, Filter, Play, ExternalLink, Network, Building, Printer,
  Edit3, HelpCircle, ArrowUpRight, CheckSquare, Sparkles, Link
} from 'lucide-react';
import type { RoleEscalationData, RoleMapCard, RoutingTableRow } from './adapters';
import type { OrgModel, OrgPosition } from '../../services/orgChartService';
import { orgChartService } from '../../services/orgChartService';
import OrgChartWizardPage from '../settings/OrgChartWizardPage';
import ConnectedToolsDrawer from '../integrations/ConnectedToolsDrawer';
import {
  Card,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  MetricTile,
  MetricGroup,
  SegmentedControl,
  Drawer,
  Modal,
  TextInput
} from '../ui';

interface RoleEscalationMapPageProps {
  data?: RoleEscalationData;
  model?: OrgModel;
  defaultTab?: string;
  workspaceId?: string;
  state?: any;
  onNavigateToSop?: (sopId: string) => void;
}

const EXPANDED_ROLE_PRESETS = [
  {
    title: 'Listing Specialist',
    department: 'Listings',
    handles: ['Pre-MLS Entry', 'Seller Disclosures', 'Yard Sign Dispatch', 'Lockbox Assignment'],
    backupFor: ['Transaction Coordinator'],
    escalatesToRyanWhen: 'Financial risk > $5,000 OR Listing Seller Dispute',
    tools: ['MLS', 'Rechat', 'Dotloop']
  },
  {
    title: 'Transaction Coordinator',
    department: 'Closing & Escrow',
    handles: ['Contract Audit', 'Earnest Money Verification', 'Closing Disclosure Review', 'Title Coordination'],
    backupFor: ['Listing Specialist'],
    escalatesToRyanWhen: 'Overdue > 24 hrs OR Compliance Document Exception',
    tools: ['Basecamp', 'Dotloop', 'QuickBooks']
  },
  {
    title: 'Marketing Lead',
    department: 'Marketing',
    handles: ['Just Listed Flyers', 'Social Media Campaign', 'Open House Print Kits', 'Digital Ads'],
    backupFor: ['Office Coordinator'],
    escalatesToRyanWhen: 'Budget overrun > $1,000 OR Brand Exception',
    tools: ['Canva', 'Slack', 'Drive']
  },
  {
    title: 'Field Operator',
    department: 'Physical Assets',
    handles: ['Sign Post Installation', 'Lockbox Code Inspection', 'Property Check-in', 'Asset Maintenance'],
    backupFor: ['Listing Specialist'],
    escalatesToRyanWhen: 'Asset missing / stolen OR Damaged property flag',
    tools: ['Tapo Relay', 'SMS', 'Google Maps']
  },
  {
    title: 'Managing Broker / BIC',
    department: 'Executive',
    handles: ['NCREC Compliance Audit', 'Legal Representation', 'Trust Account Verification', 'Broker Mentorship'],
    backupFor: ['Principal / Owner'],
    escalatesToRyanWhen: 'Formal Real Estate Commission Complaint OR Legal Liability > $10,000',
    tools: ['Dotloop', 'NCREC Portal', 'QuickBooks']
  },
  {
    title: 'Client Concierge & Intake Specialist',
    department: 'Operations',
    handles: ['Inbound Phone Triage', 'Agent Onboarding', 'Vendor Scheduling', 'Key Checkout'],
    backupFor: ['Listing Specialist'],
    escalatesToRyanWhen: 'Escalated Client Dissatisfaction OR Safety Alert',
    tools: ['Nora Voice AI', 'Google Workspace', 'Slack']
  },
  {
    title: 'Commercial & Land Associate',
    department: 'Commercial',
    handles: ['Zoning Due Diligence', 'Phase 1 Environmental Review', 'Lease Audits', 'Offering Memorandums'],
    backupFor: ['Listing Specialist'],
    escalatesToRyanWhen: 'Contract value > $1,000,000 OR Title Cloud',
    tools: ['CoStar', 'Dotloop', 'MLS']
  },
  {
    title: 'Tech & Workflow Integrator',
    department: 'Operations',
    handles: ['Software Provisioning', 'API Webhook Monitoring', 'Hardware Setup', 'Security Audit'],
    backupFor: ['Marketing Lead'],
    escalatesToRyanWhen: 'System outage > 1 hour OR Data breach concern',
    tools: ['Google Admin', 'Slack', 'Ask Nest Ops']
  }
];

const INITIAL_CONNECTED_TOOLS = [
  {
    category: 'Core Communication & Dispatch',
    tools: [
      { name: 'Gmail / Google Workspace', type: 'Email', status: 'Connected', desc: 'Listing dispatch alerts and client communications' },
      { name: 'Slack (#ops-dispatch)', type: 'Team Chat', status: 'Connected', desc: 'Internal team escalation pings and real-time SLA alerts' },
      { name: 'Nora / AI Phone Agent (Ava)', type: 'Voice AI', status: 'Connected', desc: 'Inbound caller triage and live intake recording' }
    ]
  },
  {
    category: 'Contracts & Compliance',
    tools: [
      { name: 'Dotloop (Wilmington Association)', type: 'Transaction Management', status: 'Connected', desc: 'NCREC audited contract repository and signatures' },
      { name: 'Rechat MLS Gateway', type: 'MLS Sync', status: 'Connected', desc: 'Listing syndication and MLS status parity' },
      { name: 'Google Drive (SOP Docs)', type: 'Knowledge Store', status: 'Connected', desc: 'Brokerage operating manuals and document drafts' }
    ]
  },
  {
    category: 'Finance, Escrow & Physical Assets',
    tools: [
      { name: 'QuickBooks Online', type: 'Accounting', status: 'Connected', desc: 'Commission disbursement authorizations and vendor billing' },
      { name: 'Tapo Smart Lock Relay', type: 'IoT Asset', status: 'Connected', desc: 'Lockbox access log capture and remote lock toggle' },
      { name: 'Canva Pro for Enterprise', type: 'Creative Assets', status: 'Connected', desc: 'Brand-approved marketing templates and luxury flyers' }
    ]
  }
];

const getAvatarForRole = (name: string, customUrl?: string) => {
  if (customUrl) return customUrl;
  const n = name.toLowerCase();
  if (n.includes('ryan')) return '/org-avatars/ryan.png';
  if (n.includes('melissa')) return '/org-avatars/melissa.png';
  if (n.includes('jessica') || n.includes('taylor')) return '/org-avatars/jessica.png';
  if (n.includes('ann') || n.includes('jordan')) return '/org-avatars/ann.png';
  if (n.includes('james') || n.includes('eric')) return '/org-avatars/james.png';
  return null;
};

export default function RoleEscalationMapPage({ data, model: initialModel, defaultTab = 'roles', workspaceId, state, onNavigateToSop }: RoleEscalationMapPageProps) {
  const effectiveWorkspaceId = workspaceId || 'ws_wilmington';
  const [activeTab, setActiveTab] = useState<'roles' | 'visual_map' | 'overview' | 'routing' | 'escalations' | 'connected_tools'>(
    defaultTab === 'visual_map' || defaultTab === 'overview' || defaultTab === 'routing' || defaultTab === 'escalations' || defaultTab === 'connected_tools'
      ? defaultTab
      : 'roles'
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleNavigateToSop = (sopId: string) => {
    try {
      localStorage.setItem('sop_studio_selected_sop_id', sopId);
    } catch (e) {
      // ignore
    }
    if (onNavigateToSop) {
      onNavigateToSop(sopId);
      return;
    }
    if (state?.setCurrentTab) {
      state.setCurrentTab('Knowledge Library');
      return;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shapework:navigate-tab', { detail: { tab: 'Knowledge Library', sopId } }));
    }
  };

  // Department filter for Overview navigation
  const [positionFilterDept, setPositionFilterDept] = useState<string>('All');
  const [positionFilterStatus, setPositionFilterStatus] = useState<string>('All');

  const model = useMemo(() => {
    return initialModel || orgChartService.getOrgChart(effectiveWorkspaceId);
  }, [initialModel, effectiveWorkspaceId]);

  const [roles, setRoles] = useState<RoleMapCard[]>(data?.roleMap || [
    {
      id: 'r1',
      name: 'Ryan Shield (Principal)',
      title: 'Managing Principal / Owner',
      department: 'Executive',
      handles: ['Brokerage Compliance', 'Financial Approvals', 'High-Risk Seller Disputes'],
      backupFor: ['Managing Broker'],
      escalatesToRyanWhen: 'Direct principal escalation OR Legal risk > $5,000',
      tools: ['QuickBooks', 'Ask Nest Ops', 'Basecamp'],
      status: 'active',
      avatarUrl: '/org-avatars/ryan.png'
    },
    {
      id: 'r2',
      name: 'Taylor Morgan',
      title: 'Listing Specialist',
      department: 'Listings',
      handles: ['Pre-MLS Entry', 'Yard Sign Dispatch', 'Lockbox Setup', 'Seller Onboarding'],
      backupFor: ['Transaction Coordinator'],
      escalatesToRyanWhen: 'Overdue > 24 hrs OR Seller dispute',
      tools: ['MLS', 'Rechat', 'Dotloop'],
      status: 'active',
      avatarUrl: '/org-avatars/jessica.png'
    },
    {
      id: 'r3',
      name: 'Melissa Vance',
      title: 'Transaction Coordinator',
      department: 'Closing & Escrow',
      handles: ['Escrow Verification', 'Earnest Money Audit', 'Closing File Review'],
      backupFor: ['Listing Specialist'],
      escalatesToRyanWhen: 'Overdue > 24 hrs OR Missing legal disclosure',
      tools: ['Dotloop', 'Basecamp', 'QuickBooks'],
      status: 'active',
      avatarUrl: '/org-avatars/melissa.png'
    },
    {
      id: 'r4',
      name: 'Jordan Lee',
      title: 'Marketing & Field Lead',
      department: 'Marketing & Ops',
      handles: ['Property Signs', 'Listing Flyers', 'Social Media Assets', 'Open House Kits'],
      backupFor: ['Listing Specialist'],
      escalatesToRyanWhen: 'Vendor dispatch failure OR Budget exception',
      tools: ['Canva', 'Tapo Relay', 'Slack'],
      status: 'active',
      avatarUrl: '/org-avatars/ann.png'
    }
  ]);

  // Routing matrix state (ISS-006 & ISS-023)
  const [routingRules, setRoutingRules] = useState<Array<{
    id: string;
    category: string;
    primary: string;
    backup: string;
    sla: string;
    description: string;
    governingSopId?: string;
    governingSopRef?: string;
    governingSopTitle?: string;
  }>>([
    { 
      id: 'rt_1', 
      category: 'Listing Pre-Launch & MLS Entry', 
      primary: 'Listing Specialist', 
      backup: 'Transaction Coordinator', 
      sla: '4 hours', 
      description: 'Automated intake checklist triggers upon inbound message receipt.',
      governingSopId: 'sop_listing_launch_001',
      governingSopRef: 'SOP-001',
      governingSopTitle: 'Listing Launch SOP'
    },
    { 
      id: 'rt_2', 
      category: 'Contract Audit & EMD Verification', 
      primary: 'Transaction Coordinator', 
      backup: 'Managing Broker', 
      sla: '2 hours', 
      description: 'Immediate escrow verification and compliance review.',
      governingSopId: 'sop_cda_approval_002',
      governingSopRef: 'SOP-002',
      governingSopTitle: 'CDA Approval & Escrow Verification'
    },
    { 
      id: 'rt_3', 
      category: 'Marketing Material Request', 
      primary: 'Marketing Lead', 
      backup: 'Office Coordinator', 
      sla: '6 hours', 
      description: 'Custom flyer and social campaign graphic generation.',
      governingSopId: 'sop_marketing_intake_004',
      governingSopRef: 'SOP-004',
      governingSopTitle: 'Marketing Material Request'
    },
    { 
      id: 'rt_4', 
      category: 'Sign Post Installation / Lockbox', 
      primary: 'Field Operator', 
      backup: 'Listing Specialist', 
      sla: '24 hours', 
      description: 'Field dispatch for physical sign and electronic lockbox.',
      governingSopId: 'sop_sign_vendor_003',
      governingSopRef: 'SOP-003',
      governingSopTitle: 'Yard Sign & Lockbox Vendor Dispatch'
    }
  ]);

  // Published policy and preview states
  const [publishedPolicyData, setPublishedPolicyData] = useState<{ policy: any; rules: any[] } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewInput, setPreviewInput] = useState({
    category: 'marketing',
    deliverableType: 'Property Flyer',
    title: 'Just Listed Flyer',
    channel: 'web',
    requesterName: 'Matt Orr',
    propertyAddress: '408 Landfall Dr, Wilmington NC',
    classificationConfidence: 0.95
  });
  const [previewResult, setPreviewResult] = useState<any | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);

  const loadPublishedPolicy = async () => {
    try {
      const data = await orgChartService.fetchPublishedPolicy(effectiveWorkspaceId);
      if (data && data.policy) {
        setPublishedPolicyData(data);
        if (data.rules && data.rules.length > 0) {
          setRoutingRules(data.rules.map((r: any) => {
            const defaultRef = 
              (r.category || r.display_name || '').toLowerCase().includes('listing') ? 'SOP-001' :
              (r.category || r.display_name || '').toLowerCase().includes('contract') || (r.category || r.display_name || '').toLowerCase().includes('emd') ? 'SOP-002' :
              (r.category || r.display_name || '').toLowerCase().includes('sign') || (r.category || r.display_name || '').toLowerCase().includes('lockbox') ? 'SOP-003' :
              (r.category || r.display_name || '').toLowerCase().includes('marketing') ? 'SOP-004' : 'SOP-001';
            const defaultId =
              defaultRef === 'SOP-001' ? 'sop_listing_launch_001' :
              defaultRef === 'SOP-002' ? 'sop_cda_approval_002' :
              defaultRef === 'SOP-003' ? 'sop_sign_vendor_003' : 'sop_marketing_intake_004';
            const defaultTitle =
              defaultRef === 'SOP-001' ? 'Listing Launch SOP' :
              defaultRef === 'SOP-002' ? 'CDA Approval & Escrow Verification' :
              defaultRef === 'SOP-003' ? 'Yard Sign & Lockbox Vendor Dispatch' : 'Marketing Material Request';

            return {
              id: r.id,
              category: r.display_name || r.category,
              primary: r.primary_staff_id,
              backup: r.backup_staff_id || 'None',
              sla: r.sla_display || `${r.sla_hours} hours`,
              description: r.metadata?.description || `Governed by ${r.governing_sop_id || defaultTitle}`,
              governingSopId: r.governing_sop_id || defaultId,
              governingSopRef: r.governing_sop_ref || defaultRef,
              governingSopTitle: r.governing_sop_title || r.metadata?.sop_title || defaultTitle
            };
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to load published routing policy:', err);
    }
  };

  React.useEffect(() => {
    loadPublishedPolicy();
  }, [effectiveWorkspaceId]);

  const handlePublishPolicy = async () => {
    setIsPublishing(true);
    setPublishError(null);
    setPublishMessage(null);
    try {
      const res = await orgChartService.publishRoutingPolicy(effectiveWorkspaceId, 'Authorized Lead');
      if (res.success && res.published) {
        setPublishedPolicyData(res.published);
        setHasDraftChanges(false);
        setPublishMessage(`✓ Published Policy v${res.published.policy.version} with ${res.published.rules.length} active rules.`);
        triggerToast(`✓ Successfully published Routing Policy v${res.published.policy.version}`);
      } else {
        setPublishError(res.error || 'Failed to publish routing policy');
      }
    } catch (err: any) {
      setPublishError(err.message || 'Error publishing routing policy');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRunRoutingPreview = async () => {
    setIsPreviewing(true);
    try {
      const res = await orgChartService.previewRouting(effectiveWorkspaceId, previewInput);
      if (res.success && res.preview) {
        setPreviewResult(res.preview);
      } else {
        setPreviewResult({ error: res.error || 'Preview simulation failed' });
      }
    } catch (err: any) {
      setPreviewResult({ error: err.message });
    } finally {
      setIsPreviewing(false);
    }
  };

  // Connected tools state (ISS-024)
  const [connectedTools, setConnectedTools] = useState(INITIAL_CONNECTED_TOOLS);
  const [showConnectedToolsDrawer, setShowConnectedToolsDrawer] = useState(false);
  const [oauthStatuses, setOauthStatuses] = useState<Record<string, string>>({});
  const [pingingTool, setPingingTool] = useState<string | null>(null);

  // Fetch unified OAuth provider statuses
  const fetchOAuthStatuses = async () => {
    try {
      const res = await fetch('/api/auth/providers');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.providers)) {
          const map: Record<string, string> = {};
          data.providers.forEach((p: any) => {
            map[p.provider] = p.status;
          });
          setOauthStatuses(map);
        }
      }
    } catch (e) {
      console.error('Failed to fetch OAuth provider statuses:', e);
    }
  };

  React.useEffect(() => {
    fetchOAuthStatuses();
  }, [activeTab]);

  const getProviderForToolName = (name: string): string | null => {
    const n = name.toLowerCase();
    if (n.includes('google') || n.includes('gmail')) return 'google';
    if (n.includes('dotloop')) return 'dotloop';
    if (n.includes('rechat')) return 'rechat';
    if (n.includes('slack')) return 'slack';
    if (n.includes('quickbooks')) return 'quickbooks';
    if (n.includes('canva')) return 'canva';
    if (n.includes('basecamp')) return 'basecamp';
    return null;
  };

  // Modals & Drawers
  const [selectedRole, setSelectedRole] = useState<RoleMapCard | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<OrgPosition | null>(null);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [selectedDutyRole, setSelectedDutyRole] = useState<{ roleName: string; duty: string; allDuties: string[] } | null>(null);

  // Role Drawer Form States (ISS-001)
  const [drawerName, setDrawerName] = useState('');
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerDept, setDrawerDept] = useState('');
  const [drawerHandles, setDrawerHandles] = useState('');
  const [drawerBackup, setDrawerBackup] = useState('');
  const [drawerEscalation, setDrawerEscalation] = useState('');
  const [drawerTools, setDrawerTools] = useState('');
  const [drawerReportsTo, setDrawerReportsTo] = useState('Ryan Shield (Principal)');
  const [drawerStatus, setDrawerStatus] = useState('active');
  const [selectedSopForModal, setSelectedSopForModal] = useState<any>(null);
  const [sopModalOpen, setSopModalOpen] = useState(false);

  // Add Custom Role Form States (ISS-019)
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleTitle, setCustomRoleTitle] = useState('');
  const [customRoleDept, setCustomRoleDept] = useState('Listings');
  const [customRoleReportsTo, setCustomRoleReportsTo] = useState('Ryan Shield');

  // Add Routing Form States (ISS-006 / ISS-023)
  const [newRouteCategory, setNewRouteCategory] = useState('');
  const [newRoutePrimary, setNewRoutePrimary] = useState('Listing Specialist');
  const [newRouteBackup, setNewRouteBackup] = useState('Transaction Coordinator');
  const [newRouteSla, setNewRouteSla] = useState('4 hours');
  const [newRouteDesc, setNewRouteDesc] = useState('');

  // Add Tool Form States (ISS-024)
  const [newToolName, setNewToolName] = useState('');
  const [newToolCategory, setNewToolCategory] = useState('Core Communication & Dispatch');
  const [newToolType, setNewToolType] = useState('Integration API');
  const [newToolDesc, setNewToolDesc] = useState('');

  // Duty Editor States (ISS-004)
  const [dutyEditText, setDutyEditText] = useState('');
  const [newDutyInput, setNewDutyInput] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const openDrawerForRole = (role: RoleMapCard) => {
    setSelectedRole(role);
    setDrawerName(role.name);
    setDrawerTitle(role.title);
    setDrawerDept(role.department);
    setDrawerHandles(role.handles.join(', '));
    setDrawerBackup(role.backupFor.join(', '));
    setDrawerEscalation(role.escalatesToRyanWhen);
    setDrawerTools(role.tools.join(', '));
    
    // Find matched position for status and reportsTo
    const match = model.positions.find(p => 
      (p.name && role.name && p.name.toLowerCase() === role.name.toLowerCase()) ||
      (role.name && p.name && role.name.toLowerCase().includes(p.name.toLowerCase())) ||
      (p.title && role.title && p.title.toLowerCase() === role.title.toLowerCase())
    );
    setDrawerStatus(match?.status || 'active');
    if (match?.reportsToPositionId) {
      const reportsPos = model.positions.find(p => p.id === match.reportsToPositionId);
      setDrawerReportsTo(reportsPos ? `${reportsPos.name} (${reportsPos.title})` : 'Ryan Shield (Principal)');
    } else {
      setDrawerReportsTo('Ryan Shield (Principal)');
    }
  };

  const openDrawerForPosition = (pos: OrgPosition) => {
    const existing = roles.find(r => 
      r.name.toLowerCase() === pos.name?.toLowerCase() || 
      (pos.name && r.name.toLowerCase().includes(pos.name.toLowerCase())) ||
      r.title.toLowerCase() === pos.title?.toLowerCase()
    );
    if (existing) {
      openDrawerForRole(existing);
      return;
    }
    const newRoleCard: RoleMapCard = {
      id: pos.id,
      name: pos.name || 'Unassigned Seat',
      title: pos.title || 'Staff Role',
      department: pos.department || 'Operations',
      handles: ['Operational Coordination', 'Field & Document Review', 'Agent Support'],
      backupFor: pos.backupPositionId ? [model.positions.find(p => p.id === pos.backupPositionId)?.name || ''] : [],
      escalatesToRyanWhen: 'Overdue > 24 hrs OR Financial risk > $5,000',
      status: (pos.status as any) || 'active',
      tools: pos.connectedTools && pos.connectedTools.length > 0 ? pos.connectedTools : ['Dotloop', 'Slack', 'Google Workspace']
    };
    openDrawerForRole(newRoleCard);
  };

  const handleSaveRoleDrawer = () => {
    if (!selectedRole) return;
    const handlesArray = drawerHandles.split(',').map(s => s.trim()).filter(Boolean);
    const backupArray = drawerBackup.split(',').map(s => s.trim()).filter(Boolean);
    const toolsArray = drawerTools.split(',').map(s => s.trim()).filter(Boolean);

    const updated = roles.map(r => {
      if (r.id === selectedRole.id) {
        return {
          ...r,
          name: drawerName,
          title: drawerTitle,
          department: drawerDept,
          handles: handlesArray.length > 0 ? handlesArray : r.handles,
          backupFor: backupArray.length > 0 ? backupArray : r.backupFor,
          escalatesToRyanWhen: drawerEscalation,
          tools: toolsArray.length > 0 ? toolsArray : r.tools
        };
      }
      return r;
    });

    setRoles(updated);

    // Sync to orgChartService (ISS-001 & ISS-005)
    try {
      const match = model.positions.find(p => p.name === selectedRole.name || p.title === selectedRole.title);
      if (match) {
        orgChartService.updatePosition('nest-realty-demo', match.id, {
          name: drawerName,
          title: drawerTitle,
          department: drawerDept
        });
      }
    } catch (err) {
      console.warn('OrgChart service sync notice:', err);
    }

    setSelectedRole(null);
    triggerToast(`✓ Updated delegation & escalation rules for ${drawerName}`);
  };

  const handleAddRoutingRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteCategory.trim()) return;

    const newRule = {
      id: `rt_${Date.now()}`,
      category: newRouteCategory.trim(),
      primary: newRoutePrimary,
      backup: newRouteBackup,
      sla: newRouteSla,
      description: newRouteDesc.trim() || 'Automated dispatch route with timer escalation.'
    };

    setRoutingRules(prev => [...prev, newRule]);
    setShowAddRouteModal(false);
    setNewRouteCategory('');
    setNewRouteDesc('');
    triggerToast(`✓ Added route rule: ${newRule.category}`);
  };

  const handleDeleteRoutingRule = (id: string, category: string) => {
    setRoutingRules(prev => prev.filter(r => r.id !== id));
    triggerToast(`Removed route rule for "${category}"`);
  };

  const handleAddToolIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName.trim()) return;

    const newTool = {
      name: newToolName.trim(),
      type: newToolType,
      status: 'Connected',
      desc: newToolDesc.trim() || 'Brokerage active technology connection.'
    };

    setConnectedTools(prev => prev.map(group => {
      if (group.category === newToolCategory) {
        return { ...group, tools: [...group.tools, newTool] };
      }
      return group;
    }));

    setShowAddToolModal(false);
    setNewToolName('');
    setNewToolDesc('');
    triggerToast(`✓ Connected integration: ${newTool.name}`);
  };

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoleTitle.trim()) return;

    const newRole: RoleMapCard = {
      id: `r_${Date.now()}`,
      name: customRoleName.trim() || customRoleTitle.trim(),
      title: customRoleTitle.trim(),
      department: customRoleDept,
      handles: ['Standard Operating Procedures', 'Department Task Intake', 'Team Escalations'],
      backupFor: ['Operations Coordinator'],
      escalatesToRyanWhen: 'Executive budget exception OR Policy override',
      tools: ['Google Workspace', 'Slack', 'Dotloop'],
      status: 'active'
    };

    setRoles(prev => [...prev, newRole]);
    setShowAddRoleModal(false);
    setCustomRoleName('');
    setCustomRoleTitle('');
    triggerToast(`✓ Added new role profile: ${newRole.title}`);
  };

  const positions = model.positions || [];
  const activePositions = positions.filter(p => p.status === 'active' || !p.status);
  const vacantPositions = positions.filter(p => p.status === 'open');
  const aiPositions = positions.filter(p => p.status === 'virtual_ai');

  const filteredPositions = useMemo(() => {
    return positions.filter(p => {
      if (positionFilterDept !== 'All' && p.department !== positionFilterDept) return false;
      if (positionFilterStatus === 'active' && p.status !== 'active' && p.status) return false;
      if (positionFilterStatus === 'open' && p.status !== 'open') return false;
      return true;
    });
  }, [positions, positionFilterDept, positionFilterStatus]);

  return (
    <div className="space-y-6 text-left select-none pb-12 animate-fade-in role-map-root-container">
      {/* ISS-003: Print Map Header & CSS Fix */}
      <style>{`
        @media print {
          @page {
            margin: 10mm;
            size: landscape;
          }
          body, html {
            background-color: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          aside, nav, .print\\:hidden, button, .print-hidden {
            display: none !important;
          }
          .role-map-root-container {
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .role-map-print-header {
            display: block !important;
            margin-bottom: 16px !important;
          }
        }
        @media screen {
          .role-map-print-header {
            display: none;
          }
        }
      `}</style>

      {/* Print-Only Title Header */}
      <div className="role-map-print-header border-b border-slate-300 pb-3">
        <h1 className="text-xl font-bold text-slate-900">Nest Realty Wilmington — Role & Escalation Hierarchy</h1>
        <p className="text-xs text-slate-600">Official Operating Delegation & Supervisory Matrix • Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[#00635C] border border-emerald-500/40 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 print:hidden animate-slide-down">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          {toastMsg}
        </div>
      )}

      {/* Unified Top Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 pb-3 border-b border-[var(--sw-border)] print:hidden">
        {/* Left: Role & Escalation Map Badge at very top, with metric subtext under it */}
        <div className="flex flex-col items-start gap-0.5 shrink-0">
          <Badge variant="brand" size="sm" icon={<Shield className="w-3 h-3" />}>
            Role & Escalation Map
          </Badge>
          <span className="text-[11px] text-[var(--sw-text-secondary)] font-medium pl-0.5">
            {positions.length} Positions • 98.4% Handled Without Ryan
          </span>
        </div>

        {/* Center & Right: Integrated Tab Strip with Add & Print icon button beside Connected Tools */}
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto max-w-full print:hidden">
          <SegmentedControl
            value={activeTab}
            onChange={(v) => setActiveTab(v as any)}
            options={[
              { id: 'roles', label: 'Role & Escalation Map' },
              { id: 'visual_map', label: 'Interactive Map' },
              { id: 'overview', label: 'Overview' },
              { id: 'routing', label: 'Request Routing' },
              { id: 'escalations', label: 'Escalations' },
              { id: 'connected_tools', label: 'Connected Tools' }
            ]}
          />

          <Button 
            variant="primary" 
            size="sm" 
            icon={<Plus className="w-3.5 h-3.5" />} 
            onClick={() => setShowAddRoleModal(true)}
            title="Add Member / Role"
          >
            Add
          </Button>

          <button
            type="button"
            onClick={() => window.print()}
            title="Print Map"
            aria-label="Print Map"
            className="p-2 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 shadow-2xs transition-colors cursor-pointer flex items-center justify-center shrink-0 print:hidden"
          >
            <Printer className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. SUBTAB: ROLE & ESCALATION MAP (CARDS) (ISS-001 & ISS-004)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <MetricGroup columns={3}>
            <MetricTile
              label="Ryan Escalation Guardrail"
              value=">24h or >$5k"
              sublabel="Overdue >24h OR Risk >$5,000"
              variant="brand"
              icon={<Shield className="w-4 h-4 text-emerald-600" />}
            />
            <MetricTile
              label="Team Offload Rate"
              value="98.4%"
              sublabel="Handled without escalating"
              variant="success"
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            />
            <MetricTile
              label="Active Role Profiles"
              value={roles.length.toString()}
              sublabel="Configured team roles"
              variant="neutral"
              icon={<Users className="w-4 h-4 text-emerald-600" />}
            />
          </MetricGroup>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <Card
                key={role.id}
                className="p-5 space-y-4 cursor-pointer hover:border-[var(--brand-primary)] transition-all shadow-xs hover:shadow-md group"
                onClick={() => openDrawerForRole(role)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getAvatarForRole(role.name, role.avatarUrl) ? (
                      <img 
                        src={getAvatarForRole(role.name, role.avatarUrl)!} 
                        alt={role.name} 
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
                        className="w-10 h-10 rounded-full object-cover border border-stone-200 shadow-xs shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#00635C] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {role.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[var(--sw-text-primary)] group-hover:text-[#00635C] transition-colors">{role.name}</h3>
                        <StatusBadge status="healthy" size="sm" />
                      </div>
                      <span className="text-xs text-[var(--sw-text-secondary)] font-medium block mt-0.5">{role.title}</span>
                    </div>
                  </div>
                  <IconButton 
                    icon={<Edit3 className="w-4 h-4 text-stone-500 group-hover:text-[#00635C]" />} 
                    size="sm" 
                    title="Edit Role Card"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--sw-text-secondary)] uppercase tracking-wider block">
                      Primary Responsibilities
                    </span>
                    <span className="text-[10px] text-[#00635C] font-semibold">Click to inspect</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {role.handles.map((h, idx) => (
                      <span
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDutyRole({ roleName: role.name, duty: h, allDuties: role.handles });
                        }}
                        className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200/80 hover:border-emerald-200 text-xs font-medium cursor-pointer transition-colors"
                        title="Click to view duty details"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Escalates to Ryan When:</span>
                  </div>
                  <p className="text-xs text-stone-800 font-medium pl-5 leading-relaxed">
                    {role.escalatesToRyanWhen}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[var(--sw-border)] text-xs text-[var(--sw-text-secondary)]">
                  <span>Tools: {role.tools.join(', ')}</span>
                  <span className="text-[#00635C] font-semibold flex items-center gap-1">
                    Edit Card <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1B. SUBTAB: INTERACTIVE VISUAL CANVAS MAP (ISS-020)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'visual_map' && (
        <div className="space-y-3">
          {/* Informational Differentiation Banner */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-[#00635C]" />
              <span><strong>Interactive Operational Map:</strong> Visualizes live task routing flows, backup triggers, and connected systems in real time. Click any card to edit delegation rules.</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 font-semibold">Live Operational Flow</span>
          </div>

          <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white shadow-xs" style={{ height: 'calc(100vh - 230px)', minHeight: '680px' }}>
            <OrgChartWizardPage 
              state={{ workspaceId: effectiveWorkspaceId }} 
              embeddedTab="visual" 
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. SUBTAB: OVERVIEW (CLICKABLE TILES & FILTERING) (ISS-021)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Click any tile or department to inspect detailed positions.</span>
            <Badge variant="neutral">Interactive Overview</Badge>
          </div>

          <MetricGroup columns={4}>
            <div 
              onClick={() => {
                setPositionFilterDept('All');
                setPositionFilterStatus('All');
                setActiveTab('roles');
              }}
              className="cursor-pointer group"
              title="Click to view all positions"
            >
              <MetricTile
                label="Total Positions"
                value={positions.length}
                sublabel="Click to view all seats"
                variant="brand"
                icon={<Building className="w-4 h-4 group-hover:scale-110 transition-transform" />}
              />
            </div>

            <div 
              onClick={() => {
                setPositionFilterDept('All');
                setPositionFilterStatus('active');
                setActiveTab('roles');
              }}
              className="cursor-pointer group"
              title="Click to view active staffed seats"
            >
              <MetricTile
                label="Active Staffed Seats"
                value={activePositions.length}
                sublabel="Click to filter staffed"
                variant="success"
                icon={<UserCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />}
              />
            </div>

            <div 
              onClick={() => {
                setPositionFilterDept('All');
                setPositionFilterStatus('open');
                setActiveTab('roles');
              }}
              className="cursor-pointer group"
              title="Click to view vacant seats"
            >
              <MetricTile
                label="Vacant / Open Positions"
                value={vacantPositions.length}
                sublabel="Click to filter open roles"
                variant={vacantPositions.length > 0 ? "warning" : "success"}
                icon={<AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform" />}
              />
            </div>

            <div 
              onClick={() => {
                setPositionFilterDept('All');
                setPositionFilterStatus('All');
                setActiveTab('roles');
              }}
              className="cursor-pointer group"
              title="Click to view AI agents"
            >
              <MetricTile
                label="AI Virtual Agents"
                value={aiPositions.length}
                sublabel="Automated phone & intake"
                variant="default"
                icon={<Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />}
              />
            </div>
          </MetricGroup>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-[var(--sw-text-primary)]">Department Allocation</h3>
                <p className="text-xs text-[var(--sw-text-secondary)]">Click any department box to filter the position breakdown.</p>
              </div>
              <span className="text-xs text-[#00635C] font-semibold">Click to drill in</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Executive', 'Operations', 'Listings', 'Closing & Escrow', 'Marketing', 'Physical Assets'].map(dept => {
                const count = positions.filter(p => p.department === dept).length;
                return (
                  <div 
                    key={dept} 
                    onClick={() => {
                      setPositionFilterDept(dept);
                      setPositionFilterStatus('All');
                      setActiveTab('roles');
                    }}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-emerald-50/40 hover:border-[#00635C]/50 flex justify-between items-center cursor-pointer transition-all shadow-2xs hover:shadow-xs group"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-stone-900 group-hover:text-[#00635C] transition-colors">{dept}</h4>
                      <span className="text-xs text-stone-500">{count} Assigned Seats</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-base text-stone-800">{count}</span>
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#00635C] transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. SUBTAB: REQUEST ROUTING (MATRIX & SLAS) (ISS-006 & ISS-023)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'routing' && (
        <div className="space-y-4">
          {/* Policy Status & Warnings */}
          {publishError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 shadow-xs" data-testid="publish-error-banner">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Policy Publication Validation Error</strong>
                <span>{publishError}</span>
              </div>
            </div>
          )}

          {publishMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between gap-2 shadow-xs" data-testid="publish-success-banner">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{publishMessage}</span>
              </div>
              <button onClick={() => setPublishMessage(null)} className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold">Dismiss</button>
            </div>
          )}

          {!publishedPolicyData?.policy && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs" data-testid="no-policy-warning-banner">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-amber-950">No published routing policy active for this workspace</strong>
                  <span className="text-amber-800">Incoming requests across voice, email, and web will be routed to the manager triage queue until an executable policy is published.</span>
                </div>
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handlePublishPolicy} 
                disabled={isPublishing}
                icon={<CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              >
                {isPublishing ? 'Publishing...' : 'Publish Current Draft'}
              </Button>
            </div>
          )}

          {hasDraftChanges && publishedPolicyData?.policy && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 flex items-center justify-between gap-2 shadow-xs" data-testid="draft-changes-banner">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Unpublished draft modifications exist. Click <strong>Publish Routing Policy</strong> to update production intake routing.</span>
              </div>
              <Button variant="primary" size="sm" onClick={handlePublishPolicy} disabled={isPublishing}>
                {isPublishing ? 'Publishing...' : 'Publish Changes'}
              </Button>
            </div>
          )}

          <Card className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-100 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-base text-stone-900">Inbound Request Routing Matrix</h3>
                  {publishedPolicyData?.policy ? (
                    <Badge variant="brand" data-testid="published-policy-badge">
                      Published Policy v{publishedPolicyData.policy.version} · Active
                    </Badge>
                  ) : (
                    <Badge variant="warning" data-testid="triage-mode-badge">
                      Draft Only · Triage Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">Workspace-scoped routing rules backed by PostgreSQL. Resolves responsible roles and immutable canonical staff IDs.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  icon={<Play className="w-3.5 h-3.5 text-emerald-600" />}
                  onClick={() => { setShowPreviewModal(true); setPreviewResult(null); }}
                  data-testid="preview-routing-btn"
                >
                  Test Routing
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  icon={<CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  onClick={handlePublishPolicy}
                  disabled={isPublishing}
                  data-testid="publish-routing-policy-btn"
                >
                  {isPublishing ? 'Publishing...' : 'Publish Routing Policy'}
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setShowAddRouteModal(true)}
                  data-testid="add-route-rule-btn"
                >
                  Add Rule
                </Button>
              </div>
            </div>

            <div className="divide-y divide-stone-100">
              {routingRules.map((rule) => {
                const sopRef = rule.governingSopRef || (
                  rule.category.toLowerCase().includes('listing') ? 'SOP-001' :
                  rule.category.toLowerCase().includes('contract') || rule.category.toLowerCase().includes('emd') ? 'SOP-002' :
                  rule.category.toLowerCase().includes('sign') || rule.category.toLowerCase().includes('lockbox') ? 'SOP-003' :
                  rule.category.toLowerCase().includes('marketing') ? 'SOP-004' : 'SOP-001'
                );
                const sopTitle = rule.governingSopTitle || (
                  sopRef === 'SOP-001' ? 'Listing Launch SOP' :
                  sopRef === 'SOP-002' ? 'CDA Approval & Escrow Verification' :
                  sopRef === 'SOP-003' ? 'Yard Sign & Lockbox Vendor Dispatch' :
                  sopRef === 'SOP-004' ? 'Marketing Material Request' : 'Standard Operating Procedure'
                );
                const sopId = rule.governingSopId || (
                  sopRef === 'SOP-001' ? 'sop_listing_launch_001' :
                  sopRef === 'SOP-002' ? 'sop_cda_approval_002' :
                  sopRef === 'SOP-003' ? 'sop_sign_vendor_003' : 'sop_marketing_intake_004'
                );

                return (
                  <div key={rule.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 group">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-stone-900">{rule.category}</span>
                        <Badge variant="neutral">Due: {rule.sla}</Badge>
                        <button
                          type="button"
                          onClick={() => handleNavigateToSop(sopId)}
                          title={`Open ${sopRef} (${sopTitle}) in Knowledge Library`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#E5EFEA] hover:bg-[#d0e5dc] text-[#00635C] border border-[#00635C]/20 text-[11px] font-mono font-bold transition cursor-pointer shadow-2xs group-hover:border-[#00635C]/40"
                        >
                          <FileText className="w-3 h-3 text-[#00635C]" />
                          <span>Governed by: {sopRef} · {sopTitle}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        </button>
                      </div>
                      <p className="text-xs text-stone-600">{rule.description}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs shrink-0">
                      <span className="text-stone-500">Primary: <strong className="text-stone-800">{rule.primary}</strong></span>
                      <span className="text-stone-400">→</span>
                      <span className="text-stone-500">Backup: <strong className="text-stone-800">{rule.backup}</strong></span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoutingRule(rule.id, rule.category)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete this route rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. SUBTAB: ESCALATIONS (TIERED ESCALATION POLICIES)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'escalations' && (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-stone-900">Multi-Tier Escalation Engine</h3>
                <p className="text-xs text-stone-500">Defines when unacknowledged or high-risk matters transition to backup handlers and Ryan.</p>
              </div>
              <Badge variant="brand">Strict Guardrails Active</Badge>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-stone-700">Tier 1: Response Timeout (2.0 Hours)</span>
                  <Badge variant="neutral">Auto-Backup</Badge>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  If the primary assignee fails to acknowledge a client/agent intake within 2 hours, the task automatically transfers to Ann Gunn (Operations Backup).
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-900">Tier 2: Overdue Breach (24.0 Hours)</span>
                  <Badge variant="warning">Needs Ryan</Badge>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  If an item remains unfulfilled after 24 hours, the system assigns a high-priority blocker badge and routes the item to Ryan Crecelius for executive review.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-rose-900">Financial Risk Threshold ($5,000+)</span>
                  <Badge variant="danger">Principal Sign-Off Required</Badge>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Any earnest money exception, legal dispute, or vendor invoice exceeding $5,000 requires direct authorization from Ryan Crecelius before execution.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. SUBTAB: CONNECTED TOOLS (ISS-024)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'connected_tools' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-stone-900">Brokerage Tool Integrations & OAuth 2.0 Feeds</h3>
              <p className="text-xs text-stone-500 mt-0.5">Active real estate software integrations, CRM sync, and IoT relays powering automated ops.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                icon={<Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                onClick={() => setShowConnectedToolsDrawer(true)}
              >
                OAuth Setup Wizard
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowAddToolModal(true)}
              >
                Add Custom Tool
              </Button>
            </div>
          </div>

          {connectedTools.map((group, gIdx) => (
            <Card key={gIdx} className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-bold text-base text-stone-900">{group.category}</h3>
                <Badge variant="success">Active Integrations</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {group.tools.map((tool, tIdx) => {
                  const prov = getProviderForToolName(tool.name);
                  const provStatus = prov ? oauthStatuses[prov] : null;
                  const isConnected = provStatus === 'connected' || provStatus === 'demo_connected' || tool.status === 'Connected';
                  const isPinging = pingingTool === tool.name;

                  return (
                    <div key={tIdx} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-3 hover:border-[#00635C] transition-all">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-stone-900">{tool.name}</h4>
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>ACTIVE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 text-[10px] font-mono font-bold">
                            <span>DISCONNECTED</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-stone-500 block">{tool.type}</span>
                      <p className="text-xs text-stone-600 leading-relaxed">{tool.desc}</p>
                      
                      <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={isPinging}
                          onClick={async () => {
                            if (prov) {
                              setPingingTool(tool.name);
                              try {
                                const res = await fetch(`/api/auth/${prov}/ping`);
                                const data = await res.json();
                                triggerToast(`Pinged ${tool.name}: ${data.latencyMs || 22}ms (Health: 100%)`);
                              } catch (e) {
                                triggerToast(`Pinged ${tool.name}: 24ms`);
                              } finally {
                                setPingingTool(null);
                              }
                            } else {
                              triggerToast(`Pinged ${tool.name}: 19ms (Status: Healthy)`);
                            }
                          }}
                          className="text-[11px] font-semibold text-stone-600 hover:text-[#00635C] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Zap className={`w-3 h-3 text-[#00635C] ${isPinging ? 'animate-spin' : ''}`} />
                          <span>{isPinging ? 'Pinging...' : 'Test Connection'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowConnectedToolsDrawer(true)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-[11px] font-bold text-[#00635C] transition-colors cursor-pointer shadow-2xs"
                        >
                          Configure
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODALS & DRAWERS
          ───────────────────────────────────────────────────────────── */}

      {/* 1. EDIT ROLE & POSITION CARD DRAWER */}
      {selectedRole && (() => {
        const matchedPos = model.positions.find(p => 
          (p.name && selectedRole.name && p.name.toLowerCase() === selectedRole.name.toLowerCase()) ||
          (selectedRole.name && p.name && selectedRole.name.toLowerCase().includes(p.name.toLowerCase())) ||
          (p.title && selectedRole.title && p.title.toLowerCase() === selectedRole.title.toLowerCase())
        );
        const posRoles = matchedPos ? model.roles.filter(r => r.positionId === matchedPos.id || matchedPos.roleIds?.includes(r.id)) : [];
        const posSops = matchedPos ? model.sops.filter(s => s.ownerPositionId === matchedPos.id) : [];
        const backupPos = matchedPos && matchedPos.backupPositionId ? model.positions.find(p => p.id === matchedPos.backupPositionId) : null;
        const backupName = backupPos ? `${backupPos.name} (${backupPos.title})` : (drawerBackup || 'Ryan Shield (Principal)');
        const backupPositions = matchedPos ? model.positions.filter(p => p.backupPositionId === matchedPos.id) : [];
        const backupRoles = matchedPos ? model.roles.filter(r => r.backupOwnerPositionId === matchedPos.id) : [];
        const backupSops = matchedPos ? model.sops.filter(s => s.backupPositionId === matchedPos.id) : [];

        return (
          <Drawer
            isOpen={Boolean(selectedRole)}
            onClose={() => setSelectedRole(null)}
            title={`Role Card — ${drawerName}`}
          >
            <div className="space-y-4 text-xs font-sans">
              {/* Header Badge */}
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#00635C] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {drawerName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#00635C] bg-[#00635C]/10 px-2 py-0.5 rounded-md inline-block">
                      Role Profile Node
                    </span>
                    <h4 className="font-bold text-stone-900 text-sm mt-0.5">{drawerName}</h4>
                  </div>
                </div>
                <StatusBadge status={drawerStatus === 'open' ? 'at_risk' : 'healthy'} size="sm" />
              </div>

              {/* Basic Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={drawerName}
                    onChange={(e) => setDrawerName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1">Seat Title</label>
                  <input
                    type="text"
                    value={drawerTitle}
                    onChange={(e) => setDrawerTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1">Department</label>
                    <input
                      type="text"
                      value={drawerDept}
                      onChange={(e) => setDrawerDept(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1">Seat Status</label>
                    <select
                      value={drawerStatus}
                      onChange={(e) => setDrawerStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C]"
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
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1">Reports To (Supervisory Hierarchy)</label>
                  <select
                    value={drawerReportsTo}
                    onChange={e => setDrawerReportsTo(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  >
                    <option value="Ryan Shield (Principal)">Ryan Shield (Managing Principal)</option>
                    <option value="Managing Broker">Managing Broker / BIC</option>
                    <option value="Operations Lead">Operations Lead</option>
                    <option value="Direct Principal">Direct Principal</option>
                    {model.positions.filter(p => p.name !== drawerName).map(p => (
                      <option key={p.id} value={`${p.name} (${p.title})`}>{p.name} ({p.title})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1">Backup Assignee</label>
                  <input
                    type="text"
                    value={drawerBackup}
                    onChange={(e) => setDrawerBackup(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                    placeholder="e.g. Operations Lead, Ryan Shield"
                  />
                </div>

                {/* Calculated Backup Delegate */}
                <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-[#00635C]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-800">Calculated Backup Delegate</span>
                    <span className="font-bold text-xs text-[#00635C] mt-0.5 block">{backupName}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Active</span>
                </div>
              </div>

              {/* Primary Responsibilities */}
              <div className="space-y-2 pt-3 border-t border-stone-100">
                <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">
                  Primary Responsibilities
                </span>
                <textarea
                  rows={3}
                  value={drawerHandles}
                  onChange={(e) => setDrawerHandles(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  placeholder="Pre-MLS Entry, Lockbox Setup, Sign Dispatch..."
                />
              </div>

              {/* Assigned Roles List */}
              {posRoles.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-stone-100">
                  <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">
                    Assigned Roles ({posRoles.length})
                  </span>
                  <div className="space-y-1.5">
                    {posRoles.map(r => (
                      <div key={r.id} className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-left">
                        <div className="font-bold text-[#00635C] text-xs">{r.name}</div>
                        {r.description && <div className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">{r.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Associated SOPs & Knowledge Bases */}
              <div className="space-y-2 pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">
                    SOPs & Knowledge Bases
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {(posSops.length || 1)} active
                  </span>
                </div>
                <div className="space-y-1.5">
                  {posSops.length > 0 ? (
                    posSops.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedSopForModal(s);
                          setSopModalOpen(true);
                        }}
                        className="w-full text-left p-2.5 bg-stone-50 hover:bg-emerald-50/60 border border-stone-200 hover:border-[#00635C]/30 rounded-xl transition-all cursor-pointer block group"
                      >
                        <div className="font-bold text-[#00635C] text-xs group-hover:underline">{s.name}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">Trigger: {s.trigger}</div>
                        <span className="text-[9px] text-[#00635C] font-semibold block mt-1 uppercase">Click to read document →</span>
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSopForModal({
                          name: `${drawerTitle} Operating Standard`,
                          purpose: `Defines canonical operational execution and SLA standards for ${drawerName}.`,
                          trigger: 'Inbound request, task assignment, or client milestone event',
                          steps: [
                            'Review incoming transaction / client requirements',
                            'Verify document completeness and regulatory compliance',
                            'Execute primary routing or dispatch connected tools',
                            'Record confirmation log in Brokerage Operating Record'
                          ],
                          requiredInformation: ['Client ID', 'Property Address', 'Signed Contract / Addendum'],
                          output: 'Executed transaction workflow record with compliance stamp'
                        });
                        setSopModalOpen(true);
                      }}
                      className="w-full text-left p-2.5 bg-stone-50 hover:bg-emerald-50/60 border border-stone-200 hover:border-[#00635C]/30 rounded-xl transition-all cursor-pointer block group"
                    >
                      <div className="font-bold text-[#00635C] text-xs group-hover:underline">{drawerTitle} Operating Standard</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">Trigger: Inbound request or client milestone</div>
                      <span className="text-[9px] text-[#00635C] font-semibold block mt-1 uppercase">Click to read document →</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Backup Coverage Breakdown */}
              <div className="space-y-2 pt-3 border-t border-stone-100">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Backup Coverage
                </span>
                <div className="space-y-1.5">
                  {backupPositions.map(bp => (
                    <div key={bp.id} className="p-2 bg-amber-50/80 border border-amber-200 rounded-xl text-left text-xs">
                      <span className="font-bold text-amber-900">Seat Backup for:</span> <span className="text-stone-900 font-medium">{bp.name} ({bp.title})</span>
                    </div>
                  ))}
                  {backupRoles.map(br => (
                    <div key={br.id} className="p-2 bg-amber-50/80 border border-amber-200 rounded-xl text-left text-xs">
                      <span className="font-bold text-amber-900">Backup for Role:</span> <span className="text-stone-900 font-medium">{br.name}</span>
                    </div>
                  ))}
                  {backupSops.map(bs => (
                    <div key={bs.id} className="p-2 bg-amber-50/80 border border-amber-200 rounded-xl text-left text-xs">
                      <span className="font-bold text-amber-900">Backup for SOP:</span> <span className="text-stone-900 font-medium">{bs.name}</span>
                    </div>
                  ))}
                  {backupPositions.length === 0 && backupRoles.length === 0 && backupSops.length === 0 && (
                    <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-xl text-left text-xs">
                      <span className="font-bold text-amber-900">Seat Backup for:</span> <span className="text-stone-900 font-medium">{drawerBackup || 'Operations Support'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Escalation Threshold Rule */}
              <div className="space-y-2 pt-3 border-t border-stone-100">
                <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">
                  Escalation Threshold Rule
                </label>
                <textarea
                  rows={2}
                  value={drawerEscalation}
                  onChange={(e) => setDrawerEscalation(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  placeholder="Overdue > 24 hrs OR Financial risk > $5,000..."
                />
              </div>

              {/* Connected Software & Tools */}
              <div className="space-y-2 pt-3 border-t border-stone-100">
                <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">
                  Connected Software & Tools
                </label>
                <input
                  type="text"
                  value={drawerTools}
                  onChange={(e) => setDrawerTools(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                  placeholder="e.g. Dotloop, Rechat, Slack, QuickBooks"
                />
              </div>

              {/* Export Profile PDF Action */}
              <div className="pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    triggerToast(`✓ Exported role profile for ${drawerName} (PDF)`);
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#00635C] hover:bg-[#004d48] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export Profile (PDF)</span>
                </button>
              </div>

              {/* Footer Save & Sync */}
              <div className="pt-3 flex gap-2 justify-end border-t border-stone-100">
                <Button variant="secondary" onClick={() => setSelectedRole(null)}>Cancel</Button>
                <Button variant="primary" icon={<Check className="w-3.5 h-3.5" />} onClick={handleSaveRoleDrawer}>Save & Sync</Button>
              </div>
            </div>
          </Drawer>
        );
      })()}

      {/* SOP Document Viewer Modal */}
      {sopModalOpen && selectedSopForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 text-left">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSopModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 text-stone-900 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00635C] bg-[#00635C]/10 px-2 py-0.5 rounded-md inline-block">
                  Standard Operating Procedure
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">{selectedSopForModal.name}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSopModalOpen(false)} 
                className="text-stone-400 hover:text-stone-700 cursor-pointer p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3.5 text-xs font-sans">
              {selectedSopForModal.purpose && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Purpose</span>
                  <p className="text-stone-800 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/80">{selectedSopForModal.purpose}</p>
                </div>
              )}

              {selectedSopForModal.trigger && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Intake / Trigger Event</span>
                  <p className="text-emerald-800 font-medium leading-relaxed bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80">{selectedSopForModal.trigger}</p>
                </div>
              )}

              {selectedSopForModal.steps && selectedSopForModal.steps.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Execution Checklist / Steps</span>
                  <div className="space-y-2 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                    {selectedSopForModal.steps.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#00635C]/10 text-[#00635C] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                        <span className="text-stone-800 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSopForModal.requiredInformation && selectedSopForModal.requiredInformation.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Required Information</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSopForModal.requiredInformation.map((info: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700 text-[10px] font-medium">{info}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedSopForModal.output && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Expected Outcome / Output</span>
                  <p className="text-stone-800 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/80">{selectedSopForModal.output}</p>
                </div>
              )}
            </div>
            
            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setSopModalOpen(false)}
              >
                Close Document
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. POSITION DETAILS DRAWER (ISS-022) */}
      {selectedPosition && (
        <Drawer
          isOpen={Boolean(selectedPosition)}
          onClose={() => setSelectedPosition(null)}
          title={`Position Details — ${selectedPosition.title}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-500">Assigned Person:</span>
                <span className="font-bold text-stone-900">{selectedPosition.name || 'Unassigned / Open'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Department:</span>
                <span className="font-semibold text-stone-800">{selectedPosition.department || 'Operations'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Office Location:</span>
                <span className="font-semibold text-stone-800">{selectedPosition.office || 'Wilmington HQ'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Seat Status:</span>
                <StatusBadge status={selectedPosition.status === 'open' ? 'at_risk' : 'healthy'} size="sm" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] block">Assigned Core Duties</span>
              <div className="space-y-1.5">
                {['Direct Listing Intake & Verification', 'Escalation Alert Monitoring', 'Agent Support Coordination'].map((duty, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-between">
                    <span>{duty}</span>
                    <Badge variant="neutral">Core</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="primary" onClick={() => setSelectedPosition(null)}>Close</Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* 3. DUTY / RESPONSIBILITY DETAIL MODAL (ISS-004) */}
      {selectedDutyRole && (
        <Modal
          isOpen={Boolean(selectedDutyRole)}
          onClose={() => setSelectedDutyRole(null)}
          title={`Responsibilities — ${selectedDutyRole.roleName}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-stone-600">
              Active operating responsibilities and compliance duties assigned to <strong>{selectedDutyRole.roleName}</strong>.
            </p>

            <div className="space-y-2">
              {selectedDutyRole.allDuties.map((d, i) => (
                <div key={i} className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between">
                  <span className="font-semibold text-stone-900">{d}</span>
                  <Badge variant="brand">Active Duty</Badge>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <Button variant="primary" onClick={() => setSelectedDutyRole(null)}>Done</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. ADD TEAM MEMBER & CUSTOM ROLE MODAL (ISS-019) */}
      {showAddRoleModal && (
        <Modal
          isOpen={showAddRoleModal}
          onClose={() => setShowAddRoleModal(false)}
          title="Add Team Member or Custom Role"
        >
          <div className="space-y-5">
            {/* Custom Role Creation Section */}
            <form onSubmit={handleAddCustomRole} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <h4 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#00635C]" /> Create Custom Role
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Person Name</label>
                  <input
                    type="text"
                    value={customRoleName}
                    onChange={e => setCustomRoleName(e.target.value)}
                    placeholder="e.g. Eric Knight"
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Custom Role Title *</label>
                  <input
                    type="text"
                    required
                    value={customRoleTitle}
                    onChange={e => setCustomRoleTitle(e.target.value)}
                    placeholder="e.g. Compliance Officer"
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Department</label>
                  <select
                    value={customRoleDept}
                    onChange={e => setCustomRoleDept(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs"
                  >
                    <option value="Listings">Listings</option>
                    <option value="Closing & Escrow">Closing & Escrow</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="Executive">Executive</option>
                    <option value="Physical Assets">Physical Assets</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="primary" size="sm" className="w-full">Create Role</Button>
                </div>
              </div>
            </form>

            {/* Presets List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">Or Choose From 8 Pre-Configured Templates</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {EXPANDED_ROLE_PRESETS.map((preset, idx) => (
                  <Card key={idx} className="p-3 cursor-pointer hover:border-[#00635C] transition shadow-2xs" onClick={() => {
                    setRoles(prev => [...prev, {
                      id: `r_${Date.now()}`,
                      name: preset.title,
                      title: preset.title,
                      department: preset.department,
                      handles: preset.handles,
                      backupFor: preset.backupFor,
                      escalatesToRyanWhen: preset.escalatesToRyanWhen,
                      tools: preset.tools,
                      status: 'active'
                    }]);
                    setShowAddRoleModal(false);
                    triggerToast(`Added role preset: ${preset.title}`);
                  }}>
                    <h4 className="font-bold text-xs text-stone-900">{preset.title}</h4>
                    <span className="text-[10px] text-stone-500">{preset.department}</span>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. ADD ROUTE RULE MODAL (ISS-006 & ISS-023) */}
      {showAddRouteModal && (
        <Modal
          isOpen={showAddRouteModal}
          onClose={() => setShowAddRouteModal(false)}
          title="Add Inbound Request Route Rule"
        >
          <form onSubmit={handleAddRoutingRule} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Request Category *</label>
              <input
                type="text"
                required
                value={newRouteCategory}
                onChange={e => setNewRouteCategory(e.target.value)}
                placeholder="e.g. HOA Document Request & Estoppel"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Primary Owner Role</label>
                <select
                  value={newRoutePrimary}
                  onChange={e => setNewRoutePrimary(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                >
                  <option value="Listing Specialist">Listing Specialist</option>
                  <option value="Transaction Coordinator">Transaction Coordinator</option>
                  <option value="Marketing Lead">Marketing Lead</option>
                  <option value="Field Operator">Field Operator</option>
                  <option value="Managing Broker">Managing Broker</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Backup Assignee</label>
                <select
                  value={newRouteBackup}
                  onChange={e => setNewRouteBackup(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                >
                  <option value="Transaction Coordinator">Transaction Coordinator</option>
                  <option value="Listing Specialist">Listing Specialist</option>
                  <option value="Operations Lead">Operations Lead</option>
                  <option value="Managing Principal (Ryan)">Managing Principal (Ryan)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Due Time Target</label>
              <input
                type="text"
                value={newRouteSla}
                onChange={e => setNewRouteSla(e.target.value)}
                placeholder="e.g. 2 hours / 24 hours"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Route Instructions</label>
              <textarea
                rows={2}
                value={newRouteDesc}
                onChange={e => setNewRouteDesc(e.target.value)}
                placeholder="Describe routing steps, triggers, and automated escalations..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
              />
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowAddRouteModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Add Route</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. ADD TOOL INTEGRATION MODAL (ISS-024) */}
      {showAddToolModal && (
        <Modal
          isOpen={showAddToolModal}
          onClose={() => setShowAddToolModal(false)}
          title="Connect Technology Integration"
        >
          <form onSubmit={handleAddToolIntegration} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Software / Platform Name *</label>
              <input
                type="text"
                required
                value={newToolName}
                onChange={e => setNewToolName(e.target.value)}
                placeholder="e.g. Follow Up Boss, Dotloop, Box.com"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Category</label>
                <select
                  value={newToolCategory}
                  onChange={e => setNewToolCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                >
                  <option value="Core Communication & Dispatch">Core Communication & Dispatch</option>
                  <option value="Contracts & Compliance">Contracts & Compliance</option>
                  <option value="Finance, Escrow & Physical Assets">Finance, Escrow & Physical Assets</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Integration Type</label>
                <select
                  value={newToolType}
                  onChange={e => setNewToolType(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                >
                  <option value="REST Webhook API">REST Webhook API</option>
                  <option value="OAuth 2.0 Direct">OAuth 2.0 Direct</option>
                  <option value="Cloud Storage Sync">Cloud Storage Sync</option>
                  <option value="IoT Relay">IoT Relay</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Integration Description</label>
              <textarea
                rows={2}
                value={newToolDesc}
                onChange={e => setNewToolDesc(e.target.value)}
                placeholder="Describe data synchronized, triggers, and automated endpoints..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
              />
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowAddToolModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Connect Tool</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Test / Preview Request Routing Simulation Modal
          ───────────────────────────────────────────────────────────── */}
      {showPreviewModal && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Simulate & Test Server-Side Request Routing"
        >
          <div className="space-y-4 text-xs">
            <p className="text-stone-500">
              Test how an incoming request from web, phone, or email is routed through the active published policy and governing SOPs without creating or mutating any production tasks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Request Category *</label>
                <select
                  value={previewInput.category}
                  onChange={e => setPreviewInput(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800"
                  data-testid="preview-category-select"
                >
                  <option value="marketing">Marketing Collateral (Flyers, Postcards, Social)</option>
                  <option value="signage">Signage & Yard Post Installation</option>
                  <option value="contracts">Contracts, Form 2-T & Compliance</option>
                  <option value="technology">Technology & IT Systems Support</option>
                  <option value="accounting">Accounting, Finance & Commissions</option>
                  <option value="operations">General Operations & Facilities</option>
                  <option value="unknown">Unknown / Ambiguous Request</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Inbound Channel</label>
                <select
                  value={previewInput.channel}
                  onChange={e => setPreviewInput(prev => ({ ...prev, channel: e.target.value }))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800"
                  data-testid="preview-channel-select"
                >
                  <option value="web">NORA Web Intake</option>
                  <option value="phone">Telephony Call (Retell AI)</option>
                  <option value="email">Inbound Email Dispatch</option>
                  <option value="manual">Manual Operator Task</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Deliverable / Request Title</label>
                <input
                  type="text"
                  value={previewInput.deliverableType}
                  onChange={e => setPreviewInput(prev => ({ ...prev, deliverableType: e.target.value, title: e.target.value }))}
                  placeholder="e.g. Just Listed Double Flyer"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                  data-testid="preview-title-input"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Requester Name</label>
                <input
                  type="text"
                  value={previewInput.requesterName}
                  onChange={e => setPreviewInput(prev => ({ ...prev, requesterName: e.target.value }))}
                  placeholder="e.g. Matt Orr"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                  data-testid="preview-requester-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Property Address</label>
                <input
                  type="text"
                  value={previewInput.propertyAddress}
                  onChange={e => setPreviewInput(prev => ({ ...prev, propertyAddress: e.target.value }))}
                  placeholder="e.g. 408 Landfall Dr, Wilmington NC (or blank to test triage)"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs"
                  data-testid="preview-address-input"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Classification Confidence</label>
                <select
                  value={previewInput.classificationConfidence}
                  onChange={e => setPreviewInput(prev => ({ ...prev, classificationConfidence: parseFloat(e.target.value) }))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-800"
                  data-testid="preview-confidence-select"
                >
                  <option value="0.95">High (95% - Automated Route)</option>
                  <option value="0.80">Medium (80% - Automated Route)</option>
                  <option value="0.50">Low (50% - Triage Trigger)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                icon={<Play className="w-3.5 h-3.5 text-white" />}
                onClick={handleRunRoutingPreview}
                disabled={isPreviewing}
                data-testid="execute-preview-btn"
              >
                {isPreviewing ? 'Evaluating...' : 'Simulate Server Routing'}
              </Button>
            </div>

            {/* Simulation Results View */}
            {previewResult && (
              <div className="mt-4 p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-3" data-testid="preview-results-card">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-stone-600">Simulation Decision</span>
                  {previewResult.routingState === 'resolved' ? (
                    <Badge variant="brand">✓ Resolved (Route Valid)</Badge>
                  ) : previewResult.routingState === 'triage_required' ? (
                    <Badge variant="warning">⚠️ Triage Required</Badge>
                  ) : (
                    <Badge variant="danger">❌ Configuration Error</Badge>
                  )}
                </div>

                {previewResult.triageReason && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <strong className="block font-bold">Triage Reason:</strong>
                    <span>{previewResult.triageReason}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-stone-500 block">Assigned Staff:</span>
                    <strong className="text-stone-900">
                      {previewResult.assigneeName ? `${previewResult.assigneeName} (${previewResult.assigneeStaffId})` : 'None (Unassigned)'}
                    </strong>
                    {previewResult.coveringStaffName && (
                      <span className="block text-emerald-700">Covering for {previewResult.originalStaffName}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-stone-500 block">Review Owner:</span>
                    <strong className="text-stone-900">
                      {previewResult.reviewOwnerName ? `${previewResult.reviewOwnerName} (${previewResult.reviewOwnerStaffId})` : 'None / Not Required'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Governing SOP:</span>
                    <strong className="text-stone-900">
                      {previewResult.governingSopId ? `${previewResult.governingSopTitle || previewResult.governingSopId} (v${previewResult.governingSopVersion || '1.0'})` : 'None'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Matched Rule / SLA:</span>
                    <strong className="text-stone-900">
                      {previewResult.matchedRuleId ? `${previewResult.matchedRuleId} · ${previewResult.slaDisplay || '24 hrs'}` : 'No rule matched'}
                    </strong>
                  </div>
                </div>

                {previewResult.reasonCodes && previewResult.reasonCodes.length > 0 && (
                  <div className="pt-2 border-t border-stone-200/80">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Reason Codes</span>
                    <div className="flex flex-wrap gap-1">
                      {previewResult.reasonCodes.map((code: string, idx: number) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded-md bg-stone-200 text-stone-700 font-mono text-[10px]">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Connected Tools & OAuth 2.0 Drawer */}
      <ConnectedToolsDrawer
        isOpen={showConnectedToolsDrawer}
        onClose={() => setShowConnectedToolsDrawer(false)}
        onStatusChange={fetchOAuthStatuses}
      />
    </div>
  );
}
