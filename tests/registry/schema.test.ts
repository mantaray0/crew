import { describe, expect, it } from "vitest";
import { Archetype, Registry, Tag } from "../../src/registry/schema.js";

describe("registry schema", () => {
  it("fills tag defaults", () => {
    const t = Tag.parse({ name: "nextjs" });
    expect(t.skills).toEqual([]);
    expect(t.rules).toEqual([]);
    expect(t.description).toBe("");
  });

  it("fills archetype defaults", () => {
    const a = Archetype.parse({ name: "saas-app" });
    expect(a.tags).toEqual([]);
    expect(a.stack).toEqual({});
    expect(a.defaults.testing).toBe("tests-required");
  });

  it("parses a full registry and rejects a bad testing enum", () => {
    const r = Registry.parse({ tags: [{ name: "hono" }], archetypes: [{ name: "api", tags: ["hono"] }] });
    expect(r.archetypes[0].tags).toEqual(["hono"]);
    expect(() => Archetype.parse({ name: "x", defaults: { testing: "nope" } })).toThrow();
  });
});
