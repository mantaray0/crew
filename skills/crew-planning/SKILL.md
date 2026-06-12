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
- Ziel / Problem
- Anforderungen
- Akzeptanzkriterien
- Out of Scope
- externalRef: <ticket-id>   ← only when pulled via /crew:pull

## Plan          ← the how
- betroffene Dateien
- Tasks: Action / Muster zum Spiegeln / Validierungsbefehl
- Risiken
- Verify-Konfiguration dieser Phase
```

## Principles

- Mirror existing codebase patterns; reference real files. Activate stack skills from the project's `tags`.
- Keep phases small enough to verify and commit atomically.
- Flag security-sensitive scope (auth/payments/tokens) and **recommend** a security pass — never enable it silently.
- Plans are living documents: `/crew:adjust` rewrites them freely as understanding changes.
