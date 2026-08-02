---
name: roast-me
description: Bounded, batched questioning that clarifies and challenges a raw idea at a configurable intensity, each question carrying a recommended answer the user can simply confirm — investigates the codebase instead of asking when answerable. Use during planning, or standalone any time to pressure-test an idea: triggers on "roast me" (optionally with a nickname), "roast my idea/plan", "challenge my idea/plan/assumptions".
origin: crew
---

# Roast-Me

Turn a vague idea into a clear, decided spec by walking the decision tree and challenging it — bounded, not an interrogation. The goal is a complete, writable Spec fast.

## How it works

1. **Batched questions via the inline stepper.** Ask co-equal, independent questions together as one `AskUserQuestion` stepper batch (up to 4), submitted at once — not one slow message per question. Each question still **carries a recommended answer** and a one-line why, so the user can confirm at a glance.
2. **Keep the decision tree intact.** Only batch questions that are *independent* (order doesn't matter, no answer changes another's options). When an answer determines whether/which question comes next, put it in a later batch — trunk before leaves.
3. **Investigate, don't ask, when you can.** If the answer is in the codebase, configs, or `PROJECT.md`, go find it instead of asking.
4. **Challenge at the configured intensity** (`config.workflow.brief.intensity` — **resolve it first**, `crew-conventions` → *Resolve the config before step 1*; when it can't be resolved, or there is no `.planning/` at all, **act as `normal`** — never as "no intensity"):
   - `gentle` — pure clarification: fill gaps, recommend a default, don't push back. **Baseline ~2–4 questions**, no forced challenge round.
   - `normal` *(default)* — push on the load-bearing weak spots, name obvious scope-creep, question one or two load-bearing assumptions. A recommendation may be "drop this". **Baseline ~4–7 questions across at least two rounds.**
   - `brutal` — attack assumptions ("do you actually need this?"), surface contradictions, steelman cutting scope, name every scope risk. **Baseline ~8+ questions across several rounds.**

   Those baselines are **unconditional floors, not targets** — they hold on their own, so the roast never collapses to one or two questions just because a config value was missing. The maximum scales **above** them with complexity (step 6). The recommended answer carries in *every* intensity. These challenge rounds **feed the stop-gate in step 6** — the minimum challenge depth that must be reached before the Spec-Probe may stop: `gentle` = none (clarify only) · `normal` = **at least one** forced challenge round on load-bearing assumptions · `brutal` = **several** mandatory rounds, every load-bearing assumption explicitly attacked.
5. **Respect breadth** (`config.workflow.brief.depth`, orthogonal to intensity — resolve it like `intensity` in step 4; unresolvable ⇒ act as `normal`): `light` = only the load-bearing questions; `normal` = the decision tree's main branches; `deep` = edge cases and failure modes too.
6. **Stop on the Spec-Probe — gated by the intensity's minimum challenge depth (step 4).** After each batch, check internally: *can I now write the full Spec — goal, requirements, acceptance, out-of-scope?* A writable Spec is **necessary but not sufficient** to stop: the abort is allowed only once the step-4 minimum challenge depth for the active `intensity` has been met. Under `normal` that means **never on the first writable draft** — at least one challenge round on the load-bearing assumptions must have happened first; under `brutal`, not until **every** load-bearing assumption has been explicitly attacked across several rounds; under `gentle`, the probe stops as soon as the Spec is writable. Once both hold, stop and show the Spec. The baseline question count is the **floor from step 4** (~2–4 · ~4–7 · ~8+), and the **maximum scales with complexity above it — you decide it, no fixed cap.** After each batch, offer the exit: *"Enough for a Spec, or dig deeper?"* The user can always override and say "enough".
7. **Hold the scope line.** Structural / sequencing / phasing ideas belong to `/crew:plan`, not the brief — capture them ("that's `/crew:plan`, noted") instead of deciding them here.
8. **Close with a summary.** Restate the decided Spec (goal, requirements, acceptance, out-of-scope) and get a final confirm.

## Anti-patterns

- Asking what you could look up.
- Dribbling one question per message when several independent ones could be a single stepper batch.
- Batching *dependent* questions whose later options hinge on an earlier answer.
- Continuing to grill after the Spec is writable **and** the intensity's minimum challenge depth (steps 4/6) is met.
- Deciding structure / sequencing in the brief (that's planning).
- Open-ended questions with no recommended default.

## Standalone usage

A second entry point: invoke this skill **ad-hoc**, outside `/crew:brief`, to pressure-test any raw idea — no project and no `.planning/` state required. Prefix-free natural-language triggers: **"roast me"** (optionally with a nickname), "roast my idea/plan", "challenge my idea/plan/assumptions".

- **State-free.** Don't require `PROJECT.md`, a milestone folder, or a roadmap. If a `.planning/` brief context happens to exist, use it; otherwise work purely from what the user gives you.
- **Output inline.** Walk the same decision tree and challenge at the configured `intensity` (default `normal`, honouring the step-6 stop-gate), then hand the clarified result back **in the conversation** — a tight summary of the decided points. Don't write `PROJECT.md` or a `_spec.md` unless asked; if the user wants to capture it into crew's state, point them at `/crew:brief` → `/crew:plan`.
