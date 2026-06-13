# Deploy-Rework + Stack-Entkopplung — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `config.deploy.mode` (off/orchestrate/execute) contract with `enabled` + `runDeploy`, make `config.git` the single git authority for `/crew:ship`, move the deploy runbook from `DEPLOY.md` into the generic `reference/deploy.md`, and make `config.stack` the single source of truth for stack facts.

**Architecture:** This is a **Markdown-first** plugin — all changes are edits to skill/command docs. There is no compiled code and no unit-test layer; the contract *is* the prose in the skills. Verification is therefore **consistency-grep**: after each edit, grep proves no stale term (`deploy.mode`, `orchestrate`, deploy-`execute`, `DEPLOY.md`) survives and the new vocabulary is present. `crew-config` is the contract, so it is edited first; everything else conforms to it.

**Tech Stack:** Markdown (skills/commands), Changesets (release), grep (verification). Repo content stays English (plugin universality); the spec/plan docs are German per repo convention.

**Spec:** `docs/specs/2026-06-13-deploy-and-stack-config-rework-design.md`

---

## File Structure

| File | Responsibility after this change |
|---|---|
| `skills/crew-config/SKILL.md` | The contract: `deploy` schema (`enabled`/`runDeploy`, no `mode`), the `config.deploy` explainer, the `mode`→`enabled`/`runDeploy` known-migration, and `config.stack` as SSOT. |
| `skills/crew-deploy/SKILL.md` | Release/deploy conventions: `config.deploy` fields, `config.git` as the single git authority, the imperative deploy step, `reference/deploy.md` as runbook home. |
| `skills/crew-context/SKILL.md` | State model: drop the `DEPLOY.md` row; `PROJECT.md` stack table is a mirror of `config.stack`; `reference/` wording no longer contrasts with `DEPLOY.md`. |
| `commands/ship.md` | The ship pipeline driven by `enabled`/`runDeploy`, all git via `config.git`, runbook from `reference/deploy.md`. |
| `commands/init.md` | Per-project deploy capture (`enabled`/`provider`/`runDeploy`), reconcile migration note, `reference/deploy.md` offer, stack facts into `config.stack`. |
| `commands/setup.md` | Global deploy defaults (`enabled`/`provider`/`runDeploy`), reconcile migration note. |
| `README.md` | `/crew:ship` description without `mode`. |
| `.changeset/<name>.md` | minor changeset documenting the config change + auto-migration. |

Order is dependency-driven: contract (Task 1) → conventions (Task 2) → state model (Task 3) → commands (Tasks 4–6) → docs (Task 7) → changeset (Task 8) → final sweep (Task 9).

---

## Task 1: `crew-config` — the contract (schema + explainer + migration + stack SSOT)

**Files:**
- Modify: `skills/crew-config/SKILL.md` (schema block ~27–32; deploy explainer ~95–103; migration section ~105–117; add stack explainer)

- [ ] **Step 1: Replace the `deploy` block in the JSON schema**

Find (lines ~27–32):
```jsonc
  "deploy": {
    "mode": "orchestrate",             // "off" | "orchestrate" | "execute"
    "provider": "gh-actions",          // "gh-actions" | "gitlab-ci"
    "tagPattern": "v{version}",
    "environments": []                 // optional named environments (prod, staging, …)
  },
```
Replace with:
```jsonc
  "deploy": {
    "enabled": true,                   // is /crew:ship available here? (replaces the old mode:off)
    "provider": "gh-actions",          // "gh-actions" | "gitlab-ci"
    "tagPattern": "v{version}",
    "environments": [],                // optional named environments (prod, staging, …)
    "runDeploy": "off"                 // "off" | "ask" | "auto" — run an imperative deploy command after the git steps? off = push-triggered CI (the push IS the deploy)
  },
```

- [ ] **Step 2: Replace the `config.deploy` explainer + ceiling paragraph**

