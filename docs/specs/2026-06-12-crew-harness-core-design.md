# crew — Meta-Agent-Harness (Core Engine) · Design-Spec

- **Datum:** 2026-06-12
- **Status:** Umgesetzt (Core Engine), danach auf *pures Plugin* umgestellt — siehe Update.
- **Update 2026-06-12:** Architektur auf **reines Claude-Code-Plugin** umgestellt (wie Superpowers/GSD): **keine CLI, kein npm, kein TS-Build**. `crew init`/`crew setup` sind jetzt die Slash-Commands `/crew:init` / `/crew:setup`; das Config-Schema + die Archetypen leben im `crew-config`-Skill; Distribution über die Plugin-Marketplace, Releases als `x.x.x`-GitHub-Tags ohne npm. Abschnitte zu CLI/`src`/`dist`/`tsup` unten sind historisch.
- **Name:** `crew` (Plugin + Command-Namespace `/crew:`).
- **Scope dieser Spec:** Core Engine. Stack-spezifische Skills, externe PM-Adapter, das PM-Tool (eigenes) und die Boilerplate sind eigene Folge-Specs.

---

## 1. Ziel & Leitprinzip

`crew` ist ein **Claude-Code-Plugin** mit begleitendem **CLI**, das einen schlanken, **config-getriebenen** agentischen Workflow liefert, zugeschnitten auf den Stack und die Arbeitsweise des Nutzers.

Es löst die Schmerzpunkte bestehender Ansätze:

- **Zu rigide Gates** → Klärung gebündelt (Roast-Me mit Empfehlungen), danach Durcharbeiten; Rückfragen nur wenn nötig.
- **Zu viele Pflicht-Artefakte / Renumbering-Drama** → Roadmap ist editierbares Markdown; Phasen einschieben/tauschen ist eine Textänderung.
- **Autonome Loops als Default** → Loop ist **opt-in**.

**Leitprinzip:** *Eine Konfiguration mit Workflow* — nicht ein Workflow mit Konfiguration. Verhalten (Git, Verify, Modelle, Klärungstiefe, PM-Anbindung) wird per Config bestimmt; der Workflow folgt.

### Originalität / keine Fremdreferenzen

Adaptierte Inhalte stammen aus öffentlichen, MIT-lizenzierten Quellen, werden aber **substanziell umgeschrieben, umbenannt, gekürzt/ergänzt und teils neu erzeugt**. Im gesamten Repo gibt es **keine Referenzen auf Fremd-Harnesse, deren Namen, Branding oder Marketing**. Ergebnis sind eigenständige Derivate bzw. Neufassungen.

### Non-Goals

- Keine Multi-IDE/Cross-Tool-Distribution (Claude Code zuerst; Struktur erlaubt spätere Targets, baut sie aber nicht).
- Nicht autonom-by-default.
- Keine 1:1-Kopien fremder Inhalte.

---

## 2. Architektur-Überblick

```
Control-Surface   commands/        →  /crew:* Slash-Commands (die Steuerung)
Spezialisten      agents/          →  Reviewer, Architect, Simplifier, …
Wissen            skills/ rules/ contexts/
Automatik         hooks/           →  Session-Lifecycle (Kontext laden/sichern)
CLI               cli/             →  crew init / crew update  (Bun-first, Node-kompatibel)
Zustand (Projekt) .planning/       →  committed im Ziel-Repo
```

Der **Harness lebt zentral** (Plugin, einmal installiert, zentral aktualisierbar). Der **Projekt-Zustand lebt im Ziel-Repo** (`.planning/`, committed, teilbar, später vom PM-Tool auslesbar).

---

## 3. Repo-Layout

```
crew/
├── .claude-plugin/plugin.json     # Manifest: name, version, commands/agents/skills/hooks
├── commands/                      # /crew:brief, /crew:plan, /crew:execute, …
├── agents/                        # planner, code-explorer, *-reviewer, simplifier, …
├── skills/                        # Meta-Skills jetzt; Stack-Skills = Folge-Spec
├── rules/                         # immer geltende Leitplanken (adaptiert, rebranded)
├── contexts/                      # Modi: dev / review / research
├── hooks/                         # hooks.json + scripts/
├── cli/                           # TS-Quelle des crew-CLI
├── templates/.planning/           # Vorlage des Projekt-Zustands (von crew init kopiert)
└── docs/specs/                    # Design-Specs (diese Datei)
```

