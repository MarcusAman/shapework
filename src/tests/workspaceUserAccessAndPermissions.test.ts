import { describe, it, expect } from 'vitest';
import { 
  getProductProfile, 
  isUserAdmin, 
  getAllowedSettingsTabs, 
  getDefaultLandingTab,
  PILOT_TEAM_EMAILS 
} from '../config/productProfiles';

describe('Brokerage Dashboard User Access & Permissions Suite', () => {
  const WORKSPACE_ID = 'nest-realty-wilmington';

  // --------------------------------------------------------------------------
  // 1. RYAN CRECELIUS (EXECUTIVE OWNER & ADMIN)
  // --------------------------------------------------------------------------
  describe('1. Ryan Crecelius (Executive Owner & Administrator)', () => {
    it('grants Ryan access to all 8 modules on Ryan’s dashboard', () => {
      const profile = getProductProfile('ryan@nestrealty.com', 'owner', WORKSPACE_ID);
      expect(profile.experience).toBe('ryan_pilot');

      const enabledModuleIds = profile.modules.filter(m => m.enabled && m.visible).map(m => m.moduleId);
      expect(enabledModuleIds).toEqual([
        'workboard',
        'marketing',
        'news',
        'role_map',
        'directory',
        'sops',
        'market_intelligence',
        'settings'
      ]);

      const tabs = profile.modules.filter(m => m.enabled).map(m => m.tab);
      expect(tabs).toContain('Workboard');
      expect(tabs).toContain('Tasks');
      expect(tabs).toContain('News');
      expect(tabs).toContain('Role Map');
      expect(tabs).toContain('Directory');
      expect(tabs).toContain('Staff SOP Templates');
      expect(tabs).toContain('Market Intelligence');
      expect(tabs).toContain('Settings');
    });

    it('identifies Ryan as an admin user and confirms Ryan is the only person with admin access', () => {
      expect(isUserAdmin('ryan@nestrealty.com', 'owner')).toBe(true);
      expect(isUserAdmin('ryan@nestrealty.com', 'admin')).toBe(true);

      // Non-admin personas must be denied admin privileges
      expect(isUserAdmin('melissa.gagliardi@nestrealty.com', 'marketing_coordinator')).toBe(false);
      expect(isUserAdmin('ann.gunn@nestrealty.com', 'operations_lead')).toBe(false);
      expect(isUserAdmin('ann@nestrealty.com', 'operations_lead')).toBe(false);
      expect(isUserAdmin('eduardo.lovo@nestrealty.com', 'producer')).toBe(false);
      expect(isUserAdmin('eduardo@nestrealty.com', 'producer')).toBe(false);
    });

    it('grants Ryan full access to all 5 workspace settings tabs', () => {
      const settingsTabs = getAllowedSettingsTabs('ryan@nestrealty.com', 'owner');
      expect(settingsTabs).toEqual([
        'team',
        'billing',
        'profile',
        'tools',
        'skills_matrix'
      ]);
    });

    it('sets default landing tab for Ryan to Workboard', () => {
      expect(getDefaultLandingTab('ryan@nestrealty.com', 'owner')).toBe('Workboard');
    });
  });

  // --------------------------------------------------------------------------
  // 2. MELISSA GAGLIARDI (MARKETING DIRECTOR)
  // --------------------------------------------------------------------------
  describe('2. Melissa Gagliardi (Marketing Director)', () => {
    it('verifies Melissa email is Melissa.Gagliardi@nestrealty.com and in PILOT_TEAM_EMAILS', () => {
      const email = 'Melissa.Gagliardi@nestrealty.com';
      expect(PILOT_TEAM_EMAILS).toContain(email.toLowerCase());
    });

    it('grants Melissa access to Ask Nora, Tasks, News, Role Map, Directory, Knowledge Library, Market Intelligence, and Workspace Settings', () => {
      const profile = getProductProfile('Melissa.Gagliardi@nestrealty.com', 'marketing_coordinator', WORKSPACE_ID);
      const enabledModuleIds = profile.modules.filter(m => m.enabled && m.visible).map(m => m.moduleId);

      expect(enabledModuleIds).toContain('workboard'); // Ask Nora
      expect(enabledModuleIds).toContain('marketing'); // Tasks
      expect(enabledModuleIds).toContain('news'); // News
      expect(enabledModuleIds).toContain('role_map'); // Role Map & Escalations
      expect(enabledModuleIds).toContain('directory'); // Directory
      expect(enabledModuleIds).toContain('sops'); // Knowledge Library
      expect(enabledModuleIds).toContain('market_intelligence'); // Market Intelligence
      expect(enabledModuleIds).toContain('settings'); // Workspace Settings
    });

    it('restricts Melissa in Workspace Settings to ONLY Connected Tools & Skills & Audit Matrix', () => {
      const settingsTabs = getAllowedSettingsTabs('Melissa.Gagliardi@nestrealty.com', 'marketing_coordinator');
      expect(settingsTabs).toEqual(['tools', 'skills_matrix']);

      // Forbidden tabs for Melissa
      expect(settingsTabs).not.toContain('team');
      expect(settingsTabs).not.toContain('billing');
      expect(settingsTabs).not.toContain('profile');
    });

    it('verifies Melissa does NOT have admin access', () => {
      expect(isUserAdmin('Melissa.Gagliardi@nestrealty.com', 'marketing_coordinator')).toBe(false);
      expect(isUserAdmin('melissa@nestrealty.com', 'marketing_coordinator')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 3. ANN GUNN (OPERATIONS LEAD)
  // --------------------------------------------------------------------------
  describe('3. Ann Gunn (Operations Lead)', () => {
    it('grants Ann access to Ask Nora, Tasks, News, Role Map, Directory, Knowledge Library, Market Intelligence, and Workspace Settings', () => {
      const profile = getProductProfile('ann@nestrealty.com', 'operations_lead', WORKSPACE_ID);
      const enabledModuleIds = profile.modules.filter(m => m.enabled && m.visible).map(m => m.moduleId);

      expect(enabledModuleIds).toContain('workboard');
      expect(enabledModuleIds).toContain('marketing');
      expect(enabledModuleIds).toContain('news');
      expect(enabledModuleIds).toContain('role_map');
      expect(enabledModuleIds).toContain('directory');
      expect(enabledModuleIds).toContain('sops');
      expect(enabledModuleIds).toContain('market_intelligence');
      expect(enabledModuleIds).toContain('settings');
    });

    it('restricts Ann in Workspace Settings to ONLY Connected Tools & Skills & Audit Matrix', () => {
      const settingsTabs = getAllowedSettingsTabs('ann@nestrealty.com', 'operations_lead');
      expect(settingsTabs).toEqual(['tools', 'skills_matrix']);

      // Forbidden tabs for Ann
      expect(settingsTabs).not.toContain('team');
      expect(settingsTabs).not.toContain('billing');
      expect(settingsTabs).not.toContain('profile');
    });

    it('verifies Ann does NOT have admin access', () => {
      expect(isUserAdmin('ann@nestrealty.com', 'operations_lead')).toBe(false);
      expect(isUserAdmin('ann.gunn@nestrealty.com', 'operations_lead')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. EDUARDO LOVO (PRODUCTION SPECIALIST)
  // --------------------------------------------------------------------------
  describe('4. Eduardo Lovo (Production Specialist)', () => {
    it('grants Eduardo access to ONLY Tasks and Directory pages', () => {
      const profile = getProductProfile('eduardo.lovo@nestrealty.com', 'producer', WORKSPACE_ID);
      const enabledModuleIds = profile.modules.filter(m => m.enabled && m.visible).map(m => m.moduleId);

      expect(enabledModuleIds).toEqual(['marketing', 'directory']);

      const tabs = profile.modules.filter(m => m.enabled).map(m => m.tab);
      expect(tabs).toContain('Tasks');
      expect(tabs).toContain('Directory');

      // Explicitly forbidden tabs
      expect(tabs).not.toContain('Workboard');
      expect(tabs).not.toContain('News');
      expect(tabs).not.toContain('Role Map');
      expect(tabs).not.toContain('Staff SOP Templates');
      expect(tabs).not.toContain('Market Intelligence');
      expect(tabs).not.toContain('Settings');
    });

    it('sets default landing tab for Eduardo to Tasks', () => {
      expect(getDefaultLandingTab('eduardo.lovo@nestrealty.com', 'producer')).toBe('Tasks');
      expect(getDefaultLandingTab('eduardo@nestrealty.com', undefined)).toBe('Tasks');
    });

    it('blocks Eduardo from any Workspace Settings tabs', () => {
      const settingsTabs = getAllowedSettingsTabs('eduardo.lovo@nestrealty.com', 'producer');
      expect(settingsTabs).toEqual([]);
    });

    it('verifies Eduardo does NOT have admin access', () => {
      expect(isUserAdmin('eduardo.lovo@nestrealty.com', 'producer')).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 5. CUSTOM PERMISSIONS OVERRIDE (ADMIN USER EDITING)
  // --------------------------------------------------------------------------
  describe('5. Custom Permissions Override', () => {
    it('allows Admin to grant custom tailored modules to any team member', () => {
      const customMods = ['marketing', 'directory', 'news'];
      const profile = getProductProfile(
        'custom.member@nestrealty.com',
        'agent',
        WORKSPACE_ID,
        customMods
      );

      const enabledModuleIds = profile.modules.filter(m => m.enabled).map(m => m.moduleId);
      expect(enabledModuleIds).toEqual(['marketing', 'news', 'directory']);
      expect(enabledModuleIds).not.toContain('workboard');
      expect(enabledModuleIds).not.toContain('settings');
    });
  });
});
