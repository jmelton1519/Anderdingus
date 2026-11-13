# ADR 0004: CS2 first, behind a game-adapter layer

Status: accepted

Counter-Strike 2 is the first game because its official Game State Integration (GSI) is a safe, documented data feed. Only the game adapter knows a game's raw data; it maps that data to normalized state, so other games (e.g. League of Legends via its local Live Client Data API) can plug in later without touching queries or responders. Any new game's data-source claims are verified against real payloads before we build on them.
