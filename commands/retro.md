---
description: Retro — distill reusable patterns and decisions from finished work into proposed skills or tags for the global registry.
argument-hint: "[phase/milestone, optional — defaults to recent work]"
---

# /crew:retro

Make the harness learn from completed work so knowledge compounds across projects instead of getting stranded in one repo. Uses the `crew-learn` skill. Active when `config.learn.enabled`.

**Follow `crew-conventions`:** present each learning/skill/tag proposal as an explicit confirm (the user approves each before it's written); respond in the user’s language.

## Steps

1. **Gather.** Review the recent `log.md` entries, the diff(s) of completed phases, and `PROJECT.md` decisions.
2. **Distill.** Identify recurring patterns, decisions, and gotchas worth reusing: a new **skill** (a reusable procedure/knowledge), a new **tag** (a capability that should activate certain skills/rules), or an update to `PROJECT.md`'s decisions.
3. **Propose, don't impose.** Present concrete proposals: "Add skill `X` (here's the draft)", "Add tag `Y` mapping to skills `[…]`", "Record decision Z in PROJECT.md". The user confirms each.
4. **Apply on approval.** Write approved skills/tags into the global registry (`~/.claude/crew/` — `project-types.json` for tags, the skills directory for skills) and/or update `PROJECT.md`.
5. **Summarize** what was learned and what was promoted.

Keep proposals high-signal — only things genuinely worth reusing. Don't manufacture learnings.
