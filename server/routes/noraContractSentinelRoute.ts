/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * noraContractSentinelRoute: NC Form 2-T Contract Anomaly & Due Diligence Risk Sentinel API
 */

import { Router } from 'express';
import { NoraContractSentinelRepository } from '../persistence/noraContractSentinelRepository.js';

export const noraContractSentinelRouter = Router();

// 1. GET /api/nora/contract-sentinel/samples — Sample NC Form 2-T Contracts
noraContractSentinelRouter.get('/samples', (req, res) => {
  try {
    const samples = NoraContractSentinelRepository.getSampleContracts();
    res.json({
      success: true,
      samples
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/nora/contract-sentinel/scan — Inspect Contract Payload & Generate Sentinel Diagnostic
noraContractSentinelRouter.post('/scan', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.propertyAddress) {
      return res.status(400).json({ success: false, error: 'Missing required contract payload fields (propertyAddress).' });
    }

    const report = NoraContractSentinelRepository.inspectContract(payload);
    res.json({
      success: true,
      report
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
