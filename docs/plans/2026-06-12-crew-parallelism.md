# crew Parallelism, Worktrees & Merge — Plan 5 (record)

**Goal:** run independent phases in parallel with collision-safe state and intent-aware integration.

**Shipped:**
- **Commands** (content): `/crew:dispatch` (DAG → worktrees → sub-agents → rolling integration), `/crew:quick` (quick lane), `/crew:rollback` (revert to last verified phase).
- **Agent** `merge-coordinator` (content): intent-aware conflict resolution per `config.git.conflictPolicy`.
- **Skill** `git-merge` (content): isolation modes, collision-safe state, rolling integration.
- **Code (tested):**
  - `src/planning/dag.ts` — `parseRoadmap` (phase id/done/deps from roadmap lines), `topoWaves` (parallel waves, throws on cycle), `readyPhases`.
  - `src/planning/claims.ts` — `readClaims`/`claimPhase`/`releasePhase` (parallel-safe phase ownership).

**Verification:** 39 tests green, typecheck + lint clean.

**Out of scope (Plan 6):** task providers + `/crew:pull`, `/crew:retro`, notifications, `/crew:report`.
