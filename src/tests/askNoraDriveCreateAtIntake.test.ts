/**
 * Create-at-intake AskNora Drive folder promotion.
 * Matrix: create on task birth, reuse by address, fail-closed defer (no fake URL),
 * proofUrl https only, Approve needs a real folder + ≥1 file, data: and 1DRV_ rejected.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  promoteAskNoraListingFolder,
  resolveReviewProofUrl,
  assertDriveReadyForApproveNotify,
  isDurableHttpsProofUrl,
  resetAskNoraListingFolderRegistry,
  __setAskNoraDriveDepsForTests,
  type AskNoraDriveDeps,
} from '../../server/services/askNoraDriveDelivery';
import { validateProofUrl } from '../utils/assetInspection';
import {
  processInboundAgentEmail,
  type InboundAgentEmail,
} from '../../server/integrations/google/noraEmailIntakeService';
import { resetCanonicalStoreForTesting } from '../../server/persistence/marketingCampaignsRepository';

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

type FolderRec = { id: string; url: string; name: string; files: string[] };

function makeFakeDrive() {
  const folders = new Map<string, FolderRec>();
  let seq = 0;
  let failCreate = false;
  let createCount = 0;
  const createdNames: string[] = [];

  const deps: AskNoraDriveDeps = {
    async findFolderByAddress(address: string) {
      const key = address.split(',')[0].trim().toLowerCase();
      for (const folder of folders.values()) {
        if (folder.name.split(',')[0].trim().toLowerCase() === key) {
          return { id: folder.id, url: folder.url };
        }
      }
      return null;
    },
    async createFolder({ propertyAddress }) {
      createCount += 1;
      createdNames.push(propertyAddress);
      if (failCreate) {
        return {
          isLive: false,
          driveFolderId: '1DRV_SHOULD_NOT_LEAK',
          driveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_SHOULD_NOT_LEAK',
        };
      }
      seq += 1;
      const id = `1AbCrealFolder${seq}xyz`;
      const url = `https://drive.google.com/drive/folders/${id}`;
      folders.set(id, { id, url, name: propertyAddress, files: [] });
      return { isLive: true, driveFolderId: id, driveFolderUrl: url };
    },
    async uploadFile({ folderId, fileName }) {
      const folder = folders.get(folderId);
      if (!folder) return { isLive: false, fileId: '', webViewLink: '' };
      seq += 1;
      const fileId = `1FileReal${seq}xyz`;
      const webViewLink = `https://drive.google.com/file/d/${fileId}/view`;
      folder.files.push(fileName);
      return { isLive: true, fileId, webViewLink };
    },
  };

  return {
    deps,
    folders,
    createdNames,
    get createCount() {
      return createCount;
    },
    setFailCreate(v: boolean) {
      failCreate = v;
    },
  };
}

function intakeEmail(address: string, messageId: string): InboundAgentEmail {
  return {
    id: `eml_${messageId}`,
    messageId: `<${messageId}@nestrealty.com>`,
    fromEmail: 'matt.orr@nestrealty.com',
    fromName: 'Matt Orr',
    subject: `Flyer for ${address}`,
    bodyText: `Hi Nora, please make a 1 page flyer for ${address}.`,
    receivedAt: new Date().toISOString(),
    attachments: [],
  };
}

describe('AskNora Drive create-at-intake promotion', () => {
  let drive: ReturnType<typeof makeFakeDrive>;

  beforeEach(() => {
    resetCanonicalStoreForTesting();
    resetAskNoraListingFolderRegistry();
    drive = makeFakeDrive();
    __setAskNoraDriveDepsForTests(drive.deps);
  });

  afterEach(() => {
    __setAskNoraDriveDepsForTests(null);
    resetAskNoraListingFolderRegistry();
  });

  it('creates a shared folder named by the property address at intake', async () => {
    const address = '414 Help Me Street, Wilmington, NC 28401';
    const created = await promoteAskNoraListingFolder({
      propertyAddress: address,
      agentName: 'Matt Orr',
      agentEmail: 'matt.orr@nestrealty.com',
    });
    expect(created.ok).toBe(true);
    expect(created.deferred).toBe(false);
    expect(created.created).toBe(true);
    expect(created.reused).toBe(false);
    expect(created.driveFolderUrl.startsWith('https://drive.google.com/drive/folders/')).toBe(true);
    expect(created.driveFolderUrl).not.toMatch(/1DRV_|\/folders\/folder_|\/folders\/sub_/);
    expect(created.driveFolderId).not.toMatch(/^(1DRV_|folder_|sub_)/);
    expect(drive.createdNames[0]).toBe(address);
    expect(created.fileCount).toBe(0);

    const email = await processInboundAgentEmail(intakeEmail(address, 'intake_create_1'));
    expect(email.isMarketingRequest).toBe(true);
    expect(email.driveFolderUrl).toBe(created.driveFolderUrl);
    expect(email.driveFolderUrl).not.toMatch(/1DRV_/);
    expect(drive.createCount).toBe(1);
  });

  it('reuses the same folder for the same address and appends assets', async () => {
    const address = '1104 South Live Oak Drive, Wilmington, NC';
    const first = await promoteAskNoraListingFolder({ propertyAddress: address, agentEmail: 'asknora@nestrealty.com' });
    const second = await promoteAskNoraListingFolder({
      propertyAddress: '1104 South Live Oak Drive',
      agentEmail: 'asknora@nestrealty.com',
      assets: [{ fileName: 'flyer.png', mimeType: 'image/png', content: Buffer.from('png') }],
    });
    expect(second.reused).toBe(true);
    expect(second.created).toBe(false);
    expect(second.driveFolderId).toBe(first.driveFolderId);
    expect(second.driveFolderUrl).toBe(first.driveFolderUrl);
    expect(second.uploaded).toHaveLength(1);
    expect(second.uploaded[0].webViewLink.startsWith('https://drive.google.com/file/d/')).toBe(true);
    expect(drive.createCount).toBe(1);

    const again = await processInboundAgentEmail(intakeEmail('1104 South Live Oak Drive', 'intake_reuse_1'));
    const follow = await processInboundAgentEmail(intakeEmail('1104 South Live Oak Drive, Wilmington, NC', 'intake_reuse_2'));
    expect(again.driveFolderUrl).toBe(follow.driveFolderUrl);
    expect(drive.createCount).toBe(1);
  });

  it('defers with no fake URL when Drive create fails', async () => {
    drive.setFailCreate(true);
    const promoted = await promoteAskNoraListingFolder({
      propertyAddress: '9 Peachtree Lane, Wilmington, NC',
      agentEmail: 'asknora@nestrealty.com',
    });
    expect(promoted.ok).toBe(false);
    expect(promoted.deferred).toBe(true);
    expect(promoted.driveFolderUrl).toBe('');
    expect(promoted.driveFolderId).toBe('');
    expect(JSON.stringify(promoted)).not.toMatch(/1DRV_|folder_/);

    const email = await processInboundAgentEmail(intakeEmail('9 Peachtree Lane', 'intake_fail_1'));
    expect(email.driveFolderUrl || '').toBe('');
    expect(JSON.stringify(email)).not.toMatch(/1DRV_/);
  });

  it('accepts only durable https proof URLs and rejects data: and stubs', async () => {
    expect(isDurableHttpsProofUrl('https://drive.google.com/file/d/1AbCrealFile999xyz/view')).toBe(true);
    expect(isDurableHttpsProofUrl('https://drive.google.com/drive/folders/1AbCrealFolder1xyz')).toBe(true);
    expect(isDurableHttpsProofUrl(TINY_PNG)).toBe(false);
    expect(isDurableHttpsProofUrl('/uploads/Test_marcusgmail.png')).toBe(false);
    expect(isDurableHttpsProofUrl('https://drive.google.com/drive/folders/1DRV_PEACHTREE')).toBe(false);
    expect(isDurableHttpsProofUrl('https://drive.google.com/drive/folders/folder_123')).toBe(false);

    expect(validateProofUrl(TINY_PNG).valid).toBe(false);
    expect(validateProofUrl(TINY_PNG).error || '').toMatch(/INVALID_PROTOCOL/);
    expect(validateProofUrl('https://drive.google.com/drive/folders/1DRV_PEACHTREE').valid).toBe(false);
    expect(validateProofUrl('https://drive.google.com/file/d/1AbCrealFile999xyz/view').valid).toBe(true);
    expect(validateProofUrl('https://drive.google.com/drive/folders/1AbCrealFolder1xyz').valid).toBe(true);
  });

  it('promotes a staged data: proof to an https Drive file on the same folder', async () => {
    const address = '814 Colonial Drive, Wilmington NC';
    const folder = await promoteAskNoraListingFolder({ propertyAddress: address });
    const resolved = await resolveReviewProofUrl({
      proofUrl: TINY_PNG,
      propertyAddress: address,
      existingFolderUrl: folder.driveFolderUrl,
      stagedAssets: [{ previewUrl: TINY_PNG, fileName: 'colonial-flyer.png', mimeType: 'image/png' }],
    });
    expect(resolved.ok).toBe(true);
    expect(resolved.proofUrl.startsWith('https://drive.google.com/file/d/')).toBe(true);
    expect(resolved.proofUrl).not.toMatch(/^data:/);
    expect(resolved.driveFolderUrl).toBe(folder.driveFolderUrl);
    expect(drive.createCount).toBe(1);
  });

  it('does not accept data: or a stub when promotion cannot produce https', async () => {
    drive.setFailCreate(true);
    const resolved = await resolveReviewProofUrl({
      proofUrl: TINY_PNG,
      propertyAddress: '22 Deferred Court',
      stagedAssets: [{ previewUrl: TINY_PNG, fileName: 'proof.png' }],
    });
    expect(resolved.ok).toBe(false);
    expect(resolved.proofUrl).toBe('');
    expect(resolved.proofUrl.startsWith('data:')).toBe(false);
    expect(JSON.stringify(resolved)).not.toMatch(/1DRV_/);
    expect(resolved.error || '').toMatch(/INVALID_PROTOCOL|https/);

    const stub = await resolveReviewProofUrl({
      proofUrl: 'https://drive.google.com/drive/folders/1DRV_PEACHTREE',
      propertyAddress: '22 Deferred Court',
    });
    expect(stub.ok).toBe(false);
    expect(stub.proofUrl).toBe('');
  });

  it('requires a real folder and at least one file before Approve & Notify', () => {
    const empty = assertDriveReadyForApproveNotify({
      driveFolderUrl: 'https://drive.google.com/drive/folders/1AbCrealFolder1xyz',
      driveFolderId: '1AbCrealFolder1xyz',
      fileCount: 0,
      linkable: false,
      uploaded: [],
    });
    expect(empty.allowed).toBe(false);
    expect(empty.errorCode).toBe('DRIVE_EMPTY');

    const ready = assertDriveReadyForApproveNotify({
      driveFolderUrl: 'https://drive.google.com/drive/folders/1AbCrealFolder1xyz',
      driveFolderId: '1AbCrealFolder1xyz',
      fileCount: 1,
      uploaded: [{ fileName: 'flyer.png', webViewLink: 'https://drive.google.com/file/d/1FileReal9xyz/view' }],
    });
    expect(ready.allowed).toBe(true);

    const stub = assertDriveReadyForApproveNotify({
      driveFolderUrl: 'https://drive.google.com/drive/folders/1DRV_PEACHTREE',
      driveFolderId: '1DRV_PEACHTREE',
      fileCount: 2,
      uploaded: [{}],
    });
    expect(stub.allowed).toBe(false);
    expect(stub.errorCode).toBe('DRIVE_STUB_OR_MISSING');

    const dataUrl = assertDriveReadyForApproveNotify({
      driveFolderUrl: TINY_PNG,
      driveFolderId: '',
      fileCount: 1,
    });
    expect(dataUrl.allowed).toBe(false);
  });
});
