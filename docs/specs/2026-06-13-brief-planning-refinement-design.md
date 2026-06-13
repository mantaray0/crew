# Brief & Planning verfeinern — Roast-Level, gebündelter Stepper, Spec-Cut, Plans-Struktur · Design-Spec

- **Datum:** 2026-06-13
- **Status:** Entwurf — zur Umsetzung freigegeben (Design genehmigt), Umsetzung ausstehend.
- **Scope:** Der Klärungs- und Planungs-Flow von crew: das `roast-me`-Skill, die Commands `/crew:brief` und `/crew:plan`, die Konventionen in `crew-conventions`/`crew-planning`/`crew-context` und das Config-Schema in `crew-config`.
- **Nicht im Scope:** Verify-Pipeline, Dispatch/Merge, PM-Adapter, Model-Management.

---

## 1. Motivation

Vier Schmerzpunkte am bestehenden Brief-/Planning-Flow:

1. **Fragequalität.** Das Skill heißt *Roast*-Me, verhält sich aber wie ein höflicher Requirements-Interviewer — es klärt Lücken, fordert die Idee aber nicht heraus.
2. **Tiefe/Stopp-Kriterium.** „Stop when shared understanding is reached" ist weich; das Modell fragt entweder zu lange oder bricht zu früh ab. Außerdem ist striktes Eine-Frage-nach-der-anderen für eine Klärungsrunde zäh — gewünscht ist ein gebündelter Inline-Stepper.
3. **Cut Brief↔Plan sitzt falsch.** Die Grenze zwischen *klären* (brief) und *strukturieren* (plan) ist unscharf: Struktur-Entscheidungen leaken in den Brief, Intent-Fragen tauchen erst im Plan auf.
4. **Plans-Ordnerstruktur.** Der `_<slug>.md`-Brief liegt zwischen den nummerierten Phasenplänen in `plans/` und stört dort optisch; Brief und seine Phasen sind nicht gekapselt.

---

## 2. Entscheidungen (genehmigt)

### 2.1 Roast-Level — neue Config-Achse `clarify.intensity`

Orthogonal zu `clarify.depth`. **`depth`** steuert *wie breit* der Entscheidungsbaum abgelaufen wird (Coverage); **`intensity`** steuert *wie hart gegen die Idee gedrückt wird*.

| Level | Verhalten |
|---|---|
| `gentle` | Reine Klärung: Lücken füllen, Default empfehlen, nicht herausfordern. (Heutiges Verhalten.) |
| `normal` *(Default)* | + drückt auf die *load-bearing* Schwachstellen, benennt offensichtlichen Scope-Creep, hinterfragt 1–2 tragende Annahmen. |
| `brutal` | + greift Annahmen aktiv an („Brauchst du das wirklich?"), legt Widersprüche offen, steelmant das Weglassen, benennt jedes Scope-Risiko. |

- Die **empfohlene Antwort** trägt in *allen* Levels weiter (Kern von crew). In `brutal` darf eine Empfehlung auch „lass das weg" lauten.
- **Default:** `normal`.
- **Erhebung:** bei `/crew:setup` (globaler Default) und Override bei `/crew:init` (pro Projekt) — exakt analog zu `language.files`. Auflösung: project > global > built-in default.

### 2.2 Gebündelter Stepper für die Klärung

- Roast-Me fragt über den **Inline-Stepper** (`AskUserQuestion`, bis zu 4 *gleichrangige* Fragen pro Batch, am Schluss gemeinsam submitted) statt strikt eine nach der anderen.
- Jede Frage trägt weiterhin ihre **empfohlene Antwort** (Empfehlung führt).
- **Anzahl:** Baseline ~3–5 Fragen; das **Maximum bestimmt der Agent nach Komplexität** der Idee — kein hartes Limit.
- **Checkpoint nach jedem Batch:** *„Reicht das, oder tiefer graben?"* Der Nutzer kann **jederzeit** „reicht" sagen und weitermachen.
- **Entscheidungsbaum bleibt erhalten:** Nur *gleichrangige* (voneinander unabhängige) Fragen kommen in einen Batch. Wenn Antwort A erst bestimmt, ob/welche Frage B kommt, gehört B in einen eigenen, späteren Batch (sequenziell). Trunk vor Blättern.

### 2.3 `crew-conventions`: Unabhängigkeitsregel statt „one decision at a time"

Die starre Regel „One decision at a time" wird ersetzt durch die **Unabhängigkeitsregel**:

> **Bündle unabhängige Entscheidungen in einem Stepper-Batch; bleib sequenziell, sobald eine Entscheidung von einer vorigen Antwort abhängt** (Baum-Ast) **oder ein Confirm-then-write-Gate ist.**

Daraus folgt, wo Batch greift — nicht „Command X ja / Y nein", sondern entlang der Abhängigkeit:

| Stelle | Batch sinnvoll? | Warum |
|---|---|---|
| `/crew:brief` — Klärung | **ja** | gleichrangige Gray-Areas |
| `/crew:plan` — unabhängige Klärungs-/Approach-Fragen | **ja** | sofern eine Wahl nicht die nächste bestimmt |
| `/crew:init`, `/crew:setup` — Stack-Formfelder, Tags, Projekttyp, Roast-Level | **ja** | co-äquivalente Formfelder |
| `/crew:verify` — Schritt-/Event-Auswahl | **ja** | Mehrfachauswahl |
| Entscheidungsbaum-Äste (eine Antwort verengt die nächste) | **nein** | Abhängigkeit |
| Confirm-then-write-Gates | **nein** | bewusster einzelner Bestätigungspunkt |

Die Regel bleibt: **nie still einen Default anwenden** — ein Batch ist mehrere *gestellte* Fragen mit Empfehlung, kein stilles Durchwinken.

### 2.4 Cut Brief↔Plan schärfen (zugleich das Stopp-Kriterium)

Klare Zuständigkeit + Bounce-Back gegen Leakage:

| | **brief** = WAS / WARUM | **plan** = WIE / REIHENFOLGE |
|---|---|---|
| Produkt | vollständige **Spec** (Ziel, Anforderungen, Akzeptanz, Out-of-Scope) | Milestones → Phasen, Sequenz, Dependencies, Plan-Body |
| Stopp-Kriterium | **Spec-Probe:** stoppt, sobald die volle Spec schreibbar ist | — |
| Guardrail | Struktur-/Phasing-/Sequenz-Ideen → *„das ist `/crew:plan`, notiert"* (nicht im Brief entscheiden) | trifft es eine **Intent**-Lücke → **zurückwerfen** („gehört in den Brief"), nicht still klären |

