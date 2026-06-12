// tests/config/load.test.ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deepMerge, loadConfig } from "../../src/config/load.js";

describe("deepMerge", () => {
  it("merges nested objects and replaces arrays", () => {
    const a = { git: { autoPush: false, branchPattern: "x" }, tags: ["a"] };
    const b = { git: { autoPush: true }, tags: ["b", "c"] };
    expect(deepMerge(a, b)).toEqual({
      git: { autoPush: true, branchPattern: "x" },
      tags: ["b", "c"],
    });
  });
});

describe("loadConfig", () => {
  let root: string;
  let globalPath: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "crew-root-"));
    globalPath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "crew-glob-")), "config.json");
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("returns full defaults when no files exist", async () => {
    const c = await loadConfig(root, { globalPath });
    expect(c.git.mergeStrategy).toBe("integration-branch");
  });

  it("layers project over global over defaults", async () => {
    await fs.writeFile(globalPath, JSON.stringify({ git: { autoPush: true }, models: { mode: "manual" } }));
    await fs.mkdir(path.join(root, ".planning"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".planning", "config.json"),
      JSON.stringify({ models: { mode: "auto" } }),
    );
    const c = await loadConfig(root, { globalPath });
    expect(c.git.autoPush).toBe(true); // from global
    expect(c.models.mode).toBe("auto"); // project overrides global
    expect(c.git.autoCommitPerPhase).toBe(true); // default survives
  });
});
