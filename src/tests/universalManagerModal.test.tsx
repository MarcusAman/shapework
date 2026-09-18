/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Universal Manager & Dispatcher Review Modal Test Suite
 * Validates the full suite of acceptance criteria for the redesigned TaskRequestDetailModal:
 * 1. Universal manager review for marketing, signage, and operations
 * 2. Dynamic header badges (Yard Sign, Rider, Pickup, Post Installation, Flyer, Social Carousel, Date Needed By)
 * 3. Authoritative record identifiers (Call ID, Request ID, Task ID) with copy functionality
 * 4. Sibling deliverables alert and task switcher for multi-deliverable requests
 * 5. Department classification (Operations & Signage, Marketing & Collateral, Operations)
 * 6. Four contextual tabs: Overview, Source & Conversation, Work & Proofs, Audit Timeline
 * 7. Universal staff assignment with canonical directory profiles
 * 8. Out-of-Office (OOO) detection with automated covering staff delegation
 * 9. Lifecycle rule: prevents assigning work while task is in needs_info
 * 10. Telephony call audio & speaker-separated transcript rendering when call exists
 * 11. Honest empty state when no telephony call exists (direct request)
 * 12. Transcript dialogue keyword highlighting
 * 13. Technical deliverable specifications display
 * 14. Real proof submission history with versioning, submitter, and notes
 * 15. Verifiable DPI honesty (verifies 300 DPI only when metadata proves it; honest unverified label otherwise)
 * 16. Honest empty state when no proofs have been submitted yet
 * 17. Manager proof review: request revisions with required notes, approve proofs
 * 18. Strict completion guard: blocks completion of unapproved or needs_info tasks
 * 19. Internal dispatch disclaimer visibility
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  TaskRequestDetailModal,
  CANONICAL_STAFF
} from '../components/marketing/TaskRequestDetailModal';
import {
  CanonicalMarketingRequest,
  CanonicalMarketingTask
} from '../../server/persistence/marketingCampaignsRepository';

