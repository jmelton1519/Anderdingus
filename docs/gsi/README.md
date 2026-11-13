# CS2 Game State Integration

Install: copy `gamestate_integration_anderdingus.cfg` to `<CS2>/game/csgo/cfg/`, set the auth token to match `GSI_AUTH_TOKEN`, restart CS2. CS2 then POSTs JSON to the URI.

Normal players get their own player state, weapons, match stats, map, round phase and bomb status. Enemy positions are not available.

Schema: `src/gsi/schema.ts`. Samples: `fixtures/gsi/` (hand-authored, not recorded; replace with real payloads from the companion app). The field list is from memory of the documented format, so verify it against a real payload.
