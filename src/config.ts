import { z } from 'zod';

const schema = z
  .object({
    // The bot starts only if all three DISCORD_* values are set.
    DISCORD_TOKEN: z.string().min(1).optional(),
    DISCORD_CLIENT_ID: z.string().min(1).optional(),
    DISCORD_GUILD_ID: z.string().min(1).optional(),
    GSI_PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
    GSI_AUTH_TOKEN: z.string().min(8),
    // If set, save one raw payload per distinct game state here (for building fixtures).
    GSI_RECORD_DIR: z.string().min(1).optional(),
    // Console relay: path to CS2's console.log (launch CS2 with -condebug) and the channel to post to.
    CS2_CONSOLE_LOG: z.string().min(1).optional(),
    DISCORD_CONSOLE_CHANNEL_ID: z.string().regex(/^\d+$/).optional(),
    // Optional regex; only matching console lines are relayed.
    CONSOLE_FILTER: z
      .string()
      .min(1)
      .refine((v) => {
        try {
          new RegExp(v);
          return true;
        } catch {
          return false;
        }
      })
      .optional(),
    LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
      .default('info'),
  })
  .superRefine((c, ctx) => {
    const keys = [
      'DISCORD_TOKEN',
      'DISCORD_CLIENT_ID',
      'DISCORD_GUILD_ID',
    ] as const;
    if (keys.some((k) => c[k] !== undefined)) {
      for (const k of keys) {
        if (c[k] === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: [k],
            message: 'required with other DISCORD_* values',
          });
        }
      }
    }
    // The console relay needs both its values and a working Discord bot.
    const relay = ['CS2_CONSOLE_LOG', 'DISCORD_CONSOLE_CHANNEL_ID'] as const;
    if (relay.some((k) => c[k] !== undefined)) {
      for (const k of [...relay, ...keys]) {
        if (c[k] === undefined) {
          ctx.addIssue({
            code: 'custom',
            path: [k],
            message: 'required for the console relay',
          });
        }
      }
    }
  });

export type Config = z.infer<typeof schema>;

/** Reads config from environment variables. Throws with the names of bad keys, never their values. */
export function loadConfig(
  env: Record<string, string | undefined> = process.env,
): Config {
  // A blank line like `DISCORD_TOKEN=` in .env means "not set".
  const cleaned = Object.fromEntries(
    Object.entries(env).filter(([, v]) => v !== ''),
  );
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    const keys = [...new Set(result.error.issues.map((i) => i.path.join('.')))];
    throw new Error(
      `Invalid or missing environment variables: ${keys.join(', ')}`,
    );
  }
  return result.data;
}
