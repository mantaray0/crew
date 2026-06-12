# crew Verify Pipeline, Agents & Model Management — Plan 4 (record)

**Goal:** the verify pipeline (verify → review → harden → simplify), the specialist agents it dispatches, and config-driven model selection.

**Shipped:**
- **Agents** (`agents/*.md`, content): `architect`, `code-explorer`, `code-reviewer`, `security-reviewer`, `code-simplifier`, `silent-failure-hunter`, `type-design-analyzer`, `build-error-resolver`, `typescript-reviewer`, `react-reviewer`, `database-reviewer`. Each carries a task-type; default `model` overridable by config.
- **Command** `commands/verify.md` (`/crew:verify`): runs the pipeline in fresh contexts per `config.verify`; selects reviewers by project `tags`; security pass only on recommendation+approval.
- **Skills** `skills/verification-loop`, `skills/model-management` (content).
- **Code (tested):** `src/models/resolve.ts` — `resolveModel(config, taskType, override?)` with precedence override > manual-map > auto-tier. 6 tests.

**Verification:** full suite green, typecheck + lint clean.

**Out of scope (later):** Plan 5 parallelism/merge + `/crew:{dispatch,quick,rollback}`; Plan 6 providers/retro/notifications/report. The verify pipeline is invoked by `/crew:next` (Plan 3) — that forward reference now resolves.
