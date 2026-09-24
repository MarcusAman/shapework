import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveCanonicalMarketingTask,
  getCanonicalMarketingTaskById,
  submitCanonicalMarketingTaskProof,
  approveCanonicalMarketingTaskProof,
  isTaskProofApproved,
  CanonicalMarketingTask,
  purgeAllCanonicalMarketingData
} from '../../server/persistence/marketingCampaignsRepository.js';

describe('Proof Cryptographic Checksum & Approval Binding', () => {
  const taskId = 'tsk_test_proof_binding_101';
  const v1Checksum = '8c1ac69cebe5c77354ed25eb1955085505608f29b53738857cbd01c561b743ca';
  const v2Checksum = 'e9c180f7883fc79cef9205b08daf706dfa953c04ede164b2b8993134557cb6b0';

  beforeEach(() => {
    purgeAllCanonicalMarketingData();

    const task: CanonicalMarketingTask = {
      id: taskId,
      title: 'Open House Tri-Fold Flyer',
      propertyAddress: '1104 South Live Oak Parkway',
      agentName: 'Marcus Aman',
      status: 'in_progress',
      category: 'marketing_collateral',
      assignedTo: 'Eduardo Lovo',
      assignedToId: 'usr_producer_eduardo',
      reviewOwnerName: 'Melissa Gagliardi',
      reviewOwnerId: 'dir_melissa_gagliardi_33'
    };
    saveCanonicalMarketingTask(task);
  });

  it('submits Proof V1 and starts in awaiting_review with zero approval inheritance', () => {
    const updated = submitCanonicalMarketingTaskProof(
      taskId,
      '/uploads/1104_Live_Oak_v1.pdf',
      'Initial tri-fold flyer draft',
      { id: 'usr_producer_eduardo', name: 'Eduardo Lovo' },
      {
        assetId: 'ast_v1',
        deliverableName: 'Open House Tri-Fold Flyer',
        fileMetadata: { sha256Checksum: v1Checksum, sizeBytes: 1133966 }
      }
    );

    expect(updated).not.toBeNull();
    expect(updated?.proofVersion).toBe(1);
    expect(updated?.reviewState).toBe('awaiting_review');
    expect(updated?.approvedChecksum).toBeUndefined();
    expect(isTaskProofApproved(updated)).toBe(false);
  });

  it('binds approval strictly to Proof V1 checksum when approved by director', () => {
    submitCanonicalMarketingTaskProof(
      taskId,
      '/uploads/1104_Live_Oak_v1.pdf',
      'Initial draft',
      { id: 'usr_producer_eduardo', name: 'Eduardo Lovo' },
      {
        assetId: 'ast_v1',
        fileMetadata: { sha256Checksum: v1Checksum, sizeBytes: 1133966 }
      }
    );

    const approved = approveCanonicalMarketingTaskProof(
      taskId,
      'Approved V1 draft',
      { id: 'dir_melissa_gagliardi_33', name: 'Melissa Gagliardi' }
    );

    expect(approved?.reviewState).toBe('approved');
    expect(approved?.approvedProofVersion).toBe(1);
    expect(approved?.approvedChecksum).toBe(v1Checksum);
    expect(approved?.approvedAssetId).toBe('ast_v1');
    expect(approved?.approvedBy).toBe('Melissa Gagliardi');
    expect(isTaskProofApproved(approved)).toBe(true);
  });

  it('clears approval and rejects approval inheritance when Proof V2 is uploaded', () => {
    // 1. Submit & approve V1
    submitCanonicalMarketingTaskProof(
      taskId,
      '/uploads/1104_Live_Oak_v1.pdf',
      'V1',
      { id: 'usr_producer_eduardo', name: 'Eduardo Lovo' },
      { fileMetadata: { sha256Checksum: v1Checksum } }
    );
    approveCanonicalMarketingTaskProof(
      taskId,
      'V1 approved',
      { id: 'dir_melissa_gagliardi_33', name: 'Melissa Gagliardi' }
    );

    // 2. Submit revised V2
    const v2Task = submitCanonicalMarketingTaskProof(
      taskId,
      '/uploads/1104_Live_Oak_v2.pdf',
      'V2 revisions applied',
      { id: 'usr_producer_eduardo', name: 'Eduardo Lovo' },
      {
        assetId: 'ast_v2',
        fileMetadata: { sha256Checksum: v2Checksum }
      }
    );

    // V2 must NOT inherit approval!
    expect(v2Task?.proofVersion).toBe(2);
    expect(v2Task?.reviewState).toBe('awaiting_review');
    expect(v2Task?.approvedChecksum).toBeUndefined();
    expect(v2Task?.approvedProofVersion).toBeUndefined();
    expect(isTaskProofApproved(v2Task)).toBe(false);

    // 3. Approve V2
    const approvedV2 = approveCanonicalMarketingTaskProof(
      taskId,
      'V2 revised proof approved',
      { id: 'dir_melissa_gagliardi_33', name: 'Melissa Gagliardi' }
    );

    expect(approvedV2?.reviewState).toBe('approved');
    expect(approvedV2?.approvedProofVersion).toBe(2);
    expect(approvedV2?.approvedChecksum).toBe(v2Checksum);
    expect(approvedV2?.approvedAssetId).toBe('ast_v2');
    expect(isTaskProofApproved(approvedV2)).toBe(true);
  });

  it('fails verification if checksum is tampered or replaced', () => {
    submitCanonicalMarketingTaskProof(
      taskId,
      '/uploads/1104_Live_Oak_v2.pdf',
      'V2',
      { id: 'usr_producer_eduardo', name: 'Eduardo Lovo' },
      { fileMetadata: { sha256Checksum: v2Checksum } }
    );
    const approved = approveCanonicalMarketingTaskProof(taskId, 'Approved');
    expect(isTaskProofApproved(approved)).toBe(true);

    // Tamper with checksum
    if (approved) {
      approved.approvedChecksum = 'tampered_or_altered_checksum_999999999999';
      expect(isTaskProofApproved(approved)).toBe(false);
    }
  });
});
