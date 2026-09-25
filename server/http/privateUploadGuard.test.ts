import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import { privateUploadGuard } from './privateUploadGuard.js';

describe('Private upload aliases cannot bypass staff authentication through static serving', () => {
  let server: Server; let base: string; let dir: string;
  beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nora-upload-guard-'));
    fs.mkdirSync(path.join(dir, 'uploads'));
    fs.writeFileSync(path.join(dir, 'uploads', 'private.txt'), 'PRIVATE_ASSET');
    const app = express(); app.use(privateUploadGuard);
    app.get('/uploads/:filename', (_req, res) => res.status(401).end());
    app.use('/uploads', (_req, res) => res.status(404).end());
    app.use(express.static(dir));
    await new Promise<void>(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${(server.address() as any).port}`;
  });
  afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); fs.rmSync(dir, { recursive: true, force: true }); });
  it('canonical upload path still requires authentication', async () => { expect((await fetch(`${base}/uploads/private.txt`)).status).toBe(401); });
  it.each(['/%75ploads/private.txt', '/uploads%2Fprivate.txt', '/%2575ploads/private.txt', '/public/uploads/private.txt', '/@fs/tmp/public/uploads/private.txt', '//uploads/private.txt', '/UPLOADS/private.txt', '/uploads%5cprivate.txt'])('blocks %s', async target => {
    const result = await fetch(base + target);
    expect(result.status).toBe(404);
    expect(await result.text()).not.toContain('PRIVATE_ASSET');
  });
});
