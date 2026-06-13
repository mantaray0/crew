# Brief & Planning Refinement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verfeinere crews Klärungs-/Planungs-Flow: konfigurierbares Roast-Level, gebündelter Inline-Stepper mit Spec-Probe-Stopp, geschärfter Cut Brief↔Plan, und Milestone-Ordner-Struktur in `plans/`.

**Architecture:** Reine Markdown-Edits an Skills + Commands (crew ist deklarativ — die Skills *sind* der Vertrag). Quelle der Wahrheit zuerst (`crew-config`, `crew-conventions`, `roast-me`, `crew-planning`, `crew-context`), dann die Commands, die sie referenzieren, zuletzt ein Konsistenz-Sweep über alle `plans/`-Pfade.

**Tech Stack:** Markdown (Skills/Commands), JSONC-Schema in `crew-config`. Kein Code, keine Unit-Tests — Verifikation pro Task ist ein `grep`-Konsistenz-Check.

**Spec:** `docs/specs/2026-06-13-brief-planning-refinement-design.md`

---

## Task 1: Config-Schema — `clarify.intensity`

**Files:**
- Modify: `skills/crew-config/SKILL.md` (clarify-Block + neue Erläuterung)

- [ ] **Step 1: Schema um `intensity` erweitern**

Ersetze im `clarify`-Block:

```jsonc
  "clarify": {
    "depth": "normal",                 // "light" | "normal" | "deep"
    "askOnlyWhenStuck": true,
    "specArtifact": "section"          // "section" | "separate" | "off"
  },
```

durch:

```jsonc
  "clarify": {
    "depth": "normal",                 // "light" | "normal" | "deep" — how broad (coverage)
    "intensity": "normal",             // "gentle" | "normal" | "brutal" — how hard Roast-Me pushes back
    "askOnlyWhenStuck": true,
    "specArtifact": "section"          // "section" | "separate" | "off"
  },
```

- [ ] **Step 2: Erläuterung ergänzen**

Direkt **nach** dem `**responseStyle**`-Absatz (der mit der Tabelle endet) diesen Abschnitt einfügen:

```markdown
**`clarify.intensity`** controls how hard Roast-Me challenges an idea during `/crew:brief` — **orthogonal** to `clarify.depth` (depth = how *broad* the questioning, intensity = how *hard* it pushes back). The recommended answer carries in every level (in `brutal` it may be "drop this"). Default `"normal"`. Ask at `/crew:setup` (global) or `/crew:init` (per project), resolved project > global > default — like `language.files`.

| value | behavior |
|---|---|
| `gentle` | Pure clarification: fill gaps, recommend a default, don't push back. |
| `normal` (default) | Push on the load-bearing weak spots, name obvious scope-creep, question one or two load-bearing assumptions. |
| `brutal` | Attack assumptions ("do you actually need this?"), surface contradictions, steelman cutting scope, name every scope risk. |
```

- [ ] **Step 3: Verifikation**

Run: `grep -n "intensity" skills/crew-config/SKILL.md`
Expected: ≥2 Treffer (Schema-Zeile + Erläuterungs-Absatz mit Tabelle).

- [ ] **Step 4: Commit**

```bash
git add skills/crew-config/SKILL.md
git commit -m "feat(config): add clarify.intensity (roast level) to schema"
```

---

## Task 2: `crew-conventions` — Unabhängigkeitsregel statt „one decision at a time"

**Files:**
- Modify: `skills/crew-conventions/SKILL.md:15` (erster Bullet im Interaction-flow-Abschnitt)

- [ ] **Step 1: Bullet ersetzen**

Ersetze:

```markdown
- **One decision at a time.** Walk the command's steps in order. For each decision the command exposes, ask the user **before** acting on it.
```

durch:

```markdown
- **Surface every decision — batch the independent ones.** Walk the command's steps in order and ask the user **before** acting on any decision. **Bundle independent decisions into one `AskUserQuestion` stepper batch** — questions whose order doesn't matter and whose options don't depend on each other (clarification gray-areas, multi-field setup forms). **Stay sequential** as soon as one decision's options hinge on a prior answer (a decision-tree branch) or it is a confirm-then-write gate. Batching is for *co-equal* questions — never an excuse to skip a question or silently apply a default.
```

