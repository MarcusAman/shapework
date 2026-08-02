import fs from 'fs';
import path from 'path';

export type MarketingAssetType = 'flyer' | 'carousel' | 'postcard' | 'sign_rider' | 'email';

export type MarketingAssetBuildStatus =
  | 'waiting'
  | 'preparing'
  | 'rendering'
  | 'rendered'
  | 'visual_validation_passed'
  | 'ready_for_review'
  | 'needs_attention'
  | 'failed';

export interface MarketingGenerationJob {
  id: string;
  idempotencyKey: string;
  workspaceId: string;
  campaignId: string;
  campaignRevision: number;

  status:
    | 'queued'
    | 'running'
    | 'waiting_for_input'
    | 'validating'
    | 'completed'
    | 'failed'
    | 'cancelled';

  currentStage?: string;
  completedMaterialsCount: number;
  totalMaterialsCount: number;

  requestedAssetTypes: MarketingAssetType[];

  assetStatuses: Record<MarketingAssetType, {
    status: MarketingAssetBuildStatus;
    version: number;
    previewAssetId?: string;
    previewUrl?: string;
    updatedAt: string;
    error?: string;
  }>;

  startedAt?: string;
  completedAt?: string;
  initiatedBy: string;

  errorCode?: string;
  errorMessage?: string;

  inputRequired?: {
    requirementId: string;
    message: string;
    actionLabel: string;
    affectedAssets: MarketingAssetType[];
  };

  createdAt: string;
  updatedAt: string;
}

export type MarketingBuildEvent =
  | {
      id: string;
      type: 'job_started';
      jobId: string;
      campaignId: string;
      campaignRevision: number;
      occurredAt: string;
      message: string;
    }
  | {
      id: string;
      type: 'stage_started';
      jobId: string;
      campaignId: string;
      stage:
        | 'verify_listing'
        | 'load_photos'
        | 'apply_brand'
        | 'render_assets'
        | 'validate_assets'
        | 'prepare_package';
      occurredAt: string;
      message: string;
    }
  | {
      id: string;
      type: 'asset_started';
      jobId: string;
      assetId: string;
      assetType: MarketingAssetType;
      occurredAt: string;
      message: string;
    }
  | {
      id: string;
      type: 'asset_preview_ready';
      jobId: string;
      assetId: string;
      assetType: MarketingAssetType;
      assetVersion: number;
      previewAssetId: string;
      previewUrl: string;
      occurredAt: string;
      message: string;
    }
  | {
      id: string;
      type: 'asset_validation_completed';
      jobId: string;
      assetId: string;
      status: 'passed' | 'needs_attention' | 'failed';
      findings: Array<{
        severity: 'info' | 'warning' | 'error';
        message: string;
      }>;
      occurredAt: string;
    }
  | {
      id: string;
      type: 'input_required';
      jobId: string;
      requirementId: string;
      message: string;
      actionLabel: string;
      occurredAt: string;
    }
  | {
      id: string;
      type: 'job_completed';
      jobId: string;
      packageVersion: number;
      occurredAt: string;
      message: string;
    }
  | {
      id: string;
      type: 'job_failed';
      jobId: string;
      errorCode: string;
      message: string;
      retryable: boolean;
      occurredAt: string;
    };

// Persistent Store for Generation Jobs & Events
const jobsMemoryStore = new Map<string, MarketingGenerationJob>();
const eventsMemoryStore = new Map<string, MarketingBuildEvent[]>();

