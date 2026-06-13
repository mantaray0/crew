---
description: Idea inbox — add is the default (capture a thought instantly); `list` to list/triage, `new` to be prompted for one.
argument-hint: "[idea text | list | new | empty → ask & add]"
---

# /crew:backlog

**`add` is the default verb** — anything that isn't a bare keyword is captured as an idea.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

Route on the **full trimmed `$ARGUMENTS`** — match the keywords only when the argument is *exactly* `list` or `new`, so an idea like `list the new APIs` is still captured verbatim:

- **exactly `list` (list/triage):** show the backlog. If the user wants to triage, for each item offer (single-select per `crew-conventions`): **do it now (promote)** · **plan it** · **keep parked** · **drop**.
  - **do it now (promote)** — route the item by **size** (see the routing rule below): a small fix/chore → `/crew:quick` (done on the spot, **no roadmap entry**); a real feature → `/crew:brief` → `/crew:plan`; roadmap-worthy but later → `/crew:adjust` (into the sequenced roadmap). This is the direct path from "captured" to "in work" — no mandatory roadmap detour.
  - **plan it** — queue it *without* starting work now: shape it via `/crew:plan` (or `/crew:adjust` into the roadmap) for later. Same size-based routing as promote, just deferred — **promote = do it now, plan it = queue for later**.
  - **keep parked** / **drop** — leave as-is, or remove.

  Once an item is promoted (for the quick path: once the quick task is done), **remove it from `BACKLOG.md`** so it isn't tracked twice. Apply the choices and update `BACKLOG.md`.
- **empty or exactly `new` (ask & add):** prompt the user for the new idea (free-text, per `crew-conventions`; hint that `list` triages instead), then append it exactly like the add path below. Confirm in one line.
- **anything else (add — default):** append the full `$ARGUMENTS` to `.planning/BACKLOG.md` as a dated bullet (`- [YYYY-MM-DD] <idea>`). Do nothing else — don't interrupt the active phase. Confirm in one line.

## Routing rule of thumb (promote)

When promoting from the backlog, pick the lane by **size**, not by enthusiasm:

- **`/crew:quick`** — a small, self-contained fix or chore (one area, no real design choices). Done on the spot and **never enters the roadmap** (see `quick.md`).
- **`/crew:brief` → `/crew:plan`** — a real feature: choices/scope worth clarifying, then breaking into phases.
- **`/crew:adjust`** — belongs in the sequenced roadmap but later: insert/reorder it as a phase, don't build it now.

When unsure between quick and plan, prefer `/crew:brief` — a one-line brief is cheap; a feature sprawled through the quick lane is not.

Keep the **add/capture path** fast and side-effect-free beyond `BACKLOG.md`. Only the `list` triage may delegate to other commands — and only when the user explicitly promotes an item.