Find (lines ~95–103, the `**config.deploy** drives …` paragraph, the `| mode | behavior |` table, and the `**config.git** is the ceiling.` paragraph) and replace the whole run with:
```markdown
**`config.deploy`** drives `/crew:ship` (release/deploy). Layered global < project; ask at `/crew:setup` and `/crew:init`. Provider `gh-actions` (via `gh`) or `gitlab-ci` (via `glab`).

| field | behavior |
|---|---|
| `enabled` (default `true`) | Is `/crew:ship` available for this project? `false` → ship explains how to turn it on and stops. Replaces the old `mode: off`. |
| `runDeploy` (default `off`) | The one knob `config.git` does **not** cover: does crew run an **imperative** deploy command after the git steps? `off` = push-triggered CI (the push *is* the deploy). `ask`/`auto` = imperative world (Vercel/Fly), command sourced from `reference/deploy.md`. |
| `provider` | `gh-actions` (PRs/status via `gh`) or `gitlab-ci` (MRs/status via `glab`). |
| `tagPattern` | Release tag shape, e.g. `v{version}`. |
| `environments` | Optional named environments (prod, staging, …). |

**`config.git` is the single git authority.** ship has **no** deploy-specific push axis: every git step (commit/push/PR/merge) defers to `config.git` (`autoCommitPerPhase` / `autoPush` / `autoPR` / `mergeStrategy`). In a push-triggered setup the prod trigger *is* the push — so it belongs to `git.autoPush` (default false → ask), i.e. to the user. ship degrades gracefully — a local `version+commit+tag` is a valid partial result when push/PR are declined.
```

- [ ] **Step 3: Add a "Known migrations" subsection to the versioning/migration section**

After the reconcile procedure list (right after the line `This is a procedure, not a coded migration: …`, ~line 117), insert:
```markdown

### Known migrations

The schema-diff is generic, but some changes are **renames/splits** where a blind new/removed diff would drop the user's value. Apply these explicitly *before* the generic diff:

| change | mapping |
|---|---|
| `deploy.mode` removed → `deploy.enabled` + `deploy.runDeploy` | `off` → `enabled: false` · `orchestrate` → `enabled: true, runDeploy: off` · `execute` → `enabled: true, runDeploy: ask` |

Also: if a `.planning/DEPLOY.md` exists, note in the reconcile that its content now belongs in `reference/deploy.md` (structured fields → `config.deploy`); offer to move it (a `mv` + the user trims to prose). Never auto-delete it.
```

- [ ] **Step 4: Add a `config.stack` explainer**

Immediately after the `config.deploy` explainer (after the new ceiling paragraph from Step 2), insert:
```markdown

**`config.stack`** is the **single source of truth** for the project's stack *facts* (language / app / db / orm / …) — it drives tag-based reviewer selection and grounding. `PROJECT.md` shows the stack as a **derived mirror** and carries the *why* (architecture decisions); it is **not** a second place to edit the facts. Change the stack in `config.stack`; crew updates the `PROJECT.md` table to match. The stack is standing context — it stays in the auto-loaded `PROJECT.md`, never in load-on-demand `reference/`.
```

- [ ] **Step 5: Verify no stale deploy-mode vocabulary remains in the contract**

Run:
```bash
grep -nE 'deploy.{0,3}mode|"mode": *"orchestrate"|orchestrate|DEPLOY\.md' skills/crew-config/SKILL.md
```
Expected: **no output** (the only `mode` left in the file is `models.mode` and `clarify`-unrelated; confirm none reference deploy). Then confirm the new terms exist:
```bash
grep -nE 'enabled|runDeploy|single source of truth' skills/crew-config/SKILL.md
```
Expected: matches for `enabled`, `runDeploy`, and the stack SSOT line.

- [ ] **Step 6: Commit**

```bash
git add skills/crew-config/SKILL.md
git commit -m "refactor(config): replace deploy.mode with enabled+runDeploy, add stack SSOT + migration"
```

---

## Task 2: `crew-deploy` — conventions skill rewrite

**Files:**
- Modify: `skills/crew-deploy/SKILL.md` (frontmatter description + entire body)

