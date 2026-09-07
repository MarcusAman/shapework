/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UrlHealthStatus } from './newsTypes';

export interface UrlValidationResult {
  originalUrl: string;
  resolvedUrl: string;
  status: UrlHealthStatus;
  httpStatus?: number;
  redirectCount: number;
  verifiedAt: string;
  error?: string;
}

// Banned tracking query parameters to strip
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
  'igshid'
]);

/**
 * Decode HTML entities commonly found in RSS feed URLs
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

/**
 * Check if a hostname or IP address targets private/internal infrastructure (SSRF protection)
 */
export function isPrivateOrInternalHost(hostname: string): boolean {
  if (!hostname) return true;
  const lower = hostname.toLowerCase().trim();

  // Strip brackets if IPv6
  const cleanHost = lower.replace(/^\[|\]$/g, '');

  if (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost === '0.0.0.0' ||
    cleanHost === '::1' ||
    cleanHost === '0:0:0:0:0:0:0:1' ||
    cleanHost.endsWith('.local') ||
    cleanHost.endsWith('.internal') ||
    cleanHost.endsWith('.localhost')
  ) {
    return true;
  }

  // IPv4 range checks
  const ipv4Match = cleanHost.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const octet1 = parseInt(ipv4Match[1], 10);
    const octet2 = parseInt(ipv4Match[2], 10);

    // 127.0.0.0/8 (Loopback)
    if (octet1 === 127) return true;
    // 10.0.0.0/8 (Private)
    if (octet1 === 10) return true;
    // 172.16.0.0/12 (Private)
    if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (octet1 === 192 && octet2 === 168) return true;
    // 169.254.0.0/16 (Link-local / AWS metadata)
    if (octet1 === 169 && octet2 === 254) return true;
    // 0.0.0.0/8
    if (octet1 === 0) return true;
  }

  return false;
}

/**
 * Safe canonical URL normalizer:
 * 1. Decodes HTML entities
 * 2. Resolves relative URLs against baseUrl
 * 3. Validates protocol (http: or https:)
 * 4. Checks SSRF protections
 * 5. Strips tracking params
 * 6. Strips unnecessary hash fragments
 */
export function normalizeAndSanitizeUrl(rawUrl: string, baseUrl?: string): { url?: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { error: 'Empty or invalid URL input' };
  }

  const decoded = decodeHtmlEntities(rawUrl.trim()).replace(/^["']|["']$/g, '');
  if (!decoded) {
    return { error: 'Empty URL after decoding' };
  }

  let parsed: URL;
  try {
    if (baseUrl) {
      parsed = new URL(decoded, baseUrl);
    } else {
      parsed = new URL(decoded);
    }
  } catch (err: any) {
    return { error: `Malformed URL: ${err.message}` };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { error: `Disallowed protocol: ${parsed.protocol}` };
  }

  if (isPrivateOrInternalHost(parsed.hostname)) {
    return { error: `Target host is private or internal: ${parsed.hostname}` };
  }

  // Strip tracking parameters
  const keysToDelete: string[] = [];
  parsed.searchParams.forEach((_, key) => {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      keysToDelete.push(key);
    }
  });
  for (const k of keysToDelete) {
    parsed.searchParams.delete(k);
  }

  // Strip hash fragment
  parsed.hash = '';

  return { url: parsed.toString() };
}

/**
 * Execute HTTP verification with redirect resolution and HEAD -> GET fallback
 */
