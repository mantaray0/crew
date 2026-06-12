// tests/planning/claims.test.ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  claimPhase,
  readClaims,
  releasePhase,
} from "../../src/planning/claims.js";

describe("claims", () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "crew-claims-"));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("readClaims returns {} on a fresh root", async () => {
    const claims = await readClaims(root);
    expect(claims).toEqual({});
  });

  it("claimPhase sets the owner and readClaims reflects it", async () => {
    const result = await claimPhase(root, "1.1", "agent-a");
    expect(result).toEqual({ ok: true, owner: "agent-a" });

    const claims = await readClaims(root);
    expect(claims["1.1"]).toBe("agent-a");
  });

  it("second claimPhase for same phase by different owner returns { ok:false } and does not change stored owner", async () => {
    await claimPhase(root, "1.1", "agent-a");
    const result = await claimPhase(root, "1.1", "agent-b");
    expect(result).toEqual({ ok: false, owner: "agent-a" });

    const claims = await readClaims(root);
    expect(claims["1.1"]).toBe("agent-a");
  });

  it("same-owner re-claim returns { ok:true }", async () => {
    await claimPhase(root, "1.1", "agent-a");
    const result = await claimPhase(root, "1.1", "agent-a");
    expect(result).toEqual({ ok: true, owner: "agent-a" });

    const claims = await readClaims(root);
    expect(claims["1.1"]).toBe("agent-a");
  });

  it("releasePhase removes the claim", async () => {
    await claimPhase(root, "1.1", "agent-a");
    await releasePhase(root, "1.1");

    const claims = await readClaims(root);
    expect(claims["1.1"]).toBeUndefined();
  });
});
