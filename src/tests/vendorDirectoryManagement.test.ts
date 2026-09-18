import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { vendorOrderRepository } from '../../server/persistence/vendorOrderRepository.js';

describe('Vendor Directory & Management Suite', () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Setup endpoints for test server
    app.get('/api/vendors/directory', async (req, res) => {
      const wsId = (req.query.workspaceId as string) || 'nest-realty-wilmington';
      const vendors = await vendorOrderRepository.listVendors(wsId, {
        category: req.query.category as string,
        paymentTerms: req.query.paymentTerms as string,
        search: req.query.search as string
      });
      res.json({ success: true, count: vendors.length, vendors });
    });

    app.post('/api/vendors/directory', async (req, res) => {
      const wsId = req.body.workspaceId || 'nest-realty-wilmington';
      if (!req.body.businessName) {
        return res.status(400).json({ success: false, error: 'Business name is required.' });
      }
      const vendor = await vendorOrderRepository.createVendor(wsId, req.body);
      res.status(201).json({ success: true, vendor });
    });

    app.put('/api/vendors/directory/:id', async (req, res) => {
      const wsId = req.body.workspaceId || 'nest-realty-wilmington';
      const vendor = await vendorOrderRepository.updateVendor(wsId, req.params.id, req.body);
      if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found.' });
      res.json({ success: true, vendor });
    });

    app.delete('/api/vendors/directory/:id', async (req, res) => {
      const wsId = (req.query.workspaceId as string) || 'nest-realty-wilmington';
      const deleted = await vendorOrderRepository.deleteVendor(wsId, req.params.id);
      if (!deleted) return res.status(404).json({ success: false, error: 'Vendor not found.' });
      res.json({ success: true, message: 'Deleted' });
    });

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

  it('1. Directory starts clean with 0 seed data', async () => {
    const vendors = await vendorOrderRepository.listVendors('nest-realty-wilmington');
    expect(vendors.length).toBe(0);
  });

  it('2. POST /api/vendors/directory adds an approved vendor with payment terms', async () => {
    const newVendorPayload = {
      businessName: 'Coastal Sign Post Co.',
      category: 'Signs & Post Installation',
      businessAddress: '3200 Wrightsville Ave, Wilmington NC',
      businessPhone: '(910) 791-3820',
      mainContactName: 'Dave Vance',
      mainContactPhone: '(910) 619-4402',
      mainContactEmail: 'dave@coastalsignposts.com',
      paymentTerms: 'net_account',
      notes: 'Standard 4x4 posts with custom riders.'
    };

    const res = await fetch(`${baseUrl}/api/vendors/directory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVendorPayload)
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.vendor.businessName).toBe('Coastal Sign Post Co.');
    expect(data.vendor.paymentTerms).toBe('net_account');
    expect(data.vendor.paymentTermsLabel).toBe('Net 30 Account');
  });

  it('3. GET /api/vendors/directory returns list of vendors and supports category/search filtering', async () => {
    const res = await fetch(`${baseUrl}/api/vendors/directory?workspaceId=nest-realty-wilmington&category=Signs`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.vendors.length).toBe(1);
    expect(data.vendors.some((v: any) => v.businessName.includes('Coastal Sign Post'))).toBe(true);
  });

  it('4. PUT /api/vendors/directory/:id updates vendor details', async () => {
    const vendors = await vendorOrderRepository.listVendors('nest-realty-wilmington');
    const target = vendors[0];

    const res = await fetch(`${baseUrl}/api/vendors/directory/${target.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: 'Updated priority turnaround window to 12 hours.'
      })
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.vendor.notes).toBe('Updated priority turnaround window to 12 hours.');
  });
});
