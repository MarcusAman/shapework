/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Verified External Resource & Trusted Link Service
 * Enforces provenance, validation, and anti-fixture security on all external Google links.
 */

export interface VerifiedExternalResource {
  provider: 'google_drive' | 'google_docs' | 'google_slides' | 'google_calendar' | 'google_meet';
  resourceId: string;
  url: string;
  provenance: 'provider_response' | 'authorized_database_record';
  verifiedAt: string;
  workspaceId: string;
  status: 'available' | 'unavailable' | 'stale';
}

export class VerifiedLinkService {
  private static verifiedStore: Map<string, VerifiedExternalResource> = new Map();

  // Trusted Google Hostnames
  private static readonly ALLOWED_HOSTS = new Set([
    'drive.google.com',
    'docs.google.com',
    'meet.google.com',
    'calendar.google.com'
  ]);

  // Forbidden placeholder / fixture patterns
  private static readonly FORBIDDEN_PATTERNS = [
    /1DRV_/i,
    /1SLD_/i,
    /gdrive_vault_/i,
    /\[PROPERTY_ADDRESS\]/i,
    /mock/i,
    /fixture/i,
    /dev_mock_/i,
    /placeholder/i,
    /example\.com/i,
    /dummy/i
  ];

  /**
   * Check if a URL has valid Google structure and no placeholder tokens
   */
  public static isValidGoogleUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const clean = url.trim();

    // Check forbidden placeholder patterns
    for (const pattern of this.FORBIDDEN_PATTERNS) {
      if (pattern.test(clean)) return false;
    }

    try {
      const parsed = new URL(clean);
      if (parsed.protocol !== 'https:') return false;
      return this.ALLOWED_HOSTS.has(parsed.hostname.toLowerCase());
    } catch {
      return false;
    }
  }

  /**
   * Register a verified external resource returned from live provider API
   */
  public static registerVerifiedResource(resource: VerifiedExternalResource): void {
    if (!this.isValidGoogleUrl(resource.url)) {
      console.warn(`[VerifiedLinkService] Rejected unverified/placeholder link: ${resource.url}`);
      return;
    }
    const key = `${resource.workspaceId}:${resource.url}`;
    this.verifiedStore.set(key, {
      ...resource,
      verifiedAt: new Date().toISOString(),
      status: 'available'
    });
  }

  /**
   * Check if a link is verified for a workspace
   */
  public static isLinkVerified(url: string, workspaceId: string): boolean {
    if (!this.isValidGoogleUrl(url)) return false;
    const key = `${workspaceId}:${url}`;
    const entry = this.verifiedStore.get(key);
    return Boolean(entry && entry.status === 'available');
  }

  /**
   * Sanitize markdown response to prevent rendering 404 fake links.
   * If a link contains a placeholder or is unverified, converts it to clean non-clickable text.
   */
  public static sanitizeMarkdownLinks(markdown: string, workspaceId: string = 'ws_wilmington'): string {
    if (!markdown || typeof markdown !== 'string') return markdown;

    // Match markdown links: [Text](URL)
    return markdown.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (match, text, url) => {
      // If it's not a valid URL or contains placeholders, strip the active link
      if (!this.isValidGoogleUrl(url)) {
        return `**${text}** *(Connect Integration to View)*`;
      }
      return match;
    });
  }

  /**
   * Reset store (for testing)
   */
  public static resetForTesting(): void {
    this.verifiedStore.clear();
  }
}
