---
description: Turn a clarified brief into a roadmap (milestones → phases) and detailed plan files. Triage the backlog. Wait for approval before execution.
argument-hint: "[feature/plan slug, optional]"
---

# /crew:plan

Produce the executable plan from a brief. Uses the `crew-planning` and `crew-conventions` skills.

**Follow `crew-conventions`:** surface decisions as explicit questions (which backlog items to fold in = multi-select; approach choices = single-select), don't silently decide; respond in the user's language.

## Steps

1. **Read context.** Read `.planning/PROJECT.md`, the relevant `.planning/plans/<slug>.md` Spec head (if any), `.planning/roadmap.md`, and `.planning/backlog.md`.
2. **Triage the backlog.** Surface backlog items relevant to this plan; ask the user which to fold in now vs. leave parked. Remove folded items from `backlog.md`.
3. **Draft the roadmap.** Write/extend `.planning/roadmap.md` as milestones → phases using markers `[ ]` open · `[>]` active · `[x]` done · `[~]` deferred. Keep phases independently mergeable. Record inter-phase **dependencies** (for later parallel dispatch).
4. **Write the plan.** For each phase/feature, write `.planning/plans/<slug>.md` with a **Spec** head (carried from `/crew:brief` or the source ticket) followed by a **Plan** body: affected files, tasks (Action / pattern to mirror / validation command), risks, and this phase's verify configuration. Follow `clarify.specArtifact`.
5. **Ground in the codebase.** Mirror existing patterns; reference real files. Use the relevant stack skills based on the project's `tags`.
6. **Present and wait.** Show the roadmap + plan summary and **wait for explicit approval**. Do not start implementation here — that is `/crew:next` (or `/crew:dispatch` for parallel phases).

If a security-sensitive area appears (auth, payments, tokens), note it and recommend a security pass in verify — do not enable it automatically (`security.auto` stays false).
