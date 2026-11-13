import { answer, QUERIES } from '../queries/index.js';
import type { StateStore } from '../state/store.js';

const DESCRIPTIONS: Record<string, string> = {
  bomb: 'Who has the bomb, or is it planted?',
  economy: 'Your money and equipment value',
  round: 'Map, round number, phase and score',
};

/** Slash command definitions, one per query. */
export function commandDefinitions(): { name: string; description: string }[] {
  return Object.keys(QUERIES).map((name) => ({
    name,
    description: DESCRIPTIONS[name] ?? name,
  }));
}

/** Pure reply logic, separate from discord.js so it can be tested without a network. */
export function respond(
  commandName: string,
  store: StateStore,
  now: number,
  staleAfterMs = 10_000,
): string {
  return answer(commandName, { snapshot: store.latest(), now, staleAfterMs });
}
