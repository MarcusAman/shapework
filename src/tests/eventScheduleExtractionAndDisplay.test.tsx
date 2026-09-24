/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Unit & Component Test Suite: Event Schedule Extraction & Display
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  extractEventScheduleDetails,
  normalizeDateToMMDD,
  normalizeTimeRange,
  resolveTaskEventDetails
} from '../utils/eventScheduleExtraction';
import { TaskRequestDetailModal } from '../components/marketing/TaskRequestDetailModal';
import { WorkspaceTaskDrawer } from '../components/marketing/WorkspaceTaskDrawer';

describe('Event Schedule Extraction Utilities', () => {
  const verbatimCallTranscript = `
Agent: Thanks for calling Nest. Is this Matt?
User: Yes. It is. 
Agent: Hi Matt. What can I help you get rolling today? 
User: I need a fifty tri fold open house flyer. For one thirty nine North Fourth Street, MLS number one zero zero seven eight three nine three one It's live in flex. Please use copycat and I need them by September eleventh twenty twenty six for an open house September thirteenth from one to four PM. 
Agent: Got it, Matt. I've got fifty tri-fold flyers for one thirty-nine North Fourth Street with CopyCat, and they're set to ship by Friday, September eleventh. Melissa and Eduardo are on it. Anything else I can help with? 
User: No. I think that's it. Gonna be it. Thank you very much. 
Agent: You're welcome, Matt. Have a great day, 
User: You too. Okay. 
Agent: and good luck with the open house! 
User: Bye.
  `;

  it('1. Parses spelled-out date and spoken time from call transcript', () => {
    const extracted = extractEventScheduleDetails(verbatimCallTranscript);
    expect(extracted.eventType).toBe('Open House');
    expect(extracted.eventDate).toBe('09/13');
    expect(extracted.eventTime).toBe('1pm - 4pm');
  });

  it('2. Parses numeric dates and time variations', () => {
    const text1 = 'We are hosting an open house September 13th from 1 to 4 PM';
    const res1 = extractEventScheduleDetails(text1);
    expect(res1.eventType).toBe('Open House');
    expect(res1.eventDate).toBe('09/13');
    expect(res1.eventTime).toBe('1pm - 4pm');

    const text2 = 'Need flyers for broker caravan October 5th from 10am to 1pm';
    const res2 = extractEventScheduleDetails(text2);
    expect(res2.eventType).toBe('Broker Caravan / Tour');
    expect(res2.eventDate).toBe('10/05');
    expect(res2.eventTime).toBe('10am - 1pm');
  });

  it('3. Normalizes dates to strict MM/DD format', () => {
    expect(normalizeDateToMMDD('9/13')).toBe('09/13');
    expect(normalizeDateToMMDD('09/13')).toBe('09/13');
    expect(normalizeDateToMMDD('September 13')).toBe('09/13');
    expect(normalizeDateToMMDD('2026-09-13T00:00:00.000Z')).toBe('09/13');
  });

  it('4. Normalizes spoken and formatted time ranges', () => {
    expect(normalizeTimeRange('from one to four PM')).toBe('1pm - 4pm');
    expect(normalizeTimeRange('1 to 4 PM')).toBe('1pm - 4pm');
    expect(normalizeTimeRange('1:00 PM - 4:00 PM')).toBe('1:00pm - 4:00pm');
  });

  it('5. Resolves event schedule from task object with fallback to call transcript', () => {
    // A. Explicit task properties
    const taskWithFields = {
      id: 'task_1',
      eventType: 'Open House',
      eventDate: '09/13',
      eventTime: '1pm - 4pm'
    };
    const resA = resolveTaskEventDetails(taskWithFields);
    expect(resA.hasEvent).toBe(true);
    expect(resA.eventType).toBe('Open House');
    expect(resA.eventDate).toBe('09/13');
    expect(resA.eventTime).toBe('1pm - 4pm');

    // B. Fallback extraction from call transcript
    const taskEmpty = { id: 'task_empty' };
    const callObj = { transcript: verbatimCallTranscript };
    const resB = resolveTaskEventDetails(taskEmpty, undefined, callObj);
    expect(resB.hasEvent).toBe(true);
    expect(resB.eventType).toBe('Open House');
    expect(resB.eventDate).toBe('09/13');
    expect(resB.eventTime).toBe('1pm - 4pm');

    // C. Non-event task
    const standardTask = { id: 'task_standard', notes: 'Need standard business cards' };
    const resC = resolveTaskEventDetails(standardTask);
    expect(resC.hasEvent).toBe(false);
    expect(resC.eventDate).toBeUndefined();
  });
});

