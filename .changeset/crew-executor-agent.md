---
"@mantaray0/crew": patch
---

fix(agents): add a dedicated `crew:executor` and pin every sub-agent spawn to a `crew:`-namespaced type

The per-phase work core in `/crew:execute` (auto-loop and dispatch) was spawned as an *unnamed* sub-agent, so the platform could resolve it against the global agent namespace and free-pick a foreign-plugin agent (e.g. GSD's `gsd-executor`). This closes that shadowing leak as a class:

- **New `crew:executor` agent** — owns the implement → verify → commit work core and the verify pipeline; every phase-spawn site in `/crew:execute` is pinned to `subagent_type: crew:executor`.
- **All dispatch references are now `crew:`-namespaced** across `commands/` and `skills/` (`crew:code-reviewer`, `crew:merge-coordinator`, …) so an installed third-party plugin can never shadow crew's own agent.
- **`validate-plugin.mjs` (check 7)** enforces it in CI: any bare backticked agent reference in the executable layer fails the build.
- **`/crew:plan`** can now optionally dispatch the (previously unwired) read-only `crew:code-explorer` / `crew:architect` to ground a plan, while the planning conversation stays interactive in the main context.
