import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import type { Server } from 'http';
import { retellToolsRouter } from '../../server/routes/retellToolsRoute';
import { DEFAULT_NORA_VOICE_ID, getNoraVoiceConfig } from '../config/noraVoiceConfig';

describe('Retell & Web Voice Two-Way Symmetry & Telephony Tool Execution Suite', () => {
  let app: Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/retell/tools', retellToolsRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('1. Voice Parameters & Model Symmetry', () => {
    it('verifies Web and Retell share the exact same ElevenLabs Voice ID (l006hw6wZaEYAv80cbzj)', () => {
      const config = getNoraVoiceConfig();
      expect(config.voiceId).toBe('l006hw6wZaEYAv80cbzj');
      expect(DEFAULT_NORA_VOICE_ID).toBe('l006hw6wZaEYAv80cbzj');
    });
  });

  describe('2. POST /api/retell/tools/lookup-roster', () => {
    it('returns all 4 BICs when caller asks for BIC leadership', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/lookup-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'who is our bic?' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.resultType).toBe('bic_leadership');
      expect(data.bics.length).toBe(4);
      expect(data.bics[0].name).toBe('Ryan Crecelius');
      expect(data.bics[0].license).toBe('#29184');
    });

    it('returns team member profile for Ryan Crecelius with exact phone and email', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/lookup-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Ryan Crecelius' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.person.name).toBe('Ryan Crecelius');
      expect(data.person.phone).toBeDefined();
      expect(data.person.email).toBe('ryan@nestrealty.com');
      expect(data.person.title).toContain('Owner');
    });

    it('returns member profile for Ann Gunn (ATC Lead)', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/lookup-roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Ann Gunn' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.person.name).toBe('Ann Gunn');
      expect(data.person.email).toBe('ann@nestrealty.com');
    });
  });

  describe('3. POST /api/retell/tools/check-property', () => {
    it('returns live status and 300 DPI proof package for 1104 Arboretum Dr', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/check-property`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: '1104 Arboretum Dr' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.listing.listingPrice).toBe('$1,250,000');
      expect(data.listing.status).toBe('ready_for_review');
      expect(data.listing.assignedTo).toBe('Eduardo Lovo');
      expect(data.listing.proofPackageUrl).toContain('proofs_1104');
    });

    it('returns status for 742 Lumina Ave listed by Ryan Crecelius', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/check-property`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: '742 Lumina' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.listing.listingPrice).toBe('$1,950,000');
      expect(data.listing.listingAgentName).toBe('Ryan Crecelius');
    });
  });

  describe('4. POST /api/retell/tools/dispatch-marketing', () => {
    it('dispatches autonomous Maxa agent and stages proofs into Eduardo workspace', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/dispatch-marketing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: '1104 Arboretum Dr',
          agentName: 'Sarah Jenkins',
          price: '$1,250,000',
          bedsBaths: '4 Beds / 3.5 Baths'
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.runId).toBeDefined();
      expect(data.status).toBe('staged_in_va');
      expect(data.deliverables.length).toBe(3);
      expect(data.deliverables[0].dpi).toBe(300);
      expect(data.deliverables[0].id).toBe('deliv_flyer_01');
      expect(data.deliverables[1].id).toBe('deliv_story_02');
      expect(data.deliverables[2].id).toBe('deliv_postcard_03');
    }, 15000);
  });

  describe('5. POST /api/retell/tools/dispatch-sign-post', () => {
    it('dispatches work order ticket to Coastal Sign Post Co. for $65', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/dispatch-sign-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: '105 Forest Hills Dr',
          riderText: 'Open House Sunday 1-4PM',
          callerPhone: '+19106128283'
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.ticketId).toBeDefined();
      expect(data.vendor).toBe('Coastal Sign Post Co.');
      expect(data.status).toBe('ready_for_review');
      expect(data.isDispatchedToVendor).toBe(false);
      expect(data.dispatchLead).toContain('Ann Gunn');
      expect(data.trackingUrl).toContain('nestops.shapework.co/tracker');
    });
  });

  describe('6. POST /api/retell/tools/lookup-sop', () => {
    it('returns SOP-MKT-003 Maxa production protocol details', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/lookup-sop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sopCode: 'SOP-MKT-003' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.sopCode).toBe('SOP-MKT-003');
      expect(data.owner).toBe('Eduardo Lovo');
      expect(data.sla).toBe('4 Hours');
    });

    it('returns SOP deletion RBAC policy for Ryan, Marcus, Matt', async () => {
      const res = await fetch(`${baseUrl}/api/retell/tools/lookup-sop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sopCode: 'who can delete sop' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.authorizedAdmins).toContain('Ryan Crecelius');
      expect(data.authorizedAdmins).toContain('Marcus Aman');
      expect(data.authorizedAdmins).toContain('Matt Orr');
      expect(data.requiredPermission).toBe('sops.delete');
    });
  });
});