---

## 4. Projekt-Zustand: `.planning/` (committed)

Von `crew init` pro Projekt angelegt:

```
.planning/
├── config.json          # Steuerzentrum (§5)
├── PROJECT.md            # lebende Projekt-Wahrheit ("Tech-Deck")
├── roadmap.md            # Meilensteine → Phasen, Status + Zeitstempel + Claims
├── plans/<id>.md         # detaillierter Plan je Feature/Phase/Ticket
├── backlog.md            # Ideen-Inbox: reibungslos ablegen, bei plan/groom triagieren
├── claims.json           # welche Instanz/Worktree bearbeitet welche Phase (§6.3)
├── log.md (oder log/<feature>.md) # append-only Fortschritts-Log
├── sessions/<worktree-id>/ # Session-Snapshots je Instanz (kollisionsfrei)
└── .gitignore            # schließt volatile Snapshots aus, falls config das will
```

### 4.1 `PROJECT.md` — Single Source of Truth (statisch-lebend)

Wird vom **SessionStart-Hook automatisch (gebündelt) geladen**. Enthält:

- **Stack** (aus dem Interview): DB, ORM, Frontend, UI, Backend/API, Queue, Deploy.
- **Architektur-Entscheidungen** (warum, nicht nur was) — verhindert Relitigation.
- **Aktueller Stand** in 2–3 Sätzen (was läuft, was als Nächstes).
- **Constraints** (Dinge, die immer gelten).

`PROJECT.md` ist die *immer geltende* Wahrheit; `roadmap.md` ist der *Fahrplan*; `plans/` ist die *Detailebene*; `log.md` ist die *Historie*.

### 4.2 `roadmap.md` — flexibel

Plain Markdown, Meilensteine → Phasen, jede Phase mit Status-Marker und (bei Abschluss) Zeitstempel:

```markdown
## Meilenstein 1: Fundament
- [x] 1.1 Backend-Struktur        — erledigt 2026-06-12 14:30
- [>] 1.2 DB-Schema (Drizzle)     — aktiv
- [ ] 1.3 Auth
## Meilenstein 2: …
```

Marker: `[ ]` offen · `[>]` aktiv · `[x]` erledigt · `[~]` zurückgestellt. **Einschieben/Umsortieren/Streichen** ist reine Textänderung (per `/crew:adjust` oder direkt). Keine Nummerierungs-Zwänge.

### 4.3 `plans/<id>.md` — Spec-Kopf + Detailplan in einer Datei

Bewusst **eine** Datei mit zwei Ebenen (keine getrennte Spec-/Plan-Datei, außer `clarify.specArtifact:"separate"`):

```markdown
# <Feature/Ticket>

## Spec   ← das "Was/Warum" (aus Roast-Me oder externem Ticket)
- Ziel / Problem
- Anforderungen
- Akzeptanzkriterien
- Out of Scope
- externalRef: <ticket-id>   ← nur bei /crew:pull

## Plan   ← das "Wie"
- betroffene Dateien
- Tasks: Action / zu spiegelndes Muster / Validierungsbefehl
- Risiken
- Verify-Konfiguration dieser Phase
```

- **Spec-Quelle:** Bei `/crew:brief`/`/crew:plan` füllt Roast-Me den Spec-Kopf. Bei `/crew:pull <id>` kommt der Spec-Kopf aus dem externen Ticket (Titel/Beschreibung/Akzeptanzkriterien) — **keine Doppelung**.
- **`clarify.specArtifact`:** `"section"` (Default, Spec-Kopf im Plan) · `"separate"` (eigene `specs/<id>.md`, Superpowers-Stil) · `"off"` (Quick-Tasks ohne formale Spec).
- **Neues Projekt** braucht keinen Spec-Kopf je Feature für die Gesamtvision — die lebt in `PROJECT.md`.
- **Dateinamen** (verschärft seit diesem Entwurf, siehe `crew-planning`): Briefs aus `/crew:brief` heißen `plans/_<slug>.md` (unterstrich-präfixiert, un-nummeriert) — `/crew:plan` erzeugt daraus die nummerierten Phasen-Pläne `plans/<id>-<titel>.md`. Das `_` trennt rohe Initiativen optisch von geplanten Phasen.

