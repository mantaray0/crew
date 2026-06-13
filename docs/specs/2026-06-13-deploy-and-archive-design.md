# Deploy/Release + Roadmap-Archiv — Design-Spec

- **Datum:** 2026-06-13
- **Status:** Entwurf — zur Umsetzung freigegeben (Design über Fragen geklärt), Umsetzung ausstehend.
- **Scope:** Zwei Backlog-Themen aus dem Brief/Planning-Refinement: (A) Deploy/Release-Support für Nutzerprojekte, (B) Roadmap-Archivierung.
- **Branch:** `feat/brief-planning-refinement` (fortgeführt).
- **Nicht im Scope (MVP):** CI-Workflow-Scaffolding (echte `.github/workflows`-/`.gitlab-ci.yml`-Generierung) — eigene Folge-Iteration.

---

## 1. Motivation

- **Deploy:** crew endet heute nach `verify → commit` am Repo. Es fehlt eine konfigurierbare Brücke vom verifizierten Commit zum Release/Deployment.
- **Archiv:** `ROADMAP.md` + `plans/` wachsen unbegrenzt; fertige Milestones blähen den Kontext, der bei Session-Start und vielen Commands gelesen wird.

---

## 2. Deploy/Release (A)

### 2.1 `config.deploy` — konfigurierbares Verhalten (global < project)

```jsonc
  "deploy": {
    "mode": "orchestrate",             // "off" | "orchestrate" | "execute"
    "provider": "gh-actions",          // "gh-actions" | "gitlab-ci"
    "tagPattern": "v{version}",
    "environments": []                 // optional named environments (prod, staging, …)
  },
```

| `mode` | Verhalten |
|---|---|
| `off` | `/crew:ship` führt nichts aus — erklärt nur, wie man es einschaltet. |
| `orchestrate` *(Default)* | Konservativ: crew treibt **Release** (version → commit → tag → push → PR). Das **Deployment** macht die CI-Pipeline. Kein Prod-Zugriff aus crew. |
| `execute` | Proaktiv: wie `orchestrate`, **plus** crew ruft das Deploy-Kommando aus `DEPLOY.md` direkt auf. |

Default `orchestrate`. Erhebung bei `/crew:setup` (global) + `/crew:init` (project), aufgelöst project > global > default. Provider: `gh-actions` und `gitlab-ci` beide unterstützt (über `gh` bzw. `glab` CLI).

### 2.2 Komposition mit `config.git` — Git-Config ist die **Obergrenze**

**Kernregel:** `deploy.mode` sagt *was crew versuchen darf*; `config.git` sagt *ob die Git-Mechanik auto/ask/aus ist*. `/crew:ship` darf **nie** an `config.git` vorbei. Jeder Schritt deferiert an sein Git-Gate:

| ship-Schritt | Gate in `config.git` | Verhalten wenn aus/false |
|---|---|---|
| Release-Commit | `autoCommitPerPhase` (Geist: auto vs. ask) | nicht still committen → **fragen** (ein Release braucht einen Commit zum Taggen). |
| Push (Commit + Tag) | `autoPush` (Default false) | nicht still pushen → **fragen**; bei Ablehnung lokal bleiben (version+commit+tag bleiben gültig). |
| PR öffnen | `autoPR` (Default false) | keinen PR automatisch → **fragen** oder überspringen (nur pushen). |
| Branch/Merge | `branchPattern`, `mergeStrategy`, `askBeforeMerge` | wie in `git-merge` definiert respektieren. |

`commitStyle` (conventional) wird für den Release-Commit übernommen. Auch bei `auto*=true` gilt `crew-conventions` — aber `true` heißt: der Nutzer hat vorab zugestimmt. **ship degradiert anmutig:** ohne Push/PR ist ein lokaler `version+commit+tag` trotzdem ein gültiges Teilergebnis.

### 2.3 `crew-deploy` Skill

Neues `skills/crew-deploy/SKILL.md` — die Release/Deploy-Konventionen:
- Der `mode`-Vertrag (off/orchestrate/execute) und was jede Stufe tut.
- **Die Obergrenze-Regel** aus §2.2 (defer an `config.git`).
- Provider-Handling: GitHub via `gh`, GitLab via `glab`.
- Sicherheit: **nie deployen wenn verify rot ist**; Remote-/Prod-Aktionen erst nach Bestätigung (`crew-conventions`).
- Verweist auf `.planning/DEPLOY.md` für die projektspezifische Strategie.

### 2.4 `.planning/DEPLOY.md` — Artefakt

Projekt-Release-Wissen (committet, wenn `.planning/` committet ist). Struktur:
- **Release-Strategie** (trunk-based / release-branches / changesets).
- **Branch/Tag-Konventionen** (ergänzt `config.deploy.tagPattern`).
- **Environments** (prod/staging + wann deployen).
- **Secrets-Policy** (wo liegen Deploy-Secrets — Verweis, *keine* Werte).
- **Rollback-Prozedur**.
- **Deploy-Kommando(s)** — nur relevant für `mode: execute` (z. B. `vercel deploy --prod`).

Bei `/crew:init` angeboten (nicht erzwungen — nur wenn `mode ≠ off`).

### 2.5 `/crew:ship` Command

