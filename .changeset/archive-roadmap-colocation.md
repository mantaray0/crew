---
"@mantaray0/crew": minor
---

Co-locate the archived roadmap inside its milestone folder.

Archiving a milestone now writes its former ROADMAP section into the moved folder as
`archive/plans/<n>_<slug>/_roadmap.md` (beside `_spec.md` and the phase plans) instead of a flat
`archive/roadmap-<n>_<slug>.md` file next to it — one milestone = one folder, consistent with the
`_spec.md` meta-file idiom. The "file kinds" convention is generalized so that a leading underscore
marks a meta file (never a phase), covering `_spec.md`, `_roadmap.md`, and future `_*.md`. Existing
flat archives stay as-is (the new layout applies from now on).