### 4.4 `log.md` — Fortschritt

Append-only, inkl. leichtgewichtigem Token-/Kosten-Tracking pro Phase:
`2026-06-12 14:30 · M1.2 erledigt · commit abc1234 · Verify: pass · ~38k tok / $0.42`.
`/crew:report` aggregiert daraus eine Übersicht.

### 4.5 `sessions/` — Snapshots

Format mit: Was wird gebaut · Was funktioniert (mit Beleg) · Was NICHT funktioniert (mit Grund) · Dateizustände · Entscheidungen · Blocker · **exakter nächster Schritt**. Committed per Default; `config.state.commitSessions=false` schließt sie via `.gitignore` aus.

---

## 5. `config.json` — Steuerzentrum

Defaults aus dem Plugin; pro Projekt überschreibbar; einzelne Phasen dürfen im Setup-Flow abweichen. Globaler Layer in `~/.claude/crew/config.json` für Defaults über alle Projekte.

```jsonc
{
  "git": {
    "autoCommitPerPhase": true,     // atomarer Commit nach verifizierter Phase
    "autoPush": false,              // Remote nie ohne Freigabe
    "autoPR": false,
    "commitStyle": "conventional",
    "branchPattern": "feat/{slug}",
    "isolation": "worktree-per-feature", // "worktree-per-feature" | "branch-per-feature" | "linear"
    "mergeStrategy": "integration-branch", // "integration-branch" | "pr" | "ask-each"
    "askBeforeMerge": false,        // true erzwingt Rückfrage vor jedem Merge
    "conflictPolicy": "resolve-or-ask" // Coordinator löst Eindeutiges, fragt bei Unklarheit
  },
  "execution": {
    "parallel": "auto",             // "auto" (erkennen + bestätigen) | "manual" (/crew:dispatch) | "off"
    "maxConcurrent": 3,             // Cap gleichzeitiger Worktrees/Sub-Agents
    "onDeviation": "small-self-major-ask" // kleine Abweichung selbst, echtes Problem → fragen
  },
  "verify": {
    "default": ["verify", "review", "harden", "simplify"],
    "perPhaseOverride": true        // Phase darf Schritte an-/abschalten
  },
  "models": {
    "mode": "auto",                 // "auto" | "manual"
    "planning": "opus",
    "execution": "sonnet",
    "review": "opus",
    "simplify": "sonnet",
    "trivial": "haiku"
  },
  "clarify": {
    "depth": "normal",              // "light" | "normal" | "deep"
    "askOnlyWhenStuck": true,       // nach der Klärungsphase nur bei echten Blockern fragen
    "specArtifact": "section"       // "section" (Spec-Kopf im Plan) | "separate" (eigene Datei) | "off"
  },
  "tasks": {
    "provider": "local",            // "local" | "mcp:linear" | "mcp:jira" | "mcp:clickup" | "crew-pm"
    "writeBack": false,             // Status/Kommentar zurück ins externe Tool
    "projectKey": null              // externe Projekt-/Board-ID
  },
  "testing": { "policy": "from-archetype" }, // Default je Projektart/Tag; "tdd" | "tests-required" | "optional"
  "security": { "auto": false },    // nie automatisch; Agent empfiehlt bei sensiblen Tags/Plan-Inhalten
  "notifications": {
    "enabled": true,                // global + projektweise; Default an
    "events": ["blocker", "completion"], // Blocker (braucht dich) + Abschluss längerer Läufe
    "channel": "os"                 // "os" (macOS osascript/terminal-notifier) | "push:ntfy" | "push:pushover" | "off"
  },
  "learn": { "enabled": true },     // /crew:retro aktiv (Self-Learn in Core)
  "state": { "commitSessions": true },
  "loop": { "maxIterations": 6 },
  "projectType": "saas-app",        // gewählter Archetyp aus dem globalen Registry (§5.1)
  "tags": ["nextjs", "hono", "drizzle", "auth"], // aktive Tags → aktivieren Rules/Skills
  "stack": { /* vom crew-init-Interview befüllt, aus Archetyp vorgeseedet */ }
}
```

