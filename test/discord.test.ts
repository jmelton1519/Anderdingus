import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { commandDefinitions, respond } from '../src/discord/commands.js';
import { parseGsi } from '../src/gsi/parse.js';
import { StateStore } from '../src/state/store.js';

function storeWith(fixture: string, receivedAt: number): StateStore {
  const raw: unknown = JSON.parse(
    readFileSync(
      new URL(`../fixtures/gsi/${fixture}.json`, import.meta.url),
      'utf8',
    ),
  );
  const parsed = parseGsi(raw);
  if (!parsed.ok) throw new Error('fixture did not parse');
  const store = new StateStore();
  store.update(parsed.payload, receivedAt);
  return store;
}

describe('discord commands', () => {
  it('defines one command per query', () => {
    expect(commandDefinitions().map((c) => c.name)).toEqual([
      'bomb',
      'economy',
      'round',
    ]);
    for (const c of commandDefinitions()) {
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.description.length).toBeLessThanOrEqual(100);
    }
  });

  it('replies from state', () => {
    const store = storeWith('real-bomb-planted', 1000);
    expect(respond('bomb', store, 1000)).toBe('The bomb is planted.');
  });

  it('says no data yet on an empty store', () => {
    expect(respond('round', new StateStore(), 0)).toBe('No data yet.');
  });

  it('labels stale replies', () => {
    const store = storeWith('real-bomb-planted', 0);
    expect(respond('bomb', store, 60_000)).toContain('stale');
  });
});

describe('discord config', () => {
  const base = { GSI_AUTH_TOKEN: 'longenough' };

  it('allows running with no Discord values', () => {
    expect(() => loadConfig(base)).not.toThrow();
  });

  it('requires all three Discord values together, naming only keys', () => {
    expect(() => loadConfig({ ...base, DISCORD_TOKEN: 'tok-secret' })).toThrow(
      /DISCORD_CLIENT_ID, DISCORD_GUILD_ID/,
    );
    expect(() =>
      loadConfig({ ...base, DISCORD_TOKEN: 'tok-secret' }),
    ).not.toThrow(/tok-secret/);
  });

  it('accepts a complete Discord set', () => {
    const c = loadConfig({
      ...base,
      DISCORD_TOKEN: 't',
      DISCORD_CLIENT_ID: '1',
      DISCORD_GUILD_ID: '2',
    });
    expect(c.DISCORD_GUILD_ID).toBe('2');
  });
});