Die **Spec-Probe** ist der gemeinsame Mechanismus für Stopp-Kriterium *und* Cut: Der Brief endet, wenn Ziel + Anforderungen + Akzeptanz + Out-of-Scope vollständig schreibbar sind; der Plan vertraut der Spec als gelocktem Intent und strukturiert nur noch.

### 2.5 Plans-Ordnerstruktur — Milestone-Ordner (Option A)

`plans/` wird nach **Milestone** gekapselt (crews existierende Gruppierungseinheit — *kein* neues Konzept), Ordnername ist der **Milestone-Slug** (stabil bei Reorder → kein Renumber-Schmerz, anders als nummerierte `phase-1/`-Ordner):

```
.planning/plans/
  <milestone-slug>/
    _brief.md            ← Spec-Root (optional; nur wenn es einen Brief gab)
    1.2-db-schema.md     ← nummerierte Phasenpläne dieses Milestones
    1.3-auth.md
```

- **Gruppierungseinheit = Milestone** (Modell bleibt Milestone → Phase, kein drittes Substantiv):
  - **Neues Projekt:** `/crew:plan` legt je Roadmap-Milestone einen `<milestone-slug>/`-Ordner an; der Brief selbst ist `PROJECT.md` (kein `_brief.md` in `plans/`).
  - **Feature in bestehendem Projekt:** Der **Brief-Slug wird der Milestone-Slug** — `/crew:brief` schreibt `plans/<slug>/_brief.md`, `/crew:plan` macht daraus einen neuen (kleinen) Milestone *oder* hängt die Phasen an einen bestehenden Milestone-Ordner. So existiert der Ordnername schon zur Brief-Zeit, ohne eine Phasennummer zu erfinden.
- **Ticket (`/crew:pull`):** landet im betreffenden Milestone-Ordner; Plan nach Ticket-Id benannt (`LIN-42-…md`), `_brief.md` entfällt (Spec kommt aus dem Ticket).
- Dateibenennung im Ordner: Phasenpläne `<id>-<title>.md`, der Brief als `_brief.md` (der Slug steckt nun im Ordnernamen, daher nicht mehr `_<slug>.md`).
- Alle plans-lesenden Commands globben künftig **rekursiv** (`plans/**/*.md`).

### 2.6 State-Modell — bewusst nicht erweitert

Geprüft gegen GSDs State-Dateien; **keine übernommen** — crew deckt alles bereits ab, teils parallel-sicherer:

