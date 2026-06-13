# Release-Tool + Deploy/Release-Interview — Design-Spec

- **Datum:** 2026-06-13
- **Status:** Entwurf — Design über Fragen geklärt, Umsetzung ausstehend.
- **Scope:** (A) `config.deploy` um die Release-*Mechanik* erweitern (`releaseTool` + `finishRelease`), (B) `/crew:ship` nach `releaseTool` verzweigen statt Changesets hartcodiert zu erkennen, (C) `/crew:init` und `/crew:setup` führen ein Deploy/Release-Interview — geschichtet (global Default < projekt Override), wobei nur init das projekt-spezifische Runbook `reference/deploy.md` erzeugt.
- **Baut auf:** `2026-06-13-deploy-and-stack-config-rework-design.md` (released als 0.6.0). Dieses Design erweitert `config.deploy` (enabled/provider/tagPattern/environments/runDeploy) um die Release-Mechanik.
- **Nicht im Scope:** CI-Workflow-Scaffolding (Generieren von `.github/workflows`/`.gitlab-ci.yml`). npm-publish-Logik.

---

## 1. Motivation

Der bisherige `/crew:ship` erkennt das Versionierungs-Tool **ad-hoc**: „wenn `.changeset/` existiert → `pnpm version`, sonst Tag-Bump". Das ist ein hartcodierter Sonderfall, der die Landschaft nicht abbildet. Release-Tools unterscheiden sich darin, **wo der Versions-Entscheid fällt** — und das ändert, was ship überhaupt tun darf:

| Tool | Versions-Entscheid | ship-Konsequenz |
|---|---|---|
| **Changesets** | CI-Bot-PR (push → Version-PR → merge) | **kein** lokaler Bump; nur Changeset sicherstellen + push |
| **release-please** | CI-Bot-PR (Conventional Commits) | wie Changesets, ohne Changeset-File |
| **semantic-release** | CI **autonom**, kein PR | **nur push**; CI taggt + published allein |
| **manual** (`npm version`, `cargo release`, `bumpversion`) | **lokal**, Mensch | `version → commit → tag → push` |

Würde ship bei `changesets` lokal `npm version` laufen lassen, kollidierte es mit dem Bot. Die Mechanik muss daher **explizit** sein. Zugleich soll das **konkrete Verfahren** (wie dieses Projekt released/deployt: Branch/Tag-Regeln, Rollback, Deploy-Command) beim Projekt-Init **aktiv erhoben** und in `reference/deploy.md` festgehalten werden — statt nur „angeboten".

---

## 2. `config.deploy` — zwei neue Felder

```jsonc
"deploy": {
  "enabled": true,
  "provider": "gh-actions",
  "tagPattern": "v{version}",
  "environments": [],
  "runDeploy": "off",
  "releaseTool": "auto",      // NEU: "auto" | "changesets" | "release-please" | "semantic-release" | "manual" | "none"
  "finishRelease": "ask"      // NEU: "off" | "ask" | "auto" — Phase 2 (offenes Version-PR mergen); nur bei Bot-PR-Tools wirksam
}
```

- **`releaseTool`** (Default `auto`) — die Release-Mechanik. `auto` erkennt beim Lauf aus dem Repo:
  - `.changeset/` (mit `config.json`) → `changesets`
  - `release-please-config.json` / `.release-please-manifest.json` → `release-please`
  - `.releaserc*` / `release.config.{js,cjs,mjs,json}` / `package.json` `"release"`-Key → `semantic-release`
  - sonst → `manual`
- **`finishRelease`** (Default `ask`) — steuert, ob ship die **zweite Phase** bei Bot-PR-Tools übernimmt (das offene Version-/Release-PR mergen → CI taggt+released). Bei `manual`/`semantic-release`/`none` **bedeutungslos** (es gibt kein Version-PR).

Beide schichten normal (`defaults < global < project`).

---

## 3. `/crew:ship` — Verzweigung nach `releaseTool`

Schritt 3–6 (Version/Commit/Tag/Push) werden tool-abhängig. Schritt 1–2 (Read config, Gate on verify), 7 (PR), 8 (`runDeploy`), 9 (Record) bleiben. **Alle Git-Schritte deferieren weiter an `config.git`** (single git authority).

| `releaseTool` | ship Schritt 3–6 + Phase 2 |
|---|---|
| `manual` | Version lokal (`npm version` / sprach-spezifisch, Befehl aus `reference/deploy.md`) → Release-Commit (`autoCommitPerPhase`) → Tag (`tagPattern`) → Push (`autoPush`) → PR (`autoPR`). |
| `changesets` | **Kein** lokaler Bump, **kein** Tag durch ship. Sicherstellen, dass ein Changeset existiert (`.changeset/*.md` außer `README`/`config`); fehlt einer → anbieten (`changeset add`) oder mit Hinweis stoppen. Changeset committen falls uncommitted → Push (`autoPush`) → Bot öffnet Version-PR. **Phase 2** (`finishRelease ≠ off`): ist ein Version-PR offen (`changeset-release/*`), nach `finishRelease` (ask→fragen / auto→mergen) mergen → CI taggt+released. |
| `release-please` | Wie `changesets`, Conventional-Commit-getrieben (kein Changeset-File): Push → Bot öffnet Release-PR → Phase 2 per `finishRelease`. |
| `semantic-release` | **Nur** Push (`autoPush`). Kein version/commit/tag durch ship; CI bestimmt Version + taggt + released autonom. `finishRelease` irrelevant. |
| `none` | Kein Versioning: nur Git-Teil (commit/push/PR), kein version/tag-Schritt. |

