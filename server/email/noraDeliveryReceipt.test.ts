import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ sendMail: vi.fn(), guard: vi.fn() }));
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail: mocks.sendMail }) } }));
vi.mock('./outboundDispatchGuards.js', () => ({ evaluateOutboundDispatchGuard: mocks.guard }));
import { sendEmail, sendTaskCompletionEmail, toAbsolutePublicUrl } from './emailProvider.js';

describe('Nora delivery SMTP receipt', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('OUTBOUND_MASTER_MODE', 'live');
    vi.stubEnv('NORA_EMAIL_PASSWORD', 'test-placeholder-never-sent');
    mocks.guard.mockResolvedValue({ allowed: true });
    mocks.sendMail.mockResolvedValue({ messageId: '<accepted@nora.test>', accepted: ['agent@nestrealty.com', 'melissa.gagliardi@nestrealty.com'], rejected: [], response: '250 accepted' });
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
  it('preserves assets, Melissa CC, reply headers, and actual SMTP acceptance', async () => {
    const attachments = [{ filename: 'proof.pdf', content: Buffer.from('approved'), contentType: 'application/pdf' }];
    const result = await sendEmail({ to: 'agent@nestrealty.com', cc: ['melissa.gagliardi@nestrealty.com'], subject: 'Ready', replyTo: 'asknora@nestrealty.com', inReplyTo: '<request@test>', references: ['<request@test>'], attachments });
    expect(result).toMatchObject({ success: true, smtpAccepted: true, confirmedReceipt: false, messageId: '<accepted@nora.test>', rejectedRecipients: [] });
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({ attachments, cc: ['melissa.gagliardi@nestrealty.com'], replyTo: 'asknora@nestrealty.com', inReplyTo: '<request@test>', references: ['<request@test>'] }));
  });
  it('does not treat CC-only SMTP acceptance as delivery to the agent', async () => {
    mocks.sendMail.mockResolvedValue({ messageId: '<partial@test>', accepted: ['melissa.gagliardi@nestrealty.com'], rejected: ['agent@nestrealty.com'] });
    expect(await sendEmail({ to: 'agent@nestrealty.com', subject: 'Ready' })).toMatchObject({ success: false, smtpAccepted: false, rejectedRecipients: ['agent@nestrealty.com'] });
  });
  it('holds mail without calling transport', async () => {
    vi.stubEnv('OUTBOUND_MASTER_MODE', 'hold');
    expect(await sendEmail({ to: 'agent@nestrealty.com', subject: 'Ready' })).toMatchObject({ smtpAccepted: false, held: true });
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
  it('does not fabricate SMTP acceptance in test mode', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    expect(await sendEmail({ to: 'agent@nestrealty.com', subject: 'Ready' })).toMatchObject({ smtpAccepted: false, suppressed: true });
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
  it('sends factual completion copy without stock property imagery or unsupported print/compliance claims', async () => {
    const result = await sendTaskCompletionEmail({ toEmail: 'agent@nestrealty.com', agentName: 'Agent', propertyAddress: '123 Main St', taskTitle: 'Listing graphics', proofUrl: 'https://nest.example/api/marketing/assets/download/token', trackerUrl: 'https://nest.example/track/marketing/portal' });
    expect(result.smtpAccepted).toBe(true);
    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail.html).not.toMatch(/1916_wolcott|300 DPI|NCREC Compliant|has been Delivered/i);
    expect(mail.text).toContain('https://nest.example/track/marketing/portal');
    expect(mail.text).toContain('approved by Melissa');
  });
  it('creates HTTPS public URLs and rejects unsafe protocols/hosts', () => {
    vi.stubEnv('PUBLIC_APP_URL', 'https://nest.example');
    expect(toAbsolutePublicUrl('/api/marketing/assets/download/token')).toBe('https://nest.example/api/marketing/assets/download/token');
    for (const url of ['//attacker.example/a', 'data:text/plain,a', 'javascript:alert(1)', 'http://localhost/a', 'https://localhost/a', 'https://user:pass@example.com/a']) expect(toAbsolutePublicUrl(url)).toBe('');
  });
});