const getStorageDir = () => {
  const dir = path.join(process.cwd(), 'data', 'private', 'generation-jobs');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

export function saveGenerationJob(job: MarketingGenerationJob): void {
  jobsMemoryStore.set(job.id, job);
  try {
    const file = path.join(getStorageDir(), `job_${job.id}.json`);
    fs.writeFileSync(file, JSON.stringify(job, null, 2));
  } catch (err) {
    console.error('Failed to persist generation job to disk:', err);
  }
}

export function getGenerationJobFromStore(jobId: string): MarketingGenerationJob | null {
  if (jobsMemoryStore.has(jobId)) {
    return jobsMemoryStore.get(jobId)!;
  }
  try {
    const file = path.join(getStorageDir(), `job_${jobId}.json`);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      jobsMemoryStore.set(jobId, data);
      return data;
    }
  } catch (err) {
    console.error('Failed to read generation job from disk:', err);
  }

  if (jobId === 'job_demo_990') {
    const now = new Date().toISOString();
    const demoJob: MarketingGenerationJob = {
      id: 'job_demo_990',
      idempotencyKey: 'campaign_990_inspiration_rev1_1.0_nest_v1',
      workspaceId: 'ws_nest_wilmington',
      campaignId: 'campaign_990_inspiration',
      campaignRevision: 1,
      status: 'completed',
      completedMaterialsCount: 5,
      totalMaterialsCount: 5,
      requestedAssetTypes: ['flyer', 'carousel', 'postcard', 'sign_rider', 'email'],
      assetStatuses: {
        flyer: { status: 'ready_for_preview', version: 1, previewUrl: '/api/marketing/campaigns/campaign_990_inspiration/assets/flyer/raw', updatedAt: now },
        carousel: { status: 'ready_for_preview', version: 1, previewUrl: '/api/marketing/campaigns/campaign_990_inspiration/assets/carousel/raw', updatedAt: now },
        postcard: { status: 'ready_for_preview', version: 1, previewUrl: '/api/marketing/campaigns/campaign_990_inspiration/assets/postcard/raw', updatedAt: now },
        sign_rider: { status: 'ready_for_preview', version: 1, previewUrl: '/api/marketing/campaigns/campaign_990_inspiration/assets/sign_rider/raw', updatedAt: now },
        email: { status: 'ready_for_preview', version: 1, previewUrl: '/api/marketing/campaigns/campaign_990_inspiration/assets/email/raw', updatedAt: now },
      },
      initiatedBy: 'Ryan Crecelius',
      createdAt: now,
      updatedAt: now,
    };
    saveGenerationJob(demoJob);
    return demoJob;
  }

  return null;
}

export function findActiveJobByIdempotencyKey(key: string): MarketingGenerationJob | null {
  for (const job of jobsMemoryStore.values()) {
    if (job.idempotencyKey === key && (job.status === 'running' || job.status === 'queued' || job.status === 'waiting_for_input')) {
      return job;
    }
  }

  // Scan disk
  try {
    const dir = getStorageDir();
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f.startsWith('job_') && f.endsWith('.json')) {
        const data: MarketingGenerationJob = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
        jobsMemoryStore.set(data.id, data);
        if (data.idempotencyKey === key && (data.status === 'running' || data.status === 'queued' || data.status === 'waiting_for_input')) {
          return data;
        }
      }
    }
  } catch (err) {
    console.error('Failed to scan storage directory for idempotency key:', err);
  }

  return null;
}

export function appendBuildEvent(jobId: string, event: MarketingBuildEvent): void {
  const list = eventsMemoryStore.get(jobId) || [];
  if (list.some((e) => e.id === event.id)) return; // Prevent duplicate append
  list.push(event);
  eventsMemoryStore.set(jobId, list);
  try {
    const file = path.join(getStorageDir(), `events_${jobId}.json`);
    fs.writeFileSync(file, JSON.stringify(list, null, 2));
  } catch (err) {
    console.error('Failed to persist build events to disk:', err);
  }
}

export function getBuildEventsForJob(jobId: string, afterEventId?: string): MarketingBuildEvent[] {
  let list = eventsMemoryStore.get(jobId);
  if (!list) {
    try {
      const file = path.join(getStorageDir(), `events_${jobId}.json`);
      if (fs.existsSync(file)) {
        list = JSON.parse(fs.readFileSync(file, 'utf-8'));
        eventsMemoryStore.set(jobId, list!);
      }
    } catch (err) {
      console.error('Failed to read build events from disk:', err);
    }
  }
  const events = list || [];
  if (!afterEventId) return events;
  const idx = events.findIndex((e) => e.id === afterEventId);
  if (idx === -1) return events;
  return events.slice(idx + 1);
}

// Server restart recovery: mark any interrupted 'running' jobs as failed/retryable
export function recoverInterruptedJobs(): void {
  try {
    const dir = getStorageDir();
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f.startsWith('job_') && f.endsWith('.json')) {
        const job: MarketingGenerationJob = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
        if (job.status === 'running' || job.status === 'queued') {
          job.status = 'failed';
          job.errorCode = 'SERVER_RESTART';
          job.errorMessage = 'Server restarted while job was in progress. Package preparation paused.';
          job.updatedAt = new Date().toISOString();
          saveGenerationJob(job);
        }
      }
    }
  } catch (err) {
    console.error('Failed to recover interrupted generation jobs:', err);
  }
}

// Perform recovery on initial module load
recoverInterruptedJobs();
