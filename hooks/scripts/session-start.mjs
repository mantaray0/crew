#!/usr/bin/env node
// SessionStart hook: print .planning/PROJECT.md (bounded) so the session self-orients,
// and warn when the project's config.crewVersion is behind the installed plugin.
// Self-contained — no build/dist dependency.
// Opt out with CREW_SESSION_START_CONTEXT=off; bound with CREW_SESSION_START_MAX_CHARS.
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.CREW_SESSION_START_CONTEXT === "off") process.exit(0);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();

async function readJson(p) {
  try {
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch {
    return null;
  }
}

// 1. Project context from PROJECT.md (bounded).
const parsed = Number.parseInt(process.env.CREW_SESSION_START_MAX_CHARS ?? "6000", 10);
const max = Number.isFinite(parsed) ? parsed : 6000;
try {
  let content = await fs.readFile(path.join(cwd, ".planning", "PROJECT.md"), "utf8");
  if (content.length > max) {
    content = `${content.slice(0, max)}\n\n[… truncated to ${max} chars]`;
  }
  process.stdout.write(`# crew · project context\n\n${content}\n`);
} catch {
  // No .planning/PROJECT.md in this directory — nothing to inject.
}

// 2. Config-version drift: nudge to reconcile if the project config predates the plugin.
const config = await readJson(path.join(cwd, ".planning", "config.json"));
if (config) {
  const plugin = await readJson(path.join(scriptDir, "..", "..", ".claude-plugin", "plugin.json"));
  const current = plugin?.version ?? null;
  const stamped = config.crewVersion ?? null;
  if (current && stamped !== current) {
    const was = stamped ? `v${stamped}` : "an unknown version";
    process.stdout.write(
      `\n> ⚠️ crew config was last reconciled with ${was}, but the installed plugin is v${current}. ` +
        "Run `/crew:update` to reconcile this project's config (`/crew:update global` for the global one).\n",
    );
  }
}

process.exit(0);
