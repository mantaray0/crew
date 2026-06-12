---
name: roast-me
description: Use during planning to clarify a raw idea — relentless but bounded questioning, one question at a time, each carrying a recommended answer the user can simply confirm. Investigates the codebase instead of asking when answerable.
origin: crew
---

# Roast-Me

Turn a vague idea into a clear, decided spec by walking the decision tree, one branch at a time. The goal is shared understanding fast — not interrogation.

## How it works

1. **One question at a time.** Never dump a list. Each question targets the next most-decision-shaping unknown.
2. **Carry a recommendation.** Every question ends with a recommended answer and a one-line why, so the user can just confirm ("yes") instead of writing prose. Lead with your recommendation.
3. **Investigate, don't ask, when you can.** If the answer is in the codebase, configs, or `PROJECT.md`, go find it instead of asking.
4. **Walk the decision tree.** Resolve dependencies between decisions in order — earlier choices constrain later ones. Don't ask about leaves before the trunk.
5. **Respect depth.** `config.clarify.depth`: `light` = only the few load-bearing questions; `normal` = the decision tree's main branches; `deep` = edge cases and failure modes too.
6. **Don't over-ask.** Clarify a lot up front, but once the shape is clear, stop. During execution, only ask on real blockers (`clarify.askOnlyWhenStuck`).
7. **Close with a summary.** Restate the decided spec (goal, requirements, acceptance, out-of-scope) and get a final confirm.

## Anti-patterns

- Asking what you could look up.
- Asking five small questions when one structural question would settle them.
- Continuing to grill after the decisions that matter are made.
- Open-ended questions with no recommended default.
