/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { normalizeAndSanitizeUrl } from './urlValidator';
import { DestinationAccuracy, ContentType } from './newsTypes';

export interface ParsedFeedItem {
  title: string;
  link: string;
  pubDate: string;
  author?: string;
  excerpt: string;
  imageUrl?: string;
  videoUrl?: string;
  podcastUrl?: string;
  duration?: string;
  rawCategories: string[];
  contentHash: string;
  destinationAccuracy?: DestinationAccuracy;
}

export interface ParsedFeed {
  title: string;
  description?: string;
  link?: string;
  items: ParsedFeedItem[];
}

export function cleanHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8212;/g, '—')
    .replace(/&#8211;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .trim();
}

export function stripHtmlTags(html: string): string {
  if (!html) return '';
  const noCdata = html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  const noTags = noCdata.replace(/<[^>]+>/g, ' ');
  return cleanHtmlEntities(noTags).replace(/\s+/g, ' ').trim();
}

export function sanitizeUrl(urlStr: string, baseUrl?: string): string | undefined {
  if (!urlStr) return undefined;
  const result = normalizeAndSanitizeUrl(urlStr, baseUrl);
  return result.url;
}

function extractFirstImageUrlFromHtml(html: string, baseUrl?: string): string | undefined {
  if (!html) return undefined;
  const match = html.match(/<img[^>]+src=["'](https?:\/\/[^"'\s>]+)["']/i);
  return match ? sanitizeUrl(match[1], baseUrl) : undefined;
}

function formatDuration(rawDuration?: string): string | undefined {
  if (!rawDuration) return undefined;
  rawDuration = rawDuration.trim();
  if (rawDuration.includes(':')) {
    const parts = rawDuration.split(':').map(p => parseInt(p, 10));
    if (parts.length === 3) {
      const hours = parts[0];
      const mins = parts[1];
      return hours > 0 ? `${hours * 60 + mins} min` : `${mins} min`;
    }
    if (parts.length === 2) {
      return `${parts[0]} min`;
    }
  }
  const sec = parseInt(rawDuration, 10);
  if (!isNaN(sec) && sec > 0) {
    const mins = Math.round(sec / 60);
    return `${Math.max(1, mins)} min`;
  }
  return rawDuration;
}

export function sanitizeXml(xml: string): string {
  if (!xml) return '';
  return xml
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!ENTITY[\s\S]*?>/gi, '');
}

/**
 * Robust Atom entry link extractor: handles attribute ordering and rel types
 */
function extractAtomLink(entryXml: string, baseUrl?: string): string | undefined {
  const linkTagRegex = /<link\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  let alternateLink: string | undefined;
  let fallbackLink: string | undefined;

  while ((match = linkTagRegex.exec(entryXml)) !== null) {
    const attrs = match[1];
    const hrefMatch = attrs.match(/\bhref=["']([^"']+)["']/i);
    if (!hrefMatch) continue;

    const rawHref = cleanHtmlEntities(hrefMatch[1]);
    const cleanHref = sanitizeUrl(rawHref, baseUrl);
    if (!cleanHref) continue;

    const relMatch = attrs.match(/\brel=["']([^"']+)["']/i);
    const rel = relMatch ? relMatch[1].toLowerCase() : 'alternate';

    if (rel === 'alternate') {
      alternateLink = cleanHref;
      break;
    } else if (!fallbackLink && !['self', 'enclosure', 'edit', 'replies', 'service'].includes(rel)) {
      fallbackLink = cleanHref;
    }
  }

  return alternateLink || fallbackLink;
}

/**
 * Classifies destination URL as exact, collection, homepage, or unknown
 */
