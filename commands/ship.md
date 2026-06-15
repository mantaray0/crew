---
description: Carry a verified change to a release — version, commit, tag, push, PR, and (when enabled) deploy — driven by config.workflow.ship and bounded by config.git.
argument-hint: "[environment, optional]"
---

# /crew:ship

Turn a verified commit into a release/deployment. Uses the `deploy`, `crew-conventions`, and `git-merge` skills.

**Follow `crew-conventions`:** every remote/prod action is a deliberate, confirmed step; respond in the user's language.

**`config.git` is the single git authority** — every git step (commit/push/PR/merge) defers to `config.git`; ship has no deploy-specific push axis. See `deploy`.

As the **Ship step** of the `/crew:finish` close-out strand its gate is `config.workflow.ship.run` (`off|ask|auto|smart`), but `config.git` stays the sole push/PR authority regardless of `run`. When invoked directly, apply the canonical **Catch-up rule** (`crew-conventions`) — offer any missing earlier close-out step per its `run`.

## Steps

1. **Read config.** Read `config.workflow.ship` (enabled/provider/tagPattern/environments/runDeploy/releaseTool/finishRelease), `config.git`, and `reference/deploy.md` (if present). If `config.workflow.ship.enabled` is `false`, explain how to enable it (`/crew:init` → deploy, or set `config.workflow.ship.enabled`) and **stop**. Resolve `releaseTool` — if `auto`, detect it from the repo per `deploy` → Release mechanics.
2. **Gate on verify.** Check the last `verify` result in `.planning/LOG.md`. If it is not green, recommend `/crew:verify` and **stop** — never ship on a red verify.
3. **Release per `releaseTool`** (see `deploy` → Release mechanics; every git step defers to `config.git`):
   - **`manual`** — version locally (`npm version` / language equivalent, command from `reference/deploy.md`) → release commit (`config.git.commitPattern`; if `autoCommitPerPhase` is false, **ask**) → tag from `config.workflow.ship.tagPattern` (e.g. `v1.4.0`).
   - **`changesets` / `release-please`** — **no** local bump or tag. For `changesets`: ensure a changeset exists (`.changeset/*.md` other than `README`/`config`); if none, offer `changeset add` or **stop**. Commit it if uncommitted. (release-please needs no file — it reads Conventional Commits.)
   - **`semantic-release`** — no version/commit/tag here; CI does it. Proceed to push.
   - **`none`** — no version/tag; commit only if there are staged changes.
4. **Push.** Push the commit (and tag, for `manual`) — **only if `config.git.autoPush`**; if false, **ask**. On decline, stop here and report the local result. In a push-triggered setup this push is the deploy/release trigger — that is why it is the user's call.
5. **PR.** Open a PR/MR via the provider CLI (`gh` for `gh-actions`, `glab` for `gitlab-ci`) — **only if `config.git.autoPR`**; if false, **ask** or skip. If the CLI is missing/unauthenticated, explain and stop.
6. **Finish release (bot-PR tools only, `config.workflow.ship.finishRelease ≠ off`).** For `changesets`/`release-please`: after the push the CI bot opens a version/release-PR. If one is open, merge it per `finishRelease` (`ask` → confirm first, `auto` → proceed) → CI tags + releases. Never on a red verify.
7. **Deploy (only if `config.workflow.ship.runDeploy ≠ off`).** Run the deploy command from `reference/deploy.md` for the target environment (the optional `$ARGUMENTS`, else the default). With `ask`, confirm first; with `auto`, proceed; never run it on a red verify.
8. **Record.** Append to `.planning/LOG.md`: version, tag, and the push/PR/release/deploy outcome.

Do not invent deploy commands or credentials — they come from `reference/deploy.md` and the authenticated provider CLI.

## Hand-off

End your reply **in the user's language**, summarizing what shipped (version, tag, where it went) and any step that was skipped because `config.git` disabled it (with the one-line change to enable it next time).
