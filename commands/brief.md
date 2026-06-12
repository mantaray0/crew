---
description: Start a new project or feature — clarify the intent via Roast-Me questioning, capture the stack, and write the brief (PROJECT.md or a plan's Spec head).
argument-hint: "[free-form idea or feature description]"
---

# /crew:brief

Turn a raw idea into a clarified brief before any planning. This is the entry point of the crew workflow.

## Steps

1. **Read context.** If `.planning/PROJECT.md` exists, read it (this is a feature inside an existing project). If not, this is a new project.
2. **Run Roast-Me clarification.** Use the `roast-me` skill: ask sharp questions one at a time, each carrying a recommended answer the user can simply confirm. Honour `.planning/config.json` → `clarify.depth` (`light`/`normal`/`deep`). When a question is answerable from the codebase, investigate instead of asking. Stop when shared understanding is reached, then summarize.
3. **Capture the stack (new project only).** Ask for DB / frontend / UI / backend-API / queue / deploy, pre-filled with the user's defaults. Offer the escape "you decide → I propose → you approve". If `crew init` already seeded `config.stack`/`tags` from an archetype, confirm rather than re-ask.
4. **Write the brief.**
   - **New project:** write/refresh `.planning/PROJECT.md` — Stack, Architektur-Entscheidungen (the *why*), Aktueller Stand, Constraints.
   - **Feature in an existing project:** create `.planning/plans/<slug>.md` with the **Spec** head only (Ziel/Problem, Anforderungen, Akzeptanzkriterien, Out of Scope). Honour `clarify.specArtifact` (`section` = spec head in the plan, `separate` = own file, `off` = skip). The Plan body is filled by `/crew:plan`.
5. **Confirm.** Show the brief and wait for the user's OK before suggesting `/crew:plan`.

Do not write implementation code in this command. End by pointing to `/crew:plan`.
