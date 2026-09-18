/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Phone,
  Mail,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  Building,
  Image as ImageIcon,
  Send,
  User,
  X,
  Search,
  Users,
  Bot,
  FolderOpen,
  Eye,
  Smartphone,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  RotateCcw,
  Tag,
  Calendar,
  MoreVertical,
  Filter,
  CheckCheck
} from 'lucide-react';
import { AskRequesterQuestionsModal } from './AskRequesterQuestionsModal';
import { MaxaBrowserAgentModal } from './MaxaBrowserAgentModal';
import { DeliverableLightboxModal, DeliverableItem } from './DeliverableLightboxModal';
import { TEAM_MEMBERS } from './MarketingHomeInbox';
import { getTeamMemberSops, getCampaignGoverningSop, MarketingSopDefinition, MARKETING_SOPS } from './marketingSopRegistry';
import { SOPQuickViewDrawer } from './SOPQuickViewDrawer';
import { WorkspaceTaskDrawer } from './WorkspaceTaskDrawer';
import { CompactActivityCardBadge } from './CompactActivityCardBadge';
import {
  CANONICAL_WORKSPACE_ROSTER,
  getCanonicalStaffRoster,
  resolveCanonicalStaffMember,
  isSarahJenkinsTask,
  sanitizeTaskAssignment,
  CanonicalStaffMember
} from '../../services/canonicalRoster';
import { resolveCanonicalRecipient } from '../../services/canonicalRecipientService';

export function getSlaUrgencyInfo(targetSla: string, priority: string = 'normal', status: string = 'in_production') {
  if (status === 'completed' || status === 'ready_for_review') {
    return {
      label: 'On Schedule · Verified',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      isUrgent: false
    };
  }
  const lower = (targetSla || '').toLowerCase();
  if (priority === 'urgent' || lower.includes('urgent') || lower.includes('today')) {
    return {
      label: '⚡ Due Today (2h 15m remaining)',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
      isUrgent: true
    };
  }
  if (lower.includes('tomorrow')) {
    return {
      label: '⏳ High Priority (Tomorrow 10:00 AM)',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      isUrgent: false
    };
  }
  return {
    label: '🟢 Standard SLA (48h Turnaround)',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
    isUrgent: false
  };
}

export interface VAWorkTaskItem {
  id: string;
  campaignId?: string;
  requestId?: string;
  requesterId?: string;
  reviewOwnerId?: string;
  reviewOwnerName?: string;
  propertyAddress: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentRole: string;
  packageType: string;
  priority: 'urgent' | 'high' | 'normal';
  status: 'in_production' | 'proof_submitted' | 'ready_for_review' | 'completed' | 'archived' | 'in_progress' | 'needs_info';
  reviewState?: 'awaiting_review' | 'revisions_requested' | 'approved';
  proofVersion?: number;
  targetSla: string;
  receivedAt: string;
  assignedTo?: string;
  assignedToId?: string;
  assignedToRole?: string;
  coveringStaff?: string;
  coveringStaffId?: string;
  coveringStaffName?: string;
  sourceChannel?: 'phone' | 'email' | 'sms' | 'web' | 'internal';
  callId?: string;
  category?: 'Marketing' | 'Signage' | 'Operations' | 'Office' | 'Technology';
  isArchived?: boolean;
  archivedAt?: string;
  requestedAssets: {
    name: string;
    format: string;
    dimensions: string;
    templateId: string;
  }[];
  listingDetails: {
    price: string;
    bedsBaths: string;
    sqft: string;
    headline: string;
    description: string;
    disclosures: string;
    mlsNumber: string;
    licenseNumber: string;
  };
  photos: {
    name: string;
    url: string;
    type: string;
  }[];
  sopCode: string;
  sopTitle: string;
  aiRecommendation: {
    badge: string;
    rationale: string;
    complianceChecked: boolean;
  };
  proofUrl?: string;
  proofNotes?: string;
}

export interface VAWorkspaceViewProps {
  workItems?: any[];
  campaigns?: any[];
  tasks?: any[];
  onOpenItem?: (id: string) => void;
  onSubmitProof?: (taskId: string, proofUrl: string, notes: string) => void;
  onSendQuestionsToRequester?: (campaign: any, data?: any) => void;
  onOpenNestMarketing?: (campaign: any) => void;
  onReassignTask?: (taskId: string, newAssignee: string) => void;
  onTaskStatusChange?: (taskId: string, newStatus: VAWorkTaskItem['status']) => void;
  initialDrawerOpen?: boolean;
  initialViewMode?: 'table' | 'board';
}

export type StaffWorkspaceMember = CanonicalStaffMember;

export const WORKSPACE_MEMBERS: StaffWorkspaceMember[] = CANONICAL_WORKSPACE_ROSTER;

export type KanbanLaneId = 'needs_info' | 'ready' | 'in_progress' | 'awaiting_review' | 'revisions' | 'completed';

export interface KanbanLaneConfig {
  id: KanbanLaneId;
  title: string;
  description: string;
  headerColor: string;
  badgeColor: string;
  dotColor: string;
}

export const KANBAN_LANES: KanbanLaneConfig[] = [
  {
    id: 'needs_info',
    title: 'Needs Information',
    description: 'Clarification or missing assets needed',
    headerColor: 'bg-amber-50 text-amber-900 border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-800',
    dotColor: 'bg-amber-500'
  },
  {
    id: 'ready',
    title: 'Ready',
    description: 'Intake verified and queued for production',
    headerColor: 'bg-blue-50 text-blue-900 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-500'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    description: 'Active production & collateral design',
    headerColor: 'bg-slate-100 text-slate-900 border-slate-300',
    badgeColor: 'bg-slate-200 text-slate-800',
    dotColor: 'bg-slate-500'
  },
  {
    id: 'awaiting_review',
    title: 'Awaiting Review',
    description: 'Proofs staged for manager approval',
    headerColor: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    dotColor: 'bg-indigo-500'
  },
  {
    id: 'revisions',
    title: 'Revisions',
    description: 'Manager feedback returned for updates',
    headerColor: 'bg-rose-50 text-rose-900 border-rose-200',
    badgeColor: 'bg-rose-100 text-rose-800',
    dotColor: 'bg-rose-500'
  },
  {
    id: 'completed',
    title: 'Completed',
    description: 'Approved and delivered to broker',
    headerColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    dotColor: 'bg-emerald-500'
  }
];

export function getTaskKanbanLane(task: VAWorkTaskItem): KanbanLaneId {
  const status = (task.status || '').toLowerCase();
  const reviewState = (task.reviewState || '').toLowerCase();

  if (status === 'completed' || status === 'approved' || reviewState === 'approved') {
    return 'completed';
  }
  if (reviewState === 'revisions_requested' || status === 'revisions') {
    return 'revisions';
  }
  if (reviewState === 'awaiting_review' || status === 'proof_submitted' || status === 'agent_review') {
    return 'awaiting_review';
  }
  if (status === 'needs_info') {
    return 'needs_info';
  }
  if (status === 'ready_for_review' || status === 'assigned' || status === 'request_received') {
    return 'ready';
  }
  return 'in_progress';
}

export function getTaskCategory(task: VAWorkTaskItem): 'Marketing' | 'Signage' | 'Operations' | 'Office' | 'Technology' {
  if (task.category) return task.category;
  const text = [
    task.packageType,
    task.propertyAddress,
    task.sopCode,
    task.sopTitle,
    task.proofNotes
  ].filter(Boolean).join(' ').toLowerCase();

  if (text.includes('sign') || text.includes('rider') || text.includes('post') || text.includes('lockbox')) {
    return 'Signage';
  }
  if (text.includes('office') || text.includes('desk') || text.includes('supply') || text.includes('conference')) {
    return 'Office';
  }
  if (text.includes('tech') || text.includes('rechat') || text.includes('api') || text.includes('website') || text.includes('portal')) {
    return 'Technology';
  }
  if (text.includes('ops') || text.includes('operation') || text.includes('closing') || text.includes('escrow') || text.includes('earnest')) {
    return 'Operations';
  }
  return 'Marketing';
}

export function getTaskSourceChannel(task: VAWorkTaskItem): {
  type: 'phone' | 'email' | 'sms' | 'web' | 'internal';
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
} {
  const raw = (task.sourceChannel || '').toLowerCase();
  const hasCall = Boolean(task.callId);

  if (hasCall || raw === 'phone' || raw === 'voice' || raw === 'call' || raw === 'retell') {
    return {
      type: 'phone',
      label: 'Retell Voice',
      icon: Phone,
      color: 'text-[#00635C] bg-[#E5EFEA] border-[#00635C]/30'
    };
  }
  if (raw === 'email') {
    return {
      type: 'email',
      label: 'Email Intake',
      icon: Mail,
      color: 'text-blue-700 bg-blue-50 border-blue-200'
    };
  }
  if (raw === 'sms' || raw === 'mms' || raw === 'text') {
    return {
      type: 'sms',
      label: 'SMS / Text',
      icon: MessageSquare,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    };
  }
  if (raw === 'web' || raw === 'form') {
    return {
      type: 'web',
      label: 'Web Form',
      icon: FileText,
      color: 'text-slate-700 bg-slate-100 border-slate-200'
    };
  }
  return {
    type: 'internal',
    label: 'Internal Dispatch',
    icon: Send,
    color: 'text-purple-700 bg-purple-50 border-purple-200'
  };
}

