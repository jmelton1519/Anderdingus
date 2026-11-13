# Integrity checklist

Stub. Seed from CLAUDE.md decision 8: no automated input; only legitimately visible or teammate-shared information; per-game and per-platform rules check before public or tournament use.

Every event source must be read-only. The console relay (ADR 0012) reads `console.log` and never uses `-netconport` or any other channel that can send commands.
