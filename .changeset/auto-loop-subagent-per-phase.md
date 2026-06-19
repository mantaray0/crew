---
"@mantaray0/crew": patch
---

fix(execute): make the sequential auto-loop actually run unattended

`/crew:execute auto` (and a bare `/crew:execute` under `loop: all`) previously
documented a self-continuation via `/clear` + re-invoke "through the SlashCommand
mechanism" — which the platform does not provide: a running command cannot trigger
the built-in `/clear` or re-invoke itself in a cleared context, so the loop always
fell back to the manual hand-off. The auto-loop now runs **one sub-agent per phase**
(implement → verify → commit), strictly sequential on one branch — the same shape as
`dispatch`, only serial and without worktrees. The main context orchestrates (routing,
claim, user-test gate, milestone-end chaining) and stays thin, so each phase gets a
genuinely fresh context. Single-phase runs (`loop: one` or a named id) are unchanged:
they run in the main context and hand the `/clear` to the user.
