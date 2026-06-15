---
description: Close out a milestone end-to-end — gated Ship → Learn → Complete in one strand.
argument-hint: "[milestone slug, optional — passed through to the Complete step]"
---

# /crew:finish

The milestone-close strand: run **Ship → Learn → Complete** in that fixed order, each step
individually gated by its own `config.workflow.<step>.run`. Uses the `crew-conventions`, `crew-config`,
`crew-context`, and `planning` skills; **all three steps delegate to their own commands** —
`/crew:ship`, `/crew:learn`, and `/crew:complete` (`deploy` / `learn` / the close-out flow).
Whether finish is *chained* automatically after `execute` is governed by `workflow.mode` (see
`commands/execute.md` → *Milestone end*); finish itself just runs the step `run`s in order.

**finish orchestrates, it re-implements nothing.** All three steps call their existing commands/skills;
the Complete logic lives in **exactly one** command (`/crew:complete`), so there is no inline duplication
and no drift risk. Each delegated step writes its own `LOG.md` traces, and finish adds a short summary of
the gating outcomes (which steps ran, were skipped, or stopped) — so a finish run loses no information.

**Follow `crew-conventions`:** surface each decision explicitly; respond in the user's language.
`/crew:finish` is the user's deliberate close-out under `workflow.mode: manual` — `/crew:execute` only
ever *suggests* it there, never runs it (the autonomy contract's "never self-ship/-complete" holds);
under `workflow.mode: auto` execute may chain into this strand, but the remote/prod boundary
(`config.git`) stays hard regardless.

## Resolve the config

Read each step's `run` from `config.workflow.{ship,learn,complete}.run` (layered global < project; see
`crew-config` → *Workflow model* and `config.workflow.finish`). Each `run` is a four-state gate:

| value | behavior |
|---|---|
| `off` | The step is **not** part of the strand — log one line (`skipped: <step>.run=off`) and move on. The standalone command stays usable by hand. **Skip, don't abort.** |
| `ask` | **Offer** the step (an `AskUserQuestion` confirm per `crew-conventions`). On yes → run it; on no → skip it, **log one line (`skipped: <step>.run=ask, declined`)**, and continue. |
| `auto` | Run the step **without** asking. |
| `smart` | The agent judges whether the step is worthwhile here and runs it if so; if it judges not, **skip with a logged reason** (`skipped: <step>.run=smart, <why>`). Running a step still only *enters* it — `config.git` stays the sole push/PR authority. |

Defaults: `ship.run=ask`, `learn.run=ask`, `complete.run=ask`. This is the canonical **Catch-up** target
too: a directly-invoked later command (e.g. `/crew:learn`) offers the missing earlier steps per these
same `run`s (`crew-conventions` → *Catch-up rule*).

## Steps (fixed order Ship → Learn → Complete)

1. **Ship** — run only when `config.workflow.ship.run ≠ off` **and** `config.workflow.ship.enabled`.
   Execute the steps of `commands/ship.md` (delegate, do not duplicate): every git step defers to
   `config.git` (`autoPush`/`autoPR`). It **never ships on a red verify** — and a red verify is a real
   failure of a running step, so it **stops the whole strand** (you do not archive on top of unverified
   code): log `stopped: ship — red verify`, point the user at `/crew:verify`, and do **not** proceed to
   Learn or Complete. If `config.workflow.ship.enabled` is `false`, that is not a failure — **skip** it
   with a logged note (`skipped: ship (ship.enabled=false)`) and continue to the next step. finish adds
   **no** new push/release axis beyond `config.git`.
2. **Learn** — run only when `config.workflow.learn.run ≠ off` **and** `config.workflow.learn.enabled`.
   Execute `commands/learn.md` (the `learn` flow). Cadence is **per milestone** — there is no
   per-phase learn. If `config.workflow.learn.enabled` is `false`, **skip** it with a logged note
   (`skipped: learn (learn.enabled=false)`) and continue.
3. **Complete** — run when `config.workflow.complete.run ≠ off`. Execute the steps of
   `commands/complete.md` (delegate, do not duplicate) — the milestone close-out (audit → summarize →
   `PROJECT.md` → archive, wrapping `/crew:archive`), symmetric to Ship→`/crew:ship` and
   Learn→`/crew:learn`. Pass `$ARGUMENTS` (slug, optional) through; complete picks the active/latest
   milestone in `.planning/ROADMAP.md` otherwise.
   **Guard:** Complete only archives once every phase is `[x]`/`[~]` (deferred `[~]` are non-blocking); if
   a phase is still open (`[ ]`/`[>]`), this is a **blocked** outcome, not a skip — *this step* stops with
   `stopped: complete — open phases <list>`, points the user at `/crew:execute`/`/crew:adjust` to resolve
   them, and the strand ends there. finish does **not** hard-crash, but it also does **not** pretend the
   milestone closed.

Ship runs **before** Complete by design — it may release on a not-yet-archived state; that ordering is
intentional, don't "correct" it.

## Guards — every step ends in exactly one logged outcome

Each step resolves to one of three outcomes, and **every one is recorded** (see Logging) — a step that
runs no delegated command leaves no other trace, so its outcome line *is* the record:

- **ran** — the delegated command executed (and wrote its own `LOG.md` entry).
- **skipped** — `off`, an `ask`-decline, a `smart`-judged-not-worthwhile, or a false hard gate
  (`ship.enabled`/`learn.enabled`). This is **not** a failure: log `skipped: <step> (<reason>)` and
  continue to the next step. Never drop it silently.
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
