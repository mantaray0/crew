#!/usr/bin/env node
// SessionStart hook: name the active milestone and the next phase from .planning/ROADMAP.md,
// plus where the state lives. A few lines, never file contents.
// Opt out with CREW_SESSION_START_CONTEXT=off.
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_PHASE_CHARS = 120;

function clip(raw) {
  const text = raw.replace(/\s+/g, " ");
  return text.length > MAX_PHASE_CHARS ? `${text.slice(0, MAX_PHASE_CHARS - 1)}…` : text;
}

// Milestones are `## ` headings, phases are `- [?]` lines beneath them.
export function summarize(roadmap) {
  let milestone = null;
  let active = null;
  const open = [];
  for (const line of roadmap.split("\n")) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      milestone = heading[1].replace(/\s*`\[.\]`$/, "");
      continue;
    }
    const phase = line.match(/^\s*[-*]\s+\[([ >])\]\s+(.+?)\s*$/);
    if (!phase) continue;
    const entry = { milestone, text: clip(phase[2]) };
    if (phase[1] === ">" && !active) active = entry;
    if (phase[1] === " ") open.push(entry);
  }
  const current = active?.milestone ?? open[0]?.milestone ?? null;
  const next = open.find((p) => p.milestone === current) ?? open[0] ?? null;
  return { milestone: current, active: active?.text ?? null, next: next?.text ?? null };
}

export function render({ milestone, active, next }) {
  const lines = [
    "crew: this project's state lives in .planning/ (PROJECT.md, ROADMAP.md, LOG.md, plans/). /crew:resume gives a full briefing.",
  ];
  if (milestone) lines.push(`Milestone: ${milestone}`);
  if (active) lines.push(`In progress: ${active}`);
  if (next) lines.push(`Next: ${next}`);
  if (!active && !next) lines.push("No open phases in ROADMAP.md.");
  return `${lines.join("\n")}\n`;
}

async function main() {
  if (process.env.CREW_SESSION_START_CONTEXT === "off") return;
  const dir = path.join(process.cwd(), ".planning");
  try {
    await fs.access(dir);
  } catch {
    return; // not a crew project
  }
  let roadmap = "";
  try {
    roadmap = await fs.readFile(path.join(dir, "ROADMAP.md"), "utf8");
  } catch {
    // no roadmap yet; the path hint alone still helps
  }
  process.stdout.write(render(summarize(roadmap)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
