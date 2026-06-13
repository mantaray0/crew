---
description: Close out a milestone end-to-end — config-gated Ship → Retro → Complete in one strand.
argument-hint: "[milestone slug, optional — passed through to the Complete step]"
---

# /crew:finish

The milestone-close strand: run **Ship → Retro → Complete** in that fixed order, each step
individually gated by `config.finish.<step>`. Uses the `crew-conventions` and `crew-config` skills;
the steps themselves delegate to `crew-deploy` (ship), `crew-learn` (retro), and `/crew:complete`.

**finish orchestrates — it invents no logic.** It calls the existing commands/skills; it does not
re-implement ship, retro, or complete. Each step that runs writes its own `LOG.md` traces, and finish
adds a short summary of the gating outcomes (which steps ran, were skipped, or stopped) — so a finish
run loses no information versus running the three commands by hand.

**Follow `crew-conventions`:** surface each decision explicitly; respond in the user's language.
`/crew:finish` is the user's deliberate close-out — `/crew:execute` only ever *suggests* it, never
runs it (the autonomy contract's "never self-ship/-complete" holds).

## Resolve the config

Read `config.finish` (layered global < project; see `crew-config` → `config.finish`). Each step is a
tri-state:

| value | behavior |
|---|---|
| `off` | The step is **not** part of the strand — log one line (`skipped: finish.<step>=off`) and move on. The standalone command stays usable by hand. **Skip, don't abort.** |
| `ask` | **Offer** the step (an `AskUserQuestion` confirm per `crew-conventions`). On yes → run it; on no → skip it, **log one line (`skipped: finish.<step>=ask, declined`)**, and continue. |
| `auto` | Run the step **without** asking. |

Defaults: `ship=off`, `retro=ask`, `complete=ask`.

## Steps (fixed order Ship → Retro → Complete)

1. **Ship** — run only when `config.finish.ship ≠ off` **and** `config.ship.enabled`. Execute the
   steps of `commands/ship.md` (delegate, do not duplicate): every git step defers to `config.git`
   (`autoPush`/`autoPR`). It **never ships on a red verify** — and a red verify is a real failure of a
   running step, so it **stops the whole strand** (you do not archive on top of unverified code): log
   `stopped: ship — red verify`, point the user at `/crew:verify`, and do **not** proceed to Retro or
   Complete. If `config.ship.enabled` is `false`, that is not a failure — **skip** it with a logged
   note (`skipped: ship (ship.enabled=false)`) and continue to the next step. finish adds **no** new
   push/release axis beyond `config.git`.
2. **Retro** — run only when `config.finish.retro ≠ off` **and** `config.retro.enabled`. Execute
   `commands/retro.md` (the `crew-learn` flow). Cadence is **per milestone** — there is no per-phase
   retro. If `config.retro.enabled` is `false`, **skip** it with a logged note
   (`skipped: retro (retro.enabled=false)`) and continue.
3. **Complete** — run when `config.finish.complete ≠ off`. Execute `/crew:complete` (audit → summarize
   → update PROJECT → archive; passes `$ARGUMENTS` through — the slug is optional, complete defaults to
   the active/latest milestone). **Guard:** complete only archives once every phase is `[x]`/`[~]`; if a
   phase is still open (`[ ]`/`[>]`), this is a **blocked** outcome, not a skip — *this step* stops with
   `stopped: complete — open phases <list>`, points the user at `/crew:execute`/`/crew:adjust` to
   resolve them, and the strand ends there. finish does **not** hard-crash, but it also does **not**
   pretend the milestone closed.

Ship runs **before** Complete by design — it may release on a not-yet-archived state; that ordering is
intentional, don't "correct" it.

## Guards — every step ends in exactly one logged outcome

Each step resolves to one of three outcomes, and **every one is recorded** (see Logging) — a step that
runs no delegated command leaves no other trace, so its outcome line *is* the record:

- **ran** — the delegated command executed (and wrote its own `LOG.md` entry).
- **skipped** — `off`, an `ask`-decline, or a false hard gate (`ship.enabled`/`retro.enabled`). This is
  **not** a failure: log `skipped: <step> (<reason>)` and continue to the next step. Never drop it silently.
- **stopped** — a real failure of a *running* step: a **red verify halts Ship and stops the strand**
  (you don't archive on top of unverified code), and **open phases block Complete**. Log
  `stopped: <step> — <reason>`, name the command that resolves it, and end the strand there.

**skipped ≠ stopped.** Use the two prefixes literally so the user can tell a benign skip from a real
block — never report a blocked Complete or a red-verify Ship as a "skip". Never paper over a stop, and
never let a stop bypass the finish summary.

## Logging

A step that **runs** writes its usual `LOG.md` entry through the delegated command; a **skipped** or
**stopped** step runs no delegated command and therefore writes no other trace. So the **finish
summary is the authoritative record of gating outcomes** — append it **before the hand-off, on every
path including a hard stop**, with one line per step: `ran` / `skipped: <step> (<reason>)` /
`stopped: <step> — <reason>`. A finish run must lose no information versus running the commands by hand.

## Hand-off

End your reply **in the user's language** with a one-line status per step (ran / skipped / stopped),
then name the next step: if Complete archived the milestone, point to `/crew:plan` (or `/crew:brief`)
for the next milestone; if a step stopped the strand, point to the command that resolves it
(`/crew:execute`/`/crew:adjust` for open phases, `/crew:verify` for a red verify).
