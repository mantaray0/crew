---
description: Carry a verified change to a release — version, commit, tag, push, PR, and (when enabled) deploy — driven by config.deploy and bounded by config.git.
argument-hint: "[environment, optional]"
---

# /crew:ship

Turn a verified commit into a release/deployment. Uses the `crew-deploy`, `crew-conventions`, and `git-merge` skills.

**Follow `crew-conventions`:** every remote/prod action is a deliberate, confirmed step; respond in the user's language.

**`config.git` is the single git authority** — every git step (commit/push/PR/merge) defers to `config.git`; ship has no deploy-specific push axis. See `crew-deploy`.

## Steps

1. **Read config.** Read `config.deploy` (enabled/provider/tagPattern/environments/runDeploy), `config.git`, and `reference/deploy.md` (if present). If `config.deploy.enabled` is `false`, explain how to enable it (`/crew:init` → deploy, or set `config.deploy.enabled`) and **stop**.
2. **Gate on verify.** Check the last `verify` result in `.planning/LOG.md`. If it is not green, recommend `/crew:verify` and **stop** — never ship on a red verify.
3. **Version.** If the repo uses Changesets (`.changeset/`), run the project's version step (e.g. `pnpm version`); otherwise bump per `config.deploy.tagPattern` / the project's convention recorded in `reference/deploy.md`.
4. **Release commit.** Stage the version/changelog changes and commit using `config.git.commitStyle`. If `config.git.autoCommitPerPhase` is false, **ask** before committing.
5. **Tag.** Create the tag from `config.deploy.tagPattern` (e.g. `v1.4.0`).
6. **Push.** Push the commit and tag — **only if `config.git.autoPush`**; if false, **ask**. On decline, stop here and report the local result (version + commit + tag are valid). In a push-triggered setup this push is the deploy trigger — that is why it is the user's call.
7. **PR.** Open a PR/MR via the provider CLI (`gh` for `gh-actions`, `glab` for `gitlab-ci`) — **only if `config.git.autoPR`**; if false, **ask** or skip. If the CLI is missing/unauthenticated, explain and stop.
8. **Deploy (only if `config.deploy.runDeploy ≠ off`).** Run the deploy command from `reference/deploy.md` for the target environment (the optional `$ARGUMENTS`, else the default). With `ask`, confirm first; with `auto`, proceed; never run it on a red verify.
9. **Record.** Append to `.planning/LOG.md`: version, tag, and the push/PR/deploy outcome.

Do not invent deploy commands or credentials — they come from `reference/deploy.md` and the authenticated provider CLI.

## Hand-off

End your reply **in the user's language**, summarizing what shipped (version, tag, where it went) and any step that was skipped because `config.git` disabled it (with the one-line change to enable it next time).
