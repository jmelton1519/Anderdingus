# CS2 Game State Integration

Install: copy `gamestate_integration_anderdingus.cfg` to `<CS2>/game/csgo/cfg/`, set the auth token to match `GSI_AUTH_TOKEN`, restart CS2. CS2 then POSTs JSON to the URI.

Normal players get their own player state, weapons, match stats, map, round phase and bomb status. Enemy positions are not available.

Schema: `src/gsi/schema.ts`. Samples: `fixtures/gsi/` (hand-authored, not recorded; replace with real payloads from the companion app). The field list is from memory of the documented format, so verify it against a real payload.

## Recording real payloads

1. Put `GSI_AUTH_TOKEN=<long random string>` and `GSI_RECORD_DIR=recordings` in `.env`.
2. Copy `gamestate_integration_anderdingus.cfg` into CS2's `game/csgo/cfg/` folder with the same token.
3. `npm start`, then play: warmup, freezetime, a live round, carry the bomb, plant, die, spectate.
4. One raw payload per distinct state lands in `recordings/` (git-ignored). The token is stripped, but Steam IDs and names remain: replace them with fake values before copying any file into `fixtures/gsi/`.