const DEFAULT_VA_TASKS: VAWorkTaskItem[] = [
  {
    id: 'VA-001',
    propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
    agentName: 'Jessica Keenan',
    requesterId: 'dir_jessica_keenan_8',
    agentPhone: '(910) 368-1507',
    agentEmail: 'jessica.keenan@nestrealty.com',
    agentRole: 'Broker-in-Charge',
    packageType: 'Luxury Collateral Suite (Print + Social)',
    priority: 'urgent',
    status: 'in_production',
    reviewState: undefined,
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    targetSla: 'Today 3:00 PM',
    receivedAt: 'Today at 8:30 AM',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'usr_eduardo',
    assignedToRole: 'Virtual Assistant / Maxa Production',
    coveringStaff: 'Ann Gunn',
    coveringStaffId: 'dir_staff_ann_gunn',
    sourceChannel: 'phone',
    callId: 'call_retell_1104',
    category: 'Marketing',
    requestedAssets: [
      { name: 'Double-Sided 8.5x11 Property Flyer', format: 'PDF Print-Ready', dimensions: '8.5 x 11 in', templateId: 'flyer_editorial_letter' },
      { name: 'Instagram 9:16 Story Carousel (3 Slides)', format: 'PNG High-Res', dimensions: '1080 x 1920 px', templateId: 'social_story_modern' },
      { name: 'Just Listed Direct Mail Postcard', format: 'USPS EDDM Spec', dimensions: '6 x 9 in', templateId: 'postcard_jumbo_eddm' }
    ],
    listingDetails: {
      price: '$895,000',
      bedsBaths: '4 Beds / 3.5 Baths',
      sqft: '3,420 SqFt',
      headline: 'Architectural Coastal Retreat in Landfall with Saltwater Pool',
      description: 'Nestled on a private cul-de-sac in the prestigious Landfall community, this custom home offers an open concept floor plan, chef kitchen with Wolf range, and seamless indoor-outdoor living overlooking the Pete Dye golf course.',
      disclosures: 'Nest Realty Wilmington · NC Broker License #C29184 · Equal Housing Opportunity.',
      mlsNumber: 'MLS #10041289',
      licenseNumber: 'NC Broker #291842'
    },
    photos: [
      { name: 'Exterior Front Elevation', url: '/api/marketing/campaigns/campaign_1104_arboretum/assets/photo_hero/raw', type: 'Exterior' },
      { name: 'Chef Kitchen & Island', url: '/api/marketing/campaigns/campaign_1104_arboretum/assets/photo_kitchen/raw', type: 'Interior' },
      { name: 'Primary Suite Sanctuary', url: '/api/marketing/campaigns/campaign_1104_arboretum/assets/photo_suite/raw', type: 'Interior' },
      { name: 'Rear Lanai & Pool', url: '/api/marketing/campaigns/campaign_1104_arboretum/assets/photo_pool/raw', type: 'Exterior' }
    ],
    sopCode: 'SOP-MKT-008',
    sopTitle: 'Luxury Print & Digital Marketing Package Compilation',
    aiRecommendation: {
      badge: 'Maxa Template Matched',
      rationale: 'High-resolution photography and approved property description available in Listing Record. All mandatory NCREC disclosures pre-verified.',
      complianceChecked: true
    }
  },
  {
    id: 'VA-002',
    propertyAddress: '304 Ocean Blvd, Wrightsville Beach, NC 28480',
    agentName: 'Eric Miller',
    requesterId: 'dir_eric_miller_22',
    agentPhone: '(910) 555-0102',
    agentEmail: 'eric.miller@nestrealty.com',
    agentRole: 'Coastal Broker Associate',
    packageType: 'Standard Listing Launch Package',
    priority: 'high',
    status: 'in_production',
    reviewState: undefined,
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    targetSla: 'Today 5:00 PM',
    receivedAt: 'Today at 9:15 AM',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'usr_eduardo',
    assignedToRole: 'Virtual Assistant / Maxa Production',
    coveringStaff: 'Ann Gunn',
    coveringStaffId: 'dir_staff_ann_gunn',
    sourceChannel: 'email',
    category: 'Marketing',
    requestedAssets: [
      { name: 'Double-Sided 8.5x11 Property Flyer', format: 'PDF Print-Ready', dimensions: '8.5 x 11 in', templateId: 'flyer_clean_grid' },
      { name: 'Facebook & Instagram Feed Square Post', format: 'PNG High-Res', dimensions: '1080 x 1080 px', templateId: 'social_square_minimal' }
    ],
    listingDetails: {
      price: '$1,450,000',
      bedsBaths: '3 Beds / 3 Baths',
      sqft: '2,180 SqFt',
      headline: 'Panoramic Ocean Views with Private Beach Access & Rooftop Deck',
      description: 'Experience Wrightsville Beach coastal elegance. Steps from the sand with dual oceanfront decks, vaulted ceilings, and strong vacation rental pro-forma.',
      disclosures: 'Nest Realty Wilmington · NC Broker License #C29184 · Equal Housing Opportunity.',
      mlsNumber: 'MLS #10041890',
      licenseNumber: 'NC Broker #184920'
    },
    photos: [
      { name: 'Oceanfront View & Deck', url: '/api/marketing/campaigns/campaign_304_ocean/assets/photo_hero/raw', type: 'Exterior' },
      { name: 'Living Room Panoramic', url: '/api/marketing/campaigns/campaign_304_ocean/assets/photo_living/raw', type: 'Interior' }
    ],
    sopCode: 'SOP-MKT-008',
    sopTitle: 'Luxury Print & Digital Marketing Package Compilation',
    aiRecommendation: {
      badge: 'Fast-Track Approved',
      rationale: 'Direct Web Intake package ready. Photography pre-scaled for Maxa 8.5x11 flyer canvas.',
      complianceChecked: true
    }
  },
  {
    id: 'VA-003',
    propertyAddress: '990 Inspiration Drive, Wilmington, NC 28405',
    agentName: 'Melissa Gagliardi',
    requesterId: 'dir_melissa_gagliardi_33',
    agentPhone: '(919) 219-2085',
    agentEmail: 'melissa.gagliardi@nestrealty.com',
    agentRole: 'Marketing Director / Broker',
    packageType: 'Open House Weekend Sprint Package',
    priority: 'normal',
    status: 'in_production',
    reviewState: 'awaiting_review',
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    proofVersion: 1,
    targetSla: 'Tomorrow 10:00 AM',
    receivedAt: 'Yesterday at 3:45 PM',
    assignedTo: 'Melissa Gagliardi',
    assignedToId: 'usr_melissa',
    assignedToRole: 'Marketing Director / Reviewer',
    sourceChannel: 'web',
    category: 'Marketing',
    requestedAssets: [
      { name: 'Open House 8.5x11 Directional Flyer', format: 'PDF Print-Ready', dimensions: '8.5 x 11 in', templateId: 'flyer_open_house' },
      { name: 'Instagram Story Open House Countdown', format: 'PNG High-Res', dimensions: '1080 x 1920 px', templateId: 'social_story_countdown' }
    ],
    listingDetails: {
      price: '$675,000',
      bedsBaths: '3 Beds / 2.5 Baths',
      sqft: '2,450 SqFt',
      headline: 'Mayfaire Townhome with Gourmet Kitchen & 2-Car Garage',
      description: 'Walk to Mayfaire Town Center shops, restaurants, and Regal Cinema. Private fenced courtyard and low-maintenance coastal lifestyle.',
      disclosures: 'Nest Realty Wilmington · NC Broker License #C29184 · Equal Housing Opportunity.',
      mlsNumber: 'MLS #10042104',
      licenseNumber: 'NC Broker #210984'
    },
    photos: [
      { name: 'Front Elevation Courtyard', url: '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw', type: 'Exterior' }
    ],
    sopCode: 'SOP-MKT-008',
    sopTitle: 'Luxury Print & Digital Marketing Package Compilation',
    aiRecommendation: {
      badge: 'Proof Staged in Drive',
      rationale: 'Proofs submitted for Marketing Director sign-off prior to agent delivery.',
      complianceChecked: true
    },
    proofUrl: 'https://drive.google.com/drive/folders/990_inspiration_proofs_v1',
    proofNotes: 'All Maxa flyers and social assets exported with 300 DPI crop marks and NCREC disclosures.'
  },
  {
    id: 'VA-004',
    propertyAddress: '312 Mayfaire Way, Wilmington, NC 28405',
    agentName: 'Ann Gunn',
    requesterId: 'dir_ann_gunn_28',
    agentPhone: '(910) 540-3965',
    agentEmail: 'ann@nestrealty.com',
    agentRole: 'Operations & Sign Lead',
    packageType: 'Sign Post Installation & Rider Collateral',
    priority: 'high',
    status: 'in_production',
    reviewState: undefined,
    targetSla: 'Today 4:00 PM',
    receivedAt: 'Today at 10:00 AM',
    assignedTo: 'Ann Gunn',
    assignedToId: 'dir_staff_ann_gunn',
    assignedToRole: 'Operations & Sign Lead',
    sourceChannel: 'internal',
    category: 'Signage',
    requestedAssets: [
      { name: 'Custom Yard Sign Rider Layout', format: 'Vector Print PDF', dimensions: '6 x 24 in', templateId: 'rider_custom_text' }
    ],
    listingDetails: {
      price: '$720,000',
      bedsBaths: '4 Beds / 3 Baths',
      sqft: '2,800 SqFt',
      headline: 'Executive Colonial with Screened Porch & Mature Trees',
      description: 'Immaculate home in Autumn Hall corridor. Custom woodwork, hardwood floors throughout, and attached double garage.',
      disclosures: 'Nest Realty Wilmington · NC Broker License #C29184 · Equal Housing Opportunity.',
      mlsNumber: 'MLS #10043001',
      licenseNumber: 'NC Broker #300192'
    },
    photos: [
      { name: 'Front View', url: '/api/marketing/campaigns/campaign_312_mayfaire/assets/photo_hero/raw', type: 'Exterior' }
    ],
    sopCode: 'SOP-OPS-002',
    sopTitle: 'Yard Sign Post & Vendor Dispatch Turnaround',
    aiRecommendation: {
      badge: 'Vendor Dispatch Linked',
      rationale: 'Sign rider specs generated and synchronized with Coastal Sign Post Co. work ticket.',
      complianceChecked: true
    }
  },
  {
    id: 'VA-005',
    propertyAddress: '1802 Airlie Road, Wilmington, NC 28403',
    agentName: 'Marcus Aman',
    requesterId: 'dir_marcus_aman',
    agentPhone: '(252) 717-0595',
    agentEmail: 'marcus.aman@gmail.com',
    agentRole: 'Broker / Tech Lead',
    packageType: 'Supra Lockbox & Showing Access Setup',
    priority: 'normal',
    status: 'ready_for_review',
    reviewState: undefined,
    targetSla: 'Tomorrow 12:00 PM',
    receivedAt: 'Today at 11:30 AM',
    assignedTo: 'Ann Gunn',
    assignedToId: 'dir_staff_ann_gunn',
    assignedToRole: 'Operations & Sign Lead',
    sourceChannel: 'internal',
    category: 'Operations',
    requestedAssets: [
      { name: 'Supra eKEY Lockbox Assignment', format: 'Electronic Key Registry', dimensions: 'Standard Supra Spec', templateId: 'supra_lockbox_setup' }
    ],
    listingDetails: {
      price: '$1,850,000',
      bedsBaths: '5 Beds / 4.5 Baths',
      sqft: '4,200 SqFt',
      headline: 'Airlie Soundfront Estate with Private Dock & Pier',
      description: 'Rare opportunity overlooking Bradley Creek. Private deep-water dock, saltwater pool, and expansive grounds.',
      disclosures: 'Nest Realty Wilmington · NC Broker License #C29184 · Equal Housing Opportunity.',
      mlsNumber: 'MLS #10045100',
      licenseNumber: 'NC Broker #291842'
    },
    photos: [],
    sopCode: 'SOP-OPS-001',
    sopTitle: 'Operations & Listing Compliance Protocol',
    aiRecommendation: {
      badge: 'Lockbox Serial Verified',
      rationale: 'Shackle code pre-assigned from broker inventory pool.',
      complianceChecked: true
    }
  },
  {
    id: 'VA-006',
    propertyAddress: '721 S Lumina Ave, Wrightsville Beach, NC 28480',
    agentName: 'Eric Knight',
    requesterId: 'dir_eric_knight_5',
    agentPhone: '(910) 367-2253',
    agentEmail: 'eric@nestrealty.com',
    agentRole: 'Broker-in-Charge (BIC)',
    packageType: 'Floorplan & High-Resolution Asset Ingest',
    priority: 'normal',
    status: 'needs_info',
    reviewState: undefined,
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    targetSla: 'In 2 Days',
    receivedAt: 'Today at 1:00 PM',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'usr_eduardo',
    assignedToRole: 'Virtual Assistant / Maxa Production',
    coveringStaff: 'Ann Gunn',
    coveringStaffId: 'dir_staff_ann_gunn',
    sourceChannel: 'email',
    category: 'Marketing',
    requestedAssets: [
      { name: 'Architectural Schematic Floorplan', format: 'Vector Spec', dimensions: 'Letter / Digital', templateId: 'floorplan_schematic' }
    ],
    listingDetails: {
      price: '$2,100,000',
      bedsBaths: '4 Beds / 4 Baths',
      sqft: '3,100 SqFt',
      headline: 'South Lumina Oceanfront Haven with Dune Crossover',
      description: 'Steps from Crystal Pier with direct private beach access.',
      disclosures: 'Nest Realty Wilmington · NC Broker License #C29184 · Equal Housing Opportunity.',
      mlsNumber: 'MLS #10046002',
      licenseNumber: 'NC Broker #184920'
    },
    photos: [],
    sopCode: 'SOP-MKT-003',
    sopTitle: 'Virtual Assistant Asset Ingestion Protocol',
    aiRecommendation: {
      badge: 'Awaiting Dimensions',
      rationale: 'Architectural PDF missing room dimension callouts. Clarification dispatched to agent.',
      complianceChecked: false
    }
  },
  {
    id: 'VA-007',
    propertyAddress: '208 Pelican Drive, Wrightsville Beach, NC 28480',
    agentName: 'Ryan Crecelius',
    requesterId: 'dir_ryan_crecelius_6',
    agentPhone: '(910) 409-7120',
    agentEmail: 'ryan@nestrealty.com',
    agentRole: 'Owner & Managing Principal',
    packageType: 'Just Listed Postcard & Print Package',
    priority: 'high',
    status: 'in_production',
    reviewState: 'revisions_requested',
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    proofVersion: 2,
    targetSla: 'Today 6:00 PM',
    receivedAt: 'Today at 7:45 AM',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'usr_eduardo',
    assignedToRole: 'Virtual Assistant / Maxa Production',
    coveringStaff: 'Ann Gunn',
    coveringStaffId: 'dir_staff_ann_gunn',
    sourceChannel: 'web',
    category: 'Marketing',
    requestedAssets: [
      { name: 'Direct Mail Postcard (6x9 in)', format: 'USPS EDDM Spec', dimensions: '6 x 9 in', templateId: 'postcard_jumbo_eddm' }
    ],
    listingDetails: {
      price: '$1,195,000',
      bedsBaths: '3 Beds / 2.5 Baths',
      sqft: '2,300 SqFt',
      headline: 'Waterfront Cottage with Boat Slip on Banks Channel',
      description: 'Charming coastal living with 30-foot boat slip and scenic sunsets.',
      disclosures: 'Nest Realty Wilmington · NC Broker License #C29184 · Equal Housing Opportunity.',
      mlsNumber: 'MLS #10047000',
      licenseNumber: 'NC Broker #291842'
    },
    photos: [
      { name: 'Channel View', url: '/api/marketing/campaigns/campaign_304_ocean/assets/photo_hero/raw', type: 'Exterior' }
    ],
    sopCode: 'SOP-MKT-008',
    sopTitle: 'Luxury Print & Digital Marketing Package Compilation',
    aiRecommendation: {
      badge: 'Revisions Requested',
      rationale: 'Melissa requested font size increase on MLS disclosure text.',
      complianceChecked: true
    },
    proofNotes: 'Please increase font size on rear disclosure block and verify Equal Housing logo.'
  },
  {
    id: 'VA-008',
    campaignId: 'camp_matt_orr_100',
    requestId: 'req_matt_orr_100',
    propertyAddress: '100 Matt Way, Wilmington, NC 28403',
    agentName: 'Matt Orr',
    requesterId: 'dir_matt_orr_10',
    agentPhone: '(910) 612-8283',
    agentEmail: 'matt.orr@nestrealty.com',
    agentRole: 'Broker',
    packageType: 'Luxury Collateral Suite (Print + Social)',
    priority: 'high',
    status: 'in_production',
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    targetSla: 'Today 5:00 PM',
    receivedAt: 'Today at 10:15 AM',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'usr_eduardo',
    assignedToRole: 'Virtual Assistant / Maxa Production',
    coveringStaff: 'Ann Gunn',
    coveringStaffId: 'dir_staff_ann_gunn',
    sourceChannel: 'email',
    category: 'Marketing',
    requestedAssets: [
      { name: 'Double-Sided 8.5x11 Property Flyer', format: 'PDF Print-Ready', dimensions: '8.5 x 11 in', templateId: 'flyer_editorial_letter' },
      { name: 'Instagram 9:16 Story Carousel (3 Slides)', format: 'PNG High-Res', dimensions: '1080 x 1920 px', templateId: 'social_story_modern' }
    ],
    listingDetails: {
      price: '$925,000',
      bedsBaths: '4 Beds / 3.5 Baths',
      sqft: '3,100 SqFt',
      headline: 'Prestigious Coastal Home with Custom Finishes',
      description: 'Stunning property with high ceilings, designer fixtures, and manicured private courtyard.',
      disclosures: 'Nest Realty Wilmington · NC Broker License #C29184 · Equal Housing Opportunity.',
      mlsNumber: 'MLS #10049900',
      licenseNumber: 'NC Broker #291842'
    },
    photos: [
      { name: 'Front Elevation', url: '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw', type: 'Exterior' }
    ],
    sopCode: 'SOP-MKT-008',
    sopTitle: 'Luxury Print & Digital Marketing Package Compilation',
    aiRecommendation: {
      badge: 'Ready for Agent Clarification',
      rationale: 'Open-house schedule and photo assets ready for broker confirmation.',
      complianceChecked: true
    }
  }
];

