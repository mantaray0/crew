---
"@mantaray0/crew": minor
---

Simplify the spec model to a single source of truth.

`_spec.md` is now a **permanent** milestone Spec, co-located with `_roadmap.md` in the milestone folder — it owns the intent (goal/why, requirements, acceptance, out-of-scope) for the life of the milestone and is no longer described as a temporary artifact that "may be removed" after planning. `/crew:plan` no longer copies a full `## Spec` head into each phase file; instead every phase plan carries a short **Scope of this phase** note plus a **reference** to `_spec.md`, ending the duplication and drift between the brief and the phase plans. The ROADMAP milestone section stays lean (title + one-line hook + phase list), so the intent has exactly one home.

The `config.workflow.brief.specArtifact` option (`section` | `separate` | `off`) is **removed**. On reconcile it is dropped with a note; a previously set `off` is ignored, since `_spec.md` is now always written. Documented as a known config migration alongside the other removed keys.

`/crew:brief`, `/crew:plan`, `/crew:adjust`, the `architect` agent, the `planning`/`crew-config`/`crew-context` skills, and the README (prose and tree) are updated to the new model. Existing phase files from earlier milestones are left untouched — the new model applies from here on.
