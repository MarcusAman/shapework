import { describe, it, expect } from 'vitest';
import { GoogleSandboxTestService } from '../../server/services/googleSandboxTestService.js';

describe('Google Integration Sandbox Test Suite (Zero-Risk)', () => {
  it('1. Verifies designated test broker target is Matt Orr (matt.orr@nestrealty.com)', () => {
    const targetEmail = GoogleSandboxTestService.getTargetEmail();
    expect(targetEmail).toBe('matt.orr@nestrealty.com');
  });

  it('2. Runs individual sandbox test for Google Drive', async () => {
    const driveRes = await GoogleSandboxTestService.runServiceTest('drive');
    expect(driveRes.success).toBe(true);
    expect(driveRes.status).toBe('passed');
    expect(driveRes.recipientTarget).toBe('matt.orr@nestrealty.com');
    expect(driveRes.artifactUrl).toBeDefined();
    expect(driveRes.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('3. Runs individual sandbox test for Google Docs', async () => {
    const docsRes = await GoogleSandboxTestService.runServiceTest('docs');
    expect(docsRes.success).toBe(true);
    expect(docsRes.status).toBe('passed');
    expect(docsRes.artifactTitle).toContain('NC Form 2-T');
    expect(docsRes.recipientTarget).toBe('matt.orr@nestrealty.com');
  });

  it('4. Runs individual sandbox test for Google Slides', async () => {
    const slidesRes = await GoogleSandboxTestService.runServiceTest('slides');
    expect(slidesRes.success).toBe(true);
    expect(slidesRes.status).toBe('passed');
    expect(slidesRes.artifactUrl).toContain('docs.google.com/presentation');
  });

  it('5. Runs individual sandbox test for Google Sheets', async () => {
    const sheetsRes = await GoogleSandboxTestService.runServiceTest('sheets');
    expect(sheetsRes.success).toBe(true);
    expect(sheetsRes.status).toBe('passed');
  });

  it('6. Runs individual sandbox test for Gmail API with isolated recipient', async () => {
    const gmailRes = await GoogleSandboxTestService.runServiceTest('gmail');
    expect(gmailRes.success).toBe(true);
    expect(gmailRes.recipientTarget).toBe('matt.orr@nestrealty.com');
    expect(gmailRes.artifactTitle).toContain('[SANDBOX TEST]');
  });

  it('7. Runs individual sandbox test for Google Chat Space', async () => {
    const chatRes = await GoogleSandboxTestService.runServiceTest('chat');
    expect(chatRes.success).toBe(true);
    expect(chatRes.status).toBe('passed');
  });

  it('8. Runs individual sandbox test for YouTube Data API', async () => {
    const ytRes = await GoogleSandboxTestService.runServiceTest('youtube');
    expect(ytRes.success).toBe(true);
    expect(ytRes.status).toBe('passed');
    expect(ytRes.artifactUrl).toContain('youtube.com/watch?v=');
  });

  it('9. Runs Full 7-API Parallel Diagnostic Suite', async () => {
    const report = await GoogleSandboxTestService.runFullDiagnostic();
    expect(report.id).toBeDefined();
    expect(report.totalServices).toBe(7);
    expect(report.passedCount).toBe(7);
    expect(report.failedCount).toBe(0);
    expect(report.targetEmail).toBe('matt.orr@nestrealty.com');
    expect(report.results.length).toBe(7);

    const history = GoogleSandboxTestService.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
  });
});
