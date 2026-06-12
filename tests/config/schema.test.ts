// tests/config/schema.test.ts
import { describe, expect, it } from "vitest";
import { CrewConfig } from "../../src/config/schema.js";

describe("CrewConfig", () => {
  it("produces full defaults from an empty object", () => {
    const c = CrewConfig.parse({});
    expect(c.git.autoCommitPerPhase).toBe(true);
    expect(c.git.autoPush).toBe(false);
    expect(c.git.mergeStrategy).toBe("integration-branch");
    expect(c.execution.parallel).toBe("auto");
    expect(c.execution.maxConcurrent).toBe(3);
    expect(c.models.mode).toBe("auto");
    expect(c.clarify.specArtifact).toBe("section");
    expect(c.security.auto).toBe(false);
    expect(c.notifications.events).toEqual(["blocker", "completion"]);
    expect(c.tasks.provider).toBe("local");
    expect(c.tags).toEqual([]);
  });

  it("rejects an invalid enum value", () => {
    expect(() =>
      CrewConfig.parse({ git: { mergeStrategy: "nope" } }),
    ).toThrow();
  });

  it("keeps user overrides while filling the rest with defaults", () => {
    const c = CrewConfig.parse({ git: { autoPush: true }, tags: ["nextjs"] });
    expect(c.git.autoPush).toBe(true);
    expect(c.git.autoCommitPerPhase).toBe(true); // still defaulted
    expect(c.tags).toEqual(["nextjs"]);
  });
});
