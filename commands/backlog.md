---
description: Idea inbox — add is the default (capture a thought instantly); `list` to list/triage, `new` to be prompted for one.
argument-hint: "[idea text | list | new | empty → ask & add]"
---

# /crew:backlog

**`add` is the default verb** — anything that isn't a bare keyword is captured as an idea.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

Route on the **full trimmed `$ARGUMENTS`** — match the keywords only when the argument is *exactly* `list` or `new`, so an idea like `list the new APIs` is still captured verbatim:

- **exactly `list` (list/triage):** show the backlog. If the user wants to triage, for each item offer: plan now (hand to `/crew:plan`/`/crew:adjust`), keep parked, or drop. Apply choices and update `BACKLOG.md`.
- **empty or exactly `new` (ask & add):** prompt the user for the new idea (free-text, per `crew-conventions`; hint that `list` triages instead), then append it exactly like the add path below. Confirm in one line.
- **anything else (add — default):** append the full `$ARGUMENTS` to `.planning/BACKLOG.md` as a dated bullet (`- [YYYY-MM-DD] <idea>`). Do nothing else — don't interrupt the active phase. Confirm in one line.

Keep this command fast and side-effect-free beyond `BACKLOG.md`.