export async function verifyUrlHealth(
  targetUrl: string, 
  timeoutMs: number = 6000
): Promise<UrlValidationResult> {
  const verifiedAt = new Date().toISOString();
  const norm = normalizeAndSanitizeUrl(targetUrl);
  if (!norm.url || norm.error) {
    return {
      originalUrl: targetUrl,
      resolvedUrl: targetUrl,
      status: 'invalid',
      redirectCount: 0,
      verifiedAt,
      error: norm.error || 'Invalid URL'
    };
  }

  let currentUrl = norm.url;
  let redirectCount = 0;
  const maxRedirects = 5;

  while (redirectCount <= maxRedirects) {
    // Re-verify SSRF for each redirect hop
    const checkNorm = normalizeAndSanitizeUrl(currentUrl);
    if (!checkNorm.url || checkNorm.error) {
      return {
        originalUrl: targetUrl,
        resolvedUrl: currentUrl,
        status: 'invalid',
        redirectCount,
        verifiedAt,
        error: checkNorm.error || 'Invalid redirect target'
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      // Attempt HEAD first
      let response: Response;
      try {
        response = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (Shapework News Verification; +https://shapework.co)'
          }
        });
      } catch (headErr: any) {
        if (headErr.name === 'AbortError') {
          clearTimeout(timeout);
          return {
            originalUrl: targetUrl,
            resolvedUrl: currentUrl,
            status: 'unavailable',
            redirectCount,
            verifiedAt,
            error: 'Request timeout'
          };
        }
        // If HEAD fails with network error, attempt GET range
        response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (Shapework News Verification; +https://shapework.co)',
            'Range': 'bytes=0-1024'
          }
        });
      } finally {
        clearTimeout(timeout);
      }

      // If HEAD returned 405 (Method Not Allowed) or 501, fallback to GET range
      if (response.status === 405 || response.status === 501) {
        const getController = new AbortController();
        const getTimeout = setTimeout(() => getController.abort(), timeoutMs);
        try {
          response = await fetch(currentUrl, {
            method: 'GET',
            redirect: 'manual',
            signal: getController.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (Shapework News Verification; +https://shapework.co)',
              'Range': 'bytes=0-1024'
            }
          });
        } finally {
          clearTimeout(getTimeout);
        }
      }

      // Check for redirects (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          return {
            originalUrl: targetUrl,
            resolvedUrl: currentUrl,
            status: 'unavailable',
            httpStatus: response.status,
            redirectCount,
            verifiedAt,
            error: 'Redirect missing Location header'
          };
        }

        const nextNorm = normalizeAndSanitizeUrl(location, currentUrl);
        if (!nextNorm.url) {
          return {
            originalUrl: targetUrl,
            resolvedUrl: currentUrl,
            status: 'invalid',
            httpStatus: response.status,
            redirectCount,
            verifiedAt,
            error: `Invalid redirect location: ${location}`
          };
        }

        currentUrl = nextNorm.url;
        redirectCount++;
        continue;
      }

      // Handle terminal statuses
      if (response.status >= 200 && response.status < 300) {
        return {
          originalUrl: targetUrl,
          resolvedUrl: currentUrl,
          status: redirectCount > 0 ? 'redirected' : 'valid',
          httpStatus: response.status,
          redirectCount,
          verifiedAt
        };
      }

      if (response.status === 401 || response.status === 403 || response.status === 429) {
        return {
          originalUrl: targetUrl,
          resolvedUrl: currentUrl,
          status: 'blocked',
          httpStatus: response.status,
          redirectCount,
          verifiedAt,
          error: `Access rate-limited or blocked (HTTP ${response.status})`
        };
      }

      if (response.status === 404 || response.status === 410) {
        return {
          originalUrl: targetUrl,
          resolvedUrl: currentUrl,
          status: 'unavailable',
          httpStatus: response.status,
          redirectCount,
          verifiedAt,
          error: `Resource not found (HTTP ${response.status})`
        };
      }

      return {
        originalUrl: targetUrl,
        resolvedUrl: currentUrl,
        status: 'unavailable',
        httpStatus: response.status,
        redirectCount,
        verifiedAt,
        error: `HTTP ${response.status}`
      };
    } catch (fetchErr: any) {
      return {
        originalUrl: targetUrl,
        resolvedUrl: currentUrl,
        status: 'unavailable',
        redirectCount,
        verifiedAt,
        error: fetchErr.name === 'AbortError' ? 'Request timeout' : fetchErr.message
      };
    }
  }

  return {
    originalUrl: targetUrl,
    resolvedUrl: currentUrl,
    status: 'unavailable',
    redirectCount,
    verifiedAt,
    error: 'Exceeded maximum redirect hops'
  };
}

/**
 * Batch validator with concurrency limits to prevent overloading external publishers
 */
export async function validateUrlsInBatch(
  urls: string[], 
  concurrency: number = 4
): Promise<Map<string, UrlValidationResult>> {
  const results = new Map<string, UrlValidationResult>();
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));

  for (let i = 0; i < uniqueUrls.length; i += concurrency) {
    const chunk = uniqueUrls.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(url => verifyUrlHealth(url))
    );
    for (let j = 0; j < chunk.length; j++) {
      results.set(chunk[j], chunkResults[j]);
    }
  }

  return results;
}
