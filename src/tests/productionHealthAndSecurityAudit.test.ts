/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite: Production Readiness Health Checks, Security Hardening & Cloud Run Probes
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Production Readiness & Google Cloud Run Audit Suite', () => {

  describe('1. Production Containerization & Deployment Artifacts', () => {
    it('verifies Dockerfile exists and contains multi-stage build configuration', () => {
      const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
      expect(fs.existsSync(dockerfilePath)).toBe(true);

      const content = fs.readFileSync(dockerfilePath, 'utf-8');
      expect(content).toContain('FROM node:22-alpine AS builder');
      expect(content).toContain('FROM node:22-alpine AS runner');
      expect(content).toContain('npm run build');
      expect(content).toContain('EXPOSE 8080');
      expect(content).toContain('CMD ["node", "dist/server.cjs"]');
    });

    it('verifies .dockerignore exists and excludes sensitive directories', () => {
      const dockerignorePath = path.join(process.cwd(), '.dockerignore');
      expect(fs.existsSync(dockerignorePath)).toBe(true);

      const content = fs.readFileSync(dockerignorePath, 'utf-8');
      expect(content).toContain('node_modules');
      expect(content).toContain('.git');
      expect(content).toContain('.env');
      expect(content).toContain('scratch/');
    });

    it('verifies scripts/deploy-cloudrun.sh exists and targets marcus@shapework.co', () => {
      const deployScriptPath = path.join(process.cwd(), 'scripts', 'deploy-cloudrun.sh');
      expect(fs.existsSync(deployScriptPath)).toBe(true);

      const content = fs.readFileSync(deployScriptPath, 'utf-8');
      expect(content).toContain('marcus@shapework.co');
      expect(content).toContain('gcloud run deploy');
      expect(content).toContain('--memory "1Gi"');
      expect(content).toContain('--cpu "1"');
      expect(content).toContain('run.googleapis.com');
    });

    it('verifies .env.production.example template exists', () => {
      const envExamplePath = path.join(process.cwd(), '.env.production.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);

      const content = fs.readFileSync(envExamplePath, 'utf-8');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('GEMINI_API_KEY');
      expect(content).toContain('RETELL_API_KEY');
      expect(content).toContain('TWILIO_ACCOUNT_SID');
      expect(content).toContain('RESEND_API_KEY');
    });
  });

  describe('2. Server Production Hardening in server.ts', () => {
    it('verifies server.ts includes /healthz probe endpoint', () => {
      const serverPath = path.join(process.cwd(), 'server.ts');
      const content = fs.readFileSync(serverPath, 'utf-8');

      expect(content).toContain("app.get(['/healthz', '/api/health']");
      expect(content).toContain("status: 'healthy'");
      expect(content).toContain('uptimeSeconds');
      expect(content).toContain('memory');
    });

    it('verifies server.ts includes security headers middleware', () => {
      const serverPath = path.join(process.cwd(), 'server.ts');
      const content = fs.readFileSync(serverPath, 'utf-8');

      expect(content).toContain("res.setHeader('X-Content-Type-Options', 'nosniff')");
      expect(content).toContain("res.setHeader('X-Frame-Options', 'SAMEORIGIN')");
      expect(content).toContain("res.setHeader('X-XSS-Protection', '1; mode=block')");
      expect(content).toContain('Strict-Transport-Security');
    });

    it('verifies server.ts includes canonical CORS domains', () => {
      const serverPath = path.join(process.cwd(), 'server.ts');
      const content = fs.readFileSync(serverPath, 'utf-8');

      expect(content).toContain('https://shapework.co');
      expect(content).toContain('https://app.shapework.co');
      expect(content).toContain('https://nora.nestrealty.com');
      expect(content).toContain('.run.app');
    });

    it('verifies server.ts includes graceful shutdown listeners', () => {
      const serverPath = path.join(process.cwd(), 'server.ts');
      const content = fs.readFileSync(serverPath, 'utf-8');

      expect(content).toContain("process.on('SIGTERM'");
      expect(content).toContain("process.on('SIGINT'");
      expect(content).toContain('handleGracefulShutdown');
    });
  });
});
