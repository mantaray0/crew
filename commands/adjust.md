---
description: Change the roadmap mid-flight — insert, reorder, defer or drop phases, or pull a backlog item in.
argument-hint: "[what to change]"
---

# /crew:adjust

Load the `crew-state` skill.

## Steps

1. **Read** `ROADMAP.md`, the affected plan files and the backlog.
2. **Pin down the change** from `$ARGUMENTS`; ask only where it is ambiguous. A phase marked `[>]` is in progress: confirm before moving or dropping it.
3. **Show** the edited roadmap section, then apply it on the user's OK:
   - Edit lines in place, keeping ids, markers and done stamps of untouched phases. Defer = `[~]`.
   - Update `depends:` lines and the affected plan files; a new phase gets its plan file.
   - Reordered milestones: rename their `plans/<n>_<slug>/` prefixes to match.
   - A backlog item pulled in: seed its phase or `_spec.md` from the item, then delete the item file.