export function classifyDestinationAccuracy(
  urlStr: string,
  contentType?: ContentType | string,
  sourceSiteUrl?: string
): DestinationAccuracy {
  if (!urlStr) return 'unknown';

  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    let pathname = parsed.pathname.toLowerCase();

    // Trim trailing slash for uniform matching
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // 1. Megaphone player check (e.g. player.megaphone.fm/MDMHI8345178792)
    if (host.includes('megaphone.fm')) {
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length >= 1 && segments[0] !== 'podcasts' && segments[0] !== 'shows') {
        return 'exact';
      }
    }

    // 2. YouTube videos
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      if (parsed.searchParams.has('v') || host.includes('youtu.be')) {
        return 'exact';
      }
      return 'collection';
    }

    // 3. Direct audio/video/media enclosure
    if (pathname.endsWith('.mp3') || pathname.endsWith('.mp4') || pathname.endsWith('.m4a') || pathname.endsWith('.wav')) {
      return 'exact';
    }

    // 4. Homepage detection
    const cleanSegments = pathname.split('/').filter(Boolean);
    if (cleanSegments.length === 0 || pathname === '' || pathname === '/' || pathname === '/index.html' || pathname === '/index.php' || pathname === '/home') {
      return 'homepage';
    }

    if (sourceSiteUrl) {
      try {
        const parsedBase = new URL(sourceSiteUrl);
        const baseCleanSegments = parsedBase.pathname.split('/').filter(Boolean);
        // Only if URL pathname has the exact same segments as sourceSiteUrl root (e.g. /blog)
        if (
          parsed.origin === parsedBase.origin &&
          cleanSegments.length > 0 &&
          cleanSegments.length === baseCleanSegments.length &&
          cleanSegments.every((s, i) => s === baseCleanSegments[i])
        ) {
          return 'homepage';
        }
      } catch {}
    }

    // 5. Collection / Archive / Show series / Tag / Directory detection
    const collectionPatterns = [
      /^\/shows(?:\/[a-z0-9_-]+)?$/i,
      /^\/podcasts?$/i,
      /^\/category(?:\/.*)?$/i,
      /^\/categories(?:\/.*)?$/i,
      /^\/tag(?:\/.*)?$/i,
      /^\/tags(?:\/.*)?$/i,
      /^\/topics?(?:\/.*)?$/i,
      /^\/section(?:\/.*)?$/i,
      /^\/search(?:\/.*)?$/i,
      /^\/author(?:\/.*)?$/i,
      /-archive(?:\/.*)?$/i,
      /\/archive(?:\/.*)?$/i,
      /\/toolkit(?:\/.*)?$/i,
      /\/leadership-academy(?:\/.*)?$/i,
      /\/feed(?:\/.*)?$/i,
      /^\/news$/i,
      /^\/articles?$/i,
      /^\/blogs?$/i
    ];

    for (const pattern of collectionPatterns) {
      if (pattern.test(pathname)) {
        return 'collection';
      }
    }

    // 6. Detailed article paths
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 1) {
      // Date-based slug /2026/09/slug
      if (/\b\d{4}\/\d{2}\b/.test(pathname)) {
        return 'exact';
      }
      // Sub-path article slug /articles/slug or /news/slug
      if (pathname.includes('/articles/') || pathname.includes('/news/')) {
        return 'exact';
      }
      // Slug with hyphens
      const last = segments[segments.length - 1];
      if (last.includes('-') && last.length > 5) {
        return 'exact';
      }
      if (segments.length >= 2) {
        return 'exact';
      }
    }

    return 'exact';
  } catch {
    return 'unknown';
  }
}

/**
 * Robust RSS 2.0 item link extractor
 */