Neues `commands/ship.md`. Schritte:
1. **Read config.** `config.deploy` (+ `config.git`) und `.planning/DEPLOY.md`. Wenn `mode: off` → erklären, wie man es einschaltet, **stoppen**.
2. **Gate on verify.** Nur fortfahren, wenn der letzte verify grün war (`LOG.md`); sonst `/crew:verify` empfehlen und stoppen.
3. **Version.** Wenn Changesets vorhanden → `pnpm version`/`changeset version`; sonst Bump per `tagPattern`/Projektkonvention.
4. **Commit** (per `commitStyle`) — **deferiert an `git.autoCommitPerPhase`-Geist** (ask wenn nicht auto).
5. **Tag** per `tagPattern`.
6. **Push** Commit + Tag — **deferiert an `git.autoPush`** (ask wenn false).
7. **PR** — **deferiert an `git.autoPR`** (ask/skip wenn false); Provider-CLI (`gh`/`glab`).
8. **Deploy** — nur bei `mode: execute`: Deploy-Kommando aus `DEPLOY.md` ausführen (nach Bestätigung).
9. **Record.** Append an `LOG.md` (Version, Tag, Push/PR/Deploy-Ergebnis).

Folgt `crew-conventions` (jede Remote-/Prod-Aktion ist ein bewusster Schritt).

---

## 3. Roadmap-Archiv (B)

Zwei Commands — `archive` ist das Primitiv, `complete-milestone` der reichere Flow, der es aufruft.

### 3.1 `/crew:archive [milestone]`

Neues `commands/archive.md`. Mechanischer Durchreicher:
- **Ziel:** der angegebene Milestone-Slug; ohne Argument der **zuletzt vollständig fertige** Milestone.
- **Guardrail:** nur Milestones, deren Phasen **alle `[x]`** sind. Sonst Abbruch + Liste offener Phasen.
- **Aktionen (reines `mv` + Textedit):**
  - ROADMAP-Milestone-Sektion → `.planning/archive/roadmap-<slug>.md`.
  - `plans/<slug>/` → `.planning/archive/plans/<slug>/`.
  - In `ROADMAP.md` bleibt **ein Einzeiler**: `## Meilenstein N: <Titel> — ✓ archiviert YYYY-MM-DD → archive/roadmap-<slug>.md`.
  - `LOG.md` Append-Notiz (was archiviert). `LOG.md` selbst bleibt unangetastet (Append-Historie).

### 3.2 `/crew:complete-milestone`

Neues `commands/complete-milestone.md`. Reicherer Abschluss:
1. Aktiven/jüngsten Milestone identifizieren.
2. **Audit:** alle Phasen `[x]`? Sonst offene auflisten und stoppen.
3. **Summary** des Milestones an `LOG.md`; ggf. `PROJECT.md` „Aktueller Stand" aktualisieren.
4. **Archiv-Schritt** aufrufen (§3.1-Logik).

### 3.3 Archiv-Layout dokumentieren

`crew-planning` + `crew-context` erhalten den `.planning/archive/`-Aufbau (roadmap-`<slug>`.md + plans/`<slug>`/) als bekannten Ort.

---

## 4. Betroffene Dateien

| Datei | Änderung |
|---|---|
| `skills/crew-config/SKILL.md` | `config.deploy` (mode/provider/tagPattern/environments) ins Schema + Erläuterung mit Mode-Tabelle und §2.2-Obergrenze-Regel. |
| `skills/crew-deploy/SKILL.md` | **neu** — Release/Deploy-Konventionen, Obergrenze-Regel, Provider-Handling, Sicherheit. |
| `skills/crew-context/SKILL.md` | `DEPLOY.md` + `archive/` in die State-Datei-Tabelle. |
| `skills/crew-planning/SKILL.md` | `.planning/archive/`-Layout dokumentieren. |
| `commands/ship.md` | **neu** — die ship-Pipeline (§2.5), deferiert an `config.git`. |
| `commands/archive.md` | **neu** — mechanischer Archiv-Durchreicher (§3.1). |
| `commands/complete-milestone.md` | **neu** — Milestone-Abschluss + Archiv (§3.2). |
| `commands/setup.md` | `config.deploy` (mode/provider) global erfragen. |
| `commands/init.md` | `config.deploy` per-project erfragen + `DEPLOY.md` anbieten (wenn `mode ≠ off`); Config-Seed. |
| `README.md` | Command-Liste um `ship`, `archive`, `complete-milestone` ergänzen. |
| `.changeset/*` | minor-Changeset. |

---

## 5. Risiken & Entscheidungen

- **Git-Komposition (§2.2)** ist die heikelste Stelle — ship muss *jeden* Remote-/Commit-Schritt an `config.git` gaten, nie still durchgreifen. Reviewer-Fokus hier.
- **Kein CI-Scaffolding im MVP** — `provider` steuert nur Orchestrierung (`gh`/`glab`), nicht das Generieren von Pipeline-Files. Explizit so geloggt.
- **`execute`-Mode fasst Prod an** — nur nach Bestätigung, nie bei rotem verify; Deploy-Kommando kommt aus `DEPLOY.md` (Nutzer-kontrolliert), nicht aus crew geraten.
- **Provider-CLIs vorausgesetzt** (`gh`/`glab`): wenn nicht installiert/authentifiziert → ship erklärt und stoppt, statt zu raten.
- **`.planning/` gitignored in diesem Repo** — `DEPLOY.md`/`archive/` betreffen Nutzerprojekte; hier kein Live-Zustand.
- **Archiv ist `mv`-basiert** — dank der Milestone-Ordner-Struktur (vorheriges Design) ein reines Verschieben ohne Inhaltsänderung.
