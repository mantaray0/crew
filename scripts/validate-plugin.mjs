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

// 5. No internal planning identifiers in shipped content.
// Shipped instructions/manifest must never name crew's internal development-milestone
// labels — config migrations are named by the public plugin version instead. The narrow
// pattern below catches the epoch-label form (also inside "pre-M8") without false-flagging
// version numbers, {type} placeholders, or the planning skill's fictional "Meilenstein N"
// examples (the word "Meilenstein" is separated from its number by a space, so M is never
// directly adjacent to a digit). CLAUDE.md, .planning/, and scripts/ are repo dev-state,
// not shipped — deliberately not scanned here.
const milestoneLabel = /\bM\d+\b/;
const shippedRoots = ["commands", "agents", "skills", "hooks", ".claude-plugin", "README.md"];
const scannableExt = new Set([".md", ".json", ".mjs"]);

async function* walkShipped(entry) {
  const stat = await fs.stat(entry); // throws loudly on a missing root — never silently skipped
  if (stat.isDirectory()) {
    for (const name of await fs.readdir(entry)) yield* walkShipped(path.join(entry, name));
  } else if (scannableExt.has(path.extname(entry))) {
    yield entry;
  }
}

const errorsBeforeCheck5 = errors;
for (const root of shippedRoots) {
  try {
    for await (const file of walkShipped(root)) {
      const lines = (await fs.readFile(file, "utf8")).split("\n");
      lines.forEach((line, i) => {
        if (milestoneLabel.test(line)) {
          fail(`${file}:${i + 1}: internal milestone label (\\bM\\d+\\b) in shipped content — name migrations by public plugin version, not internal milestones: ${line.trim()}`);
        }
      });
    }
  } catch (e) {
    // Surface a scan failure as a proper error (not an unhandled rejection) so the
    // clean signal below cannot fire on an incompletely scanned tree.
    fail(`check 5: could not scan shipped root "${root}": ${e.message}`);
  }
}
if (errors === errorsBeforeCheck5) ok("no internal milestone labels in shipped content");

if (errors > 0) {
  console.error(`\n${errors} problem(s) found.`);
  process.exit(1);
}
console.log("\nplugin structure OK");
