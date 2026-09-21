/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Unified Asset Resolver
 * Aggregates and deduplicates photos, attachments, external links, and proofs
 * across tasks, parent requests, and campaigns.
 */

export interface ResolvedAssetPhoto {
  id: string;
  name: string;
  url: string;
  type?: string;
  sizeBytes?: number;
  sourceBadge?: string;
  receivedAt?: string;
}

export interface ResolvedAssetAttachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  hash?: string;
}

export interface ResolvedExternalLink {
  url: string;
  title: string;
  type: string;
}

export interface ResolvedTaskAssets {
  heroPhotoUrl: string | null;
  photos: ResolvedAssetPhoto[];
  attachments: ResolvedAssetAttachment[];
  externalLinks: ResolvedExternalLink[];
  proofs: any[];
  totalPhotoCount: number;
  totalAssetCount: number;
  hasRealPhoto: boolean;
}

export function resolveTaskAssets(task?: any, parentRequest?: any, campaign?: any): ResolvedTaskAssets {
  const photos: ResolvedAssetPhoto[] = [];
  const attachments: ResolvedAssetAttachment[] = [];
  const externalLinks: ResolvedExternalLink[] = [];
  const proofs: any[] = [];
  const seenUrls = new Set<string>();

  const isInvalidUrl = (url: string) => {
    if (!url || typeof url !== 'string') return true;
    const lower = url.toLowerCase();
    return (
      lower.includes('placeholder') ||
      lower.includes('nest-realty-logo') ||
      lower.includes('default-avatar')
    );
  };

  const addPhoto = (item: any, sourceBadge = 'Direct Asset') => {
    if (!item) return;
    let url = '';
    let name = 'Listing Photo';
    let id = '';
    let type = 'Exterior';
    let sizeBytes = 0;

    if (typeof item === 'string') {
      url = item;
      id = `photo_${url}`;
    } else if (typeof item === 'object') {
      url = item.url || '';
      name = item.name || item.filename || item.caption || 'Listing Photo';
      id = item.id || `photo_${url}`;
      type = item.type || item.category || 'Exterior';
      sizeBytes = item.sizeBytes || item.byteSize || 0;
    }

    if (!url || isInvalidUrl(url) || seenUrls.has(url)) return;
    seenUrls.add(url);

    photos.push({
      id,
      name,
      url,
      type,
      sizeBytes,
      sourceBadge,
      receivedAt: item.receivedAt || item.createdAt || task?.createdAt
    });
  };

  // 1. Photos on Task
  if (Array.isArray(task?.photos)) {
    task.photos.forEach((p: any) => addPhoto(p, 'Task Photo'));
  }
  if (task?.heroPhotoUrl) {
    addPhoto({ url: task.heroPhotoUrl, name: 'Hero Photo' }, 'Hero Photo');
  }

  // 2. Photos on Parent Request
  if (Array.isArray(parentRequest?.photos)) {
    parentRequest.photos.forEach((p: any) => addPhoto(p, 'Request Photo'));
  }
  if (parentRequest?.heroPhotoUrl) {
    addPhoto({ url: parentRequest.heroPhotoUrl, name: 'Hero Photo' }, 'Request Hero');
  }

  // 3. Photos on Campaign
  if (Array.isArray(campaign?.photos)) {
    campaign.photos.forEach((p: any) => addPhoto(p, 'Campaign Photo'));
  }
  if (Array.isArray(campaign?.listingSnapshot?.approvedSourcePhotos)) {
    campaign.listingSnapshot.approvedSourcePhotos.forEach((p: any) => addPhoto(p, 'MLS / CRM Photo'));
  }
  if (campaign?.heroPhotoUrl) {
    addPhoto({ url: campaign.heroPhotoUrl, name: 'Hero Photo' }, 'Campaign Hero');
  }

  // 4. Attachments on Task and Parent Request
  const rawAtts = [
    ...(Array.isArray(task?.attachments) ? task.attachments : []),
    ...(Array.isArray(parentRequest?.attachments) ? parentRequest.attachments : [])
  ];

  for (const a of rawAtts) {
    if (!a) continue;
    if (typeof a === 'string') {
      if (a.match(/\.(jpe?g|png|webp|avif)$/i)) {
        addPhoto(a, 'Attachment');
      } else {
        attachments.push({ filename: 'Attached Document', contentType: 'application/octet-stream', sizeBytes: 0, url: a });
      }
    } else if (typeof a === 'object' && a.url) {
      if (a.contentType?.includes('image') || a.url.match(/\.(jpe?g|png|webp|avif)/i)) {
        addPhoto({ url: a.url, name: a.filename || 'Attached Photo', sizeBytes: a.sizeBytes }, 'Attachment');
      } else if (a.contentType === 'application/external-link' || a.type === 'external_link') {
        if (!externalLinks.some(l => l.url === a.url)) {
          externalLinks.push({ url: a.url, title: a.filename || 'External Asset Link', type: 'external_link' });
        }
      } else {
        if (!attachments.some(att => att.url === a.url)) {
          attachments.push({
            filename: a.filename || 'Document',
            contentType: a.contentType || 'application/pdf',
            sizeBytes: a.sizeBytes || 0,
            url: a.url,
            hash: a.hash
          });
        }
      }
    }
  }

  // 5. External Links
  const rawLinks = [
    ...(Array.isArray(task?.externalLinks) ? task.externalLinks : []),
    ...(Array.isArray(parentRequest?.externalLinks) ? parentRequest.externalLinks : [])
  ];
  for (const l of rawLinks) {
    if (l && l.url && !externalLinks.some(existing => existing.url === l.url)) {
      externalLinks.push(l);
    }
  }

  // 6. Proofs
  if (Array.isArray(task?.proofs)) proofs.push(...task.proofs);
  if (Array.isArray(task?.stagedAssets)) proofs.push(...task.stagedAssets);
  if (task?.proofUrl && !proofs.some((p: any) => p.previewUrl === task.proofUrl || p.url === task.proofUrl)) {
    proofs.push({ previewUrl: task.proofUrl, fileName: 'Deliverable Proof', version: task.proofVersion || 1 });
  }

  const heroPhotoUrl = photos[0]?.url || null;

  return {
    heroPhotoUrl,
    photos,
    attachments,
    externalLinks,
    proofs,
    totalPhotoCount: photos.length,
    totalAssetCount: photos.length + attachments.length + externalLinks.length,
    hasRealPhoto: photos.length > 0
  };
}
