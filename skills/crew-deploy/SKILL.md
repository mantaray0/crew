---
name: crew-deploy
description: How crew turns a verified commit into a release/deployment — config.deploy (enabled + runDeploy), config.git as the single git authority, provider handling (gh/glab), and the safety rules. Use during /crew:ship.
origin: crew
---

# crew Deploy & Release

`/crew:ship` carries a verified change from the repo to a release (and optionally a deployment). Behavior is config-driven via `config.deploy`; **all git mechanics defer to `config.git`** — the single git authority. There is no deploy-specific push axis.

## `config.deploy`

| field | what it does |
|---|---|
| `enabled` *(default `true`)* | Is `/crew:ship` available here? `false` → explain how to enable, then stop. |
| `runDeploy` *(default `off`)* | The only knob `config.git` doesn't cover: run an **imperative** deploy command after the git steps? `off` = push-triggered CI (the push *is* the deploy — nothing extra to run). `ask`/`auto` = imperative world (Vercel/Fly), command from `reference/deploy.md`. |
| `provider` | `gh-actions` (`gh`) or `gitlab-ci` (`glab`). |
| `tagPattern` | Release tag shape, e.g. `v{version}`. |
| `environments` | Optional named environments. |

## `config.git` is the single git authority

ship has **no second push axis**. Every git step defers to `config.git`:

- **Release commit** — follow `git.commitStyle`; if `git.autoCommitPerPhase` is false, **ask** before committing. A release needs a commit to tag.
- **Push** (commit + tag) — defer to `git.autoPush` (default false → **ask**). On decline, stay local: `version+commit+tag` is still a valid partial result.
- **PR** — defer to `git.autoPR` (default false → **ask** or skip). Use the provider CLI.
- **Branch / merge** — honour `branchPattern`, `mergeStrategy`, `askBeforeMerge` (see `git-merge`).

In a push-triggered setup the **push is the prod trigger** — so it belongs to `git.autoPush` (default false → ask), i.e. to the user. That is how "crew never touches prod without approval" holds: not as a slogan, but because the prod-triggering push is gated by the user's git config. Even when an `auto*` flag is true, `crew-conventions` still applies — `true` just means the user pre-authorized that step.

## The imperative deploy step (`runDeploy ≠ off`)

Only when `runDeploy` is `ask` or `auto`: after the git steps, run the deploy command for the target environment, sourced from `reference/deploy.md`. With `ask`, confirm first. Never run it on a red verify. crew never guesses a deploy command.

## Providers

- **`gh-actions`** — push triggers the workflow; open PRs and read run status via the `gh` CLI.
- **`gitlab-ci`** — push triggers the pipeline; use the `glab` CLI for MRs and pipeline status.

If the provider CLI is missing or unauthenticated, **explain and stop** — do not guess credentials or skip silently.

## Safety

- **Never ship on a red verify.** Gate on the last `verify` result in `LOG.md`; if not green, route to `/crew:verify` and stop.
- **Remote and prod actions are deliberate steps** — confirm each per `crew-conventions`; never push, open a PR, or deploy silently.
- **The deploy command comes from `reference/deploy.md`** (user-controlled), never guessed by crew.
- **Record** every ship to `LOG.md` (version, tag, push/PR/deploy outcome).

## `reference/deploy.md`

The project's release runbook — a load-on-demand `reference/` doc (see `crew-context`): release strategy, branch/tag conventions, environments, secrets *policy* (pointers, never values), rollback procedure, and the deploy command(s) (for `runDeploy ≠ off`). `/crew:ship` loads it because shipping touches the deploy area. Offered at `/crew:init` when `deploy.enabled` and `runDeploy ≠ off`.
