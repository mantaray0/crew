# crew

`@mantaray0/crew` — a small planning plugin for Claude Code. crew keeps project state across
sessions in a committed `.planning/` directory and runs each phase of the plan in a fresh
`crew:executor` sub-agent.

## Two layers — keep them straight

This repo wears two hats at once, which is the usual source of confusion. Always be explicit
about which one you're touching:

- **The plugin (the product we ship).** `commands/`, `agents/`, `skills/`, `hooks/`, `scripts/`,
  `.claude-plugin/`, `README.md`. English, committed, released via Changesets. Editing these
  **changes crew itself** — it is the deliverable.
- **The planning state (how we organize building it — crew dogfooding itself).** `.planning/`
  (PROJECT, ROADMAP, LOG, backlog, `plans/`, `archive/`). German (`language.files: de`),
  **gitignored / local-only**, written by crew's own `/crew:*` commands. These files **describe and
  drive** work on the plugin; they are never shipped.

A **milestone / phase / plan** always lives in the *planning state* and is *about* a change to the
*plugin*. When ambiguous, say **"the crew plugin"** (product) vs **"the `.planning` roadmap/plan"**
(planning state); **"ship/release" only ever refers to the plugin.**

## Stack

| Area | Choice |
|---|---|
| Kind | Claude Code plugin |
| Language | Markdown (commands, agent, skills) + JavaScript (ESM, `.mjs` scripts) |
| Runtime | Node ≥ 18 |
| Package manager | pnpm |
| Release | Changesets |
| CI | GitHub Actions |

## Architecture

- **`commands/`** — the eight `/crew:*` commands: init, brief, plan, adjust, backlog, execute, status, resume.
- **`agents/executor.md`** — the only agent: one phase per fresh context (implement → checks →
  built-in `code-review` → commit → stamp ROADMAP and LOG).
- **`skills/crew-state`** — the `.planning/` format and the config schema. **Single source of truth**;
  commands point at it instead of restating it.
- **`skills/roast-me`** — the questioning `/crew:brief` runs, in rounds with recommended answers.
- **`hooks/`** — SessionStart prints the active milestone and next phase (a few lines).
- **`scripts/`** — `validate-plugin.mjs` (CI), `session-start.test.mjs`, `sync-version.mjs` (release).

### Guiding decisions (the *why*)

- **The value is the state, not the ceremony.** Session analysis before 1.0 showed crew used almost
  only through brief → plan → execute, while the review pipeline produced mostly noise. 1.0 keeps
  `.planning/` and the phase loop and hands review, exploration and planning help to Claude Code's
  built-ins (`/code-review`, Explore, Plan).
- **Review runs inside the executor, before the commit.** A sub-agent can invoke the built-in
  `code-review` skill (verified); every finding is fixed or rejected with a one-sentence reason in
  the commit body. No simplify stage: it cut load-bearing invariants.
- **Foreground only.** The executor hands back only with checks, commit, stamp and LOG line done;
  background checks were lost on hand-back before.
- **Project conventions stay in the project.** Commit format, branches and tracker come from the
  project's `CLAUDE.md`. Config has three keys; unknown keys are ignored so older configs keep working.
- **Read old state tolerantly.** Real projects differ in heading style, id depth, backlog and
  archive layout. Commands read what is there and never migrate.
- **Write only what changes behavior.** Instruction text was cut from 28,922 words (0.23.0) to under
  a quarter; `validate-plugin.mjs` enforces the budget.

## Constraints / conventions

- **`.planning/` is gitignored in this repo** (local-only) — this repo is the plugin itself, not a user
  project, so the planning state must not mix into the plugin history.
- **Releases run through Changesets** — never bump versions by hand; `pnpm version` syncs the plugin
  manifest via `scripts/sync-version.mjs`.
- **Markdown-first** — new capabilities are commands/skills, not compiled code.
- **No internal planning identifiers in shipped content.** `commands/`/`agents/`/`skills/`/`hooks/`/`README.md`/`.claude-plugin/` must never name crew's internal milestone/phase numbers (`M8`, `1.2`) or `.planning` slugs. Enforced by `scripts/validate-plugin.mjs` (check 5, run in CI).
- **Testing:** `pnpm test` covers the SessionStart hook; `node scripts/validate-plugin.mjs` and
  `claude plugin validate .` cover structure.
