/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Unit and Regression Test Suite for CanonicalTaskCard and Rebalanced Kanban Boards
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanonicalTaskCard } from '../components/marketing/CanonicalTaskCard';
import { MarketingHomeInbox } from '../components/marketing/MarketingHomeInbox';
import { VAWorkspaceView } from '../components/marketing/VAWorkspaceView';

describe('CanonicalTaskCard Component Tests', () => {
  const oleanderTask = {
    id: 'task_512_oleander',
    requestId: 'req_512_oleander',
    title: 'Need flyers printed ASAP',
    propertyAddress: '512 Oleander Dr, Wilmington, NC 28403',
    agentName: 'Ryan Crecelius',
    category: 'print',
    status: 'needs_info',
    assignedTo: 'Eduardo Lovo',
    assignedToId: 'dir_eduardo_lovo_73',
    neededByDate: '2026-09-27T00:00:00.000Z',
    mlsNumber: '10045678',
    printSpecs: {
      paperStock: 'Tri-fold Premium Matte',
      quantity: 55
    },
    vendorName: 'CopyCat Print',
    createdAt: '2026-09-05T20:03:09.978Z'
  };

  it('1. Makes property address primary headline and requested work secondary line', () => {
    const html = renderToStaticMarkup(
      <CanonicalTaskCard
        task={oleanderTask}
        primaryAction={{
          label: 'Take Task',
          onClick: () => {}
        }}
      />
    );

    // Primary headline is 512 Oleander Dr
    expect(html).toContain('512 Oleander Dr');
    // Quieter secondary address line
    expect(html).toContain('Wilmington, NC 28403');
    // Secondary line is requested work
    expect(html).toContain('Need flyers printed ASAP');

    // Does NOT contain old photo placeholder art or "Need Photos" strip
    expect(html).not.toContain('nest-realty-logo-white.svg');
    expect(html).not.toContain('Need Photos');
    // Does NOT contain unexplained timer pill
    expect(html).not.toContain('00:00:00:00');
    // Does NOT contain "No deadline"
    expect(html).not.toContain('No deadline');
    // Does NOT contain activity preview strips on the card face
    expect(html).not.toContain('Approval attempt blocked');
    expect(html).not.toContain('Triage resolved');
  });

  it('2. Renders specifications and clean needed-by date', () => {
    const html = renderToStaticMarkup(
      <CanonicalTaskCard
        task={oleanderTask}
      />
    );

    // Specs
    expect(html).toContain('Tri-fold Premium Matte');
    expect(html).toContain('55 copies');
    expect(html).toContain('CopyCat Print');

    // Needed by date
    expect(html).toContain('Needed Sep 27');

    // Copyable MLS number
    expect(html).toContain('10045678');
  });

  it('3. Completely omits photo container when no uploaded image exists (no empty boxes)', () => {
    const html = renderToStaticMarkup(
      <CanonicalTaskCard
        task={oleanderTask}
      />
    );

    // No <img> tag rendered when no photo exists
    expect(html).not.toContain('<img');
    // No green Nest box
    expect(html).not.toContain('bg-[#003831]');
  });

  it('4. Renders real thumbnail when actual uploaded photo exists (~40px)', () => {
    const taskWithPhoto = {
      ...oleanderTask,
      heroPhotoUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80'
    };

    const html = renderToStaticMarkup(
      <CanonicalTaskCard
        task={taskWithPhoto}
      />
    );

    expect(html).toContain('src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&amp;fit=crop&amp;w=400&amp;q=80"');
    expect(html).toContain('w-10 h-10');
  });

  it('5. Accurate image states: MLS retrieval badge when MLS exists without photos', () => {
    const html = renderToStaticMarkup(
      <CanonicalTaskCard
        task={oleanderTask}
      />
    );

    // MLS exists on task, so it shows neutral "Retrieve photos from MLS" instead of alarmist "Missing photos"
    expect(html).toContain('Retrieve photos from MLS');
  });

  it('6. Accurate image states: "Missing photos" badge when marketing task lacks photo AND lacks MLS (rendered exactly once, no duplicates)', () => {
    const taskNoMls = {
      ...oleanderTask,
      mlsNumber: undefined
    };

    const html = renderToStaticMarkup(
      <CanonicalTaskCard
        task={taskNoMls}
      />
    );

    // Renders "Missing photos" in the metadata row
    expect(html).toContain('Missing photos');
    // Count occurrences: strictly once, never duplicated in blocker box
    const matches = html.match(/Missing photos/g);
    expect(matches?.length).toBe(1);
  });

  it('7. Accurate image states: No missing photo badge when task is operational', () => {
    const operationalTask = {
      id: 'task_lockbox_01',
      title: 'Install Supra iBox lockbox',
      propertyAddress: '124 Market St',
      category: 'lockbox',
      domain: 'operations',
      status: 'assigned',
      assignedTo: 'Ann Gunn'
    };

    const html = renderToStaticMarkup(
      <CanonicalTaskCard
        task={operationalTask}
      />
    );

    expect(html).not.toContain('Missing photos');
    expect(html).not.toContain('Retrieve photos from MLS');
  });

  it('8. Consolidates multiple warnings into a single actionable blocker line', () => {
    const html = renderToStaticMarkup(
      <CanonicalTaskCard
        task={oleanderTask}
      />
    );

    // Blocker line present with count if multiple
    expect(html).toContain('Needs Information');
  });

  it('9. Omit deadline badge completely when no due date is provided', () => {
    const taskNoDeadline = {
      ...oleanderTask,
      neededByDate: undefined,
      dueAt: undefined,
      targetSla: undefined
    };

    const html = renderToStaticMarkup(
      <CanonicalTaskCard
        task={taskNoDeadline}
      />
    );

    expect(html).not.toContain('No deadline');
    expect(html).not.toContain('Needed');
  });

  it('10. Renders Nest green primary action button in footer', () => {
    const html = renderToStaticMarkup(
      <CanonicalTaskCard
        task={oleanderTask}
        primaryAction={{
          label: 'Start Work',
          onClick: () => {}
        }}
      />
    );

    expect(html).toContain('Start Work');
    expect(html).toContain('bg-[#00635C]');
    expect(html).toContain('Eduardo Lovo');
  });
});

