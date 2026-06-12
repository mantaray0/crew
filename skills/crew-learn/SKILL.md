---
name: crew-learn
description: How crew turns finished work into reusable assets — distilling patterns/decisions into proposed skills, tags, or PROJECT.md updates. Use during /crew:retro.
origin: crew
---

# crew Learn

The harness should get better with every project. After completed work, distil what is worth reusing — but propose, never auto-impose.

## What to look for

- **A reusable procedure** → a new **skill** (e.g. "how we wire BullMQ workers"). Draft it in the skill format (frontmatter `name`/`description`/`origin: crew` + concise body).
- **A capability that should pull in skills/rules** → a new or extended **tag** in the global registry (`project-types.json`). E.g. a `realtime` tag that activates a websocket skill.
- **A decision worth remembering** → an entry in the project's `PROJECT.md` (the *why*), so it isn't relitigated.

## Rules

- **High-signal only.** Promote things that will plausibly recur. Don't manufacture learnings to look productive.
- **Propose with the artifact.** Show the actual draft skill / tag mapping / decision text; the user confirms each.
- **Write on approval.** Skills/tags go to the global layer (`~/.claude/crew/`) so all projects benefit; decisions go to the project's `PROJECT.md`.
- **Close the loop.** A learning that becomes a tag should, on the next `crew init` of a matching archetype, activate automatically.