describe('TaskRequestDetailModal Event Display Component', () => {
  const sampleTaskWithEvent: any = {
    id: 'task_call_call_69b7bd8b487ac45a36154a25fbf_0',
    requestId: 'req_call_call_69b7bd8b487ac45a36154a25fbf',
    title: 'Open House Tri-Fold Flyer — 139 North Fourth Street',
    propertyAddress: '139 North Fourth Street, Wilmington NC',
    agentName: 'Matt Orr (REALTOR®)',
    category: 'marketing',
    status: 'request_received',
    mlsNumber: '100783931',
    eventType: 'Open House',
    eventDate: '09/13',
    eventTime: '1pm - 4pm',
    neededByDate: '2026-09-11T00:00:00.000Z',
    vendorName: 'CopyCat'
  };

  const sampleRequest: any = {
    id: 'req_call_call_69b7bd8b487ac45a36154a25fbf',
    title: '139 North Fourth Street, Wilmington NC',
    propertyAddress: '139 North Fourth Street, Wilmington NC',
    agentName: 'Matt Orr (REALTOR®)',
    agentPhone: '(910) 612-8283',
    mlsNumber: '100783931',
    category: 'marketing',
    rawExcerpt: 'open house September thirteenth from one to four PM',
    tasks: [sampleTaskWithEvent]
  };

  it('1. Renders 3 dedicated cards (Event Type, Event Date, Event Time) when event details exist', () => {
    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        onClose={() => {}}
        request={sampleRequest}
        selectedTask={sampleTaskWithEvent}
      />
    );

    expect(html).toContain('Property &amp; Marketing Details');
    expect(html).toContain('Event Type');
    expect(html).toContain('Open House');
    expect(html).toContain('Event Date');
    expect(html).toContain('09/13');
    expect(html).toContain('Event Time');
    expect(html).toContain('1pm - 4pm');
    expect(html).toContain('CopyCat');
    expect(html).toContain('100783931');
  });

  it('2. Renders "Not scheduled" single card when no event is present', () => {
    const taskNoEvent: any = {
      id: 'task_standard',
      requestId: 'req_standard',
      title: 'Standard Postcard',
      propertyAddress: '123 Main St',
      category: 'marketing',
      status: 'request_received'
    };
    const reqNoEvent: any = {
      id: 'req_standard',
      propertyAddress: '123 Main St',
      category: 'marketing'
    };

    const html = renderToStaticMarkup(
      <TaskRequestDetailModal
        isOpen={true}
        onClose={() => {}}
        request={reqNoEvent}
        selectedTask={taskNoEvent}
      />
    );

    expect(html).toContain('Event Date');
    expect(html).toContain('Not scheduled');
    expect(html).not.toContain('Event Time');
  });
});

describe('WorkspaceTaskDrawer Event Display Component', () => {
  const sampleWorkspaceTask: any = {
    id: 'tsk_req_phone_1788890125078_otm3z_0',
    propertyAddress: '139 North Fourth Street, Wilmington NC',
    agentName: 'Matt Orr (REALTOR®)',
    agentPhone: '(910) 612-8283',
    agentEmail: 'matt.orr@nestrealty.com',
    packageType: 'Open House Tri-Fold Flyer',
    priority: 'normal',
    status: 'ready_for_review',
    targetSla: '24 hours',
    receivedAt: '2026-09-08T17:57:32.998Z',
    eventType: 'Open House',
    eventDate: '09/13',
    eventTime: '1pm - 4pm',
    listingDetails: {
      price: '$895,000',
      bedsBaths: '3 Beds / 2 Baths',
      sqft: '2,400 SqFt',
      headline: 'Downtown Charm',
      description: 'Open house September thirteenth from one to four PM',
      disclosures: '',
      mlsNumber: '100783931',
      licenseNumber: 'NC-301294'
    }
  };

  it('1. Renders Event Type, Event Date: 09/13, and Event Time: 1pm - 4pm under Structured Request Brief', () => {
    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={sampleWorkspaceTask}
        onClose={() => {}}
      />
    );

    expect(html).toContain('Structured Request Brief');
    expect(html).toContain('Event Type');
    expect(html).toContain('Open House');
    expect(html).toContain('Event Date');
    expect(html).toContain('09/13');
    expect(html).toContain('Event Time');
    expect(html).toContain('1pm - 4pm');
  });

  it('2. Extracts event details from listing description or notes if fields omitted on task', () => {
    const taskWithDescOnly: any = {
      ...sampleWorkspaceTask,
      eventType: undefined,
      eventDate: undefined,
      eventTime: undefined,
      listingDetails: {
        ...sampleWorkspaceTask.listingDetails,
        description: 'Host an open house September thirteenth from one to four PM for the buyers.'
      }
    };

    const html = renderToStaticMarkup(
      <WorkspaceTaskDrawer
        isOpen={true}
        activeTask={taskWithDescOnly}
        onClose={() => {}}
      />
    );

    expect(html).toContain('Event Type');
    expect(html).toContain('Open House');
    expect(html).toContain('Event Date');
    expect(html).toContain('09/13');
    expect(html).toContain('Event Time');
    expect(html).toContain('1pm - 4pm');
  });
});
