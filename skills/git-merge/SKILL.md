---
name: git-merge
description: How crew isolates parallel work and integrates it — worktree-per-feature, claims, rolling integration, and intent-aware conflict resolution. Use during parallel dispatch and merging.
origin: crew
---

# Worktrees & Merge Integration

## Isolation

`config.git.isolation`:
- `worktree-per-feature` (default) — each parallel phase gets its own git worktree + branch. No file collisions between concurrent sub-agents.
- `branch-per-feature` — branches without separate worktrees (one working tree).
- `linear` — everything on the current branch (no real parallelism).

Concurrency cap: `config.execution.maxConcurrent`.

## Collision-safe state

- One `plans/<slug>.md` per feature (different files → no conflict).
- `LOG.md` is append-only (or per-feature files under a `logs/` directory).
- Snapshots under `sessions/<worktree-id>/`.
- `claims.json` records which worktree owns which phase; the roadmap shows `[>] @worktree-id`.

## Rolling integration

Integrate as soon as a phase is **done and verified** — don't wait for the whole wave. This keeps branches from drifting far apart, so conflicts stay small. After each integration, in-flight worktrees rebase onto the updated integration branch.

Strategies (`config.git.mergeStrategy`): `integration-branch` (rolling, then one clean merge to main) · `pr` (a PR per phase) · `ask-each` (ask before every merge).

## Conflict resolution

The `merge-coordinator` carries each side's **phase intent**, so it resolves by what the code was meant to do, not by textual diff alone. `config.git.conflictPolicy`: `resolve-or-ask` (default — resolve the clear ones, ask on genuine ambiguity), `always-ask`, or `autonomous`. Always verify after resolving.