- [ ] **Step 1: Replace the frontmatter `description`**

Find:
```yaml
description: How crew turns a verified commit into a release/deployment — the config.deploy mode contract (off/orchestrate/execute), composition with config.git as the ceiling, provider handling (gh/glab), and the safety rules. Use during /crew:ship.
```
Replace with:
```yaml
description: How crew turns a verified commit into a release/deployment — config.deploy (enabled + runDeploy), config.git as the single git authority, provider handling (gh/glab), and the safety rules. Use during /crew:ship.
```

- [ ] **Step 2: Replace the body (everything from `# crew Deploy & Release` to EOF)**

Replace with:
```markdown
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
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -nE 'orchestrate|deploy.{0,3}mode|DEPLOY\.md|the ceiling' skills/crew-deploy/SKILL.md
```
Expected: **no output**. Then:
```bash
grep -nE 'single git authority|runDeploy|reference/deploy\.md|enabled' skills/crew-deploy/SKILL.md
```
Expected: matches present.

- [ ] **Step 4: Commit**

```bash
git add skills/crew-deploy/SKILL.md
git commit -m "refactor(crew-deploy): config.git as single git authority, runDeploy, reference/deploy.md"
```

---

## Task 3: `crew-context` — state model

**Files:**
- Modify: `skills/crew-context/SKILL.md` (table row ~21; PROJECT.md row ~13; reference note ~43)

- [ ] **Step 1: Remove the `DEPLOY.md` table row**

Delete this line entirely (~line 21):
```markdown
| `DEPLOY.md` | Release knowledge (optional): release strategy, branch/tag conventions, environments, secrets *policy*, rollback, deploy command(s). Used by `/crew:ship`; offered at `/crew:init` when `deploy.mode ≠ off`. |
```

- [ ] **Step 2: Update the `PROJECT.md` row to name the stack mirror**

Find (~line 13):
```markdown
| `PROJECT.md` | The living project truth: stack, architecture decisions (the *why*), current state, constraints, plus an optional `## Reference` index. Loaded automatically at session start. |
```
Replace with:
```markdown
| `PROJECT.md` | The living project truth: architecture decisions (the *why*), current state, constraints, a **stack table mirrored from `config.stack`** (the source of truth), plus an optional `## Reference` index. Loaded automatically at session start. |
```

- [ ] **Step 3: Update the `reference/` note that referenced `DEPLOY.md`**

Find (~line 43):
```markdown
- Not read by crew commands by exact path (unlike `DEPLOY.md`) — freeform knowledge agents consult on demand.
```
Replace with:
```markdown
- Freeform knowledge agents consult on demand — `/crew:ship`, for instance, loads `reference/deploy.md` because shipping touches the deploy area.
```

- [ ] **Step 4: Verify**

Run:
```bash
grep -nE 'DEPLOY\.md|deploy.{0,3}mode' skills/crew-context/SKILL.md
```
Expected: **no output**. Then:
```bash
grep -nE 'mirrored from .config.stack.|reference/deploy\.md' skills/crew-context/SKILL.md
```
Expected: both matches present. (The `reference/deploy.md` example on the `## Reference` index line ~35 stays — it is now the canonical home, which is correct.)

- [ ] **Step 5: Commit**

```bash
git add skills/crew-context/SKILL.md
git commit -m "refactor(crew-context): drop DEPLOY.md, PROJECT.md mirrors config.stack"
```

---

## Task 4: `commands/ship.md` — the pipeline

**Files:**
- Modify: `commands/ship.md` (ceiling line ~12; steps 1, 3, 6, 8; closing line ~26)

- [ ] **Step 1: Update the ceiling line (~line 12)**

Find:
```markdown
**`config.git` is the ceiling** — never push, open a PR, or commit in a way `config.git` disables. See `crew-deploy`.
```
Replace with:
```markdown
**`config.git` is the single git authority** — every git step (commit/push/PR/merge) defers to `config.git`; ship has no deploy-specific push axis. See `crew-deploy`.
```

