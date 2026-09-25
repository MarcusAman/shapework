import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';

/** Static servers decode paths after Express routing. Deny aliases before either layer. */
export function privateUploadGuard(req: Request, res: Response, next: NextFunction) {
  const raw = req.path;
  let decoded = raw;
  try {
    for (let i = 0; i < 8; i++) {
      const nextPath = decodeURIComponent(decoded);
      if (nextPath === decoded) break;
      decoded = nextPath;
    }
  } catch { return res.status(400).json({ error: 'Invalid path.' }); }
  const normalized = path.posix.normalize(decoded.replace(/\\/g, '/'));
  if (/(?:^|\/)uploads(?:\/|$)/i.test(decoded.replace(/\\/g, '/')) || /(?:^|\/)uploads(?:\/|$)/i.test(normalized)) {
    // This sole canonical shape is handled by the authenticated media route.
    if (raw !== decoded || decoded !== normalized || !/^\/uploads\/[^/\\]+$/.test(raw)) {
      return res.status(404).json({ error: 'Asset not found.' });
    }
  }
  return next();
}
