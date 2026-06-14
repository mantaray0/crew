---
description: Archive a fully completed milestone — move its roadmap section and plans folder into .planning/archive/, leaving a one-line pointer to keep the live roadmap small.
argument-hint: "[milestone slug, optional — defaults to the latest completed milestone]"
---

# /crew:archive

Move a finished milestone out of the live state into `.planning/archive/`, so `ROADMAP.md` and `plans/` stay small and cheap to read. Uses the `crew-planning` and `crew-conventions` skills.

**Follow `crew-conventions`:** confirm the target before moving anything; respond in the user's language.

## Steps

1. **Pick the milestone.** Use the `$ARGUMENTS` slug if given; otherwise the **latest fully completed** milestone in `.planning/ROADMAP.md`.
2. **Guardrail — done only.** Verify **every** phase of that milestone is `[x]` **or** `[~]` (deferred phases are **non-blocking**, matching the audit in `/crew:complete`; confirm once whether a `[~]` should carry into the next milestone). If a phase is still open (`[ ]`/`[>]`), list the open ones and **stop** — only fully completed milestones archive.
3. **Confirm.** Show what will move (the milestone's `plans/<n>_<slug>/` folder, with its `ROADMAP.md` section written in as `_roadmap.md`) and where, then proceed.
4. **Move state** (a folder `mv` + writing one meta file, no content change):
   - Move `.planning/plans/<n>_<slug>/` → `.planning/archive/plans/<n>_<slug>/`.
   - Write the milestone's `ROADMAP.md` section **into** that folder as `.planning/archive/plans/<n>_<slug>/_roadmap.md` (`_`-prefix = meta file, never read as a phase).
   - Replace the milestone's section in `ROADMAP.md` with a one-liner: `## Meilenstein N: <Titel> — ✓ archiviert YYYY-MM-DD → archive/plans/<n>_<slug>/_roadmap.md`.
5. **Record.** Append a note to `.planning/LOG.md` (which milestone was archived, when). `LOG.md` itself stays append-only — never archived.

Do not touch `PROJECT.md`. Never archive a milestone with open phases (`[ ]`/`[>]`); deferred `[~]` are non-blocking.

## Hand-off

End your reply **in the user's language**, confirming the milestone is archived and noting the live roadmap is now shorter.