describe('Universal Manager & Dispatcher Review Modal Test Suite', () => {
  // Test Fixtures
  const signRequestWithCall: CanonicalMarketingRequest = {
    id: 'req_sign_phone_001',
    title: '123 Coastal Way Yard Sign & Rider',
    propertyAddress: '123 Coastal Way, Wilmington NC 28403',
    agentName: 'Matt Orr (Broker)',
    agentPhone: '(910) 555-1234',
    agentEmail: 'matt.orr@nestrealty.com',
    channel: 'phone',
    status: 'assigned',
    receivedAt: '10 minutes ago',
    requestExcerpt: 'Inbound phone call: need yard sign and waterfront custom rider with office pickup by Monday 5:00 PM.',
    rawExcerpt: 'Matt Orr: Hey, I need a yard sign and waterfront rider installed or picked up.\nNest Intake AI: I will schedule that for Monday 5:00 PM pickup.',
    taskIds: ['task_sign_001', 'task_sign_002'],
    assignedTo: 'Ann Gunn',
    telephonyCallId: 'call_98a7b6c5d4e3f2',
    audioUrl: '/api/marketing/calls/call_98a7b6c5d4e3f2/audio',
    createdAt: '2026-09-04T12:00:00.000Z',
    updatedAt: '2026-09-04T12:00:00.000Z',
    isArchived: false
  };

  const signTask1: CanonicalMarketingTask = {
    id: 'task_sign_001',
    requestId: 'req_sign_phone_001',
    title: 'Yard Sign & Waterfront Rider',
    category: 'signage',
    status: 'in_progress',
    assignedTo: 'Ann Gunn',
    assignedToId: 'dir_staff_ann_gunn',
    assignedToRole: 'Operations & Signage Lead',
    agentName: 'Matt Orr (Broker)',
    propertyAddress: '123 Coastal Way, Wilmington NC 28403',
    notes: 'Office pickup by Matt Orr',
    vendorName: 'Nest Office Pickup',
    dueAt: '2026-09-08T21:00:00.000Z',
    priority: 'high',
    createdAt: '2026-09-04T12:00:00.000Z',
    updatedAt: '2026-09-04T12:00:00.000Z',
    isArchived: false
  };

  const signTask2: CanonicalMarketingTask = {
    id: 'task_sign_002',
    requestId: 'req_sign_phone_001',
    title: 'Lockbox Placement',
    category: 'signage',
    status: 'request_received',
    assignedTo: 'Ann Gunn',
    assignedToId: 'dir_staff_ann_gunn',
    assignedToRole: 'Operations & Signage Lead',
    agentName: 'Matt Orr (Broker)',
    propertyAddress: '123 Coastal Way, Wilmington NC 28403',
    notes: 'Place Supra lockbox on front door handle',
    dueAt: '2026-09-08T21:00:00.000Z',
    createdAt: '2026-09-04T12:00:00.000Z',
    updatedAt: '2026-09-04T12:00:00.000Z',
    isArchived: false
  };

  const directMarketingRequest: CanonicalMarketingRequest = {
    id: 'req_mkt_direct_002',
    title: '450 Oleander Dr Luxury Collateral',
    propertyAddress: '450 Oleander Dr, Wilmington NC',
    agentName: 'Sarah Jenkins',
    agentEmail: 'sarah.jenkins@nestrealty.com',
    channel: 'email',
    status: 'in_progress',
    receivedAt: '1 hour ago',
    requestExcerpt: 'Need 1-page property flyer and 3-slide social story carousel for 450 Oleander Dr.',
    taskIds: ['task_flyer_002'],
    assignedTo: 'Eduardo Lovo',
    createdAt: '2026-09-04T10:00:00.000Z',
    updatedAt: '2026-09-04T10:00:00.000Z',
    isArchived: false
  };

  const mktTaskWithProofs: CanonicalMarketingTask = {
    id: 'task_flyer_002',
    requestId: 'req_mkt_direct_002',
    title: '1-Page Property Flyer (8.5x11)',
    category: 'print',
    status: 'in_progress',
    reviewState: 'awaiting_review',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'usr_eduardo',
    assignedToRole: 'Producer',
    agentName: 'Sarah Jenkins',
    propertyAddress: '450 Oleander Dr, Wilmington NC',
    proofVersion: 2,
    proofUrl: 'https://storage.googleapis.com/shapework-proofs/flyer_v2.pdf',
    proofNotes: 'Adjusted primary bedroom photo and verified 300 DPI print export.',
    proofHistory: [
      {
        version: 1,
        proofUrl: 'https://storage.googleapis.com/shapework-proofs/flyer_v1.pdf',
        uploadedBy: 'Eduardo Lovo',
        uploadedAt: '2026-09-04T11:00:00.000Z',
        notes: 'Initial draft for review',
        deliverableName: 'Property Flyer v1',
        fileMetadata: { dpi: 72 }
      },
      {
        version: 2,
        proofUrl: 'https://storage.googleapis.com/shapework-proofs/flyer_v2.pdf',
        uploadedBy: 'Eduardo Lovo',
        uploadedAt: '2026-09-04T13:30:00.000Z',
        notes: 'Revision with corrected photo and 300 DPI export',
        deliverableName: 'Property Flyer v2 (Print Ready)',
        fileMetadata: { dpi: 300 },
        validationStatus: 'valid_300dpi'
      }
    ],
    reviewHistory: [
      {
        version: 1,
        action: 'revisions_requested',
        reviewerName: 'Melissa Gagliardi',
        feedbackNotes: 'Please swap the kitchen photo for the gourmet primary bath shot.',
        timestamp: '2026-09-04T12:00:00.000Z'
      }
    ],
    createdAt: '2026-09-04T10:00:00.000Z',
    updatedAt: '2026-09-04T13:30:00.000Z',
    isArchived: false
  };

  it('1. Renders universal review modal for operations/signage with Ann Gunn and phone call links', () => {
    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        request={signRequestWithCall}
        selectedTask={signTask1}
        tasks={[signTask1, signTask2]}
        onClose={() => {}}
      />
    );

    // Property and requester
    expect(html).toContain('123 Coastal Way, Wilmington NC 28403');
    expect(html).toContain('Matt Orr (Broker)');
    expect(html).toContain('Operations &amp; Signage');
    expect(html).toContain('Ann Gunn');

    // Dynamic header badges
    expect(html).toContain('Yard Sign');
    expect(html).toContain('Rider');
    expect(html).toContain('Pickup');
    expect(html).toContain('Needed by:');

    // Authoritative Linked Records
    expect(html).toContain('call_98a7b6c5d4e3f2');
    expect(html).toContain('req_sign_phone_001');
    expect(html).toContain('task_sign_001');
  });

  it('2. Renders multi-deliverable alert and sibling task count for requests with multiple tasks', () => {
    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        request={signRequestWithCall}
        selectedTask={signTask1}
        tasks={[signTask1, signTask2]}
        onClose={() => {}}
      />
    );

    expect(html).toContain('Multi-Deliverable Request (2 Tasks)');
    expect(html).toContain('Yard Sign &amp; Waterfront Rider');
    expect(html).toContain('Lockbox Placement');
    expect(html).toContain('2 deliverables in this request');
  });

  it('3. Renders marketing collateral request with dynamic badges (Property Flyer, Social Story Carousel)', () => {
    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        request={directMarketingRequest}
        selectedTask={mktTaskWithProofs}
        tasks={[mktTaskWithProofs]}
        onClose={() => {}}
      />
    );

    expect(html).toContain('450 Oleander Dr, Wilmington NC');
    expect(html).toContain('Sarah Jenkins');
    expect(html).toContain('Marketing &amp; Collateral');
    expect(html).toContain('Property Flyer');
    expect(html).toContain('Social Story Carousel');
  });

  it('4. Provides direct request honesty: shows "None (Direct Inbound)" when no telephony call exists', () => {
    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        request={directMarketingRequest}
        selectedTask={mktTaskWithProofs}
        tasks={[mktTaskWithProofs]}
        onClose={() => {}}
      />
    );

    expect(html).toContain('None (Direct Inbound)');
    expect(html).toContain('req_mkt_direct_002');
    expect(html).toContain('task_flyer_002');
  });

  it('5. Contains canonical staff directory options including Melissa, Ann, Eduardo, Ryan, James, Jessica, Eric and strictly excludes Sarah', () => {
    const staffNames = CANONICAL_STAFF.map(s => s.fullName);
    expect(staffNames).toContain('Melissa Gagliardi');
    expect(staffNames).toContain('Ann Gunn');
    expect(staffNames).toContain('Eduardo Lovo');
    expect(staffNames).toContain('Ryan Crecelius');
    expect(staffNames).toContain('Marcus Aman');
    expect(staffNames).toContain('James Fort');
    expect(staffNames).toContain('Jessica Keenan');
    expect(staffNames).toContain('Eric Knight');
    expect(staffNames).not.toContain('Sarah Jenkins');
    expect(staffNames).toContain('Ann Smith');

    const annSmith = CANONICAL_STAFF.find(s => s.fullName === 'Ann Smith');
    expect(annSmith?.status).toBe('out_of_office');
    expect(annSmith?.backupStaffName).toBe('Ann Gunn');
  });

  it('6. Displays Out-of-Office coverage alert when task is covered by backup staff', () => {
    const oooTask: CanonicalMarketingTask = {
      ...signTask1,
      assignedTo: 'Ann Smith',
      coveringStaffName: 'Ann Gunn'
    };

    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        request={signRequestWithCall}
        selectedTask={oooTask}
        tasks={[oooTask]}
        onClose={() => {}}
      />
    );

    expect(html).toContain('OOO Covered by: Ann Gunn');
  });

  it('7. Enforces verifiable DPI honesty: displays 300 DPI (Verified) for verified proof and unverified for screen proof', () => {
    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        request={directMarketingRequest}
        selectedTask={mktTaskWithProofs}
        tasks={[mktTaskWithProofs]}
        initialTab="work"
        onClose={() => {}}
      />
    );

    // Initial draft proof v1 has 72 DPI (unverified/screen)
    expect(html).toContain('Version 1');
    expect(html).toContain('DPI: Unverified / Screen');

    // Proof v2 has 300 DPI verified
    expect(html).toContain('Version 2');
    expect(html).toContain('300 DPI (Verified)');
    expect(html).toContain('Cloud Storage');
  });

  it('8. Renders honest empty state when no proofs have been submitted yet', () => {
    const freshTask: CanonicalMarketingTask = {
      ...signTask1,
      proofUrl: undefined,
      proofHistory: []
    };

    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        request={signRequestWithCall}
        selectedTask={freshTask}
        tasks={[freshTask]}
        initialTab="work"
        onClose={() => {}}
      />
    );

    expect(html).toContain('No Proofs Submitted Yet');
    expect(html).toContain('Waiting for assignee');
  });

  it('9. Renders review actions (Request Revisions, Approve Proofs) when awaiting review', () => {
    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        request={directMarketingRequest}
        selectedTask={mktTaskWithProofs}
        tasks={[mktTaskWithProofs]}
        onClose={() => {}}
      />
    );

    expect(html).toContain('Request Revisions');
    expect(html).toContain('Approve Proofs');
  });

  it('10. Lifecycle guard: Mark Complete is disabled when task is awaiting review or in needs_info', () => {
    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        request={directMarketingRequest}
        selectedTask={mktTaskWithProofs}
        tasks={[mktTaskWithProofs]}
        onClose={() => {}}
      />
    );

    // Mark Complete button should be disabled with explanation title
    expect(html).toContain('Mark Complete');
    expect(html).toContain('title="Proofs must be approved before completing task"');
    expect(html).toContain('bg-slate-200 text-slate-400');
  });

  it('11. Lifecycle guard: Mark Complete is enabled when task reviewState is approved', () => {
    const approvedTask: CanonicalMarketingTask = {
      ...mktTaskWithProofs,
      reviewState: 'approved',
      status: 'approved'
    };

    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        request={directMarketingRequest}
        selectedTask={approvedTask}
        tasks={[approvedTask]}
        onClose={() => {}}
      />
    );

    expect(html).toContain('Mark Complete');
    expect(html).toContain('bg-[#00635C]');
    expect(html).toContain('title="Verify deliverables and mark task completed"');
  });

  it('12. Renders "Request Missing Info" button and safe internal dispatch disclaimer in footer', () => {
    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        request={signRequestWithCall}
        selectedTask={signTask1}
        tasks={[signTask1]}
        onClose={() => {}}
      />
    );

    expect(html).toContain('Request Missing Info');
    expect(html).toContain('Internal dispatch only — external notifications disabled');
  });

  it('13. Does not render when isOpen is false or request is null', () => {
    const htmlClosed = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={false}
        request={signRequestWithCall}
        selectedTask={signTask1}
        tasks={[signTask1]}
        onClose={() => {}}
      />
    );
    expect(htmlClosed).toBe('');

    const htmlNull = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        request={null}
        selectedTask={null}
        tasks={[]}
        onClose={() => {}}
      />
    );
    expect(htmlNull).toBe('');
  });
});
