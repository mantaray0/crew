---
"@mantaray0/crew": minor
---

Add `/crew:update` — a dedicated, findable entry point for the config reconcile that previously hid inside the re-run modes of `/crew:init` and `/crew:setup`. Covers project and (when present) global config; delegates to the `crew-config` reconcile procedure instead of duplicating it.
