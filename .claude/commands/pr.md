---
description: Commit work and open a PR using the repo template
---
1. Confirm you are on a feature branch, not `main`.
2. Run the quality gates (`npm run lint`, `npm run typecheck`, `npm test`) if they exist; report failures instead of opening the PR.
3. Commit with a clear message, push, and open a PR with `gh pr create` filling in `.github/pull_request_template.md`.
4. Do not merge. Report the PR link.
