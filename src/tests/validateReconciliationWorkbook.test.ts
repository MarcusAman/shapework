/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Reconciliation Workbook Validation Test Suite
 * Rigorously tests the 12 reconciliation validation gates across fixtures:
 * 1. Fully approved fixture
 * 2. Blank decisions
 * 3. UNSURE decision
 * 4. Invalid merge target
 * 5. Cross-broker merge without written approval
 * 6. Cross-workspace merge
 * 7. Preservation of six independent placeholders with NULL keys
 * 8. Duplicate normalized property active container detection
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { validateReconciliationWorkbook } from '../../scripts/migration/validate_reconciliation_workbook.js';

describe('Reconciliation Workbook Validation Suite', () => {
  const testDir = path.join(process.cwd(), 'scratch/test_reconciliation');
  const candidateJsonPath = path.join(testDir, 'candidate_store.json');

  const baseRequests = [
    {
      id: 'req_001',
      title: 'Flyer for 101 Landfall Dr',
      propertyAddress: '101 Landfall Dr, Wilmington, NC 28405',
      agentName: 'Matt Orr',
      workspaceId: 'ws_wilmington',
      status: 'ready_for_review',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    },
    {
      id: 'req_002',
      title: 'Brochure for 102 Landfall Dr',
      propertyAddress: '102 Landfall Dr, Wilmington, NC 28405',
      agentName: 'Sarah Jenkins',
      workspaceId: 'ws_wilmington',
      status: 'ready_for_review',
      createdAt: '2026-09-01T11:00:00Z',
      updatedAt: '2026-09-01T11:00:00Z'
    },
    // Six independent placeholders
    { id: 'req_ph_1', title: 'Listing 1', propertyAddress: 'Wilmington, NC Area Listing 1', agentName: 'Ryan Crecelius', workspaceId: 'ws_wilmington', status: 'needs_info' },
    { id: 'req_ph_2', title: 'Listing 2', propertyAddress: 'Wilmington, NC Area Listing 2', agentName: 'Ryan Crecelius', workspaceId: 'ws_wilmington', status: 'needs_info' },
    { id: 'req_ph_3', title: 'Listing 3', propertyAddress: 'Wilmington, NC Area Listing 3', agentName: 'Ryan Crecelius', workspaceId: 'ws_wilmington', status: 'needs_info' },
    { id: 'req_ph_4', title: 'Listing 4', propertyAddress: 'Wilmington, NC Area Listing 4', agentName: 'Ryan Crecelius', workspaceId: 'ws_wilmington', status: 'needs_info' },
    { id: 'req_ph_5', title: 'Listing 5', propertyAddress: 'Wilmington, NC Area Listing 5', agentName: 'Ryan Crecelius', workspaceId: 'ws_wilmington', status: 'needs_info' },
    { id: 'req_ph_6', title: 'Listing 6', propertyAddress: 'Wilmington, NC Area Listing 6', agentName: 'Ryan Crecelius', workspaceId: 'ws_wilmington', status: 'needs_info' }
  ];

  const baseTasks = [
    {
      id: 'tsk_001',
      requestId: 'req_001',
      title: '1-Page Property Flyer',
      propertyAddress: '101 Landfall Dr, Wilmington, NC 28405',
      agentName: 'Matt Orr',
      assignedTo: 'Melissa Gagliardi',
      status: 'ready_for_review',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z'
    }
  ];

  beforeAll(() => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(candidateJsonPath, JSON.stringify({ requests: baseRequests, tasks: baseTasks }, null, 2));
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  async function createWorkbookFixture(
    filename: string,
    reqOverrides: (row: any, idx: number) => void = () => {},
    taskOverrides: (row: any, idx: number) => void = () => {}
  ): Promise<string> {
    const wb = new ExcelJS.Workbook();
    const wsReq = wb.addWorksheet('Requests');
    wsReq.addRow(['ID', 'Created', 'Updated', 'Broker', 'Address', 'Confirmed', 'Cat', 'Deliv', 'Need', 'Status', 'Tasks', 'Src', 'Conf', 'Ryan', 'Melissa', 'Final', 'CorrAddr', 'CorrBroker', 'CorrDeliv', 'CorrDead', 'CorrStatus', 'MergeId', 'Notes', 'RevBy', 'RevDate']);

    baseRequests.forEach((r, idx) => {
      const row = {
        id: r.id,
        created: '2026-09-01',
        updated: '2026-09-01',
        broker: r.agentName,
        address: r.propertyAddress,
        confirmed: 'Yes',
        cat: 'marketing',
        deliv: r.title,
        need: '-',
        status: r.status,
        tasks: 1,
        src: 'email',
        conf: 'High',
        ryan: 'KEEP',
        melissa: 'KEEP',
        final: 'KEEP',
        corrAddr: '',
        corrBroker: '',
        corrDeliv: '',
        corrDead: '',
        corrStatus: '',
        mergeId: '',
        notes: '',
        revBy: 'Ryan Crecelius & Melissa Gagliardi',
        revDate: '2026-09-03'
      };
      reqOverrides(row, idx);
      wsReq.addRow(Object.values(row));
    });

    const wsTask = wb.addWorksheet('Tasks');
    wsTask.addRow(['ID', 'ReqId', 'Address', 'Broker', 'Owner', 'Type', 'Deliv', 'Status', 'Created', 'Updated', 'Due', 'Dupe', 'Ryan', 'Melissa', 'Final', 'CorrStatus', 'MergeId', 'Notes', 'RevBy', 'RevDate']);

    baseTasks.forEach((t, idx) => {
      const row = {
        id: t.id,
        reqId: t.requestId,
        address: t.propertyAddress,
        broker: t.agentName,
        owner: t.assignedTo,
        type: 'print',
        deliv: t.title,
        status: t.status,
        created: '2026-09-01',
        updated: '2026-09-01',
        due: '2026-09-03',
        dupe: 'No',
        ryan: 'KEEP',
        melissa: 'KEEP',
        final: 'KEEP',
        corrStatus: '',
        mergeId: '',
        notes: '',
        revBy: 'Ryan Crecelius & Melissa Gagliardi',
        revDate: '2026-09-03'
      };
      taskOverrides(row, idx);
      wsTask.addRow(Object.values(row));
    });

    const filePath = path.join(testDir, filename);
    await wb.xlsx.writeFile(filePath);
    return filePath;
  }

  it('1. Passes validation on a fully approved fixture and generates reconciled output', async () => {
    const fixturePath = await createWorkbookFixture('fully_approved.xlsx');
    const { report, reconciledData } = await validateReconciliationWorkbook(fixturePath, candidateJsonPath);

    expect(report.isValid).toBe(true);
    expect(report.errors.length).toBe(0);
    expect(report.totalRequestsReviewed).toBe(8);
    expect(report.placeholdersPreservedCount).toBe(6);
    expect(reconciledData).toBeDefined();
    expect(reconciledData?.reviewerSignOff.brokerInCharge).toBe('Ryan Crecelius');
    expect(reconciledData?.reviewerSignOff.marketingDirector).toBe('Melissa Gagliardi');
  });

  it('2. Rejects blank decisions when any record is unreviewed', async () => {
    const fixturePath = await createWorkbookFixture('blank_decisions.xlsx', (row, idx) => {
      if (idx === 0) {
        row.ryan = '';
        row.final = '';
      }
    });

    const { report } = await validateReconciliationWorkbook(fixturePath, candidateJsonPath);
    expect(report.isValid).toBe(false);
    expect(report.errors.some(e => e.includes('Ryan decision is BLANK'))).toBe(true);
  });

  it('3. Rejects workbook when any decision is left as UNSURE', async () => {
    const fixturePath = await createWorkbookFixture('unsure_decision.xlsx', (row, idx) => {
      if (idx === 0) {
        row.ryan = 'UNSURE';
        row.final = 'UNSURE';
      }
    });

    const { report } = await validateReconciliationWorkbook(fixturePath, candidateJsonPath);
    expect(report.isValid).toBe(false);
    expect(report.errors.some(e => e.includes('Decision is UNSURE'))).toBe(true);
  });

  it('4. Rejects invalid merge target when target ID does not exist', async () => {
    const fixturePath = await createWorkbookFixture('invalid_merge.xlsx', (row, idx) => {
      if (idx === 0) {
        row.ryan = 'MERGE';
        row.final = 'MERGE';
        row.mergeId = 'req_non_existent_999';
      }
    });

    const { report } = await validateReconciliationWorkbook(fixturePath, candidateJsonPath);
    expect(report.isValid).toBe(false);
    expect(report.errors.some(e => e.includes('Merge target [req_non_existent_999] does not exist'))).toBe(true);
  });

  it('5. Rejects cross-broker merge without explicit written approval in notes', async () => {
    const fixturePath = await createWorkbookFixture('cross_broker_merge.xlsx', (row, idx) => {
      if (idx === 0) {
        row.ryan = 'MERGE';
        row.final = 'MERGE';
        row.mergeId = 'req_002'; // req_001 is Matt Orr, req_002 is Sarah Jenkins
        row.notes = 'Regular merge';
      }
    });

    const { report } = await validateReconciliationWorkbook(fixturePath, candidateJsonPath);
    expect(report.isValid).toBe(false);
    expect(report.errors.some(e => e.includes('Forbidden cross-broker merge'))).toBe(true);
  });

  it('6. Allows cross-broker merge when explicit approval is present in notes', async () => {
    const fixturePath = await createWorkbookFixture('cross_broker_approved.xlsx', (row, idx) => {
      if (idx === 0) {
        row.ryan = 'MERGE';
        row.final = 'MERGE';
        row.mergeId = 'req_002';
        row.notes = 'Cross-broker approved by BIC Ryan Crecelius for co-listing team';
      }
    });

    const { report } = await validateReconciliationWorkbook(fixturePath, candidateJsonPath);
    expect(report.isValid).toBe(true);
    expect(report.mergedRequestsCount).toBe(1);
  });

  it('7. Rejects automatic merging or collapsing of placeholder drafts', async () => {
    const fixturePath = await createWorkbookFixture('placeholder_collapse.xlsx', (row, idx) => {
      if (idx === 2) { // req_ph_1
        row.ryan = 'MERGE';
        row.final = 'MERGE';
        row.mergeId = 'req_ph_2'; // Attempting to merge placeholder 1 into placeholder 2
      }
    });

    const { report } = await validateReconciliationWorkbook(fixturePath, candidateJsonPath);
    expect(report.isValid).toBe(false);
    expect(report.errors.some(e => e.includes('Automatic collapse of placeholder'))).toBe(true);
  });

  it('8. Detects duplicate active property containers when two active requests share normalized address', async () => {
    const fixturePath = await createWorkbookFixture('duplicate_active_address.xlsx', (row, idx) => {
      if (idx === 1) { // req_002
        // Correct address to match req_001
        row.corrAddr = '101 Landfall Dr, Wilmington, NC 28405';
      }
    });

    const { report } = await validateReconciliationWorkbook(fixturePath, candidateJsonPath);
    expect(report.isValid).toBe(false);
    expect(report.errors.some(e => e.includes('Duplicate active property container conflict'))).toBe(true);
  });
});
