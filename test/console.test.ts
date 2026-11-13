import { appendFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import {
  createRelay,
  DISCORD_MAX,
  formatMessages,
} from '../src/console/relay.js';
import { tailFile } from '../src/console/tail.js';

function tempLog(initial = ''): string {
  const path = join(mkdtempSync(join(tmpdir(), 'anderdingus-')), 'console.log');
  writeFileSync(path, initial);
  return path;
}

describe('console tail', () => {
  it('skips existing history and emits only new complete lines', async () => {
    const path = tempLog('old line\n');
    const got: string[] = [];
    const tail = tailFile({ path, onLines: (l) => got.push(...l) });
    await tail.poll();
    appendFileSync(path, 'Damage Given to "Bot" - 27 in 1 hit\r\nhalf');
    await tail.poll();
    expect(got).toEqual(['Damage Given to "Bot" - 27 in 1 hit']);
    appendFileSync(path, ' done\n');
    await tail.poll();
    expect(got).toEqual(['Damage Given to "Bot" - 27 in 1 hit', 'half done']);
    tail.stop();
  });

  it('restarts from the top when the file is truncated', async () => {
    const path = tempLog('a long first session line\n');
    const got: string[] = [];
    const tail = tailFile({ path, onLines: (l) => got.push(...l) });
    await tail.poll();
    writeFileSync(path, 'new\n');
    await tail.poll();
    expect(got).toEqual(['new']);
    tail.stop();
  });

  it('waits quietly for a file that does not exist yet', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'anderdingus-')), 'none.log');
    const errors: unknown[] = [];
    const tail = tailFile({
      path,
      onLines: () => {},
      onError: (e) => errors.push(e),
    });
    await tail.poll();
    expect(errors).toEqual([]);
    tail.stop();
  });
});

describe('console relay formatting', () => {
  it('wraps lines in a code block and neutralises backticks', () => {
    expect(formatMessages(['a', 'b```c'])).toEqual(["```text\na\nb'''c\n```"]);
  });

  it('splits into messages under the Discord limit', () => {
    const lines = Array.from({ length: 100 }, () => 'x'.repeat(100));
    const msgs = formatMessages(lines);
    expect(msgs.length).toBeGreaterThan(1);
    for (const m of msgs) expect(m.length).toBeLessThanOrEqual(DISCORD_MAX);
    expect(msgs.join('').match(/x{100}/g)).toHaveLength(100);
  });

  it('notes skipped lines', () => {
    expect(formatMessages(['a'], 5)[0]).toContain('5 more lines skipped');
  });
});

describe('console relay', () => {
  it('filters, caps and sends batches in order', async () => {
    const sent: string[] = [];
    const relay = createRelay({
      send: async (m) => {
        sent.push(m);
      },
      filter: /Damage/,
      maxLinesPerFlush: 2,
    });
    relay.push(['noise', 'Damage 1', 'Damage 2', 'Damage 3']);
    await relay.stop();
    expect(sent).toEqual([
      '```text\nDamage 1\nDamage 2\n... 1 more lines skipped\n```',
    ]);
  });

  it('keeps going after a failed send', async () => {
    const errors: unknown[] = [];
    let calls = 0;
    const relay = createRelay({
      send: async () => {
        calls++;
        throw new Error('rate limited');
      },
      onError: (e) => errors.push(e),
    });
    relay.push(['a']);
    await relay.flush();
    relay.push(['b']);
    await relay.stop();
    expect(calls).toBe(2);
    expect(errors).toHaveLength(2);
  });
});

describe('console relay config', () => {
  const discord = {
    GSI_AUTH_TOKEN: 'longenough',
    DISCORD_TOKEN: 't',
    DISCORD_CLIENT_ID: '1',
    DISCORD_GUILD_ID: '2',
  };

  it('accepts a full relay config', () => {
    const c = loadConfig({
      ...discord,
      CS2_CONSOLE_LOG: 'C:\\cs2\\console.log',
      DISCORD_CONSOLE_CHANNEL_ID: '123',
      CONSOLE_FILTER: 'Damage|killed',
    });
    expect(c.DISCORD_CONSOLE_CHANNEL_ID).toBe('123');
  });

  it('requires the log path, channel and Discord together', () => {
    expect(() => loadConfig({ ...discord, CS2_CONSOLE_LOG: 'x' })).toThrow(
      /DISCORD_CONSOLE_CHANNEL_ID/,
    );
    expect(() =>
      loadConfig({
        GSI_AUTH_TOKEN: 'longenough',
        CS2_CONSOLE_LOG: 'x',
        DISCORD_CONSOLE_CHANNEL_ID: '1',
      }),
    ).toThrow(/DISCORD_TOKEN/);
  });

  it('rejects an invalid filter regex', () => {
    expect(() => loadConfig({ ...discord, CONSOLE_FILTER: '(' })).toThrow(
      /CONSOLE_FILTER/,
    );
  });
});
