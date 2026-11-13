# Discord bot setup

You do these steps in the Discord web UI. Never paste the bot token into chat, an issue or a PR.

1. Go to https://discord.com/developers/applications and choose New Application. Name it, accept the terms.
2. **Application ID:** on the General Information page, copy the Application ID. This is `DISCORD_CLIENT_ID`.
3. **Bot token:** open the Bot page and choose Reset Token. Copy it once. This is `DISCORD_TOKEN`. Leave all Privileged Gateway Intents off.
4. **Invite:** open OAuth2, URL Generator. Tick scopes `bot` and `applications.commands`. Under bot permissions tick Send Messages. Open the generated URL and add the bot to your test server.
5. **Server ID:** in Discord, Settings, Advanced, turn on Developer Mode. Right-click your server's icon and choose Copy Server ID. This is `DISCORD_GUILD_ID`.
6. Put the three values in `.env` (git-ignored), then run `npm.cmd start`. The log should say "discord bot ready".
7. In your server, type `/bomb`, `/economy` or `/round`.

If you ever leak the token, reset it on the Bot page.

To relay CS2 console output to a channel, see `console-relay.md`.
