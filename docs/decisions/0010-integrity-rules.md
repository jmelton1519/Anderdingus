# ADR 0010: Integrity rules

Status: accepted

The bot only uses information a player could legitimately see or that teammates share, and never sends input to the game: no automated aim, movement or console commands, ever. Every event source is read-only. Live-assist features need a per-game and per-platform rules check (Valve, FACEIT/ESL, etc.) before any public or tournament use. Modes stay separate: live team comms, practice, post-match review. Checklist: `docs/doctrine/integrity.md`.
