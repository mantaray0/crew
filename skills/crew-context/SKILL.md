---
name: crew-context
description: How crew holds project state across sessions — the .planning state model, what each file owns, and the session-snapshot handoff format. Use when reading/writing .planning state or resuming work.
origin: crew
---

# crew Context & State

## The `.planning/` files (committed)

| File | Owns |
|---|---|
| `PROJECT.md` | The living project truth: stack, architecture decisions (the *why*), current state, constraints. Loaded automatically at session start. |
| `ROADMAP.md` | The fahrplan: milestones → phases with status markers + timestamps. |
| `plans/<milestone-slug>/` | Detail per milestone: optional `_brief.md` (Spec root) + numbered `<id>-<title>.md` phase plans (Spec head + Plan body each). |
| `BACKLOG.md` | Idea inbox; triaged at plan/adjust. |
| `LOG.md` | Append-only history: phase, commit, verify result, token/cost. |
| `claims.json` | Which instance/worktree holds which phase (parallel-safe). |
| `sessions/<worktree-id>/` | Per-instance session snapshots. |
| `config.json` | Behavior config (git, verify, models, clarify, tasks, …). |

`PROJECT.md` is the always-true source; `ROADMAP.md` is the plan; `plans/` is detail; `LOG.md` is history. The plan + log are the external memory — the work survives a fresh context, not the context window.

## Session snapshot format

When context is about to compact or a session ends, write `sessions/<worktree-id>/<timestamp>.md`:

```markdown
# Snapshot <timestamp>
## Building
<1-3 sentences>
## Works (with evidence)
- <thing> — confirmed by: <evidence>
## Does NOT work (and why)
- <approach> — failed because: <exact reason>   ← most important section
## File states
| file | status | notes |
## Decisions
- <decision> — because: <why>
## Exact next step
<the single most important next action — zero guesswork>
```

`/crew:resume` reads `PROJECT.md` + the newest snapshot + `LOG.md` and produces a briefing. Snapshots are read-only history — never edit a past one; always write a new file.
