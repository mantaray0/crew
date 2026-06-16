---
"@mantaray0/crew": minor
---

Add two acceptance mechanics at their proper layers:

- A **`smoke` verify stage** (after `test`) that runs the built app
  end-to-end — command sourced from `PROJECT.md`, the agent self-assesses
  into the findings loop, and the stage skips cleanly when no smoke/E2E
  command is defined (so a project without a runtime harness stays green).
- A **human `workflow.usertest` acceptance gate** owned by execute at the
  milestone boundary. `cadence` (`off`/`per-phase`/`per-milestone`,
  default `per-milestone`) decides when it fires; crew proposes a 2–10
  checkpoint checklist derived from what was built, the user confirms each,
  and an unaccepted milestone doesn't advance to ship — the gate holds
  under `auto` and `dispatch`. It is cadence-based, not a `run`-gate, and
  is neither a verify stage nor a chain step.
