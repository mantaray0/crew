import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { projectBackupDir, pruneConfig } from "../hooks/scripts/prune-config.mjs";

const HOOK = fileURLToPath(new URL("../hooks/scripts/session-start.mjs", import.meta.url));

// Shapes taken from real 0.2x configs: global defaults, a full inherit form, a minimal form.
const GLOBAL_0X = {
  crewVersion: "0.21.0",
  workflow: { mode: "manual", brief: { depth: "normal" }, execute: { loop: "all", verify: { default: "inherit" } }, ship: { run: "ask" } },
  git: { commitPattern: "[{type}] {ticket}: {subject}", baseBranch: "develop" },
  models: { mode: "auto" },
  tasks: { provider: "jira", projectKey: null },
  notifications: { events: ["blocker", "completion"] },
  language: { files: "de" },
  responseStyle: "concise",
};
const PROJECT_FULL = {
  crewVersion: "0.22.0",
  language: { files: "en" },
  workflow: { mode: "inherit", plan: {}, execute: { loop: "inherit", parallel: "inherit" } },
  git: { autoCommitPerPhase: true, baseBranch: "main" },
  stack: { language: "TypeScript" },
};
const PROJECT_INHERIT_ONLY = { crewVersion: "0.22.0", language: { files: "inherit" }, tags: ["bun"] };

function setup({ global, project }) {
  const home = mkdtempSync(path.join(tmpdir(), "crew-home-"));
  // The hook sees the resolved cwd (/var is /private/var on macOS), so the test uses it too.
  const projectDir = realpathSync(mkdtempSync(path.join(tmpdir(), "crew-proj-")));
  mkdirSync(path.join(home, ".claude", "crew"), { recursive: true });
  mkdirSync(path.join(projectDir, ".planning"));
  if (global !== undefined) writeFileSync(path.join(home, ".claude", "crew", "config.json"), global);
  if (project !== undefined) writeFileSync(path.join(projectDir, ".planning", "config.json"), project);
  const run = () => execFileSync("node", [HOOK], { cwd: projectDir, encoding: "utf8", env: { ...process.env, HOME: home } });
  const read = (file) => JSON.parse(readFileSync(file, "utf8"));
  return {
    home,
    projectDir,
    run,
    globalFile: path.join(home, ".claude", "crew", "config.json"),
    projectFile: path.join(projectDir, ".planning", "config.json"),
    read,
  };
}

test("pruneConfig keeps the three read keys and drops inherit", () => {
  assert.deepEqual(pruneConfig(GLOBAL_0X), { language: { files: "de" }, workflow: { execute: { loop: "all" } } });
  assert.deepEqual(pruneConfig(PROJECT_FULL), { language: { files: "en" } });
  assert.deepEqual(pruneConfig(PROJECT_INHERIT_ONLY), {});
  assert.deepEqual(pruneConfig({ workflow: { execute: { review: "high" } } }), { workflow: { execute: { review: "high" } } });
});

test("session start cleans global and project config and backs both up outside the project", () => {
  const env = setup({ global: JSON.stringify(GLOBAL_0X), project: JSON.stringify(PROJECT_FULL) });
  writeFileSync(path.join(env.home, ".claude", "crew", "project-types.json"), "{}");

  const out = env.run();

  assert.deepEqual(env.read(env.globalFile), { language: { files: "de" }, workflow: { execute: { loop: "all" } } });
  assert.deepEqual(env.read(env.projectFile), { language: { files: "en" } });
  assert.match(out, /removed \d+ config keys .*config\.json/);

  const crew = path.join(env.home, ".claude", "crew");
  assert.ok(!existsSync(path.join(crew, "project-types.json")));
  const backups = readdirSync(path.join(crew, "backup"));
  assert.ok(backups.some((f) => f.startsWith("config-")));
  assert.ok(backups.some((f) => f.startsWith("project-types-")));

  const projectBackups = readdirSync(projectBackupDir(crew, env.projectDir));
  assert.equal(projectBackups.length, 1);
  assert.deepEqual(env.read(path.join(projectBackupDir(crew, env.projectDir), projectBackups[0])), PROJECT_FULL);
  assert.deepEqual(readdirSync(path.join(env.projectDir, ".planning")).sort(), ["config.json"]);
});

test("a clean config is left alone on the next session", () => {
  const env = setup({ global: JSON.stringify(GLOBAL_0X), project: JSON.stringify(PROJECT_INHERIT_ONLY) });
  // crewVersion, language.files ("inherit") and tags: all three go.
  assert.match(env.run(), /removed 3 config keys .*\.planning\/config\.json/);
  assert.deepEqual(env.read(env.projectFile), {});
  const before = statSync(env.globalFile).mtimeMs;

  const out = env.run();

  assert.doesNotMatch(out, /removed/);
  assert.equal(statSync(env.globalFile).mtimeMs, before);
  const backups = readdirSync(path.join(env.home, ".claude", "crew", "backup"));
  assert.equal(backups.filter((f) => f.startsWith("config-")).length, 1);
});

test("an empty or already minimal config is not rewritten", () => {
  const env = setup({ global: '{ "language": { "files": "de" } }\n', project: "{}\n" });
  const out = env.run();
  assert.doesNotMatch(out, /removed/);
  assert.equal(readFileSync(env.globalFile, "utf8"), '{ "language": { "files": "de" } }\n');
  assert.ok(!existsSync(path.join(env.home, ".claude", "crew", "backup")));
});

test("invalid JSON stays untouched and is reported", () => {
  const broken = '{ "language": { "files": "de" }, // comment\n }';
  const env = setup({ global: broken });
  const out = env.run();
  assert.equal(readFileSync(env.globalFile, "utf8"), broken);
  assert.match(out, /not valid JSON; left unchanged/);
});
