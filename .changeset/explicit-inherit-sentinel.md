---
"@mantaray0/crew": minor
---

Introduce an `"inherit"` sentinel to make config inheritance visible in the file.

A fresh `config.json` is now written in **full inherit form**: every inheritable leaf is present, each either a concrete value (a **freeze**) or the sentinel `"inherit"` — so you can see *which* knobs exist and *that* they inherit, instead of inheritance being implied by an absent key. The tri-rule: a concrete value freezes, `"inherit"` dynamically inherits the layer below, and a **missing key is identical to `"inherit"`** — existing minimal configs keep working unchanged. What each inheriting field resolves to, and from where, is surfaced by `/crew:status` and the `/crew:update` reconcile report (`` `language.files`: inherit → `de` (from global) ``). A reader never yields `"inherit"` as an effective value; a `validate-plugin` guard enforces that the defaults layer stays concrete. `/crew:update` can **offer once** to expand a minimal pre-sentinel config to the full inherit form (opt-in, lossless — existing freezes untouched).

Flatten `testing.policy` to a top-level `testingPolicy` leaf. The single-field `testing` section becomes one ordinary inherit-first leaf (beside `language`/`security`/`responseStyle`); the migration carries the existing value 1:1 (`from-archetype`/`tdd`/`tests-required`/`optional`), never silently dropped.

Updated: the `crew-config` skill (schema/contract), `/crew:init`, `/crew:setup`, `/crew:update`, `/crew:status`, the notify hook, and the README.
