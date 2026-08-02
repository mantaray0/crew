---
"@mantaray0/crew": minor
---

Fix `workflow.brief.depth`/`intensity` having no effect, and `/crew:brief` drifting away from the `roast-me` skill.

Two independent causes, one symptom — a brief that stopped after a question or two:

- **Nobody resolved the config.** `/crew:brief` and `/crew:plan` were told to "honour `brief.depth`/`intensity`" but never read `config.json`; `crew-conventions` had no rule to, and the session-start hook reads the config only for `crewVersion`. An unresolved field is not "the default" — it is no instruction at all. `crew-conventions` now carries **Resolve the config before step 1**, and `crew-config`'s reader list distinguishes commands that *surface* a value from those that *obey* one.
- **The baseline anchor had gone conditional.** `roast-me`'s question baseline was expressed purely as "scales with `intensity`", so with the value never resolved it anchored on nothing. Each intensity now carries an **unconditional floor** (`gentle` ~2–4 · `normal` ~4–7 across ≥2 rounds · `brutal` ~8+), and an unresolvable value acts as `normal`.

Also:

- `/crew:brief` no longer restates the skill's questioning rules inline — it loads `roast-me` and follows it (the skill is the source of truth).
- `workflow.brief.depth` is now actually asked, at `/crew:init` and `/crew:setup`, batched with `intensity` (it existed in the schema but was unreachable).
- `/crew:plan` states its scope line explicitly: it plans the *how* and deliberately runs no Roast-Me. Structural ideas the brief parks now survive the `/clear` between the two commands via an optional **`Notes for planning`** section in `_spec.md` — input for planning, never a requirement.
- README: fixed "one question at a time" (it is batched), documented `intensity` beside `depth`.
