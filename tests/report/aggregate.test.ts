// tests/report/aggregate.test.ts
import { describe, expect, it } from "vitest";
import { aggregateLog } from "../../src/report/aggregate.js";

describe("aggregateLog", () => {
  it("returns zeros for an empty string", () => {
    expect(aggregateLog("")).toEqual({ phases: 0, tokens: 0, costUsd: 0 });
  });

  it("sums tokens and cost across two phase lines", () => {
    const md = [
      "2026-06-12 14:30 · M1.2 erledigt · commit abc1234 · Verify: pass · ~38k tok / $0.42",
      "2026-06-12 15:00 · M1.3 erledigt · commit def5678 · Verify: pass · ~12k tok / $0.10",
    ].join("\n");

    const result = aggregateLog(md);
    expect(result.phases).toBe(2);
    expect(result.tokens).toBe(50000);
    expect(result.costUsd).toBeCloseTo(0.52, 5);
  });

  it("ignores lines without a tok entry", () => {
    const md = [
      "2026-06-12 14:30 · M1.2 erledigt · commit abc1234 · Verify: pass · ~38k tok / $0.42",
      "2026-06-12 15:00 · some note without token count",
    ].join("\n");

    const result = aggregateLog(md);
    expect(result.phases).toBe(1);
    expect(result.tokens).toBe(38000);
    expect(result.costUsd).toBeCloseTo(0.42, 5);
  });
});
