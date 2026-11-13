import { z } from 'zod';

// Every field except `provider` is optional: CS2 omits sections depending on
// game state (menu, warmup, spectating). Unknown fields are kept, not rejected.
const weapon = z.looseObject({
  name: z.string(),
  type: z.string().optional(),
  state: z.string().optional(),
  ammo_clip: z.number().optional(),
  ammo_reserve: z.number().optional(),
});

const playerState = z.looseObject({
  health: z.number(),
  armor: z.number(),
  helmet: z.boolean().optional(),
  money: z.number(),
  equip_value: z.number().optional(),
  round_kills: z.number().optional(),
  flashed: z.number().optional(),
  burning: z.number().optional(),
});

const player = z.looseObject({
  steamid: z.string(),
  name: z.string(),
  team: z.enum(['T', 'CT']).optional(),
  activity: z.string().optional(),
  state: playerState.optional(),
  weapons: z.record(z.string(), weapon).optional(),
  match_stats: z
    .looseObject({
      kills: z.number(),
      assists: z.number(),
      deaths: z.number(),
      mvps: z.number().optional(),
      score: z.number().optional(),
    })
    .optional(),
});

const teamInfo = z.looseObject({
  score: z.number(),
  consecutive_round_losses: z.number().optional(),
  timeouts_remaining: z.number().optional(),
});

export const gsiPayload = z.looseObject({
  provider: z.looseObject({
    name: z.string(),
    appid: z.number(),
    version: z.number().optional(),
    steamid: z.string().optional(),
    timestamp: z.number(),
  }),
  map: z
    .looseObject({
      mode: z.string().optional(),
      name: z.string(),
      phase: z.string(),
      round: z.number(),
      team_ct: teamInfo,
      team_t: teamInfo,
    })
    .optional(),
  round: z
    .looseObject({
      phase: z.enum(['freezetime', 'live', 'over']),
      bomb: z.enum(['planted', 'exploded', 'defused']).optional(),
      win_team: z.enum(['T', 'CT']).optional(),
    })
    .optional(),
  player: player.optional(),
  phase_countdowns: z
    .looseObject({ phase: z.string(), phase_ends_in: z.string() })
    .optional(),
  auth: z.looseObject({ token: z.string() }).optional(),
});

export type GsiPayload = z.infer<typeof gsiPayload>;
