# crew Task Providers, Retro, Notifications & Report — Plan 6 (record)

**Goal:** connect external/internal work sources, let the harness learn, notify the user, and report effort.

**Shipped:**
- **Commands** (content): `/crew:pull` (task-provider import → plan), `/crew:retro` (distill skills/tags), `/crew:report` (token/cost + progress).
- **Skill** `crew-learn` (content): high-signal distillation into skills/tags/PROJECT.md.
- **Notifications:** `hooks/scripts/notify.mjs` (best-effort OS/push, config-gated, never throws) wired on `Notification` (blocker) and `Stop` (completion) in `hooks/hooks.json`.
- **Code (tested):**
  - `src/tasks/provider.ts` — `WorkItem`, `localList` (roadmap-backed), `getProvider` (local now; mcp:* throw "not available").
  - `src/report/aggregate.ts` — `aggregateLog` (phases/tokens/cost from log.md).

**Verification:** 46 tests green, typecheck + lint clean.

**Deferred (follow-on, per spec §15):** external PM adapters (mcp:linear/jira/clickup) read+write-back, the own PM tool (`crew-pm` provider), stack-specific skills (hono/drizzle/tanstack/…). The abstraction is in place; only `local` is built.