- [ ] **Step 2: Replace step 1 (Read config)**

Find:
```markdown
1. **Read config.** Read `config.deploy` (mode/provider/tagPattern/environments), `config.git`, and `.planning/DEPLOY.md`. If `config.deploy.mode` is `off`, explain how to enable it (`/crew:init` → deploy, or set `config.deploy.mode`) and **stop**.
```
Replace with:
```markdown
1. **Read config.** Read `config.deploy` (enabled/provider/tagPattern/environments/runDeploy), `config.git`, and `reference/deploy.md` (if present). If `config.deploy.enabled` is `false`, explain how to enable it (`/crew:init` → deploy, or set `config.deploy.enabled`) and **stop**.
```

- [ ] **Step 3: Replace step 3 (Version) — runbook source**

Find:
```markdown
3. **Version.** If the repo uses Changesets (`.changeset/`), run the project's version step (e.g. `pnpm version`); otherwise bump per `config.deploy.tagPattern` / the project's convention recorded in `DEPLOY.md`.
```
Replace with:
```markdown
3. **Version.** If the repo uses Changesets (`.changeset/`), run the project's version step (e.g. `pnpm version`); otherwise bump per `config.deploy.tagPattern` / the project's convention recorded in `reference/deploy.md`.
```

- [ ] **Step 4: Replace step 6 (Push) — name the prod trigger**

Find:
```markdown
6. **Push.** Push the commit and tag — **only if `config.git.autoPush`**; if false, **ask**. On decline, stop here and report the local result (version + commit + tag are valid).
```
Replace with:
```markdown
6. **Push.** Push the commit and tag — **only if `config.git.autoPush`**; if false, **ask**. On decline, stop here and report the local result (version + commit + tag are valid). In a push-triggered setup this push is the deploy trigger — that is why it is the user's call.
```

- [ ] **Step 5: Replace step 8 (Deploy)**

Find:
```markdown
8. **Deploy (mode `execute` only).** Run the deploy command from `.planning/DEPLOY.md` for the target environment (the optional `$ARGUMENTS`, else the default). Confirm first. Never run it on a red verify.
```
Replace with:
```markdown
8. **Deploy (only if `config.deploy.runDeploy ≠ off`).** Run the deploy command from `reference/deploy.md` for the target environment (the optional `$ARGUMENTS`, else the default). With `ask`, confirm first; with `auto`, proceed; never run it on a red verify.
```

- [ ] **Step 6: Replace the closing "Do not invent" line (~line 26)**

Find:
```markdown
Do not invent deploy commands or credentials — they come from `DEPLOY.md` and the authenticated provider CLI.
```
Replace with:
```markdown
Do not invent deploy commands or credentials — they come from `reference/deploy.md` and the authenticated provider CLI.
```

- [ ] **Step 7: Verify**

Run:
```bash
grep -nE 'DEPLOY\.md|deploy.{0,3}mode|mode .execute|the ceiling' commands/ship.md
```
Expected: **no output**. Then:
```bash
grep -nE 'config.deploy.enabled|runDeploy|reference/deploy\.md|single git authority' commands/ship.md
```
Expected: matches present.

- [ ] **Step 8: Commit**

```bash
git add commands/ship.md
git commit -m "refactor(ship): drive on enabled/runDeploy, git via config.git, runbook from reference/deploy.md"
```

---

## Task 5: `commands/init.md` — per-project capture + reconcile + stack

**Files:**
- Modify: `commands/init.md` (step 1 reconcile note; step 6 deploy; step 8 PROJECT.md)

- [ ] **Step 1: Add the known-migration note to the reconcile step (step 1)**

