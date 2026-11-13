# ADR 0012: Relay CS2 console output to Discord

Status: accepted

Players want what CS2 prints to its console (damage reports, kill feed, chat, connect and error messages) in Discord, which GSI does not carry. We tail the file CS2 writes when launched with `-condebug` (`game/csgo/console.log`), batch new lines every 2 seconds into code blocks under Discord's 2000-character limit (40 lines per batch at most, extra lines counted and skipped) and post them to one configured text channel with mentions disabled. An optional regex filter limits what gets relayed. We rejected `-netconport` (the TCP remote console) because it accepts commands as well as output, which breaks the read-only rule in ADR 0010. Consequences: it works only on the PC running CS2 and the bot; console lines contain player names, so they are never written to our logs; it reads only what the player already sees in their own console.
