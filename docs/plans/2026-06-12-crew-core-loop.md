# crew Core Loop — Implementation Plan (Plan 3)

> **For agentic workers:** Part A (command/skill markdown) is authored content, already committed. Part B (context helper + hooks) below is TDD/code. REQUIRED SUB-SKILL for Part B: superpowers:subagent-driven-development.

**Goal:** Wire the cross-session context spine: a tested `context` helper plus Claude Code hooks that load `PROJECT.md` at session start and write a snapshot before compaction.

**Architecture:** A pure, tested `src/planning/context.ts` (read bounded project context; find latest snapshot). Two thin hook scripts under `hooks/scripts/` that import the built helper and are wired in `hooks/hooks.json`. Builds on Plans 1–2.

**Tech Stack:** TypeScript, Vitest, Node ESM hook scripts.

---

## Part A — Command & Skill surface (DONE, committed `0512a0f`)

Authored markdown (no tests — they are prompts): `commands/{brief,plan,next,adjust,backlog,resume}.md`, `skills/{roast-me,crew-planning,crew-context}/SKILL.md`. These drive the workflow against the `.planning/` state model.

---

## Part B — Context helper + hooks (TDD/code)

### Task 1: `src/planning/context.ts`

**Files:** Create `src/planning/context.ts`, `tests/planning/context.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/planning/context.test.ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { latestSnapshotPath, readProjectContext } from "../../src/planning/context.js";

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
    await fs.writeFile(path.join(root, ".planning", "PROJECT.md"), "# Demo\nhello");
    const c = await readProjectContext(root, 1000);
    expect(c).toContain("# Demo");
  });

  it("truncates and marks when over budget", async () => {
    await fs.mkdir(path.join(root, ".planning"), { recursive: true });
    await fs.writeFile(path.join(root, ".planning", "PROJECT.md"), "x".repeat(5000));
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/planning/context.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/planning/context.ts`**

```ts
import { promises as fs } from "node:fs";
import path from "node:path";

const planningDir = (root: string) => path.join(root, ".planning");

/** Read .planning/PROJECT.md, bounded to maxChars. Returns null if absent. */
export async function readProjectContext(root: string, maxChars: number): Promise<string | null> {
  const file = path.join(planningDir(root), "PROJECT.md");
  let content: string;
  try {
    content = await fs.readFile(file, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
  if (content.length > maxChars) {
    return `${content.slice(0, maxChars)}\n\n[… truncated to ${maxChars} chars]`;
  }
  return content;
}

/** Newest snapshot file under .planning/sessions/**, or null. Ordered by filename (ISO timestamps sort lexically). */
export async function latestSnapshotPath(root: string): Promise<string | null> {
  const base = path.join(planningDir(root), "sessions");
  let entries: string[];
  try {
    entries = await fs.readdir(base);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
  const files: string[] = [];
  for (const sub of entries) {
    const subPath = path.join(base, sub);
    const stat = await fs.stat(subPath);
    if (stat.isDirectory()) {
      for (const f of await fs.readdir(subPath)) files.push(path.join(subPath, f));
    } else if (stat.isFile()) {
      files.push(subPath);
    }
  }
  if (files.length === 0) return null;
  files.sort((a, b) => (path.basename(a) < path.basename(b) ? -1 : 1));
  return files[files.length - 1];
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm vitest run tests/planning/context.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/planning/context.ts tests/planning/context.test.ts
git commit -m "feat(planning): bounded project-context reader + latest-snapshot finder"
```

### Task 2: Hook scripts + wiring

**Files:** Create `hooks/scripts/session-start.mjs`, `hooks/scripts/pre-compact.mjs`; modify `hooks/hooks.json`. Modify `src/index.ts` to re-export the context helper.

- [ ] **Step 1: Re-export from `src/index.ts`**

Append:

```ts
export { readProjectContext, latestSnapshotPath } from "./planning/context.js";
```

- [ ] **Step 2: Write `hooks/scripts/session-start.mjs`**

