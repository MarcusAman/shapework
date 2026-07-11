/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job, JobType, JobStatus } from './jobTypes';
import { executeJobProcessor } from './jobProcessor';

// Pointer to database state (injected on startup)
let sharedDbState: any = null;
let persistDbState: (() => void) | null = null;
let workerInterval: NodeJS.Timeout | null = null;

export function initJobQueue(dbState: any, persistFn: () => void) {
  sharedDbState = dbState;
  persistDbState = persistFn;

  if (!sharedDbState.jobs) {
    sharedDbState.jobs = [];
  }

  // Start polling interval worker
  if (!workerInterval) {
    workerInterval = setInterval(processNextJobs, 2000);
    console.log('[Job Queue] Asynchronous background worker polling initialized.');
  }
}

export function enqueueJob(
  workspaceId: string,
  type: JobType,
  payload: Record<string, any>,
  options?: { idempotencyKey?: string; maxAttempts?: number }
): Job {
  if (!sharedDbState) {
    throw new Error('Job queue not initialized. Call initJobQueue first.');
  }

  const idempotencyKey = options?.idempotencyKey;
  if (idempotencyKey) {
    const existingJob = (sharedDbState.jobs as Job[]).find(
      (j) => j.workspaceId === workspaceId && j.idempotencyKey === idempotencyKey
    );
    if (existingJob) {
      console.log(`[Job Queue] Duplicate job found for key ${idempotencyKey}. Skipping enqueue.`);
      return existingJob;
    }
  }

  const newJob: Job = {
    id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    workspaceId,
    type,
    status: 'queued',
    payload,
    attempts: 0,
    maxAttempts: options?.maxAttempts || 3,
    idempotencyKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  sharedDbState.jobs.unshift(newJob);
  if (persistDbState) persistDbState();
  
  console.log(`[Job Queue] Enqueued job ${newJob.id} (${type})`);
  return newJob;
}

async function processNextJobs() {
  if (!sharedDbState) return;

  const pendingJobs = (sharedDbState.jobs as Job[]).filter(
    (j) => j.status === 'queued' || j.status === 'retrying'
  );

  if (pendingJobs.length === 0) return;

  // Process up to 2 concurrent jobs
  const jobsToRun = pendingJobs.slice(0, 2);
  
  for (const job of jobsToRun) {
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    job.updatedAt = new Date().toISOString();
    if (persistDbState) persistDbState();

    console.log(`[Job Queue] Running job ${job.id} (${job.type})`);

    try {
      await executeJobProcessor(job, sharedDbState);
      
      job.status = 'succeeded';
      job.completedAt = new Date().toISOString();
      job.updatedAt = new Date().toISOString();
      console.log(`[Job Queue] Job ${job.id} succeeded.`);
    } catch (err: any) {
      console.error(`[Job Queue] Job ${job.id} failed:`, err.message);
      
      job.attempts += 1;
      job.lastErrorRedacted = redactErrorMessage(err.message);

      if (job.attempts < job.maxAttempts) {
        job.status = 'retrying';
      } else {
        job.status = 'dead_letter';
        console.warn(`[Job Queue] Job ${job.id} moved to DEAD_LETTER after ${job.attempts} failures.`);
      }
      
      job.updatedAt = new Date().toISOString();
    }

    if (persistDbState) persistDbState();
  }
}

function redactErrorMessage(msg: string): string {
  // Redact emails, phone numbers, and potential credential tokens
  return msg
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[REDACTED_PHONE]')
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/ig, 'Bearer [REDACTED_TOKEN]')
    .replace(/client_secret\s*:\s*[^\s,]+/ig, 'client_secret: [REDACTED_SECRET]');
}
