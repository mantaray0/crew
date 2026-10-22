import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { render, summarize } from "../hooks/scripts/session-start.mjs";

const HOOK = fileURLToPath(new URL("../hooks/scripts/session-start.mjs", import.meta.url));

test("in-progress phase wins, next open phase comes from the same milestone", () => {
  const roadmap = [
    "# Roadmap",
    "## Meilenstein 1: Fundament, archiviert 2026-08-14 -> archive/plans/1_fundament/_roadmap.md",
    "## Milestone 6: Reichweite",
    "- [ ] 26.9 Liegengeblieben",
    "## Milestone 7: Anbieter `[>]`",
    "- [x] 29.9.14 Die Checkliste (erledigt 2026-10-17)",
    "- [ ] 29.9.16 Inhalte ohne JavaScript (depends: 29.9.9)",
    "- [>] 29.9.15 Nachtest und Abnahme (depends: 29.9.14)",
    "## Milestone 8: Suche `[ ]`",
    "- [ ] 30.1 Die Blätter der Suche",
  ].join("\n");
  assert.deepEqual(summarize(roadmap), {
    milestone: "Milestone 7: Anbieter",
    active: "29.9.15 Nachtest und Abnahme (depends: 29.9.14)",
    next: "29.9.16 Inhalte ohne JavaScript (depends: 29.9.9)",
  });
});

test("without an in-progress phase the first open phase picks the milestone", () => {
  const roadmap = [
    "## Milestone 1: Walking skeleton, done 2026-08-14, archived",
    "## Milestone 2: Admin shell",
    "- [x] 2.1 Shell",
    "  - [ ] 2.2 Forms",
    "## Milestone 3: Canvas",
    "- [ ] 3.1 Frame",
  ].join("\n");
  assert.deepEqual(summarize(roadmap), { milestone: "Milestone 2: Admin shell", active: null, next: "2.2 Forms" });
});

test("column padding collapses to single spaces", () => {
  assert.equal(summarize("## M\n- [ ] 1.1 Suchfeld        (depends: 1.0)").next, "1.1 Suchfeld (depends: 1.0)");
});

test("long phase lines are clipped", () => {
  const { next } = summarize(`## M\n- [ ] 9.2 ${"x".repeat(500)}`);
  assert.equal(next.length, 120);
  assert.ok(next.endsWith("…"));
});

test("a finished or empty roadmap says so", () => {
  assert.match(render(summarize("## M\n- [x] 1.1 Done\n- [~] 1.2 Later")), /No open phases/);
  assert.match(render(summarize("")), /No open phases/);
});

test("the hook is silent outside a crew project and brief inside one", () => {
  const outside = mkdtempSync(path.join(tmpdir(), "crew-hook-"));
  assert.equal(execFileSync("node", [HOOK], { cwd: outside, encoding: "utf8" }), "");

  const inside = mkdtempSync(path.join(tmpdir(), "crew-hook-"));
  mkdirSync(path.join(inside, ".planning"));
  writeFileSync(path.join(inside, ".planning", "PROJECT.md"), "# Secret project body\n");
  writeFileSync(path.join(inside, ".planning", "ROADMAP.md"), "## Milestone 1\n- [ ] 1.1 Start\n");
  const out = execFileSync("node", [HOOK], { cwd: inside, encoding: "utf8" });
  assert.match(out, /Next: 1\.1 Start/);
  assert.doesNotMatch(out, /Secret project body/);
  assert.ok(out.split("\n").length <= 5);
});