In step 1, find the sentence:
```markdown
schema-diff the existing `config.json` (classify keys new / removed / unchanged); **ask per new field** using its purpose + recommended default from the `crew-config` schema (single-select for enums like `responseStyle`, free-text for open values); offer to drop removed keys; then stamp `crewVersion` to the current plugin version.
```
Replace with:
```markdown
schema-diff the existing `config.json` (classify keys new / removed / unchanged); **first apply the known migrations** from `crew-config` → **Known migrations** (e.g. `deploy.mode` → `enabled`/`runDeploy`) so renamed/split keys keep their value; **ask per new field** using its purpose + recommended default from the `crew-config` schema (single-select for enums like `responseStyle`, free-text for open values); offer to drop removed keys; then stamp `crewVersion` to the current plugin version.
```

- [ ] **Step 2: Replace the Deploy step (step 6)**

Find:
```markdown
6. **Deploy (`config.deploy`).** Single-select `mode` — `off` · `orchestrate` (default) · `execute` · **inherit the global** — and, if not `off`, `provider` (`gh-actions` / `gitlab-ci`). Store in `config.deploy`. If `mode ≠ off`, offer to create `.planning/DEPLOY.md` (release strategy, branch/tag, environments, secrets policy, rollback, deploy command).
```
Replace with:
```markdown
6. **Deploy (`config.deploy`).** Single-select `enabled` — **on** (default) · off · **inherit the global**. If enabled: ask `provider` (`gh-actions` / `gitlab-ci`) and `runDeploy` — single-select `off` (default — push-triggered CI, the push *is* the deploy) · `ask` · `auto`. Store in `config.deploy`. If `runDeploy ≠ off`, offer to create `reference/deploy.md` (release strategy, branch/tag, environments, secrets policy, rollback, **the deploy command**) and index it one line under `PROJECT.md`'s `## Reference`.
```

- [ ] **Step 3: Update the PROJECT.md scaffold line (step 8)**

Find:
```markdown
   - `PROJECT.md` — stack, architecture decisions (the *why*), current state, constraints — written in `config.language.files`.
```
Replace with:
```markdown
   - `PROJECT.md` — architecture decisions (the *why*), current state, constraints, and a stack table **mirrored from `config.stack`** (the source of truth) — written in `config.language.files`.
```

- [ ] **Step 4: Verify**

Run:
```bash
grep -nE 'DEPLOY\.md|orchestrate|mode .{0,2}off|deploy.{0,3}mode' commands/init.md
```
Expected: **no output**. Then:
```bash
grep -nE 'enabled|runDeploy|reference/deploy\.md|mirrored from' commands/init.md
```
Expected: matches present.

- [ ] **Step 5: Commit**

```bash
git add commands/init.md
git commit -m "refactor(init): deploy enabled/runDeploy, mode migration, reference/deploy.md, stack mirror"
```

---

## Task 6: `commands/setup.md` — global defaults + reconcile

**Files:**
- Modify: `commands/setup.md` (Reconcile step 2; First-run step 2 deploy clause)

- [ ] **Step 1: Add the known-migration note to Reconcile step 2**

Find (in the Reconcile section):
```markdown
2. **Schema-diff** the existing config against the `crew-config` schema: classify each key as **new** (in schema, missing here), **removed** (here, gone from schema), or unchanged. Report the diff compactly.
```
Replace with:
```markdown
2. **Schema-diff** the existing config against the `crew-config` schema: first apply the **Known migrations** from `crew-config` (e.g. `deploy.mode` → `enabled`/`runDeploy`) so renamed/split keys keep their value, then classify each remaining key as **new** (in schema, missing here), **removed** (here, gone from schema), or unchanged. Report the diff compactly.
```

- [ ] **Step 2: Replace the `config.deploy` clause in First-run step 2**

Find:
```markdown
For `config.deploy`, single-select `mode` (`off` / `orchestrate` (default) / `execute`) and `provider` (`gh-actions` / `gitlab-ci`) — drives `/crew:ship`.
```
Replace with:
```markdown
For `config.deploy`, single-select `enabled` (on (default) / off); if on, ask `provider` (`gh-actions` / `gitlab-ci`) and `runDeploy` (`off` (default) / `ask` / `auto`) — drives `/crew:ship`.
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -nE 'orchestrate|deploy.{0,3}mode|mode .{0,2}\(.off' commands/setup.md
```
Expected: **no output**. Then:
```bash
grep -nE 'enabled \(on|runDeploy|Known migrations' commands/setup.md
```
Expected: matches present.

- [ ] **Step 4: Commit**

```bash
git add commands/setup.md
git commit -m "refactor(setup): global deploy enabled/runDeploy + mode migration"
```

---

## Task 7: `README.md` — `/crew:ship` description

**Files:**
- Modify: `README.md` (the `/crew:ship` block ~322–340)

- [ ] **Step 1: Replace the ship description block**

Find (lines ~325–340, from `Driven by` through `Backed by crew-deploy.`):
```markdown
Driven by `config.deploy.mode` and **bounded by `config.git`** (the ceiling — ship never pushes, opens a
PR, or commits in a way your git config disables; it asks instead):

