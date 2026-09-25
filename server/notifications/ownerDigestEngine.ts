import { renderNoraEmailLayout, escapeEmailHtml } from '../email/noraEmailLayout.js';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const CONFIG_PATH = path.join(BACKUP_DIR, 'owner_digest_config.json');
const DELIVERY_AUDIT_PATH = path.join(BACKUP_DIR, 'owner_digest_deliveries.json');

export interface OwnerDigestConfig {
  workspaceId: string;
  enabled: boolean;
  recipients: string[];
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  deliveryTime: string; // e.g. "08:00"
  workspaceTimezone: string; // e.g. "America/New_York"
  includeNeedsAttention: boolean;
  includeOpenRequests: boolean;
  includeResolvedLastWeek: boolean;
  lastSentPeriod?: string;
  lastSentAt?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DigestItem {
  id: string;
  title: string;
  category: string;
  ownerName?: string;
  status: string;
  dueAt?: string;
  completedAt?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  daysOverdue?: number;
}

export interface OwnerDigestData {
  workspaceId: string;
  brokerageName: string;
  principalName: string;
  generationDate: string;
  reportingPeriod: string;
  periodId: string;
  needsAttentionCount: number;
  openRequestsCount: number;
  resolvedLastWeekCount: number;
  needsAttention: DigestItem[];
  openRequests: DigestItem[];
  resolvedLastWeek: DigestItem[];
}

function ensureStorage(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({}, null, 2), 'utf-8');
  }
  if (!fs.existsSync(DELIVERY_AUDIT_PATH)) {
    fs.writeFileSync(DELIVERY_AUDIT_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

export const ownerDigestEngine = {
  getConfig(workspaceId: string): OwnerDigestConfig {
    ensureStorage();
    try {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const all = JSON.parse(raw);
      if (all[workspaceId]) {
        return all[workspaceId];
      }
    } catch (e) {
      console.error('Failed to read owner digest config:', e);
    }

    const defaultConfig: OwnerDigestConfig = {
      workspaceId,
      enabled: false, // Default to FALSE to prevent unintended automated sends
      recipients: [],
      dayOfWeek: 'monday',
      deliveryTime: '08:00',
      workspaceTimezone: 'America/New_York',
      includeNeedsAttention: true,
      includeOpenRequests: true,
      includeResolvedLastWeek: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };

    return defaultConfig;
  },

  saveConfig(workspaceId: string, updates: Partial<OwnerDigestConfig>, user: string = 'system'): OwnerDigestConfig {
    ensureStorage();
    let all: Record<string, OwnerDigestConfig> = {};
    try {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      all = JSON.parse(raw);
    } catch {}

    const existing = all[workspaceId] || this.getConfig(workspaceId);
    const updated: OwnerDigestConfig = {
      ...existing,
      ...updates,
      workspaceId,
      updatedAt: new Date().toISOString(),
      updatedBy: user
    };

    all[workspaceId] = updated;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(all, null, 2), 'utf-8');
    return updated;
  },

  generateDigestData(workspaceId: string, dbState: any = {}): OwnerDigestData {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Calculate ISO Week Number for period key
    const target = new Date(now.valueOf());
    const dayNr = (now.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const periodId = `digest_${workspaceId}_${now.getFullYear()}_W${weekNumber}`;

    const rawJobs = Array.isArray(dbState.jobs) ? dbState.jobs : [];
    const rawBriefItems = Array.isArray(dbState.ownerBriefItems) ? dbState.ownerBriefItems : [];
    const rawTransactions = Array.isArray(dbState.transactions) ? dbState.transactions : [];
    const sops = Array.isArray(dbState.sops) ? dbState.sops : [];

    const needsAttention: DigestItem[] = [];
    const openRequests: DigestItem[] = [];
    const resolvedLastWeek: DigestItem[] = [];

    // 1. Check for overdue / urgent requests
    rawJobs.forEach((job: any) => {
      const createdAt = new Date(job.created_at || job.createdAt || now);
      const isCompleted = job.status === 'completed' || job.status === 'resolved';
      const isUrgentOrBlocked = job.status === 'blocked' || job.status === 'waiting_approval' || job.priority === 'urgent' || job.priority === 'high';
      const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (isCompleted) {
        const completedAt = new Date(job.completed_at || job.updated_at || job.updatedAt || now);
        if (completedAt >= sevenDaysAgo) {
          resolvedLastWeek.push({
            id: job.id || `job_${Math.random()}`,
            title: job.workflowName || job.requestText || 'Operations Request',
            category: job.workflowKey || 'Request',
            ownerName: job.assignedTo || 'Operations Team',
            status: 'Completed',
            completedAt: completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          });
        }
      } else {
        if (isUrgentOrBlocked || ageHours > 24) {
          needsAttention.push({
            id: job.id || `job_${Math.random()}`,
            title: job.workflowName || job.requestText || 'Action item needing resolution',
            category: job.workflowKey || 'Escalation',
            ownerName: job.assignedTo || 'Assigned Lead',
            status: job.status === 'waiting_approval' ? 'Needs Approval' : (job.status === 'blocked' ? 'Blocked' : 'Overdue'),
            priority: job.priority || 'high',
            daysOverdue: Math.max(1, Math.floor(ageHours / 24))
          });
        } else {
          openRequests.push({
            id: job.id || `job_${Math.random()}`,
            title: job.workflowName || job.requestText || 'In-flight task',
            category: job.workflowKey || 'Task',
            ownerName: job.assignedTo || 'Operations Team',
            status: 'In Progress'
          });
        }
      }
    });

    // 2. Check for SOPs needing review
    sops.forEach((sop: any) => {
      if (sop.status === 'draft' || sop.status === 'under_review') {
        needsAttention.push({
          id: sop.id,
          title: `SOP Review: ${sop.title}`,
          category: 'SOP Review',
          ownerName: sop.author || 'Process Owner',
          status: 'Awaiting BIC Review',
          priority: 'normal'
        });
      }
    });

    // 3. Check for at-risk transactions
    rawTransactions.forEach((tx: any) => {
      if (tx.current_stage !== 'closed' && (tx.risk_level === 'blocked' || tx.risk_level === 'at_risk')) {
        needsAttention.push({
          id: tx.id || `tx_${Math.random()}`,
          title: `Closing Risk: ${tx.property_address || 'Property File'} ($${(tx.price || 0).toLocaleString()})`,
          category: 'Closing Compliance',
          ownerName: tx.agent_name || 'Listing Team',
          status: 'Document Blocked',
          priority: 'urgent'
        });
      }
    });

    // 4. Check Marketing Campaigns & Collateral Requests
    const rawCampaigns = Array.isArray(dbState.marketingCampaigns) ? dbState.marketingCampaigns : [];
    rawCampaigns.forEach((camp: any) => {
      const isCompleted = camp.status === 'completed' || camp.status === 'delivered' || camp.statusKey === 'completed';
      const isNeedsAttention = camp.status === 'needs_information' || camp.statusKey === 'needs_attention' || camp.needsAttention;
      const addr = camp.propertyAddress || camp.listingSnapshot?.propertyAddress || 'Listing Package';
      const agent = camp.agentName || camp.listingSnapshot?.listingAgentName || 'Agent';

      if (isCompleted) {
        resolvedLastWeek.push({
          id: camp.id,
          title: `Marketing Suite: ${addr} (${camp.packageType || 'Full Package'})`,
          category: 'Marketing Production',
          ownerName: camp.assignedTo || 'Eduardo Lovo',
          status: 'Delivered',
          completedAt: 'Last week'
        });
      } else if (isNeedsAttention) {
        needsAttention.push({
          id: camp.id,
          title: `Marketing Intake Blocked: ${addr}`,
          category: 'Marketing Intake',
          ownerName: agent,
          status: 'Missing Details',
          priority: 'high',
          daysOverdue: 1
        });
      } else {
        openRequests.push({
          id: camp.id,
          title: `Marketing Suite: ${addr}`,
          category: 'Marketing Production',
          ownerName: camp.assignedTo || 'Eduardo Lovo',
          status: camp.statusKey === 'ready_for_review' ? 'Ready for Review' : 'In Production'
        });
      }
    });

    // 5. Check Vendor Dispatch Orders (Yard Signs, HDR Photos, Lockboxes)
    const rawVendorOrders = Array.isArray(dbState.vendorOrders) ? dbState.vendorOrders : [];
    rawVendorOrders.forEach((vo: any) => {
      const isDone = vo.status === 'completed' || vo.status === 'installed';
      const addr = vo.propertyAddress || 'Property Site';
      if (isDone) {
        resolvedLastWeek.push({
          id: vo.id || `vo_${Math.random()}`,
          title: `Vendor Dispatch: ${vo.serviceType || 'Sign Post'} @ ${addr}`,
          category: 'Vendor Operations',
          ownerName: vo.vendorName || 'Coastal Sign Post',
          status: 'Installed / Completed',
          completedAt: 'Last week'
        });
      } else {
        openRequests.push({
          id: vo.id || `vo_${Math.random()}`,
          title: `Vendor Order: ${vo.serviceType || 'Field Dispatch'} @ ${addr}`,
          category: 'Vendor Operations',
          ownerName: vo.vendorName || 'Dispatch Queue',
          status: vo.status === 'scheduled' ? 'Scheduled' : 'Dispatched'
        });
      }
    });

    return {
      workspaceId,
      brokerageName: 'Nest Realty Wilmington',
      principalName: 'Ryan',
      generationDate: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      reportingPeriod: `Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      periodId,
      needsAttentionCount: needsAttention.length,
      openRequestsCount: openRequests.length,
      resolvedLastWeekCount: resolvedLastWeek.length,
      needsAttention: needsAttention.slice(0, 8),
      openRequests: openRequests.slice(0, 8),
      resolvedLastWeek: resolvedLastWeek.slice(0, 8)
    };
  },

  renderDigestHtml(data: OwnerDigestData): string {
    const section = (heading: string, count: number, items: DigestItem[], resolved = false) =>
      `<h2 style="margin:24px 0 12px;font:700 15px/22px Arial,sans-serif;color:#01362D;">${heading} (${count})</h2>` +
      (items.length ? items.map(item => `<p style="margin:0 0 16px;overflow-wrap:anywhere;"><strong>${escapeEmailHtml(item.title)}</strong><br>` +
        `${escapeEmailHtml(item.status)}${item.daysOverdue ? ` (${item.daysOverdue}d)` : ''}` +
        `${item.ownerName ? ` &bull; ${escapeEmailHtml(item.ownerName)}` : ''}` +
        `${resolved && item.completedAt ? `<br>Completed: ${escapeEmailHtml(item.completedAt)}` : ''}</p>`).join('')
        : `<p style="margin:0 0 16px;color:#6B7D75;">No items in this section.</p>`);
    return renderNoraEmailLayout({
      title: 'Monday Morning Briefing', status: 'RECEIVED',
      metadata: [data.generationDate, data.brokerageName].filter(Boolean).join(' • '),
      bodyHtml: `<p style="margin:0 0 14px;">Good morning, ${escapeEmailHtml(data.principalName || 'there')}.</p>` +
        '<p style="margin:0 0 14px;">Here is your operational briefing: items needing attention, open requests, and work resolved last week.</p>' +
        section('Needs attention', data.needsAttentionCount, data.needsAttention) +
        section('Open requests', data.openRequestsCount, data.openRequests) +
        section('Resolved last week', data.resolvedLastWeekCount, data.resolvedLastWeek, true),
      cta: { label: 'Open owner brief', url: 'https://nest-ops.shapework.co/app/owner-brief' },
    });
  },

  renderDigestText(data: OwnerDigestData): string {
    return `
NEST OPS — YOUR MONDAY BRIEFING
${data.generationDate} • ${data.brokerageName}

Good morning, ${data.principalName}.
Here is your week at a glance:
- ${data.needsAttentionCount} items needing attention
- ${data.openRequestsCount} active open requests
- ${data.resolvedLastWeekCount} operational items resolved last week

==================================================
NEEDS ATTENTION (${data.needsAttentionCount})
==================================================
${data.needsAttention.map(i => `* [${i.status}] ${i.title} (${i.ownerName || 'Unassigned'})`).join('\n') || 'None'}

==================================================
OPEN REQUESTS (${data.openRequestsCount})
==================================================
${data.openRequests.map(i => `* [${i.status}] ${i.title} (Lead: ${i.ownerName || 'Team'})`).join('\n') || 'None'}

==================================================
RESOLVED LAST WEEK (${data.resolvedLastWeekCount})
==================================================
${data.resolvedLastWeek.map(i => `* [Completed] ${i.title} (${i.completedAt || 'Last week'})`).join('\n') || 'None'}

Open Nest Ops: https://nest-ops.shapework.co/app/owner-brief
    `.trim();
  },

  async sendTestDigest(workspaceId: string, recipientEmail: string, dbState: any = {}, user: string = 'system'): Promise<{ success: boolean; messageId: string; timestamp: string }> {
    ensureStorage();
    const data = this.generateDigestData(workspaceId, dbState);
    const idempotencyKey = `digest_${workspaceId}_${recipientEmail}_${data.periodId}_test`;
    const now = new Date().toISOString();

    // Log delivery audit & check idempotency
    let audits: any[] = [];
    try {
      audits = JSON.parse(fs.readFileSync(DELIVERY_AUDIT_PATH, 'utf-8'));
    } catch {}

    const recentExisting = audits.find(
      a => a.idempotencyKey === idempotencyKey && (Date.now() - new Date(a.timestamp).getTime()) < 10000
    );

    if (recentExisting) {
      return {
        success: true,
        messageId: recentExisting.id,
        timestamp: recentExisting.timestamp
      };
    }

    const messageId = `msg_digest_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    audits.push({
      id: messageId,
      idempotencyKey,
      workspaceId,
      recipientEmail,
      deliveryType: 'test',
      periodId: data.periodId,
      needsAttentionCount: data.needsAttentionCount,
      openRequestsCount: data.openRequestsCount,
      resolvedLastWeekCount: data.resolvedLastWeekCount,
      triggeredBy: user,
      timestamp: now,
      status: 'delivered'
    });

    fs.writeFileSync(DELIVERY_AUDIT_PATH, JSON.stringify(audits, null, 2), 'utf-8');

    return {
      success: true,
      messageId,
      timestamp: now
    };
  }
};
