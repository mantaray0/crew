#!/usr/bin/env node
// Lightweight structure check for the crew Claude Code plugin (no build, no TS).
// Validates: manifest + hooks JSON parse; every command/agent/skill has frontmatter;
// hook scripts referenced by hooks.json exist.
import { promises as fs } from "node:fs";
import path from "node:path";

let errors = 0;
const ok = (m) => console.log("✓", m);
const fail = (m) => {
  console.error("✗", m);
  errors++;
};

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

// 1. JSON files parse.
for (const f of [".claude-plugin/plugin.json", ".claude-plugin/marketplace.json", "hooks/hooks.json"]) {
  try {
    await readJson(f);
    ok(`${f} valid JSON`);
  } catch (e) {
    fail(`${f}: ${e.message}`);
  }
}

// 1b. Marketplace lists at least one plugin, each with name + source.
try {
  const market = await readJson(".claude-plugin/marketplace.json");
  if (!Array.isArray(market.plugins) || market.plugins.length === 0) {
    fail("marketplace.json: plugins array is empty");
  }
  for (const p of market.plugins ?? []) {
    if (!p.name || !p.source) fail(`marketplace.json: plugin missing name or source: ${JSON.stringify(p)}`);
  }
} catch {
  /* parse error already reported above */
}

// 2. Commands and agents have YAML frontmatter.
for (const dir of ["commands", "agents"]) {
  for (const f of await fs.readdir(dir)) {
    if (!f.endsWith(".md")) continue;
    const content = await fs.readFile(path.join(dir, f), "utf8");
    if (!content.startsWith("---")) fail(`${dir}/${f}: missing frontmatter`);
  }
}

// 3. Each skill has a SKILL.md with frontmatter.
for (const s of await fs.readdir("skills")) {
  const p = path.join("skills", s, "SKILL.md");
  try {
    const content = await fs.readFile(p, "utf8");
    if (!content.startsWith("---")) fail(`${p}: missing frontmatter`);
  } catch {
    fail(`${p}: missing SKILL.md`);
  }
}

// 4. Hook scripts referenced by hooks.json exist.
const hooks = await readJson("hooks/hooks.json");
const refs = JSON.stringify(hooks).match(/hooks\/scripts\/[\w.-]+\.mjs/g) ?? [];
for (const ref of new Set(refs)) {
  try {
    await fs.access(ref);
  } catch {
    fail(`hooks.json references missing script: ${ref}`);
  }
}

if (errors > 0) {
  console.error(`\n${errors} problem(s) found.`);
  process.exit(1);
}
console.log("\nplugin structure OK");
