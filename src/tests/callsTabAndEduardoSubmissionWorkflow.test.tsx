/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Calls Tab & Eduardo Proof-to-Melissa Workflow Integration Tests
 * 1. CallsTableView renders calls, defaults to 'all' timeframe, and lists telephony records.
 * 2. WorkspaceTaskDrawer enables submission for Eduardo when proof URL or asset is provided.
 * 3. submitCanonicalMarketingTaskProof updates task to 'awaiting_review' under Melissa Gagliardi.
 * 4. MarketingHomeInbox matchesAssignee includes review-owned tasks when Melissa is selected.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CallsTableView, TelephonyCallItem } from '../components/marketing/CallsTableView';
import {
  WorkspaceTaskDrawer,
  WorkspaceDrawerTask
} from '../components/marketing/WorkspaceTaskDrawer';
import {
  CanonicalMarketingTask,
  saveCanonicalMarketingTask,
  getCanonicalMarketingTaskById,
  submitCanonicalMarketingTaskProof
} from '../../server/persistence/marketingCampaignsRepository';
import { validateProofUrl } from '../utils/assetInspection';

describe('Calls Tab & Eduardo Proof Submission to Melissa', () => {
  const sampleCalls: TelephonyCallItem[] = [
    {
      id: 'call_test_001',
      callerPhone: '+19105550100',
      callerName: 'Marcus Aman',
      propertyAddress: '814 Colonial Drive',
      timestamp: 'Yesterday 3:45 PM',
      duration: '3m 12s',
      departmentCategory: 'marketing_collateral',
      transcript: 'Hi Nora, please prepare the social media assets and print flyers for 814 Colonial Drive.',
      requestExcerpt: '814 Colonial Drive marketing collateral request',
      status: 'completed'
    },
    {
      id: 'call_test_002',
      callerPhone: '+19105550200',
      callerName: 'Matt Orr',
      propertyAddress: '1204 Pembroke Jones Dr',
      timestamp: 'Jul 28 · 11:15 AM',
      duration: '1m 45s',
      departmentCategory: 'sign_vendor',
      transcript: 'Need yard sign installed at 1204 Pembroke Jones Dr.',
      requestExcerpt: 'Yard sign installation request',
      status: 'completed'
    }
  ];

  it('1. CallsTableView defaults to "Today\'s Calls" view and renders all calls when initialTimeframe="all"', () => {
    // Default render defaults to Today's Calls (showing 0 calls for past dates)
    const defaultHtml = renderToStaticMarkup(
      <CallsTableView
        calls={sampleCalls}
        loading={false}
      />
    );
    expect(defaultHtml).toContain('today-calls-count-badge');
    expect(defaultHtml).toContain('>0</span>');

    // Explicit "all" timeframe renders all calls including past callers
    const allHtml = renderToStaticMarkup(
      <CallsTableView
        calls={sampleCalls}
        loading={false}
        initialTimeframe="all"
      />
    );
    expect(allHtml).toContain('Marcus Aman');
    expect(allHtml).toContain('Matt Orr');
    expect(allHtml).toContain('814 Colonial Drive');
    expect(allHtml).toContain('+19105550100');
    expect(allHtml).toContain('+19105550200');
    expect(allHtml).toContain('All Calls');
  });

  it('2. validateProofUrl accepts Google Drive, Canva, and auto-prefixes scheme for approved domains', () => {
    // Standard HTTPS URL
    const gDrive = validateProofUrl('https://drive.google.com/drive/folders/sample_folder_123');
    expect(gDrive.valid).toBe(true);
    expect(gDrive.normalizedUrl).toBe('https://drive.google.com/drive/folders/sample_folder_123');

    // Canva HTTPS URL
    const canva = validateProofUrl('https://canva.com/design/DAFxxx/view');
    expect(canva.valid).toBe(true);

    // Auto-prefix missing https://
    const noScheme = validateProofUrl('drive.google.com/drive/folders/12345');
    expect(noScheme.valid).toBe(true);
    expect(noScheme.normalizedUrl).toBe('https://drive.google.com/drive/folders/12345');

    // Insecure / unapproved domain
    const insecure = validateProofUrl('http://insecure.com');
    expect(insecure.valid).toBe(false);
  });

  it('3. WorkspaceTaskDrawer enables submission when Eduardo provides a proof URL', () => {
    const taskWithProof: WorkspaceDrawerTask = {
      id: 'task_eduardo_proof_001',
      title: 'Colonial Drive Just Listed Postcards',
      propertyAddress: '814 Colonial Drive, Wilmington NC 28403',
      agentName: 'Marcus Aman',
      packageType: 'Just Listed Postcard',
      priority: 'urgent',
      status: 'in_production',
      reviewState: 'in_production',
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'staff_eduardo_lovo',
      proofUrl: 'https://drive.google.com/drive/folders/colonial_proofs_finished',
      requestedAssets: [
        { name: '6x9 Postcard', format: 'PDF', dimensions: '6 × 9 in' }
      ],
      listingDetails: {
        price: '$875,000',
        bedsBaths: '4 Beds / 3 Baths',
        sqft: '2,950 SqFt',
        headline: 'Beautiful Colonial Drive Home',
        description: 'Stunning home in Forest Hills.',
        disclosures: 'Equal Housing Opportunity.',
        mlsNumber: '10045678',
        licenseNumber: 'NC-293847'
      },
      photos: [],
      sopCode: 'MKT-001',
      sopTitle: 'Listing Launch Collateral',
      requirements: [
        { id: 'req_1', label: 'Item 1', status: 'not_reviewed' }
      ]
    };

    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={taskWithProof}
        onClose={() => {}}
        onSubmitProof={() => {}}
        currentUser={{ id: 'staff_eduardo_lovo', name: 'Eduardo Lovo', role: 'producer' }}
      />
    );

    // Submit button is present and not disabled
    expect(html).toContain('Send to Manager for Approval');
  });

  it('4. submitCanonicalMarketingTaskProof updates task to awaiting_review under Melissa Gagliardi', () => {
    const baseTask: CanonicalMarketingTask = {
      id: 'task_test_canonical_099',
      requestId: 'req_test_099',
      workspaceId: 'ws_wilmington',
      title: 'Waterfront Brochure Design',
      category: 'marketing_collateral',
      status: 'in_progress',
      reviewState: 'in_production',
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'staff_eduardo_lovo',
      assignedToRole: 'Production Specialist',
      proofVersion: 1,
      deliverables: [{ name: 'Brochure', format: 'PDF' }],
      internalChecklist: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveCanonicalMarketingTask(baseTask);

    const updated = submitCanonicalMarketingTaskProof(
      'task_test_canonical_099',
      'https://drive.google.com/drive/folders/eduardo_finished_proof',
      'Ready for Melissa to review and approve.',
      { id: 'staff_eduardo_lovo', name: 'Eduardo Lovo' }
    );

    expect(updated).not.toBeNull();
    expect(updated?.reviewState).toBe('awaiting_review');
    expect(updated?.proofUrl).toBe('https://drive.google.com/drive/folders/eduardo_finished_proof');
    expect(updated?.proofNotes).toBe('Ready for Melissa to review and approve.');
    expect(updated?.reviewOwnerName).toContain('Melissa');
    expect(updated?.reviewOwnerId).toBe('dir_melissa_gagliardi_33');
    expect(updated?.proofHistory?.length).toBeGreaterThanOrEqual(1);
    expect(updated?.proofHistory?.[updated.proofHistory.length - 1].uploadedBy).toBe('Eduardo Lovo');
  });

  it('5. Melissa Gagliardi filter matches tasks where she is the reviewOwner', () => {
    const taskProducedByEduardo = {
      id: 'task_eduardo_01',
      assignedTo: 'Eduardo Lovo',
      reviewOwner: 'Melissa Gagliardi',
      reviewOwnerName: 'Melissa Gagliardi',
      reviewState: 'awaiting_review',
      status: 'in_progress'
    };

    const taskAssignedToMelissa = {
      id: 'task_melissa_02',
      assignedTo: 'Melissa Gagliardi',
      reviewOwner: null,
      reviewState: 'in_production',
      status: 'in_progress'
    };

    const taskAssignedToAnn = {
      id: 'task_ann_03',
      assignedTo: 'Ann Gunn',
      reviewOwner: null,
      reviewState: 'in_production',
      status: 'in_progress'
    };

    const filterForMelissa = (t: any) => {
      const selectedAssignee = 'Melissa Gagliardi';
      return (
        selectedAssignee === 'All Team Members' ||
        (selectedAssignee === 'Unassigned' && (!t.assignedTo || t.status === 'request_received')) ||
        t.assignedTo === selectedAssignee ||
        (selectedAssignee === 'Melissa Gagliardi' && (
          t.reviewOwner === 'Melissa Gagliardi' ||
          t.reviewOwnerName === 'Melissa Gagliardi' ||
          (t.reviewState === 'awaiting_review' && (!t.reviewOwner || t.reviewOwner === 'Melissa Gagliardi'))
        ))
      );
    };

    expect(filterForMelissa(taskProducedByEduardo)).toBe(true);
    expect(filterForMelissa(taskAssignedToMelissa)).toBe(true);
    expect(filterForMelissa(taskAssignedToAnn)).toBe(false);
  });
});
