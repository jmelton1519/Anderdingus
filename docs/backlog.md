# Backlog

Ordered. Each item gets a short spec in `docs/specs/` before code.

1. First slice: receiver, state store, three queries, manual controls (`specs/first-slice.md`)
2. Record real GSI payloads with the companion app; replace hand-written fixtures; verify the schema
3. Multi-player: merge several players' payloads into team state (team economy, who has the bomb across the team)
4. Discord bot wrapper: slash commands calling the same query functions
5. Decide the model approach (rules only, local model, or paid API); update decision 7 and add an ADR
6. Callouts: round-by-round proactive messages
7. Minimap vision spike (timeboxed)
