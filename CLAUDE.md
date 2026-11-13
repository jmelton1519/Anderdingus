# Anderdingus: project context for Claude Code

Read this first. It is the shared memory between the planning chat (claude.ai) and Claude Code. Update it when decisions change.

## Working agreement with the owner

- Owner prefers SHORT responses: one paragraph or less, easy to scan.
- We are in the setup phase: no product code until the harness, repo, CI and data plan are in place. Do not start building features unprompted.
- Timebox research and avoid rabbit holes. Park side questions in `docs/later.md`.
- Default to a reasonable choice, state it, and move on. Ask only when a wrong guess is costly.

## The idea

A Discord bot (an AI agent) that reduces players' cognitive load and gives them a data edge by turning live game data into natural-language answers and callouts. Inspired by LLM agents that relay operator commands and surface information so humans make the decisions (the model reads data; it never takes game actions).

## Decisions so far

1. **First game: Counter-Strike 2.** Official Game State Integration (GSI) gives a safe, documented data feed. Build a **game-adapter layer** so other games (e.g. League of Legends via its local Live Client Data API) can plug in later. Verify the data-source claims for any new game.
2. **Use case:** friend groups playing together live in a Discord voice channel. Example queries: "team economy?", "who has the bomb?", "last known enemy position?" (only where official data allows).
3. **v1 data source: GSI only.** A lightweight companion app on each player's PC receives GSI JSON from CS2 and streams events to the bot. GSI exposes mostly the local player's own state plus map, round and bomb info; spotted-enemy minimap data is NOT in it for normal players.
4. **Minimap screen reading is deferred**, not dropped. It is the first big feature after the first working slice, as a timeboxed feasibility spike. Architecture must have a pluggable **event source** so a vision source can sit beside GSI. Notes: Discord bots cannot officially receive Go Live video (doing so needs unofficial reverse engineering and is against the ToS), so capture happens locally in a companion app. Screen capture may require CS2's `-allow_third_party_software` launch option (turns off Trusted Mode).
5. **Language/runtime:** TypeScript on Node (discord.js for the bot). One language across bot, backend and companion app.
6. **Hosting:** local-first. Everything runs on the owner's Windows PC. Keep config in environment variables so a later move to a cloud host is easy. No cloud accounts yet.
7. **AI runtime:** Anthropic API via the TypeScript SDK, behind a small interface with a **mock model** for tests and local dev. Default to Haiku 5.5 for routine queries, escalate to Sonnet 5.5 for harder analysis, cache the static system prompt, rate-limit calls, and set a monthly spend cap in the Anthropic Console. The owner's API credits are not available for about 7 days (from 2026-11-13), so build against the mock first. Never commit API keys.
8. **Rules/integrity:** the bot only uses information a player could legitimately see or that teammates share. No automated aim or input, ever. Live-assist features need a per-game and per-platform rules check (Valve, FACEIT/ESL, etc.) before public or tournament use. Design separate modes: live team comms, practice, post-match review.
9. **CS2 console relay:** tail CS2's `console.log` (launch option `-condebug`) and post new lines to a configured Discord channel, with an optional regex filter. Read-only; `-netconport` was rejected because it accepts commands. See ADR 0012 and `docs/console-relay.md`.

Decisions 1 to 9 are recorded as ADRs 0004 to 0012 in `docs/decisions/`.

## Environment

- Owner machine: Windows 11, PowerShell. Project is on the E: drive.
- Repo: https://github.com/jmelton1519/Anderdingus (branch `main`).
- Local clone: `E:\Documents\Dev\repos\Anderdingus`
- Installed or to install: Git, Node.js LTS, GitHub CLI (`gh`). Verify with `git --version`, `node --version`, `gh auth status`.

## Roadmap (we are here: phase 8)

1. Idea to spec (done: product brief below)
2. Architecture decisions (done; ADRs in `docs/decisions/`)
3. **Repo and GitHub setup:** README, .gitignore, .editorconfig, branch strategy, branch protection, issue/PR templates, labels, project board
4. The AI harness: this file, `.claude/commands/`, subagents, hooks, permissions
5. Quality gates and CI: lint, format, type check, tests, pre-commit hooks, GitHub Actions; define how AI-authored PRs get reviewed
6. Data and environments: GSI schema and sample payloads as fixtures, secrets handling (`.env` ignored, `.env.example` committed)
7. Observability: logging, error tracking, AI cost and usage tracking
8. Backlog and first thin end-to-end slice, then write product code

## Product brief (v1)

- **Problem:** in fast CS2 rounds, important information stays in one player's head or goes missed.
- **Users:** small friend groups in a Discord voice channel.
- **v1 scope:** Discord bot plus companion app reading CS2 GSI; answers typed or spoken questions about team state; short round-by-round callouts.
- **Out of scope for v1:** minimap screen reading, other games, any automated input, public or tournament use before the rules check.

## Conventions (to refine in phase 4)

- Small, reviewable PRs on feature branches; `main` stays green.
- Specs before code: each task has a short written requirement in an issue or `docs/`.
- Tests for every behavior; use recorded GSI payloads as fixtures.
- Secrets only in environment variables.
- Harness (`.claude/`): `/spec`, `/adr`, `/pr` commands; `reviewer` subagent (read-only, run before merging); `settings.json` allows read-only git/gh and quality-gate commands and denies `.env` access, force-push, hard reset and `rm -rf`. Quality gates: `npm run check` (lint, format check, type check, tests); husky pre-commit runs lint-staged; CI runs the same on every PR. PR review policy: ADR 0002.

## Context and usage discipline

- One task per session; start fresh sessions rather than letting context grow.
- Read files in ranges. Never read `package-lock.json`, `node_modules`, `dist` or `coverage` (denied in settings).
- Delegate wide searches and reviews to subagents; keep their output to conclusions, not file dumps.
- Use the cheapest model that works (Haiku for review and routine tasks, Sonnet for design). The bot's runtime model rules are in decision 7.
- Do not paste large logs or payloads into chat: summarize, or save to a file and reference it.
- Doctrine lives in `docs/doctrine/`; load only the page a task needs.
