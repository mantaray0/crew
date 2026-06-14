---
"@mantaray0/crew": minor
---

Restructure config into `config.workflow.*` with a two-level workflow model, and finish the close-out
vocabulary cleanup.

**Two levels, so "auto" is never ambiguous.** The workflow steps now live under `config.workflow.*`
(`brief`/`plan`/`execute`/`ship`/`learn`/`complete`/`finish`); cross-cutting config (`git`, `models`,
`tasks`, …) stays top-level. **`workflow.mode`** (`manual | auto`, default `manual`) advances the *step*
chain (brief → … → complete); each gateable close-out step carries a **`run`** (`off | ask | auto |
smart`, with the new `smart` = the agent judges whether it's worthwhile) that decides how it's handled
when the chain reaches it. The three "auto" granularities are now distinct fields — `workflow.mode`
(steps), `workflow.execute.loop` (phases), `workflow.execute.parallel` (strategy). `config.git` stays
the sole git/remote authority for **every** `run` including `auto`/`smart`: entering a step never pushes,
PRs, or merges without approval.

**`verify` is nested under execute** as `config.workflow.execute.verify` and its first stage is renamed
`verify` → `test` (the pipeline/command stay named `verify`); the default is now
`["test", "review", "harden", "simplify"]`.

**`config.finish` dissolves** into the steps' own `run`s (`config.workflow.{ship,learn,complete}.run`);
`/crew:finish` stays the orchestrator and reads them. The learn step is renamed: **`/crew:retro` →
`/crew:learn`** (config section `retro` → `learn`), with `/crew:retro` kept as a non-breaking deprecated
alias.

**Audit cleanup:** the dead `config.loop`, `config.state`, and `brief.askOnlyWhenStuck` are removed, and
the unwired `sessions/` snapshot mechanism is removed entirely (the `PreCompact` hook, `resume`'s
snapshot dependency, and the format docs) — continuity rides on the committed `PROJECT.md` + `ROADMAP.md`
+ `LOG.md`. `/crew:init` and `/crew:setup` now prompt for every workflow gate explicitly.

This is a non-breaking migration: the `/crew:init` / `/crew:setup` / `/crew:update` reconcile carries
existing values losslessly to the new `config.workflow.*` keys via explicit known-migrations (the
0.7.0 → M4 → M5 chain), prompts for genuinely new fields, and flags removed ones — nothing is set
silently or dropped.
