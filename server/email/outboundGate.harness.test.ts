/**
 * Outbound kill/hold harness.
 * The gate is the only policy. APP_MODE must not widen who can receive mail.
 */
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { checkOutbound } from './outboundGate.js';

const ROOT = process.cwd();
const TRANSPORT = path.normalize('server/email/gatedTransport.ts');

const SEND_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: 'nodemailer sendMail', re: /\.sendMail\s*\(/ },
  { label: 'gmail messages.send', re: /\.messages\.send\s*\(/ },
  { label: 'gmail drafts.send', re: /\.drafts\.send\s*\(/ },
  { label: 'resend emails.send', re: /\.emails\.send\s*\(/ },
  { label: 'resend emails endpoint', re: /api\.resend\.com\/emails\b/ },
];

function walk(dir: string, out: string[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === 'coverage') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
}

describe('outbound transport structural gate', () => {
  it('allows nodemailer sendMail, gmail messages/drafts.send, and Resend emails.send only inside the gated transport', () => {
    const files: string[] = [];
    walk(ROOT, files);
    const offenders: string[] = [];
    for (const file of files) {
      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      if (rel === 'server/email/gatedTransport.ts') continue;
      if (rel === 'server/email/outboundGate.harness.test.ts') continue;
      const text = fs.readFileSync(file, 'utf8');
      for (const pattern of SEND_PATTERNS) {
        if (pattern.re.test(text)) offenders.push(`${rel} → ${pattern.label}`);
      }
    }
    expect(offenders, `raw sends outside ${TRANSPORT}`).toEqual([]);
  });
});

const ALLOWLISTED = ['marcus.aman@gmail.com', 'marcus@shapework.co'];
const NEST = 'matt.orr@nestrealty.com';
const RANDOM = 'qa.random@example.com';
const MODES = ['unset', 'disabled', 'hold', 'live'] as const;
const APP_MODES = ['development', 'production'] as const;
const RECIPIENTS = [
  { kind: 'allowlisted', email: 'marcus.aman@gmail.com' },
  { kind: 'allowlisted', email: 'marcus@shapework.co' },
  { kind: 'nestrealty', email: NEST },
  { kind: 'random', email: RANDOM },
] as const;

describe('checkOutbound mode × APP_MODE × recipient', () => {
  const prev = {
    master: process.env.OUTBOUND_MASTER_MODE,
    app: process.env.APP_MODE,
    allow: process.env.ALLOW_EXTERNAL_DISPATCH,
    disableWl: process.env.DISABLE_EMAIL_WHITELIST,
    node: process.env.NODE_ENV,
  };

  afterEach(() => {
    restore('OUTBOUND_MASTER_MODE', prev.master);
    restore('APP_MODE', prev.app);
    restore('ALLOW_EXTERNAL_DISPATCH', prev.allow);
    restore('DISABLE_EMAIL_WHITELIST', prev.disableWl);
    restore('NODE_ENV', prev.node);
  });

  function restore(name: string, value: string | undefined) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }

  it('never lets a Nest or random recipient through hold or a kill, in development or production', () => {
    for (const mode of MODES) {
      for (const appMode of APP_MODES) {
        for (const recipient of RECIPIENTS) {
          if (mode === 'unset') delete process.env.OUTBOUND_MASTER_MODE;
          else process.env.OUTBOUND_MASTER_MODE = mode;
          process.env.APP_MODE = appMode;
          delete process.env.ALLOW_EXTERNAL_DISPATCH;
          process.env.DISABLE_EMAIL_WHITELIST = 'true';

          const decision = checkOutbound({
            to: recipient.email,
            cc: ['melissa.gagliardi@nestrealty.com', 'marcus.aman@gmail.com'],
            bcc: [NEST],
            channel: 'email',
            source: 'harness',
          });

          const label = `${mode}/${appMode}/${recipient.kind}/${recipient.email}`;
          if (mode === 'unset' || mode === 'disabled') {
            expect(decision.allowed, label).toBe(false);
            expect(decision.effectiveTo, label).toEqual([]);
            expect(decision.effectiveCc, label).toEqual([]);
            expect(decision.reason, label).toBe('outbound_disabled');
          } else if (mode === 'hold') {
            expect(decision.allowed, label).toBe(false);
            if (recipient.kind === 'allowlisted') {
              expect(decision.reason, label).toBe('held');
              expect(decision.effectiveTo, label).toEqual([recipient.email]);
              expect(decision.effectiveCc, label).toEqual(['marcus.aman@gmail.com']);
              expect(decision.effectiveCc, label).not.toContain('melissa.gagliardi@nestrealty.com');
            } else {
              expect(decision.effectiveTo, label).toEqual([]);
              expect(decision.effectiveCc, label).toEqual([]);
              expect(decision.effectiveTo, label).not.toContain(NEST);
            }
          } else {
            expect(decision.allowed, label).toBe(true);
            expect(decision.reason, label).toBe('live');
            expect(decision.effectiveTo, label).toEqual([recipient.email]);
          }
        }
      }
    }
  });

  it('hold + production never lets matt.orr@nestrealty.com through, even if external dispatch is on', () => {
    process.env.OUTBOUND_MASTER_MODE = 'hold';
    process.env.APP_MODE = 'production';
    process.env.ALLOW_EXTERNAL_DISPATCH = 'true';
    process.env.DISABLE_EMAIL_WHITELIST = 'true';
    const decision = checkOutbound({
      to: NEST,
      cc: ['melissa.gagliardi@nestrealty.com'],
      bcc: [RANDOM],
      channel: 'email',
      source: 'harness',
    });
    expect(decision.allowed).toBe(false);
    expect(decision.effectiveTo).toEqual([]);
    expect(decision.effectiveCc).toEqual([]);
    expect(decision.effectiveTo.join(',')).not.toContain('nestrealty.com');
  });

  it('ALLOW_EXTERNAL_DISPATCH lets allowlisted hold mail skip the queue and does not add recipients', () => {
    process.env.OUTBOUND_MASTER_MODE = 'hold';
    process.env.APP_MODE = 'production';
    process.env.ALLOW_EXTERNAL_DISPATCH = 'true';
    const skipped = checkOutbound({
      to: ALLOWLISTED,
      cc: [NEST, 'marcus@shapework.co'],
      bcc: [RANDOM],
      channel: 'email',
      source: 'harness',
    });
    expect(skipped.allowed).toBe(true);
    expect(skipped.effectiveTo).toEqual(ALLOWLISTED);
    expect(skipped.effectiveCc).toEqual(['marcus@shapework.co']);
    expect(skipped.effectiveTo.join(' ')).not.toContain('nestrealty.com');
    expect(skipped.effectiveCc.join(' ')).not.toContain('nestrealty.com');

    process.env.ALLOW_EXTERNAL_DISPATCH = 'false';
    const queued = checkOutbound({
      to: 'marcus.aman@gmail.com',
      cc: [NEST],
      channel: 'email',
      source: 'harness',
    });
    expect(queued.allowed).toBe(false);
    expect(queued.reason).toBe('held');
    expect(queued.effectiveTo).toEqual(['marcus.aman@gmail.com']);
    expect(queued.effectiveCc).toEqual([]);
  });
});
