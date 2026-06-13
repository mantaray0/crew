---
description: Pull a task from the configured provider (local roadmap or an external PM tool) into a crew plan.
argument-hint: "<task id>"
---

# /crew:pull

Bring a work item into the crew workflow. The internal `.planning/` stays the working layer; an external ticket is the north-star + sync boundary.

**Follow `crew-conventions`:** respond in the user’s language; when a decision is needed, ask it explicitly (single-select / multi-select / free-text) rather than assuming.

## Steps

1. **Resolve the provider.** Read `config.tasks.provider` (`local` · `mcp:linear` · `mcp:jira` · `mcp:clickup` · `crew-pm`). For `local`, the source is `ROADMAP.md`. For an `mcp:*` provider, call the corresponding MCP connector to fetch the ticket by id.
2. **Fetch the work item.** Normalize to `{ id, title, description, acceptanceCriteria, status, externalRef }`.
3. **Create the plan.** Write `.planning/plans/<n>_<milestone-slug>/<id>.md` (in the relevant numbered milestone folder) with the **Spec** head filled from the ticket (title/description → goal/requirements, acceptance criteria), and `externalRef: <id>`. Add a roadmap entry referencing it. The ticket IS the spec — do not re-run roast-me unless the ticket is too thin.
4. **Work it.** Hand off to `/crew:plan` (if it needs phase breakdown) then `/crew:execute`.
5. **Write-back (if `config.tasks.writeBack`).** At phase/milestone boundaries, comment progress and update status on the external ticket via the provider. Sync only at boundaries, not on every edit.

If `config.tasks.provider` is `local`, "pull" just promotes a roadmap/backlog item into an active plan. External providers (linear/jira/clickup/crew-pm) require their MCP connector to be configured.

## Hand-off

When you're done, end your reply **in the user's language** by prompting a clean context before the next step:

> **Done?** Run `/clear` to reset the context, then `/crew:plan` to break it into phases — or `/crew:execute` if it is already a single phase.
