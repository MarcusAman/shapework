import { describe, it, expect, beforeEach } from 'vitest';
import { vendorOrderRepository } from '../../server/persistence/vendorOrderRepository';
import { coastalSignPostAdapter } from '../../server/vendors/coastalSignPostAdapter';
import { hdrMediaCalendarAdapter } from '../../server/vendors/hdrMediaCalendarAdapter';
import { supraLockboxAdapter } from '../../server/vendors/supraLockboxAdapter';
import { sopRunRepository } from '../../server/persistence/sopRunRepository';
import { sopRepository } from '../../server/persistence/sopRepository';

describe('Vendor Dispatch & Third-Party SOP Sync Test Suite', () => {
  const workspaceId = 'nest-realty-wilmington';
  const tenantId = 'tenant_nest_uat';

  describe('1. Modular Vendor Adapters', () => {
    it('dispatches yard post installation to Coastal Sign Post Co. with custom rider', async () => {
      const res = await coastalSignPostAdapter.dispatchInstallation({
        propertyAddress: '518 Chestnut St, Wilmington NC',
        postType: 'White Colonial Vinyl 4x4',
        rider1: 'Coming Soon',
        brochureBox: true
      });

      expect(res.success).toBe(true);
      expect(res.vendorOrderId).toMatch(/^CSP-\d+$/);
      expect(res.status).toBe('confirmed');
      expect(res.cost).toBe(75.00);
      expect(res.assignedRoute).toContain('Route 4');
    });

    it('books HDR media shoot with Cape Fear Media', async () => {
      const res = await hdrMediaCalendarAdapter.bookShoot({
        propertyAddress: '104 Live Oak Dr, Wrightsville Beach NC',
        packageTier: 'Pro Plus (HDR + Drone 4K + 2D Floor Plan)',
        agentName: 'Melissa Gagliardi'
      });

      expect(res.success).toBe(true);
      expect(res.vendorOrderId).toMatch(/^HDR-\d+$/);
      expect(res.photographerName).toBe('Tyler Vance (Cape Fear Media)');
      expect(res.cost).toBe(275.00);
    });

    it('assigns Supra lockbox and retrieves 4-digit shackle code', async () => {
      const res = await supraLockboxAdapter.assignToProperty({
        serialNumber: 'SUP-770923',
        propertyAddress: '219 Dock St, Wilmington NC',
        agentName: 'Ann Gunn'
      });

      expect(res.success).toBe(true);
      expect(res.shackleCode).toMatch(/^\d{4}$/);
      expect(res.status).toBe('assigned_in_field');
    });
  });

  describe('2. Vendor Orders Repository & Automated SOP Step Sync', () => {
    it('creates vendor order linked to active SOP run step', async () => {
      const order = await vendorOrderRepository.createOrder({
        workspaceId,
        vendorType: 'coastal_sign_post',
        vendorName: 'Coastal Sign Post Co.',
        propertyAddress: '312 Red Cross St, Wilmington NC',
        sopRunId: 'run_sample_312',
        sopStepNumber: 3,
        details: { rider1: 'Coming Soon', brochureBox: true },
        cost: 75.00,
        createdBy: 'Ann Gunn'
      });

      expect(order.id).toBeDefined();
      expect(order.vendorType).toBe('coastal_sign_post');
      expect(order.status).toBe('confirmed');
      expect(order.cost).toBe(75.00);
    });

    it('automatically completes SOP step when vendor order is marked completed', async () => {
      // 1. Create SOP run
      const publishedSops = (sopRepository.listDraftsSync(tenantId, workspaceId) || []).filter(s => s.status === 'published');
      const sop = publishedSops[0];
      const run = await sopRunRepository.createRunFromSop(
        sop,
        '902 Princess St, Wilmington NC',
        'Melissa Gagliardi',
        { workspaceId, tenantId }
      );

      // 2. Create Vendor Order linked to Step 3 (Sign Post)
      const order = await vendorOrderRepository.createOrder({
        workspaceId,
        vendorType: 'coastal_sign_post',
        vendorName: 'Coastal Sign Post Co.',
        propertyAddress: run.propertyAddress,
        sopRunId: run.id,
        sopStepNumber: 3,
        details: { rider1: 'Coming Soon' },
        cost: 75.00,
        createdBy: 'Ann Gunn'
      });

      expect(run.steps[2].status).toBe('pending');

      // 3. Mark vendor order as completed (simulating installer completion webhook)
      await vendorOrderRepository.updateOrderStatus(order.id, 'completed', {
        photoProofUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80',
        notes: 'Yard post installed to right of driveway.'
      });

      // 4. Verify SOP run Step 3 was automatically completed!
      const updatedRun = await sopRunRepository.getRunById(run.id);
      expect(updatedRun?.steps[2].status).toBe('completed');
      expect(updatedRun?.steps[2].completedByName).toBe('Coastal Sign Post Co.');
      expect(updatedRun?.steps[2].evidenceValue).toContain('Work Order');
    });
  });

  describe('3. Lockbox Fleet Inventory Management', () => {
    it('assigns and releases physical lockbox in inventory', async () => {
      // Add a physical lockbox to inventory
      const created = await vendorOrderRepository.createLockbox(workspaceId, {
        serialNumber: 'SUP-991204',
        model: 'Supra iBox BT LE',
        shackleCode: '5821',
        batteryLevel: 98,
        status: 'in_inventory'
      });
      expect(created.id).toBeDefined();

      const lockboxes = await vendorOrderRepository.listLockboxes(workspaceId);
      const available = lockboxes.find(l => l.id === created.id);
      expect(available).toBeDefined();

      // Assign to property
      const assigned = await vendorOrderRepository.assignLockbox(
        available!.id,
        '404 Orange St, Wilmington NC',
        'Matt Orr (Agent)'
      );
      expect(assigned?.status).toBe('assigned_in_field');
      expect(assigned?.currentPropertyAddress).toBe('404 Orange St, Wilmington NC');

      // Release back to office inventory
      const released = await vendorOrderRepository.releaseLockbox(available!.id);
      expect(released?.status).toBe('in_inventory');
      expect(released?.currentPropertyAddress).toBeUndefined();
    });
  });
});
