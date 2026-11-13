# ADR 0002: Review of AI-authored PRs

Status: accepted

Every PR, AI-authored or not, must pass CI (lint, format, type check, tests) before merge. Before merging an AI-authored PR, run the `reviewer` subagent on the diff and read the PR yourself. The owner is the only one who merges. Branch protection is unavailable on a private repo without GitHub Pro, so this is enforced by habit, not by GitHub; revisit if the repo goes public or upgrades.
