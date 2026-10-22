---
name: crew-state
description: Format of crew's `.planning/` directory — ROADMAP markers, milestone plans, backlog items, LOG lines, config. Use when reading or writing any `.planning/` file, inside or outside a `/crew:*` command.
---

# crew state

crew keeps a project's state in `.planning/`, committed with the project. A fresh session orients from these files alone, so every change a command makes lands here before the command ends.

| File | Holds |
|---|---|
| `PROJECT.md` | What the project is, its decisions and their why, current state, stack, `## Checks`, `## Reference` |
| `ROADMAP.md` | Milestones → phases with status markers |
| `plans/<n>_<slug>/` | One folder per milestone: `_spec.md` (intent) + one plan file per phase |
| `backlog/` | One Markdown file per idea |
| `LOG.md` | Append-only history |
| `config.json` | The few settings below |
| `archive/` | Closed milestones |
| `reference/` | Long-form docs, read only when `PROJECT.md`'s `## Reference` points there for the task at hand |

Projects grow their own files (`HANDOFF.md`, `research/`, a single `backlog/ideen.md`, flat plan files). Read them when relevant and leave them as they are. Older projects also carry `claims.json`; it is no longer read or written.

**Tolerant reading.** Projects written by older crew versions differ in headings, id depth and folder names. Read what is there; write new content in the style the file already uses.

## ROADMAP.md

Markers: `[ ]` open · `[>]` in progress · `[x]` done · `[~]` deferred.

```markdown
## Meilenstein 3: Suche
- [x] 3.1 Index und Anschluss (erledigt 2026-10-02)
- [>] 3.2 Suchfeld (depends: 3.1)
- [ ] 3.3 Rückfrage (depends: 3.1, 3.2)
```

- A milestone is any `## ` heading; `Meilenstein N:` and `Milestone N —` are both in use. A phase is a `- [?]` line under it; its id is the leading token (`3.2`, `29.9.15`, or none).
- Done stamp: append ` (erledigt YYYY-MM-DD)`, worded in `language.files` and matching earlier stamps in the file.
- `depends:` names phases that must be `[x]` first. The next phase is the first `[>]`, else the first `[ ]` whose dependencies are done.
- Phases are edited as text: insert, reorder, defer, drop. Ids are labels, never renumbered.

## plans/

```
plans/3_suche/
  _spec.md          ← milestone intent, written by /crew:brief, permanent
  3.1_index.md      ← phase plan, written by /crew:plan
  3.2_suchfeld.md
```

- `_` prefix = meta file (`_spec.md`, `_roadmap.md`), never a phase. Numbers join names with `_`; words inside a name with `-`; slugs are lowercase ASCII even when content is German.
- Locate a phase plan by globbing `plans/**/*.md` for its id prefix.
- **`_spec.md`**: Goal/problem · Requirements · Acceptance criteria · Out of scope · optional `Notes for planning` (structural ideas the brief parked for `/crew:plan`; input, never requirements).
- **Phase plan**: the how for one phase, pointing at `_spec.md` for intent instead of copying it:

```markdown
# 3.2 Suchfeld

> **Scope:** <deliverable and this phase's acceptance, 1–3 lines>. Intent: see `_spec.md`.

## Plan
- Files: …
- Tasks: action · pattern to mirror · how to check it
- Risks: the invariants a reviewer must not trade away
```

## backlog/

One file per idea, `backlog/<NNN>_<slug>.md`; `NNN` is the highest existing number + 1, never reused. Read every `backlog/*.md`, whatever its name.

```markdown
---
id: 012
title: <short name>
priority: medium        # low · medium · high
created: 2026-10-22
---
**Why:** <the motivation — required>
**Area:** <optional>

<free-form context>
```

When an idea moves into the roadmap or is dropped, delete its file; the roadmap and plan carry it from there.

## LOG.md

Append only; earlier entries stay as written, however long. One line per event:

```
- 2026-10-22 · 3.2 · a1b2c3d · checks green · review: 3 fixed, 2 rejected
- 2026-10-24 · Meilenstein 3 closed · archive/plans/3_suche/
- 2026-10-25 · 3.4 · stopped · review finding needs a scope decision
```

Fields: date · phase · commit (or `stopped`) · verify result. Words follow `language.files`. Reasons for rejected findings and deviations go in the commit body, where they stay next to the code.

## PROJECT.md

Free-form, but these sections are read by commands:

- `## Checks`: the commands verify runs, one per line (`test`, `typecheck`, `lint`). Without it, use the `package.json` scripts of those names and say which ones ran.
- `## Reference`: one line per `reference/<topic>.md`: link, what it covers, when to read it.
- The current-state section, refreshed when a milestone closes.

## Closing a milestone

A milestone is closable when every phase is `[x]` or `[~]`. With the user's OK:

1. Refresh the current-state section in `PROJECT.md`.
2. Move `plans/<n>_<slug>/` to `archive/plans/<n>_<slug>/` and write the milestone's ROADMAP section into it as `_roadmap.md`.
3. Replace that section in `ROADMAP.md` with one line: `## Meilenstein N: <title> — archiviert YYYY-MM-DD → archive/plans/<n>_<slug>/_roadmap.md`.
4. Append the LOG line.

Existing archives in other layouts stay where they are.

## config.json

```jsonc
{
  "language": { "files": "en" },                    // language of everything crew writes into .planning/
  "workflow": { "execute": {
    "loop": "all",                                  // "all": run the milestone's phases in sequence · "one": one phase, then stop
    "review": "medium"                              // /code-review effort after each phase: off · low · medium · high · xhigh · max
  } }
}
```

Resolve each key as project (`.planning/config.json`) → global (`~/.claude/crew/config.json`) → the defaults above; a value of `"inherit"` means the next layer down. Every other key is ignored. Commit format, branches and the issue tracker come from the project's `CLAUDE.md`.

## Working with the user

- Put each decision to the user with a recommended answer they can accept as is. Closed choices (2–4 options) go through `AskUserQuestion`, independent ones batched; open questions go in text.
- Show what you will write, get the OK, then write.
- Structure stays English and stable (markers, frontmatter keys, file names); prose follows `language.files`.
