/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { ingestInboundEmailToTask, IngestionResult } from './inboundEmailIngestionEngine.js';

export interface InboxScanSummary {
  scannedCount: number;
  ingestedCount: number;
  results: IngestionResult[];
  errors: string[];
}

// In-memory set of processed message IDs/UIDs to guarantee zero duplicate ingestion
const processedUids = new Set<string>();

let pollerIntervalId: NodeJS.Timeout | null = null;
let isScanInProgress = false;

/**
 * Connects to AskNora@nestrealty.com via IMAP SSL and scans for unread task emails
 */
export async function scanAskNoraInbox(): Promise<InboxScanSummary> {
  if (process.env.NORA_UNIFIED_INTAKE_ENABLED !== 'true' && process.env.ENABLE_IMAP_SCANNER !== 'true') {
    return { scannedCount: 0, ingestedCount: 0, results: [], errors: ['NORA_UNIFIED_INTAKE_ENABLED is false'] };
  }

  if (process.env.MAINTENANCE_MODE === 'true') {
    console.log('[IMAP Scanner] Maintenance mode active. Email polling paused without claiming messages.');
    return { scannedCount: 0, ingestedCount: 0, results: [], errors: ['Maintenance mode active'] };
  }

  if (isScanInProgress) {
    console.log('[IMAP Scanner] Scan already in progress, skipping overlapping run.');
    return { scannedCount: 0, ingestedCount: 0, results: [], errors: ['Scan in progress'] };
  }

  isScanInProgress = true;
  const summary: InboxScanSummary = {
    scannedCount: 0,
    ingestedCount: 0,
    results: [],
    errors: []
  };

  const imapUser = process.env.ASK_NORA_EMAIL || process.env.GOOGLE_SMTP_USER || 'asknora@nestrealty.com';
  const imapPass = (process.env.GOOGLE_SMTP_PASS || 'uhuk xenp kxdy aviu').replace(/\s+/g, '');

  // Skip live network connection during test runs if mock active
  if (process.env.NODE_ENV === 'test' && !process.env.RUN_LIVE_IMAP_TEST) {
    isScanInProgress = false;
    return {
      scannedCount: 0,
      ingestedCount: 0,
      results: [],
      errors: []
    };
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: imapUser,
      pass: imapPass
    },
    logger: false,
    emitLogs: false
  });

  try {
    console.log(`[IMAP Scanner] Connecting to ${imapUser}@imap.gmail.com:993...`);
    await client.connect();

    const lock = await client.getMailboxLock('INBOX');
    try {
      // Search for unread messages
      const searchResult = await client.search({ seen: false });
      const uids = Array.isArray(searchResult) ? searchResult : [];
      summary.scannedCount = uids.length;

      if (uids.length === 0) {
        console.log('[IMAP Scanner] Inbox clean: No unread messages in AskNora inbox.');
        return summary;
      }

      console.log(`[IMAP Scanner] Found ${uids.length} unread message(s) in AskNora inbox.`);

      for (const uid of uids) {
        const uidStr = String(uid);
        if (processedUids.has(uidStr)) {
          continue;
        }

        try {
          const download = await client.download(String(uid), undefined, { uid: true });
          if (!download || !download.content) {
            continue;
          }

          const parsed: ParsedMail = await simpleParser(download.content);
          const from = parsed.from?.text || parsed.from?.value?.[0]?.address || 'matt.orr@nestrealty.com';
          const to = parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map(t => t.text).join(', ') : parsed.to.text) : 'AskNora@nestrealty.com';
          const subject = parsed.subject || 'Listing Collateral Request';
          const textContent = parsed.text || '';
          const htmlContent = parsed.html || '';

          // Format attachments
          const attachments = (parsed.attachments || []).map((att, idx) => ({
            filename: att.filename || `attachment_${Date.now()}_${idx}.jpg`,
            contentType: att.contentType || 'image/jpeg',
            content: att.content,
            sizeBytes: att.size || att.content?.length || 3840000
          }));

          console.log(`[IMAP Scanner] Processing unread email from ${from} | Subject: "${subject}" | Attachments: ${attachments.length}`);

          const result = await ingestInboundEmailToTask({
            from,
            to,
            subject,
            textContent,
            htmlContent,
            attachments,
            messageId: parsed.messageId || uidStr
          });

          // Mark message as read (\Seen) in Gmail
          await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });

          processedUids.add(uidStr);
          summary.ingestedCount++;
          summary.results.push(result);
        } catch (msgErr: any) {
          console.error(`[IMAP Scanner] Error processing message UID ${uid}:`, msgErr.message);
          summary.errors.push(`UID ${uid}: ${msgErr.message}`);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    console.log(`[IMAP Scanner] Finished scan cycle. Ingested ${summary.ingestedCount} new task(s).`);
  } catch (err: any) {
    console.warn('[IMAP Scanner] Connection notice:', err.message);
    summary.errors.push(err.message);
  } finally {
    isScanInProgress = false;
  }

  return summary;
}

/**
 * Starts continuous background inbox scanner daemon
 */
export function startContinuousInboxScanner(intervalMs = 30000): void {
  if (pollerIntervalId) {
    console.log('[IMAP Scanner] Daemon already running.');
    return;
  }

  console.log(`[IMAP Scanner] Starting Nora Continuous Inbox Scanner (polling every ${intervalMs / 1000}s)...`);

  // Run initial scan after 5 seconds to allow server to bind ports
  setTimeout(() => {
    scanAskNoraInbox().catch(err => console.warn('[IMAP Scanner Initial Scan Notice]:', err.message));
  }, 5000);

  pollerIntervalId = setInterval(() => {
    scanAskNoraInbox().catch(err => console.warn('[IMAP Scanner Interval Notice]:', err.message));
  }, intervalMs);
}

/**
 * Stops continuous background inbox scanner
 */
export function stopContinuousInboxScanner(): void {
  if (pollerIntervalId) {
    clearInterval(pollerIntervalId);
    pollerIntervalId = null;
    console.log('[IMAP Scanner] Continuous Inbox Scanner stopped.');
  }
}
