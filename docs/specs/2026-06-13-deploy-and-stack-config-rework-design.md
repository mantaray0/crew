# Deploy-Rework + Stack-Entkopplung — Design-Spec

- **Datum:** 2026-06-13
- **Status:** Entwurf — Design über Fragen geklärt, Umsetzung ausstehend.
- **Scope:** (A) Rework des Deploy/Release-Modells (`config.deploy.mode` abschaffen), (B) Entkopplung der Stack-Fakten von ihrer Prosa.
- **Revidiert:** `2026-06-12`/`2026-06-13`-Deploy-Design (Teil A der `deploy-and-archive`-Spec) — der dort eingeführte `mode`-Vertrag (`off`/`orchestrate`/`execute`) wird ersetzt. Die ship-Pipeline und `crew-deploy` bleiben im Kern, ändern aber ihr Gating-Modell.
- **Nicht im Scope:** CI-Workflow-Scaffolding (unverändert Folge-Iteration). Roadmap-Archiv (Teil B der alten Spec) ist unberührt.

---

## 1. Motivation

### 1.1 Der Widerspruch im `mode`-Vertrag

`crew-deploy` behauptet für `orchestrate`: *„the deployment itself is the CI pipeline's job (**crew never touches prod**)"* — und enthält im selben Modus den Schritt **push**. In einer push-getriggerten CI/CD-Welt **ist der Push der Deploy-Trigger** (Push auf `main` / Tag-Release → Pipeline → prod). „crew never touches prod" und „orchestrate pusht" können nicht beide wahr sein.

### 1.2 `mode` ist redundant mit `config.git`

