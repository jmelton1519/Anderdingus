import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Logger } from 'pino';

function get(raw: unknown, ...path: string[]): unknown {
  let cur: unknown = raw;
  for (const key of path) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/** A coarse "shape" key so we save one example per distinct game state, not every tick. */
function shapeKey(raw: unknown): string {
  const weapons = get(raw, 'player', 'weapons');
  const hasC4 =
    typeof weapons === 'object' &&
    weapons !== null &&
    Object.values(weapons).some((w) => get(w, 'name') === 'weapon_c4');
  return JSON.stringify([
    get(raw, 'map', 'phase') ?? null,
    get(raw, 'round', 'phase') ?? null,
    get(raw, 'round', 'bomb') ?? null,
    get(raw, 'player', 'activity') ?? null,
    hasC4,
    Object.keys((raw as object) ?? {}).sort(),
  ]);
}

/**
 * Saves one raw payload per distinct game state to `dir`, with the auth token removed.
 * Files contain real Steam IDs and names: review before committing anything as a fixture.
 */
export function createRecorder(
  dir: string,
  logger: Logger,
  maxFiles = 100,
): (raw: unknown) => void {
  mkdirSync(dir, { recursive: true });
  const seen = new Set<string>();
  return (raw) => {
    if (typeof raw !== 'object' || raw === null || seen.size >= maxFiles)
      return;
    const key = shapeKey(raw);
    if (seen.has(key)) return;
    seen.add(key);
    const clean = { ...(raw as Record<string, unknown>) };
    delete clean['auth'];
    const name = `payload-${String(seen.size).padStart(3, '0')}.json`;
    writeFileSync(join(dir, name), JSON.stringify(clean, null, 2) + '\n');
    logger.info({ file: name }, 'recorded new GSI payload shape');
  };
}
