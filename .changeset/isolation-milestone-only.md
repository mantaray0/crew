---
"@mantaray0/crew": minor
---

Reduce `git.isolation` to a milestone-level switch: `off` ·
`worktree-per-milestone` · `branch-per-milestone`. The `*-per-phase`
values are dropped — phase-level isolation is intrinsic to `dispatch`
(parallelism always isolates per phase), so it never needed a config
value. Existing configurations migrate losslessly: any earlier value
(`worktree-per-feature`/`branch-per-feature`, `linear`, and the
`*-per-phase` values) maps to one of the three.
