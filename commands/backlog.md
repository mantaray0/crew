---
description: Idea inbox — capture a thought instantly without disturbing the active plan, or list and triage the backlog.
argument-hint: "[idea text to add | empty to list/triage]"
---

# /crew:backlog

A frictionless place to offload ideas so the current plan stays undisturbed and nothing gets lost.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

- **With text (add):** append the idea to `.planning/BACKLOG.md` as a dated bullet (`- [YYYY-MM-DD] <idea>`). Do nothing else — do not plan, do not interrupt the active phase. Confirm in one line.
- **Without text (list/triage):** show the backlog. If the user wants to triage, for each item offer: plan now (hand to `/crew:plan`/`/crew:adjust`), keep parked, or drop. Apply choices and update `BACKLOG.md`.

Keep this command fast and side-effect-free beyond `BACKLOG.md`. It exists so a stream of ideas has a home — capture first, decide later.
