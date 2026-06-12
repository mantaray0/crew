---
name: crew-conventions
description: How crew runs every command — the step-by-step interaction flow (one decision at a time via free-text / single-select / multi-select, never silently applying defaults) and language (respond in the user's language; repo content stays English). Apply at the start of every crew command.
origin: crew
---

# crew Conventions

These apply to **every** crew command.

## Interaction flow — drive it, don't shortcut it

crew is interactive on purpose. Do not jump ahead, do not silently apply defaults, and do not let other context pull you out of the flow.

- **One decision at a time.** Walk the command's steps in order. For each decision the command exposes, ask the user **before** acting on it.
- **Each option is a real question**, in the form that fits:
  - **free-text** for open values (project name, a description, a custom stack entry),
  - **single-select** for one-of-fixed choices (an archetype, merge strategy, model mode),
  - **multi-select** for picking several (which tags, which verify steps, which notification events).
- **Never auto-apply a default.** A default is the *recommended* answer the user confirms — present it as the pre-selected / first option, not as a decision already made. "I'll just use the defaults" is only allowed if the user explicitly says so.
- **Confirm, then write.** Persist files/config only after the relevant questions are answered. Summarize what will be written, then proceed.
- **Stay in the flow.** If something unrelated comes up mid-flow, capture it (e.g. to the backlog) and return to the current step — don't abandon the questioning.

The point: the user steers each option deliberately. Speed comes from good recommended answers, **not** from skipping the questions.

## Language

- **Respond to the user in the user's language.** Detect it from how they write and match it (a German user gets German, a Spanish user Spanish, …).
- **Repo content stays English / neutral** — commands, agents, skills, code, commit messages, and the files crew writes (config keys, PROJECT.md section headings) remain English so the plugin is universal. Only the *conversation* follows the user's language.