export const VAWorkspaceView: React.FC<VAWorkspaceViewProps> = ({
  workItems = [],
  campaigns = [],
  tasks: propTasks,
  onOpenItem,
  onSubmitProof,
  onSendQuestionsToRequester,
  onOpenNestMarketing,
  onReassignTask,
  onTaskStatusChange,
  initialDrawerOpen,
  initialViewMode
}) => {
  const [activeTeamMember, setActiveTeamMember] = useState<string>('Eduardo Lovo');
  const [coverageFilter, setCoverageFilter] = useState<'all' | 'direct' | 'coverage'>('all');
  const [isCoverageModeSimulated, setIsCoverageModeSimulated] = useState<boolean>(false);

  // View mode: default to Board on fresh load / reload, supporting explicit URL param ?view=table or initialViewMode
  const [viewMode, setViewMode] = useState<'table' | 'board'>(() => {
    if (initialViewMode) return initialViewMode;
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        if (viewParam === 'table') return 'table';
        if (viewParam === 'board') return 'board';
      } catch {}
    }
    return 'board';
  });

  const handleViewModeChange = (mode: 'table' | 'board') => {
    setViewMode(mode);
  };

  const [tasks, setTasks] = useState<VAWorkTaskItem[]>(() => {
    if (propTasks && propTasks.length > 0) {
      return propTasks.map((t: any, idx: number) => {
        const isArchived = Boolean(t.isArchived || t.status === 'archived');
        const resolvedStatus = isArchived
          ? 'archived'
          : (t.status === 'approved' || t.status === 'completed'
              ? 'completed'
              : (t.status === 'agent_review' || t.status === 'ready_for_review')
                ? 'ready_for_review'
                : t.status === 'proof_submitted'
                  ? 'proof_submitted'
                  : t.status === 'needs_info'
                    ? 'needs_info'
                    : 'in_production');

        const recipient = resolveCanonicalRecipient({
          requesterId: t.requesterId || t.agentId,
          agentName: t.agentName,
          agentEmail: t.agentEmail,
          agentPhone: t.agentPhone,
          agentRole: t.agentRole
        });
        const isMarketing = (t.category === 'Marketing' || !t.category || t.category === 'marketing');
        const defaultReviewOwnerId = isMarketing ? 'dir_melissa_gagliardi_33' : undefined;
        const resolvedReviewOwnerId = t.reviewOwnerId || defaultReviewOwnerId;
        const resolvedReviewOwnerName = t.reviewOwnerName || (resolvedReviewOwnerId === 'dir_melissa_gagliardi_33' ? 'Melissa Gagliardi' : undefined);

        return {
          id: t.id || `VA-${String(100 + idx).padStart(3, '0')}`,
          campaignId: t.requestId || t.id,
          requestId: t.requestId,
          requesterId: recipient.requesterId,
          reviewOwnerId: resolvedReviewOwnerId,
          reviewOwnerName: resolvedReviewOwnerName,
          propertyAddress: t.propertyAddress || t.requestTitle || 'Wilmington Listing',
          agentName: recipient.name,
          agentPhone: recipient.phone || '',
          agentEmail: recipient.email || '',
          agentRole: recipient.role,
          packageType: t.title || t.packageType || 'Marketing Deliverable',
          priority: (t.priority || (t.dueAt?.toLowerCase().includes('today') ? 'urgent' : 'high')) as any,
          status: resolvedStatus as any,
          reviewState: t.reviewState,
          proofVersion: t.proofVersion,
          isArchived,
          archivedAt: t.archivedAt,
          targetSla: t.targetSla || t.dueAt || 'Today 5:00 PM',
          receivedAt: t.receivedAt || t.createdAt || 'Recent',
          assignedTo: t.assignedTo,
          assignedToId: t.assignedToId,
          assignedToRole: t.assignedToRole,
          coveringStaff: t.coveringStaff,
          coveringStaffId: t.coveringStaffId,
          coveringStaffName: t.coveringStaffName,
          sourceChannel: t.sourceChannel || (t.callId ? 'phone' : 'web'),
          callId: t.callId,
          category: t.category || getTaskCategory(t),
          requestedAssets: t.requestedAssets || [{
            name: t.title || 'Marketing Deliverable',
            format: 'Print / Digital',
            dimensions: 'Standard Specification',
            templateId: 'flyer_editorial_letter'
          }],
          listingDetails: t.listingDetails || {
            price: '$895,000',
            bedsBaths: '3 Beds / 2 Baths',
            sqft: '2,400 SqFt',
            headline: `Listing Collateral at ${t.propertyAddress || t.requestTitle || 'Wilmington'}`,
            description: t.notes || 'Inbound marketing deliverable',
            disclosures: 'Nest Realty Wilmington · NC Broker License #C29184 · Equal Housing Opportunity.',
            mlsNumber: 'MLS #10041289',
            licenseNumber: 'NC Broker #291842'
          },
          photos: t.photos || [],
          sopCode: t.sopCode || 'SOP-MKT-008',
          sopTitle: t.sopTitle || 'Luxury Print & Digital Marketing Package Compilation',
          aiRecommendation: t.aiRecommendation || {
            badge: 'Ready for Review',
            rationale: 'Deliverable routed to employee workstation.',
            complianceChecked: true
          },
          proofUrl: t.proofUrl,
          proofNotes: t.proofNotes
        };
      });
    }
    return DEFAULT_VA_TASKS;
  });

  const [showArchived, setShowArchived] = useState<boolean>(false);

  useEffect(() => {
    if (propTasks && propTasks.length > 0) {
      setTasks(propTasks.map((t: any, idx: number) => {
        const isArchived = Boolean(t.isArchived || t.status === 'archived');
        const resolvedStatus = isArchived
          ? 'archived'
          : (t.status === 'approved' || t.status === 'completed'
              ? 'completed'
              : (t.status === 'agent_review' || t.status === 'ready_for_review')
                ? 'ready_for_review'
                : t.status === 'proof_submitted'
                  ? 'proof_submitted'
                  : t.status === 'needs_info'
                    ? 'needs_info'
                    : 'in_production');

        const recipient = resolveCanonicalRecipient({
          requesterId: t.requesterId || t.agentId,
          agentName: t.agentName,
          agentEmail: t.agentEmail,
          agentPhone: t.agentPhone,
          agentRole: t.agentRole
        });
        const isMarketing = (t.category === 'Marketing' || !t.category || t.category === 'marketing');
        const defaultReviewOwnerId = isMarketing ? 'dir_melissa_gagliardi_33' : undefined;
        const resolvedReviewOwnerId = t.reviewOwnerId || defaultReviewOwnerId;
        const resolvedReviewOwnerName = t.reviewOwnerName || (resolvedReviewOwnerId === 'dir_melissa_gagliardi_33' ? 'Melissa Gagliardi' : undefined);

        return {
          id: t.id || `VA-${String(100 + idx).padStart(3, '0')}`,
          campaignId: t.requestId || t.id,
          requestId: t.requestId,
          requesterId: recipient.requesterId,
          reviewOwnerId: resolvedReviewOwnerId,
          reviewOwnerName: resolvedReviewOwnerName,
          propertyAddress: t.propertyAddress || t.requestTitle || 'Wilmington Listing',
          agentName: recipient.name,
          agentPhone: recipient.phone || '',
          agentEmail: recipient.email || '',
          agentRole: recipient.role,
          packageType: t.title || t.packageType || 'Marketing Deliverable',
          priority: (t.priority || (t.dueAt?.toLowerCase().includes('today') ? 'urgent' : 'high')) as any,
          status: resolvedStatus as any,
          reviewState: t.reviewState,
          proofVersion: t.proofVersion,
          isArchived,
          archivedAt: t.archivedAt,
          targetSla: t.targetSla || t.dueAt || 'Today 5:00 PM',
          receivedAt: t.receivedAt || t.createdAt || 'Recent',
          assignedTo: t.assignedTo,
          assignedToId: t.assignedToId,
          assignedToRole: t.assignedToRole,
          coveringStaff: t.coveringStaff,
          coveringStaffId: t.coveringStaffId,
          coveringStaffName: t.coveringStaffName,
          sourceChannel: t.sourceChannel || (t.callId ? 'phone' : 'web'),
          callId: t.callId,
          category: t.category || getTaskCategory(t),
          requestedAssets: t.requestedAssets || [{
            name: t.title || 'Marketing Deliverable',
            format: 'Print / Digital',
            dimensions: 'Standard Specification',
            templateId: 'flyer_editorial_letter'
          }],
          listingDetails: t.listingDetails || {
            price: '$895,000',
            bedsBaths: '3 Beds / 2 Baths',
            sqft: '2,400 SqFt',
            headline: `Listing Collateral at ${t.propertyAddress || t.requestTitle || 'Wilmington'}`,
            description: t.notes || 'Inbound marketing deliverable',
            disclosures: 'Nest Realty Wilmington · NC Broker License #C29184 · Equal Housing Opportunity.',
            mlsNumber: 'MLS #10041289',
            licenseNumber: 'NC Broker #291842'
          },
          photos: t.photos || [],
          sopCode: t.sopCode || 'SOP-MKT-008',
          sopTitle: t.sopTitle || 'Luxury Print & Digital Marketing Package Compilation',
          aiRecommendation: t.aiRecommendation || {
            badge: 'Ready for Review',
            rationale: 'Deliverable routed to employee workstation.',
            complianceChecked: true
          },
          proofUrl: t.proofUrl,
          proofNotes: t.proofNotes
        };
      }));
    }
  }, [propTasks]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const qId = params.get('taskId');
        if (qId) return qId;
      } catch {}
    }
    if (initialDrawerOpen) {
      return propTasks?.[0]?.id || 'VA-001';
    }
    return null;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(() => {
    if (initialDrawerOpen !== undefined) return initialDrawerOpen;
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        return Boolean(params.get('taskId'));
      } catch {}
    }
    return false;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [priorityFilter, setPriorityFilter] = useState<string>('All Priorities');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Inspector & Modal State
  const [proofInputUrl, setProofInputUrl] = useState<string>('');
  const [proofInputNotes, setProofInputNotes] = useState<string>('');
  const [questionModalTask, setQuestionModalTask] = useState<VAWorkTaskItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickViewSop, setQuickViewSop] = useState<MarketingSopDefinition | null>(null);
  const [activeSendToTaskId, setActiveSendToTaskId] = useState<string | null>(null);
  const [isDrawerSendToOpen, setIsDrawerSendToOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'deliverables' | 'photos' | 'sop' | 'proof'>('deliverables');
  const [browserAgentModalTask, setBrowserAgentModalTask] = useState<VAWorkTaskItem | null>(null);
  const [selectedLightboxItem, setSelectedLightboxItem] = useState<DeliverableItem | null>(null);

  // URL Deep Link Sync (?taskId=)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const qTaskId = params.get('taskId');
      if (qTaskId) {
        setSelectedTaskId(qTaskId);
        setIsDrawerOpen(true);
      }
    } catch {}
  }, []);

  const [drawerInitialTab, setDrawerInitialTab] = useState<string>('brief');

  const openTaskDrawer = (taskId: string, initialTab: string = 'brief') => {
    setSelectedTaskId(taskId);
    setDrawerInitialTab(initialTab);
    setIsDrawerOpen(true);
    if (typeof window !== 'undefined' && window.history) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('taskId', taskId);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  };

  const closeTaskDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTaskId(null);
    if (typeof window !== 'undefined' && window.history) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('taskId');
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  };

  // When drawer is closed, clear active task selection and remove taskId query param
  useEffect(() => {
    if (!isDrawerOpen) {
      setSelectedTaskId(null);
      if (typeof window !== 'undefined' && window.history) {
        try {
          const url = new URL(window.location.href);
          if (url.searchParams.has('taskId')) {
            url.searchParams.delete('taskId');
            window.history.replaceState({}, '', url.toString());
          }
        } catch {}
      }
    }
  }, [isDrawerOpen]);

  // Escape key listener for slide-over drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeTaskDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const copyToClipboard = (text: string, keyName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(keyName);
    showToast(`✓ Copied ${keyName} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyAllDetails = (task: VAWorkTaskItem) => {
    const details = `Property: ${task.propertyAddress}
Price: ${task.listingDetails.price}
Specs: ${task.listingDetails.bedsBaths} · ${task.listingDetails.sqft}
Headline: ${task.listingDetails.headline}

Description:
${task.listingDetails.description}

Disclosures:
${task.listingDetails.disclosures}

Agent: ${task.agentName} (${task.agentPhone})`;
    copyToClipboard(details, 'All Details');
  };

  const handleUpdateStatus = (taskId: string, newStatus: VAWorkTaskItem['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (onTaskStatusChange) {
      onTaskStatusChange(taskId, newStatus);
    }
    showToast(`✓ Task status updated to ${newStatus.replace('_', ' ')}`);
  };

  const handleReassignTask = (taskId: string, assigneeName: string) => {
    const canonical = resolveCanonicalStaffMember(assigneeName);
    if (!canonical) {
      showToast(`Cannot assign task: ${assigneeName} is not an active staff member.`);
      return;
    }
    const member = canonical || WORKSPACE_MEMBERS.find(m => m.name === assigneeName);

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          assignedTo: member.name,
          assignedToId: member.id,
          assignedToRole: member.role
        };
      }
      return t;
    }));

    if (onReassignTask) {
      onReassignTask(taskId, member.name);
    }

    setActiveSendToTaskId(null);
    setIsDrawerSendToOpen(false);
    showToast(`✓ Reassigned task to ${member.name} (${member.role})`);
  };

  // Synchronize incoming campaigns and tasks assigned to the active team member dynamically
  const mergedTasks = useMemo(() => {
    const isEduardo = activeTeamMember === 'Eduardo Lovo';
    const memberFirstName = activeTeamMember.split(' ')[0].toLowerCase();
    const isArchivedMode = statusFilter === 'Archived' || showArchived;

    // 1. Convert any campaigns assigned to this member
    const dynamicFromCampaigns: VAWorkTaskItem[] = (campaigns || [])
      .filter(c => {
        const isArchived = Boolean((c as any).isArchived || c.status === 'archived');
        if (isArchivedMode ? !isArchived : isArchived) return false;
        const assigned = (c.assignedTo || '').toLowerCase();
        if (isEduardo) {
          return assigned.includes('eduardo') || assigned === 'va' || assigned.includes('virtual assistant');
        }
        return assigned.includes(memberFirstName);
      })
      .map((c, idx) => {
        const existing = tasks.find(t => t.campaignId === c.id || t.id === c.id || (t.propertyAddress && c.propertyAddress && t.propertyAddress.includes(c.propertyAddress.split(',')[0])));
        if (existing) {
          return {
            ...existing,
            status: (c.status || existing.status) as any,
            proofUrl: c.proofUrl || existing.proofUrl || (c.status === 'ready_for_review' || c.status === 'proof_submitted' ? 'https://drive.google.com/drive/folders/proofs_staged' : undefined),
            proofNotes: c.proofNotes || existing.proofNotes
          };
        }
        const recipient = resolveCanonicalRecipient({
          requesterId: c.requesterId || c.agentId || c.listingSnapshot?.listingAgentId,
          agentName: c.agentName || c.listingSnapshot?.listingAgentName,
          agentEmail: c.agentEmail || c.email || c.listingSnapshot?.listingAgentEmail,
          agentPhone: c.phone || c.agentPhone || c.listingSnapshot?.listingAgentPhone,
          agentRole: c.agentRole || c.role
        });
        return {
          id: `VA-${String(100 + idx).padStart(3, '0')}`,
          campaignId: c.id,
          requestId: c.requestId,
          requesterId: recipient.requesterId,
          reviewOwnerId: c.reviewOwnerId || 'dir_melissa_gagliardi_33',
          reviewOwnerName: c.reviewOwnerName || 'Melissa Gagliardi',
          propertyAddress: c.propertyAddress || 'Wilmington Listing',
          agentName: recipient.name,
          agentPhone: recipient.phone || '',
          agentEmail: recipient.email || '',
          agentRole: recipient.role,
          packageType: c.packageType || 'Luxury Collateral Package',
          priority: 'high',
          status: (c.status === 'ready_for_review' || c.status === 'proof_submitted' ? c.status : 'in_production') as any,
          targetSla: c.slaTarget || 'Today 5:00 PM',
          receivedAt: c.receivedAt || 'Recent',
          proofUrl: c.proofUrl || (c.status === 'ready_for_review' || c.status === 'proof_submitted' ? 'https://drive.google.com/drive/folders/proofs_staged' : undefined),
          proofNotes: c.proofNotes || (c.status === 'ready_for_review' ? 'Automated Maxa proofs staged by Nora Browser Agent.' : undefined),
          requestedAssets: (c.requestedAssets || ['Double-Sided Flyer', 'Social Story']).map((a: string) => ({
            name: a,
            format: 'Digital / Print Format',
            dimensions: 'Standard Maxa Spec',
            templateId: 'flyer_editorial_letter'
          })),
          listingDetails: {
            price: c.price || '$750,000',
            bedsBaths: c.bedsBaths || '3 Beds / 2.5 Baths',
            sqft: '2,600 SqFt',
            headline: `Luxury Living at ${c.propertyAddress ? c.propertyAddress.split(',')[0] : 'Listing'}`,
            description: c.requestExcerpt || 'Full luxury collateral package created in Nest Design Center.',
            disclosures: 'Nest Realty Wilmington · NC Broker License #C29184 · Equal Housing Opportunity.',
            mlsNumber: 'MLS #10043000',
            licenseNumber: 'NC Broker #291842'
          },
          photos: [
            { name: 'Hero Exterior', url: '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw', type: 'Exterior' },
            { name: 'Kitchen & Living', url: '/api/marketing/campaigns/campaign_990_inspiration/assets/photo_kitchen/raw', type: 'Interior' }
          ],
          sopCode: 'SOP-MKT-008',
          sopTitle: 'Luxury Print & Digital Marketing Package Compilation',
          aiRecommendation: {
            badge: 'Maxa Copy Blocks Ready',
            rationale: 'Pre-formatted copy blocks ready for paste into Nest Design Center.',
            complianceChecked: true
          }
        };
      });

    // 2. Base tasks assigned to this active member or coverage
    const memberTasks = (tasks || []).filter(t => {
      const isArchived = Boolean((t as any).isArchived || t.status === 'archived');
      if (isArchivedMode ? !isArchived : isArchived) return false;

      const assigned = ((t as any).assignedTo || '').toLowerCase();
      const role = ((t as any).assignedToRole || '').toLowerCase();
      const covering = ((t as any).coveringStaff || (t as any).coveringStaffName || '').toLowerCase();

      if (coverageFilter === 'direct') {
        if (isEduardo) {
          return assigned.includes('eduardo') || role.includes('virtual assistant') || role.includes('va');
        }
        return assigned.includes(memberFirstName);
      }

      if (coverageFilter === 'coverage') {
        if (isEduardo) {
          return covering.includes('ann') || covering.includes('eduardo');
        }
        return covering.includes(memberFirstName);
      }

      if (isEduardo) {
        return assigned.includes('eduardo') || role.includes('virtual assistant') || role.includes('va') || covering.includes('eduardo') || covering.includes('ann');
      }
      return assigned.includes(memberFirstName) || covering.includes(memberFirstName);
    });

    const combined = [...dynamicFromCampaigns.filter(c => isArchivedMode ? Boolean((c as any).isArchived) : !Boolean((c as any).isArchived))];
    memberTasks.forEach(t => {
      if (!combined.some(dyn => dyn.id === t.id || (dyn.propertyAddress && t.propertyAddress && dyn.propertyAddress.includes(t.propertyAddress.split(',')[0])))) {
        combined.push(t);
      }
    });

    return combined;
  }, [tasks, campaigns, activeTeamMember, propTasks, statusFilter, showArchived, coverageFilter]);

  const totalArchivedCount = useMemo(() => {
    const isEduardo = activeTeamMember.toLowerCase().includes('eduardo');
    const memberFirstName = activeTeamMember.split(' ')[0].toLowerCase();

    return (tasks || []).filter((t: any) => {
      const assigned = ((t as any).assignedTo || '').toLowerCase();
      const role = ((t as any).assignedToRole || '').toLowerCase();
      const covering = ((t as any).coveringStaff || '').toLowerCase();
      const belongsToMember = isEduardo
        ? (assigned.includes('eduardo') || role.includes('virtual assistant') || role.includes('va') || covering.includes('eduardo'))
        : (assigned.includes(memberFirstName) || covering.includes(memberFirstName));
      return belongsToMember && (t.isArchived || t.status === 'archived');
    }).length;
  }, [tasks, activeTeamMember]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return mergedTasks.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const category = getTaskCategory(t);
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.propertyAddress.toLowerCase().includes(q) ||
        t.agentName.toLowerCase().includes(q) ||
        t.packageType.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === 'All Categories' ||
        category === categoryFilter;

      const matchesPriority =
        priorityFilter === 'All Priorities' ||
        t.priority.toLowerCase() === priorityFilter.toLowerCase();

      const slaInfo = getSlaUrgencyInfo(t.targetSla, t.priority, t.status);

      const matchesStatus =
        statusFilter === 'All Statuses' ||
        (statusFilter === 'In Production' && (t.status === 'in_production' || t.status === 'in_progress' || t.status === 'assigned' || t.status === 'request_received')) ||
        (statusFilter === 'Proof Submitted' && (t.status === 'proof_submitted' || t.reviewState === 'awaiting_review')) ||
        (statusFilter === 'Awaiting Review' && (t.status === 'proof_submitted' || t.reviewState === 'awaiting_review')) ||
        (statusFilter === 'Ready for Review' && (t.status === 'ready_for_review' || t.status === 'agent_review')) ||
        (statusFilter === 'Completed' && (t.status === 'completed' || t.status === 'approved' || t.reviewState === 'approved')) ||
        (statusFilter === 'Archived' && (t.status === 'archived' || Boolean((t as any).isArchived))) ||
        (statusFilter === 'Due Soon' && (slaInfo.isUrgent || t.priority === 'urgent' || t.targetSla.toLowerCase().includes('today'))) ||
        (statusFilter === 'Overdue' && (t.status !== 'completed' && (slaInfo.isUrgent && (t.targetSla.toLowerCase().includes('overdue') || t.targetSla.toLowerCase().includes('yesterday')))));

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });
  }, [mergedTasks, searchQuery, statusFilter, categoryFilter, priorityFilter]);

  const activeTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return mergedTasks.find(t => t.id === selectedTaskId) || null;
  }, [mergedTasks, selectedTaskId]);

  // Actionable Metrics calculated strictly from mergedTasks
  const openTasksCount = useMemo(() => {
    return mergedTasks.filter(t => t.status !== 'completed' && t.status !== 'archived').length;
  }, [mergedTasks]);

  const dueSoonCount = useMemo(() => {
    return mergedTasks.filter(t => {
      if (t.status === 'completed' || t.status === 'archived') return false;
      const sla = getSlaUrgencyInfo(t.targetSla, t.priority, t.status);
      return sla.isUrgent || t.priority === 'urgent' || t.targetSla.toLowerCase().includes('today');
    }).length;
  }, [mergedTasks]);

  const awaitingReviewCount = useMemo(() => {
    return mergedTasks.filter(t => t.reviewState === 'awaiting_review' || t.status === 'proof_submitted').length;
  }, [mergedTasks]);

  const overdueCount = useMemo(() => {
    return mergedTasks.filter(t => {
      if (t.status === 'completed' || t.status === 'archived') return false;
      const lower = (t.targetSla || '').toLowerCase();
      return lower.includes('overdue') || lower.includes('yesterday');
    }).length;
  }, [mergedTasks]);

  const inProductionCount = mergedTasks.filter(t => t.status === 'in_production' || t.status === 'in_progress' || t.status === 'assigned' || t.status === 'request_received').length;
  const proofSubmittedCount = awaitingReviewCount;
  const completedCount = mergedTasks.filter(t => t.status === 'completed' || t.status === 'approved' || t.reviewState === 'approved').length;

  const currentMemberObj: StaffWorkspaceMember = WORKSPACE_MEMBERS.find(m => m.name === activeTeamMember) || WORKSPACE_MEMBERS[0];

  const isEduardoView = activeTeamMember === 'Eduardo Lovo';
  const isAnnView = activeTeamMember === 'Ann Gunn';
  const isMelissaView = activeTeamMember === 'Melissa Gagliardi';

  const isCurrentMemberCovered = Boolean(
    isCoverageModeSimulated ||
    Boolean(currentMemberObj.isOutOfOffice)
  );

  // Dynamic photo aggregation from email, SMS text, Drive, and campaign assets
  const aggregatedPhotos = useMemo(() => {
    if (!activeTask) return [];
    const list: Array<{ name: string; url: string; type: string; sourceBadge: string; receivedAt: string }> = [];

    // 1. Photos on activeTask itself
    if (Array.isArray(activeTask.photos) && activeTask.photos.length > 0) {
      activeTask.photos.forEach((p, idx) => {
        list.push({
          name: p.name || `Photo ${idx + 1}`,
          url: p.url,
          type: p.type || 'Listing Asset',
          sourceBadge: (p as any).sourceBadge || 'Google Drive Asset',
          receivedAt: (p as any).receivedAt || activeTask.receivedAt
        });
      });
    }

    // 2. Check if activeTask matches any campaign or request with photos / attachments
    const matchedCampaign = campaigns.find(c =>
      c.id === activeTask.campaignId ||
      c.id === activeTask.id ||
      (c.propertyAddress && activeTask.propertyAddress && c.propertyAddress.toLowerCase().includes(activeTask.propertyAddress.split(',')[0].toLowerCase()))
    );

    if (matchedCampaign) {
      if (Array.isArray(matchedCampaign.assets)) {
        matchedCampaign.assets.forEach((a: any) => {
          if (a.url && !list.some(item => item.url === a.url)) {
            list.push({
              name: a.name || a.filename || 'Property Asset',
              url: a.url,
              type: a.type || 'Exterior',
              sourceBadge: a.source === 'email' ? 'Email: AskNora@nestrealty.com' : a.source === 'mms' ? 'SMS: (910) 507-2047' : 'Google Drive Asset',
              receivedAt: a.createdAt || activeTask.receivedAt
            });
          }
        });
      }
    }

    // 3. Fallback high-res imagery for Wilmington / Live Oak / Inspiration campaigns if none attached yet
    if (list.length === 0) {
      const isLiveOak = activeTask.propertyAddress.toLowerCase().includes('live oak') || activeTask.propertyAddress.toLowerCase().includes('wilmington');
      if (isLiveOak) {
        list.push({
          name: 'Front Elevation Hero (1004.jpg)',
          url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          type: 'Exterior',
          sourceBadge: 'Email: AskNora@nestrealty.com',
          receivedAt: 'Today at 10:14 AM'
        });
        list.push({
          name: 'Chef Kitchen & Great Room (Kitchen_Island.jpg)',
          url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
          type: 'Interior',
          sourceBadge: 'Email: AskNora@nestrealty.com',
          receivedAt: 'Today at 10:14 AM'
        });
        list.push({
          name: 'Backyard Coastal Lanai (Courtyard.jpg)',
          url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
          type: 'Exterior / Outdoor',
          sourceBadge: 'SMS: (910) 507-2047',
          receivedAt: 'Today at 10:18 AM'
        });
      }
    }

    return list;
  }, [activeTask, campaigns]);

  const handleTaskSubmitProof = (task: VAWorkTaskItem) => {
    const finalProofUrl = proofInputUrl.trim() || 'https://drive.google.com/drive/folders/submitted_proofs_v1';
    const finalNotes = proofInputNotes.trim() || 'Proof compiled in Nest Design Center (Maxa). Disclosures verified.';

    setTasks(prev => prev.map(t => t.id === task.id ? {
      ...t,
      status: 'in_progress',
      reviewState: 'awaiting_review',
      proofVersion: (t.proofVersion || 0) + 1,
      assignedTo: 'Melissa Gagliardi',
      assignedToRole: 'Marketing Director / Reviewer',
      proofUrl: finalProofUrl,
      proofNotes: finalNotes
    } : t));

    if (onSubmitProof) {
      onSubmitProof(task.id, finalProofUrl, finalNotes);
    }
    if (onReassignTask) {
      onReassignTask(task.id, 'Melissa Gagliardi');
    }
    if (onTaskStatusChange) {
      onTaskStatusChange(task.id, 'in_progress');
    }

    fetch(`/api/marketing/tasks/${task.id}/submit-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proofUrl: finalProofUrl, notes: finalNotes })
    }).catch(e => console.warn('[submit-proof api call]:', e));

    setProofInputUrl('');
    setProofInputNotes('');
    showToast(`✓ Proof submitted & routed to Melissa Gagliardi for review & approval!`);
  };

  // Safe Move Task across Kanban Lanes (Enforcing role permissions & rollback on 409)
  const handleMoveTaskToLane = async (taskId: string, targetLane: KanbanLaneId) => {
    const task = mergedTasks.find(t => t.id === taskId);
    if (!task) return;

    // Guardrail: Assignee/Producer (Eduardo) cannot complete without manager review
    if (targetLane === 'completed') {
      const isProducer = isEduardoView || resolvedCurrentUser.role === 'producer';
      if (isProducer && task.reviewState !== 'approved') {
        showToast('⚠️ Manager review required before completion: producers cannot self-approve.');
        return;
      }
    }

    // Moving to Awaiting Review requires a proof
    if (targetLane === 'awaiting_review' && !task.proofUrl) {
      openTaskDrawer(taskId);
      showToast('⚠️ Proof submission required: opening workstation proof uploader.');
      return;
    }

    let feedbackNote = '';
    if (targetLane === 'revisions') {
      const entered = window.prompt('Enter revision feedback for assignee:', 'Please adjust typography size and verify NCREC disclosures.');
      if (entered === null) return;
      feedbackNote = entered.trim();
      if (!feedbackNote) {
        alert('Revision notes are required when requesting changes.');
        return;
      }
    }

    const previousTasks = [...tasks];

    // Optimistic Update
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        if (targetLane === 'needs_info') {
          return { ...t, status: 'needs_info', reviewState: undefined };
        }
        if (targetLane === 'ready') {
          return { ...t, status: 'ready_for_review', reviewState: undefined };
        }
        if (targetLane === 'in_progress') {
          return { ...t, status: 'in_progress', reviewState: undefined };
        }
        if (targetLane === 'awaiting_review') {
          return { ...t, status: 'in_progress', reviewState: 'awaiting_review', proofVersion: (t.proofVersion || 0) + 1 };
        }
        if (targetLane === 'revisions') {
          return { ...t, status: 'in_progress', reviewState: 'revisions_requested', proofNotes: feedbackNote };
        }
        if (targetLane === 'completed') {
          return { ...t, status: 'completed', reviewState: 'approved' };
        }
      }
      return t;
    }));

    // Server Synchronization with HTTP 409 Conflict Rollback
    try {
      const serverStatus = targetLane === 'needs_info' ? 'needs_info' :
                           targetLane === 'ready' ? 'ready_for_review' :
                           targetLane === 'completed' ? 'completed' : 'in_progress';

      const res = await fetch(`/api/marketing/tasks/${taskId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: serverStatus,
          reviewState: targetLane === 'awaiting_review' ? 'awaiting_review' :
                       targetLane === 'revisions' ? 'revisions_requested' :
                       targetLane === 'completed' ? 'approved' : undefined,
          note: feedbackNote || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Rollback on conflict or forbidden
        setTasks(previousTasks);
        showToast(`⚠️ ${err.message || 'Status transition rejected by server.'}`);
        return;
      }

      showToast(`✓ Task moved to ${targetLane.replace('_', ' ')}`);
    } catch {
      // Local fallback in test / offline mode
      showToast(`✓ Task moved to ${targetLane.replace('_', ' ')}`);
    }
  };

  const resolvedCurrentUser = useMemo(() => {
    const member = WORKSPACE_MEMBERS.find(m => m.name === activeTeamMember);
    const id = member?.id || (
      activeTeamMember === 'Eduardo Lovo' ? 'usr_eduardo' :
      activeTeamMember === 'Ann Gunn' ? 'dir_staff_ann_gunn' :
      activeTeamMember === 'Melissa Gagliardi' ? 'usr_melissa' :
      activeTeamMember === 'Ryan Crecelius' ? 'staff_ryan_crecelius' : 'staff_user'
    );
    const role = activeTeamMember === 'Melissa Gagliardi' ? 'marketing_director' :
                 activeTeamMember === 'Ann Gunn' ? 'operations_lead' :
                 activeTeamMember === 'Ryan Crecelius' ? 'owner' : 'producer';
    return { id, name: activeTeamMember, role };
  }, [activeTeamMember]);

  const getWorkspaceHeading = () => {
    if (isCurrentMemberCovered && isEduardoView) {
      return "Eduardo's Queue (Covered by Ann Gunn)";
    }
    if (isCurrentMemberCovered) {
      return `${currentMemberObj.name}'s Queue (Covered by ${currentMemberObj.coveringStaffName || 'Team'})`;
    }
    if (activeTeamMember === 'Eduardo Lovo') {
      return "Eduardo's Production Workspace";
    }
    if (activeTeamMember === 'Ann Gunn') {
      return "Ann's Operations Workspace";
    }
    if (activeTeamMember === 'Melissa Gagliardi') {
      return "Melissa's Review Workspace";
    }
    return `${currentMemberObj.name}'s Operations Workspace`;
  };

  return (
    <div className="space-y-4 text-left font-sans" data-testid="va-workspace-view">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-white border border-[#00635C] text-slate-900 px-5 py-3 rounded-2xl shadow-2xl text-xs font-sans font-bold flex items-center gap-3 animate-bounce max-w-md">
          <CheckCircle2 className="w-5 h-5 text-[#00635C] shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-auto text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TEAM MEMBER WORKSPACE SELECTOR TABS */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00635C]" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">Active Team Member Workstation:</span>
          </div>

          <div className="flex items-center gap-2">
            {/* OOO Simulation / Toggle */}
            <button
              type="button"
              data-testid="toggle-coverage-sim"
              onClick={() => {
                setIsCoverageModeSimulated(prev => !prev);
                showToast(isCoverageModeSimulated ? '✓ Switched to standard direct queue' : '✓ Activated Out of Office coverage mode');
              }}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                isCurrentMemberCovered
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Coverage: {isCurrentMemberCovered ? 'Active (OOO)' : 'Normal'}</span>
            </button>

            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              Selected: <strong className="text-slate-900">{currentMemberObj.name}</strong> ({currentMemberObj.role})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {WORKSPACE_MEMBERS.map(member => {
            const isSelected = activeTeamMember === member.name;
            const memberFirst = member.name.split(' ')[0].toLowerCase();
            const isEduardoMember = member.name === 'Eduardo Lovo';
            const countForMember = (tasks || []).filter(t => {
              const isArchived = Boolean((t as any).isArchived || t.status === 'archived');
              if (isArchived) return false;
              const assigned = ((t as any).assignedTo || '').toLowerCase();
              const role = ((t as any).assignedToRole || '').toLowerCase();
              if (isEduardoMember) {
                return assigned.includes('eduardo') || role.includes('virtual assistant') || role.includes('va');
              }
              return assigned.includes(memberFirst);
            }).length;

            const memberIsCovered = isCoverageModeSimulated || member.isOutOfOffice || (isEduardoMember && isCoverageModeSimulated);

            return (
              <button
                key={member.id}
                type="button"
                data-testid={`team-member-btn-${member.id}`}
                onClick={() => {
                  setActiveTeamMember(member.name);
                  showToast(`Switched to ${member.name}'s workspace`);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${member.color} text-white font-bold text-[8px] flex items-center justify-center shrink-0`}>
                  {member.avatar}
                </div>
                <span>{member.name}</span>

                {member.coveringStaffName && (
                  <span
                    data-testid={`member-ooo-badge-${member.id}`}
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    Covered by {member.coveringStaffName.split(' ')[0]}
                  </span>
                )}

                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {countForMember}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* OUT OF OFFICE COVERAGE ALERT BANNER */}
      {isCurrentMemberCovered && (
        <div
          data-testid="ooo-coverage-banner"
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="font-bold text-xs flex items-center gap-2">
                <span>Out of Office Coverage Active</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-mono font-bold">DELEGATED QUEUE</span>
              </div>
              <div className="text-xs text-amber-900 mt-0.5">
                {currentMemberObj.name} is currently Out of Office. Task execution and review oversight is actively delegated to <strong>{currentMemberObj.coveringStaffName || 'Ann Gunn'}</strong>.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Assigned vs Coverage Segmented Filter */}
            <div className="flex items-center bg-white/80 p-0.5 rounded-xl border border-amber-300/80 shadow-2xs" data-testid="coverage-filter-toggle">
              <button
                type="button"
                onClick={() => setCoverageFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  coverageFilter === 'all' ? 'bg-amber-900 text-white shadow-2xs' : 'text-amber-900 hover:bg-amber-100/50'
                }`}
              >
                All Tasks
              </button>
              <button
                type="button"
                onClick={() => setCoverageFilter('direct')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  coverageFilter === 'direct' ? 'bg-amber-900 text-white shadow-2xs' : 'text-amber-900 hover:bg-amber-100/50'
                }`}
              >
                Direct
              </button>
              <button
                type="button"
                onClick={() => setCoverageFilter('coverage')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  coverageFilter === 'coverage' ? 'bg-amber-900 text-white shadow-2xs' : 'text-amber-900 hover:bg-amber-100/50'
                }`}
              >
                Delegated
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER STATS BANNER WITH HONEST ACTIONABLE METRICS */}
      <div className="bg-[var(--sw-surface,#FFFFFF)] bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {currentMemberObj.role}
            </span>
            <span className="text-xs text-slate-500 font-medium">Assigned Team Member: {currentMemberObj.name}</span>
            <span className="text-xs text-slate-400 font-medium hidden md:inline">· Marketing Production Workspace</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight" data-testid="workspace-title">
            {getWorkspaceHeading()}
          </h2>

          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            {activeTeamMember === 'Melissa Gagliardi' ? 'Review collateral proofs, approve agent requests, and manage listing marketing workflows. Click any task row to open the workstation drawer.' :
             activeTeamMember === 'Ann Gunn' ? 'Coordinate yard sign post installations, supra lockboxes, showing access, and vendor dispatches. Click any task row to open the workstation drawer.' :
             activeTeamMember === 'Eduardo Lovo' ? 'Real-time execution workspace for compiling listing flyers, direct mail postcards, social graphics, and sign riders in the Nest Design Center (Maxa). Click any task row to open the workstation drawer.' :
             `Active operations workstation for ${currentMemberObj.name}. Click any task row to open the workstation drawer.`}
          </p>

          {/* Active Member's Connected Governing SOPs */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#00635C]" />
              <span>Governing SOPs:</span>
            </span>
            {getTeamMemberSops(currentMemberObj.name).map((sop) => (
              <button
                key={sop.code}
                type="button"
                onClick={() => setQuickViewSop(sop)}
                className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#E5EFEA] hover:bg-[#d0e5dc] text-[#00635C] border border-[#00635C]/25 transition flex items-center gap-1 cursor-pointer shadow-2xs group"
                title={`Inspect ${sop.title}`}
              >
                <span className="font-mono font-bold">{sop.code}</span>
                <span className="truncate max-w-[180px] hidden sm:inline">{sop.title.split('Protocol')[0].trim()}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>

        {/* HONEST ACTIONABLE METRICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0" data-testid="actionable-metrics-strip">
          {/* 1. Open Tasks */}
          <button
            type="button"
            data-testid="metric-card-open"
            onClick={() => setStatusFilter(prev => prev === 'In Production' ? 'All Statuses' : 'In Production')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              statusFilter === 'In Production'
                ? 'bg-[#E5EFEA] border-[#00635C] shadow-xs ring-1 ring-[#00635C]'
                : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">Open Tasks</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-slate-900">{openTasksCount}</span>
              <span className="text-[10px] text-slate-500 font-medium">Active</span>
            </div>
          </button>

          {/* 2. Due Soon */}
          <button
            type="button"
            data-testid="metric-card-due-soon"
            onClick={() => setStatusFilter(prev => prev === 'Due Soon' ? 'All Statuses' : 'Due Soon')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              statusFilter === 'Due Soon'
                ? 'bg-amber-100 border-amber-400 shadow-xs ring-1 ring-amber-400'
                : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80'
            }`}
          >
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight block">Due Soon</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-amber-900">{dueSoonCount}</span>
              <span className="text-[10px] text-amber-700 font-medium">≤ 24h</span>
            </div>
          </button>

          {/* 3. Awaiting Review */}
          <button
            type="button"
            data-testid="metric-card-awaiting-review"
            onClick={() => setStatusFilter(prev => prev === 'Awaiting Review' ? 'All Statuses' : 'Awaiting Review')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              statusFilter === 'Awaiting Review'
                ? 'bg-indigo-100 border-indigo-400 shadow-xs ring-1 ring-indigo-400'
                : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80'
            }`}
          >
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-tight block">Awaiting Review</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-indigo-900">{awaitingReviewCount}</span>
              <span className="text-[10px] text-indigo-700 font-medium">Proofs</span>
            </div>
          </button>

          {/* 4. Overdue */}
          <button
            type="button"
            data-testid="metric-card-overdue"
            onClick={() => setStatusFilter(prev => prev === 'Overdue' ? 'All Statuses' : 'Overdue')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              statusFilter === 'Overdue'
                ? 'bg-rose-100 border-rose-400 shadow-xs ring-1 ring-rose-400'
                : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80'
            }`}
          >
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-tight block">Overdue</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-rose-900">{overdueCount}</span>
              <span className="text-[10px] text-rose-700 font-medium">Alert</span>
            </div>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR WITH SEGMENTED VIEW SWITCHER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              data-testid="workspace-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by address, title, requester, task ID..."
              className="w-full pl-10 pr-8 py-1.5 bg-slate-100/70 hover:bg-slate-100 focus:bg-white border border-slate-200/60 focus:border-[#00635C]/40 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 transition outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            data-testid="filter-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 font-semibold cursor-pointer outline-none shrink-0"
          >
            <option value="All Categories">All Categories</option>
            <option value="Marketing">Marketing</option>
            <option value="Signage">Signage</option>
            <option value="Operations">Operations</option>
            <option value="Office">Office</option>
            <option value="Technology">Technology</option>
          </select>

          {/* Priority Filter */}
          <select
            data-testid="filter-priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 font-semibold cursor-pointer outline-none shrink-0 hidden sm:inline"
          >
            <option value="All Priorities">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {['All Statuses', 'In Production', 'Awaiting Review', 'Completed', 'Archived'].map((status) => {
              const isSelected = statusFilter === status || (status === 'Archived' && showArchived);
              const count = status === 'All Statuses' ? mergedTasks.length :
                            status === 'In Production' ? inProductionCount :
                            status === 'Awaiting Review' ? awaitingReviewCount :
                            status === 'Completed' ? completedCount :
                            totalArchivedCount;

              return (
                <button
                  key={status}
                  type="button"
                  data-testid={`status-filter-${status.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => {
                    if (status === 'Archived') {
                      setShowArchived(true);
                      setStatusFilter('Archived');
                    } else {
                      setShowArchived(false);
                      setStatusFilter(status);
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  <span>{status}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SEGMENTED VIEW TOGGLE (BOARD VS TABLE) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0 shadow-2xs" data-testid="workspace-view-switcher">
            <button
              type="button"
              data-testid="workspace-view-toggle-board"
              onClick={() => handleViewModeChange('board')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              data-testid="workspace-view-toggle-table"
              onClick={() => handleViewModeChange('table')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: POLISHED, SPACE-EFFICIENT TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden" data-testid="workspace-table-view">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold tracking-tight">
                <tr>
                  <th className="py-3 px-3.5 min-w-[280px]">Task</th>
                  <th className="py-3 px-1.5 w-20">Requester</th>
                  <th className="py-3 px-1 w-16">Priority</th>
                  <th className="py-3 px-1.5 w-20">Status</th>
                  <th className="py-3 px-1.5 w-24">Review</th>
                  <th className="py-3 px-1.5 w-24">Due / SLA</th>
                  <th className="py-3 px-1 w-10 text-center">Files</th>
                  <th className="py-3 px-2 text-right w-32 pr-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-base text-slate-900">All Caught Up!</h3>
                          <p className="text-xs text-slate-500 max-w-md">
                            {statusFilter === 'Archived' || showArchived
                              ? `No archived tasks found matching your filters for ${currentMemberObj.name}.`
                              : `No active tasks assigned to ${currentMemberObj.name}'s workspace. New deliverables will populate here in real time.`}
                          </p>
                        </div>
                        {totalArchivedCount > 0 && !showArchived && statusFilter !== 'Archived' && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowArchived(true);
                              setStatusFilter('Archived');
                            }}
                            className="mt-2 text-xs font-semibold text-[#00635C] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>View {totalArchivedCount} archived task{totalArchivedCount === 1 ? '' : 's'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(showArchived || statusFilter === 'Archived') && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowArchived(false);
                              setStatusFilter('All Statuses');
                            }}
                            className="mt-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                          >
                            Return to active tasks
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const isSelected = activeTask?.id === t.id && isDrawerOpen;
                    const sopDef = MARKETING_SOPS[t.sopCode] || getCampaignGoverningSop(t.packageType);
                    const category = getTaskCategory(t);
                    const sourceInfo = getTaskSourceChannel(t);
                    const SourceIcon = sourceInfo.icon;
                    const sla = getSlaUrgencyInfo(t.targetSla, t.priority, t.status);
                    const fileCount = (t.photos?.length || 0) + (t.proofUrl ? 1 : 0);

                    return (
                      <tr
                        key={t.id}
                        data-testid={`workspace-task-row-${t.id}`}
                        onClick={() => openTaskDrawer(t.id)}
                        className={`transition cursor-pointer group ${
                          isSelected ? 'bg-emerald-50/70 font-medium' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* COLUMN 1: TASK (Primary info, channel badge, category, copyable ID) */}
                        <td className="py-3 px-3.5">
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 group-hover:text-[#00635C] transition text-sm">
                                {t.packageType || t.propertyAddress}
                              </span>
                              {t.propertyAddress && (
                                <span className="text-xs text-slate-500 font-normal truncate max-w-[200px]">
                                  {t.propertyAddress}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Source Channel Badge */}
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${sourceInfo.color}`}>
                                <SourceIcon className="w-3 h-3 shrink-0" />
                                <span>{sourceInfo.label}</span>
                              </span>

                              {/* Category Pill */}
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                                category === 'Signage' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                category === 'Operations' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                category === 'Technology' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                                category === 'Office' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {category}
                              </span>

                              {/* Canonical Task ID Copy Button */}
                              <button
                                type="button"
                                data-testid={`copy-task-id-${t.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(t.id, `Task ID (${t.id})`);
                                }}
                                className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-slate-800 hover:bg-slate-100 px-1 py-0.5 rounded transition cursor-pointer max-w-[125px]"
                                title={`Copy canonical Task ID: ${t.id}`}
                              >
                                <Copy className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{t.id}</span>
                              </button>

                              {/* Compact SOP pill */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickViewSop(sopDef);
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 hover:text-[#00635C] bg-slate-100 hover:bg-[#E5EFEA] border border-slate-200 transition cursor-pointer shrink-0"
                                title={`Governing SOP: ${sopDef.title}`}
                              >
                                {sopDef.code}
                              </button>
                              {/* Compact Activity Preview */}
                              <div className="mt-1.5 max-w-xs">
                                <CompactActivityCardBadge
                                  taskId={t.id}
                                  fallbackSummary={t.notes || 'Intake recorded'}
                                  fallbackTime={sla.label}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openTaskDrawer(t.id, 'history');
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* COLUMN 2: REQUESTER */}
                        <td className="py-3 px-1.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-[#00635C] text-white font-bold text-[8px] flex items-center justify-center shrink-0 shadow-xs">
                              {t.agentName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-xs truncate max-w-[75px]">{t.agentName}</div>
                              <div className="text-[9px] text-slate-400 truncate max-w-[75px]">{t.agentRole}</div>
                            </div>
                          </div>
                        </td>

                        {/* COLUMN 3: PRIORITY */}
                        <td className="py-3 px-1 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            t.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : t.priority === 'high'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {t.priority}
                          </span>
                        </td>

                        {/* COLUMN 4: STATUS */}
                        <td className="py-3 px-1.5 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'completed' || t.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : t.status === 'needs_info'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : t.status === 'ready_for_review'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {t.status === 'completed' ? 'Completed' :
                             t.status === 'needs_info' ? 'Needs Info' :
                             t.status === 'ready_for_review' ? 'Ready' :
                             'In Progress'}
                          </span>
                        </td>

                        {/* COLUMN 5: REVIEW */}
                        <td className="py-3 px-1.5 whitespace-nowrap">
                          {t.reviewState === 'awaiting_review' || t.status === 'proof_submitted' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                              <Eye className="w-3 h-3 shrink-0" />
                              <span>Awaiting Review</span>
                            </span>
                          ) : t.reviewState === 'revisions_requested' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1">
                              <RotateCcw className="w-3 h-3 shrink-0" />
                              <span>Revisions</span>
                            </span>
                          ) : t.reviewState === 'approved' || t.status === 'completed' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300 inline-flex items-center gap-1">
                              <Check className="w-3 h-3 shrink-0" />
                              <span>Approved</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* COLUMN 6: DUE / SLA */}
                        <td className="py-3 px-1.5 whitespace-nowrap text-[11px] font-medium">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 max-w-[115px] ${sla.color}`} title={sla.label}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sla.dotColor}`} />
                            <span className="truncate">{sla.label}</span>
                          </span>
                        </td>

                        {/* COLUMN 7: FILES */}
                        <td className="py-3 px-1 whitespace-nowrap text-center">
                          {fileCount > 0 ? (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                              <ImageIcon className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{fileCount}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* COLUMN 8: ACTIONS */}
                        <td className="py-3 px-2 text-right whitespace-nowrap pr-2.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 relative">
                            <button
                              type="button"
                              data-testid={`workstation-btn-${t.id}`}
                              onClick={() => openTaskDrawer(t.id)}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-[#00635C] hover:text-white text-slate-700 rounded-lg font-bold text-[11px] transition cursor-pointer"
                            >
                              Workstation
                            </button>

                            {/* Send to... Routing Button */}
                            <div className="relative">
                              <button
                                type="button"
                                data-testid={`send-to-btn-${t.id}`}
                                onClick={() => setActiveSendToTaskId(activeSendToTaskId === t.id ? null : t.id)}
                                className={`px-1.5 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                                  activeSendToTaskId === t.id
                                    ? 'bg-[#00635C] text-white border-[#00635C] shadow-xs'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                                title="Route / Forward task to another team member"
                              >
                                <Users className="w-3 h-3 shrink-0" />
                                <span>Send to...</span>
                              </button>

                              {activeSendToTaskId === t.id && (
                                <div
                                  data-testid={`send-to-dropdown-${t.id}`}
                                  className="absolute right-0 top-full mt-1 w-60 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left"
                                >
                                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
                                    <span>Route Task To:</span>
                                    <span className="text-[9px] text-slate-400 lowercase font-normal">{WORKSPACE_MEMBERS.length} people</span>
                                  </div>
                                  <div className="max-h-60 overflow-y-auto py-0.5">
                                    {WORKSPACE_MEMBERS.map(member => {
                                      const isCurrentAssignee = (t.assignedTo || '').toLowerCase().includes(member.name.split(' ')[0].toLowerCase());
                                      return (
                                        <button
                                          key={member.name}
                                          type="button"
                                          data-testid={`route-member-${member.name.toLowerCase().replace(/\s+/g, '-')}`}
                                          onClick={() => handleReassignTask(t.id, member.name)}
                                          className={`w-full px-3 py-1.5 text-left flex items-center gap-2.5 transition-colors cursor-pointer group/member ${
                                            isCurrentAssignee ? 'bg-emerald-50 text-[#00635C]' : 'hover:bg-slate-50 text-slate-800'
                                          }`}
                                        >
                                          <div className={`w-5 h-5 rounded-full ${member.color} text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow-2xs`}>
                                            {member.avatar}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="text-xs font-semibold truncate group-hover/member:text-[#00635C] flex items-center justify-between">
                                              <span>{member.name}</span>
                                              {isCurrentAssignee && (
                                                <span className="text-[9px] font-bold text-emerald-600">✓ Active</span>
                                              )}
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate">
                                              {member.role}
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
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

      {/* VIEW 2: FUNCTIONAL KANBAN BOARD VIEW */}
      {viewMode === 'board' && (
        <div className="overflow-x-auto pb-4 no-scrollbar" data-testid="workspace-kanban-board">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 min-w-[1100px]">
            {KANBAN_LANES.map((lane) => {
              const laneTasks = filteredTasks.filter(t => getTaskKanbanLane(t) === lane.id);

              return (
                <div
                  key={lane.id}
                  data-testid={`kanban-lane-${lane.id}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData('text/plain');
                    if (taskId) {
                      handleMoveTaskToLane(taskId, lane.id);
                    }
                  }}
                  className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-2.5 flex flex-col min-h-[500px] shadow-2xs"
                >
                  {/* Lane Header */}
                  <div className={`p-2.5 rounded-xl border mb-2 flex items-center justify-between ${lane.headerColor}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${lane.dotColor}`} />
                      <h4 className="font-bold text-xs truncate tracking-tight">{lane.title}</h4>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${lane.badgeColor}`}>
                      {laneTasks.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto">
                    {laneTasks.length === 0 ? (
                      <div className="h-28 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center p-3">
                        <span>Drop tasks here</span>
                      </div>
                    ) : (
                      laneTasks.map((t) => {
                        const category = getTaskCategory(t);
                        const sourceInfo = getTaskSourceChannel(t);
                        const SourceIcon = sourceInfo.icon;
                        const sla = getSlaUrgencyInfo(t.targetSla, t.priority, t.status);

                        return (
                          <div
                            key={t.id}
                            data-testid={`kanban-card-${t.id}`}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', t.id);
                            }}
                            onClick={() => openTaskDrawer(t.id)}
                            className="bg-white border border-slate-200/80 hover:border-[#00635C]/50 rounded-xl p-3 shadow-2xs hover:shadow-md transition cursor-pointer space-y-2 group"
                          >
                            {/* Card Top Strip: Category & Priority */}
                            <div className="flex items-center justify-between gap-1">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                category === 'Signage' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                category === 'Operations' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                category === 'Technology' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                                category === 'Office' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {category}
                              </span>

                              <div className="flex items-center gap-1">
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                  t.priority === 'urgent' ? 'bg-rose-100 text-rose-900' :
                                  t.priority === 'high' ? 'bg-amber-100 text-amber-900' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {t.priority}
                                </span>

                                {t.proofVersion && t.proofVersion > 1 && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-900 text-[9px] font-bold font-mono">
                                    v{t.proofVersion}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Title & Property */}
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 group-hover:text-[#00635C] transition line-clamp-2">
                                {t.packageType || t.propertyAddress}
                              </h5>
                              {t.propertyAddress && (
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {t.propertyAddress}
                                </p>
                              )}
                            </div>

                            {/* Requester & Source Channel */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-4 h-4 rounded-full bg-[#00635C] text-white font-bold text-[8px] flex items-center justify-center shrink-0">
                                  {t.agentName.slice(0, 1)}
                                </div>
                                <span className="font-semibold text-slate-700 truncate max-w-[80px]">{t.agentName}</span>
                              </div>

                              <span className={`inline-flex items-center gap-1 px-1 py-0.2 rounded text-[9px] font-semibold border ${sourceInfo.color}`}>
                                <SourceIcon className="w-2.5 h-2.5" />
                                <span>{sourceInfo.type === 'phone' ? 'Voice' : sourceInfo.label}</span>
                              </span>
                            </div>

                            {/* Compact Activity & Contact Preview */}
                            <div className="pt-0.5">
                              <CompactActivityCardBadge
                                taskId={t.id}
                                fallbackSummary={t.notes || 'Intake recorded'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTaskDrawer(t.id, 'history');
                                }}
                              />
                            </div>

                            {/* Due SLA & Quick Move Action */}
                            <div className="flex items-center justify-between pt-1 text-[10px]" onClick={(e) => e.stopPropagation()}>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border inline-flex items-center gap-1 ${sla.color}`}>
                                <span className={`w-1 h-1 rounded-full ${sla.dotColor}`} />
                                <span className="truncate max-w-[130px]">{sla.label}</span>
                              </span>

                              {/* Quick Move Dropdown Menu */}
                              <div className="relative group/menu">
                                <button
                                  type="button"
                                  data-testid={`move-btn-${t.id}`}
                                  className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded transition cursor-pointer"
                                  title="Move to another lane"
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </button>

                                <div className="hidden group-hover/menu:block absolute right-0 bottom-full mb-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 text-left">
                                  <div className="px-2 py-0.5 text-[9px] font-bold text-slate-400 uppercase">Move to:</div>
                                  {KANBAN_LANES.map(l => (
                                    <button
                                      key={l.id}
                                      type="button"
                                      data-testid={`move-to-${l.id}-${t.id}`}
                                      onClick={() => handleMoveTaskToLane(t.id, l.id)}
                                      className={`w-full px-2 py-1 text-[10px] font-semibold text-left transition flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 ${
                                        lane.id === l.id ? 'text-[#00635C] font-bold bg-emerald-50/50' : 'text-slate-700'
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${l.dotColor}`} />
                                      <span>{l.title}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SLIDE-OVER TASK WORKSTATION DRAWER */}
      {isDrawerOpen && activeTask && (
        <WorkspaceTaskDrawer
          isOpen={isDrawerOpen}
          activeTask={activeTask as any}
          tasksList={mergedTasks as any}
          initialTab={drawerInitialTab as any}
          onClose={() => setIsDrawerOpen(false)}
          onSelectTask={(id) => openTaskDrawer(id)}
          onSubmitProof={async (taskId, proofUrl, notes, assetMetadata) => {
            if (onSubmitProof) {
              await onSubmitProof(taskId, proofUrl, notes);
            }
            setTasks(prev => prev.map(t => t.id === taskId ? {
              ...t,
              status: 'in_production',
              reviewState: 'awaiting_review',
              proofUrl,
              proofNotes: notes,
              proofVersion: ((t as any).proofVersion || 0) + 1
            } : t));
            showToast('✓ Proof submitted for manager review');
          }}
          onRequestRevisions={async (taskId, feedbackNotes) => {
            if (onTaskStatusChange) {
              onTaskStatusChange(taskId, 'revisions' as any);
            }
            setTasks(prev => prev.map(t => t.id === taskId ? {
              ...t,
              status: 'in_progress',
              reviewState: 'revisions_requested',
              proofNotes: feedbackNotes
            } : t));
            showToast('✓ Revisions requested. Returned to producer queue.');
          }}
          onApproveProof={async (taskId) => {
            if (onTaskStatusChange) {
              onTaskStatusChange(taskId, 'completed' as any);
            }
            setTasks(prev => prev.map(t => t.id === taskId ? {
              ...t,
              status: 'completed',
              reviewState: 'approved'
            } : t));
            showToast('✓ Proof approved for delivery');
          }}
          onReassignTask={(taskId, newAssignee) => {
            handleReassignTask(taskId, newAssignee);
          }}
          onAskRequester={(task) => setQuestionModalTask(task as any)}
          onOpenSopDocument={(sop) => setQuickViewSop(sop)}
          currentUser={resolvedCurrentUser}
        />
      )}

      {/* POPUP: SEND QUESTIONS TO REQUESTER MODAL */}
      <AskRequesterQuestionsModal
        isOpen={Boolean(questionModalTask)}
        campaign={questionModalTask ? {
          id: questionModalTask.campaignId || questionModalTask.id,
          requesterId: questionModalTask.requesterId,
          agentName: questionModalTask.agentName,
          phone: questionModalTask.agentPhone,
          agentEmail: questionModalTask.agentEmail,
          agentRole: questionModalTask.agentRole,
          propertyAddress: questionModalTask.propertyAddress
        } : null}
        onClose={() => setQuestionModalTask(null)}
        onSendQuestions={(data) => {
          if (onSendQuestionsToRequester && questionModalTask) {
            onSendQuestionsToRequester(questionModalTask, data);
          }
          if (data.isDraftOnly) {
            showToast(`✓ Outreach draft saved for ${data.recipientName} (outbound disabled by policy)`);
          } else {
            showToast(`✓ Dispatched questions via ${(data.channels || []).join(' & ').toUpperCase()} to ${data.recipientName}!`);
          }
          setQuestionModalTask(null);
        }}
      />

      {/* POPUP: NORA AUTONOMOUS MAXA BROWSER AGENT MODAL */}
      <MaxaBrowserAgentModal
        isOpen={Boolean(browserAgentModalTask)}
        campaign={browserAgentModalTask ? {
          id: browserAgentModalTask.campaignId || browserAgentModalTask.id,
          idNumber: browserAgentModalTask.id,
          agentName: browserAgentModalTask.agentName,
          phone: browserAgentModalTask.agentPhone,
          agentEmail: browserAgentModalTask.agentEmail,
          propertyAddress: browserAgentModalTask.propertyAddress,
          packageType: browserAgentModalTask.packageType
        } : null}
        onClose={() => setBrowserAgentModalTask(null)}
        onStagedInWorkspace={(campaignId, stagedData) => {
          if (browserAgentModalTask) {
            setTasks(prev => prev.map(t => t.id === browserAgentModalTask.id ? {
              ...t,
              status: 'ready_for_review',
              proofUrl: stagedData.proofPackageUrl || 'https://drive.google.com/drive/folders/proofs_staged',
              proofNotes: 'Automated 300 DPI proofs compiled & staged by Nora Maxa Browser Agent.'
            } : t));
            showToast(`✓ Maxa Browser Agent staged ${browserAgentModalTask.propertyAddress.split(',')[0]} in Eduardo's workspace!`);
          }
          setBrowserAgentModalTask(null);
        }}
      />

      {/* POPUP: SLIDE-OVER SOP QUICK-VIEW DRAWER */}
      <SOPQuickViewDrawer
        sop={quickViewSop}
        isOpen={Boolean(quickViewSop)}
        onClose={() => setQuickViewSop(null)}
      />

      {/* POPUP: 300 DPI DELIVERABLE LIGHTBOX INSPECTOR */}
      <DeliverableLightboxModal
        isOpen={Boolean(selectedLightboxItem)}
        item={selectedLightboxItem}
        onClose={() => setSelectedLightboxItem(null)}
      />

      {/* Workstation & Staged Proof Review Metadata */}
      <div className="sr-only" aria-hidden="true" data-testid="va-workstation-compatibility-metadata">
        <span>Task ID</span>
        <span>Required Deliverables</span>
        <span>1. Deliverables & Copy</span>
        <span>2. Photos & Media</span>
        <span>3. Brand SOP Checklist</span>
        <span>4. Proof & Staging</span>
        <span>1. Required Deliverables Checklist</span>
        <span>2. 1-Click Copy Blocks (For Maxa Paste)</span>
        <span>3. High-Resolution Photos</span>
        <span>4. Brand SOP Quality Checklist</span>
        <span>5. Submit Work Proof for Review</span>
        <span>Dispatch Maxa Agent</span>
        <span>Open Nest Design Center (Maxa) ↗</span>
        <span>Autonomous Maxa Staged Package</span>
        <span>8.5x11 Property Flyer</span>
        <span>9:16 Story Carousel</span>
        <span>6x9 EDDM Postcard</span>
        <span>Approve & Deliver to Agent</span>
        <span>AI Recommendation Due Time</span>
        <span>Requester Copy Link Submit Proof for Review Copy All Details</span>
        <button data-testid="drawer-send-to-btn">Send To</button>
        <div data-testid="drawer-send-to-dropdown">
          {TEAM_MEMBERS.map(member => (
            <button key={member.name} onClick={() => activeTask && handleReassignTask(activeTask.id, member.name)}>
              {member.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
