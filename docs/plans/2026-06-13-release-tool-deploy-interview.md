# Release-Tool + Deploy/Release-Interview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `config.deploy.releaseTool` + `finishRelease`, branch `/crew:ship` by release tool (replacing the hardcoded Changesets check), and turn `/crew:init` into an active deploy/release interview that also creates `reference/deploy.md` — with `/crew:setup` capturing the global axis defaults.

**Architecture:** Markdown-first plugin — all changes are edits to skill/command docs; the prose IS the contract. No compiled code, no unit tests. Verification is **consistency-grep**: each edit proves the new vocabulary (`releaseTool`, `finishRelease`) is present and the old hardcoded Changesets detection is gone. `crew-config` is the contract (edited first), `crew-deploy` carries the mechanics, the commands consume them.

**Tech Stack:** Markdown (skills/commands), Changesets (release), grep (verification). Repo content stays English; spec/plan docs are German per repo convention.

**Spec:** `docs/specs/2026-06-13-release-tool-deploy-interview-design.md`

---

## File Structure

| File | Responsibility after this change |
|---|---|
| `skills/crew-config/SKILL.md` | Contract: `deploy` schema gains `releaseTool` + `finishRelease`; explainer table gains two rows. |
| `skills/crew-deploy/SKILL.md` | Conventions: `config.deploy` table gains two rows; new **Release mechanics** section (per-tool ship behavior, `auto` detection, phase-2 rule). |
| `commands/ship.md` | Pipeline branches version/commit/tag by `releaseTool`; new phase-2 (`finishRelease`) step. |
| `commands/init.md` | Step 6 becomes an active deploy/release interview (axes + runbook). |
| `commands/setup.md` | First-run captures the global axis defaults (`releaseTool`/`finishRelease`). |
| `README.md` | `/crew:ship` description reflects the release-tool axis. |
| `.changeset/<name>.md` | minor changeset (additive fields, no migration). |

Order: contract (Task 1) → conventions (Task 2) → ship (Task 3) → commands init/setup (Tasks 4–5) → README (Task 6) → changeset (Task 7) → final sweep (Task 8).

Note: `releaseTool`/`finishRelease` are **additive** — the generic reconcile schema-diff in `init.md`/`setup.md` already asks "per new field", so no reconcile/migration edits are needed (unlike the prior `mode` split).

---

## Task 1: `crew-config` — schema + explainer

**Files:**
- Modify: `skills/crew-config/SKILL.md` (deploy schema block ~27–33; deploy explainer table ~98–104)

- [ ] **Step 1: Add the two fields to the `deploy` schema block**

Find (lines ~27–33):
```jsonc
  "deploy": {
    "enabled": true,                   // is /crew:ship available here? (replaces the old mode:off)
    "provider": "gh-actions",          // "gh-actions" | "gitlab-ci"
    "tagPattern": "v{version}",
    "environments": [],                // optional named environments (prod, staging, …)
    "runDeploy": "off"                 // "off" | "ask" | "auto" — run an imperative deploy command after the git steps? off = push-triggered CI (the push IS the deploy)
  },
```
Replace with:
```jsonc
  "deploy": {
    "enabled": true,                   // is /crew:ship available here? (replaces the old mode:off)
    "provider": "gh-actions",          // "gh-actions" | "gitlab-ci"
    "tagPattern": "v{version}",
    "environments": [],                // optional named environments (prod, staging, …)
    "runDeploy": "off",                // "off" | "ask" | "auto" — run an imperative deploy command after the git steps? off = push-triggered CI (the push IS the deploy)
    "releaseTool": "auto",             // "auto" | "changesets" | "release-please" | "semantic-release" | "manual" | "none" — how the version is decided
    "finishRelease": "ask"             // "off" | "ask" | "auto" — merge an open bot version-PR (phase 2); only meaningful for changesets/release-please
  },
```

- [ ] **Step 2: Add two rows to the `config.deploy` explainer table**

Find (the `environments` row at line ~104):
```markdown
| `environments` | Optional named environments (prod, staging, …). |
```
Replace with:
```markdown
| `environments` | Optional named environments (prod, staging, …). |
| `releaseTool` (default `auto`) | How the version is decided — `changesets` / `release-please` (a CI bot opens a version-PR) · `semantic-release` (CI decides autonomously, no PR) · `manual` (local `npm version`/equivalent) · `none` (no versioning). `auto` detects from the repo (see `crew-deploy` → Release mechanics). Replaces ship's old hardcoded Changesets check. |
| `finishRelease` (default `ask`) | Bot-PR tools only: does ship merge an **open** version/release-PR (phase 2 → CI tags+releases)? `off`/`ask`/`auto`. Meaningless for `manual`/`semantic-release`/`none`. |
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -nE 'releaseTool|finishRelease' skills/crew-config/SKILL.md
```
Expected: matches in both the schema block and the explainer table (4 total).

