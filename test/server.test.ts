import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { pino } from 'pino';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createGsiServer } from '../src/gsi/server.js';
import { StateStore } from '../src/state/store.js';

const TOKEN = 'test-token-123';
let clock = 1_000_000;
let base = '';
let close: () => Promise<void>;

function fixture(name: string): Record<string, unknown> {
  const raw = readFileSync(
    new URL(`../fixtures/gsi/${name}.json`, import.meta.url),
    'utf8',
  );
  return { ...(JSON.parse(raw) as object), auth: { token: TOKEN } };
}

const post = (body: unknown | string) =>
  fetch(`${base}/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const ask = async (name: string): Promise<string> =>
  (await fetch(`${base}/query/${name}`)).text();

beforeEach(async () => {
  clock = 1_000_000;
  const server = createGsiServer({
    authToken: TOKEN,
    store: new StateStore(),
    logger: pino({ level: 'silent' }),
    now: () => clock,
    staleAfterMs: 10_000,
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => new Promise<void>((r) => server.close(() => r()));
});

afterEach(async () => {
  await close();
});

describe('receiver', () => {
  it('rejects a wrong token with 401', async () => {
    const body = { ...fixture('live-bomb-carrier'), auth: { token: 'nope' } };
    expect((await post(body)).status).toBe(401);
  });

  it('rejects a missing token with 401', async () => {
    const noAuth = fixture('live-bomb-carrier');
    delete noAuth['auth'];
    expect((await post(noAuth)).status).toBe(401);
  });

  it('rejects garbage with 400 and keeps serving', async () => {
    expect((await post('not json {')).status).toBe(400);
    expect(
      (await post({ auth: { token: TOKEN }, provider: { name: 'x' } })).status,
    ).toBe(400);
    expect((await post(fixture('live-bomb-carrier'))).status).toBe(200);
  });

  it('says no data yet before any payload', async () => {
    expect(await ask('bomb')).toBe('No data yet.');
  });

  it('returns 404 for an unknown query', async () => {
    expect((await fetch(`${base}/query/constructor`)).status).toBe(404);
  });
});

describe('queries over fixtures', () => {
  it('answers bomb for each fixture', async () => {
    await post(fixture('live-bomb-carrier'));
    expect(await ask('bomb')).toBe('You are carrying the bomb.');

    await post(fixture('freezetime-no-bomb'));
    expect(await ask('bomb')).toContain('not carrying');

    await post(fixture('bomb-planted'));
    expect(await ask('bomb')).toBe('The bomb is planted.');

    await post(fixture('menu-minimal'));
    expect(await ask('bomb')).toBe('No round in progress.');
  });

  it('answers economy and round', async () => {
    await post(fixture('live-bomb-carrier'));
    expect(await ask('economy')).toBe('Money $1200, equipment value $3700.');
    expect(await ask('round')).toBe('de_mirage, round 7 (live). CT 4 - T 3.');
  });

  it('handles a menu payload without crashing', async () => {
    await post(fixture('menu-minimal'));
    expect(await ask('economy')).toBe('No player data.');
    expect(await ask('round')).toBe('No map data.');
  });

  it('labels stale data', async () => {
    await post(fixture('live-bomb-carrier'));
    clock += 30_000;
    expect(await ask('bomb')).toBe(
      'You are carrying the bomb. (stale: last update 30s ago)',
    );
  });
});
