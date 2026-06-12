---
name: crew-planning
description: Conventions for crew roadmaps and plans — milestone/phase structure, status markers, inter-phase dependencies, and the spec-head-in-plan format. Use when writing or adjusting ROADMAP.md and plans/.
origin: crew
---

# crew Planning Conventions

## ROADMAP.md

Plain Markdown, milestones → phases. Status markers:

- `[ ]` open · `[>]` active (claimed) · `[x]` done (append ` — erledigt YYYY-MM-DD`) · `[~]` deferred

```markdown
## Meilenstein 1: Fundament
- [x] 1.1 Backend-Struktur     — erledigt 2026-06-12
- [>] 1.2 DB-Schema (Drizzle)  @worktree-a
- [ ] 1.3 Auth                 (depends: 1.2)
```

Phases are identified by their heading text, **not** by rigid numbers — so inserting/reordering (via `/crew:adjust`) is a text edit, never a renumber. Each phase should be independently mergeable. Record dependencies inline (`depends: …`) so `/crew:dispatch` can build a DAG and parallelize independent phases.

## plans/<slug>.md

One file, two layers (no separate spec file unless `clarify.specArtifact: "separate"`):

```markdown
# <Feature/Phase/Ticket>

## Spec          ← the what/why (from /crew:brief or an external ticket)
- Goal / problem
- Requirements
- Acceptance criteria
- Out of scope
- externalRef: <ticket-id>   ← only when pulled via /crew:pull

## Plan          ← the how
- affected files
- Tasks: action / pattern to mirror / validation command
- Risks
- Verify configuration for this phase
```

### Plan file naming

All files live in `plans/`, lowercase, ASCII/kebab slug (even when the *content* is written in another language via `config.language.files`). Two kinds, told apart by the filename:

- **Brief / initiative spec** (`/crew:brief`): underscore-prefixed, **un-numbered** — `_<slug>.md`, e.g. `_multisport-platform-refactor.md`. The phase number does not exist yet (it's assigned at `/crew:plan`), so a brief must not fake one. The leading `_` sorts briefs together and makes them visually distinct from numbered phase plans in the same directory — at a glance you see what's still a raw initiative vs. a planned phase. A brief holds the **Spec** head only; its **Plan** body is filled later.
- **Phase plan** (`/crew:plan`): roadmap phase id + short title — `1.2-db-schema.md`, `2.1-auth-middleware.md`. Sorts naturally and ties straight to the roadmap id.
- **Ticket plan** (`/crew:pull`): external ticket id + title — `LIN-42-realtime-notifications.md`.

When `/crew:plan` breaks a brief into phases, it creates the numbered phase plans (`<id>-<title>.md`); the originating `_<slug>.md` brief stays as the initiative's spec root (delete it only once every phase it spawned is captured).

## Principles

- Mirror existing codebase patterns; reference real files. Activate stack skills from the project's `tags`.
- Keep phases small enough to verify and commit atomically.
- Flag security-sensitive scope (auth/payments/tokens) and **recommend** a security pass — never enable it silently.
- Plans are living documents: `/crew:adjust` rewrites them freely as understanding changes.
