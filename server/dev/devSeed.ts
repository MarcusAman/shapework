/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function seedDevWorkspace(dbState: any) {
  if (!dbState.workspaces) {
    dbState.workspaces = [];
  }
  
  if (!dbState.workspaces.some((w: any) => w.id === 'first-brokerage-pilot-rehearsal')) {
    dbState.workspaces.push({
      id: 'first-brokerage-pilot-rehearsal',
      name: 'First Brokerage Pilot Rehearsal',
      timezone: 'America/New_York',
      launchMode: 'manual_first',
      status: 'active',
      phase: 'pilot_rehearsal',
      goLiveMode: 'live',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Seed default workspace user profiles for rehearsal
    if (!dbState.workspaceUsers) {
      dbState.workspaceUsers = [];
    }
    dbState.workspaceUsers.push(
      { workspaceId: 'first-brokerage-pilot-rehearsal', email: 'owner@pilot.rehearsal', name: 'Owner Rehearsal', role: 'owner' },
      { workspaceId: 'first-brokerage-pilot-rehearsal', email: 'operations@pilot.rehearsal', name: 'Operator Rehearsal', role: 'operations_lead' },
      { workspaceId: 'first-brokerage-pilot-rehearsal', email: 'tc@pilot.rehearsal', name: 'TC Rehearsal', role: 'transaction_coordinator' },
      { workspaceId: 'first-brokerage-pilot-rehearsal', email: 'marketing@pilot.rehearsal', name: 'Marketing Rehearsal', role: 'marketing_coordinator' }
    );

    // Seed default signInventory
    if (!dbState.signInventory) {
      dbState.signInventory = [];
    }
    dbState.signInventory.push(
      { id: 'sign_rep_1', workspaceId: 'first-brokerage-pilot-rehearsal', type: 'Yard Sign', total: 15, checkedOut: 12, location: 'Storage Closet A', lowStockThreshold: 4 },
      { id: 'sign_rep_2', workspaceId: 'first-brokerage-pilot-rehearsal', type: 'Open House directionals', total: 30, checkedOut: 22, location: 'Main hallway', lowStockThreshold: 8 }
    );

    // Seed default officeSupplies
    if (!dbState.officeSupplies) {
      dbState.officeSupplies = [];
    }
    dbState.officeSupplies.push(
      { id: 'sup_rep_1', workspaceId: 'first-brokerage-pilot-rehearsal', item: 'Lockbox units', status: 'In Stock', lastChecked: new Date().toISOString().split('T')[0] },
      { id: 'sup_rep_2', workspaceId: 'first-brokerage-pilot-rehearsal', item: 'Logo envelopes', status: 'Low Stock', lastChecked: new Date().toISOString().split('T')[0] }
    );
  }
}
