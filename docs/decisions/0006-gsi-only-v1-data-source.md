# ADR 0006: GSI as the v1 game-state source

Status: accepted

Game state in v1 comes from GSI only. A lightweight companion app on each player's PC receives GSI JSON from CS2 and streams it to the bot. GSI gives mostly the local player's own state plus map, round and bomb info; spotted-enemy minimap data is not in it for normal players, so team features need every friend running the companion. The CS2 console relay (ADR 0012) sits beside GSI as a read-only text feed; it does not replace GSI as the source of structured state.