- [ ] **Step 4: Commit**

```bash
git add skills/crew-config/SKILL.md
git commit -m "feat(config): add deploy.releaseTool + finishRelease to schema"
```

---

## Task 2: `crew-deploy` — Release mechanics

**Files:**
- Modify: `skills/crew-deploy/SKILL.md` (frontmatter description line 3; config.deploy table ~13–19; new section after the `config.git` section ~30)

- [ ] **Step 1: Extend the frontmatter `description`**

Find:
```yaml
description: How crew turns a verified commit into a release/deployment — config.deploy (enabled + runDeploy), config.git as the single git authority, provider handling (gh/glab), and the safety rules. Use during /crew:ship.
```
Replace with:
```yaml
description: How crew turns a verified commit into a release/deployment — config.deploy (enabled + runDeploy + releaseTool), config.git as the single git authority, provider handling (gh/glab), and the safety rules. Use during /crew:ship.
```

- [ ] **Step 2: Add two rows to the `config.deploy` table**

Find (the `environments` row at line ~19):
```markdown
| `environments` | Optional named environments. |
```
Replace with:
```markdown
| `environments` | Optional named environments. |
| `releaseTool` *(default `auto`)* | How the version is decided (see **Release mechanics** below). `auto` detects from the repo. Replaces the old hardcoded Changesets check. |
| `finishRelease` *(default `ask`)* | Bot-PR tools only: merge an open version/release-PR (phase 2)? `off`/`ask`/`auto`. |
```

- [ ] **Step 3: Insert the "Release mechanics" section**

