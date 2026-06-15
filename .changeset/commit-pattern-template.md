---
"@mantaray0/crew": minor
---

Rename `config.git.commitStyle` to `config.git.commitPattern` and let it take a free template.

The field was effectively single-value (`"conventional"`). It is renamed to `commitPattern` and now accepts either the `"conventional"` keyword shortcut (`type(scope): subject`) or a free template with placeholders `{type}`/`{scope}`/`{ticket}`/`{subject}`/`{body}` — e.g. `"[{type}] {ticket}: {subject}"`, where an empty optional placeholder and its adjacent separators collapse. A Known-migration carries an existing `commitStyle` value 1:1 onto `commitPattern` (the old value stays valid as the shortcut). The commit steps in `/crew:execute`, `/crew:quick`, `/crew:ship`, the `deploy` skill, and the README now reference `config.git.commitPattern`.
