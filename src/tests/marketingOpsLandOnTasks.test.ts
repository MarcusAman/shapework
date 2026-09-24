import { describe, expect, it } from 'vitest';
import { getProductProfile } from '../config/productProfiles';
import { isMarketingOpsRole } from '../utils/customerWorkboardRoles';

describe('marketing ops land on Tasks (Ask Nora still reachable)', () => {
  it('recognizes Melissa marketing_director role', () => {
    expect(isMarketingOpsRole('marketing_director')).toBe(true);
    expect(isMarketingOpsRole('Marketing Director')).toBe(true);
    expect(isMarketingOpsRole('marketing_coordinator')).toBe(true);
    expect(isMarketingOpsRole('admin')).toBe(false);
  });

  it('product profile for marketing_director leads with Tasks but still includes Ask Nora', () => {
    const profile = getProductProfile(
      'melissa.gagliardi@nestrealty.com',
      'marketing_director',
      'nest-realty-demo'
    );
    const enabledTabs = profile.modules.filter((m) => m.enabled && m.visible).map((m) => m.tab);
    expect(enabledTabs[0]).toBe('Tasks');
    expect(enabledTabs).toContain('Workboard');
  });

  it('non-marketing Wilmington pilot still gets Ask Nora / Workboard first', () => {
    const profile = getProductProfile('ryan@nestrealty.com', 'owner', 'nest-realty-demo');
    const enabledTabs = profile.modules.filter((m) => m.enabled && m.visible).map((m) => m.tab);
    expect(enabledTabs[0]).toBe('Workboard');
  });
});