describe('Rebalanced Fit-Board & Collapsible Columns Tests', () => {
  it('11. MarketingHomeInbox pipeline view renders Fit-board dynamic layout without hardcoded 340px columns', () => {
    const html = renderToStaticMarkup(
      <MarketingHomeInbox
        campaigns={[]}
        initialTasks={[{
          id: 'task_001',
          title: 'Need flyers printed ASAP',
          propertyAddress: '512 Oleander Dr, Wilmington, NC 28403',
          category: 'print',
          status: 'needs_info',
          assignedTo: 'Eduardo Lovo'
        } as any]}
        initialRequests={[]}
        onSelectCampaign={() => {}}
      />
    );

    expect(html).toContain('data-testid="pipeline-view"');
    // Confirms fixed 340px column width was removed in favor of dynamic width
    expect(html).not.toContain('w-[340px]');
    // Confirms column width style is dynamically computed
    expect(html).toContain('width:230px');
    expect(html).toContain('min-width:200px');
    expect(html).toContain('Collapse Intake Received');
  });

  it('12. VAWorkspaceView board view renders Fit-board dynamic layout without hardcoded 340px lanes', () => {
    const html = renderToStaticMarkup(
      <VAWorkspaceView
        tasks={[{
          id: 'task_va_001',
          title: 'Need flyers printed ASAP',
          propertyAddress: '512 Oleander Dr, Wilmington, NC 28403',
          packageType: 'Print Flyer',
          category: 'Marketing',
          status: 'needs_info',
          assignedTo: 'Eduardo Lovo',
          agentName: 'Ryan Crecelius',
          agentPhone: '(910) 555-1234',
          agentEmail: 'ryan@nestrealty.com',
          agentRole: 'Agent',
          priority: 'normal',
          targetSla: '2026-09-27T00:00:00.000Z',
          receivedAt: '2026-09-05T20:00:00.000Z',
          requestedAssets: [],
          listingDetails: {
            price: '$450,000',
            bedsBaths: '3 bd / 2 ba',
            sqft: '2,100',
            headline: 'Beautiful home',
            description: 'Desc',
            disclosures: 'None',
            mlsNumber: '10045678',
            licenseNumber: 'NC-999'
          },
          photos: [],
          sopCode: 'SOP-001',
          sopTitle: 'Flyer Design',
          aiRecommendation: { badge: 'Standard', rationale: '', complianceChecked: true }
        } as any]}
      />
    );

    expect(html).toContain('data-testid="workspace-kanban-board"');
    // Confirms fixed 340px lane width was removed in favor of dynamic width
    expect(html).not.toContain('w-[340px]');
    // Confirms lane width style is dynamically computed
    expect(html).toContain('width:230px');
    expect(html).toContain('min-width:200px');
    expect(html).toContain('Collapse Needs Information');
  });

  it('13. CanonicalTaskCard allows long street addresses and titles to wrap naturally without truncation', () => {
    const longAddressTask = {
      id: 'task_long_addr',
      title: 'Design and print luxury property brochures with full-bleed foil stamping for spring open house',
      propertyAddress: '12344 South Alexander Memorial Parkway Northwest, Suite 400B, Wilmington, NC 28403',
      category: 'print',
      status: 'in_progress',
      assignedTo: 'Ann Gunn'
    };

    const html = renderToStaticMarkup(
      <CanonicalTaskCard task={longAddressTask} />
    );

    // Headline contains full street address and allows natural wrapping (no truncate on headline)
    expect(html).toContain('12344 South Alexander Memorial Parkway Northwest');
    expect(html).toContain('break-words');
    expect(html).toContain('<h4 class="text-[15px] sm:text-[16px] font-semibold text-slate-900 leading-snug break-words');
    // Suite and city/state are preserved on quieter secondary line
    expect(html).toContain('Suite 400B, Wilmington, NC 28403');
    // Secondary requested work line wraps naturally
    expect(html).toContain('Design and print luxury property brochures with full-bleed foil stamping for spring open house');
  });
});

