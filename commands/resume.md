---
description: Orient a fresh session — load the living project context and the latest session snapshot, brief the user, and wait.
---

# /crew:resume

Pick up exactly where the last session left off, in a clean context.

Unlike `/crew:status` (the any-time read-only dashboard), `resume` is the **session bootstrap**: its differentiator is the **session snapshot** — the failed approaches (**DO NOT RETRY**) and the exact **NEXT STEP** — which `status` never reads. `status` answers "where do we stand?"; `resume` answers "what was I doing, and what's the next move?", then ends ready to continue.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

1. **Load.** Read `.planning/PROJECT.md`, the most recent snapshot in `.planning/sessions/` (newest file across any `<worktree-id>/` subdir), the active phase in `.planning/ROADMAP.md`, and the tail of `.planning/LOG.md`.
2. **Brief.** Output a structured briefing:
   - **PROJECT** — name + what we're building (2–3 sentences).
   - **STATE** — done / in-progress / not-started phases.
   - **DO NOT RETRY** — failed approaches from the snapshot (critical — always show, even if "none").
   - **NEXT STEP** — the exact next step from the snapshot/roadmap, or, if undefined, propose one from the plan.
3. **Wait.** Do not touch files or start work. Wait for the user. If they say "continue" and the next step is defined, proceed with that exact step (typically by invoking `/crew:execute`).

Never modify the snapshot — it is a read-only historical record. If a referenced file is missing, warn in the briefing.
