import type { Logger } from 'pino';

/** Logs uncaught errors and unhandled rejections, then exits so a supervisor can restart us. */
export function installProcessHandlers(
  logger: Logger,
  exit: (code: number) => void = process.exit,
): void {
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaught exception');
    exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'unhandled rejection');
    exit(1);
  });
}
