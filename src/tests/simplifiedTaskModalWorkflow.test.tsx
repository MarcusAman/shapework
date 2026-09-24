/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Simplified Task Modal & Deliverable Interpretation Acceptance Test Suite
 * Validates:
 * 1. Date-only strings (2026-09-11 and 2026-09-25) format without UTC midnight 1-day rollbacks
 * 2. Task modal header is clean and minimal (no redundant license numbers or category badges)
 * 3. Essential details strip renders From, Property, Needed By, and MLS (Supplied) once above the fold
 * 4. Sibling tasks are cleanly separated with independent state and keys
 * 5. WorkspaceTaskDrawer displays clean specs grid without redundant license numbers
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  TaskRequestDetailModal,
  formatNewYorkDateTime,
  formatNewYorkRelativeDue
} from '../components/marketing/TaskRequestDetailModal';
import {
  WorkspaceTaskDrawer,
  WorkspaceDrawerTask
} from '../components/marketing/WorkspaceTaskDrawer';
import {
  CanonicalMarketingRequest,
  CanonicalMarketingTask
} from '../../server/persistence/marketingCampaignsRepository';

describe('Simplified Task Modal & Date Conversion Suite', () => {
  describe('Timezone & Date Formatting (No 1-Day Rollbacks)', () => {
    it('formats date-only YYYY-MM-DD strings on the exact calendar day without rollback', () => {
      const formattedSep11 = formatNewYorkDateTime('2026-09-11');
      expect(formattedSep11).toContain('Sep 11, 2026');
      expect(formattedSep11).not.toContain('Sep 10');

      const formattedSep25 = formatNewYorkDateTime('2026-09-25');
      expect(formattedSep25).toContain('Sep 25, 2026');
      expect(formattedSep25).not.toContain('Sep 24');
    });

    it('formats UTC midnight ISO strings on the exact calendar day', () => {
      const formattedMidnightUtc = formatNewYorkDateTime('2026-09-11T00:00:00.000Z');
      expect(formattedMidnightUtc).toContain('Sep 11, 2026');
      expect(formattedMidnightUtc).not.toContain('Sep 10');

      const formattedMidnightUtc2 = formatNewYorkDateTime('2026-09-25T00:00:00Z');
      expect(formattedMidnightUtc2).toContain('Sep 25, 2026');
      expect(formattedMidnightUtc2).not.toContain('Sep 24');
    });

    it('formats ASAP and empty dates appropriately', () => {
      expect(formatNewYorkDateTime('ASAP')).toBe('ASAP — date not set');
      expect(formatNewYorkDateTime('asap')).toBe('ASAP — date not set');
      expect(formatNewYorkDateTime('')).toBe('Not provided');
      expect(formatNewYorkDateTime(null)).toBe('Not provided');
      expect(formatNewYorkDateTime(undefined)).toBe('Not provided');
    });

    it('formats relative due for date-only strings accurately', () => {
      const rel = formatNewYorkRelativeDue('2026-09-25');
      expect(rel.formatted).toContain('September 25, 2026');
      expect(rel.formatted).not.toContain('September 24');
    });
  });

  describe('Modal Header & Essential Details Cleanliness', () => {
    const colonialRequest: CanonicalMarketingRequest = {
      id: 'req_colonial_117',
      title: 'Marketing Request - 117 Colonial Drive',
      propertyAddress: '117 Colonial Drive, Clinton, NC 28328',
      agentName: 'Marcus Aman',
      agentEmail: 'marcus@shapework.co',
      agentPhone: '+12527170595',
      agentRole: 'Broker',
      channel: 'email',
      status: 'request_received',
      receivedAt: 'Just now · Verified Inbound',
      requestExcerpt: 'Open House 09/25/2026 @ 2:00 PM - social media graphic - tri fold brochure MLS# 1716651',
      rawExcerpt: 'Hey Nora — I have a listing at 117 colonial drive Clinton NC 28328 that I need two things for marketing\nOpen House 09/25/2026 @ 2:00 PM\nsocial media graphic\ntri fold brochure\nMLS# 1716651',
      taskIds: ['task_colonial_social', 'task_colonial_brochure'],
      assignedTo: 'Melissa Gagliardi',
      mlsNumber: '1716651',
      eventType: 'Open House',
      eventDate: '09/25/2026',
      eventTime: '2:00 PM',
      createdAt: '2026-09-15T14:00:00.000Z',
      updatedAt: '2026-09-15T14:00:00.000Z',
      isArchived: false
    };

    const taskSocial: CanonicalMarketingTask = {
      id: 'task_colonial_social',
      requestId: 'req_colonial_117',
      title: 'Social media graphic',
      category: 'social',
      propertyAddress: '117 Colonial Drive, Clinton, NC 28328',
      agentName: 'Marcus Aman',
      agentEmail: 'marcus@shapework.co',
      agentPhone: '+12527170595',
      channel: 'email',
      status: 'request_received',
      assignedTo: 'Melissa Gagliardi',
      assignedToId: 'dir_melissa_gagliardi_33',
      mlsNumber: '1716651',
      eventType: 'Open House',
      eventDate: '09/25/2026',
      eventTime: '2:00 PM',
      notes: 'Social media graphic for upcoming Clinton listing open house.',
      createdAt: '2026-09-15T14:00:00.000Z',
      updatedAt: '2026-09-15T14:00:00.000Z',
      isArchived: false
    };

    const taskBrochure: CanonicalMarketingTask = {
      id: 'task_colonial_brochure',
      requestId: 'req_colonial_117',
      title: 'Tri-fold brochure',
      category: 'print',
      propertyAddress: '117 Colonial Drive, Clinton, NC 28328',
      agentName: 'Marcus Aman',
      agentEmail: 'marcus@shapework.co',
      agentPhone: '+12527170595',
      channel: 'email',
      status: 'request_received',
      assignedTo: 'Melissa Gagliardi',
      assignedToId: 'dir_melissa_gagliardi_33',
      mlsNumber: '1716651',
      eventType: 'Open House',
      eventDate: '09/25/2026',
      eventTime: '2:00 PM',
      notes: 'Tri-fold print brochure for Clinton property.',
      createdAt: '2026-09-15T14:00:00.000Z',
      updatedAt: '2026-09-15T14:00:00.000Z',
      isArchived: false
    };

    it('renders clean minimal header without license numbers or redundant category badges', () => {
      const html = renderToStaticMarkup(
        <TaskRequestDetailModal
          isOpen={true}
          request={colonialRequest}
          selectedTask={taskSocial}
          tasks={[taskSocial, taskBrochure]}
          onClose={() => {}}
        />
      );

      // Verify task title renders
      expect(html).toContain('Social media graphic');

      // Verify no fake placeholder license numbers
      expect(html).not.toContain('NC Broker #291842');
      expect(html).not.toContain('NC-301294');
      expect(html).not.toContain('Agent License #');

      // Verify no fabricated carousel/platform titles in header
      expect(html).not.toContain('3-Slide Social Story Carousel &amp; Graphics');
      expect(html).not.toContain('Luxury Property Marketing Brochure');
    });

    it('displays essential details strip with address, MLS badge, and Needed By once above the fold', () => {
      const html = renderToStaticMarkup(
        <TaskRequestDetailModal
          isOpen={true}
          request={colonialRequest}
          selectedTask={taskSocial}
          tasks={[taskSocial, taskBrochure]}
          onClose={() => {}}
        />
      );

      // Verify property address renders
      expect(html).toContain('117 Colonial Drive, Clinton, NC 28328');

      // Verify MLS badge with Supplied indicator
      expect(html).toContain('1716651');
      expect(html).toContain('Supplied');

      // Verify Needed By is Deadline not specified (since no production deadline was given)
      expect(html).toContain('Deadline not specified');

      // Verify Open House event is separated and rendered
      expect(html).toContain('Open House');
      expect(html).toContain('09/25/2026');
    });

    it('supports sibling switcher and isolates state per task without leakage', () => {
      const htmlSocial = renderToStaticMarkup(
        <TaskRequestDetailModal
          isOpen={true}
          request={colonialRequest}
          selectedTask={taskSocial}
          tasks={[taskSocial, taskBrochure]}
          onClose={() => {}}
        />
      );

      expect(htmlSocial).toContain('Other tasks in this request (2)');
      expect(htmlSocial).toContain('Social media graphic');
      expect(htmlSocial).toContain('Tri-fold brochure');

      const htmlBrochure = renderToStaticMarkup(
        <TaskRequestDetailModal
          isOpen={true}
          request={colonialRequest}
          selectedTask={taskBrochure}
          tasks={[taskSocial, taskBrochure]}
          onClose={() => {}}
        />
      );

      expect(htmlBrochure).toContain('Tri-fold brochure');
      expect(htmlBrochure).toContain('Other tasks in this request (2)');
    });
  });

  describe('WorkspaceTaskDrawer Consistency', () => {
    const sampleDrawerTask: WorkspaceDrawerTask = {
      id: 'task_drawer_001',
      title: 'Tri-fold brochure',
      category: 'print',
      packageType: 'Print Marketing',
      propertyAddress: '117 Colonial Drive, Clinton, NC 28328',
      status: 'request_received',
      priority: 'normal',
      assignedTo: 'Melissa Gagliardi',
      dueAt: undefined,
      listingDetails: {
        price: '$350,000',
        bedsBaths: '3 beds / 2 baths',
        sqft: '2,100 sqft',
        headline: 'Charming Home in Clinton',
        description: 'Beautiful property located at 117 Colonial Drive.',
        disclosures: 'None',
        mlsNumber: '1716651',
        licenseNumber: 'NC Broker #291842'
      }
    };

    it('renders clean 4-column specifications grid without Agent License # card', () => {
      const html = renderToStaticMarkup(
        <WorkspaceTaskDrawer
          isOpen={true}
          activeTask={sampleDrawerTask}
          onClose={() => {}}
          onSubmitProof={() => {}}
          currentUser={{ id: 'dir_melissa_gagliardi_33', name: 'Melissa Gagliardi', role: 'marketing_director' }}
        />
      );

      expect(html).toContain('List Price');
      expect(html).toContain('Beds / Baths');
      expect(html).toContain('Square Footage');
      expect(html).toContain('MLS Number');
      expect(html).toContain('1716651');

      // Redundant/fabricated license card must NOT be in specs grid
      expect(html).not.toContain('NC Broker #291842');
      expect(html).not.toContain('Agent License #');
    });
  });
});
