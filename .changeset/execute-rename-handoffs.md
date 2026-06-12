---
"@mantaray0/crew": minor
---

Rename `/crew:next` to `/crew:execute` (no alias — `/crew:next` no longer exists) so the core execution command reads unambiguously, and update every cross-reference in commands, skills, the README, and the design spec. Add a **Hand-off** section to the main-chain commands (`setup`, `init`, `brief`, `plan`, `execute`, `pull`, `retro`): each now ends by prompting the user, in their language, to `/clear` the context and run the next logical command.
