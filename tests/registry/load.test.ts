import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadRegistry,
  resolveArchetype,
  writeStarterRegistry,
} from "../../src/registry/load.js";
import { STARTER_REGISTRY } from "../../src/registry/starter.js";

describe("registry load", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "crew-reg-"));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("falls back to the starter registry when no file exists", async () => {
    const reg = await loadRegistry({ path: path.join(dir, "nope.json") });
    expect(reg.archetypes.map((a) => a.name)).toContain("saas-app");
  });

  it("loads a registry file when present", async () => {
    const p = path.join(dir, "project-types.json");
    await fs.writeFile(
      p,
      JSON.stringify({ archetypes: [{ name: "custom", tags: ["x"] }] }),
    );
    const reg = await loadRegistry({ path: p });
    expect(reg.archetypes.map((a) => a.name)).toEqual(["custom"]);
  });

  it("resolves an archetype to tags/stack/testing", () => {
    const r = resolveArchetype(STARTER_REGISTRY, "api-service");
    expect(r).not.toBeNull();
    expect(r?.tags).toContain("hono");
    expect(r?.stack.api).toBe("Hono");
    expect(r?.testing).toBe("tdd");
    expect(resolveArchetype(STARTER_REGISTRY, "missing")).toBeNull();
  });

  it("writes the starter registry to a path", async () => {
    const p = path.join(dir, "out.json");
    const written = await writeStarterRegistry(p);
    expect(written).toBe(p);
    const parsed = JSON.parse(await fs.readFile(p, "utf8"));
    expect(parsed.archetypes.length).toBeGreaterThan(0);
  });
});
