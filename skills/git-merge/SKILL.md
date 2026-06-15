---
name: git-merge
description: How crew isolates parallel work and integrates it — worktree-/branch-per-milestone, claims, rolling integration, and intent-aware conflict resolution. Use during `/crew:execute dispatch` and merging.
origin: crew
---

# Worktrees & Merge Integration

## Isolation

`config.git.isolation` decides whether a **whole milestone** gets its own worktree/branch, and is **opt-in** (default `off` = linear, no isolation, everything on the current branch). Phase-level isolation is **not** a config value — it lives intrinsically in `dispatch` (see *Composition with dispatch*).

**Mechanism** — how the milestone unit is separated:
- `worktree-per-milestone` — its own git worktree + branch (creates the branch automatically; no file collisions between concurrent sub-agents). **The preferred mechanism when isolation is on.**
- `branch-per-milestone` — a branch without a separate worktree.

Valid values: `worktree-per-milestone`, `branch-per-milestone`, or `off`. Concurrency cap: `config.workflow.execute.maxConcurrent`.

### Milestone isolation

With `*-per-milestone`, the worktree+branch is created **when the milestone starts** (not per phase), named by `config.git.branchPattern`. It **forks from `config.git.baseBranch`** and at the end **merges back into it** (manual / `mergeStrategy`-driven) — never automatically into `main` when `baseBranch ≠ main`.

### Composition with dispatch

Phase-level worktrees are **intrinsic to `dispatch`** — they exist only in parallel mode, because otherwise concurrent phases would write the same tree. A **sequential / `auto`** run has **no** phase worktrees; under `*-per-milestone` the milestone is the only worktree/branch.

**Nesting rule:** when milestone isolation is active, `dispatch` phase worktrees **fork from the milestone branch** (not from `baseBranch`) and merge — via rolling integration — back into it; the milestone branch later merges as a whole into `baseBranch`. Without milestone isolation, `dispatch` forks directly from `baseBranch`, as today. Milestone isolation is an **additional, coarser axis — not a replacement** for dispatch's phase parallelism.

## Collision-safe state

- One `plans/<n>_<milestone-slug>/` folder per milestone (different folders/files → no conflict).
- `LOG.md` is append-only (or one file per phase under a `logs/` directory).
- `claims.json` records which worktree owns which phase; the roadmap shows `[>] @worktree-id`.

## Rolling integration

Integrate as soon as a phase is **done and verified** — don't wait for the whole wave. This keeps branches from drifting far apart, so conflicts stay small. After each integration, in-flight worktrees rebase onto the updated integration branch.

Strategies (`config.git.mergeStrategy`): `integration-branch` (rolling, then one clean merge to **the base branch** — `config.git.baseBranch`, default `main`; or to the **milestone branch** when nesting under milestone isolation) · `pr` (a PR per phase) · `ask-each` (ask before every merge).

The merge **target** moves to `baseBranch` (or the milestone branch when nesting) — the merge **permission** does not: `config.git` (`autoPush` / `autoPR` / `askBeforeMerge`) stays the **sole** git/remote authority, untouched. The final merge of a `baseBranch` like `redesign` into `main` stays manual.

## Conflict resolution

The `merge-coordinator` carries each side's **phase intent**, so it resolves by what the code was meant to do, not by textual diff alone. `config.git.conflictPolicy`: `resolve-or-ask` (default — resolve the clear ones, ask on genuine ambiguity), `always-ask`, or `autonomous`. Always verify after resolving.
