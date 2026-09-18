/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Asset Inspection & Proof Validation Utility
 * Extracts verifiable dimensions, aspect ratios, genuine binary DPI, and PDF page counts.
 * Strictly adheres to DPI honesty: never fabricates "300 DPI verified" when absent.
 */

export interface InspectedAssetMetadata {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  aspectRatio: string | null;
  aspectRatioValue: number | null;
  orientation: 'portrait' | 'landscape' | 'square' | 'unknown';
  dpi: number | null;
  dpiVerified: boolean;
  dpiLabel: string;
  pageCount: number;
  formatMatch: 'matches' | 'warning' | 'unverified';
  formatMatchMessage: string;
}

/**
 * Parses binary array buffer to inspect JPEG (JFIF/EXIF) or PNG (pHYs) for genuine DPI.
 * If resolution headers are missing or uncalibrated, returns dpi: null with truthful label.
 */
export function extractDpiFromBuffer(buffer: Uint8Array): { dpi: number | null; dpiVerified: boolean; dpiLabel: string } {
  if (!buffer || buffer.length < 16) {
    return { dpi: null, dpiVerified: false, dpiLabel: 'DPI could not be verified from this file.' };
  }

  // 1. JPEG Check: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];

      // JFIF APP0 marker (0xFF 0xE0)
      if (marker === 0xe0) {
        const length = (buffer[offset + 2] << 8) | buffer[offset + 3];
        // Check "JFIF\0" at offset + 4
        const isJfif =
          buffer[offset + 4] === 0x4a && // J
          buffer[offset + 5] === 0x46 && // F
          buffer[offset + 6] === 0x49 && // I
          buffer[offset + 7] === 0x46 && // F
          buffer[offset + 8] === 0x00;

        if (isJfif && length >= 14) {
          const units = buffer[offset + 11]; // 0: no units (ratio), 1: dots/inch, 2: dots/cm
          const xDensity = (buffer[offset + 12] << 8) | buffer[offset + 13];
          const yDensity = (buffer[offset + 14] << 8) | buffer[offset + 15];

          if (units === 1 && xDensity > 0) {
            return {
              dpi: xDensity,
              dpiVerified: true,
              dpiLabel: `${xDensity} DPI (Embedded JFIF)`
            };
          } else if (units === 2 && xDensity > 0) {
            const dpi = Math.round(xDensity * 2.54);
            return {
              dpi,
              dpiVerified: true,
              dpiLabel: `${dpi} DPI (Converted from dots/cm)`
            };
          }
        }
      }

      // EXIF APP1 marker (0xFF 0xE1)
      if (marker === 0xe1) {
        // Look for TIFF Resolution tags within EXIF
        for (let i = offset + 10; i < Math.min(offset + 300, buffer.length - 12); i++) {
          if (buffer[i] === 0x01 && buffer[i + 1] === 0x1a) {
            // Found candidate XResolution tag
            const valOffset = (buffer[i + 8] << 24) | (buffer[i + 9] << 16) | (buffer[i + 10] << 8) | buffer[i + 11];
            if (valOffset > 0 && offset + 10 + valOffset + 8 <= buffer.length) {
              const num = (buffer[offset + 10 + valOffset] << 24) | (buffer[offset + 10 + valOffset + 1] << 16) | (buffer[offset + 10 + valOffset + 2] << 8) | buffer[offset + 10 + valOffset + 3];
              const den = (buffer[offset + 10 + valOffset + 4] << 24) | (buffer[offset + 10 + valOffset + 5] << 16) | (buffer[offset + 10 + valOffset + 6] << 8) | buffer[offset + 10 + valOffset + 7];
              if (den > 0) {
                const dpi = Math.round(num / den);
                if (dpi >= 72 && dpi <= 1200) {
                  return {
                    dpi,
                    dpiVerified: true,
                    dpiLabel: `${dpi} DPI (Embedded EXIF)`
                  };
                }
              }
            }
          }
        }
      }

      // Skip to next marker
      const segLength = (buffer[offset + 2] << 8) | buffer[offset + 3];
      if (segLength <= 0) break;
      offset += 2 + segLength;
    }
  }

  // 2. PNG Check: 0x89 'P' 'N' 'G'
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 && // P
    buffer[2] === 0x4e && // N
    buffer[3] === 0x47    // G
  ) {
    let offset = 8;
    while (offset < buffer.length - 12) {
      const chunkLength = (buffer[offset] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3];
      const type = String.fromCharCode(
        buffer[offset + 4],
        buffer[offset + 5],
        buffer[offset + 6],
        buffer[offset + 7]
      );

      // pHYs Chunk: physical pixel dimensions
      if (type === 'pHYs' && chunkLength >= 9) {
        const ppuX = (buffer[offset + 8] << 24) | (buffer[offset + 9] << 16) | (buffer[offset + 10] << 8) | buffer[offset + 11];
        const unit = buffer[offset + 16]; // 1 = meter
        if (unit === 1 && ppuX > 0) {
          const dpi = Math.round(ppuX * 0.0254);
          return {
            dpi,
            dpiVerified: true,
            dpiLabel: `${dpi} DPI (Embedded PNG pHYs)`
          };
        }
      }

      if (type === 'IEND') break;
      offset += 12 + chunkLength;
    }
  }

  // Strictly return honest unverified label when missing
  return {
    dpi: null,
    dpiVerified: false,
    dpiLabel: 'DPI could not be verified from this file.'
  };
}