| GSD-Konzept | crew-Pendant | Verdikt |
|---|---|---|
| `STATE.md` (mutable Digest, „read first") | verteilt: `ROADMAP.md` (Position) + `LOG.md` (Historie/Cost) + `sessions/<id>/snapshot` (Continuity) + `claims.json`; `/crew:resume` synthetisiert on demand | nicht übernehmen — ein mutables STATE.md hätte **Write-Contention** zwischen Worktrees und bekämpft das Parallel-Modell |
| `phases/XX/CONTEXT.md` (Per-Phase-Entscheidungen) | Spec-Head im Plan (`_brief.md` milestone-weit + `<id>-…md` je Phase) | nicht übernehmen — wäre ein dritter Ort für dasselbe |
| Tech-Stack als eigene `.md` | `config.stack` (strukturiert, treibt Tags/Skills) + `PROJECT.md` „Architektur-Entscheidungen" (das *Warum*) | nicht übernehmen — bereits sinnvoll zweigeteilt |

**CLAUDE.md vs. PROJECT.md (Klarstellung, kein Code):**

| Datei | Eigentümer | Rolle | crew schreibt rein? |
|---|---|---|---|
| Root `CLAUDE.md` | User | *Wie* im Repo gearbeitet wird; vom Harness in jeder Session geladen | **nein** |
| `.planning/PROJECT.md` | crew | *Was* gebaut wird — Projektwissen/Memory-Root | **ja** |

Optionale Brücke (vom User selbst, nicht von crew): ein Einzeiler in der Root-`CLAUDE.md`, der auf `.planning/PROJECT.md` verweist.

---

## 3. Betroffene Dateien

| Datei | Änderung |
|---|---|
| `skills/crew-config/SKILL.md` | `clarify.intensity` (`gentle`/`normal`/`brutal`, Default `normal`) ins Schema + Erläuterung; Erhebung bei setup/init. |
| `skills/roast-me/SKILL.md` | Batched Stepper + „reicht/tiefer"-Checkpoint; Spec-Probe als Stopp-Kriterium; intensity-Levels mit konkretem Verhalten; Scope-Guardrail (Struktur → plan); Anti-Pattern „one question at a time" ersetzen. |
| `skills/crew-conventions/SKILL.md` | „One decision at a time" → Unabhängigkeitsregel (Batch unabhängiger Entscheidungen; sequenziell bei Abhängigkeit/Confirm-Gate). |
| `skills/crew-planning/SKILL.md` | Dateibenennung/Pfade auf Milestone-Ordner umstellen (`plans/<milestone-slug>/_brief.md` + `<id>-<title>.md`); rekursives Globben anmerken. |
| `skills/crew-context/SKILL.md` | `plans/`-Zeile auf `plans/<milestone-slug>/…` aktualisieren. |
| `commands/brief.md` | Spec-Probe-Stopp, Scope-Guardrail, `clarify.intensity` honorieren, gebündelten Stepper nutzen; Brief nach `plans/<slug>/_brief.md` schreiben. |
| `commands/plan.md` | Spec als gelockt vertrauen, Intent-Lücken zurückwerfen; Phasenpläne in den Milestone-Ordner schreiben. |
| `commands/setup.md` | Roast-Level (global) erfragen. |
| `commands/init.md` | Roast-Level (per-project Override) erfragen. |
| `commands/*` (execute, dispatch, adjust, status, resume, …) | plans-Lesen auf rekursives Globben (`plans/**/*.md`) prüfen/anpassen. |

---

## 4. Risiken & Migration

- **Migration bestehender `plans/`:** Vorhandene flache `_<slug>.md`/`<id>-<title>.md` müssten in Milestone-Ordner wandern. Da dieses Repo `.planning/` gitignored (Plugin-Repo, kein Nutzerprojekt), gibt es hier keinen Live-Zustand zu migrieren; für Nutzerprojekte beim nächsten `/crew:adjust`/`reconcile` eine optionale Migration anbieten (analog zur Brief-Migration in der Versionierung).
- **Stepper-Limit:** `AskUserQuestion` erlaubt max. 4 Fragen/Batch — der „Agent entscheidet das Maximum" bedeutet *mehrere Batches hintereinander*, nicht ein Riesen-Batch.
- **Konsistenz mit `crew-conventions`:** Die Unabhängigkeitsregel muss überall gleich gelesen werden; Reviewer-Agenten und andere Commands dürfen nicht mehr aufs alte „one decision at a time" referenzieren — Repo nach der Formulierung durchsuchen.
- **Repo bleibt referenzfrei:** Das „4 Fragen, dann reicht's?"-Muster wird neutral beschrieben (kein Branding/Verweis auf Fremd-Harnesse), konform zur bestehenden Spec.

---

## 5. Aufgeschoben → Backlog

Zwei während dieses Brainstormings aufgekommene, sinnvolle, aber **außerhalb** dieses Scopes liegende Themen wurden in den Backlog verschoben (eigene Briefs/Specs später):

- **Deploy/Release-Support für Nutzerprojekte** (`config.ci` + `.planning/DEPLOY.md` + `/crew:ship` + generierte CI-Pipelines).
- **Roadmap-Archivierung** (fertige Milestones nach `.planning/archive/` auslagern, Live-Roadmap behält Einzeiler; neues `/crew:archive`).

→ Details in `.planning/BACKLOG.md`. §2.5 wird für die Archivierung *nicht* vorbereitet (bewusste Entscheidung) — die Milestone-Ordner-Struktur ist ohnehin `mv`-fähig.
