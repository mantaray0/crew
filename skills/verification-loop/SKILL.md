---
name: verification-loop
description: How crew verifies a change — the verify → review → harden → simplify pipeline, run in fresh contexts, with config-driven steps and model selection. Use after implementing any phase.
origin: crew
---

# Verification Loop

Every implemented phase passes through a verification pipeline before it is trusted and committed. Steps are config-driven (`config.verify`, per-phase override) and each runs in a **fresh sub-agent context** so the verifier isn't biased by the implementer's reasoning.

## The stages

1. **verify** — run tests / build / typecheck (commands from `PROJECT.md`). Test-strictness from `config.testing.policy` (an `api-service` archetype may require TDD; a `marketing-site` may be optional).
2. **review** — `code-reviewer` + stack reviewers selected by the project's `tags`.
3. **harden** — `silent-failure-hunter` (swallowed errors) + `type-design-analyzer` (illegal states).
4. **simplify** — `code-simplifier` (behavior-preserving cleanup; tests stay green).

**Security** is *not* a default stage. The planner recommends it when scope is sensitive (auth/payments/tokens); it runs only with approval.

## Rules

- **Findings loop:** Critical/Important findings → fix → re-verify the affected stage. Do not proceed with open Critical/Important findings.
- **Fresh context:** dispatch each stage as its own sub-agent with only the diff + the relevant convention; don't inherit the implementer's context.
- **Model selection:** pick the model per `model-management` (review → strong, simplify → mid, trivial → cheap; `auto` decides, `manual` uses the configured map).
- **Record:** write the outcome (and token/cost if `observability.trackCost`) to `log.md`.
- **Block the commit** until the pipeline is green or findings are consciously waived by the user.