Harte Grenze bleibt immer `settings.json` (welche Tools/Commands überhaupt erlaubt sind). `config.json` steuert *Verhalten innerhalb* dieser Grenzen.

### 5.1 Globaler Layer: Projektarten (Archetypen) & Tags

Globaler, vom Nutzer kuratierbarer Layer in `~/.claude/crew/`:

```
~/.claude/crew/
├── config.json        # globale Defaults (z.B. default-PM-Provider, Modelle)
├── tags/              # atomare Capability-/Stack-Marker
└── project-types.json # Archetypen = kuratierte Tag-Bündel + Defaults
```

- **Tag** = atomare Einheit, aktiviert zugehörige **Rules + Skills** (z.B. `hono` → API-Regeln + `hono-api`-Skill; `nextjs` → React/SSR-Regeln + react/next-Skills; `drizzle`, `bullmq`, `auth`, `payments`, `realtime`).
- **Projektart (Archetyp)** = benanntes, vordefiniertes Tag-Bündel + Defaults (Stack, Verify-Schritte, Modelle, ggf. PM-Provider). Beispiele: `saas-app`, `api-service`, `cli`, `marketing-site`, `mobile`.
- **Einrichtung:** Beim ersten Aufsetzen des Harness wird der Nutzer nach seinen Projektarten gefragt; das Registry ist jederzeit erweiterbar/änderbar. Der Harness liefert Starter-Archetypen passend zum Default-Stack.
- **Bei `crew init`:** „Welche Projektart?" → Auswahl aus dem Registry → seedet `projectType`, `tags`, `stack`, Verify-/Model-Defaults in die Projekt-`config.json`. Ein Projekt darf danach Tags zusätzlich an-/abwählen, ohne neue Projektart.
- **Auflösung zur Laufzeit:** Der **Tag-Set des Projekts** bestimmt, welche Rules/Skills aktiv sind → kontextsensitives Verhalten ohne manuelles Zuschalten.
- **PM-Provider:** global setzbar (Default + ggf. mehrere bekannte); pro Projekt in `config.tasks.provider` konkretisiert.

---

## 6. Command-Surface (die Spine)

Jeder Command: liest definierten Zustand, schreibt definierten Zustand, respektiert `config.json`.

| Command | Zweck | Liest | Schreibt | Gates |
|---|---|---|---|---|
| `/crew:brief` | Idee/Feature starten: **Roast-Me-Klärung** (Teil der Planungsphase) + **Stack-Interview** | – | `PROJECT.md`, initiale Spec | wartet auf Zusammenfassung-OK |
| `/crew:backlog` | Ideen-Inbox: jederzeit (auch mitten in der Umsetzung) Idee ablegen; anzeigen/triagieren | backlog | `backlog.md` | – |
| `/crew:plan` | Klarheit → Fahrplan + Detailpläne | PROJECT.md, Spec | `roadmap.md`, `plans/<id>.md` | wartet auf Plan-OK |
| `/crew:execute` | Nächste Phase ausführen (Kern-Loop) | PROJECT, roadmap, plan, log | Code, `log.md`, ggf. Commit | Verify + Commit per config |
| `/crew:verify` | Verify→Review→Härten→Simplify explizit | plan, Diff | Review-Bericht, `log.md` | – |
| `/crew:adjust` | Roadmap mitten im Flow ändern | roadmap | `roadmap.md` | – |
| `/crew:status` | Stand zeigen | roadmap, log, claims | – | – |
| `/crew:resume` | Frische Session orientieren | PROJECT, letzter Snapshot, log | – | wartet auf „weiter" |
| `/crew:ship` | Commit/Push/PR gemäß config | config, Diff | Git-Remote/PR | Freigabe-Gates |
| `/crew:pull <id>` | Externes Ticket → interner Plan | Provider (MCP) | `plans/<id>.md`, roadmap-Eintrag | – |
| `/crew:dispatch` | Unabhängige Phasen parallel ausführen (DAG, Worktrees, Sub-Agents) + rollend integrieren | roadmap, plans | Worktrees, Branches, claims, log | Parallel-Plan-Bestätigung |
| `/crew:quick` | **Quick-Lane** für Kleinkram/Bugfix außerhalb der Roadmap | – | Code, optional Commit | stört aktive Phase/Claims nicht |
| `/crew:loop` | **Opt-in** „iterieren bis Ziel" auf einer Phase | plan | Code, log | maxIterations |
| `/crew:retro` | Muster/Entscheidungen aus fertiger Arbeit destillieren → Skill/Tag-Vorschlag fürs globale Registry | log, Diff, PROJECT | Skill/Tag-Vorschlag (Core) | du bestätigst Übernahme |
| `/crew:rollback` | Revert auf letzten verifizierten Phasen-Commit | log, git | revertet Code, Roadmap/Log zurück | Bestätigung |
| `/crew:report` | Token-/Kosten-Übersicht über Phasen | log | – | – |

