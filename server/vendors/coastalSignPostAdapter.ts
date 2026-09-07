/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * coastalSignPostAdapter
 * Integration Adapter for Coastal Sign Post Co.
 * Handles yard post installation, custom rider selection, and post retrieval upon closing.
 */

export interface SignPostOrderPayload {
  propertyAddress: string;
  postType?: 'White Colonial Vinyl 4x4' | 'Black Estate Metal 4x4';
  rider1?: string; // 'Coming Soon', 'Under Contract', 'Pool', 'Waterfront', 'Open Saturday'
  rider2?: string;
  brochureBox?: boolean;
  specialInstructions?: string;
  requestedDate?: string;
}

export interface SignPostOrderResult {
  success: boolean;
  vendorOrderId: string;
  status: 'dispatched' | 'confirmed';
  scheduledDate: string;
  assignedRoute: string;
  cost: number;
  message: string;
}

export const coastalSignPostAdapter = {
  async dispatchInstallation(order: SignPostOrderPayload): Promise<SignPostOrderResult> {
    // In production: POST https://api.coastalsignpost.com/v1/orders
    const vendorOrderId = `CSP-${Math.floor(10000 + Math.random() * 90000)}`;
    const scheduledDate = order.requestedDate || new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    return {
      success: true,
      vendorOrderId,
      status: 'confirmed',
      scheduledDate,
      assignedRoute: 'Route 4 (Wilmington / New Hanover Coastal)',
      cost: 75.00,
      message: `Work order #${vendorOrderId} confirmed with Coastal Sign Post Co. for ${order.propertyAddress}.`
    };
  },

  async scheduleRemoval(vendorOrderId: string, propertyAddress: string): Promise<{ success: boolean; removalTicketId: string; message: string }> {
    const removalTicketId = `CSP-REM-${Math.floor(10000 + Math.random() * 90000)}`;
    return {
      success: true,
      removalTicketId,
      message: `Post retrieval #${removalTicketId} scheduled for ${propertyAddress} (Closing Retrieval).`
    };
  }
};
