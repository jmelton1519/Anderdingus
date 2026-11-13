import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pino } from 'pino';
import { describe, expect, it } from 'vitest';
import { createRecorder } from '../src/gsi/recorder.js';

const logger = pino({ level: 'silent' });
const base = {
  auth: { token: 'secret-token' },
  provider: { name: 'CS2', appid: 730, timestamp: 1 },
};

describe('recorder', () => {
  it('saves one file per distinct state and strips the token', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gsi-rec-'));
    const record = createRecorder(dir, logger);
    const freeze = { ...base, round: { phase: 'freezetime' } };
    const live = { ...base, round: { phase: 'live' } };
    record(freeze);
    record(freeze);
    record(live);
    const files = readdirSync(dir).sort();
    expect(files).toEqual(['payload-001.json', 'payload-002.json']);
    const text = readFileSync(join(dir, files[0] ?? ''), 'utf8');
    expect(text).not.toContain('secret-token');
    expect(text).toContain('freezetime');
  });

  it('stops after the file cap', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gsi-rec-'));
    const record = createRecorder(dir, logger, 1);
    record({ ...base, round: { phase: 'freezetime' } });
    record({ ...base, round: { phase: 'live' } });
    expect(readdirSync(dir)).toHaveLength(1);
  });
});
