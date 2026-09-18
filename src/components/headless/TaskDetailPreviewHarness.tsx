import React, { useState, useEffect } from 'react';
import { TaskRequestDetailModal } from '../marketing/TaskRequestDetailModal';
import { WorkspaceTaskDrawer, WorkspaceDrawerTask } from '../marketing/WorkspaceTaskDrawer';
import { AskRequesterQuestionsModal } from '../marketing/AskRequesterQuestionsModal';
import type { CanonicalMarketingTask, CanonicalMarketingRequest } from '../../../server/persistence/marketingCampaignsRepository';

export default function TaskDetailPreviewHarness() {
  const [scenario, setScenario] = useState<string>('manager-collapsed');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('scenario');
    if (s) setScenario(s);
  }, []);

  const sampleRequest: CanonicalMarketingRequest = {
    id: 'req_landfall_001',
    workspaceId: 'ws_wilmington',
    title: '1402 Landfall Way • Marketing Package',
    propertyAddress: '1402 Landfall Way, Wilmington NC 28405',
    category: 'marketing',
    channel: 'phone',
    agentName: 'Vance Young (Broker)',
    agentRole: 'Listing Specialist',
    agentPhone: '(910) 555-9000',
    agentEmail: 'vance@nestrealty.com',
    telephonyCallId: 'call_landfall_998',
    notes: 'Matt Orr: Hey Nora, we need a 6x9 EDDM postcard and social carousel for 1402 Landfall Way.\nNora Intake AI: Perfect, I have generated the request and tasks.',
    requestExcerpt: 'Produce 6x9 EDDM Postcard and 9:16 Social Story Carousel for luxury waterfront listing.',
    rawExcerpt: 'Matt Orr: Vance Young wants high gloss print flyers and digital story ready for Friday open house.',
    taskIds: ['task_landfall_001', 'task_landfall_002'],
    createdAt: '2026-09-04T12:00:00.000Z',
    updatedAt: '2026-09-04T12:00:00.000Z',
    isArchived: false
  };

  const sampleManagerTaskMarketing: CanonicalMarketingTask = {
    id: 'task_landfall_001',
    requestId: 'req_landfall_001',
    workspaceId: 'ws_wilmington',
    requestTitle: '1402 Landfall Way • Marketing Package',
    propertyAddress: '1402 Landfall Way, Wilmington NC 28405',
    agentName: 'Vance Young (Broker)',
    agentRole: 'Listing Specialist',
    agentPhone: '(910) 555-9000',
    agentEmail: 'vance@nestrealty.com',
    title: '6x9 EDDM Postcard and Social Story Carousel',
    category: 'marketing',
    channel: 'phone',
    telephonyCallId: 'call_landfall_998',
    status: 'in_progress',
    reviewState: 'awaiting_review',
    priority: 'high',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'staff_eduardo_lovo',
    assignedToRole: 'Virtual Assistant',
    reviewOwnerName: 'Melissa Gagliardi',
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    coveringStaffName: 'Ann Gunn',
    coveringStaffId: 'staff_ann_smith',
    dueAt: '2026-09-06T20:45:00.000Z',
    notes: 'Matt Orr: Please format with full bleed 300 DPI CMYK. Use Nest Luxury brand guidelines.\nNora Intake AI: Acknowledged.',
    proofVersion: 1,
    proofUrl: 'https://storage.googleapis.com/shapework-proofs/landfall_postcard_v1.pdf',
    proofs: [
      {
        id: 'proof_001',
        name: '6x9 Landfall Postcard Proof (300 DPI)',
        url: 'https://storage.googleapis.com/shapework-proofs/landfall_postcard_v1.pdf',
        uploadedAt: '2026-09-04T14:00:00.000Z',
        uploadedBy: 'Eduardo Lovo',
        version: 1
      }
    ],
    proofHistory: [
      {
        version: 1,
        proofUrl: 'https://storage.googleapis.com/shapework-proofs/landfall_postcard_v1.pdf',
        uploadedBy: 'Eduardo Lovo',
        uploadedAt: '2026-09-04T14:00:00.000Z',
        notes: '300 DPI CMYK export ready with 0.125in full bleed'
      }
    ],
    requirements: [
      {
        id: 'req_disclosures',
        label: 'Property address and disclosures verified',
        status: 'verified',
        verifiedByName: 'Eduardo Lovo',
        verifiedAt: '2026-09-04T14:30:00.000Z'
      },
      {
        id: 'req_branding',
        label: 'Brand colors and typography follow Nest guidelines',
        status: 'verified',
        verifiedByName: 'Eduardo Lovo',
        verifiedAt: '2026-09-04T14:30:00.000Z'
      }
    ],
    internalFlags: [],
    createdAt: '2026-09-04T12:00:00.000Z',
    updatedAt: '2026-09-04T14:30:00.000Z'
  };

  const sampleManagerTaskSignage: CanonicalMarketingTask = {
    ...sampleManagerTaskMarketing,
    id: 'task_signage_001',
    title: 'Yard Sign Post & Custom Rider Installation',
    category: 'signage',
    vendorName: 'Coastal Sign Post Co.',
    vendorNotes: 'Standard 4x4 white vinyl post with custom rider. Front curb by driveway entrance. 811 utility markings confirmed.',
    notes: 'Install front curb sign post before Friday 5 PM. Custom rider: "Under Contract / Coming Soon".'
  };

  const sampleManagerTaskTech: CanonicalMarketingTask = {
    ...sampleManagerTaskMarketing,
    id: 'task_tech_001',
    title: 'Follow Up Boss & Dotloop Broker Seat Reassignment',
    category: 'tech',
    vendorName: 'Follow Up Boss & Dotloop Ops',
    vendorNotes: 'Provision agent seat, grant team lead permissions, sync Google Workspace SSO with 2FA enforced.',
    notes: 'Platform setup for newly licensed broker Vance Young. Target device: macOS / iPad Pro.'
  };

  const sampleDrawerTaskPhotos: WorkspaceDrawerTask = {
    id: 'task_landfall_001',
    campaignId: 'req_landfall_001',
    propertyAddress: '1402 Landfall Way, Wilmington NC 28405',
    agentName: 'Vance Young (Broker)',
    agentPhone: '(910) 555-9000',
    agentEmail: 'vance@nestrealty.com',
    agentRole: 'Listing Specialist',
    packageType: 'Full Luxury Print & Social Package',
    priority: 'high',
    status: 'in_progress',
    reviewState: 'awaiting_review',
    proofVersion: 1,
    targetSla: '48h Standard SLA',
    dueAt: '2026-09-06T20:45:00.000Z',
    receivedAt: '2026-09-04T12:00:00.000Z',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'staff_eduardo_lovo',
    assignedToRole: 'Virtual Assistant',
    reviewOwnerName: 'Melissa Gagliardi',
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    coveringStaffName: 'Ann Gunn',
    coveringStaffId: 'staff_ann_smith',
    notes: 'Matt Orr: Deliverable must highlight the saltwater pool and intra-coastal views.\nNora Intake AI: Deliverables generated.',
    proofUrl: 'https://storage.googleapis.com/shapework-proofs/landfall_postcard_v1.pdf',
    proofNotes: 'Exported at 300 DPI CMYK with crop marks and full bleed.',
    requestedAssets: [
      { name: '6x9 EDDM Postcard (Front & Back)', format: 'PDF Print (300 DPI)', dimensions: '6" x 9"', templateId: 'tmpl_eddm_6x9' },
      { name: 'Instagram & Facebook Social Story', format: 'PNG High-Res', dimensions: '1080 x 1920 (9:16)', templateId: 'tmpl_story_916' }
    ],
    listingDetails: {
      price: '$1,475,000',
      bedsBaths: '4 Beds · 3.5 Baths',
      sqft: '3,850 Sq Ft',
      headline: 'Exceptional Intra-Coastal Luxury in Gated Landfall',
      description: 'Masterfully renovated estate featuring open-concept chef’s kitchen, heated saltwater pool, panoramic water views, and deeded boat slip.',
      disclosures: 'Equal Housing Opportunity. All information deemed reliable but not guaranteed. North Carolina Real Estate Commission rules apply.',
      mlsNumber: 'MLS #10049281',
      licenseNumber: 'NC Broker License #289144'
    },
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', name: 'Front Exterior Elevation', caption: 'Custom architecture with mature palms' },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', name: 'Chef Kitchen & Island', caption: 'Waterfall quartz island & Sub-Zero suite' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', name: 'Saltwater Pool & Terrace', caption: 'Heated pool overlooking golf fairway' },
      { id: 'p4', url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800', name: 'Primary Suite Sanctuary', caption: 'Spa bath with freestanding soaking tub' }
    ],
    sopCode: 'MKT-SOP-004',
    sopTitle: 'Collateral Production & 300 DPI Export Standard',
    requirements: [
      {
        id: 'req_disclosures',
        label: 'Property address and NCREC disclosures verified',
        status: 'verified',
        verifiedByName: 'Eduardo Lovo',
        verifiedAt: '2026-09-04T14:30:00.000Z'
      },
      {
        id: 'req_branding',
        label: 'Brand colors (#00635C) and typography follow Nest guidelines',
        status: 'verified',
        verifiedByName: 'Eduardo Lovo',
        verifiedAt: '2026-09-04T14:32:00.000Z'
      },
      {
        id: 'req_dimensions',
        label: 'Print dimensions match exact 6x9 postcard specs with 0.125in bleed',
        status: 'needs_correction',
        note: 'Back page bleed was 0.08in; re-exporting at 0.125in'
      },
      {
        id: 'req_resolution',
        label: 'High-resolution assets used (strictly 300 DPI CMYK for print)',
        status: 'not_reviewed'
      },
      {
        id: 'req_mailing',
        label: 'EDDM postal permit indicia and clear mailing zone clearance',
        status: 'not_applicable',
        note: 'Direct hand-distribution at broker open house'
      }
    ],
    internalFlags: [],
    proofHistory: [
      {
        version: 1,
        proofUrl: 'https://storage.googleapis.com/shapework-proofs/landfall_postcard_v1.pdf',
        uploadedBy: 'Eduardo Lovo',
        uploadedAt: '2026-09-04T14:00:00.000Z',
        notes: 'Initial 300 DPI CMYK layout for review'
      }
    ],
    reviewHistory: [
      {
        version: 1,
        action: 'proof_submitted',
        reviewerName: 'Eduardo Lovo',
        feedbackNotes: 'Proof v1 submitted to manager for review.',
        timestamp: '2026-09-04T14:05:00.000Z'
      }
    ]
  };

  const sampleDrawerTaskEmptyPhotos: WorkspaceDrawerTask = {
    ...sampleDrawerTaskPhotos,
    id: 'task_empty_photos_001',
    photos: [],
    internalFlags: []
  };

  const sampleDrawerTaskMattOrr: WorkspaceDrawerTask = {
    ...sampleDrawerTaskPhotos,
    id: 'VA-008',
    agentName: 'Matt Orr',
    agentRole: 'Broker',
    agentPhone: '(910) 612-8283',
    agentEmail: 'matt.orr@nestrealty.com',
    requesterId: 'dir_matt_orr_10',
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    propertyAddress: '100 Matt Way, Wilmington, NC 28403'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans">
      <div className="max-w-7xl mx-auto mb-4 p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="font-semibold text-emerald-400">
          Task Detail Visual Verification Harness — Scenario: <span className="text-white font-mono">{scenario}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['manager-collapsed', 'manager-expanded', 'manager-signage', 'manager-tech', 'manager-marketing', 'assignee-brief', 'assignee-photos', 'assignee-empty-photos', 'assignee-work-checklist', 'assignee-history', 'narrow-mobile', 'ask-agent-drawer', 'ask-agent-dialog', 'ask-agent-unverified-email', 'ask-agent-rejected-hotline', 'ask-agent-duplicate-warning', 'ask-agent-mobile'].map(s => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${scenario === s ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER MANAGER MODAL SCENARIOS */}
      {(scenario === 'manager-collapsed' || scenario === 'manager-expanded') && (
        <TaskRequestDetailModal
          isOpen={true}
          request={sampleRequest}
          selectedTask={sampleManagerTaskMarketing}
          tasks={[sampleManagerTaskMarketing]}
          onClose={() => {}}
        />
      )}

      {scenario === 'manager-signage' && (
        <TaskRequestDetailModal
          isOpen={true}
          request={{ ...sampleRequest, category: 'signage', title: '1916 Walcott Ave Sign Post Installation' }}
          selectedTask={sampleManagerTaskSignage}
          tasks={[sampleManagerTaskSignage]}
          onClose={() => {}}
        />
      )}

      {scenario === 'manager-tech' && (
        <TaskRequestDetailModal
          isOpen={true}
          request={{ ...sampleRequest, category: 'tech', title: 'Follow Up Boss Broker Provisioning' }}
          selectedTask={sampleManagerTaskTech}
          tasks={[sampleManagerTaskTech]}
          onClose={() => {}}
        />
      )}

      {scenario === 'manager-marketing' && (
        <TaskRequestDetailModal
          isOpen={true}
          request={sampleRequest}
          selectedTask={sampleManagerTaskMarketing}
          tasks={[sampleManagerTaskMarketing]}
          onClose={() => {}}
        />
      )}

      {/* RENDER ASSIGNEE DRAWER SCENARIOS */}
      {scenario === 'assignee-brief' && (
        <WorkspaceTaskDrawer
          isOpen={true}
          task={sampleDrawerTaskPhotos}
          initialTab="brief"
          currentUserName="Eduardo Lovo"
          currentUserRole="virtual_assistant"
          currentUserId="staff_eduardo_lovo"
          onClose={() => {}}
        />
      )}

      {scenario === 'assignee-photos' && (
        <WorkspaceTaskDrawer
          isOpen={true}
          task={sampleDrawerTaskPhotos}
          initialTab="source"
          currentUserName="Eduardo Lovo"
          currentUserRole="virtual_assistant"
          currentUserId="staff_eduardo_lovo"
          onClose={() => {}}
        />
      )}

      {scenario === 'assignee-empty-photos' && (
        <WorkspaceTaskDrawer
          isOpen={true}
          task={sampleDrawerTaskEmptyPhotos}
          initialTab="source"
          currentUserName="Eduardo Lovo"
          currentUserRole="virtual_assistant"
          currentUserId="staff_eduardo_lovo"
          onClose={() => {}}
        />
      )}

      {scenario === 'assignee-work-checklist' && (
        <WorkspaceTaskDrawer
          isOpen={true}
          task={sampleDrawerTaskPhotos}
          initialTab="work"
          currentUserName="Eduardo Lovo"
          currentUserRole="virtual_assistant"
          currentUserId="staff_eduardo_lovo"
          onClose={() => {}}
        />
      )}

      {scenario === 'assignee-history' && (
        <WorkspaceTaskDrawer
          isOpen={true}
          task={sampleDrawerTaskPhotos}
          initialTab="history"
          currentUserName="Eduardo Lovo"
          currentUserRole="virtual_assistant"
          currentUserId="staff_eduardo_lovo"
          onClose={() => {}}
        />
      )}

      {scenario === 'narrow-mobile' && (
        <div className="max-w-[390px] mx-auto border-x border-slate-700 bg-white min-h-screen">
          <WorkspaceTaskDrawer
            isOpen={true}
            task={sampleDrawerTaskPhotos}
            initialTab="brief"
            currentUserName="Eduardo Lovo"
            currentUserRole="virtual_assistant"
            currentUserId="staff_eduardo_lovo"
            onClose={() => {}}
          />
        </div>
      )}

      {scenario === 'ask-agent-drawer' && (
        <WorkspaceTaskDrawer
          isOpen={true}
          task={sampleDrawerTaskMattOrr}
          initialTab="brief"
          currentUserName="Eduardo Lovo"
          currentUserRole="virtual_assistant"
          currentUserId="staff_eduardo_lovo"
          onAskRequester={() => setScenario('ask-agent-dialog')}
          onClose={() => {}}
        />
      )}

      {scenario === 'ask-agent-dialog' && (
        <AskRequesterQuestionsModal
          isOpen={true}
          campaign={sampleDrawerTaskMattOrr}
          onClose={() => setScenario('ask-agent-drawer')}
          isOutboundEnabled={false}
        />
      )}

      {scenario === 'ask-agent-unverified-email' && (
        <AskRequesterQuestionsModal
          isOpen={true}
          campaign={{
            id: 'camp_unverified_email',
            agentName: 'Unverified Requester',
            phone: '(910) 612-8283',
            email: null,
            agentRole: 'Listing Specialist',
            propertyAddress: '100 Matt Way, Wilmington, NC 28403'
          }}
          onClose={() => setScenario('ask-agent-drawer')}
          isOutboundEnabled={false}
        />
      )}

      {scenario === 'ask-agent-rejected-hotline' && (
        <AskRequesterQuestionsModal
          isOpen={true}
          campaign={{
            id: 'camp_hotline_rejected',
            agentName: 'Unknown Agent',
            phone: '(910) 507-2047',
            email: 'agent@nestrealty.com',
            agentRole: 'Broker',
            propertyAddress: '100 Matt Way, Wilmington, NC 28403'
          }}
          onClose={() => setScenario('ask-agent-drawer')}
          isOutboundEnabled={false}
        />
      )}

      {scenario === 'ask-agent-duplicate-warning' && (
        <AskRequesterQuestionsModal
          isOpen={true}
          campaign={sampleDrawerTaskMattOrr}
          onClose={() => setScenario('ask-agent-drawer')}
          recentOutreach={{
            timestamp: new Date().toISOString(),
            channel: 'email',
            relativeTime: '15 minutes ago'
          }}
          isOutboundEnabled={false}
        />
      )}

      {scenario === 'ask-agent-mobile' && (
        <div className="max-w-[390px] mx-auto min-h-screen">
          <AskRequesterQuestionsModal
            isOpen={true}
            campaign={sampleDrawerTaskMattOrr}
            onClose={() => setScenario('ask-agent-drawer')}
            isOutboundEnabled={false}
          />
        </div>
      )}
    </div>
  );
}
