import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hasBomb, parseGsi } from '../src/gsi/parse.js';
import { answer, QUERIES } from '../src/queries/index.js';

const dir = new URL('../fixtures/gsi/', import.meta.url);
const realFiles = readdirSync(dir).filter(
  (f) => f.startsWith('real-') && f.endsWith('.json'),
);
const load = (f: string): unknown =>
  JSON.parse(readFileSync(new URL(f, dir), 'utf8'));

describe('recorded CS2 payloads (sanitized)', () => {
  it('has recorded fixtures', () => {
    expect(realFiles.length).toBeGreaterThan(0);
  });

  it.each(realFiles)('%s parses and every query answers', (f) => {
    const parsed = parseGsi(load(f));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const snapshot = { payload: parsed.payload, receivedAt: 0 };
    for (const name of Object.keys(QUERIES)) {
      const text = answer(name, { snapshot, now: 0, staleAfterMs: 10_000 });
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toContain('undefined');
    }
  });

  it('reports planted and defused bombs from real payloads', () => {
    const answerFor = (f: string): string => {
      const parsed = parseGsi(load(f));
      if (!parsed.ok) throw new Error(`${f} did not parse`);
      return answer('bomb', {
        snapshot: { payload: parsed.payload, receivedAt: 0 },
        now: 0,
        staleAfterMs: 10_000,
      });
    };
    expect(answerFor('real-bomb-planted.json')).toBe('The bomb is planted.');
    expect(answerFor('real-bomb-defused.json')).toBe('The bomb was defused.');
  });

  it('detects the bomb in the real C4 payload', () => {
    const parsed = parseGsi(load('real-freezetime-c4.json'));
    expect(parsed.ok && hasBomb(parsed.payload)).toBe(true);
  });
});
