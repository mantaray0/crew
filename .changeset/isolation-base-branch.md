---
"@mantaray0/crew": minor
---

Make isolation opt-in with a milestone granularity, and a configurable base branch.

`config.git.isolation` becomes a **two-axis** enum — mechanism (`worktree-`/`branch-`) × granularity (`-milestone`/`-phase`) — with a new **per-milestone** option: one worktree+branch for a whole milestone, so different people or agents can take a milestone in parallel. Worktree is the preferred mechanism. The default flips to **`off`** (linear): isolation is now **opt-in**, so an unconfigured project is never surprised with a branch. The former `worktree-per-feature` / `branch-per-feature` / `linear` values migrate losslessly to `worktree-per-phase` / `branch-per-phase` / `off`.

A new `config.git.baseBranch` (default `main`) sets the fork/integration target for isolation branches: they fork from and merge back into `baseBranch` instead of hardcoded `main`. Set `baseBranch: "redesign"` and work collects on that branch — nothing reaches `main` automatically (the final merge to `main` stays manual). `config.git` remains the sole git/remote authority; only the merge *target* moves, not the merge *permission*.

The **sequential** `/crew:execute` now honors isolation too (previously a no-op — only `dispatch` consulted it): entering a milestone creates the milestone worktree+branch once. `dispatch` keeps its per-phase parallelism and, when milestone isolation is active, nests phase worktrees under the milestone branch. Per-phase **fresh context** (`/clear` between phases) is documented as reliable loop behavior, decoupled from the `auto`-only framing.

The `crew-config` and `git-merge` skills, `commands/execute.md`, and the README are updated to the new model. `/crew:init` and `/crew:setup` now surface `git.isolation` and `git.baseBranch` as inherit-first questions (default `off` / `main`), so the capability is discoverable on a fresh setup; existing configs get the new keys on reconcile, version-gated and inherit-first.
