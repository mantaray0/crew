---
"@mantaray0/crew": minor
---

Parametrize `/crew:backlog` per the command-naming convention: `add` is now the default verb. `/crew:backlog <text>` adds directly (unchanged), `list` lists and triages (the former bare-call behavior, now explicit), `new` is an alias for the add flow, and a bare `/crew:backlog` now prompts for the idea and adds it. `argument-hint` and description updated to match.
