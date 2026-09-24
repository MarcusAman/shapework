import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { selectListenHost } from './listenHost.js';

const SERVER_TS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../server.ts');

describe('selectListenHost', () => {
  it('defaults to loopback', () => {
    expect(selectListenHost({})).toBe('127.0.0.1');
    expect(selectListenHost({ HOST: '   ', APP_MODE: 'development' })).toBe('127.0.0.1');
    expect(selectListenHost({ APP_MODE: '' })).toBe('127.0.0.1');
  });

  it('listens on every interface only when APP_MODE is production', () => {
    expect(selectListenHost({ APP_MODE: 'production' })).toBe('0.0.0.0');
    expect(selectListenHost({ APP_MODE: 'Production' })).toBe('127.0.0.1');
  });

  it('uses an explicit HOST ahead of the production default', () => {
    expect(selectListenHost({ HOST: '10.0.0.8' })).toBe('10.0.0.8');
    expect(selectListenHost({ HOST: ' 0.0.0.0 ', APP_MODE: 'production' })).toBe('0.0.0.0');
    expect(selectListenHost({ HOST: '192.168.1.9', APP_MODE: 'production' })).toBe('192.168.1.9');
  });

  it('does not treat NODE_ENV as a bind-address switch', () => {
    expect(selectListenHost({ NODE_ENV: 'production' })).toBe('127.0.0.1');
    expect(selectListenHost({ NODE_ENV: 'production', APP_MODE: 'development' })).toBe('127.0.0.1');
  });

  it('wires server.ts through selectListenHost', () => {
    const source = fs.readFileSync(SERVER_TS, 'utf8');
    expect(source).toContain('selectListenHost(process.env)');
    expect(source).not.toMatch(/app\.listen\(\s*Number\(PORT\)\s*,\s*['"]0\.0\.0\.0['"]/);
  });
});