Find the end of the `## config.git is the single git authority` section — the paragraph that ends with `...`true` just means the user pre-authorized that step.` (line ~30). Immediately AFTER that paragraph (and before `## The imperative deploy step`), insert:
```markdown

## Release mechanics (`releaseTool`)

`releaseTool` decides **where the version is determined**, which changes what ship does in the version/commit/tag steps. It replaces the old hardcoded "if `.changeset/` exists" check.

| `releaseTool` | ship's version/tag steps |
|---|---|
| `manual` | Local bump (`npm version` / language equivalent, command per `reference/deploy.md`) → release commit → tag (`tagPattern`) → push → PR. The classic path. |
| `changesets` | **No** local bump, **no** tag by ship. Ensure a changeset exists (`.changeset/*.md` other than `README`/`config`); if none, offer `changeset add` or stop. Commit it if uncommitted → push → the bot opens a version-PR. **Phase 2** (`finishRelease ≠ off`): if a `changeset-release/*` PR is open, merge it per `finishRelease` → CI tags+releases. |
| `release-please` | Like `changesets` but Conventional-Commit-driven (no changeset file): push → bot opens a release-PR → phase 2 per `finishRelease`. |
| `semantic-release` | **Push only.** No version/commit/tag by ship; CI decides the version + tags + releases autonomously. `finishRelease` is irrelevant. |
| `none` | No versioning: only the git steps (commit/push/PR), no version/tag. |

**`auto` detection** (precedence, first match wins): `.changeset/` with `config.json` → `changesets` · `release-please-config.json` / `.release-please-manifest.json` → `release-please` · `.releaserc*` / `release.config.{js,cjs,mjs,json}` / a `"release"` key in `package.json` → `semantic-release` · else → `manual`.

**Phase 2 is prod-triggering.** Merging the version-PR tags+releases. `finishRelease: auto` acts only on a green verify and under `crew-conventions`; `ask` (default) is the safe choice.
```

- [ ] **Step 4: Verify**

Run:
```bash
grep -nE 'Release mechanics|releaseTool|finishRelease|auto. detection' skills/crew-deploy/SKILL.md
```
Expected: the section heading, the table rows, the detection paragraph, and the description line all match.

- [ ] **Step 5: Commit**

```bash
git add skills/crew-deploy/SKILL.md
git commit -m "feat(crew-deploy): Release mechanics section (releaseTool, auto-detection, phase 2)"
```

---

## Task 3: `commands/ship.md` — branch by releaseTool

**Files:**
- Modify: `commands/ship.md` (step 1 ~line 16; steps 3–9 ~lines 18–24)

- [ ] **Step 1: Extend step 1 (Read config) to resolve releaseTool**

Find:
```markdown
1. **Read config.** Read `config.deploy` (enabled/provider/tagPattern/environments/runDeploy), `config.git`, and `reference/deploy.md` (if present). If `config.deploy.enabled` is `false`, explain how to enable it (`/crew:init` → deploy, or set `config.deploy.enabled`) and **stop**.
```
Replace with:
```markdown
1. **Read config.** Read `config.deploy` (enabled/provider/tagPattern/environments/runDeploy/releaseTool/finishRelease), `config.git`, and `reference/deploy.md` (if present). If `config.deploy.enabled` is `false`, explain how to enable it (`/crew:init` → deploy, or set `config.deploy.enabled`) and **stop**. Resolve `releaseTool` — if `auto`, detect it from the repo per `crew-deploy` → Release mechanics.
```

- [ ] **Step 2: Replace steps 3–9 with the releaseTool-branched flow**

Find (lines ~18–24, steps 3 through 9):
```markdown
3. **Version.** If the repo uses Changesets (`.changeset/`), run the project's version step (e.g. `pnpm version`); otherwise bump per `config.deploy.tagPattern` / the project's convention recorded in `reference/deploy.md`.
4. **Release commit.** Stage the version/changelog changes and commit using `config.git.commitStyle`. If `config.git.autoCommitPerPhase` is false, **ask** before committing.
5. **Tag.** Create the tag from `config.deploy.tagPattern` (e.g. `v1.4.0`).
6. **Push.** Push the commit and tag — **only if `config.git.autoPush`**; if false, **ask**. On decline, stop here and report the local result (version + commit + tag are valid). In a push-triggered setup this push is the deploy trigger — that is why it is the user's call.
7. **PR.** Open a PR/MR via the provider CLI (`gh` for `gh-actions`, `glab` for `gitlab-ci`) — **only if `config.git.autoPR`**; if false, **ask** or skip. If the CLI is missing/unauthenticated, explain and stop.
8. **Deploy (only if `config.deploy.runDeploy ≠ off`).** Run the deploy command from `reference/deploy.md` for the target environment (the optional `$ARGUMENTS`, else the default). With `ask`, confirm first; with `auto`, proceed; never run it on a red verify.
9. **Record.** Append to `.planning/LOG.md`: version, tag, and the push/PR/deploy outcome.
```
Replace with:
```markdown
3. **Release per `releaseTool`** (see `crew-deploy` → Release mechanics; every git step defers to `config.git`):
   - **`manual`** — version locally (`npm version` / language equivalent, command from `reference/deploy.md`) → release commit (`config.git.commitStyle`; if `autoCommitPerPhase` is false, **ask**) → tag from `config.deploy.tagPattern` (e.g. `v1.4.0`).
   - **`changesets` / `release-please`** — **no** local bump or tag. For `changesets`: ensure a changeset exists (`.changeset/*.md` other than `README`/`config`); if none, offer `changeset add` or **stop**. Commit it if uncommitted. (release-please needs no file — it reads Conventional Commits.)
   - **`semantic-release`** — no version/commit/tag here; CI does it. Proceed to push.
   - **`none`** — no version/tag; commit only if there are staged changes.
4. **Push.** Push the commit (and tag, for `manual`) — **only if `config.git.autoPush`**; if false, **ask**. On decline, stop here and report the local result. In a push-triggered setup this push is the deploy/release trigger — that is why it is the user's call.
5. **PR.** Open a PR/MR via the provider CLI (`gh` for `gh-actions`, `glab` for `gitlab-ci`) — **only if `config.git.autoPR`**; if false, **ask** or skip. If the CLI is missing/unauthenticated, explain and stop.
6. **Finish release (bot-PR tools only, `config.deploy.finishRelease ≠ off`).** For `changesets`/`release-please`: after the push the CI bot opens a version/release-PR. If one is open, merge it per `finishRelease` (`ask` → confirm first, `auto` → proceed) → CI tags + releases. Never on a red verify.
7. **Deploy (only if `config.deploy.runDeploy ≠ off`).** Run the deploy command from `reference/deploy.md` for the target environment (the optional `$ARGUMENTS`, else the default). With `ask`, confirm first; with `auto`, proceed; never run it on a red verify.
8. **Record.** Append to `.planning/LOG.md`: version, tag, and the push/PR/release/deploy outcome.
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -nE 'If the repo uses Changesets' commands/ship.md
```
Expected: **no output** (the hardcoded check is gone).
```bash
grep -nE 'Release per .releaseTool|Finish release|finishRelease|semantic-release' commands/ship.md
```
Expected: matches present.

- [ ] **Step 4: Commit**

```bash
git add commands/ship.md
git commit -m "feat(ship): branch version/release steps by releaseTool, add phase-2 finishRelease"
```

---

## Task 4: `commands/init.md` — deploy/release interview

**Files:**
- Modify: `commands/init.md` (step 6 ~line 18)

- [ ] **Step 1: Replace step 6 with the active interview**

Find:
```markdown
6. **Deploy (`config.deploy`).** Single-select `enabled` — **on** (default) · off · **inherit the global**. If enabled: ask `provider` (`gh-actions` / `gitlab-ci`) and `runDeploy` — single-select `off` (default — push-triggered CI, the push *is* the deploy) · `ask` · `auto`. Store in `config.deploy`. If `runDeploy ≠ off`, offer to create `reference/deploy.md` (release strategy, branch/tag, environments, secrets policy, rollback, **the deploy command**) and index it one line under `PROJECT.md`'s `## Reference`.
```
Replace with:
```markdown
6. **Deploy / release interview (`config.deploy` + runbook).** Single-select `enabled` — **on** (default) · off · **inherit the global**. If enabled, ask each (recommended default shown; `inherit the global` always an option):
   - `provider` — `gh-actions` / `gitlab-ci`.
   - `releaseTool` — `auto` (default; pre-fill the value **detected** from the repo per `crew-deploy` → Release mechanics) · `changesets` · `release-please` · `semantic-release` · `manual` · `none`.
   - `runDeploy` — `off` (default — push-triggered CI, the push *is* the deploy) · `ask` · `auto`.
   - `finishRelease` — `off` / `ask` (default) / `auto` — **only ask when** the resolved `releaseTool` is a bot-PR tool (`changesets`/`release-please`).
   Store all in `config.deploy`. Then **actively create `reference/deploy.md`**: interview the concrete procedure — release strategy, branch/tag conventions, environments, secrets *policy* (pointers, never values), rollback, and (when `runDeploy ≠ off`) the deploy command(s) — write the runbook and index it one line under `PROJECT.md`'s `## Reference`.
```

- [ ] **Step 2: Verify**

Run:
```bash
grep -nE 'releaseTool|finishRelease|actively create .reference/deploy\.md' commands/init.md
```
Expected: matches present.

- [ ] **Step 3: Commit**

```bash
git add commands/init.md
git commit -m "feat(init): active deploy/release interview (releaseTool, finishRelease, runbook)"
```

---

## Task 5: `commands/setup.md` — global axis defaults

**Files:**
- Modify: `commands/setup.md` (First-run step 2 deploy clause ~line 28)

- [ ] **Step 1: Replace the `config.deploy` clause in First-run step 2**

Find:
```markdown
For `config.deploy`, single-select `enabled` (on (default) / off); if on, ask `provider` (`gh-actions` / `gitlab-ci`) and `runDeploy` (`off` (default) / `ask` / `auto`) — drives `/crew:ship`.
```
Replace with:
```markdown
For `config.deploy`, single-select `enabled` (on (default) / off); if on, ask `provider` (`gh-actions` / `gitlab-ci`), `releaseTool` (`auto` (default) / `changesets` / `release-please` / `semantic-release` / `manual` / `none`), `runDeploy` (`off` (default) / `ask` / `auto`), and `finishRelease` (`off` / `ask` (default) / `auto`) — the **global defaults** for `/crew:ship` (the per-project `reference/deploy.md` runbook is created by `/crew:init`, not here).
```

- [ ] **Step 2: Verify**

Run:
```bash
grep -nE 'releaseTool|finishRelease|global defaults. for' commands/setup.md
```
Expected: matches present.

- [ ] **Step 3: Commit**

```bash
git add commands/setup.md
git commit -m "feat(setup): capture global releaseTool + finishRelease defaults"
```

---

## Task 6: `README.md` — ship description

**Files:**
- Modify: `README.md` (ship step 3 ~lines 331–332; closing paragraph ~lines 340–342)

- [ ] **Step 1: Replace ship step 3 (Version → commit → tag)**

Find:
```markdown
3. **Version → commit → tag** — runs Changesets `version` (or bumps per `deploy.tagPattern`), commits
   with your `commitStyle`, and tags (e.g. `v1.4.0`).
```
Replace with:
```markdown
3. **Release per `deploy.releaseTool`** — `changesets`/`release-please` (push a changeset/commits; a CI
   bot opens the version-PR), `semantic-release` (push; CI does it all), or `manual` (local bump → commit
   → tag with your `commitStyle`/`deploy.tagPattern`). `auto` detects the tool from the repo.
```

- [ ] **Step 2: Add a `finishRelease` note to the closing paragraph**

Find:
```markdown
`runDeploy` defaults to `off` — in a push-triggered setup the push from step 4 *is* the deploy, so
there's nothing extra to run. Set it to `ask`/`auto` only for imperative deploys (Vercel/Fly).
Backed by `crew-deploy`.
```
Replace with:
```markdown
`runDeploy` defaults to `off` — in a push-triggered setup the push from step 4 *is* the deploy, so
there's nothing extra to run. Set it to `ask`/`auto` only for imperative deploys (Vercel/Fly). For
bot-PR tools, `deploy.finishRelease` (default `ask`) controls whether ship also merges the open
version-PR to finish the release. Backed by `crew-deploy`.
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -nE 'deploy\.releaseTool|finishRelease|semantic-release' README.md
```
Expected: matches present.
```bash
grep -nE 'runs Changesets .version.' README.md
```
Expected: **no output** (old hardcoded line replaced).

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): /crew:ship release-tool axis + finishRelease"
```

---

## Task 7: Changeset

**Files:**
- Create: `.changeset/release-tool-interview.md`

- [ ] **Step 1: Write the changeset**

Create `.changeset/release-tool-interview.md`:
```markdown
---
"@mantaray0/crew": minor
---

Add release-mechanics awareness to deploy. New `config.deploy.releaseTool` (`auto`/`changesets`/`release-please`/`semantic-release`/`manual`/`none`) replaces ship's hardcoded Changesets detection — ship now branches its version/commit/tag steps by the tool (local bump vs. push-only vs. CI-autonomous). New `config.deploy.finishRelease` (`off`/`ask`/`auto`, default `ask`) lets ship merge an open bot version-PR to finish the release (changesets/release-please only). `/crew:init` now runs an active deploy/release interview that feeds these axes and creates the `reference/deploy.md` runbook; `/crew:setup` captures the global defaults. Additive — existing configs gain the new fields with defaults at reconcile.
```

- [ ] **Step 2: Verify**

Run:
```bash
head -3 .changeset/release-tool-interview.md
```
Expected: the `---`, the `"@mantaray0/crew": minor` line, the closing `---`.

- [ ] **Step 3: Commit**

```bash
git add .changeset/release-tool-interview.md
git commit -m "chore: changeset for releaseTool + deploy/release interview"
```

---

## Task 8: Final consistency sweep

**Files:** none (verification only)

- [ ] **Step 1: Confirm the hardcoded Changesets detection is gone from ship**

Run:
```bash
grep -rnE 'If the repo uses Changesets|runs Changesets .version.' commands/ commands/ship.md README.md
```
Expected: **no output**.

- [ ] **Step 2: Confirm the new vocabulary spans every expected file**

Run:
```bash
grep -rlE 'releaseTool' skills/ commands/ README.md | sort
```
Expected: `README.md`, `commands/init.md`, `commands/setup.md`, `commands/ship.md`, `skills/crew-config/SKILL.md`, `skills/crew-deploy/SKILL.md`.

- [ ] **Step 3: Confirm `finishRelease` is consistently described as bot-PR-only**

Run:
```bash
grep -rnE 'finishRelease' skills/ commands/ README.md | grep -ivE 'bot-PR|changesets|release-please|version-PR|version/release-PR|phase 2|off.*ask.*auto|ask. .auto'
```
Expected: **no output** (every mention ties `finishRelease` to the bot-PR context). If a bare mention appears, check it has the right framing.

- [ ] **Step 4: Final commit (only if Steps 1–3 required fixes)**

```bash
git add -A
git commit -m "refactor: final releaseTool consistency sweep"
```
If Steps 1–3 produced no fixes, skip this commit.

---

## Self-Review (done while writing — recorded for the executor)

- **Spec coverage:** §2 (two new fields) → Task 1.1 (schema) + 1.2/2.2 (explainers); §3 (ship branches by releaseTool, phase 2) → Task 3; §4.1 (setup global axes) → Task 5; §4.2 (init interview + runbook) → Task 4; §6 (auto-precedence, phase-2 safety) → Task 2.3 (Release mechanics section); changeset → Task 7. README → Task 6. No spec section unmapped. No reconcile/migration task — fields are additive (spec §6), handled by the existing generic schema-diff.
- **Placeholder scan:** every step shows the full replacement text; no TBD/TODO.
- **Vocabulary consistency:** field names `releaseTool` and `finishRelease` are identical across Tasks 1–7; the enum values (`auto`/`changesets`/`release-please`/`semantic-release`/`manual`/`none` and `off`/`ask`/`auto`) and the `auto`-detection precedence (changesets > release-please > semantic-release > manual) match between crew-config (Task 1), crew-deploy (Task 2), ship (Task 3), init (Task 4), setup (Task 5), and the changeset (Task 7).
