---
description: Idea inbox — capture an idea (default), or `list` to show and triage the backlog.
argument-hint: "[idea | list]"
---

# /crew:backlog

Load the `crew-state` skill. Route on the whole trimmed `$ARGUMENTS`.

## Capture (any text other than exactly `list`; empty → ask for the idea)

1. Ask for the Why and the priority in one round, both skippable; leave the Why as `TODO` when skipped.
2. Write one item file (`crew-state` → backlog) and confirm in one line. Touch nothing else, so an active phase stays undisturbed.

## `list`

1. Show a table of every `backlog/*.md`: ID · Title · Priority · Created, sorted high → low, then by ID. A file that holds many ideas (an `ideen.md`) is one row, titled by its name.
2. If the user wants to triage, offer per item: **now** (small fix → do it directly; feature → `/crew:brief`) · **into the roadmap** (`/crew:adjust`) · **keep** · **drop** (delete the file).
