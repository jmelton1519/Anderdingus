import type { Client } from 'discord.js';
import type { Logger } from 'pino';
import { createRelay } from './relay.js';
import { tailFile } from './tail.js';

export interface ConsoleRelayOptions {
  client: Client;
  channelId: string;
  logPath: string;
  filter?: RegExp;
  logger: Logger;
}

/** Tails CS2's console.log and posts new lines to one Discord text channel. Read-only. */
export async function startConsoleRelay(
  opts: ConsoleRelayOptions,
): Promise<() => Promise<void>> {
  const { client, channelId, logPath, filter, logger } = opts;
  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isSendable()) {
    throw new Error(
      'DISCORD_CONSOLE_CHANNEL_ID is not a text channel the bot can post in',
    );
  }
  const relay = createRelay({
    send: async (msg) => {
      await channel.send({ content: msg, allowedMentions: { parse: [] } });
    },
    ...(filter ? { filter } : {}),
    onError: (err) => logger.error({ err }, 'console relay send failed'),
  });
  const tail = tailFile({
    path: logPath,
    // Counts only: console lines contain player names, so they stay out of logs.
    onLines: (lines) => {
      logger.debug({ lines: lines.length }, 'console lines read');
      relay.push(lines);
    },
    onError: (err) => logger.error({ err }, 'console tail failed'),
  });
  logger.info('console relay started');
  return async () => {
    tail.stop();
    await relay.stop();
  };
}
