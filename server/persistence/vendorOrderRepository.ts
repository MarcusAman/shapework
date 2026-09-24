/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * vendorOrderRepository
 * Repository for third-party vendor orders, lockbox fleet inventory,
 * and automated SOP run step synchronization.
 */
import { sopRunRepository } from './sopRunRepository.js';

async function getDbPool() {
  if (typeof window !== 'undefined') return null;
  try {
    const { getDbPool: openPool } = await import('./repositories.js');
    return openPool();
  } catch {
    return null;
  }
}

export interface VendorOrderRecord {
  id: string;
  workspaceId: string;
  vendorType: 'coastal_sign_post' | 'hdr_media' | 'supra_lockbox';
  vendorName: string;
  propertyAddress: string;
  transactionId?: string;
  sopRunId?: string;
  sopStepNumber?: number;
  status: 'dispatched' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  details: Record<string, any>;
  vendorOrderId?: string;
  requestedDate?: string;
  completedDate?: string;
  cost?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LockboxRecord {
  id: string;
  workspaceId: string;
  serialNumber: string;
  model: string;
  shackleCode: string;
  currentPropertyAddress?: string;
  assignedAgentName?: string;
  batteryLevel: number;
  status: 'in_inventory' | 'assigned_in_field' | 'maintenance';
  lastAccessedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorDirectoryRecord {
  id: string;
  workspaceId: string;
  businessName: string;
  category: string;
  businessAddress: string;
  businessPhone: string;
  mainContactName: string;
  mainContactPhone: string;
  mainContactEmail: string;
  paymentTerms: 'net_account' | 'pay_immediately';
  paymentTermsLabel?: string;
  notes?: string;
  rating?: number;
  isPreferred?: boolean;
  activeOrdersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorWebhookLogRecord {
  id: string;
  vendorType: string;
  eventType: string;
  payload: any;
  status: string;
  processedAt: string;
}

// In-Memory Storage Cache & Fallback
const memoryVendorOrders: Map<string, VendorOrderRecord> = new Map();
const memoryLockboxes: Map<string, LockboxRecord> = new Map();
const memoryVendors: Map<string, VendorDirectoryRecord> = new Map();
const memoryWebhookLogs: VendorWebhookLogRecord[] = [];

export const vendorOrderRepository = {
  async listOrders(
    workspaceId: string,
    filters: { vendorType?: string; status?: string; search?: string } = {}
  ): Promise<VendorOrderRecord[]> {
    this.seedDefaultVendorDataIfEmpty(workspaceId);

    const dbPool = await getDbPool();
    if (dbPool) {
      try {
        let query = 'SELECT * FROM vendor_orders WHERE workspace_id = $1';
        const params: any[] = [workspaceId];

        if (filters.vendorType && filters.vendorType !== 'all') {
          params.push(filters.vendorType);
          query += ` AND vendor_type = $${params.length}`;
        }
        if (filters.status && filters.status !== 'all') {
          params.push(filters.status);
          query += ` AND status = $${params.length}`;
        }

        query += ' ORDER BY created_at DESC';
        const res = await dbPool.query(query, params);
        return res.rows.map(r => ({
          id: r.id,
          workspaceId: r.workspace_id,
          vendorType: r.vendor_type,
          vendorName: r.vendor_name,
          propertyAddress: r.property_address,
          transactionId: r.transaction_id,
          sopRunId: r.sop_run_id,
          sopStepNumber: r.sop_step_number,
          status: r.status,
          details: r.details || {},
          vendorOrderId: r.vendor_order_id,
          requestedDate: r.requested_date,
          completedDate: r.completed_date,
          cost: r.cost ? parseFloat(r.cost) : undefined,
          createdBy: r.created_by,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      } catch (err) {
        console.error('[VendorOrderRepository] DB listOrders error:', err);
      }
    }

    let list = Array.from(memoryVendorOrders.values()).filter(o => o.workspaceId === workspaceId);
    if (filters.vendorType && filters.vendorType !== 'all') {
      list = list.filter(o => o.vendorType === filters.vendorType);
    }
    if (filters.status && filters.status !== 'all') {
      list = list.filter(o => o.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(o =>
        o.propertyAddress.toLowerCase().includes(q) ||
        o.vendorName.toLowerCase().includes(q) ||
        (o.vendorOrderId && o.vendorOrderId.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOrderById(orderId: string): Promise<VendorOrderRecord | null> {
    const dbPool = await getDbPool();
    if (dbPool) {
      try {
        const res = await dbPool.query('SELECT * FROM vendor_orders WHERE id = $1', [orderId]);
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            id: r.id,
            workspaceId: r.workspace_id,
            vendorType: r.vendor_type,
            vendorName: r.vendor_name,
            propertyAddress: r.property_address,
            transactionId: r.transaction_id,
            sopRunId: r.sop_run_id,
            sopStepNumber: r.sop_step_number,
            status: r.status,
            details: r.details || {},
            vendorOrderId: r.vendor_order_id,
            requestedDate: r.requested_date,
            completedDate: r.completed_date,
            cost: r.cost ? parseFloat(r.cost) : undefined,
            createdBy: r.created_by,
            createdAt: r.created_at,
            updatedAt: r.updated_at
          };
        }
      } catch (err) {
        console.error('[VendorOrderRepository] DB getOrderById error:', err);
      }
    }
    return memoryVendorOrders.get(orderId) || null;
  },

  async createOrder(orderData: {
    workspaceId: string;
    vendorType: 'coastal_sign_post' | 'hdr_media' | 'supra_lockbox';
    vendorName: string;
    propertyAddress: string;
    transactionId?: string;
    sopRunId?: string;
    sopStepNumber?: number;
    details: Record<string, any>;
    requestedDate?: string;
    cost?: number;
    createdBy?: string;
  }): Promise<VendorOrderRecord> {
    const orderId = `vord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const vendorOrderId = `${orderData.vendorType === 'coastal_sign_post' ? 'CSP' : orderData.vendorType === 'hdr_media' ? 'HDR' : 'SUP'}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const order: VendorOrderRecord = {
      id: orderId,
      workspaceId: orderData.workspaceId,
      vendorType: orderData.vendorType,
      vendorName: orderData.vendorName,
      propertyAddress: orderData.propertyAddress,
      transactionId: orderData.transactionId,
      sopRunId: orderData.sopRunId,
      sopStepNumber: orderData.sopStepNumber,
      status: 'confirmed',
      details: orderData.details,
      vendorOrderId,
      requestedDate: orderData.requestedDate || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cost: orderData.cost || (orderData.vendorType === 'coastal_sign_post' ? 75.00 : orderData.vendorType === 'hdr_media' ? 275.00 : 0),
      createdBy: orderData.createdBy || 'Admin Coordinator',
      createdAt: now,
      updatedAt: now
    };

    const dbPool = await getDbPool();
    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO vendor_orders 
           (id, workspace_id, vendor_type, vendor_name, property_address, transaction_id, sop_run_id, sop_step_number, status, details, vendor_order_id, requested_date, cost, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            orderId, order.workspaceId, order.vendorType, order.vendorName, order.propertyAddress,
            order.transactionId || null, order.sopRunId || null, order.sopStepNumber || null,
            order.status, JSON.stringify(order.details), order.vendorOrderId, order.requestedDate,
            order.cost, order.createdBy, now, now
          ]
        );
      } catch (err) {
        console.error('[VendorOrderRepository] DB createOrder error:', err);
      }
    }

    memoryVendorOrders.set(orderId, order);
    return order;
  },

  async updateOrderStatus(
    orderId: string,
    status: 'dispatched' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
    completionData: {
      completedDate?: string;
      photoProofUrl?: string;
      notes?: string;
      mediaGalleryUrl?: string;
    } = {}
  ): Promise<VendorOrderRecord | null> {
    const order = await this.getOrderById(orderId);
    if (!order) return null;

    const now = new Date().toISOString();
    order.status = status;
    order.updatedAt = now;
    if (status === 'completed') {
      order.completedDate = completionData.completedDate || now;
    }
    if (completionData.photoProofUrl) {
      order.details.photoProofUrl = completionData.photoProofUrl;
    }
    if (completionData.mediaGalleryUrl) {
      order.details.mediaGalleryUrl = completionData.mediaGalleryUrl;
    }
    if (completionData.notes) {
      order.details.notes = completionData.notes;
    }

    const dbPoolUpdate = await getDbPool();
    if (dbPoolUpdate) {
      try {
        await dbPoolUpdate.query(
          `UPDATE vendor_orders 
           SET status = $1, completed_date = $2, details = $3, updated_at = $4
           WHERE id = $5`,
          [order.status, order.completedDate || null, JSON.stringify(order.details), now, orderId]
        );
      } catch (err) {
        console.error('[VendorOrderRepository] DB updateOrderStatus error:', err);
      }
    }

    memoryVendorOrders.set(orderId, order);

    // Automated SOP Step Synchronization:
    // If order is completed and linked to a sopRunId + sopStepNumber, complete that step in sopRunRepository!
    if (status === 'completed' && order.sopRunId && order.sopStepNumber) {
      try {
        await sopRunRepository.completeStep(order.sopRunId, order.sopStepNumber, {
          completedByName: order.vendorName,
          evidenceType: order.vendorType === 'hdr_media' ? 'url_link' : 'confirmation',
          evidenceValue: `${order.vendorName} Work Order #${order.vendorOrderId} verified completed.`,
          notes: completionData.notes || `Vendor completion verified via automated callback.`
        });
      } catch (sopErr) {
        console.error('[VendorOrderRepository] Automated SOP sync error:', sopErr);
      }
    }

    return order;
  },

  // Lockbox Fleet Management
  async listLockboxes(workspaceId: string): Promise<LockboxRecord[]> {
    this.seedDefaultVendorDataIfEmpty(workspaceId);

    const dbPoolLockbox = await getDbPool();
    if (dbPoolLockbox) {
      try {
        const res = await dbPoolLockbox.query(
          'SELECT * FROM lockbox_inventory WHERE workspace_id = $1 ORDER BY serial_number ASC',
          [workspaceId]
        );
        return res.rows.map(r => ({
          id: r.id,
          workspaceId: r.workspace_id,
          serialNumber: r.serial_number,
          model: r.model,
          shackleCode: r.shackle_code,
          currentPropertyAddress: r.current_property_address,
          assignedAgentName: r.assigned_agent_name,
          batteryLevel: r.battery_level,
          status: r.status,
          lastAccessedAt: r.last_accessed_at,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      } catch (err) {
        console.error('[VendorOrderRepository] DB listLockboxes error:', err);
      }
    }

    return Array.from(memoryLockboxes.values()).filter(l => l.workspaceId === workspaceId);
  },

  async assignLockbox(
    lockboxId: string,
    propertyAddress: string,
    agentName: string
  ): Promise<LockboxRecord | null> {
    const list = await this.listLockboxes('nest-realty-wilmington');
    const lockbox = list.find(l => l.id === lockboxId || l.serialNumber === lockboxId);
    if (!lockbox) return null;

    const now = new Date().toISOString();
    lockbox.status = 'assigned_in_field';
    lockbox.currentPropertyAddress = propertyAddress;
    lockbox.assignedAgentName = agentName;
    lockbox.updatedAt = now;

    const dbPoolAssign = await getDbPool();
    if (dbPoolAssign) {
      try {
        await dbPoolAssign.query(
          `UPDATE lockbox_inventory 
           SET status = 'assigned_in_field', current_property_address = $1, assigned_agent_name = $2, updated_at = $3
           WHERE id = $4`,
          [propertyAddress, agentName, now, lockbox.id]
        );
      } catch (err) {
        console.error('[VendorOrderRepository] DB assignLockbox error:', err);
      }
    }

    memoryLockboxes.set(lockbox.id, lockbox);
    return lockbox;
  },

  async releaseLockbox(lockboxId: string): Promise<LockboxRecord | null> {
    const list = await this.listLockboxes('nest-realty-wilmington');
    const lockbox = list.find(l => l.id === lockboxId || l.serialNumber === lockboxId);
    if (!lockbox) return null;

    const now = new Date().toISOString();
    lockbox.status = 'in_inventory';
    lockbox.currentPropertyAddress = undefined;
    lockbox.assignedAgentName = undefined;
    lockbox.updatedAt = now;

    const dbPoolRelease = await getDbPool();
    if (dbPoolRelease) {
      try {
        await dbPoolRelease.query(
          `UPDATE lockbox_inventory 
           SET status = 'in_inventory', current_property_address = NULL, assigned_agent_name = NULL, updated_at = $1
           WHERE id = $2`,
          [now, lockbox.id]
        );
      } catch (err) {
        console.error('[VendorOrderRepository] DB releaseLockbox error:', err);
      }
    }

    memoryLockboxes.set(lockbox.id, lockbox);
    return lockbox;
  },

  recordWebhook(vendorType: string, eventType: string, payload: any): VendorWebhookLogRecord {
    const log: VendorWebhookLogRecord = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      vendorType,
      eventType,
      payload,
      status: 'processed',
      processedAt: new Date().toISOString()
    };
    memoryWebhookLogs.unshift(log);
    return log;
  },

  seedDefaultVendorDataIfEmpty(workspaceId: string = 'ws_wilmington') {
    if (memoryVendorOrders.size === 0) {
      const now = new Date().toISOString();
      const order: VendorOrderRecord = {
        id: 'ord_sign_001',
        workspaceId,
        vendorType: 'coastal_sign_post',
        vendorName: 'Coastal Sign Post Co.',
        propertyAddress: '1104 Arboretum Dr, Wilmington, NC 28405',
        status: 'in_progress',
        details: {
          postType: 'Standard 4x4 Vinyl',
          rider: 'Coming Soon'
        },
        createdBy: 'Ann Gunn',
        createdAt: now,
        updatedAt: now
      };
      memoryVendorOrders.set(order.id, order);
    }
  },

  async seedDefaultVendorsIfEmpty(workspaceId: string = 'ws_wilmington'): Promise<void> {
    this.seedDefaultVendorDataIfEmpty(workspaceId);
  },

  async createLockbox(
    workspaceId: string,
    data: {
      serialNumber: string;
      model?: string;
      shackleCode: string;
      batteryLevel?: number;
      status?: 'in_inventory' | 'assigned_in_field' | 'maintenance';
      currentPropertyAddress?: string;
      assignedAgentName?: string;
    }
  ): Promise<LockboxRecord> {
    const id = `lb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newLockbox: LockboxRecord = {
      id,
      workspaceId,
      serialNumber: data.serialNumber,
      model: data.model || 'Supra iBox BT LE',
      shackleCode: data.shackleCode,
      batteryLevel: data.batteryLevel !== undefined ? data.batteryLevel : 100,
      status: data.status || (data.currentPropertyAddress ? 'assigned_in_field' : 'in_inventory'),
      currentPropertyAddress: data.currentPropertyAddress,
      assignedAgentName: data.assignedAgentName,
      createdAt: now,
      updatedAt: now
    };

    const dbPoolCreate = await getDbPool();
    if (dbPoolCreate) {
      try {
        await dbPoolCreate.query(
          `INSERT INTO lockbox_inventory 
           (id, workspace_id, serial_number, model, shackle_code, current_property_address, assigned_agent_name, battery_level, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            newLockbox.id,
            newLockbox.workspaceId,
            newLockbox.serialNumber,
            newLockbox.model,
            newLockbox.shackleCode,
            newLockbox.currentPropertyAddress || null,
            newLockbox.assignedAgentName || null,
            newLockbox.batteryLevel,
            newLockbox.status,
            now,
            now
          ]
        );
      } catch (err) {
        console.error('[VendorOrderRepository] DB createLockbox error:', err);
      }
    }

    memoryLockboxes.set(id, newLockbox);
    return newLockbox;
  },

  async deleteLockbox(workspaceId: string, id: string): Promise<boolean> {
    const list = await this.listLockboxes(workspaceId);
    const lockbox = list.find(l => l.id === id || l.serialNumber === id);
    if (!lockbox) return false;

    const dbPoolDelete = await getDbPool();
    if (dbPoolDelete) {
      try {
        await dbPoolDelete.query('DELETE FROM lockbox_inventory WHERE id = $1 AND workspace_id = $2', [lockbox.id, workspaceId]);
      } catch (err) {
        console.error('[VendorOrderRepository] DB deleteLockbox error:', err);
      }
    }

    memoryLockboxes.delete(lockbox.id);
    return true;
  },

  async listVendors(
    workspaceId: string,
    filters: { category?: string; paymentTerms?: string; search?: string } = {}
  ): Promise<VendorDirectoryRecord[]> {
    this.seedDefaultVendorsIfEmpty(workspaceId);

    let vendors = Array.from(memoryVendors.values()).filter(v => v.workspaceId === workspaceId);

    if (filters.category && filters.category !== 'all') {
      vendors = vendors.filter(v => v.category.toLowerCase().includes(filters.category!.toLowerCase()));
    }

    if (filters.paymentTerms && filters.paymentTerms !== 'all') {
      vendors = vendors.filter(v => v.paymentTerms === filters.paymentTerms);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      vendors = vendors.filter(v =>
        v.businessName.toLowerCase().includes(q) ||
        v.mainContactName.toLowerCase().includes(q) ||
        v.businessAddress.toLowerCase().includes(q) ||
        v.businessPhone.includes(q) ||
        v.mainContactPhone.includes(q) ||
        v.mainContactEmail.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    }

    return vendors.sort((a, b) => (b.isPreferred ? 1 : 0) - (a.isPreferred ? 1 : 0));
  },

  async getVendor(workspaceId: string, id: string): Promise<VendorDirectoryRecord | null> {
    this.seedDefaultVendorsIfEmpty(workspaceId);
    const vendor = memoryVendors.get(id);
    if (!vendor || vendor.workspaceId !== workspaceId) return null;
    return vendor;
  },

  async createVendor(
    workspaceId: string,
    data: Omit<VendorDirectoryRecord, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>
  ): Promise<VendorDirectoryRecord> {
    const id = `vnd_${Date.now()}`;
    const now = new Date().toISOString();
    const newVendor: VendorDirectoryRecord = {
      ...data,
      id,
      workspaceId,
      paymentTermsLabel: data.paymentTerms === 'net_account' ? 'Net 30 Account' : 'Pay Immediately',
      rating: data.rating || 5.0,
      isPreferred: data.isPreferred || false,
      activeOrdersCount: 0,
      createdAt: now,
      updatedAt: now
    };

    memoryVendors.set(id, newVendor);
    return newVendor;
  },

  async updateVendor(
    workspaceId: string,
    id: string,
    updates: Partial<VendorDirectoryRecord>
  ): Promise<VendorDirectoryRecord | null> {
    const existing = await this.getVendor(workspaceId, id);
    if (!existing) return null;

    const updated: VendorDirectoryRecord = {
      ...existing,
      ...updates,
      paymentTermsLabel: updates.paymentTerms 
        ? (updates.paymentTerms === 'net_account' ? 'Net 30 Account' : 'Pay Immediately') 
        : existing.paymentTermsLabel,
      updatedAt: new Date().toISOString()
    };

    memoryVendors.set(id, updated);
    return updated;
  },

  async deleteVendor(workspaceId: string, id: string): Promise<boolean> {
    const existing = await this.getVendor(workspaceId, id);
    if (!existing) return false;

    memoryVendors.delete(id);
    return true;
  },

  async getOrderForInstallPortal(orderId: string): Promise<VendorOrderRecord | null> {
    this.seedDefaultVendorDataIfEmpty('nest-realty-wilmington');
    let order = memoryVendorOrders.get(orderId);
    if (!order) {
      // Find by matching ID or fallback to first order
      const all = Array.from(memoryVendorOrders.values());
      order = all.find(o => o.id === orderId || o.id.includes(orderId)) || all[0];
    }
    return order || null;
  },

  async submitInstallPhotoProof(
    orderId: string,
    photoUrl: string,
    options?: { notes?: string; installerName?: string; gps?: string }
  ): Promise<{ success: boolean; order: VendorOrderRecord | null }> {
    const order = await this.getOrderForInstallPortal(orderId);
    if (!order) return { success: false, order: null };

    const updated: VendorOrderRecord = {
      ...order,
      status: 'completed',
      completedDate: new Date().toISOString(),
      details: {
        ...order.details,
        installedPhotoUrl: photoUrl,
        installerNotes: options?.notes || 'Installed in front yard per specifications',
        installerName: options?.installerName || 'Coastal Sign Field Installer',
        gpsCoordinates: options?.gps || '34.2085° N, 77.8012° W',
        installedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    memoryVendorOrders.set(order.id, updated);
    return { success: true, order: updated };
  }
};
