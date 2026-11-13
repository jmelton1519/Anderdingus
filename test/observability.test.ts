import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../src/observability/logger.js';
import { UsageTracker } from '../src/observability/usage.js';

function capture(): { lines: () => string[]; stream: Writable } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(String(chunk));
      cb();
    },
  });
  return { lines: () => chunks, stream };
}

describe('logger', () => {
  it('redacts secret fields', () => {
    const { lines, stream } = capture();
    const log = createLogger({ destination: stream });
    log.info(
      { auth: { token: 'super-secret' }, DISCORD_TOKEN: 'abc123' },
      'hello',
    );
    const out = lines().join('');
    expect(out).not.toContain('super-secret');
    expect(out).not.toContain('abc123');
    expect(out).toContain('[redacted]');
  });
});

describe('UsageTracker', () => {
  it('summarizes calls, tokens and latency', () => {
    const t = new UsageTracker();
    t.record({
      model: 'local-8b',
      inputTokens: 100,
      outputTokens: 20,
      latencyMs: 300,
    });
    t.record({
      model: 'local-8b',
      inputTokens: 50,
      outputTokens: 10,
      latencyMs: 100,
    });
    const s = t.summary();
    expect(s.calls).toBe(2);
    expect(s.inputTokens).toBe(150);
    expect(s.avgLatencyMs).toBe(200);
    expect(s.byModel['local-8b']).toBe(2);
    expect(s.costUsd).toBe(0);
  });

  it('flags budget overrun', () => {
    const t = new UsageTracker();
    t.record({
      model: 'paid',
      inputTokens: 1,
      outputTokens: 1,
      latencyMs: 1,
      costUsd: 2,
    });
    expect(t.overBudget(1)).toBe(true);
    expect(t.overBudget(5)).toBe(false);
  });
});