Legt man die ship-Schritte einzeln gegen `config.git`, steuert dieses bereits jeden Git-Schritt (commit/push/PR/merge). Die `mode`-Achse fügt **genau einen** Freiheitsgrad hinzu, den `config.git` nicht kennt: **ob crew ein imperatives Deploy-Kommando ausführt** (Vercel/Fly/rsync). Das ist ein einzelner Schalter, kein 3-Stufen-Vertrag. `off`/`orchestrate`/`execute` mappen ansonsten 1:1 auf bereits existierende Konzepte (`git.autoPush` etc. + „Command nicht aufrufen").

### 1.3 Namens- und Heimat-Kollisionen

- **`execute`** kollidiert als Modus-Name mit `/crew:execute` (Domänen-Verb: eine Phase abarbeiten) — Homonym im Config-Vokabular.
- **`DEPLOY.md`** (per exaktem Pfad gelesen) kollidiert mit der neuen `reference/`-Konvention, die `reference/deploy.md` (Coolify/Hetzner-Runbook) sogar als Paradebeispiel nennt und explizit von `DEPLOY.md` abgrenzt (*„unlike DEPLOY.md"*). Zwei konkurrierende Heimaten für Deploy-Wissen.

### 1.4 Stack-Fakten doppelt gepflegt

Der Tech-Stack lebt strukturiert in `config.stack` **und** narrativ als Tabelle in `PROJECT.md`. Die *Fakten* sind redundant; nur das *Warum* ist exklusiv in `PROJECT.md`. (Ein dediziertes `STACK.md` existiert nicht.) Der Stack ist **Standing-Context** (jede Session, tag-basierte Reviewer-Auswahl) — er gehört **nicht** nach `reference/` (load-on-demand), aber die Faktendoppelung lässt sich auflösen.

---

## 2. Deploy-Rework (A)

### 2.1 `config.deploy` — vorher → nachher

```jsonc
// VORHER
"deploy": {
  "mode": "off | orchestrate | execute",   // 3-Stufen-Eskalation, ~redundant mit config.git
  "provider": "gh-actions | gitlab-ci",
  "tagPattern": "v{version}",
  "environments": []
}

// NACHHER
"deploy": {
  "enabled": true,                  // ersetzt mode:off — ship an/abwählbar (erbt global → project)
  "provider": "gh-actions | gitlab-ci",
  "tagPattern": "v{version}",
  "environments": [],               // optionale benannte envs
  "runDeploy": "off | ask | auto"   // das Residuum: führt crew ein imperatives Deploy-Kommando aus?
}
```

- **`enabled`** (Default `true`) — reiner An/Aus-Toggle für `/crew:ship`, global oder projektbezogen. Ersetzt `mode: off`. `false` → ship erklärt, wie man's einschaltet, und stoppt.
- **`runDeploy`** (Default `off`) — der **einzige** Freiheitsgrad, den `config.git` nicht abdeckt: ob crew nach dem Git-Teil ein imperatives Deploy-Kommando ausführt. `off` = push-getriggerte Welt (Push *ist* der Deploy, kein Extra-Kommando). `ask`/`auto` = imperative Welt (Vercel/Fly), Kommando aus `reference/deploy.md`.

### 2.2 `config.git` ist die **einzige** Git-Autorität

Der frühere Doppel-Layer („`mode` sagt was, `config.git` sagt ob") entfällt. **Es gibt keine zweite, deploy-eigene Push-Achse mehr.** Jeder Git-Schritt von `/crew:ship` deferiert ausschließlich an `config.git`:

| ship-Schritt | Gate in `config.git` | Verhalten wenn aus/false |
|---|---|---|
| Release-Commit | `autoCommitPerPhase` (Geist: auto vs. ask) | nicht still committen → **fragen** (Release braucht Commit zum Taggen). |
| Push (Commit + Tag) | `autoPush` (Default false) | nicht still pushen → **fragen**; bei Ablehnung lokal bleiben (version+commit+tag gültig). |
| PR/MR öffnen | `autoPR` (Default false) | nicht automatisch → **fragen** / überspringen. Provider-CLI (`gh`/`glab`). |
| Branch/Merge | `branchPattern`, `mergeStrategy`, `askBeforeMerge` | wie in `git-merge`. |

**Damit löst sich §1.1 auf:** Der prod-Trigger ist der Push — und der gehört jetzt ehrlich `git.autoPush` (Default `false` → fragt). Der Mensch autorisiert den Push, der Push deployt. „crew never touches prod" fällt direkt aus der Config statt aus einem Slogan.

### 2.3 `/crew:ship` — neuer Flow

1. **Read config.** `config.deploy` + `config.git` + `reference/deploy.md` (falls vorhanden). Wenn `deploy.enabled: false` → erklären, wie man's einschaltet, **stoppen**.
2. **Gate on verify.** Nur weiter, wenn letzter verify grün (`LOG.md`); sonst `/crew:verify` empfehlen und stoppen.
3. **Version.** Changesets (`pnpm version`/`changeset version`) oder Bump per `tagPattern`/Projektkonvention.
4. **Git-Sequenz — strikt via `config.git`:** Release-Commit (`autoCommitPerPhase`) → Tag → Push (`autoPush`) → PR (`autoPR`) → Merge (`mergeStrategy`/`askBeforeMerge`). Kein deploy-eigenes Gating.
5. **Deploy-Kommando — nur wenn `runDeploy ≠ off`:** Kommando fürs Ziel-env aus `reference/deploy.md` (bei `ask` nach Bestätigung). Nie bei rotem verify. crew rät nie ein Kommando.
6. **Record.** Append an `LOG.md` (Version, Tag, Push/PR/Deploy-Ergebnis).

In der push-getriggerten Welt **entfällt Schritt 5** (`runDeploy: off`) — der Push aus Schritt 4 ist das Deployment.

### 2.4 `DEPLOY.md` → aufgespalten, Konzept gestrichen

`DEPLOY.md` als dediziertes, per-Pfad-gelesenes Artefakt entfällt. Sein Inhalt spaltet sich nach Datentyp:

- **Strukturierte Daten** (`tagPattern`, `environments`, `runDeploy`) → `config.deploy`.
- **Prosa-Runbook** (Rollback, Secrets-*Policy* als Pointer, Migrations, env-Details, das Deploy-Kommando selbst) → `reference/deploy.md` (generische `reference/`-Konvention, kein Spezial-Konzept mehr).
- `/crew:ship` lädt `reference/deploy.md` natürlich, weil ship per Definition „die Deploy-Area berührt" (genau die load-on-demand-Regel von `reference/`).

### 2.5 Config-Migration / Reconcile

Das Entfernen von `deploy.mode` ist ein Schema-Bruch. Der Session-Start-Hook **warnt** nur über die `crewVersion`-Differenz; das eigentliche **Reconcile läuft über `/crew:init`** (project) bzw. `/crew:setup` (global) im Reconcile-Modus. Dort greift das verlustfreie Mapping bestehender Configs:

| alt | neu |
|---|---|
| `mode: off` | `enabled: false` |
| `mode: orchestrate` | `enabled: true`, `runDeploy: off` |
| `mode: execute` | `enabled: true`, `runDeploy: ask` |

Zusätzlich: existierende `.planning/DEPLOY.md` → Hinweis im Reconcile, Inhalt nach `reference/deploy.md` zu verschieben (mechanisch nicht erzwingen — Nutzer-kontrolliertes Doc).

---

## 3. Stack-Entkopplung (B)

### 3.1 `config.stack` = Single Source of Truth, `PROJECT.md` = das Warum

- **`config.stack`** ist die autoritative Quelle der Stack-*Fakten* (was: language/app/db/orm/…). Single point of edit.
- **`PROJECT.md`** behält die **Architektur-Entscheidungen (das Warum)** und zeigt die Stack-Tabelle als **abgeleitete Spiegelung** aus `config.stack` — nicht als zweite Pflegestelle. Stack-Änderungen gehen über `config.stack`; crew führt die Spiegelung in `PROJECT.md` mit.
- **Kein `reference/`** — der Stack ist Standing-Context (auto-geladen), nicht load-on-demand. Das wird in `crew-context` explizit so abgegrenzt (Kontrast zu `reference/deploy.md`).
- `/crew:init` und `/crew:brief` schreiben die Stack-Fakten **primär in `config.stack`**; die `PROJECT.md`-Tabelle wird daraus abgeleitet.

---

## 4. Offene Detailentscheidungen (Empfehlung, finalisiert im Spec-Review)

- **Feldname `runDeploy`** *(empfohlen)* statt `command`/`deployCommand` — Verb, beschreibt die Aktion, vermeidet Verwechslung mit „dem Kommando-String".
- **`enabled` Default `true`** *(empfohlen)* — Sicherheit kommt aus `config.git` (`autoPush: false`) + `runDeploy: off`; `enabled: true` heißt nur „ship verfügbar", nicht „autonom".

---

## 5. Betroffene Dateien

| Datei | Änderung |
|---|---|
| `skills/crew-config/SKILL.md` | `config.deploy`: `mode` raus, `enabled` + `runDeploy` rein; Mode-Tabelle ersetzen. Reconcile-Mapping (§2.5). `stack` als SSOT klarstellen (§3.1). |
| `skills/crew-deploy/SKILL.md` | `mode`-Vertrag entfernen; Gating allein via `config.git` (§2.2); `runDeploy`-Schalter; `DEPLOY.md`-Verweise → `reference/deploy.md`. |
| `skills/crew-context/SKILL.md` | `DEPLOY.md`-Zeile entfernen; `reference/deploy.md` als Deploy-Heimat; `PROJECT.md`-Beschreibung: Stack-Tabelle = Spiegelung aus `config.stack` (§3.1). |
| `commands/ship.md` | Flow auf §2.3 umstellen (enabled-Gate, Git via config.git, `runDeploy`-Schritt, `reference/deploy.md`). |
| `commands/init.md` | Deploy-Erhebung: `enabled` + `provider` + `runDeploy` statt `mode`; `DEPLOY.md`-Angebot → `reference/deploy.md`. Stack-Fakten primär in `config.stack`. **Reconcile-Modus:** Migrations-Mapping `mode` → `enabled`/`runDeploy` (§2.5). |
| `commands/setup.md` | Globale Deploy-Defaults: `enabled`/`provider`/`runDeploy` statt `mode`. Reconcile-Mapping analog. |
| `README.md` | Deploy-Beschreibung aktualisieren (kein `mode` mehr). |
| `.changeset/*` | minor-Changeset (Breaking-Config mit Auto-Migration). |

---

## 6. Risiken & Entscheidungen

- **Config-Migration ist der heikelste Teil** — bestehende Configs dürfen nach dem Update nicht brechen. Reconcile-Mapping (§2.5) muss greifen, bevor `/crew:ship` zum ersten Mal mit neuem Schema läuft. Reviewer-Fokus.
- **`config.git` als einzige Git-Autorität** — ship darf *keinen* Git-Schritt an `config.git` vorbei tun. Der Wegfall der zweiten Achse vereinfacht, verschiebt aber alle Verantwortung auf korrektes config.git-Gating.
- **`reference/deploy.md` ist load-on-demand** — ship muss es aktiv laden (es ist nicht auto im Context). Klar im ship-Command verankern.
- **Stack-Spiegelung kann driften** — Gegenmaßnahme: `config.stack` ist single point of edit, crew führt die `PROJECT.md`-Tabelle bei Änderungen nach. Kein automatischer Renderer (Markdown-first).
- **Breaking für Nutzerprojekte** — `mode` verschwindet aus dem öffentlichen Config-Vertrag; Auto-Migration + Changelog-Hinweis mildern das.
