---
name: roast-me
description: Use during planning to clarify a raw idea — bounded, batched questioning that challenges the idea at a configurable intensity, each question carrying a recommended answer the user can simply confirm. Investigates the codebase instead of asking when answerable.
origin: crew
---

# Roast-Me

Turn a vague idea into a clear, decided spec by walking the decision tree and challenging it — bounded, not an interrogation. The goal is a complete, writable Spec fast.

## How it works

1. **Batched questions via the inline stepper.** Ask co-equal, independent questions together as one `AskUserQuestion` stepper batch (up to 4), submitted at once — not one slow message per question. Each question still **carries a recommended answer** and a one-line why, so the user can confirm at a glance.
2. **Keep the decision tree intact.** Only batch questions that are *independent* (order doesn't matter, no answer changes another's options). When an answer determines whether/which question comes next, put it in a later batch — trunk before leaves.
3. **Investigate, don't ask, when you can.** If the answer is in the codebase, configs, or `PROJECT.md`, go find it instead of asking.
4. **Challenge at the configured intensity** (`config.clarify.intensity`):
   - `gentle` — pure clarification: fill gaps, recommend a default, don't push back.
   - `normal` *(default)* — push on the load-bearing weak spots, name obvious scope-creep, question one or two load-bearing assumptions. A recommendation may be "drop this".
   - `brutal` — attack assumptions ("do you actually need this?"), surface contradictions, steelman cutting scope, name every scope risk.

   The recommended answer carries in *every* intensity.
5. **Respect breadth** (`config.clarify.depth`, orthogonal to intensity): `light` = only the load-bearing questions; `normal` = the decision tree's main branches; `deep` = edge cases and failure modes too.
6. **Stop on the Spec-Probe.** After each batch, check internally: *can I now write the full Spec — goal, requirements, acceptance, out-of-scope?* As soon as yes, stop and show the Spec. Baseline ~3–5 questions; the **maximum scales with complexity — you decide it, no fixed cap.** After each batch, offer the exit: *"Enough for a Spec, or dig deeper?"* The user can always say "enough" and move on.
7. **Hold the scope line.** Structural / sequencing / phasing ideas belong to `/crew:plan`, not the brief — capture them ("that's `/crew:plan`, noted") instead of deciding them here.
8. **Close with a summary.** Restate the decided Spec (goal, requirements, acceptance, out-of-scope) and get a final confirm.

## Anti-patterns

- Asking what you could look up.
- Dribbling one question per message when several independent ones could be a single stepper batch.
- Batching *dependent* questions whose later options hinge on an earlier answer.
- Continuing to grill after the Spec is fully writable.
- Deciding structure / sequencing in the brief (that's planning).
- Open-ended questions with no recommended default.
