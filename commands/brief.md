---
description: Start a new project or feature — clarify the intent via Roast-Me questioning, capture the stack, and write the brief (PROJECT.md or a milestone's `_spec.md`).
argument-hint: "[free-form idea or feature description]"
---

# /crew:brief

Turn a raw idea into a clarified brief before any planning. This is the entry point of the crew workflow.

**Follow `crew-conventions`:** batch independent clarification questions into one `AskUserQuestion` stepper (each with a recommended answer), stay sequential where one answer determines the next; never silently assume; respond in the user's language.

**Resolve first (`crew-conventions` → *Resolve the config before step 1*).** `workflow.brief.intensity` and `workflow.brief.depth` steer this entire command, so resolve both — project → global → built-in default — **before** step 1, silently (no stepper entry). If they can't be resolved, or there is no `.planning/` at all, **act as `normal`** for both; never run the clarification with no intensity at all.

## Steps

1. **Read context.** If `.planning/PROJECT.md` exists, read it (this is a feature inside an existing project). If not, this is a new project. **If you were invoked by promoting a backlog item**, first read its `backlog/<NNN>_<slug>.md` (frontmatter + Key Facts — see `crew-context` → *The backlog*) and **seed** the Roast-Me clarification from it — ask only the gaps (the handoff contract). `brief` itself removes nothing — the promoting `backlog list`/`plan`/`adjust` path retires the item file.
2. **Run Roast-Me clarification.** **Load the `roast-me` skill and follow it** — the skill is the source of truth for the questioning (batching, the intensity floors, breadth, the Spec-Probe stop-gate). Work from the skill itself, **never from a summary of it in this file**; pass it the `intensity`/`depth` resolved above. This is the heart of `/crew:brief` — clarifying and challenging the idea is the command's whole job, so give it the full roast rather than the shortest path to a writable Spec. Hold the scope line: structural / sequencing / phasing ideas are **not** decided here — capture them for `/crew:plan` (step 4 carries them over). Then summarize.
3. **Capture the stack (new project only).** Ask for DB / frontend / UI / backend-API / queue / deploy, pre-filled with the user's defaults. Offer the escape "you decide → I propose → you approve". If `/crew:init` already seeded `config.stack`/`tags` from an archetype, confirm rather than re-ask.
4. **Write the brief.**
   - **New project:** write/refresh `.planning/PROJECT.md` — Stack, Architektur-Entscheidungen (the *why*), Aktueller Stand, Constraints.
   - **Feature in an existing project:** **always** create `.planning/plans/<n>_<slug>/_spec.md` — a **numbered milestone folder** (`<n>` = next milestone number, then the brief slug), holding `_spec.md` with the **Spec** (Ziel/Problem, Anforderungen, Akzeptanzkriterien, Out of Scope) — plus a **`Notes for planning`** section carrying the structural/sequencing ideas parked in step 2, **only if** any were parked (`planning` → *the brief→plan handoff*; a `/clear` follows this command, so an unwritten note is a lost one). This `_spec.md` is the milestone's **permanent** source of intent — it stays for the life of the milestone (like `_roadmap.md` after archiving). No phase number is invented — `/crew:plan` later fills the *same folder* with numbered phase plans (`<id>_<title>.md`) that **reference** this `_spec.md` rather than copy it. The folder is `<n>_<brief-slug>` (see `planning` file naming). The Plan body is filled by `/crew:plan`.
5. **Confirm.** Show the brief and wait for the user's OK before suggesting `/crew:plan`.

Do not write implementation code in this command.

## Hand-off

When you're done, end your reply **in the user's language** by prompting a clean context before the next step:

> **Done?** Run `/clear` to reset the context, then `/crew:plan` to turn this brief into a roadmap.