```js
#!/usr/bin/env node
// SessionStart hook: print .planning/PROJECT.md (bounded) so the session self-orients.
// Opt out with CREW_SESSION_START_CONTEXT=off; bound with CREW_SESSION_START_MAX_CHARS.
import { readProjectContext } from "../../dist/planning/context.js";

if (process.env.CREW_SESSION_START_CONTEXT === "off") process.exit(0);
const max = Number.parseInt(process.env.CREW_SESSION_START_MAX_CHARS ?? "6000", 10);
const ctx = await readProjectContext(process.cwd(), Number.isFinite(max) ? max : 6000);
if (ctx) {
  process.stdout.write(`# crew · project context\n\n${ctx}\n`);
}
process.exit(0);
```

- [ ] **Step 3: Write `hooks/scripts/pre-compact.mjs`**

```js
#!/usr/bin/env node
// PreCompact hook: drop a snapshot scaffold so state survives compaction.
// The assistant fills it; this guarantees the file + exact-next-step prompt exist.
import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dir = path.join(root, ".planning", "sessions", "default");
try {
  await fs.access(path.join(root, ".planning"));
} catch {
  process.exit(0); // not a crew project
}
await fs.mkdir(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = path.join(dir, `${stamp}.md`);
await fs.writeFile(
  file,
  `# Snapshot ${stamp}\n\n## Building\n\n## Works (with evidence)\n\n## Does NOT work (and why)\n\n## File states\n\n## Decisions\n\n## Exact next step\n`,
);
process.stdout.write(`crew: wrote snapshot scaffold ${path.relative(root, file)}\n`);
process.exit(0);
```

- [ ] **Step 4: Wire `hooks/hooks.json`**

Replace its contents with:

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-start.mjs\"" }] }
    ],
    "PreCompact": [
      { "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/scripts/pre-compact.mjs\"" }] }
    ]
  }
}
```

- [ ] **Step 5: Build + smoke-test the hooks**

Run:
```bash
pnpm build
# session-start: in a temp project with a PROJECT.md, the script prints it
T=$(mktemp -d); mkdir -p "$T/.planning"; printf '# Demo\nhello\n' > "$T/.planning/PROJECT.md"
( cd "$T" && node /Users/daniel/Sites/crew/hooks/scripts/session-start.mjs )   # expect: prints "# crew · project context" + Demo
# off switch
( cd "$T" && CREW_SESSION_START_CONTEXT=off node /Users/daniel/Sites/crew/hooks/scripts/session-start.mjs )  # expect: no output
# pre-compact writes a scaffold
( cd "$T" && node /Users/daniel/Sites/crew/hooks/scripts/pre-compact.mjs ) && ls "$T/.planning/sessions/default"
rm -rf "$T"
```
Expected: session-start prints the context block then nothing with the off-switch; pre-compact creates a `*.md` scaffold under `sessions/default/`.

- [ ] **Step 6: Validate JSON + full verification**

Run: `node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8'))" && pnpm test && pnpm typecheck && pnpm lint`
Expected: JSON valid; tests green (context 4 + the 16 existing = 20); typecheck clean; lint clean (run `pnpm format` and re-stage if it reformats).

- [ ] **Step 7: Commit**

```bash
git add hooks/scripts/session-start.mjs hooks/scripts/pre-compact.mjs hooks/hooks.json src/index.ts
git commit -m "feat(hooks): SessionStart project-context loader + PreCompact snapshot scaffold"
```

---

## Self-Review

**Spec coverage:** `/crew:{brief,plan,next,adjust,backlog,resume}` (Part A) + SessionStart loads PROJECT.md + PreCompact snapshots (Part B Task 2) + context helper (Task 1). Skills roast-me/crew-planning/crew-context authored. ✅
**Out of scope (later plans):** verify pipeline & agents (Plan 4), parallelism/merge (Plan 5), providers/retro/notifications/report (Plan 6). `/crew:next` references the verify pipeline that Plan 4 implements — acceptable forward reference in a prompt.