1. **Read config** — `config.deploy`, `config.git`, and `.planning/DEPLOY.md`. If `deploy.mode` is
   `off`, it explains how to enable it and stops.
2. **Gate on verify** — refuses to ship on a red `verify` (checks the last result in `LOG.md`).
3. **Version → commit → tag** — runs Changesets `version` (or bumps per `deploy.tagPattern`), commits
   with your `commitStyle`, and tags (e.g. `v1.4.0`).
4. **Push & PR** — only if `git.autoPush` / `git.autoPR` allow it (otherwise it asks); PR/MR via the
   `gh` (GitHub Actions) or `glab` (GitLab CI) CLI.
5. **Deploy** — only when `deploy.mode` is `execute`: runs the deploy command from `DEPLOY.md` for the
   target environment, after confirmation. Never guessed by crew.
6. **Record** — appends the version, tag, and push/PR/deploy outcome to `LOG.md`.

The three modes: `off` (do nothing), `orchestrate` (drive the release; CI deploys), `execute` (also run
the deploy command). Backed by `crew-deploy`.
```
Replace with:
```markdown
Driven by `config.deploy` (`enabled` + `runDeploy`); **`config.git` is the single git authority** — ship
never pushes, opens a PR, or commits in a way your git config disables; it asks instead:

1. **Read config** — `config.deploy`, `config.git`, and `reference/deploy.md`. If `deploy.enabled` is
   `false`, it explains how to enable it and stops.
2. **Gate on verify** — refuses to ship on a red `verify` (checks the last result in `LOG.md`).
3. **Version → commit → tag** — runs Changesets `version` (or bumps per `deploy.tagPattern`), commits
   with your `commitStyle`, and tags (e.g. `v1.4.0`).
4. **Push & PR** — only if `git.autoPush` / `git.autoPR` allow it (otherwise it asks); PR/MR via the
   `gh` (GitHub Actions) or `glab` (GitLab CI) CLI. In a push-triggered setup the push is the deploy
   trigger, so it stays the user's call.
5. **Deploy** — only when `deploy.runDeploy` is `ask`/`auto`: runs the imperative deploy command from
   `reference/deploy.md` for the target environment (confirmation on `ask`). Never guessed by crew.
6. **Record** — appends the version, tag, and push/PR/deploy outcome to `LOG.md`.

`runDeploy` defaults to `off` — in a push-triggered setup the push from step 4 *is* the deploy, so
there's nothing extra to run. Set it to `ask`/`auto` only for imperative deploys (Vercel/Fly).
Backed by `crew-deploy`.
```

- [ ] **Step 2: Update the one-line summary (~line 323)**

Find:
```markdown
> Carry a verified change to a release — version, commit, tag, push, PR, and (when enabled) deploy.
```
Leave as-is (still accurate). Confirm no change needed, then proceed.

- [ ] **Step 3: Verify**

Run:
```bash
grep -nE 'deploy\.mode|orchestrate|DEPLOY\.md|three modes' README.md
```
Expected: **no output**. Then:
```bash
grep -nE 'deploy.enabled|runDeploy|single git authority' README.md
```
Expected: matches present.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): /crew:ship driven by enabled/runDeploy"
```

