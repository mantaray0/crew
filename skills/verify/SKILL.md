---
name: verify
description: How crew verifies a change — the test → review → harden → simplify pipeline, run in fresh contexts, with config-driven steps and model selection. Use after implementing any phase.
origin: crew
---

# Verification Loop

Every implemented phase passes through a verification pipeline before it is trusted and committed. Steps are config-driven (`config.workflow.execute.verify`, per-phase override) and each runs in a **fresh sub-agent context** so the verifier isn't biased by the implementer's reasoning.

## The stages

1. **test** — run tests / build / typecheck (commands from `PROJECT.md`). Test-strictness from `config.testingPolicy` (an `api-service` archetype may require TDD; a `marketing-site` may be optional).
2. **review** — `code-reviewer` + stack reviewers selected by the project's `tags`.
3. **harden** — `silent-failure-hunter` (swallowed errors) + `type-design-analyzer` (illegal states).
4. **simplify** — `code-simplifier` (behavior-preserving cleanup; tests stay green).

**Security** is *not* a default stage. The planner recommends it when scope is sensitive (auth/payments/tokens); it runs only with approval.

## Rules

- **Findings loop:** Critical/Important findings → fix → re-verify the affected stage. Do not proceed with open Critical/Important findings.
- **Fresh context:** dispatch each stage as its own sub-agent with only the diff + the relevant convention; don't inherit the implementer's context.
- **Model selection:** pick the model per `model-management` (review → strong, simplify → mid, trivial → cheap; `auto` decides, `manual` uses the configured map).
- **Record:** write the outcome (and token/cost if `observability.trackCost`) to `LOG.md`.
- **Block the commit** until the pipeline is green or findings are consciously waived by the user.
- **The pipeline is advisory, not binding — the executor owns it.** review/harden/simplify run in fresh contexts *without* the plan's Risk section, so they can't see which invariants are load-bearing. `simplify` in particular optimizes locally for brevity and may cut a load-bearing invariant (a read-only guard, a non-interference rule, a safety boundary). The main (executing) context holds the intent: weigh each finding, **apply** the ones that strengthen the change, and **consciously reset** any that would erase an intended invariant — noting the decision in `LOG.md`. A phase plan may drop `simplify` (or `harden`) via `perPhaseOverride` exactly when that risk is high (e.g. prose/instruction files whose guard sentences are the deliverable).

## Standalone usage

A second entry point: run the pipeline **ad-hoc** on any diff or working tree — "verify this", "review my changes" — without an active phase.

- **State-free.** Don't require a phase plan, a claim, or `.planning/`. Take the target from the user — a diff, staged changes, or the whole working tree — instead of a roadmap phase.
- **Same stages, advisory output.** Run test → review → harden → simplify (or just the subset the user names) in fresh contexts and report findings **in the conversation**. Skip the `LOG.md` write when there's no phase to record against; the findings-loop and advisory-not-binding rules above still apply.
