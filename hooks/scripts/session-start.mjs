#!/usr/bin/env node
// SessionStart hook: print .planning/PROJECT.md (bounded) so the session self-orients.
// Opt out with CREW_SESSION_START_CONTEXT=off; bound with CREW_SESSION_START_MAX_CHARS.
import { readProjectContext } from "../../dist/planning/context.js";

if (process.env.CREW_SESSION_START_CONTEXT === "off") process.exit(0);
const max = Number.parseInt(
  process.env.CREW_SESSION_START_MAX_CHARS ?? "6000",
  10,
);
const ctx = await readProjectContext(
  process.cwd(),
  Number.isFinite(max) ? max : 6000,
);
if (ctx) {
  process.stdout.write(`# crew · project context\n\n${ctx}\n`);
}
process.exit(0);
