import { Client, Events, GatewayIntentBits } from 'discord.js';
import type { Logger } from 'pino';
import { isQueryName } from '../queries/index.js';
import type { StateStore } from '../state/store.js';
import { commandDefinitions, respond } from './commands.js';

export interface BotOptions {
  token: string;
  clientId: string;
  guildId: string;
  store: StateStore;
  logger: Logger;
}

/** Starts the bot with slash commands registered to one server (instant, no global rollout). */
export async function startBot(opts: BotOptions): Promise<Client> {
  const { token, clientId, guildId, store, logger } = opts;
  // Slash commands need no privileged intents.
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, async (c) => {
    // Register after login; clientId must match the logged-in application.
    if (c.application.id !== clientId) {
      logger.error('DISCORD_CLIENT_ID does not match the bot token');
      return;
    }
    await c.application.commands.set(commandDefinitions(), guildId);
    logger.info({ user: c.user.tag }, 'discord bot ready');
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const name = interaction.commandName;
    if (!isQueryName(name)) {
      await interaction.reply({
        content: `Unknown command: ${name}`,
        ephemeral: true,
      });
      return;
    }
    const now = Date.now();
    const latest = store.latest();
    // Command and data age only: no user names or IDs in logs.
    logger.info(
      { command: name, dataAgeMs: latest ? now - latest.receivedAt : null },
      'slash command',
    );
    try {
      await interaction.reply(respond(name, store, now));
    } catch (err) {
      logger.error({ err, command: name }, 'slash command reply failed');
    }
  });

  client.on(Events.Error, (err) =>
    logger.error({ err }, 'discord client error'),
  );
  await client.login(token);
  return client;
}
