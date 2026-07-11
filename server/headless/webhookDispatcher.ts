import crypto from 'crypto';
import { logHeadlessAudit } from './headlessActionAudit.js';

export function isPrivateAddress(hostname: string): boolean {
  const clean = hostname.trim().toLowerCase();
  if (clean === 'localhost' || clean === '127.0.0.1' || clean === '::1') return true;
  if (clean.startsWith('10.') || clean.startsWith('192.168.')) return true;
  if (clean.startsWith('172.')) {
    const parts = clean.split('.');
    if (parts.length >= 2) {
      const second = parseInt(parts[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
  }
  if (clean.startsWith('169.254.')) return true;
  return false;
}

export function validateWebhookUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname.toLowerCase();
    
    const isProduction = process.env.APP_MODE === 'production' || process.env.NODE_ENV === 'production';
    if (isProduction && isPrivateAddress(hostname)) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export async function dispatchWebhookEvent(
  dbState: any,
  event: string,
  payload: any
): Promise<void> {
  const subscriptions = dbState.webhooks || [];
  const matchingSubs = subscriptions.filter(
    (sub: any) => sub.status === 'active' && sub.events.includes(event)
  );

  if (matchingSubs.length === 0) return;

  const payloadString = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload
  });

  for (const sub of matchingSubs) {
    if (!validateWebhookUrl(sub.targetUrl)) {
      logHeadlessAudit(
        dbState,
        'System',
        'system',
        `Webhook dispatch to ${sub.targetUrl} blocked: Target URL failed private address / SSRF validation.`,
        'security'
      );
      continue;
    }

    const timestamp = Date.now().toString();
    const deliveryId = `dlv_${crypto.randomBytes(16).toString('hex')}`;
    
    // Bind payload, timestamp, and deliveryId in signature base to prevent replay attacks
    const signatureBase = `${timestamp}.${deliveryId}.${payloadString}`;
    const secretKey = sub.secretHash || 'default_secret';
    
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureBase)
      .digest('hex');

    // Attempt delivery with helper logic
    const attemptSend = async (retryCount = 0): Promise<boolean> => {
      try {
        const res = await fetch(sub.targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shapework-Signature': signature,
            'X-Shapework-Timestamp': timestamp,
            'X-Shapework-Event': event,
            'X-Shapework-Delivery-Id': deliveryId
          },
          body: payloadString
        });

        const success = res.ok;
        
        // Log delivery attempt in state
        if (!dbState.webhookDeliveries) dbState.webhookDeliveries = [];
        dbState.webhookDeliveries.push({
          id: deliveryId,
          subscriptionId: sub.id,
          targetUrl: sub.targetUrl,
          event,
          status: success ? 'delivered' : 'failed',
          statusCode: res.status,
          attempt: retryCount + 1,
          timestamp: new Date().toISOString()
        });

        if (success) {
          logHeadlessAudit(
            dbState,
            'System',
            'system',
            `Webhook event '${event}' delivered (Delivery ID: ${deliveryId}) to ${sub.targetUrl}`,
            'integrations'
          );
          return true;
        } else {
          console.warn(`[Webhook] Delivery failed to ${sub.targetUrl} with status: ${res.status}`);
          return false;
        }
      } catch (err: any) {
        if (retryCount < 1) {
          // Simple retry delay (backoff fallback)
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptSend(retryCount + 1);
        }

        // Log network error in state
        if (!dbState.webhookDeliveries) dbState.webhookDeliveries = [];
        dbState.webhookDeliveries.push({
          id: deliveryId,
          subscriptionId: sub.id,
          targetUrl: sub.targetUrl,
          event,
          status: 'failed',
          error: err.message,
          attempt: retryCount + 1,
          timestamp: new Date().toISOString()
        });

        logHeadlessAudit(
          dbState,
          'System',
          'system',
          `Webhook network error to ${sub.targetUrl} (Delivery ID: ${deliveryId}): ${err.message}`,
          'integrations'
        );
        return false;
      }
    };

    // Execute async fetch send
    attemptSend().catch(e => {
      console.error(`[Webhook] Fatal async dispatch error: ${e.message}`);
    });
  }
}
