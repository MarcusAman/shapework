/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BasecampSignal, BasecampSignalType } from './basecampTypes.js';

export function mapTodoToSignals(
  todo: any,
  workspaceId: string,
  accountId: string,
  projectId: number
): BasecampSignal[] {
  const signals: BasecampSignal[] = [];
  const title = todo.title || todo.content || '';
  const titleLower = title.toLowerCase();

  const assignees = todo.assignees || [];
  const assignedPersonName = assignees.map((a: any) => a.name).join(', ') || undefined;
  const isUnassigned = assignees.length === 0;

  const dueOn = todo.due_on;
  const isOverdue = dueOn && new Date(dueOn).getTime() < Date.now() - 24 * 3600 * 1000;

  const createdAt = todo.created_at || new Date().toISOString();
  const isStuck = createdAt && (Date.now() - new Date(createdAt).getTime()) > 14 * 24 * 3600 * 1000;

  // 1. Overdue todo exception
  if (isOverdue) {
    signals.push(createSignal({
      workspaceId,
      accountId,
      projectId,
      sourceRecordId: String(todo.id),
      signalType: 'todo_overdue',
      title: `Overdue Task: ${title}`,
      summary: `Basecamp task "${title}" is overdue. It was due on ${dueOn} and is assigned to ${assignedPersonName || 'unassigned'}.`,
      assignedPersonName,
      dueDate: dueOn,
      sourceUrl: todo.url,
      createdAt
    }));
  }

  // 2. Unassigned todo exception
  if (isUnassigned) {
    signals.push(createSignal({
      workspaceId,
      accountId,
      projectId,
      sourceRecordId: String(todo.id),
      signalType: 'todo_unassigned',
      title: `Unassigned Task: ${title}`,
      summary: `Basecamp task "${title}" has no assigned owner or coordinator.`,
      sourceUrl: todo.url,
      createdAt
    }));
  }

  // 3. Owner mention detection
  const mentionsOwner = titleLower.includes('sarah') || titleLower.includes('jenk') || titleLower.includes('jenn');
  if (mentionsOwner) {
    signals.push(createSignal({
      workspaceId,
      accountId,
      projectId,
      sourceRecordId: String(todo.id),
      signalType: 'owner_mentioned',
      title: `Owner Mentioned in Todo: ${title}`,
      summary: `Task "${title}" contains references to Sarah Jennings (Owner) or Sarah Jenkins (Operations Lead).`,
      assignedPersonName,
      dueDate: dueOn,
      sourceUrl: todo.url,
      createdAt
    }));
  }

  // 4. Stuck marketing/event/office tasks
  if (isStuck) {
    let type: BasecampSignalType = 'task_stuck';
    let label = 'Stuck Task';

    if (titleLower.includes('flyer') || titleLower.includes('mls') || titleLower.includes('post') || titleLower.includes('photo') || titleLower.includes('marketing')) {
      type = 'marketing_request_detected';
      label = 'Stuck Marketing Task';
    } else if (titleLower.includes('lunch') || titleLower.includes('venue') || titleLower.includes('open house') || titleLower.includes('rsvp')) {
      type = 'event_task_detected';
      label = 'Stuck Event Task';
    } else if (titleLower.includes('sign') || titleLower.includes('lockbox') || titleLower.includes('office') || titleLower.includes('facilities')) {
      type = 'office_issue_detected';
      label = 'Stuck Office Task';
    }

    signals.push(createSignal({
      workspaceId,
      accountId,
      projectId,
      sourceRecordId: String(todo.id),
      signalType: type,
      title: `${label}: ${title}`,
      summary: `Basecamp task "${title}" has been open/stuck for more than 14 days without resolution. Created on: ${createdAt}`,
      assignedPersonName,
      dueDate: dueOn,
      sourceUrl: todo.url,
      createdAt
    }));
  }

  return signals;
}

export function mapMessageToSignals(
  message: any,
  workspaceId: string,
  accountId: string,
  projectId: number
): BasecampSignal[] {
  const signals: BasecampSignal[] = [];
  const subject = message.subject || '';
  const content = message.content || '';
  const textBody = `${subject} ${content}`.toLowerCase();
  const createdAt = message.created_at || new Date().toISOString();

  // 1. Owner Mentioned in Message
  const mentionsOwner = textBody.includes('sarah') || textBody.includes('jenk') || textBody.includes('jenn');
  if (mentionsOwner) {
    signals.push(createSignal({
      workspaceId,
      accountId,
      projectId,
      sourceRecordId: String(message.id),
      signalType: 'owner_mentioned',
      title: `Owner Mentioned in Message: ${subject}`,
      summary: `Message board post "${subject}" by ${message.creator?.name || 'team member'} contains mentions of Sarah Jennings or Sarah Jenkins.`,
      sourceUrl: message.url,
      createdAt
    }));
  }

  // 2. Vendor Followup request detected
  const isVendorFollowup = textBody.includes('title company') || textBody.includes('wiring') || textBody.includes('escrow') || textBody.includes('lender') || textBody.includes('follow up');
  if (isVendorFollowup) {
    signals.push(createSignal({
      workspaceId,
      accountId,
      projectId,
      sourceRecordId: String(message.id),
      signalType: 'vendor_followup_detected',
      title: `Vendor Follow-up Request: ${subject}`,
      summary: `Message post "${subject}" indicates unresolved vendor communications regarding wires, title, or escrow checkoffs.`,
      sourceUrl: message.url,
      createdAt
    }));
  }

  return signals;
}

function createSignal(params: {
  workspaceId: string;
  accountId: string;
  projectId: number;
  sourceRecordId: string;
  signalType: BasecampSignalType;
  title: string;
  summary: string;
  assignedPersonName?: string;
  dueDate?: string;
  sourceUrl?: string;
  createdAt: string;
}): BasecampSignal {
  // Deterministic ID to avoid duplication across multiple sync cycles
  const id = `bc_signal_${params.accountId}_${params.signalType}_${params.sourceRecordId}`;
  return {
    id,
    workspaceId: params.workspaceId,
    sourceSystem: 'basecamp',
    sourceRecordId: params.sourceRecordId,
    sourceProjectId: String(params.projectId),
    sourceUrl: params.sourceUrl,
    signalType: params.signalType,
    title: params.title,
    summary: params.summary,
    assignedPersonName: params.assignedPersonName,
    dueDate: params.dueDate,
    status: 'new',
    createdAt: params.createdAt
  };
}
