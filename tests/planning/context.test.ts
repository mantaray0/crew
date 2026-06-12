// tests/planning/context.test.ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  latestSnapshotPath,
  readProjectContext,
} from "../../src/planning/context.js";

describe("context helper", () => {
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "crew-ctx-"));
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("returns null when PROJECT.md is absent", async () => {
    expect(await readProjectContext(root, 1000)).toBeNull();
  });

  it("returns PROJECT.md content within the char budget", async () => {
    await fs.mkdir(path.join(root, ".planning"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".planning", "PROJECT.md"),
      "# Demo\nhello",
    );
    const c = await readProjectContext(root, 1000);
    expect(c).toContain("# Demo");
  });

  it("truncates and marks when over budget", async () => {
    await fs.mkdir(path.join(root, ".planning"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".planning", "PROJECT.md"),
      "x".repeat(5000),
    );
    const c = await readProjectContext(root, 100);
    expect(c?.length).toBeLessThan(300);
    expect(c).toContain("truncated");
  });

  it("finds the newest snapshot across worktree subdirs", async () => {
    const a = path.join(root, ".planning", "sessions", "wt-a");
    const b = path.join(root, ".planning", "sessions", "wt-b");
    await fs.mkdir(a, { recursive: true });
    await fs.mkdir(b, { recursive: true });
    await fs.writeFile(path.join(a, "2026-06-12T10-00.md"), "old");
    await fs.writeFile(path.join(b, "2026-06-12T12-00.md"), "new");
    const p = await latestSnapshotPath(root);
    expect(p).toBe(path.join(b, "2026-06-12T12-00.md"));
    expect(await latestSnapshotPath(path.join(root, "empty"))).toBeNull();
  });
});
