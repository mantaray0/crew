---
description: Start a new project or feature — clarify the intent via Roast-Me questioning, capture the stack, and write the brief (PROJECT.md or a plan's Spec head).
argument-hint: "[free-form idea or feature description]"
---

# /crew:brief

Turn a raw idea into a clarified brief before any planning. This is the entry point of the crew workflow.

**Follow `crew-conventions`:** batch independent clarification questions into one `AskUserQuestion` stepper (each with a recommended answer), stay sequential where one answer determines the next; never silently assume; respond in the user's language.

## Steps

1. **Read context.** If `.planning/PROJECT.md` exists, read it (this is a feature inside an existing project). If not, this is a new project.
2. **Run Roast-Me clarification.** Use the `roast-me` skill: ask sharp questions in batched stepper rounds (~3–5 baseline, the max scales with complexity), each carrying a recommended answer the user can confirm. Honour `clarify.depth` (breadth) **and** `clarify.intensity` (`gentle`/`normal`/`brutal` — how hard to challenge the idea). When a question is answerable from the codebase, investigate instead of asking. Hold the scope line: structural/sequencing ideas → note them for `/crew:plan`, don't decide them here. **Stop on the Spec-Probe** — once goal/requirements/acceptance/out-of-scope are fully writable — and after each round offer "enough, or dig deeper?". Then summarize.
3. **Capture the stack (new project only).** Ask for DB / frontend / UI / backend-API / queue / deploy, pre-filled with the user's defaults. Offer the escape "you decide → I propose → you approve". If `/crew:init` already seeded `config.stack`/`tags` from an archetype, confirm rather than re-ask.
4. **Write the brief.**
   - **New project:** write/refresh `.planning/PROJECT.md` — Stack, Architektur-Entscheidungen (the *why*), Aktueller Stand, Constraints.
   - **Feature in an existing project:** create `.planning/plans/<slug>/_spec.md` — a **milestone folder named by the brief slug**, holding `_spec.md` with the **Spec** head only (Ziel/Problem, Anforderungen, Akzeptanzkriterien, Out of Scope). No phase number is invented — `/crew:plan` later fills the *same folder* with numbered phase plans (`<id>-<title>.md`). The brief slug becomes the milestone-folder name (see `crew-planning` file naming). Honour `clarify.specArtifact` (`section` = spec head in the plan, `separate` = own file, `off` = skip). The Plan body is filled by `/crew:plan`.
5. **Confirm.** Show the brief and wait for the user's OK before suggesting `/crew:plan`.

Do not write implementation code in this command.

## Hand-off

When you're done, end your reply **in the user's language** by prompting a clean context before the next step:

> **Done?** Run `/clear` to reset the context, then `/crew:plan` to turn this brief into a roadmap.
