# Spec: first slice, no model, manual controls

**Goal:** prove the data pipeline end to end with plain code and manual controls, before any Discord or model work.

**Flow:** GSI payload (real CS2 or replayed fixture) → HTTP receiver → parse and validate → state store → query handlers → answer.

**Scope**

- `src/gsi/server.ts`: HTTP receiver on `GSI_PORT`. Rejects wrong auth token (401) and malformed JSON or schema failures (400); logs both, never the token.
- `src/state/store.ts`: keeps the latest valid payload plus a short history (ring buffer) and the time received.
- `src/queries/`: pure functions over state, no I/O: `bomb` (who carries it, planted or not), `economy` (own money and equip value), `round` (map, round number, phase, score).
- Manual controls (CLI scripts, all local):
  - `npm run replay -- <fixture>`: POST a fixture to the receiver.
  - `npm run ask -- <bomb|economy|round>`: print the answer from the running receiver (`GET /query/<name>` on localhost only).
  - `npm run state`: print current state summary.
- Answers are plain text built from templates. No model.

**Out of scope:** Discord, voice, any model, minimap, multiple players (team merge comes after one-player works), cloud hosting.

**Acceptance**

- Each fixture replays and returns the expected answer for all three queries (tests).
- Wrong token returns 401; garbage body returns 400; neither crashes the server (tests).
- A query before any payload returns "no data yet", not an error.
- Stale data (older than a set threshold) is labeled stale in the answer.
- `npm run check` passes; CI green.

**Open questions (park in `docs/later.md` if not blocking):** exact stale threshold (start at 10 s); real recorded payloads to replace the hand-written fixtures.

**Integrity check:** reads only data CS2 gives the local player. No input is sent to the game.
