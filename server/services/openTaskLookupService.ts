/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Open Task Lookup Service — Nest Realty Hotline NORA
 * Searches canonical open marketing and operations tasks by property address.
 * Prevents duplicate task creation during live Retell phone calls.
 */

import { getAllCanonicalMarketingTasks, getAllCanonicalMarketingRequests, CanonicalMarketingTask, CanonicalMarketingRequest } from '../persistence/marketingCampaignsRepository.js';
import { normalizePropertyAddress, matchPropertyAddresses } from './propertyAddressNormalizer.js';
import { getDbPool, storageDriver } from '../persistence/repositories.js';

export interface OpenTaskLookupResult {
  success: boolean;
  has_open_tasks: boolean;
  match_type: 'exact' | 'candidate' | 'ambiguous' | 'no_match';
  matched_address?: string;
  spoken_summary: string;
  open_tasks_count: number;
  tasks: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    assignedTo: string;
    dueAt?: string;
    propertyAddress?: string;
    agentName?: string;
    agentEmail?: string;
  }>;
  existing_request_id?: string;
  diagnostics: {
    query_address: string;
    normalized_query: string;
    workspace_id: string;
    evaluated_tasks_count: number;
  };
}

export const NEST_DEFAULT_WORKSPACE_ID = 'ws_wilmington';

/**
 * Searches the canonical task repository for open tasks associated with a property address.
 */
