#!/usr/bin/env node
// SessionStart hook: print .planning/PROJECT.md (bounded) so the session self-orients.
// Self-contained — no build/dist dependency.
// Opt out with CREW_SESSION_START_CONTEXT=off; bound with CREW_SESSION_START_MAX_CHARS.
import { promises as fs } from "node:fs";
import path from "node:path";

if (process.env.CREW_SESSION_START_CONTEXT === "off") process.exit(0);

const parsed = Number.parseInt(process.env.CREW_SESSION_START_MAX_CHARS ?? "6000", 10);
const max = Number.isFinite(parsed) ? parsed : 6000;
const file = path.join(process.cwd(), ".planning", "PROJECT.md");

try {
  let content = await fs.readFile(file, "utf8");
  if (content.length > max) {
    content = `${content.slice(0, max)}\n\n[… truncated to ${max} chars]`;
  }
  process.stdout.write(`# crew · project context\n\n${content}\n`);
} catch {
  // No .planning/PROJECT.md in this directory — nothing to inject.
}
process.exit(0);
