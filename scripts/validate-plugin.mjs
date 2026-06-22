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
// Also scan pending changesets: an internal label there becomes permanent once
// `changeset version` folds it into CHANGELOG.md (the real 0.16.0 leak). Catch it
// while it's still editable. CHANGELOG.md itself is immutable history — not scanned.
const labelScanRoots = [...shippedRoots, ".changeset"];
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
for (const root of labelScanRoots) {
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
    fail(`check 5: could not scan root "${root}": ${e.message}`);
  }
}
if (errors === errorsBeforeCheck5) ok("no internal milestone labels in shipped content or pending changesets");

// 6. Inherit-sentinel leak protection — crew-config is the source of truth (read-side contract).
// (A) The defaults block must stay concrete: an "inherit" there would have nothing to resolve
//     down to and would leak as an effective value (Anf. 7). (B) The canonical read-side
//     resolution rule must stay present (a stable marker) so every reader can keep referencing it.
const CREW_CONFIG = "skills/crew-config/SKILL.md";
const RESOLUTION_MARKER = "inherit-resolution-contract"; // stable marker in crew-config; this guard keeps it present
try {
  const skill = await fs.readFile(CREW_CONFIG, "utf8");
  const lines = skill.split("\n");

  // (A) Extract the "## `config.json` (full defaults)" fenced block — the FIRST fence after the
  //     heading, which is the defaults block; the later "full inherit form" example is excluded.
  const headingIdx = lines.findIndex(
    (l) => l.startsWith("## ") && l.includes("config.json") && l.includes("(full defaults)"),
  );
  const openIdx = headingIdx === -1 ? -1 : lines.findIndex((l, i) => i > headingIdx && l.startsWith("```"));
  const closeIdx = openIdx === -1 ? -1 : lines.findIndex((l, i) => i > openIdx && l.trim() === "```");
  const defaultsBlock = closeIdx === -1 ? null : lines.slice(openIdx + 1, closeIdx).join("\n");
  if (defaultsBlock === null || !defaultsBlock.includes('"stack"')) {
    // Fail loudly rather than skip — a missing heading/fence OR a truncated/empty extraction
    // (e.g. a stray ``` between the fences shortening the slice) must not pass as clean.
    // "stack" is the block's last key, so its absence means we did not capture the whole block.
    fail(`${CREW_CONFIG}: could not extract the complete "config.json (full defaults)" block — cannot verify the defaults layer stays concrete`);
  } else if (defaultsBlock.includes('"inherit"')) {
    fail(`${CREW_CONFIG}: the defaults block must resolve to a concrete value — "inherit" in the defaults layer would leak as an effective value`);
  } else {
    ok('crew-config defaults block is concrete (no "inherit")');
  }

  // (B) The canonical read-side resolution rule must stay present.
  if (skill.includes(RESOLUTION_MARKER)) {
    ok("canonical inherit-resolution rule present");
  } else {
    fail(`${CREW_CONFIG}: canonical inherit-resolution marker "${RESOLUTION_MARKER}" missing — the read-side contract every reader references must stay present`);
  }
} catch (e) {
  fail(`check 6: could not read ${CREW_CONFIG}: ${e.message}`);
}

// 7. Dispatched sub-agents must be addressed by their crew:-namespaced type.
// Every place a command or skill names one of crew's own agents in backticks must write it as
// `crew:<name>`, never the bare `<name>`. A bare name lets the platform resolve the spawn against
// the global agent namespace, where a third-party plugin's same-named agent (e.g. GSD's
// gsd-executor shadowing the work-core spawn) can be picked instead. Scanning the executable layer
// (commands/ + skills/) — not README, which is documentation — keeps the check to the real spawn
// surface. The regex requires a backtick immediately before the name, so `crew:<name>` (preceded
// by ":") never matches.
const agentNames = (await fs.readdir("agents")).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));
const bareAgentRef = new RegExp("`(" + agentNames.join("|") + ")`", "g");
const dispatchRoots = ["commands", "skills"];
const errorsBeforeCheck7 = errors;
for (const root of dispatchRoots) {
  try {
    for await (const file of walkShipped(root)) {
      const lines = (await fs.readFile(file, "utf8")).split("\n");
      lines.forEach((line, i) => {
        const hits = line.match(bareAgentRef);
        if (hits) {
          fail(
            `${file}:${i + 1}: bare agent reference ${[...new Set(hits)].join(", ")} — address crew's own agents as \`crew:<name>\` so a third-party plugin can't shadow the spawn: ${line.trim()}`,
          );
        }
      });
    }
  } catch (e) {
    fail(`check 7: could not scan root "${root}": ${e.message}`);
  }
}
if (errors === errorsBeforeCheck7) ok("dispatched sub-agents are crew:-namespaced");

if (errors > 0) {
  console.error(`\n${errors} problem(s) found.`);
  process.exit(1);
}
console.log("\nplugin structure OK");