- [ ] **Step 2: Verifikation**

Run: `grep -n "batch the independent\|One decision at a time" skills/crew-conventions/SKILL.md`
Expected: Treffer für „batch the independent", **kein** Treffer mehr für „One decision at a time".

- [ ] **Step 3: Commit**

```bash
git add skills/crew-conventions/SKILL.md
git commit -m "feat(conventions): replace one-decision-at-a-time with independence/batch rule"
```

---

## Task 3: `roast-me` Skill — Stepper, Spec-Probe, Intensity, Guardrail

**Files:**
- Modify: `skills/roast-me/SKILL.md` (Body + description-Frontmatter)

- [ ] **Step 1: Gesamten Skill-Body ersetzen**

Ersetze den kompletten Dateiinhalt durch:

```markdown
---
name: roast-me
description: Use during planning to clarify a raw idea — bounded, batched questioning that challenges the idea at a configurable intensity, each question carrying a recommended answer the user can simply confirm. Investigates the codebase instead of asking when answerable.
origin: crew
---

# Roast-Me

Turn a vague idea into a clear, decided spec by walking the decision tree and challenging it — bounded, not an interrogation. The goal is a complete, writable Spec fast.

## How it works

1. **Batched questions via the inline stepper.** Ask co-equal, independent questions together as one `AskUserQuestion` stepper batch (up to 4), submitted at once — not one slow message per question. Each question still **carries a recommended answer** and a one-line why, so the user can confirm at a glance.
2. **Keep the decision tree intact.** Only batch questions that are *independent* (order doesn't matter, no answer changes another's options). When an answer determines whether/which question comes next, put it in a later batch — trunk before leaves.
3. **Investigate, don't ask, when you can.** If the answer is in the codebase, configs, or `PROJECT.md`, go find it instead of asking.
4. **Challenge at the configured intensity** (`config.clarify.intensity`):
   - `gentle` — pure clarification: fill gaps, recommend a default, don't push back.
   - `normal` *(default)* — push on the load-bearing weak spots, name obvious scope-creep, question one or two load-bearing assumptions. A recommendation may be "drop this".
   - `brutal` — attack assumptions ("do you actually need this?"), surface contradictions, steelman cutting scope, name every scope risk.

   The recommended answer carries in *every* intensity.
5. **Respect breadth** (`config.clarify.depth`, orthogonal to intensity): `light` = only the load-bearing questions; `normal` = the decision tree's main branches; `deep` = edge cases and failure modes too.
6. **Stop on the Spec-Probe.** After each batch, check internally: *can I now write the full Spec — goal, requirements, acceptance, out-of-scope?* As soon as yes, stop and show the Spec. Baseline ~3–5 questions; the **maximum scales with complexity — you decide it, no fixed cap.** After each batch, offer the exit: *"Enough for a Spec, or dig deeper?"* The user can always say "enough" and move on.
7. **Hold the scope line.** Structural / sequencing / phasing ideas belong to `/crew:plan`, not the brief — capture them ("that's `/crew:plan`, noted") instead of deciding them here.
8. **Close with a summary.** Restate the decided Spec (goal, requirements, acceptance, out-of-scope) and get a final confirm.

## Anti-patterns

- Asking what you could look up.
- Dribbling one question per message when several independent ones could be a single stepper batch.
- Batching *dependent* questions whose later options hinge on an earlier answer.
- Continuing to grill after the Spec is fully writable.
- Deciding structure / sequencing in the brief (that's planning).
- Open-ended questions with no recommended default.
```

- [ ] **Step 2: Verifikation**

Run: `grep -n "Spec-Probe\|stepper batch\|intensity\|Hold the scope line" skills/roast-me/SKILL.md`
Expected: je ≥1 Treffer; **kein** Treffer mehr für „One question at a time" (Run: `grep -c "One question at a time" skills/roast-me/SKILL.md` → `0`).

- [ ] **Step 3: Commit**

```bash
git add skills/roast-me/SKILL.md
git commit -m "feat(roast-me): batched stepper, spec-probe stop, intensity levels, scope guardrail"
```

---

## Task 4: `crew-planning` — Milestone-Ordner-Struktur