function extractRssItemLink(itemXml: string, channelLink?: string, baseUrl?: string): string | undefined {
  // Check for Megaphone podcast enclosure
  const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  let megaphonePlayerUrl: string | undefined;
  if (enclosureMatch) {
    const encUrl = enclosureMatch[1];
    const megaMatch = encUrl.match(/traffic\.megaphone\.fm\/([A-Za-z0-9_-]+)(?:\.mp3)?/i);
    if (megaMatch) {
      megaphonePlayerUrl = `https://player.megaphone.fm/${megaMatch[1]}`;
    }
  }

  // 1. Try <link> tag
  const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (linkMatch) {
    const rawLink = stripHtmlTags(linkMatch[1]);
    const cleanLink = sanitizeUrl(rawLink, baseUrl || channelLink);
    if (cleanLink) {
      if (megaphonePlayerUrl) {
        const isCollection = cleanLink.includes('/shows/') || cleanLink.endsWith('/podcast/') || cleanLink.endsWith('/podcasts/') || cleanLink === channelLink;
        if (isCollection) {
          return megaphonePlayerUrl;
        }
      }
      return cleanLink;
    }
  }

  // 2. Try <guid isPermaLink="true">
  const permaGuidMatch = itemXml.match(/<guid[^>]+isPermaLink=["']true["'][^>]*>([\s\S]*?)<\/guid>/i);
  if (permaGuidMatch) {
    const rawGuid = stripHtmlTags(permaGuidMatch[1]);
    const cleanGuid = sanitizeUrl(rawGuid, baseUrl || channelLink);
    if (cleanGuid) return cleanGuid;
  }

  // 3. Try <guid> if it contains an absolute http(s) URL
  const anyGuidMatch = itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
  if (anyGuidMatch) {
    const rawGuid = stripHtmlTags(anyGuidMatch[1]);
    if (rawGuid.startsWith('http://') || rawGuid.startsWith('https://')) {
      const cleanGuid = sanitizeUrl(rawGuid, baseUrl || channelLink);
      if (cleanGuid) return cleanGuid;
    }
  }

  // 4. Megaphone player URL if enclosure exists
  if (megaphonePlayerUrl) {
    return megaphonePlayerUrl;
  }

  // 5. Fallback to channelLink only if no other link
  if (channelLink) {
    const cleanChannelLink = sanitizeUrl(channelLink, baseUrl);
    if (cleanChannelLink) return cleanChannelLink;
  }

  return undefined;
}

export function parseRssXml(xml: string, sourceSiteUrl?: string): ParsedFeed {
  // Security Guard 1: Defense against oversized XML payloads
  if (!xml || xml.length > 5 * 1024 * 1024) {
    throw new Error('Feed payload exceeds safety threshold of 5MB.');
  }

  // Security Guard 2: Strip DOCTYPE and ENTITY declarations to defend against XXE
  const sanitizedXml = sanitizeXml(xml);

  const isAtom = /<feed[^>]*xmlns=['"]http:\/\/www\.w3\.org\/2005\/Atom['"]/i.test(sanitizedXml) ||
                 /<feed[\s>]/i.test(sanitizedXml);

  const feedTitleMatch = sanitizedXml.match(/<channel[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i) ||
                         sanitizedXml.match(/<feed[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i);
  const feedTitle = feedTitleMatch ? stripHtmlTags(feedTitleMatch[1]) : 'Real Estate Feed';

  // Extract channel-level link
  const channelLinkMatch = sanitizedXml.match(/<channel[\s\S]*?<link[^>]*>([\s\S]*?)<\/link>/i) ||
                           sanitizedXml.match(/<feed[\s\S]*?<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i) ||
                           sanitizedXml.match(/<feed[\s\S]*?<link[^>]+href=["']([^"']+)["']/i);
  const channelLink = channelLinkMatch ? sanitizeUrl(stripHtmlTags(channelLinkMatch[1]), sourceSiteUrl) : undefined;

  const items: ParsedFeedItem[] = [];

  if (isAtom) {
    // Atom parsing
    const entryRegex = /<entry[\s\S]*?<\/entry>/gi;
    let entryMatch: RegExpExecArray | null;

    while ((entryMatch = entryRegex.exec(sanitizedXml)) !== null) {
      const entryXml = entryMatch[0];

      // Title
      const titleMatch = entryXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? stripHtmlTags(titleMatch[1]) : '';
      if (!title) continue;

      // Link (using robust Atom link extractor)
      const link = extractAtomLink(entryXml, sourceSiteUrl || channelLink);
      if (!link) continue;

      // Date
      const dateMatch = entryXml.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ||
                        entryXml.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);
      let pubDate = new Date().toISOString();
      if (dateMatch) {
        const d = new Date(stripHtmlTags(dateMatch[1]));
        if (!isNaN(d.getTime())) pubDate = d.toISOString();
      }

      // Author
      const authorMatch = entryXml.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/i);
      const author = authorMatch ? stripHtmlTags(authorMatch[1]) : undefined;

      // Content / Summary
      const contentMatch = entryXml.match(/<content[^>]*>([\s\S]*?)<\/content>/i) ||
                           entryXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
      const rawContent = contentMatch ? contentMatch[1] : '';
      const excerpt = stripHtmlTags(rawContent).slice(0, 300);

      // Media / Thumbnail
      const mediaThumbMatch = entryXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i) ||
                              entryXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
      let imageUrl = mediaThumbMatch ? sanitizeUrl(cleanHtmlEntities(mediaThumbMatch[1]), sourceSiteUrl) : undefined;
      if (!imageUrl) {
        imageUrl = extractFirstImageUrlFromHtml(rawContent, sourceSiteUrl);
      }

      // YouTube support
      let videoUrl: string | undefined;
      const ytIdMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i) ||
                        link.match(/[?&]v=([^&#]+)/) ||
                        link.match(/youtu\.be\/([^?&#]+)/);
      if (ytIdMatch) {
        const ytId = ytIdMatch[1].trim();
        videoUrl = `https://www.youtube.com/watch?v=${ytId}`;
        if (!imageUrl) {
          imageUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        }
      }

      const contentHash = crypto
        .createHash('sha256')
        .update(`${title}|${link}`)
        .digest('hex');

      const destinationAccuracy = classifyDestinationAccuracy(link, videoUrl ? 'video' : 'article', sourceSiteUrl || channelLink);

      items.push({
        title,
        link,
        pubDate,
        author,
        excerpt,
        imageUrl,
        videoUrl,
        rawCategories: [],
        contentHash,
        destinationAccuracy
      });
    }
  } else {
    // RSS 2.0 parsing
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemRegex.exec(sanitizedXml)) !== null) {
      const itemXml = itemMatch[0];

      // Title
      const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? stripHtmlTags(titleMatch[1]) : '';
      if (!title) continue;

      // Link (using robust RSS item link extractor)
      const link = extractRssItemLink(itemXml, channelLink, sourceSiteUrl);
      if (!link) continue;

      // Date
      const dateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
                        itemXml.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
      let pubDate = new Date().toISOString();
      if (dateMatch) {
        const d = new Date(stripHtmlTags(dateMatch[1]));
        if (!isNaN(d.getTime())) pubDate = d.toISOString();
      }

      // Author / Creator
      const authorMatch = itemXml.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i) ||
                          itemXml.match(/<author[^>]*>([\s\S]*?)<\/author>/i) ||
                          itemXml.match(/<itunes:author[^>]*>([\s\S]*?)<\/itunes:author>/i);
      const author = authorMatch ? stripHtmlTags(authorMatch[1]) : undefined;

      // Description / Encoded Content
      const descMatch = itemXml.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i) ||
                        itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
      const rawDesc = descMatch ? descMatch[1] : '';
      const excerpt = stripHtmlTags(rawDesc).slice(0, 300);

      // Categories
      const rawCategories: string[] = [];
      const catRegex = /<category[^>]*>([\s\S]*?)<\/category>/gi;
      let catMatch: RegExpExecArray | null;
      while ((catMatch = catRegex.exec(itemXml)) !== null) {
        const catText = stripHtmlTags(catMatch[1]);
        if (catText && !rawCategories.includes(catText)) {
          rawCategories.push(catText);
        }
      }

      // Media / Enclosures (Podcasts & Images)
      let podcastUrl: string | undefined;
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;

      const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']([^"']+)["']/i) ||
                             itemXml.match(/<enclosure[^>]+type=["']([^"']+)["'][^>]*url=["']([^"']+)["']/i);
      if (enclosureMatch) {
        const encUrlRaw = enclosureMatch[1].startsWith('http') ? enclosureMatch[1] : enclosureMatch[2];
        const encTypeRaw = enclosureMatch[1].startsWith('http') ? enclosureMatch[2] : enclosureMatch[1];
        const encUrl = sanitizeUrl(cleanHtmlEntities(encUrlRaw), sourceSiteUrl);
        const encType = (encTypeRaw || '').toLowerCase();
        if (encUrl) {
          if (encType.includes('audio') || encUrl.endsWith('.mp3')) {
            podcastUrl = encUrl;
          } else if (encType.includes('video') || encUrl.endsWith('.mp4')) {
            videoUrl = encUrl;
          } else if (encType.includes('image')) {
            imageUrl = encUrl;
          }
        }
      }

      // Media RSS tags (media:content, media:thumbnail, itunes:image)
      if (!imageUrl) {
        const mediaThumb = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i) ||
                           itemXml.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*medium=["']image["']/i) ||
                           itemXml.match(/<itunes:image[^>]+href=["']([^"']+)["']/i);
        if (mediaThumb) {
          imageUrl = sanitizeUrl(cleanHtmlEntities(mediaThumb[1]), sourceSiteUrl);
        }
      }

      if (!imageUrl) {
        imageUrl = extractFirstImageUrlFromHtml(rawDesc, sourceSiteUrl);
      }

      // Duration (itunes:duration)
      const durationMatch = itemXml.match(/<itunes:duration[^>]*>([\s\S]*?)<\/itunes:duration>/i);
      const duration = durationMatch ? formatDuration(stripHtmlTags(durationMatch[1])) : undefined;

      // Detect YouTube URLs in link
      if (link.includes('youtube.com/watch') || link.includes('youtu.be/')) {
        const ytIdMatch = link.match(/[?&]v=([^&#]+)/) || link.match(/youtu\.be\/([^?&#]+)/);
        if (ytIdMatch) {
          const ytId = ytIdMatch[1].trim();
          videoUrl = `https://www.youtube.com/watch?v=${ytId}`;
          if (!imageUrl) {
            imageUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
          }
        }
      }

      let finalLink = link;
      if (podcastUrl) {
        const megaMatch = podcastUrl.match(/traffic\.megaphone\.fm\/([A-Za-z0-9_-]+)(?:\.mp3)?/i);
        if (megaMatch) {
          const megaphonePlayerUrl = `https://player.megaphone.fm/${megaMatch[1]}`;
          const currentAccuracy = classifyDestinationAccuracy(finalLink, 'podcast', sourceSiteUrl || channelLink);
          if (currentAccuracy === 'collection' || currentAccuracy === 'homepage' || finalLink === channelLink) {
            finalLink = megaphonePlayerUrl;
          }
        } else if (finalLink === channelLink || classifyDestinationAccuracy(finalLink, 'podcast', sourceSiteUrl || channelLink) === 'collection') {
          finalLink = podcastUrl;
        }
      }

      const destinationAccuracy = classifyDestinationAccuracy(
        finalLink,
        podcastUrl ? 'podcast' : videoUrl ? 'video' : 'article',
        sourceSiteUrl || channelLink
      );

      const contentHash = crypto
        .createHash('sha256')
        .update(`${title}|${finalLink}`)
        .digest('hex');

      items.push({
        title,
        link: finalLink,
        pubDate,
        author,
        excerpt,
        imageUrl,
        videoUrl,
        podcastUrl,
        duration,
        rawCategories,
        contentHash,
        destinationAccuracy
      });
    }
  }

  return {
    title: feedTitle,
    description: undefined,
    link: channelLink,
    items
  };
}

export const parseRssOrAtomFeed = parseRssXml;
