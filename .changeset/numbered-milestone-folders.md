---
"@mantaray0/crew": minor
---

Number milestone plan folders as `<n>_<slug>`

Milestone plan folders are now prefixed with the milestone number using an underscore separator (e.g. `plans/1_fundament/`) so they sort correctly and reveal which milestone they belong to while collapsed. The underscore keeps the number↔name separator distinct from the dot used for phase ids (`1.2` = phase 2 of milestone 1) and the hyphen used in the kebab slug. Phase plan files are unchanged (`<id>-<title>.md`, e.g. `1.2-db-schema.md`).

Existing projects: rename folders manually (`<slug>/` → `<n>_<slug>/`); no automatic migration prompt was added.
