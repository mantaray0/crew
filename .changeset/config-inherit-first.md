---
"@mantaray0/crew": minor
---

Make config inheritance explicit (inherit-first writes).

`/crew:init`, `/crew:setup`, and the reconcile path (`/crew:update`) previously wrote inheritable config fields into a project/global `config.json` even when the user wanted to inherit them from the layer below — silently decoupling the config from `defaults < global < project`. The write side is now **inherit-first**: every config-driven question offers "take from global" (init) / "take the built-in default" (setup) as its first, pre-selected option, showing the value it currently resolves to; choosing it **omits the key** (dynamic inheritance). An explicitly picked value is **always written, even when equal to the inherited value** — a deliberate freeze against later drift. `responseStyle` is now actively asked instead of blindly seeded, `ship` is asked per leaf field with `enabled` as the gating trunk, and `/crew:init` step 9 drops the "full default config" seeding model for the omit-key model.

The reconcile path gains three distinct ways a field returns to inheritance: a **one-time, version-gated M8 cleanup** that batches a reset of legacy over-seeded fields (runs once at the pre-0.16.0 transition, never recurring), an always-available **per-field reset**, and an **opt-in revisit pass** that re-walks every inheritable/workflow field with the current value pre-selected. The rule is anchored canonically in the `crew-config` skill; init/setup/update reference it rather than duplicating it.
