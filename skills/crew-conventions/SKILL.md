---
name: crew-conventions
description: How crew runs every command — the step-by-step interaction flow (one decision at a time via free-text / single-select / multi-select, never silently applying defaults) and language (respond in the user's language; repo content stays English). Apply at the start of every crew command.
origin: crew
---

# crew Conventions

These apply to **every** crew command.

## Interaction flow — drive it, don't shortcut it

crew is interactive on purpose. Do not jump ahead, do not silently apply defaults, and do not let other context pull you out of the flow.

- **Surface every decision — batch the independent ones.** Walk the command's steps in order and ask the user **before** acting on any decision. **Bundle independent decisions into one `AskUserQuestion` stepper batch** — questions whose order doesn't matter and whose options don't depend on each other (clarification gray-areas, multi-field setup forms). **Stay sequential** as soon as one decision's options hinge on a prior answer (a decision-tree branch) or it is a confirm-then-write gate. Batching is for *co-equal* questions — never an excuse to skip a question or silently apply a default.
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
- **The plugin repo stays English / neutral** — commands, agents, skills, code, commit messages, and config keys remain English so the plugin is universal.
- **The user's project files follow `config.language.files`.** The content crew writes into a project — `PROJECT.md`, `ROADMAP.md`, `LOG.md`, `BACKLOG.md`, `plans/` — is written in `config.language.files` (default `"en"`). Ask for it at `/crew:setup` (global default) or `/crew:init` (per project). Section headings / structure stay stable; the prose follows the chosen language.

## Response style

Honour `config.responseStyle` (resolved project-over-global; default `"concise"`) in every command reply:

- **`concise`** — lead with the conclusion. Prefer a **table** for comparisons, findings, option lists, and trade-offs; keep surrounding prose to a few lines. No preamble, no restating the question.
- **`detailed`** — full narrative prose: show reasoning, walk through findings, explain trade-offs at length.
- **`auto`** — choose per content: a table when the content is a structured comparison/finding list, prose when it's a narrative explanation.

This governs *format and length only*. It never changes the interaction flow above — you still ask one decision at a time and never skip questions, whatever the style. If no config is present (e.g. outside a crew project), default to `concise`.
