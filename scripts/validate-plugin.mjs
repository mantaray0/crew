#!/usr/bin/env node
// Lightweight structure check for the crew Claude Code plugin (no build, no TS).
// Validates: manifest + hooks JSON parse; every command/agent/skill has frontmatter;
// hook scripts referenced by hooks.json exist; shipped text stays clean, linked and small.
import { promises as fs } from "node:fs";
import path from "node:path";

let errors = 0;
const ok = (m) => console.log("ok  ", m);
const fail = (m) => {
  console.error("FAIL", m);
  errors++;
};

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
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
  if (!(await exists(ref))) fail(`hooks.json references missing script: ${ref}`);
}

const shippedRoots = ["commands", "agents", "skills", "hooks", ".claude-plugin", "README.md"];
const scannableExt = new Set([".md", ".json", ".mjs"]);

async function* walk(entry) {
  const stat = await fs.stat(entry); // throws loudly on a missing root, never silently skipped
  if (stat.isDirectory()) {
    for (const name of await fs.readdir(entry)) yield* walk(path.join(entry, name));
  } else if (scannableExt.has(path.extname(entry))) {
    yield entry;
  }
}

async function scanLines(roots, label, onLine) {
  const before = errors;
  for (const root of roots) {
    try {
      for await (const file of walk(root)) {
        const lines = (await fs.readFile(file, "utf8")).split("\n");
        for (const [i, line] of lines.entries()) await onLine(file, i + 1, line);
      }
    } catch (e) {
      // A scan failure is an error, so the clean signal below cannot fire on a partial scan.
      fail(`${label}: could not scan root "${root}": ${e.message}`);
    }
  }
  if (errors === before) ok(label);
}

// 5. No internal planning identifiers in shipped content or pending changesets.
// Shipped text names releases by public plugin version, never by crew's internal milestone
// labels (`M8`). Pending changesets are scanned too: `changeset version` folds them into
// CHANGELOG.md, which is immutable history and not scanned. CLAUDE.md, .planning/ and
// scripts/ are repo dev-state, not shipped.
const milestoneLabel = /\bM\d+\b/;
await scanLines([...shippedRoots, ".changeset"], "no internal milestone labels in shipped content", (file, n, line) => {
  if (milestoneLabel.test(line)) fail(`${file}:${n}: internal milestone label (\\bM\\d+\\b): ${line.trim()}`);
});

// 6. Every crew command, agent and skill that shipped text names exists.
// Catches references left behind when a command, agent or skill is removed or renamed.
// Built-in Claude Code skills that crew calls are listed explicitly.
const builtInSkills = new Set(["code-review"]);
await scanLines(shippedRoots, "every referenced command, agent and skill exists", async (file, n, line) => {
  for (const [, name] of line.matchAll(/\/crew:([a-z][a-z-]*)/g)) {
    if (!(await exists(`commands/${name}.md`))) fail(`${file}:${n}: unknown command /crew:${name}`);
  }
  for (const [, name] of line.matchAll(/(?<![/\w])crew:([a-z][a-z-]*)/g)) {
    if (!(await exists(`agents/${name}.md`)) && !(await exists(`skills/${name}`))) {
      fail(`${file}:${n}: unknown agent or skill crew:${name}`);
    }
  }
  for (const [, name] of line.matchAll(/`([a-z][a-z-]*)` skill/g)) {
    if (!builtInSkills.has(name) && !(await exists(`skills/${name}`))) fail(`${file}:${n}: unknown skill \`${name}\``);
  }
});

// 7. crew's own agents are addressed by their namespaced type.
// A bare `executor` lets the platform resolve the spawn against the global agent namespace,
// where another plugin's same-named agent can be picked instead. Only the executable layer
// (commands/ + skills/) is scanned; `crew:<name>` is preceded by ":" and never matches.
const agentNames = (await fs.readdir("agents")).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));
const bareAgentRef = new RegExp("`(" + agentNames.join("|") + ")`", "g");
await scanLines(["commands", "skills"], "sub-agents are crew:-namespaced", (file, n, line) => {
  const hits = line.match(bareAgentRef);
  if (hits) fail(`${file}:${n}: bare agent reference ${[...new Set(hits)].join(", ")}, write \`crew:<name>\`: ${line.trim()}`);
});

// 8. Word budget for the instruction text (commands, agents, skills).
// 0.23.0 shipped 28,922 words; 1.0 cut it below a quarter. The ceiling keeps it there:
// raise it deliberately, never as a side effect.
const WORD_BUDGET = 7230;
let words = 0;
for (const root of ["commands", "agents", "skills"]) {
  for await (const file of walk(root)) {
    if (file.endsWith(".md")) words += (await fs.readFile(file, "utf8")).split(/\s+/).filter(Boolean).length;
  }
}
if (words > WORD_BUDGET) fail(`instruction text has ${words} words, budget is ${WORD_BUDGET}`);
else ok(`instruction text: ${words} of ${WORD_BUDGET} words`);

if (errors > 0) {
  console.error(`\n${errors} problem(s) found.`);
  process.exit(1);
}
console.log("\nplugin structure OK");
