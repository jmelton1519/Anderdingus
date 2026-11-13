import { z } from 'zod';

const schema = z.object({
  // Not needed until the Discord wrapper exists.
  DISCORD_TOKEN: z.string().min(1).optional(),
  GSI_PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
  GSI_AUTH_TOKEN: z.string().min(8),
  // If set, save one raw payload per distinct game state here (for building fixtures).
  GSI_RECORD_DIR: z.string().min(1).optional(),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
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
