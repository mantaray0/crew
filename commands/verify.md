---
description: Run the verify pipeline on the current change — test → review → harden → simplify — in fresh sub-agent contexts, per config.
argument-hint: "[phase id or 'diff', optional]"
---

# /crew:verify

Explicitly run the verification pipeline (it also runs automatically inside `/crew:execute` per `config.workflow.execute.verify`). Uses the `verify` skill.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

1. **Scope.** Determine what to verify: the current uncommitted diff, or a named phase's change.
2. **Resolve steps.** Read `config.workflow.execute.verify.default` (and any phase override). Default: `["test","review","harden","simplify"]`.
3. **Run each step in a fresh sub-agent context**, choosing the model per `config.models` (see `model-management`):
   - **test** — run the project's tests / build / typecheck (from `PROJECT.md`); test-strictness per `config.testing.policy`.
   - **review** — dispatch `code-reviewer` plus stack reviewers matching the project's `tags` (`typescript-reviewer`, `react-reviewer`, `database-reviewer`).
   - **harden** — dispatch `silent-failure-hunter` and `type-design-analyzer`.
   - **simplify** — dispatch `code-simplifier`.
4. **Security (conditional).** If the change touches sensitive areas (auth/payments/tokens) and the user approved a security pass, dispatch `security-reviewer`. Never run it automatically (`config.security.auto` is false by default).
5. **Resolve findings.** Critical/Important findings are fixed (re-dispatch the implementer or fix), then re-verified, before the phase can be committed. Minor findings are listed.
6. **Summarize.** Report per-step results and the final state (green/blocked). Record the outcome in `LOG.md`.