/**
 * Inspects PDF binary header to extract page count and dimensions.
 */
export function inspectPdfBuffer(buffer: Uint8Array): {
  pageCount: number;
  dimensions: string | null;
  orientation: 'portrait' | 'landscape' | 'unknown';
  isValidPdf: boolean;
} {
  if (!buffer || buffer.length < 8) {
    return { pageCount: 1, dimensions: null, orientation: 'unknown', isValidPdf: false };
  }

  // Check %PDF header
  const header = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3], buffer[4]);
  if (!header.startsWith('%PDF')) {
    return { pageCount: 1, dimensions: null, orientation: 'unknown', isValidPdf: false };
  }

  let text = '';
  const len = Math.min(buffer.length, 500000); // inspect first 500KB
  for (let i = 0; i < len; i++) {
    text += String.fromCharCode(buffer[i]);
  }

  // 1. Page count inspection: search for /Type /Page (excluding /Pages) or /Count
  const pageMatches = text.match(/\/Type\s*\/Page\b/g);
  let pageCount = pageMatches ? pageMatches.length : 1;

  const countMatch = text.match(/\/Pages\b[^>]*\/Count\s+(\d+)/);
  if (countMatch && countMatch[1]) {
    const parsed = parseInt(countMatch[1], 10);
    if (parsed > 0) pageCount = parsed;
  }

  // 2. MediaBox dimensions inspection: /MediaBox [ x y w h ] in points (72pt = 1 inch)
  const mediaBoxMatch = text.match(/\/MediaBox\s*\[\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*\]/);
  let dimensions: string | null = null;
  let orientation: 'portrait' | 'landscape' | 'unknown' = 'unknown';

  if (mediaBoxMatch) {
    const wPt = Math.abs(parseFloat(mediaBoxMatch[3]) - parseFloat(mediaBoxMatch[1]));
    const hPt = Math.abs(parseFloat(mediaBoxMatch[4]) - parseFloat(mediaBoxMatch[2]));
    const wIn = (wPt / 72).toFixed(1);
    const hIn = (hPt / 72).toFixed(1);

    dimensions = `${wIn}″ × ${hIn}″ (${Math.round(wPt)} × ${Math.round(hPt)} pt)`;
    orientation = wPt > hPt ? 'landscape' : 'portrait';
  }

  return {
    pageCount: Math.max(1, pageCount),
    dimensions,
    orientation,
    isValidPdf: true
  };
}

/**
 * Validates whether asset dimensions match the requested deliverable type.
 */
