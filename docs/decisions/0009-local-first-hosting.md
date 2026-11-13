# ADR 0009: Local-first hosting

Status: accepted

Everything runs on the owner's Windows 11 PC; no cloud accounts yet. All config comes from environment variables (`.env` is git-ignored, `.env.example` is committed), so moving to a cloud host later is a config change. Network listeners bind to 127.0.0.1. Friends reaching the bot for team state (sprint 3) needs a safe route, still an open question in `docs/design.md`.
