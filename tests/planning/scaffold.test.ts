// tests/planning/scaffold.test.ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CrewConfig } from "../../src/config/schema.js";
import { scaffoldPlanning } from "../../src/planning/scaffold.js";

describe("scaffoldPlanning", () => {
  let root: string;
  const answers = {
    projectName: "demo",
    projectType: "saas-app",
    tags: ["nextjs", "drizzle"],
    stack: { db: "postgres", orm: "drizzle" },
  };

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "crew-scaffold-"));
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("creates the .planning structure with a valid config", async () => {
    const dir = await scaffoldPlanning(root, answers);
    for (const f of [
      "config.json",
      "PROJECT.md",
      "roadmap.md",
      "log.md",
      "claims.json",
      "backlog.md",
    ]) {
      await expect(fs.access(path.join(dir, f))).resolves.toBeUndefined();
    }
    await expect(fs.access(path.join(dir, "plans"))).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(dir, "sessions")),
    ).resolves.toBeUndefined();

    const raw = JSON.parse(
      await fs.readFile(path.join(dir, "config.json"), "utf8"),
    );
    const cfg = CrewConfig.parse(raw);
    expect(cfg.projectType).toBe("saas-app");
    expect(cfg.tags).toEqual(["nextjs", "drizzle"]);
    expect(cfg.stack.db).toBe("postgres");

    const project = await fs.readFile(path.join(dir, "PROJECT.md"), "utf8");
    expect(project).toContain("demo");
    expect(project).toContain("postgres");
  });

  it("refuses to overwrite an existing .planning unless force=true", async () => {
    await scaffoldPlanning(root, answers);
    await expect(scaffoldPlanning(root, answers)).rejects.toThrow(
      /already exists/,
    );
    await expect(
      scaffoldPlanning(root, answers, { force: true }),
    ).resolves.toContain(".planning");
  });
});