### 6.1 `/crew:brief` — Roast-Me + Stack-Interview

- **Roast-Me-Klärung** (Teil der Planungsphase): unerbittlich-aber-begrenztes Befragen entlang des Entscheidungsbaums; **jede Frage trägt eine empfohlene Antwort** (Nutzer nickt ab statt zu tippen); wenn eine Frage aus dem Code beantwortbar ist, wird recherchiert statt gefragt; Abschluss mit Zusammenfassung. Tiefe via `clarify.depth`.
- **Stack-Interview:** fragt DB / Frontend / UI / Backend-API / Queue / Deploy — **mit den Defaults des Nutzers vorbefüllt**. Option „**du entscheidest** → schlag vor → ich segne ab". Ergebnis → `config.stack` + `PROJECT.md`.

### 6.2 `/crew:execute` — Kern-Loop

1. Kontext laden: `PROJECT.md` + aktive Phase aus `roadmap.md` + zugehöriger `plans/<id>.md` + letzter Eintrag in `log.md` → **exakter nächster Schritt** steht fest.
2. Umsetzen (Model = `models.execution` bzw. auto).
3. **Verify-Pipeline** gemäß `verify` (Phase-Override beachtet), in **frischen Subagent-Kontexten** (§8).
4. Bei Erfolg: atomarer Commit (falls `git.autoCommitPerPhase`), `roadmap.md` Status + Zeitstempel, `log.md` Eintrag.
5. Bericht an Nutzer.

**Abweichungs-Handling (`execution.onDeviation`):** Kleine Abweichungen innerhalb der Plan-Absicht entscheidet der Agent selbst und vermerkt sie im Log. Bei echtem Problem, Mehrdeutigkeit oder Scope-Änderung wird **angehalten und gefragt**.

### 6.3 Parallelität, Worktrees & Merge

Adressiert „mehrere Aufgaben eines Plans gleichzeitig, ohne Kollision, mit sauberem Merge" — innerhalb einer Instanz (Sub-Agent-driven) oder über mehrere Instanzen.

1. **DAG aus dem Plan:** Phasen/Tasks tragen Abhängigkeiten. Der Harness baut den Graphen; nur **unabhängige** Knoten laufen parallel, abhängige sequenziell.
2. **Isolation:** Jede parallele Phase läuft in eigenem **Worktree + Branch** (`git.isolation`), als Sub-Agent (implementieren + verifizieren in Isolation). Cap: `execution.maxConcurrent`.
3. **Kollisionsschutz im State:** `plans/<id>.md` pro Feature · Logs append-only bzw. `log/<feature>.md` · Snapshots in `sessions/<worktree-id>/` · `claims.json` hält fest, welche Instanz welche Phase bearbeitet (`[>] @worktree-a` in `roadmap.md`).
4. **Rolling Integration:** Sobald eine Phase fertig **und verifiziert** ist, integriert der `merge-coordinator` sie gemäß `git.mergeStrategy` (`integration-branch` rollend · `pr` je Feature · `ask-each` jeder Merge gefragt). Nach jedem Merge Verify. Laufende Worktrees rebasen auf den neuen Stand → minimaler Drift.
5. **Konflikte (`git.conflictPolicy`):** Coordinator löst Eindeutiges (Muster/Tests entscheiden); bei echter Mehrdeutigkeit → Rückfrage.
6. **Auslösung:** `execution.parallel:"auto"` → Harness erkennt unabhängige Phasen, schlägt den Parallel-Plan vor, startet nach Bestätigung. Zusätzlich jederzeit explizit per `/crew:dispatch`.

