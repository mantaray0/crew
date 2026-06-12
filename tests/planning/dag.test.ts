// tests/planning/dag.test.ts
import { describe, expect, it } from "vitest";
import {
  parseRoadmap,
  readyPhases,
  topoWaves,
} from "../../src/planning/dag.js";

describe("parseRoadmap", () => {
  it("extracts id, done, and deps from a roadmap string", () => {
    const md = `
## Meilenstein 1

- [x] 1.1 Bootstrap done (depends: 1.0)
- [ ] 1.2 API setup
- [>] 1.3 In progress (depends: 1.1, 1.2)
- [~] 1.4 Skipped (depends: 1.1)
`;
    const phases = parseRoadmap(md);
    expect(phases).toHaveLength(4);

    const p11 = phases.find((p) => p.id === "1.1");
    expect(p11).toBeDefined();
    expect(p11?.done).toBe(true);
    expect(p11?.deps).toEqual(["1.0"]);

    const p12 = phases.find((p) => p.id === "1.2");
    expect(p12).toBeDefined();
    expect(p12?.done).toBe(false);
    expect(p12?.deps).toEqual([]);

    const p13 = phases.find((p) => p.id === "1.3");
    expect(p13).toBeDefined();
    expect(p13?.done).toBe(false);
    expect(p13?.deps).toEqual(["1.1", "1.2"]);

    const p14 = phases.find((p) => p.id === "1.4");
    expect(p14).toBeDefined();
    expect(p14?.done).toBe(false);
    expect(p14?.deps).toEqual(["1.1"]);

    // Non-marker lines are ignored (## Meilenstein 1 is not in results)
    expect(phases.every((p) => p.id !== "Meilenstein")).toBe(true);
  });
});

describe("topoWaves", () => {
  it("returns waves for a linear chain a→b→c", () => {
    const phases = [
      { id: "a", deps: [] },
      { id: "b", deps: ["a"] },
      { id: "c", deps: ["b"] },
    ];
    expect(topoWaves(phases)).toEqual([["a"], ["b"], ["c"]]);
  });

  it("returns a single wave for two independent phases", () => {
    const phases = [
      { id: "a", deps: [] },
      { id: "b", deps: [] },
    ];
    expect(topoWaves(phases)).toEqual([["a", "b"]]);
  });

  it("throws on a cycle", () => {
    const phases = [
      { id: "a", deps: ["b"] },
      { id: "b", deps: ["a"] },
    ];
    expect(() => topoWaves(phases)).toThrow("cycle detected");
  });

  it("ignores deps that reference unknown phase ids", () => {
    const phases = [
      { id: "a", deps: ["unknown-dep"] },
      { id: "b", deps: ["a"] },
    ];
    // "unknown-dep" is not in the phases list, so 'a' has no known blocking deps
    expect(topoWaves(phases)).toEqual([["a"], ["b"]]);
  });
});

describe("readyPhases", () => {
  it("returns phases whose deps are all done (done set)", () => {
    const phases = [
      { id: "a", deps: [] },
      { id: "b", deps: ["a"] },
      { id: "c", deps: ["a"] },
    ];

    // With done={a}, b and c are ready
    expect(readyPhases(phases, new Set(["a"]))).toEqual(["b", "c"]);

    // With done={}, only a is ready
    expect(readyPhases(phases, new Set())).toEqual(["a"]);
  });

  it("excludes already-done phases", () => {
    const phases = [
      { id: "a", deps: [], done: true },
      { id: "b", deps: ["a"] },
    ];
    const result = readyPhases(phases);
    expect(result).toEqual(["b"]);
    expect(result).not.toContain("a");
  });

  it("defaults done to empty set", () => {
    const phases = [
      { id: "a", deps: [] },
      { id: "b", deps: ["a"] },
    ];
    expect(readyPhases(phases)).toEqual(["a"]);
  });
});
