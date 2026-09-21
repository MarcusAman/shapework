import { Router } from 'express';
export const supportRouter = Router();
supportRouter.get('/health', (_req, res) => res.json({ ok: true, stub: true }));