Merge-Orchestrierung ist Teil des **Skill-/Rulesets** (`git-merge`-Skill + Rules), nicht ad-hoc.

---

## 7. Model-Management

- Jeder Command/Agent trägt einen **Task-Typ** (`planning|execution|review|simplify|trivial`).
- `mode:"manual"` → Task-Typ wird auf das fest konfigurierte Model gemappt.
- `mode:"auto"` → Heuristik: Planen/Review → Opus, Ausführen/Simplify → Sonnet, Triviales → Haiku.
- Commands **überschreiben das Model des Subagents pro Aufruf** (statt es in jeder Agent-Datei zu verdrahten).
- **Override-Präzedenz:** ad-hoc (Nutzer im Lauf) > Projekt-`config.json` > globaler Default > Plugin-Default.
- *Umsetzungs-Risiko:* Agent-Dateien tragen ein `model`-Frontmatter; die config-getriebene Übersteuerung erfolgt über den Subagent-Start mit Model-Override. In Phase 1 verifizieren, dass die Laufzeit das zuverlässig erlaubt; sonst Fallback: `crew init` generiert agent-Varianten je Profil.

---

## 8. Context-Handling über Sessions

- **SessionStart-Hook:** lädt `PROJECT.md` gebündelt (zeichenbegrenzt) → Claude orientiert sich automatisch, ohne Erklärung.
- **PreCompact-Hook:** sichert aktuellen Zustand in `sessions/` → kein Kontextverlust beim Komprimieren.
- **`/crew:resume`:** liest `PROJECT.md` + neuesten Snapshot + `log.md` → strukturiertes Briefing (Stand, „nicht erneut versuchen", nächster Schritt) → wartet auf „weiter".
- **Frischer Kontext pro Schritt:** Umsetzung und Verifikation laufen als getrennte Subagent-Durchläufe; der Plan + Log halten den Faden, nicht das Kontextfenster.

---

## 9. Verify-Pipeline

Reihenfolge (config-/phasensteuerbar), je in **frischem Subagent-Kontext**:

1. **verify** — Tests / Build / Typecheck (stack-spezifische Befehle aus `PROJECT.md`). Test-Strenge gemäß `testing.policy` (Default je Projektart/Tag).
2. **review** — Reviewer-Agents (allgemein + sprach-/domänenspezifisch).
3. **harden** — Silent-Failure-Jagd, Type-Design.
4. **simplify** — Vereinfachung ohne Funktionsänderung.

**Security-Pass ist nicht automatisch** (`security.auto:false`): Der planende/prüfende Agent **empfiehlt** ihn, wenn der Plan sensible Inhalte trägt (Auth, Payments, Tokens, sensible Tags) — ausgeführt wird er nur nach Freigabe.

Ergebnis wird zusammengefasst; kritische Findings blockieren den Phasen-Commit, bis behoben oder bewusst übergangen.

---

## 10. Agents (adaptiert & rebranded)

Kuratiert, an den Stack angepasst, ohne Fremdreferenzen:

- **planner / architect** (Task-Typ planning) — Planung & Architektur.
- **code-explorer** — Bestand verstehen vor Änderungen.
- **code-reviewer** (allgemein) + **typescript-reviewer**, **react-reviewer**, **database-reviewer** (Drizzle/Postgres) — Review.
- **security-reviewer** — Sicherheits-Pass.
- **silent-failure-hunter**, **type-design-analyzer** — Härten.
- **code-simplifier** — Simplify.
- **build-error-resolver** — Build-Fixes.
- **merge-coordinator** — integriert parallele Feature-Branches gemäß `git.mergeStrategy`, Verify nach jedem Merge. Bekommt den **Task-/Phasen-Kontext** mit (was sollte jede Seite tun) → löst Konflikte **absichtsbewusst** statt nach reinem Textdiff; eigenständig wo die Absicht eindeutig ist, Rückfrage nur bei echter Mehrdeutigkeit (`git.conflictPolicy`).
- **loop-operator** (optional) — opt-in Iterations-Loop.

Jeder Agent: Frontmatter `name, description, tools, model` (+ Task-Typ). Default-Model gemäß §7.

---

## 11. Skills, Rules, Contexts

- **Meta-Skills jetzt:** `roast-me` (Befragung), `crew-planning` (Fahrplan/Phasen-Konventionen inkl. Abhängigkeits-DAG), `crew-context` (Zustands-/Session-Handling), `git-conventions`, `git-merge` (Worktree-/Branch-Integration & Konfliktlösung, §6.3), `verification-loop`, `tdd-workflow`.
- **Stack-Skills (Folge-Spec):** hono-api, drizzle-postgres, shadcn-baseui, tanstack-query/form/table, bullmq-redis, bun-scripts, nextjs, react-patterns/testing/performance, coolify-deploy (optional).
- **Rules:** immer geltende Leitplanken (Sicherheit, Validierung, Muster-vor-Neuerfindung, fokussierte Änderungen) — adaptiert, rebranded.
- **Contexts:** `dev`, `review`, `research` — Verhaltensmodi.

---

## 12. Hooks

| Event | Hook | Zweck | Blockierend |
|---|---|---|---|
| SessionStart | load-project-context | `PROJECT.md` gebündelt laden | nein |
| PreCompact | snapshot-state | Zustand in `sessions/` sichern | nein |
| Notification | notify-blocker | bei „braucht Input/Permission" → Notifier (config) feuern | nein |
| Stop / SubagentStop | notify-completion + quality-gate | Abschluss-Notification (config) + optional Format/Typecheck-Quickgate | Gate je nach Ausgang |

**Notifications** nutzen die Claude-Code-Events `Notification` (Blocker) und `Stop`/`SubagentStop` (Abschluss). Zustellung per `notifications.channel`: lokal macOS (`osascript`/`terminal-notifier`) oder Push (ntfy/Pushover) für unterwegs. Genaue Zustellung in Phase 1 verifizieren (Terminal-Bell ist unzuverlässig). Lokal per Default; nichts geht ohne explizite Integration an externe Dienste.

---

## 13. CLI (`crew`)

- In TypeScript geschrieben, **Bun-first**, lauffähig auch unter **Node/npx/pnpmx** (keine Bun-only-APIs im Entrypoint).
- `crew init` — fragt zuerst die **Projektart** ab (Archetyp aus globalem Registry, §5.1), seedet daraus Tags/Stack/Defaults, führt das (vorbefüllte) Stack-Interview, legt `.planning/` aus `templates/` an, schreibt `config.json` + `PROJECT.md`.
- `crew setup` — einmalige globale Einrichtung: Projektarten & Tags definieren, globale Defaults (PM-Provider, Modelle) setzen.
- `crew update` — zieht zentrale Harness-Updates.
- npm-Package: `@mantaray0/crew` (scoped, public); Bin-Befehl `crew` → `npx @mantaray0/crew init`.
- Install als Plugin: `/plugin marketplace add <repo>` → `/plugin install crew`.

---

## 14. Task-Provider-Abstraktion (PM-Brücke)

Trennt **„woher die Arbeit kommt"** von **„wie sie abgearbeitet wird"**.

- Normalisiertes **Work-Item:** `{ id, title, description, acceptanceCriteria, status, externalRef? }`.
- **Provider:**
  - `local` (Default, zero-config) → interne `roadmap.md`. **Wird jetzt gebaut.**
  - `mcp:linear` / `mcp:jira` / `mcp:clickup` → über die jeweils existierenden MCP-Connectors. **Folge-Spec.**
  - `crew-pm` → eigenes PM-Tool (Thema 3). **Folge-Spec.**
- **Pro Projekt *und* global wählbar:** `config.tasks.provider` (Projekt) + globaler Default in `~/.claude/crew/`. Der Provider bestimmt, welcher Skill/MCP für Pull/Write-Back gerufen wird.
- **Kollisionsfrei:** Internes `.planning/` ist **immer die Arbeitsebene** (Detail); das externe Ticket ist **Nordstern + Sync-Grenze** (grob). 1 Ticket → 1 Plan (ggf. mehrere Phasen). Sync nur an Phasen-/Meilenstein-Grenzen.
- `/crew:pull <id>` importiert ein Ticket → `plans/<id>.md` + roadmap-Eintrag mit `externalRef`. Bei Abschluss (falls `writeBack`) Kommentar + Status zurück ins externe Tool.

---

## 15. Out of Scope (Folge-Specs)

1. **Stack-spezifische Skills** (hono/drizzle/tanstack/bullmq/…).
2. **Externe PM-Adapter** (Linear/Jira/ClickUp) inkl. Write-Back.
3. **Eigenes PM-Tool** (Thema 3) als `crew-pm`-Provider.
4. **Boilerplate-Monorepo** (Thema 1).

### Offene Ideen (nicht eingeplant, nur geparkt)

- **SQLite-Read-Model + Dashboard-UI:** Falls je eine UI/Cross-Projekt-Auswertung gewünscht wird — als *abgeleitetes* Read-Model (CQRS) aus den `.planning/`-Dateien, niemals als Quelle der Wahrheit. Bewusst zurückgestellt.

---

## 16. Risiken & offene Punkte

| Risiko | Mitigation |
|---|---|
| Config-getriebener Model-Override evtl. nicht zuverlässig zur Laufzeit | In Phase 1 verifizieren; Fallback: profil-spezifische Agent-Varianten via `crew init` |
| `sessions/` committed erzeugt Rauschen | `config.state.commitSessions=false` → gitignore |
| Verify-Pipeline in frischem Kontext kann Faden verlieren | Plan + Log als externes Gedächtnis; Briefing-Format erzwingen |
| MIT-Attribution vs. „keine Referenz" | Substanzielles Umschreiben → eigenständiges Derivat; keine Fremdmarken |

---

## 17. Akzeptanzkriterien (Core Engine)

- [ ] `crew` als installierbares Claude-Code-Plugin (Manifest, Commands, Agents, Skills, Rules, Contexts, Hooks).
- [ ] `crew init` legt `.planning/` an und führt das Stack-Interview (inkl. „du entscheidest"-Option).
- [ ] `config.json` steuert Git-, Verify-, Model-, Clarify- und Tasks-Verhalten; Projekt- + globaler Layer.
- [ ] Voller Zyklus lauffähig: `/crew:brief` → `/crew:plan` → `/crew:execute` (mit Verify-Pipeline) → Commit + Log.
- [ ] Context-Handling über Sessions: SessionStart lädt PROJECT.md, `/crew:resume` brieft korrekt, „mach weiter" trifft den exakten nächsten Schritt.
- [ ] `/crew:adjust` schiebt/sortiert/streicht Phasen ohne Renumbering-Bruch.
- [ ] Model-Management mit `auto`- und `manual`-Modus + Override-Präzedenz.
- [ ] Task-Provider-Abstraktion vorhanden; `local`-Provider voll funktionsfähig.
- [ ] Globaler Layer mit Projektarten/Tags-Registry; `crew init` wählt Archetyp und seedet das Projekt; Tag-Set steuert aktive Rules/Skills.
- [ ] Parallel-Dispatch unabhängiger Phasen (DAG) in Worktrees mit `claims.json`-Kollisionsschutz; `execution.parallel='auto'` + `/crew:dispatch`.
- [ ] Rolling Integration via `merge-coordinator` gemäß `git.mergeStrategy`; Konflikte per `conflictPolicy` (lösen-oder-fragen).
- [ ] `/crew:quick` Quick-Lane stört aktive Phasen/Claims nicht.
- [ ] `/crew:backlog` legt Ideen reibungslos in `backlog.md` ab; Triage bei `/crew:plan`/`/crew:adjust`.
- [ ] `/crew:retro` schlägt aus fertiger Arbeit Skills/Tags fürs globale Registry vor (du bestätigst).
- [ ] Test-Politik aus Projektart/Tag ableitbar (`testing.policy`); Security-Pass nur auf Empfehlung+Freigabe.
- [ ] Notifications über `Notification`/`Stop`-Hooks (Blocker + Abschluss), config-getriebener Channel.
- [ ] `/crew:rollback` setzt sicher auf den letzten verifizierten Phasen-Commit zurück.
- [ ] Token-/Kosten-Tracking pro Phase im `log.md`; `/crew:report`-Übersicht.
- [ ] Keine Fremd-Harness-Referenzen/Branding im Repo.