**Files:**
- Modify: `skills/crew-planning/SKILL.md` (Heading `## plans/<slug>.md` + „Plan file naming"-Abschnitt)

- [ ] **Step 1: Heading anpassen**

Ersetze `## plans/<slug>.md` durch `## plans/<milestone-slug>/<file>.md`.

- [ ] **Step 2: „Plan file naming"-Abschnitt ersetzen**

Ersetze den kompletten Abschnitt (von `### Plan file naming` bis vor `## Principles`) durch:

```markdown
### Plan file naming & folders

Plans live in **milestone folders** — `plans/<milestone-slug>/` — keeping a brief together with the phases it spawned. The folder name is a slug (not a number), so inserting/reordering via `/crew:adjust` never renumbers a folder. `<milestone-slug>` is lowercase, ASCII/kebab (even when the *content* is written in another language via `config.language.files`).

```
.planning/plans/
  <milestone-slug>/
    _brief.md            ← Spec root (optional; only when a brief produced this work)
    1.2-db-schema.md     ← numbered phase plans of this milestone
    1.3-auth.md
```

Three file kinds inside a folder, told apart by filename:

- **Brief / Spec root** (`/crew:brief`, feature in an existing project): `_brief.md` — Spec head only (Goal/problem, Requirements, Acceptance, Out of scope). The brief slug *becomes* the milestone-folder name, so no fake phase number is invented. The Plan body is filled later by `/crew:plan`.
- **Phase plan** (`/crew:plan`): roadmap phase id + short title — `1.2-db-schema.md`. Sorts naturally, ties straight to the roadmap id.
- **Ticket plan** (`/crew:pull`): external ticket id + title — `LIN-42-realtime-notifications.md`; no `_brief.md` (the ticket is the spec).

**New project:** `/crew:plan` creates one `<milestone-slug>/` folder per roadmap milestone and writes the numbered phase plans into it; the brief itself is `PROJECT.md` (no `_brief.md` in `plans/`). **Feature in an existing project:** the brief's `_brief.md` and its numbered phase plans share one `plans/<milestone-slug>/` folder; once every phase is captured, the `_brief.md` may be removed. All plans-reading commands glob **recursively** (`plans/**/*.md`).
```

- [ ] **Step 3: Verifikation**

Run: `grep -n "milestone-slug\|_brief.md\|plans/\*\*" skills/crew-planning/SKILL.md`
Expected: Treffer für alle drei; **kein** `_<slug>.md` mehr (Run: `grep -c "_<slug>.md" skills/crew-planning/SKILL.md` → `0`).

- [ ] **Step 4: Commit**

```bash
git add skills/crew-planning/SKILL.md
git commit -m "feat(planning): milestone-folder structure for plans/ with _brief.md"
```

---

## Task 5: `crew-context` — `plans/`-Zeile aktualisieren

**Files:**
- Modify: `skills/crew-context/SKILL.md:15`

- [ ] **Step 1: Tabellenzeile ersetzen**

Ersetze:

```markdown
| `plans/<slug>.md` | Detail: Spec head + Plan body per phase/feature. |
```

durch:

```markdown
| `plans/<milestone-slug>/` | Detail per milestone: optional `_brief.md` (Spec root) + numbered `<id>-<title>.md` phase plans (Spec head + Plan body each). |
```

- [ ] **Step 2: Verifikation**

Run: `grep -n "plans/<milestone-slug>/" skills/crew-context/SKILL.md`
Expected: 1 Treffer.

- [ ] **Step 3: Commit**

```bash
git add skills/crew-context/SKILL.md
git commit -m "docs(context): update plans/ entry for milestone folders"
```

---

## Task 6: `git-merge` — Claim-Notiz ordnerbewusst

**Files:**
- Modify: `skills/git-merge/SKILL.md:20`

- [ ] **Step 1: Zeile ersetzen**

Ersetze:

```markdown
- One `plans/<slug>.md` per feature (different files → no conflict).
```

durch:

```markdown
- One `plans/<milestone-slug>/` folder per feature (different folders/files → no conflict).
```

- [ ] **Step 2: Verifikation**

Run: `grep -n "plans/<milestone-slug>/ folder" skills/git-merge/SKILL.md`
Expected: 1 Treffer.

- [ ] **Step 3: Commit**

```bash
git add skills/git-merge/SKILL.md
git commit -m "docs(git-merge): folder-aware plan isolation note"
```

---

## Task 7: `commands/brief.md` — Spec-Probe, Guardrail, Intensity, Stepper, Schreibpfad

**Files:**
- Modify: `commands/brief.md` (Konventions-Hinweis Z. 10, Step 2 Z. 15, Step 4 Z. 19)

- [ ] **Step 1: Konventions-Hinweis (Z. 10) ersetzen**

Ersetze:

```markdown
**Follow `crew-conventions`:** one question at a time (each with a recommended answer), never silently assume; respond in the user's language.
```

durch:

```markdown
**Follow `crew-conventions`:** batch independent clarification questions into one `AskUserQuestion` stepper (each with a recommended answer), stay sequential where one answer determines the next; never silently assume; respond in the user's language.
```

- [ ] **Step 2: Step 2 (Z. 15, „Run Roast-Me clarification") ersetzen**

Ersetze:

```markdown
2. **Run Roast-Me clarification.** Use the `roast-me` skill: ask sharp questions one at a time, each carrying a recommended answer the user can simply confirm. Honour `.planning/config.json` → `clarify.depth` (`light`/`normal`/`deep`). When a question is answerable from the codebase, investigate instead of asking. Stop when shared understanding is reached, then summarize.
```

durch:

```markdown
2. **Run Roast-Me clarification.** Use the `roast-me` skill: ask sharp questions in batched stepper rounds (~3–5 baseline, the max scales with complexity), each carrying a recommended answer the user can confirm. Honour `clarify.depth` (breadth) **and** `clarify.intensity` (`gentle`/`normal`/`brutal` — how hard to challenge the idea). When a question is answerable from the codebase, investigate instead of asking. Hold the scope line: structural/sequencing ideas → note them for `/crew:plan`, don't decide them here. **Stop on the Spec-Probe** — once goal/requirements/acceptance/out-of-scope are fully writable — and after each round offer "enough, or dig deeper?". Then summarize.
```

- [ ] **Step 3: Step 4 Feature-Bullet (Z. 19) ersetzen**

Ersetze:

```markdown
   - **Feature in an existing project:** create `.planning/plans/_<slug>.md` — **underscore-prefixed and un-numbered** (see `crew-planning` file naming) — with the **Spec** head only (Ziel/Problem, Anforderungen, Akzeptanzkriterien, Out of Scope). The phase number is assigned later by `/crew:plan`, so the brief must not invent one; the `_` keeps it visually distinct from numbered phase plans. Honour `clarify.specArtifact` (`section` = spec head in the plan, `separate` = own file, `off` = skip). The Plan body is filled by `/crew:plan`.
```

durch:

```markdown
   - **Feature in an existing project:** create `.planning/plans/<slug>/_brief.md` — a **milestone folder named by the brief slug**, holding `_brief.md` with the **Spec** head only (Ziel/Problem, Anforderungen, Akzeptanzkriterien, Out of Scope). No phase number is invented — `/crew:plan` later fills the *same folder* with numbered phase plans (`<id>-<title>.md`). The brief slug becomes the milestone-folder name (see `crew-planning` file naming). Honour `clarify.specArtifact` (`section` = spec head in the plan, `separate` = own file, `off` = skip). The Plan body is filled by `/crew:plan`.
```

- [ ] **Step 4: Verifikation**

Run: `grep -n "Spec-Probe\|clarify.intensity\|plans/<slug>/_brief.md" commands/brief.md`
Expected: je 1 Treffer; **kein** `_<slug>.md` mehr (Run: `grep -c "_<slug>.md" commands/brief.md` → `0`).

- [ ] **Step 5: Commit**

```bash
git add commands/brief.md
git commit -m "feat(brief): spec-probe stop, intensity, batched stepper, milestone-folder brief path"
```

---

## Task 8: `commands/plan.md` — Spec gelockt, Intent-Bounce-Back, Schreibpfad

**Files:**
- Modify: `commands/plan.md` (Step 1 Z. 14, Step 4 Z. 17, neuer Bounce-Back-Hinweis)

- [ ] **Step 1: Step 1 (Z. 14) Brief-Pfad ersetzen**

Ersetze:

```markdown
1. **Read context.** Read `.planning/PROJECT.md`, the originating brief `.planning/plans/_<slug>.md` Spec head (if any — see `crew-planning` file naming), `.planning/ROADMAP.md`, and `.planning/BACKLOG.md`.
```

durch:

```markdown
1. **Read context.** Read `.planning/PROJECT.md`, the originating brief `.planning/plans/<slug>/_brief.md` Spec head (if any — see `crew-planning` file naming), `.planning/ROADMAP.md`, and `.planning/BACKLOG.md`. **Trust the Spec as locked intent** — plan *structure/sequencing*, do not re-clarify the what/why. If you hit a genuine **intent** gap (a missing requirement, an undecided goal), bounce it back to the brief ("this belongs in `/crew:brief`") instead of silently deciding it.
```

- [ ] **Step 2: Step 4 (Z. 17) Schreibpfad ersetzen**

Ersetze:

```markdown
4. **Write the plan.** For each phase, write a **numbered** plan file `.planning/plans/<id>-<kebab-title>.md` (the roadmap phase id, e.g. `1.2-db-schema.md` — *not* the underscore brief name) with a **Spec** head (carried from the `_<slug>.md` brief or the source ticket) followed by a **Plan** body: affected files, tasks (Action / pattern to mirror / validation command), risks, and this phase's verify configuration. Follow `clarify.specArtifact`. Once a brief's phases are all captured, the `_<slug>.md` brief may be removed (it has become the numbered plans).
```

durch:

```markdown
4. **Write the plan.** For each phase, write a **numbered** plan file into the milestone folder `.planning/plans/<milestone-slug>/<id>-<kebab-title>.md` (the roadmap phase id, e.g. `1.2-db-schema.md`) with a **Spec** head (carried from the `_brief.md` brief or the source ticket) followed by a **Plan** body: affected files, tasks (Action / pattern to mirror / validation command), risks, and this phase's verify configuration. For a **new project**, create one `<milestone-slug>/` folder per roadmap milestone; for a **feature**, write into the brief's existing `<slug>/` folder. Follow `clarify.specArtifact`. Once a brief's phases are all captured, the `_brief.md` may be removed (it has become the numbered plans).
```

- [ ] **Step 3: Verifikation**

Run: `grep -n "locked intent\|bounce it back\|plans/<milestone-slug>/<id>" commands/plan.md`
Expected: je 1 Treffer; **kein** `_<slug>.md` mehr (Run: `grep -c "_<slug>.md" commands/plan.md` → `0`).

- [ ] **Step 4: Commit**

```bash
git add commands/plan.md
git commit -m "feat(plan): trust locked spec + intent bounce-back; write into milestone folders"
```

---

## Task 9: `commands/setup.md` — Roast-Level global erfragen

**Files:**
- Modify: `commands/setup.md:28` (First-run config-groups Schritt)

- [ ] **Step 1: Config-Gruppen-Liste um `clarify` ergänzen**

Ersetze im Satz die Klammerliste:

```markdown
go through the config groups (`models`, `git`, `notifications`, `tasks.provider`, `execution`, `language.files`, `responseStyle`, …) **one at a time**
```

durch:

```markdown
go through the config groups (`models`, `git`, `notifications`, `tasks.provider`, `execution`, `language.files`, `responseStyle`, `clarify`, …) **one at a time**
```

- [ ] **Step 2: Satz für `clarify.intensity` ergänzen**

Direkt **nach** dem Satz „For `responseStyle`, single-select `concise` (default) / `detailed` / `auto`." einfügen:

```markdown
For `clarify.intensity`, single-select `gentle` / `normal` (default) / `brutal` — how hard Roast-Me challenges an idea during `/crew:brief`.
```

- [ ] **Step 3: Verifikation**

Run: `grep -n "clarify.intensity" commands/setup.md`
Expected: 1 Treffer (Reconcile-Mode behandelt das neue Feld generisch über den Schema-Diff — keine weitere Änderung nötig).

- [ ] **Step 4: Commit**

```bash
git add commands/setup.md
git commit -m "feat(setup): ask clarify.intensity (roast level) in global config"
```

---

## Task 10: `commands/init.md` — Roast-Level per-project + Scaffold-Seed

**Files:**
- Modify: `commands/init.md` (neuer Step nach „File language" Z. 16; Scaffold-config Z. 19; Legacy-Migration Z. 13)

- [ ] **Step 1: Neuen Step „Roast level" nach Step 4 (File language) einfügen**

Füge nach dem `4. **File language.** …`-Block einen neuen nummerierten Step ein (und renummeriere die folgenden Steps entsprechend 6→7, 7→8):

```markdown
5. **Roast level (`clarify.intensity`).** Single-select: how hard should Roast-Me challenge ideas during `/crew:brief` — `gentle` · `normal` (default) · `brutal` · **inherit the global** `config.clarify.intensity`. Store the choice in `config.clarify.intensity`.
```

- [ ] **Step 2: Scaffold-config (jetzt Step 7) um `clarify.intensity` seeden**

Ersetze in der `config.json`-Scaffold-Zeile:

```markdown
   - `config.json` — the full default config from the `crew-config` skill, with `projectType`, `tags`, `stack`, `testing.policy`, `language.files`, and `responseStyle` seeded, plus `crewVersion` set to the current plugin version (from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`).
```

durch:

```markdown
   - `config.json` — the full default config from the `crew-config` skill, with `projectType`, `tags`, `stack`, `testing.policy`, `language.files`, `responseStyle`, and `clarify.intensity` seeded, plus `crewVersion` set to the current plugin version (from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`).
```

- [ ] **Step 3: Legacy-Migration (Z. 13) um Ordner-Migration erweitern**

Ersetze den Satz:

```markdown
**Also offer to migrate legacy briefs:** any un-prefixed, un-numbered file in `plans/` (e.g. `<slug>.md` that is neither a `_`-brief nor a numbered `<id>-…` phase plan) is likely an old brief — offer to rename it to `_<slug>.md` (see `crew-planning`).
```

durch:

```markdown
**Also offer to migrate the plans layout:** legacy flat files in `plans/` (`_<slug>.md` briefs and bare `<id>-…md` phase plans) predate the milestone-folder structure — offer to move each into its `plans/<milestone-slug>/` folder (brief → `_brief.md`; see `crew-planning`). A pure `mv`, no content change.
```

- [ ] **Step 4: Verifikation**

Run: `grep -n "Roast level\|clarify.intensity\|milestone-slug" commands/init.md`
Expected: Treffer für alle drei; Step-Nummerierung fortlaufend (Run: `grep -nE "^[0-9]+\. \*\*" commands/init.md` → 1..8 ohne Lücke/Dopplung).

- [ ] **Step 5: Commit**

```bash
git add commands/init.md
git commit -m "feat(init): ask clarify.intensity per project; offer milestone-folder migration"
```

---

## Task 11: Pfad-Sweep — `pull.md`, `adjust.md`, `execute.md`

**Files:**
- Modify: `commands/pull.md:16`, `commands/adjust.md:17`, `commands/adjust.md:18`, `commands/execute.md:14`

- [ ] **Step 1: `pull.md:16` — Ticket-Plan-Pfad**

Ersetze:

```markdown
3. **Create the plan.** Write `.planning/plans/<id>.md` with the **Spec** head filled from the ticket
```

durch:

```markdown
3. **Create the plan.** Write `.planning/plans/<milestone-slug>/<id>.md` (in the relevant milestone folder) with the **Spec** head filled from the ticket
```

- [ ] **Step 2: `adjust.md:17` — Dependencies-Pfad**

Ersetze `the affected `plans/<slug>.md` and the roadmap notes` durch `the affected `plans/<milestone-slug>/<id>-<title>.md` and the roadmap notes`.

- [ ] **Step 3: `adjust.md:18` — Backlog-Triage-Pfad**

Ersetze `create/extend its `plans/<slug>.md` Spec head` durch `create/extend its `plans/<milestone-slug>/` plan Spec head`.

- [ ] **Step 4: `execute.md:14` — Plan-Lesen rekursiv**

Ersetze:

```markdown
1. **Load context.** Read `.planning/PROJECT.md`, `.planning/ROADMAP.md` (find the active `[>]` phase, else the next `[ ]`), its `.planning/plans/<slug>.md`, and the last entries of `.planning/LOG.md`.
```

durch:

```markdown
1. **Load context.** Read `.planning/PROJECT.md`, `.planning/ROADMAP.md` (find the active `[>]` phase, else the next `[ ]`), its plan file under `.planning/plans/<milestone-slug>/<id>-…md` (glob `plans/**/*.md` to locate it by phase id), and the last entries of `.planning/LOG.md`.
```

- [ ] **Step 5: Verifikation**

Run: `grep -rn "plans/<slug>.md" commands/`
Expected: **0 Treffer** (alle migriert).

- [ ] **Step 6: Commit**

```bash
git add commands/pull.md commands/adjust.md commands/execute.md
git commit -m "refactor: migrate remaining plans/ paths to milestone folders + recursive glob"
```

---

## Task 12: Konsistenz-Sweep über das ganze Repo

**Files:**
- Read-only Verifikation; ggf. Nachzügler in `commands/` / `skills/` patchen.

- [ ] **Step 1: Stale flache Pfade aufspüren**

Run: `grep -rnE "plans/_?<slug>\.md|plans/<id>" commands/ skills/`
Expected: **0 Treffer.** Jeder Treffer ist ein vergessener Pfad → auf `plans/<milestone-slug>/…` umstellen (gleiche Transformation wie oben), dann erneut greppen.

- [ ] **Step 2: „one decision/question at a time"-Reste aufspüren**

Run: `grep -rniE "one (decision|question) at a time" commands/ skills/`
Expected: **0 Treffer** (durch die Batch/Unabhängigkeitsregel ersetzt). Treffer → an die Formulierung aus Task 2/3 angleichen.

- [ ] **Step 3: Plans-Leser auf rekursives Globbing prüfen**

Run: `grep -rln "plans/" commands/`
Für jede Datei prüfen, ob sie Plandateien *liest/auflistet* (dispatch, status, resume, rollback, quick) und dabei eine flache `plans/`-Annahme trifft. Falls ja: auf `plans/**/*.md` umstellen. (Reine Erwähnungen ohne Globbing brauchen nichts.)

- [ ] **Step 4: Design-Doc-Abgleich**

Run: `grep -n "intensity\|milestone-slug\|Spec-Probe\|Unabhängigkeitsregel\|batch" docs/specs/2026-06-13-brief-planning-refinement-design.md`
Sicherstellen, dass jede §2-Entscheidung einen umgesetzten Task hat (Spec-Coverage). Lücke → fehlenden Edit nachziehen.

- [ ] **Step 5: Abschluss-Commit (falls Nachzügler gepatcht)**

```bash
git add -A
git commit -m "chore: consistency sweep — milestone folders + batch rule across commands/skills"
```

---

## Changeset (Release)

- [ ] **Step 1: Changeset anlegen** (crew released über Changesets — nicht von Hand bumpen)

```bash
cat > .changeset/brief-planning-refinement.md <<'EOF'
---
"@mantaray0/crew": minor
---

Brief/Planning refinement: configurable roast level (`clarify.intensity`: gentle/normal/brutal), batched inline-stepper clarification with a Spec-Probe stop, sharpened brief↔plan boundary (locked spec + intent bounce-back), and milestone-folder structure for `plans/` (`plans/<milestone-slug>/_brief.md` + numbered phase plans).
EOF
git add .changeset/brief-planning-refinement.md
git commit -m "chore: changeset for brief/planning refinement"
```

---

## Self-Review (vom Autor ausgefüllt)

- **Spec-Coverage:** §2.1 → T1+T9+T10 · §2.2 → T3+T7 · §2.3 → T2 · §2.4 → T3+T7+T8 · §2.5 → T4+T5+T6+T7+T8+T11 · §2.6 → (nur Doku, kein Code) · §3-Dateiliste → T1–T11, Sweep T12. **Keine Lücke.**
- **Platzhalter:** keine TODO/TBD; jeder Edit zeigt exakten alten → neuen Text.
- **Konsistenz:** Begriff durchgängig `clarify.intensity`, `gentle/normal/brutal`, `plans/<milestone-slug>/`, `_brief.md`, „Spec-Probe", „Unabhängigkeitsregel/Batch". `crew-context`-Zeile und `crew-planning` nutzen dieselbe Ordnerschreibweise.
