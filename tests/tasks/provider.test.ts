// tests/tasks/provider.test.ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getProvider, localList } from "../../src/tasks/provider.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "crew-provider-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("localList", () => {
  it("returns [] when roadmap.md does not exist", async () => {
    const result = await localList(tmpDir);
    expect(result).toEqual([]);
  });

  it("parses a roadmap with done and open phases", async () => {
    const planningDir = path.join(tmpDir, ".planning");
    await fs.mkdir(planningDir, { recursive: true });
    await fs.writeFile(
      path.join(planningDir, "roadmap.md"),
      [
        "## Milestone 1",
        "",
        "- [x] 1.1 Bootstrap done (depends: 1.0)",
        "- [ ] 1.2 API setup",
      ].join("\n"),
      "utf8",
    );

    const result = await localList(tmpDir);
    expect(result).toHaveLength(2);

    const p11 = result.find((w) => w.id === "1.1");
    expect(p11).toBeDefined();
    expect(p11?.title).toBe("Bootstrap done");
    expect(p11?.status).toBe("done");
    expect(p11?.description).toBe("");
    expect(p11?.acceptanceCriteria).toEqual([]);

    const p12 = result.find((w) => w.id === "1.2");
    expect(p12).toBeDefined();
    expect(p12?.title).toBe("API setup");
    expect(p12?.status).toBe("open");
  });
});

describe("getProvider", () => {
  it("getProvider('local').list works", async () => {
    const provider = getProvider("local");
    const result = await provider.list(tmpDir);
    expect(Array.isArray(result)).toBe(true);
  });

  it("getProvider throws for unsupported providers", () => {
    expect(() => getProvider("mcp:linear")).toThrow(/provider not available/);
    expect(() => getProvider("mcp:jira")).toThrow(/provider not available/);
    expect(() => getProvider("crew-pm")).toThrow(/provider not available/);
  });
});
