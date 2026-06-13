---
description: Carry a verified change to a release — version, commit, tag, push, PR, and (when enabled) deploy — driven by config.deploy and bounded by config.git.
argument-hint: "[environment, optional]"
---

# /crew:ship

Turn a verified commit into a release/deployment. Uses the `crew-deploy`, `crew-conventions`, and `git-merge` skills.

**Follow `crew-conventions`:** every remote/prod action is a deliberate, confirmed step; respond in the user's language.

**`config.git` is the ceiling** — never push, open a PR, or commit in a way `config.git` disables. See `crew-deploy`.

## Steps

1. **Read config.** Read `config.deploy` (mode/provider/tagPattern/environments), `config.git`, and `.planning/DEPLOY.md`. If `config.deploy.mode` is `off`, explain how to enable it (`/crew:init` → deploy, or set `config.deploy.mode`) and **stop**.
2. **Gate on verify.** Check the last `verify` result in `.planning/LOG.md`. If it is not green, recommend `/crew:verify` and **stop** — never ship on a red verify.
3. **Version.** If the repo uses Changesets (`.changeset/`), run the project's version step (e.g. `pnpm version`); otherwise bump per `config.deploy.tagPattern` / the project's convention recorded in `DEPLOY.md`.
4. **Release commit.** Stage the version/changelog changes and commit using `config.git.commitStyle`. If `config.git.autoCommitPerPhase` is false, **ask** before committing.
5. **Tag.** Create the tag from `config.deploy.tagPattern` (e.g. `v1.4.0`).
6. **Push.** Push the commit and tag — **only if `config.git.autoPush`**; if false, **ask**. On decline, stop here and report the local result (version + commit + tag are valid).
7. **PR.** Open a PR/MR via the provider CLI (`gh` for `gh-actions`, `glab` for `gitlab-ci`) — **only if `config.git.autoPR`**; if false, **ask** or skip. If the CLI is missing/unauthenticated, explain and stop.
8. **Deploy (mode `execute` only).** Run the deploy command from `.planning/DEPLOY.md` for the target environment (the optional `$ARGUMENTS`, else the default). Confirm first. Never run it on a red verify.
9. **Record.** Append to `.planning/LOG.md`: version, tag, and the push/PR/deploy outcome.

Do not invent deploy commands or credentials — they come from `DEPLOY.md` and the authenticated provider CLI.

## Hand-off

End your reply **in the user's language**, summarizing what shipped (version, tag, where it went) and any step that was skipped because `config.git` disabled it (with the one-line change to enable it next time).