---

## Task 8: Changeset

**Files:**
- Create: `.changeset/deploy-enabled-rundeploy.md`

- [ ] **Step 1: Write the changeset**

Create `.changeset/deploy-enabled-rundeploy.md`:
```markdown
---
"@mantaray0/crew": minor
---

Rework deploy config. `config.deploy.mode` (off/orchestrate/execute) is replaced by `enabled` (is `/crew:ship` available?) + `runDeploy` (off/ask/auto — run an imperative deploy command?). `config.git` is now the single git authority for ship — there is no separate deploy push axis, so the prod-triggering push belongs to `git.autoPush` (the user). The deploy runbook moves from the dedicated `DEPLOY.md` to the generic `reference/deploy.md`. `config.stack` is the single source of truth for stack facts; `PROJECT.md` mirrors it. Existing configs auto-migrate at `/crew:init` (or `/crew:setup`) reconcile: `off → enabled:false`, `orchestrate → runDeploy:off`, `execute → runDeploy:ask`.
```

- [ ] **Step 2: Verify the changeset is valid frontmatter**

Run:
```bash
head -3 .changeset/deploy-enabled-rundeploy.md
```
Expected: the `---`, the `"@mantaray0/crew": minor` line, the closing `---`.

- [ ] **Step 3: Commit**

```bash
git add .changeset/deploy-enabled-rundeploy.md
git commit -m "chore: changeset for deploy config rework"
```

---

## Task 9: Final cross-repo consistency sweep

**Files:** none (verification only)

- [ ] **Step 1: Sweep the whole plugin surface for stale deploy vocabulary**

Run:
```bash
grep -rnE 'deploy.{0,3}mode|"mode": *"orchestrate"|orchestrate|DEPLOY\.md' skills/ commands/ README.md
```
Expected: **no output**. If anything appears, fix it in place (it is a missed reference), then re-run.

- [ ] **Step 2: Confirm `execute` only appears as the legitimate `/crew:execute` command, never as a deploy mode**

Run:
```bash
grep -rnE '\bexecute\b' skills/crew-deploy/ commands/ship.md commands/init.md commands/setup.md | grep -iE 'deploy|mode|runDeploy'
```
Expected: **no output** (no `execute` tied to deploy/mode). Plain `/crew:execute` references elsewhere are fine.

- [ ] **Step 3: Confirm the new vocabulary is coherent across files**

Run:
```bash
grep -rlE 'runDeploy' skills/ commands/ README.md
```
Expected: at least `skills/crew-config/SKILL.md`, `skills/crew-deploy/SKILL.md`, `commands/ship.md`, `commands/init.md`, `commands/setup.md`, `README.md`.

- [ ] **Step 4: Final commit (only if Step 1–2 required fixes)**

```bash
git add -A
git commit -m "refactor: final deploy-rework consistency sweep"
```
If Steps 1–2 produced no fixes, skip this commit.

---

## Self-Review (done while writing — recorded for the executor)

- **Spec coverage:** §2.1 (schema) → Task 1.1/1.2; §2.2 (git authority) → Tasks 1.2, 2.2, 4.1; §2.3 (ship flow) → Task 4; §2.4 (DEPLOY.md → reference) → Tasks 2.2, 3.1, 4; §2.5 (migration) → Tasks 1.3, 5.1, 6.1; §3.1 (stack SSOT) → Tasks 1.4, 3.2, 5.3; §5 (files) → all tasks; changeset → Task 8. No spec section is unmapped.
- **Placeholder scan:** every code/markdown step shows the full replacement text; no TBD/TODO.
- **Vocabulary consistency:** field names `enabled` / `runDeploy` and the path `reference/deploy.md` are used identically across Tasks 1–8; the migration mapping in Task 1.3 matches the values referenced in Tasks 5.1 / 6.1 and the changeset (off→enabled:false, orchestrate→runDeploy:off, execute→runDeploy:ask).
