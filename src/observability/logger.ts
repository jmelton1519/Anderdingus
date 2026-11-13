import { pino, type DestinationStream, type Logger } from 'pino';

/** Keys whose values must never reach a log line. */
export const REDACT_PATHS = [
  'token',
  'auth.token',
  '*.token',
  '*.auth.token',
  'DISCORD_TOKEN',
  'GSI_AUTH_TOKEN',
  '*.DISCORD_TOKEN',
  '*.GSI_AUTH_TOKEN',
];

export function createLogger(
  opts: { level?: string; destination?: DestinationStream } = {},
): Logger {
  return pino(
    {
      level: opts.level ?? 'info',
      redact: { paths: REDACT_PATHS, censor: '[redacted]' },
    },
    opts.destination,
  );
}
