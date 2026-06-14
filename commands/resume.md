---
description: Orient a fresh session — load the living project context (PROJECT/ROADMAP/LOG), brief the user, and wait.
---

# /crew:resume

Pick up exactly where the last session left off, in a clean context.

Unlike `/crew:status` (the any-time read-only dashboard), `resume` is the **session bootstrap**: it reads the `LOG.md` history in depth — the recent decisions, deviations, failed approaches (**DO NOT RETRY**), and the exact **NEXT STEP** — which the compact `status` dashboard never surfaces. `status` answers "where do we stand?"; `resume` answers "what was I doing, and what's the next move?", then ends ready to continue. Continuity rides on the committed `.planning/` state (see `crew-context`), not a separate snapshot.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

1. **Load.** Read `.planning/PROJECT.md`, the active phase in `.planning/ROADMAP.md`, and the tail of `.planning/LOG.md` (the last entries carry the recent decisions, deviations, and next step).
2. **Brief.** Output a structured briefing:
   - **PROJECT** — name + what we're building (2–3 sentences).
   - **STATE** — done / in-progress / not-started phases.
   - **DO NOT RETRY** — failed approaches and deviations recorded in `LOG.md` (critical — always show, even if "none").
   - **NEXT STEP** — the exact next step from the latest `LOG.md` entry / the active `ROADMAP.md` phase, or, if undefined, propose one from the plan.
3. **Wait.** Do not touch files or start work. Wait for the user. If they say "continue" and the next step is defined, proceed with that exact step (typically by invoking `/crew:execute`).

`LOG.md` is append-only history — read it, never rewrite past entries. If a referenced file is missing, warn in the briefing.