export async function lookupOpenTasksByProperty(params: {
  address?: string | null;
  workspaceId?: string;
}): Promise<OpenTaskLookupResult> {
  const { address, workspaceId = NEST_DEFAULT_WORKSPACE_ID } = params;

  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return {
      success: false,
      has_open_tasks: false,
      match_type: 'no_match',
      spoken_summary: "I wasn't able to hear the property address clearly. Could you please repeat the street number and name?",
      open_tasks_count: 0,
      tasks: [],
      diagnostics: {
        query_address: '',
        normalized_query: '',
        workspace_id: workspaceId,
        evaluated_tasks_count: 0
      }
    };
  }

  const queryNorm = normalizePropertyAddress(address);

  // If address has no house number (e.g. just "Walcott Avenue"), ask for clarification
  if (!queryNorm.hasHouseNumber) {
    return {
      success: true,
      has_open_tasks: false,
      match_type: 'ambiguous',
      spoken_summary: `I heard "${address}", but I need the house or street number. What is the number for that property?`,
      open_tasks_count: 0,
      tasks: [],
      diagnostics: {
        query_address: address,
        normalized_query: queryNorm.normalized,
        workspace_id: workspaceId,
        evaluated_tasks_count: 0
      }
    };
  }

  let allTasks = getAllCanonicalMarketingTasks();
  let allRequests = getAllCanonicalMarketingRequests();

  const activePool = getDbPool();
  if (storageDriver === 'database' && activePool) {
    try {
      const dbTasksRes = await activePool.query(`
        SELECT t.*, r.agent_email, r.agent_phone
        FROM canonical_marketing_tasks t
        LEFT JOIN canonical_marketing_requests r ON t.request_id = r.id
        WHERE (t.workspace_id = $1 OR $1 = 'ws_wilmington') AND t.is_archived = FALSE
      `, [workspaceId]);

      if (dbTasksRes.rows.length > 0) {
        allTasks = dbTasksRes.rows.map(row => ({
          id: row.id,
          requestId: row.request_id,
          workspaceId: row.workspace_id,
          requestTitle: row.request_title,
          propertyAddress: row.property_address,
          agentName: row.agent_name,
          agentEmail: row.agent_email,
          agentPhone: row.agent_phone,
          title: row.title,
          category: row.category,
          assignedTo: row.assigned_to,
          assignedToRole: row.assigned_to_role,
          status: row.status,
          dueAt: row.due_at ? new Date(row.due_at).toISOString() : undefined,
          notes: row.notes,
          isArchived: Boolean(row.is_archived),
          approvalHistory: row.approval_history,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
        } as any));
      }

      const dbReqsRes = await activePool.query(`
        SELECT * FROM canonical_marketing_requests
        WHERE (workspace_id = $1 OR $1 = 'ws_wilmington') AND is_archived = FALSE
      `, [workspaceId]);

      if (dbReqsRes.rows.length > 0) {
        allRequests = dbReqsRes.rows.map(row => ({
          id: row.id,
          workspaceId: row.workspace_id,
          title: row.title,
          propertyAddress: row.property_address,
          agentName: row.agent_name,
          agentEmail: row.agent_email,
          agentPhone: row.agent_phone,
          channel: row.channel,
          status: row.status,
          category: row.category,
          taskIds: row.task_ids,
          isArchived: Boolean(row.is_archived),
          notes: row.notes,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
        } as any));
      }
    } catch (dbErr) {
      console.warn('[OpenTaskLookup] Database query warning (falling back to store):', dbErr);
    }
  }

  // Filter for OPEN, ACTIVE (non-terminal, non-archived) tasks
  const activeTasks = (allTasks || []).filter((t: CanonicalMarketingTask) => {
    if (t.isArchived) return false;
    const status = (t.status || '').toLowerCase();
    // Exclude completed or approved terminal tasks
    if (status === 'completed' || status === 'approved') return false;
    return true;
  });

  const exactMatches: CanonicalMarketingTask[] = [];
  const candidateMatches: CanonicalMarketingTask[] = [];

  for (const task of activeTasks) {
    const taskAddress = task.propertyAddress || task.title;
    if (!taskAddress) continue;

    const evaluation = matchPropertyAddresses(address, taskAddress);
    if (evaluation.matchType === 'exact') {
      exactMatches.push(task);
    } else if (evaluation.matchType === 'candidate') {
      candidateMatches.push(task);
    }
  }

  // Also check active Requests for parent request matching
  let matchedRequestId: string | undefined;
  for (const req of allRequests) {
    if (req.isArchived) continue;
    const reqAddress = req.propertyAddress || req.title;
    if (!reqAddress) continue;
    const evalReq = matchPropertyAddresses(address, reqAddress);
    if (evalReq.matchType === 'exact' || evalReq.matchType === 'candidate') {
      matchedRequestId = req.id;
      break;
    }
  }

  // 1. Exact Match Found
  if (exactMatches.length > 0) {
    const matchedAddr = exactMatches[0].propertyAddress || address;
    return {
      success: true,
      has_open_tasks: true,
      match_type: 'exact',
      matched_address: matchedAddr,
      spoken_summary: `I found an open request for ${matchedAddr}. It looks like it’s already being worked on. Would you like me to add this request to that task or tell you its current status?`,
      open_tasks_count: exactMatches.length,
      existing_request_id: matchedRequestId || exactMatches[0].requestId,
      tasks: exactMatches.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        status: t.status,
        assignedTo: t.assignedTo || 'Operations Team',
        dueAt: t.dueAt,
        propertyAddress: t.propertyAddress,
        agentName: t.agentName,
        agentEmail: (t as any).agentEmail
      })),
      diagnostics: {
        query_address: address,
        normalized_query: queryNorm.normalized,
        workspace_id: workspaceId,
        evaluated_tasks_count: activeTasks.length
      }
    };
  }

  // 2. High-Confidence Candidate Match (e.g. unit clarification)
  if (candidateMatches.length > 0) {
    const matchedAddr = candidateMatches[0].propertyAddress || address;
    return {
      success: true,
      has_open_tasks: true,
      match_type: 'candidate',
      matched_address: matchedAddr,
      spoken_summary: `I found an open request for ${matchedAddr}. It looks like it’s already being worked on. Would you like me to add this request to that task or tell you its current status?`,
      open_tasks_count: candidateMatches.length,
      existing_request_id: matchedRequestId || candidateMatches[0].requestId,
      tasks: candidateMatches.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        status: t.status,
        assignedTo: t.assignedTo || 'Operations Team',
        dueAt: t.dueAt,
        propertyAddress: t.propertyAddress,
        agentName: t.agentName,
        agentEmail: (t as any).agentEmail
      })),
      diagnostics: {
        query_address: address,
        normalized_query: queryNorm.normalized,
        workspace_id: workspaceId,
        evaluated_tasks_count: activeTasks.length
      }
    };
  }

  // 3. No Open Tasks Found -> Clear to Proceed with New Intake
  return {
    success: true,
    has_open_tasks: false,
    match_type: 'no_match',
    spoken_summary: `No open tasks found for ${address}. Ready to proceed with new intake.`,
    open_tasks_count: 0,
    tasks: [],
    diagnostics: {
      query_address: address,
      normalized_query: queryNorm.normalized,
      workspace_id: workspaceId,
      evaluated_tasks_count: activeTasks.length
    }
  };
}
