import { gsiPayload, type GsiPayload } from './schema.js';

export type ParseResult =
  { ok: true; payload: GsiPayload } | { ok: false; error: string };

export function parseGsi(raw: unknown): ParseResult {
  const result = gsiPayload.safeParse(raw);
  if (result.success) return { ok: true, payload: result.data };
  return {
    ok: false,
    error: result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; '),
  };
}

/** True if the local player holds the bomb (weapon_c4 in inventory). */
export function hasBomb(payload: GsiPayload): boolean {
  const weapons = payload.player?.weapons ?? {};
  return Object.values(weapons).some((w) => w.name === 'weapon_c4');
}
