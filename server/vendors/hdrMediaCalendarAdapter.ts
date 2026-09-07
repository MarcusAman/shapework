/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * hdrMediaCalendarAdapter
 * Integration Adapter for HDR Real Estate Photography, Drone & 2D Floor Plans.
 */

export interface MediaShootBookingPayload {
  propertyAddress: string;
  packageTier: 'Standard HDR (25 Photos)' | 'Pro Plus (HDR + Drone 4K + 2D Floor Plan)' | 'Cinematic Estate (HDR + Drone Video + Twilight + 3D Scan)';
  requestedSlot?: string;
  agentName: string;
  agentPhone?: string;
  lockboxCode?: string;
  specialInstructions?: string;
}

export interface MediaShootBookingResult {
  success: boolean;
  vendorOrderId: string;
  photographerName: string;
  scheduledSlot: string;
  estimatedDelivery: string;
  cost: number;
  message: string;
}

export const hdrMediaCalendarAdapter = {
  async bookShoot(payload: MediaShootBookingPayload): Promise<MediaShootBookingResult> {
    const vendorOrderId = `HDR-${Math.floor(10000 + Math.random() * 90000)}`;
    const scheduledSlot = payload.requestedSlot || 'Tomorrow at 10:00 AM - 12:00 PM';
    const cost = payload.packageTier.includes('Cinematic') ? 450.00 : payload.packageTier.includes('Pro Plus') ? 275.00 : 175.00;

    return {
      success: true,
      vendorOrderId,
      photographerName: 'Tyler Vance (Cape Fear Media)',
      scheduledSlot,
      estimatedDelivery: 'Within 24 hours of shoot completion',
      cost,
      message: `Photography shoot #${vendorOrderId} booked for ${payload.propertyAddress} with ${payload.packageTier}.`
    };
  }
};
