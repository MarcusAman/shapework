/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Recruiting & MLS Market Share Express Route
 */

import { Router, Request, Response } from 'express';
import { RecruitingAndMarketShareRepository } from '../persistence/recruitingAndMarketShareRepository.js';

export const recruitingRouter = Router();

// GET /api/recruiting/market-share
recruitingRouter.get('/market-share', (_req: Request, res: Response) => {
  try {
    const rankings = RecruitingAndMarketShareRepository.getMarketShareRankings();
    res.json({ success: true, rankings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/recruiting/candidates
recruitingRouter.get('/candidates', (req: Request, res: Response) => {
  try {
    const { brokerage, submarket, status, minVolume } = req.query;
    const candidates = RecruitingAndMarketShareRepository.getCandidates({
      brokerage: brokerage as string,
      submarket: submarket as string,
      status: status as string,
      minVolume: minVolume ? parseInt(minVolume as string, 10) : undefined
    });
    res.json({ success: true, candidates, total: candidates.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/recruiting/candidates/:candidateId
recruitingRouter.get('/candidates/:candidateId', (req: Request, res: Response) => {
  try {
    const candidate = RecruitingAndMarketShareRepository.getCandidateById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found.' });
    }
    const savings = RecruitingAndMarketShareRepository.calculateRecruitingSavings(req.params.candidateId);
    res.json({ success: true, candidate, savings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/recruiting/candidates/:candidateId/generate-pitch
recruitingRouter.post('/candidates/:candidateId/generate-pitch', (req: Request, res: Response) => {
  try {
    const pitch = RecruitingAndMarketShareRepository.generateRecruitingPitch(req.params.candidateId);
    if (!pitch) {
      return res.status(404).json({ success: false, error: 'Candidate not found.' });
    }
    res.json({ success: true, pitch });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/recruiting/candidates/:candidateId/update-status
recruitingRouter.post('/candidates/:candidateId/update-status', (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    const updated = RecruitingAndMarketShareRepository.updateCandidateStatus(req.params.candidateId, status, note);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Candidate not found.' });
    }
    res.json({ success: true, candidate: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
