/**
 * F-01 / F-02 regression: durable Eduardo→Melissa handoff + director self-complete CTA.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { isTaskInMemberWorkspace, resolveCanonicalStaffMember } from '../services/canonicalRoster';
import { WorkspaceTaskDrawer, WorkspaceDrawerTask } from '../components/marketing/WorkspaceTaskDrawer';

function baseTask(overrides: Partial<WorkspaceDrawerTask> = {}): WorkspaceDrawerTask {
  return {
    id: 'task_nest_fix_001',
    campaignId: 'camp_nest_fix_001',
    propertyAddress: '124 Brightwood Ln, Wilmington, NC 28409',
    agentName: 'Ryan Crecelius',
    agentPhone: '(910) 392-4100',
    agentEmail: 'ryan@nestrealty.com',
    agentRole: 'Managing Broker',
    packageType: 'Tri-fold Brochure',
    priority: 'normal',
    status: 'in_progress',
    reviewState: undefined,
    proofVersion: 0,
    targetSla: 'Deadline not specified',
    receivedAt: 'Today',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'dir_eduardo_lovo_73',
    assignedToRole: 'Virtual Assistant / Production Specialist',
    reviewOwnerId: 'dir_melissa_gagliardi_33',
    reviewOwnerName: 'Melissa Gagliardi',
    proofUrl: '',
    proofNotes: '',
    proofHistory: [],
    requestedAssets: [{ name: 'Tri-fold Brochure', format: 'PDF', dimensions: 'tri-fold' }],
    listingDetails: {
      price: '$450,000',
      bedsBaths: '3 Beds / 2 Baths',
      sqft: '1,800 SqFt',
      headline: 'Brightwood Open House',
      description: 'Test listing',
      disclosures: 'Nest Realty',
      mlsNumber: 'MLS #100',
      licenseNumber: 'NC Broker #1'
    },
    photos: [],
    sopCode: 'SOP-MKT-001',
    sopTitle: 'Collateral',
    category: 'print',
    ...overrides
  } as WorkspaceDrawerTask;
}

describe('Nest F-01 handoff visibility', () => {
  it('includes Eduardo-submitted task in Melissa workspace while Eduardo remains assignee', () => {
    const melissa = resolveCanonicalStaffMember('dir_melissa_gagliardi_33')!;
    const eduardo = resolveCanonicalStaffMember('dir_eduardo_lovo_73')!;
    const submitted = baseTask({
      status: 'in_progress',
      reviewState: 'awaiting_review',
      proofVersion: 1,
      proofUrl: 'https://drive.google.com/drive/folders/nest_brightwood_proof'
    });

    expect(isTaskInMemberWorkspace(submitted, melissa)).toBe(true);
    expect(isTaskInMemberWorkspace(submitted, eduardo)).toBe(true);
    expect(submitted.assignedTo).toBe('Eduardo Lovo');
    expect(submitted.assignedToId).toBe('dir_eduardo_lovo_73');
    expect(submitted.reviewOwnerId).toBe('dir_melissa_gagliardi_33');
  });

  it('does not treat archived submissions as live review work', () => {
    const melissa = resolveCanonicalStaffMember('dir_melissa_gagliardi_33')!;
    const archived = baseTask({
      status: 'archived',
      isArchived: true,
      reviewState: 'awaiting_review',
      proofVersion: 1,
      proofUrl: 'https://drive.google.com/drive/folders/x'
    } as any);
    expect(isTaskInMemberWorkspace(archived, melissa)).toBe(false);
  });
});

describe('Nest F-02 director self-complete CTA', () => {
  it('shows Approve and Send to Agent for Melissa on her own In Progress task (not Send to Manager)', () => {
    const task = baseTask({
      assignedTo: 'Melissa Gagliardi',
      assignedToId: 'dir_melissa_gagliardi_33',
      status: 'in_progress',
      proofUrl: 'https://drive.google.com/drive/folders/melissa_trifold',
      proofVersion: 1,
      proofHistory: [{
        version: 1,
        proofUrl: 'https://drive.google.com/drive/folders/melissa_trifold',
        uploadedBy: 'Melissa Gagliardi',
        uploadedById: 'dir_melissa_gagliardi_33',
        uploadedAt: new Date().toISOString(),
        notes: 'Self-produced'
      }]
    });

    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={task}
        onClose={() => {}}
        currentUser={{
          id: 'dir_melissa_gagliardi_33',
          name: 'Melissa Gagliardi',
          role: 'marketing_director',
          email: 'melissa@nestrealty.com',
          permissions: ['marketing.final_approval', 'marketing.approve']
        }}
      />
    );

    expect(html).toContain('Approve &amp; Notify Agent');
    expect(html).not.toContain('Send for review');
  });

  it('keeps Send for review for Eduardo producer', () => {
    const task = baseTask({
      proofUrl: 'https://drive.google.com/drive/folders/eduardo_proof',
      proofVersion: 1,
      proofHistory: [{
        version: 1,
        proofUrl: 'https://drive.google.com/drive/folders/eduardo_proof',
        uploadedBy: 'Eduardo Lovo',
        uploadedById: 'dir_eduardo_lovo_73',
        uploadedAt: new Date().toISOString()
      }]
    });

    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={task}
        onClose={() => {}}
        currentUser={{
          id: 'dir_eduardo_lovo_73',
          name: 'Eduardo Lovo',
          role: 'producer',
          email: 'eduardo.lovo@nestrealty.com',
          permissions: ['marketing.create', 'marketing.edit']
        }}
      />
    );

    expect(html).toContain('Send for review');
    expect(html).not.toContain('Approve and Send to Agent');
  });

  it('does not default missing currentUser to Eduardo producer identity', () => {
    const task = baseTask({
      assignedTo: 'Melissa Gagliardi',
      assignedToId: 'dir_melissa_gagliardi_33',
      proofUrl: 'https://drive.google.com/drive/folders/x',
      proofVersion: 1
    });

    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer isOpen={true} activeTask={task} onClose={() => {}} />
    );

    // Guest / viewer fallback must not present producer submit CTA as if Eduardo.
    expect(html).not.toContain('Send for review');
  });
});
