# Design: decision engine ("brain")

Status: approved 2026-11-13. Browser version: `design-brain.html` (keep the two in sync).

## What it is

A **database of in-game situations** (enemy in front, teammate died, red radar blip). Each situation has **standard inputs** and a fixed set of **possible outputs**. A **decision model** picks one output; it never writes free-form text. Example: _I'm on B, a teammate dies mid, I get told where they died and other relevant positions._

## Pipeline

Sources (GSI, console, teammates) → situation detector → decider (tree, later model) → output template → Discord.

- **Situation catalog:** each entry names the situation, its inputs (typed fields), its data source and when it fires.
- **Decision catalog:** each situation lists its allowed outputs (callout IDs with templates). Nothing outside the list can be said.
- **Decider:** one interface, `decide(situation, inputs) → output ID`. Version 1 is a hand-written decision tree; a model later implements the same interface and is checked against the tree on recorded games.
- **Decision log:** every situation, its inputs and the chosen output are saved (sanitized), as training and test data.

## Data availability

| Situation              | Inputs                                | Source                                                     | Status                                         |
| ---------------------- | ------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| Teammate died          | Who, where (zone), my zone, time left | Each teammate's own GSI health and position, via companion | Possible after team sprint; position to verify |
| Enemy in front         | Enemy position relative to me         | Not in GSI for normal players                              | Needs vision spike                             |
| Red radar blip         | Spotted enemy positions               | Not in GSI for normal players                              | Needs vision spike                             |
| Bomb planted / defused | Site, time                            | GSI `round.bomb`                                           | Available now (site needs zones)               |
| I'm low HP / flashed   | Health, flashed                       | GSI `player.state`                                         | Available now                                  |
| Kill or damage feed    | Attacker, victim, damage              | Console relay                                              | Unverified                                     |

Enemy-position situations need on-screen reading and a rules check, since live enemy info is the riskiest kind of assistance.

## Two pieces to build

1. **Map zones.** GSI gives coordinates, not names. CS2 already has place names (shown on the HUD radar), so reuse them. Options, best first, each to verify: extract place areas from the map's navigation data; read place tags from console chat lines; fallback to hand-made polygons with the game's names. Reading the on-screen name is vision work and waits. Start with Inferno.
2. **Own position check.** Add `player_position` to the GSI cfg, record a round, confirm it reports position while playing.

## Example catalog entry

```text
situation: teammate_died
inputs: victim, victim_zone, my_zone, alive_teammates, round_time_left
outputs:
  died_near_you  "{victim} died {victim_zone}, close to you"
  died_far       "{victim} died {victim_zone}"
  last_alive     "{victim} died {victim_zone}. You're last alive"
tree:
  alive_teammates == 0          -> last_alive
  victim_zone adjacent my_zone  -> died_near_you
  else                          -> died_far
```

## The decision model

A classifier: given the inputs, choose one output ID. Candidates: a small local language model forced to answer with a listed ID, or a tiny trained classifier (for example a decision forest) built from the decision log, which needs no GPU. Any answer that isn't a listed ID is dropped and the tree answers.

## How the decision database gets built

Claude Code does **not** write catalog entries. It is the **orchestrator**.

| Role                       | Does                                                                                        | Doesn't                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Orchestrator (Claude Code) | Schema, validator, tests; splits work into slices; briefs agents; validates; merges via PRs | Author entries                                                |
| Author agents              | Write entries for one slice; output must pass the validator                                 | Change the schema, invent sources, add enemy-position entries |
| Reviewer agent             | Checks slices against integrity rules, data availability, duplicates                        | Edit entries                                                  |
| Owner                      | Approves the schema first, then each slice's PR                                             | -                                                             |

Guardrails: every entry names an available data source; blocked situations are listed, not authored. At most 4 author agents per batch, cheaper model where quality allows, one small PR per slice. Agents get the schema and source table, not the whole conversation.

## Order

1. Position check (`player_position`).
2. Schema and engine (orchestrator); owner approves the schema.
3. First authoring batch (agents): bomb, own state, round flow, Inferno zones.
4. Team sprint: teammates share state, unlocking "teammate died" with location.
5. Model spike: chooser trained or prompted against the decision log, compared with the tree.

## Open questions

- What is "Jev"?
- Text channel callouts for now, or voice required?
- Keep enemy-position situations out until the vision spike and a rules check?
