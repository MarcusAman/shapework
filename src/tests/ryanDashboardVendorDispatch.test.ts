import { describe, it, expect } from 'vitest';
import { getProductProfile } from '../config/productProfiles.js';

describe("Ryan's Dashboard Vendor Dispatch & Field Equipment Hub Test Suite", () => {
  it("1. Verifies Ryan's product profile (ryan_pilot) excludes Vendor Dispatch module per production cleanup", () => {
    const profile = getProductProfile('ryan@nestrealty.com', 'owner', 'nest-realty-wilmington');
    expect(profile.experience).toBe('ryan_pilot');
    
    const vendorDispatchModule = profile.modules.find(m => m.moduleId === 'vendor_dispatch');
    expect(vendorDispatchModule).toBeUndefined();
  });

  it('2. Verifies all essential modules exist in Ryan pilot profile without Vendor Dispatch', () => {
    const profile = getProductProfile('ryan@nestrealty.com', 'owner', 'nest-realty-demo');
    const moduleTabs = profile.modules.map(m => m.tab);
    
    expect(moduleTabs).toContain('Workboard');
    expect(moduleTabs).not.toContain('Ryan Shield');
    expect(moduleTabs).toContain('Role Map');
    expect(moduleTabs).not.toContain('Vendor Dispatch');
    expect(moduleTabs).toContain('Directory');
    expect(moduleTabs).not.toContain('Owner Brief');
    expect(moduleTabs).toContain('Staff SOP Templates');
    expect(moduleTabs).toContain('Tasks');
    expect(moduleTabs).toContain('Market Intelligence');
    expect(moduleTabs).toContain('Settings');
  });

  it('3. Verifies CustomerAppRoutes redirects legacy Vendor Dispatch routes to canonical Tasks board', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const routeContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/routes/CustomerAppRoutes.tsx'),
      'utf-8'
    );

    expect(routeContent).toContain("case 'Vendor Dispatch':");
    expect(routeContent).toContain("state.setCurrentTab('Tasks');");
  });
});