`finishRelease` respektiert weiter `crew-conventions` (jeder prod-auslösende Merge ist ein bewusster Schritt) und das verify-grün-Gate.

---

## 4. Deploy/Release-Interview — geschichtet

Ein Interview, zwei Ebenen. Die **strukturierten Achsen** werden global wie projektweise erhoben; das **Runbook** nur projektweise.

### 4.1 `/crew:setup` (global) — die Achsen als Default

Im First-run-/Reconcile-Flow für `config.deploy` single-select: `enabled` · `provider` · **`releaseTool`** · `runDeploy` · `finishRelease` · (optional `tagPattern`). Das sind die **globalen Defaults**, die jedes Projekt erbt. **Kein Runbook** (kann nicht global sein).

### 4.2 `/crew:init` (projekt) — Achsen-Override + Runbook

Schritt 6 von init wird vom „biete an" zum **aktiven Interview**:
1. `enabled` (on / off / **inherit global**).
2. Wenn enabled: `provider`, **`releaseTool`** (mit dem aus dem Repo **erkannten** Vorschlag vorbelegt), `runDeploy`, und — nur wenn `releaseTool` ein Bot-PR-Tool ist (`changesets`/`release-please`, inkl. `auto`-Erkennung darauf) — `finishRelease`.
3. **Verfahren erheben** und in `reference/deploy.md` schreiben: Release-Strategie, Branch/Tag-Konventionen, Environments, Secrets-*Policy* (Pointer, nie Werte), Rollback, und — bei `runDeploy ≠ off` — das/die Deploy-Command(s). In `PROJECT.md` `## Reference` eine Zeile indexieren.

Jede Achse override-bar; nicht beantwortete erben den globalen Default (`crew-conventions`: Default als empfohlene Antwort zeigen, nie still anwenden).

---

## 5. Betroffene Dateien

| Datei | Änderung |
|---|---|
| `skills/crew-config/SKILL.md` | `config.deploy`: `releaseTool` + `finishRelease` ins Schema + Erläuterung (Werte, `auto`-Erkennung, Schichtung, „finishRelease nur bei Bot-PR-Tools"). |
| `skills/crew-deploy/SKILL.md` | Neue Sektion „Release mechanics": `releaseTool`-Tabelle (was ship pro Tool tut), Phase-2-/`finishRelease`-Regel, `auto`-Erkennung. Die ship-Schritt-Beschreibung entkoppeln von Changesets-Hartcodierung. |
| `commands/ship.md` | Schritt 3–6 nach `releaseTool` verzweigen (§3); Phase 2 (`finishRelease`); Version-Befehl/Verfahren aus `reference/deploy.md`. |
| `commands/init.md` | Schritt 6 → Deploy/Release-Interview (§4.2): `releaseTool` (erkannt vorbelegt) + `finishRelease` (konditional) + Runbook aktiv erzeugen. |
| `commands/setup.md` | First-run + Reconcile: `config.deploy` um `releaseTool` + `finishRelease` erweitern (§4.1). |
| `README.md` | `/crew:ship`-Beschreibung: Release-Mechanik-Achse erwähnen. |
| `.changeset/*` | minor-Changeset (additive Felder, keine Migration nötig). |

---

## 6. Risiken & Entscheidungen

- **`auto`-Erkennung muss robust sein** — mehrdeutige Repos (z. B. Changesets *und* ein `release.config.js`) brauchen eine klare Präzedenz: `changesets` > `release-please` > `semantic-release` > `manual`. In `crew-config`/`crew-deploy` festschreiben.
- **Phase 2 ist prod-auslösend** — das Mergen des Version-PR taggt+released. `finishRelease: auto` darf nur bei grünem verify und unter `crew-conventions` greifen; `ask` ist der sichere Default.
- **Kein neues Migrationsrisiko** — `releaseTool`/`finishRelease` sind **additiv** (neue Felder mit Defaults); der generische Reconcile-Schema-Diff fragt sie als „new fields" ab. Keine Known-migration nötig.
- **Feldzahl in `config.deploy`** — mit `releaseTool`/`finishRelease` sind es sieben Felder. Gerechtfertigt, weil jedes eine distinkte Achse ist und `finishRelease` nur konditional wirksam ist; das *Verfahren* (Prosa) bleibt im Runbook, nicht in der config.
- **Runbook ist projekt-only** — `reference/deploy.md` hat bewusst kein globales Pendant; `setup` erhebt nur die Achsen-Defaults.
