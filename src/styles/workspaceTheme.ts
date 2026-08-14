/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Multi-Tenant Workspace Brand Theme Resolver — Phase A Foundation
 * Layer 2 Architecture: Decouples Shapework Core UI from brokerage brand palettes.
 */

export interface WorkspaceBrandPalette {
  id: string;
  name: string;
  brandPrimary: string;
  brandSecondary: string;
  brandAccent: string;
  brandSoft: string;
  logoUrl?: string;
}

// Canonical Brokerage Brand Registry
const KNOWN_WORKSPACE_BRANDS: Record<string, WorkspaceBrandPalette> = {
  'ws_wilmington': {
    id: 'ws_wilmington',
    name: 'Nest Realty Wilmington',
    brandPrimary: '#01362D',
    brandSecondary: '#00635C',
    brandAccent: '#D0D6BB',
    brandSoft: 'rgba(0, 99, 92, 0.08)',
    logoUrl: '/nest_n_green.png',
  },
  'nest-realty-demo': {
    id: 'nest-realty-demo',
    name: 'Nest Realty Wilmington',
    brandPrimary: '#01362D',
    brandSecondary: '#00635C',
    brandAccent: '#D0D6BB',
    brandSoft: 'rgba(0, 99, 92, 0.08)',
    logoUrl: '/nest_n_green.png',
  },
  'nest-realty-wilmington': {
    id: 'nest-realty-wilmington',
    name: 'Nest Realty Wilmington',
    brandPrimary: '#01362D',
    brandSecondary: '#00635C',
    brandAccent: '#D0D6BB',
    brandSoft: 'rgba(0, 99, 92, 0.08)',
    logoUrl: '/nest_n_green.png',
  },
};

// Neutral Fallback Theme when active workspace has no custom branding
export const DEFAULT_SHAPEWORK_BRAND: WorkspaceBrandPalette = {
  id: 'default',
  name: 'Shapework Operations',
  brandPrimary: '#1E293B',   // Neutral Slate 800
  brandSecondary: '#0F172A', // Slate 900
  brandAccent: '#E2E8F0',    // Slate 200
  brandSoft: 'rgba(30, 41, 59, 0.06)',
};

/**
 * Resolves the workspace brand palette for a given workspace ID.
 * Returns neutral Shapework fallback for unknown/default brokerages.
 */
export function resolveWorkspaceBrand(workspaceId?: string | null): WorkspaceBrandPalette {
  if (!workspaceId) return DEFAULT_SHAPEWORK_BRAND;
  const key = workspaceId.toLowerCase().trim();
  if (key.includes('nest-realty') || key === 'nest-realty-demo' || key === 'nest-realty-wilmington') {
    return KNOWN_WORKSPACE_BRANDS['nest-realty-demo'];
  }
  return KNOWN_WORKSPACE_BRANDS[key] || DEFAULT_SHAPEWORK_BRAND;
}

/**
 * Applies workspace brand CSS variables to an HTMLElement (or document.documentElement & document.body).
 * Applying at the root document element ensures React createPortal components (modals/drawers)
 * inherit active tenant brand tokens seamlessly.
 */
export function applyWorkspaceBrandTheme(element?: HTMLElement | null, workspaceId?: string | null): WorkspaceBrandPalette {
  const brand = resolveWorkspaceBrand(workspaceId);

  const applyToElement = (target: HTMLElement) => {
    target.style.setProperty('--brand-primary', brand.brandPrimary);
    target.style.setProperty('--brand-secondary', brand.brandSecondary);
    target.style.setProperty('--brand-accent', brand.brandAccent);
    target.style.setProperty('--brand-soft', brand.brandSoft);
    target.setAttribute('data-tenant', brand.id);
  };

  if (element) {
    applyToElement(element);
  }

  if (typeof document !== 'undefined') {
    applyToElement(document.documentElement);
    if (document.body) {
      applyToElement(document.body);
    }
  }

  return brand;
}
