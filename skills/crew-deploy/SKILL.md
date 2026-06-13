---
name: crew-deploy
description: How crew turns a verified commit into a release/deployment — the config.deploy mode contract (off/orchestrate/execute), composition with config.git as the ceiling, provider handling (gh/glab), and the safety rules. Use during /crew:ship.
origin: crew
---

# crew Deploy & Release

`/crew:ship` carries a verified change from the repo to a release (and optionally a deployment). Behavior is config-driven via `config.deploy` and **bounded by** `config.git`.

## The `mode` contract (`config.deploy.mode`)

| mode | what ship does |
|---|---|
| `off` | Nothing — explain how to enable, then stop. |
| `orchestrate` *(default)* | Drive the **release**: version → release commit → tag → push → PR. The **deployment** itself is the CI pipeline's job (crew never touches prod). |
| `execute` | `orchestrate` **plus** run the deploy command from `.planning/DEPLOY.md` (after confirmation). |

## `config.git` is the ceiling

`deploy.mode` says what ship may *attempt*; `config.git` says whether each git step is auto / ask / off. **ship never bypasses `config.git`:**

- **Release commit** — follow `git.commitStyle`; if `git.autoCommitPerPhase` is false (the auto-vs-ask signal), **ask** before committing. A release needs a commit to tag.
- **Push** (commit + tag) — defer to `git.autoPush` (default false → **ask**). On decline, stay local: `version+commit+tag` is still a valid partial result.
- **PR** — defer to `git.autoPR` (default false → **ask** or skip, just push). Use the provider CLI.
- **Branch / merge** — honour `branchPattern`, `mergeStrategy`, `askBeforeMerge` (see `git-merge`).

Even when an `auto*` flag is true, `crew-conventions` still applies — `true` just means the user pre-authorized that step.

## Providers

- **`gh-actions`** — push triggers the workflow; open PRs and read run status via the `gh` CLI.
- **`gitlab-ci`** — push triggers the pipeline; use the `glab` CLI for MRs and pipeline status.

If the provider CLI is missing or unauthenticated, **explain and stop** — do not guess credentials or skip silently.

## Safety

- **Never ship on a red verify.** Gate on the last `verify` result in `LOG.md`; if not green, route to `/crew:verify` and stop.
- **Remote and prod actions are deliberate steps** — confirm each per `crew-conventions`; never push, open a PR, or deploy silently.
- **The deploy command comes from `.planning/DEPLOY.md`** (user-controlled), never guessed by crew.
- **Record** every ship to `LOG.md` (version, tag, push/PR/deploy outcome).

## `.planning/DEPLOY.md`

The project's release knowledge (committed when `.planning/` is): release strategy, branch/tag conventions, environments, secrets *policy* (pointers, never values), rollback procedure, and the deploy command(s) (for `mode: execute`). Offered at `/crew:init` when `mode ≠ off`.
