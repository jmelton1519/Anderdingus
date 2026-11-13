import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hasBomb, parseGsi } from '../src/gsi/parse.js';

const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(
      new URL(`../fixtures/gsi/${name}.json`, import.meta.url),
      'utf8',
    ),
  );

describe('GSI parsing', () => {
  it('parses every fixture', () => {
    const files = readdirSync(
      new URL('../fixtures/gsi/', import.meta.url),
    ).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      expect(parseGsi(load(f.replace('.json', ''))).ok, f).toBe(true);
    }
  });

  it('detects the bomb carrier', () => {
    const carrier = parseGsi(load('live-bomb-carrier'));
    const other = parseGsi(load('freezetime-no-bomb'));
    expect(carrier.ok && hasBomb(carrier.payload)).toBe(true);
    expect(other.ok && hasBomb(other.payload)).toBe(false);
  });

  it('reads planted bomb state', () => {
    const r = parseGsi(load('bomb-planted'));
    expect(r.ok && r.payload.round?.bomb).toBe('planted');
  });

  it('rejects malformed payloads with a readable error', () => {
    const r = parseGsi({ provider: { name: 'x' } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('provider');
  });
});
