// Config cleanup for crew 1.0: keep only the keys crew still reads, back up the original.
// Runs from the SessionStart hook, so every config is cleaned the first time a session opens.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const KEPT = [
  ["language", "files"],
  ["workflow", "execute", "loop"],
  ["workflow", "execute", "review"],
];

// A written "inherit" means the same as an absent key, so it is dropped too.
export function pruneConfig(config) {
  const out = {};
  for (const keyPath of KEPT) {
    const value = keyPath.reduce((node, key) => (node && typeof node === "object" ? node[key] : undefined), config);
    if (value === undefined || value === "inherit") continue;
    let node = out;
    for (const key of keyPath.slice(0, -1)) node = node[key] ??= {};
    node[keyPath[keyPath.length - 1]] = value;
  }
  return out;
}

// Leaves are values that are not a non-empty object; an empty `{}` counts, so it gets removed.
export function countLeaves(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 1;
  const children = Object.values(value);
  return children.length === 0 ? 1 : children.reduce((sum, child) => sum + countLeaves(child), 0);
}

function keyCount(config) {
  return config && typeof config === "object" && Object.keys(config).length === 0 ? 0 : countLeaves(config);
}

export function crewHome() {
  return path.join(os.homedir(), ".claude", "crew");
}

function stamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

function display(file) {
  const home = os.homedir();
  return file.startsWith(home) ? `~${file.slice(home.length)}` : file;
}

// Returns a one-line report, or null when there was nothing to do.
export async function pruneFile(file, backupDir) {
  let raw;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch {
    return null; // no config here
  }
  let config;
  try {
    config = JSON.parse(raw);
  } catch {
    return `crew: ${display(file)} is not valid JSON; left unchanged. Only language.files, workflow.execute.loop and workflow.execute.review are read.`;
  }
  const pruned = pruneConfig(config);
  const removed = keyCount(config) - keyCount(pruned);
  if (removed <= 0) return null;
  await fs.mkdir(backupDir, { recursive: true });
  const backup = path.join(backupDir, `${path.basename(file, ".json")}-${stamp()}.json`);
  await fs.writeFile(backup, raw);
  await fs.writeFile(file, `${JSON.stringify(pruned, null, 2)}\n`);
  return `crew: removed ${removed} config keys crew no longer reads from ${display(file)} (backup: ${display(backup)}).`;
}

export async function retireProjectTypes(home) {
  const file = path.join(home, "project-types.json");
  try {
    await fs.access(file);
  } catch {
    return null;
  }
  const backupDir = path.join(home, "backup");
  await fs.mkdir(backupDir, { recursive: true });
  const backup = path.join(backupDir, `project-types-${stamp()}.json`);
  await fs.rename(file, backup);
  return `crew: moved the unused ${display(file)} to ${display(backup)}.`;
}

// Backups of project configs live outside the project, keyed by its path.
export function projectBackupDir(home, projectDir) {
  return path.join(home, "backup", "projects", projectDir.replace(/^\/+/, "").replace(/[/\\:]+/g, "-"));
}
