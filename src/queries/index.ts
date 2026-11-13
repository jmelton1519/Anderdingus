import type { GsiPayload } from '../gsi/schema.js';
import { hasBomb } from '../gsi/parse.js';
import type { Snapshot } from '../state/store.js';

export interface QueryContext {
  snapshot: Snapshot | null;
  now: number;
  staleAfterMs: number;
}

type Handler = (payload: GsiPayload) => string;

const bomb: Handler = (p) => {
  switch (p.round?.bomb) {
    case 'planted':
      return 'The bomb is planted.';
    case 'exploded':
      return 'The bomb exploded.';
    case 'defused':
      return 'The bomb was defused.';
  }
  if (!p.player && !p.round) return 'No round in progress.';
  if (hasBomb(p)) return 'You are carrying the bomb.';
  return 'You are not carrying the bomb. GSI only shows your own inventory, so a teammate may have it.';
};

const economy: Handler = (p) => {
  const s = p.player?.state;
  if (!s) return 'No player data.';
  const equip =
    s.equip_value === undefined ? '' : `, equipment value $${s.equip_value}`;
  return `Money $${s.money}${equip}.`;
};

const round: Handler = (p) => {
  if (!p.map) return 'No map data.';
  const phase = p.round?.phase ?? p.map.phase;
  return `${p.map.name}, round ${p.map.round} (${phase}). CT ${p.map.team_ct.score} - T ${p.map.team_t.score}.`;
};

export const QUERIES: Record<string, Handler> = { bomb, economy, round };

export function isQueryName(name: string): boolean {
  return Object.hasOwn(QUERIES, name);
}

/** Answers a query from the latest snapshot. Pure: no I/O. */
export function answer(name: string, ctx: QueryContext): string {
  const handler = isQueryName(name) ? QUERIES[name] : undefined;
  if (!handler) return `Unknown query: ${name}`;
  if (!ctx.snapshot) return 'No data yet.';
  const text = handler(ctx.snapshot.payload);
  const ageMs = ctx.now - ctx.snapshot.receivedAt;
  if (ageMs > ctx.staleAfterMs) {
    return `${text} (stale: last update ${Math.round(ageMs / 1000)}s ago)`;
  }
  return text;
}
