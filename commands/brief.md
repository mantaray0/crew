---
description: Clarify a new project or feature through Roast-Me questioning and write the brief — PROJECT.md or a milestone's _spec.md.
argument-hint: "[idea or feature]"
---

# /crew:brief

Load the `crew-state` skill. No implementation code in this command.

## Steps

1. **Context.** `.planning/PROJECT.md` exists → a feature in an existing project; read it. Otherwise a new project. Started from a backlog item → read it and begin from its Why.
2. **Roast.** Load the `roast-me` skill and run it until its Spec-Probe passes and the user confirms. Ideas about phase cut, order or approach are noted for `Notes for planning`, not decided.
3. **Draft.**
   - New project: `PROJECT.md` with what it is, decisions and their why, current state, constraints, a stack table, and `## Checks` (the test/typecheck/lint commands, asked or read from the manifest).
   - Feature: `plans/<n>_<slug>/_spec.md` — `<n>` is the next milestone number — with the Spec sections from `crew-state`, plus `Notes for planning` when ideas were parked.
4. **Confirm, then write** in `language.files`.

## Hand-off

"Run `/clear`, then `/crew:plan` to cut this into phases."
