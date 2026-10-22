---
name: roast-me
description: Clarify and challenge a raw idea in rounds of questions, each with a recommended answer, until a Spec can be written. Use in /crew:brief, or when the user says "roast me" or asks to challenge an idea, plan or assumption.
---

# Roast-Me

Turn a raw idea into a decided Spec (goal, requirements, acceptance criteria, out of scope) by walking its decision tree with the user and pushing on the weak spots.

## Rounds

1. **Look before you ask.** Anything the code, the configs, `PROJECT.md` or the web can answer, find out yourself; a wide search can run in an Explore sub-agent while you ask what doesn't hinge on it.
2. **Ask everything that is askable now.** A question is askable once every decision it hangs on is settled: trunk before leaves. Put all askable questions into one round; a question whose options depend on an answer still open in this round waits for the next.
3. **Each question carries a recommendation** with a one-line why, so the user can confirm it at a glance. A recommendation may be "drop this".
   - Closed choices with 2–4 options: `AskUserQuestion`, up to four per call.
   - Open questions, or ones that need a paragraph of context: number them in text and wait for the answers.
4. **Challenge, don't just collect.** Every round, name the assumption the idea leans on hardest and test it: what breaks if it is false, what the cheaper version is, whether it is needed at all. Push harder when the user asks for it.
5. **Recompute after each round.** New answers unlock new questions and retire others. Then run the Spec-Probe: could you write every Spec section now, with no section resting on a guess? If not, ask the next round. If yes, offer one more round or the Spec.
6. **Hold the scope line.** Phase cut, ordering and approach belong to `/crew:plan`: note each such idea for `Notes for planning` and move on.
7. **Close** by restating the Spec and getting the user's confirmation.

The roast is done when the Spec-Probe passes and the user confirms; until then, the next round is the next step.

## Outside /crew:brief

Works without `.planning/`: run the same rounds and give the clarified result back in the conversation. Write files only when asked; to capture it as crew state, point to `/crew:brief`.
