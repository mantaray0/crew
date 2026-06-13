---
"@mantaray0/crew": patch
---

Sync the README command catalog and shared references with the unified command surface: `/crew:dispatch` is gone everywhere in favor of `/crew:execute dispatch` (now documented alongside the `auto` mode), `/crew:update` is listed, `/crew:backlog` shows its new `[idea | list | new | empty]` args, and the `finishRelease` default reads `off`. The session-start config-drift notice now points at `/crew:update` (was `/crew:init`).
