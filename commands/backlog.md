---
description: Idea inbox — add is the default (capture a thought instantly); `list` to list/triage, `new` to be prompted for one.
argument-hint: "[idea text | list | new | empty → ask & add]"
---

# /crew:backlog

**`add` is the default verb** — anything that isn't a bare keyword is captured as an idea.

The backlog is a **`backlog/` folder, one Markdown file per item** — there is **no** `BACKLOG.md` index. The item-file format (frontmatter fields, enum values, the Key Facts body, IDs & lifecycle) is defined once in `crew-context` → *The backlog* — **read it there; don't restate it**. This command only writes, lists, and triages those files.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

Route on the **full trimmed `$ARGUMENTS`** — match the keywords only when the argument is *exactly* `list` or `new`, so an idea like `list the new APIs` is still captured verbatim:

- **anything else (add — default):** capture the idea as a new item file `backlog/<NNN>_<slug>.md` (format → `crew-context`). Then ask three **skippable** prompts (per `crew-conventions`) — the two facts that go missing first, plus priority:
  - **Why / motivation** — the context that evaporates first.
  - **Affected area** — commands / skills / config / files.
  - **Priority** — `low` · `medium` · `high` (default `medium`).

  Fill the frontmatter: `id` = next running ID, `title` from the idea, `status: open`, `created` = today (ISO `YYYY-MM-DD`), `priority` from the answer (default `medium`), `description` = one sentence. Write the captured Why + affected area into the **Key Facts** block.

  **Quick escape hatch:** any prompt skipped → a **minimal valid stub** — title + `created` + default `priority: medium` + `status: open`, Key Facts left as `TODO`. The fast "capture a thought now" path stays intact; the three prompts are a help, never required fields. Side-effect-free beyond writing the one item file — don't interrupt the active phase, and **never** write or regenerate a `BACKLOG.md`. Confirm in one line.

  **ID assignment.** `<NNN>` = (highest ID ever used) + 1 — **never** reuse or backfill a gap (a reused ID would collide with a promoted/removed item still referenced from the roadmap/plan). In practice: take the highest existing `backlog/` number as the floor; if all items were removed, keep counting from the last one used (like `plans/`).

- **empty or exactly `new` (ask & add):** prompt the user for the new idea (free-text, per `crew-conventions`; hint that `list` triages instead), then create the item file exactly like the add path above (including the skippable Key-Facts prompts). Confirm in one line.

- **exactly `list` (list/triage):** emit the backlog as a **deterministic table** — always and only a full table of **all** items (every `backlog/*.md` on disk — folded items are already removed, so all are living) read from frontmatter, columns **ID · Title · Priority · Status · Created** (add a **Due** column only if any item has a `due` set), **sorted by priority** (`high` → `medium` → `low`, ties by ID). No prose variant, no "depends on context" — running `list` twice in a row yields the identical table.

  Then, if the user wants to triage, for each item offer (single-select per `crew-conventions`): **do it now (promote)** · **plan it** · **keep parked** · **drop**.
  - **do it now (promote)** — route the item by **size** (see the routing rule below): a small fix/chore → `/crew:quick` (done on the spot, **no roadmap entry**); a real feature → `/crew:brief` → `/crew:plan`; roadmap-worthy but later → `/crew:adjust` (into the sequenced roadmap). This is the direct path from "captured" to "in work" — no mandatory roadmap detour.
  - **plan it** — queue it *without* starting work now: shape it via `/crew:plan` (or `/crew:adjust` into the roadmap) for later. Same size-based routing as promote, just deferred — **promote = do it now, plan it = queue for later**. Optionally set the item's `status: planned`.
  - **keep parked** — leave the item file unchanged.
  - **drop** — remove the item file.

  Once an item is promoted (for the quick path: once the quick task is done), **remove its item file** so it isn't tracked twice — `promoted`/`dropped` are transient end states, the file is deleted (`crew-context` lifecycle). The frontmatter is the single source of truth; **no** index is written or refreshed.

## Routing rule of thumb (promote)

When promoting from the backlog, pick the lane by **size**, not by enthusiasm:

- **`/crew:quick`** — a small, self-contained fix or chore (one area, no real design choices). Done on the spot and **never enters the roadmap** (see `quick.md`).
- **`/crew:brief` → `/crew:plan`** — a real feature: choices/scope worth clarifying, then breaking into phases.
- **`/crew:adjust`** — belongs in the sequenced roadmap but later: insert/reorder it as a phase, don't build it now.

When unsure between quick and plan, prefer `/crew:brief` — a one-line brief is cheap; a feature sprawled through the quick lane is not.

Keep the **add/capture path** fast and side-effect-free beyond writing the one item file. Only the `list` triage may delegate to other commands — and only when the user explicitly promotes an item.
