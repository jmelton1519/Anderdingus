# CS2 console relay

Posts what CS2 prints to its developer console into a Discord text channel. Read-only: the bot never sends commands to the game (ADR 0012).

1. **Launch option:** in Steam, right-click Counter-Strike 2, Properties, General, Launch Options, add `-condebug`. CS2 then writes its console to `...\steamapps\common\Counter-Strike Global Offensive\game\csgo\console.log`.
2. **Channel ID:** with Developer Mode on (see `discord-setup.md`), right-click the text channel and choose Copy Channel ID. The bot needs View Channel and Send Messages there.
3. **`.env`:** set `CS2_CONSOLE_LOG` to the full path of `console.log` and `DISCORD_CONSOLE_CHANNEL_ID` to the channel ID. The three `DISCORD_*` bot values must also be set.
4. **Optional filter:** `CONSOLE_FILTER` is a regex; only matching lines are relayed, e.g. `Damage|killed|\[ALL\]` for damage reports, kills and all-chat.
5. `npm.cmd start`. The log should say "console relay started". New console lines show up in the channel within about 2 seconds.

Notes: only lines written after the bot starts are relayed. If CS2 restarts and truncates the file, the relay starts again from the top. Bursts are capped at 40 lines per 2 seconds; extra lines are counted and skipped. Line contents are never written to the bot's own logs.
