import { Events } from 'discord.js';
import { loadConfig } from './config.js';
import { startConsoleRelay } from './console/index.js';
import { startBot } from './discord/bot.js';
import { createRecorder } from './gsi/recorder.js';
import { createGsiServer } from './gsi/server.js';
import { createLogger } from './observability/logger.js';
import { installProcessHandlers } from './observability/errors.js';
import { StateStore } from './state/store.js';

try {
  process.loadEnvFile();
} catch {
  // No .env file: fall back to real environment variables.
}

const config = loadConfig();
const logger = createLogger({ level: config.LOG_LEVEL });
installProcessHandlers(logger);

const store = new StateStore();

if (
  config.DISCORD_TOKEN &&
  config.DISCORD_CLIENT_ID &&
  config.DISCORD_GUILD_ID
) {
  const client = await startBot({
    token: config.DISCORD_TOKEN,
    clientId: config.DISCORD_CLIENT_ID,
    guildId: config.DISCORD_GUILD_ID,
    store,
    logger,
  });
  if (config.CS2_CONSOLE_LOG && config.DISCORD_CONSOLE_CHANNEL_ID) {
    const logPath = config.CS2_CONSOLE_LOG;
    const channelId = config.DISCORD_CONSOLE_CHANNEL_ID;
    const filter = config.CONSOLE_FILTER
      ? new RegExp(config.CONSOLE_FILTER)
      : undefined;
    // Channels can only be fetched once the client is ready.
    const start = () =>
      startConsoleRelay({
        client,
        channelId,
        logPath,
        logger,
        ...(filter ? { filter } : {}),
      }).catch((err: unknown) =>
        logger.error({ err }, 'console relay failed to start'),
      );
    if (client.isReady()) void start();
    else client.once(Events.ClientReady, () => void start());
  }
} else {
  logger.info('Discord not configured; running receiver only');
}

const server = createGsiServer({
  authToken: config.GSI_AUTH_TOKEN,
  store,
  logger,
  ...(config.GSI_RECORD_DIR
    ? { onRawPayload: createRecorder(config.GSI_RECORD_DIR, logger) }
    : {}),
});

// Localhost only: the receiver and the manual query endpoints are not exposed to the network.
server.listen(config.GSI_PORT, '127.0.0.1', () => {
  logger.info({ port: config.GSI_PORT }, 'GSI receiver listening on 127.0.0.1');
});