export function validateDeliverableFormat(
  deliverableName: string,
  width: number | null,
  height: number | null,
  isPdf: boolean = false
): { formatMatch: 'matches' | 'warning' | 'unverified'; formatMatchMessage: string } {
  if (!width || !height) {
    return {
      formatMatch: 'unverified',
      formatMatchMessage: 'Unable to verify dimensions from file'
    };
  }

  const nameLower = (deliverableName || '').toLowerCase();
  const ratio = width / height;

  // 8.5 x 11 Letter Flyer (Portrait ~0.773, Landscape ~1.294)
  if (nameLower.includes('8.5') || nameLower.includes('flyer') || nameLower.includes('letter')) {
    const expectedPortrait = 8.5 / 11; // ~0.7727
    const expectedLandscape = 11 / 8.5; // ~1.2941
    const tolerance = 0.08;

    if (Math.abs(ratio - expectedPortrait) <= tolerance || Math.abs(ratio - expectedLandscape) <= tolerance) {
      return {
        formatMatch: 'matches',
        formatMatchMessage: 'Matches 8.5 × 11 Letter specification'
      };
    }
    return {
      formatMatch: 'warning',
      formatMatchMessage: `Aspect ratio (${ratio.toFixed(2)}) deviates from standard 8.5 × 11 flyer (0.77)`
    };
  }

  // 9:16 Social Story / Reel Carousel (Portrait ~0.5625)
  if (nameLower.includes('9:16') || nameLower.includes('story') || nameLower.includes('carousel') || nameLower.includes('social')) {
    const expected = 9 / 16; // 0.5625
    const tolerance = 0.06;

    if (Math.abs(ratio - expected) <= tolerance) {
      return {
        formatMatch: 'matches',
        formatMatchMessage: 'Matches 9:16 vertical social specification'
      };
    }
    return {
      formatMatch: 'warning',
      formatMatchMessage: `Aspect ratio (${ratio.toFixed(2)}) deviates from 9:16 vertical format (0.56)`
    };
  }

  // 6 x 9 Postcard / Direct Mail (Landscape ~1.50, Portrait ~0.667)
  if (nameLower.includes('6x9') || nameLower.includes('postcard') || nameLower.includes('eddm') || nameLower.includes('mail')) {
    const expectedLandscape = 9 / 6; // 1.50
    const expectedPortrait = 6 / 9; // 0.667
    const tolerance = 0.08;

    if (Math.abs(ratio - expectedLandscape) <= tolerance || Math.abs(ratio - expectedPortrait) <= tolerance) {
      return {
        formatMatch: 'matches',
        formatMatchMessage: 'Matches 6 × 9 direct mail postcard specification'
      };
    }
    return {
      formatMatch: 'warning',
      formatMatchMessage: `Aspect ratio (${ratio.toFixed(2)}) deviates from 6 × 9 postcard format (1.50)`
    };
  }

  return {
    formatMatch: 'matches',
    formatMatchMessage: 'Dimensions recorded for deliverable'
  };
}

/**
 * Validates that a proof URL is HTTPS and points to an approved proof service.
 */
export function validateProofUrl(url: string): { valid: boolean; error?: string; normalizedUrl?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: 'Proof URL is required.' };
  }

  const trimmed = url.trim();

  // Strictly enforce HTTPS
  if (!trimmed.startsWith('https://')) {
    return { valid: false, error: 'INVALID_PROTOCOL: Proof link must use secure https:// protocol.' };
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    // Whitelist approved domains
    const isApprovedHost =
      host === 'drive.google.com' ||
      host === 'docs.google.com' ||
      host === 'storage.googleapis.com' ||
      host === 'nest.maxadesigns.com' ||
      host === 'designcenter.nestrealty.com' ||
      host === 'shapework.co' ||
      host.endsWith('.maxadesigns.com') ||
      host.endsWith('.nestrealty.com') ||
      host.endsWith('.shapework.co');

    if (!isApprovedHost) {
      return {
        valid: false,
        error: `UNAPPROVED_HOST: "${host}" is not an authorized proof domain. Please use Google Drive, Maxa Design Center, or Nest Storage.`
      };
    }

    return { valid: true, normalizedUrl: parsed.toString() };
  } catch {
    return { valid: false, error: 'MALFORMED_URL: The provided proof link is not a valid URL.' };
  }
}
