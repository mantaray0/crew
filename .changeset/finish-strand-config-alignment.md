---
"@mantaray0/crew": minor
---

Add a config-gated `/crew:finish` close-out strand and align config sections with workflow-step names.

`/crew:finish` runs the milestone close-out as one strand — **Ship → Retro → Complete** in that fixed
order, each step independently gated by the new `config.finish` block (`off` / `ask` / `auto`; defaults
`ship: off`, `retro: ask`, `complete: ask`). finish orchestrates only: it calls the existing
`/crew:ship`, `/crew:retro`, and `/crew:complete`, invents no logic, keeps `config.git` as the sole git
authority, never ships on a red verify, and only archives once every phase is `[x]`/`[~]`. Every step
ends in exactly one logged outcome (ran / skipped / stopped), so a finish run loses no information
versus running the three commands by hand. `/crew:execute` stays pure plan-execution and now *suggests*
`/crew:finish` at a milestone's end — it never self-ships, self-completes, or self-finishes.

`/crew:complete-milestone` is renamed to **`/crew:complete`**; the old name lives on as a non-breaking
deprecated alias.

The config sections are renamed to match the workflow step they drive — `clarify→brief`,
`execution→execute`, `deploy→ship`, `learn→retro` (`verify` and all cross-cutting sections unchanged).
This is a pure key rename: the `/crew:init` / `/crew:setup` reconcile carries existing values
losslessly to the new keys via explicit known-migrations and prompts for the new `finish` keys — nothing
is set silently or dropped.
