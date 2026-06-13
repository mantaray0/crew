---
"@mantaray0/crew": minor
---

Use the underscore number↔name separator for phase and ticket plan files too

Completes the separator unification started in 0.9.0 (milestone folders). Phase and ticket plan files now join their id to the title with an underscore — `<id>_<title>.md` (e.g. `1.2_db-schema.md`, `LIN-42_realtime-notifications.md`) instead of `<id>-<title>.md`. With this, every crew name follows one rule: `_` separates a number/id from its kebab name, `.` is reserved for the phase hierarchy inside an id (`1.2` = phase 2 of milestone 1), and `-` is reserved for the words inside a kebab name.

Existing projects: rename phase files manually (`<id>-<title>.md` → `<id>_<title>.md`); `/crew:init` reconcile offers the plans-layout migration. Reads are unaffected — commands glob `plans/**/*.md` and match phases by id, not by exact filename.
