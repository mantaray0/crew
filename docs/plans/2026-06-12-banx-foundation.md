# banx Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the installable foundation of the `banx` Claude Code plugin: a typed config system (global + project merge), the `.planning/` project-state scaffolder, a working `banx init` CLI, and a minimal plugin manifest with one command — i.e. a plugin you can install and use to initialize a project and read its config.

**Architecture:** A single TypeScript package. Pure, testable core modules (`config`, `planning`) are covered by Vitest with TDD; the CLI (`cli`) is a thin wrapper that wires prompts to the core; Claude Code surfaces (`commands/`, `.claude-plugin/`) are markdown/JSON validated by a smoke install. Config is validated with Zod so runtime parsing and TypeScript types come from one source.

**Tech Stack:** TypeScript, Zod (schema+types), Commander (CLI), prompts (interactive input), Vitest (tests), Biome (lint/format), tsdown (bundle to `dist/`). Runs under Node (`npx`/`pnpmx`) and Bun.

---

## Plan Sequence (whole Core Engine)

This plan is **Plan 1 of 6**. Each plan ships working, testable software on its own.

1. **Foundation** (this plan) — package scaffold, config schema+loader, `.planning` scaffolder, `banx init`, plugin manifest, `/banx:status`.
2. **Project types & setup** — `banx setup`, archetype/tag registry, `init` seeds from a chosen archetype.
3. **Core loop** — `/banx:new` (roast-me + stack interview), `/banx:plan`, `/banx:next`, SessionStart/PreCompact hooks, `/banx:resume`, `/banx:adjust`.
4. **Verify pipeline & agents** — reviewer/simplifier/security agents, verify pipeline, model management.
5. **Parallelism & merge** — DAG dispatch, worktrees, `claims.json`, `merge-coordinator`, `/banx:dispatch`, `/banx:aside`, `/banx:rollback`.
6. **Providers, learn, notifications, report** — `local` task provider + `/banx:pull`, `/banx:learn`, notification hooks, `/banx:report`.

---

## File Structure (Plan 1)

| File | Responsibility |
|---|---|
| `package.json` | package metadata, scripts, bin, deps |
| `tsconfig.json` | TypeScript config |
| `biome.json` | lint/format |
| `vitest.config.ts` | test runner config |
| `tsdown.config.ts` | bundle config for `dist/` |
| `src/config/schema.ts` | Zod schema for `config.json` + inferred `BanxConfig` type |
| `src/config/load.ts` | `deepMerge`, `loadConfig` (defaults < global < project) |
| `src/planning/scaffold.ts` | create `.planning/` structure + render `PROJECT.md` |
| `src/cli/index.ts` | Commander entry, `banx init` command |
| `bin/banx.mjs` | executable shim → `dist/cli/index.js` |
| `.claude-plugin/plugin.json` | Claude Code plugin manifest |
| `commands/status.md` | `/banx:status` command (reads roadmap+log) |
| `tests/config/schema.test.ts` | schema defaults/validation tests |
| `tests/config/load.test.ts` | merge/load tests |
| `tests/planning/scaffold.test.ts` | scaffolder tests |
| `README.md` | install + usage |

---

## Task 1: Package scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `biome.json`, `vitest.config.ts`, `tsdown.config.ts`, `.gitignore` (extend)

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "banx",
  "version": "0.0.0",
  "description": "Config-driven agentic workflow harness for Claude Code",
  "type": "module",
  "bin": { "banx": "./bin/banx.mjs" },
  "exports": { ".": "./dist/index.js" },
  "files": ["dist", "bin", "commands", ".claude-plugin", "README.md"],
  "scripts": {
    "build": "tsdown",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "format": "biome check --write ."
  },
  "dependencies": {
    "commander": "^12.1.0",
    "prompts": "^2.4.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@types/node": "^22.7.0",
    "@types/prompts": "^2.4.9",
    "tsdown": "^0.6.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  },
  "engines": { "node": ">=18" }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "files": { "ignore": ["dist", "node_modules"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2 },
  "linter": { "enabled": true, "rules": { "recommended": true } }
}
```

- [ ] **Step 4: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
```

- [ ] **Step 5: Write `tsdown.config.ts`**

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/cli/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
});
```

- [ ] **Step 6: Create `src/index.ts` (public surface placeholder)**

```ts
export { loadConfig } from "./config/load.js";
export { BanxConfig } from "./config/schema.js";
export { scaffoldPlanning } from "./planning/scaffold.js";
```

- [ ] **Step 7: Extend `.gitignore`**

```
node_modules/
.DS_Store
dist/
```

- [ ] **Step 8: Install deps and verify tooling**

Run: `pnpm install && pnpm typecheck`
Expected: install succeeds; `tsc --noEmit` fails ONLY on missing `src/config/*` imports (resolved in Task 2). If it reports nothing yet because files are stubs, that's fine — proceed.

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json biome.json vitest.config.ts tsdown.config.ts src/index.ts .gitignore pnpm-lock.yaml
git commit -m "chore: scaffold banx package (ts, zod, vitest, biome)"
```

---

## Task 2: Config schema (Zod)

**Files:**
- Create: `src/config/schema.ts`
- Test: `tests/config/schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/config/schema.test.ts
import { describe, expect, it } from "vitest";
import { BanxConfig } from "../../src/config/schema.js";

describe("BanxConfig", () => {
  it("produces full defaults from an empty object", () => {
    const c = BanxConfig.parse({});
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
    expect(() => BanxConfig.parse({ git: { mergeStrategy: "nope" } })).toThrow();
  });

  it("keeps user overrides while filling the rest with defaults", () => {
    const c = BanxConfig.parse({ git: { autoPush: true }, tags: ["nextjs"] });
    expect(c.git.autoPush).toBe(true);
    expect(c.git.autoCommitPerPhase).toBe(true); // still defaulted
    expect(c.tags).toEqual(["nextjs"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/config/schema.test.ts`
Expected: FAIL — cannot find module `../../src/config/schema.js`.

- [ ] **Step 3: Write `src/config/schema.ts`**

```ts
import { z } from "zod";

const Git = z
  .object({
    autoCommitPerPhase: z.boolean().default(true),
    autoPush: z.boolean().default(false),
    autoPR: z.boolean().default(false),
    commitStyle: z.enum(["conventional", "plain"]).default("conventional"),
    branchPattern: z.string().default("feat/{slug}"),
    isolation: z
      .enum(["worktree-per-feature", "branch-per-feature", "linear"])
      .default("worktree-per-feature"),
    mergeStrategy: z.enum(["integration-branch", "pr", "ask-each"]).default("integration-branch"),
    askBeforeMerge: z.boolean().default(false),
    conflictPolicy: z.enum(["resolve-or-ask", "always-ask", "autonomous"]).default("resolve-or-ask"),
  })
  .default({});

const Execution = z
  .object({
    parallel: z.enum(["auto", "manual", "off"]).default("auto"),
    maxConcurrent: z.number().int().positive().default(3),
    onDeviation: z
      .enum(["small-self-major-ask", "always-ask", "autonomous"])
      .default("small-self-major-ask"),
  })
  .default({});

const Verify = z
  .object({
    default: z
      .array(z.enum(["verify", "review", "harden", "simplify"]))
      .default(["verify", "review", "harden", "simplify"]),
    perPhaseOverride: z.boolean().default(true),
  })
  .default({});

const Models = z
  .object({
    mode: z.enum(["auto", "manual"]).default("auto"),
    planning: z.string().default("opus"),
    execution: z.string().default("sonnet"),
    review: z.string().default("opus"),
    simplify: z.string().default("sonnet"),
    trivial: z.string().default("haiku"),
  })
  .default({});

const Clarify = z
  .object({
    depth: z.enum(["light", "normal", "deep"]).default("normal"),
    askOnlyWhenStuck: z.boolean().default(true),
    specArtifact: z.enum(["section", "separate", "off"]).default("section"),
  })
  .default({});

const Tasks = z
  .object({
    provider: z.string().default("local"),
    writeBack: z.boolean().default(false),
    projectKey: z.string().nullable().default(null),
  })
  .default({});

const Notifications = z
  .object({
    enabled: z.boolean().default(true),
    events: z.array(z.enum(["blocker", "completion"])).default(["blocker", "completion"]),
    channel: z.enum(["os", "push:ntfy", "push:pushover", "off"]).default("os"),
  })
  .default({});

export const BanxConfig = z
  .object({
    git: Git,
    execution: Execution,
    verify: Verify,
    models: Models,
    clarify: Clarify,
    tasks: Tasks,
    testing: z
      .object({
        policy: z.enum(["from-archetype", "tdd", "tests-required", "optional"]).default("from-archetype"),
      })
      .default({}),
    security: z.object({ auto: z.boolean().default(false) }).default({}),
    notifications: Notifications,
    learn: z.object({ enabled: z.boolean().default(true) }).default({}),
    state: z.object({ commitSessions: z.boolean().default(true) }).default({}),
    loop: z.object({ maxIterations: z.number().int().positive().default(6) }).default({}),
    observability: z.object({ trackCost: z.boolean().default(true) }).default({}),
    projectType: z.string().nullable().default(null),
    tags: z.array(z.string()).default([]),
    stack: z.record(z.string(), z.string()).default({}),
  })
  .default({});

export type BanxConfig = z.infer<typeof BanxConfig>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/config/schema.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/config/schema.ts tests/config/schema.test.ts
git commit -m "feat(config): zod schema with full defaults"
```

---

## Task 3: Config loader (defaults < global < project)

**Files:**
- Create: `src/config/load.ts`
- Test: `tests/config/load.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/config/load.test.ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deepMerge, loadConfig } from "../../src/config/load.js";

describe("deepMerge", () => {
  it("merges nested objects and replaces arrays", () => {
    const a = { git: { autoPush: false, branchPattern: "x" }, tags: ["a"] };
    const b = { git: { autoPush: true }, tags: ["b", "c"] };
    expect(deepMerge(a, b)).toEqual({
      git: { autoPush: true, branchPattern: "x" },
      tags: ["b", "c"],
    });
  });
});

describe("loadConfig", () => {
  let root: string;
  let globalPath: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "banx-root-"));
    globalPath = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "banx-glob-")), "config.json");
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("returns full defaults when no files exist", async () => {
    const c = await loadConfig(root, { globalPath });
    expect(c.git.mergeStrategy).toBe("integration-branch");
  });

  it("layers project over global over defaults", async () => {
    await fs.writeFile(globalPath, JSON.stringify({ git: { autoPush: true }, models: { mode: "manual" } }));
    await fs.mkdir(path.join(root, ".planning"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".planning", "config.json"),
      JSON.stringify({ models: { mode: "auto" } }),
    );
    const c = await loadConfig(root, { globalPath });
    expect(c.git.autoPush).toBe(true); // from global
    expect(c.models.mode).toBe("auto"); // project overrides global
    expect(c.git.autoCommitPerPhase).toBe(true); // default survives
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/config/load.test.ts`
Expected: FAIL — cannot find module `../../src/config/load.js`.

- [ ] **Step 3: Write `src/config/load.ts`**

```ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { BanxConfig } from "./schema.js";

export const GLOBAL_CONFIG_PATH = path.join(os.homedir(), ".claude", "banx", "config.json");

export function projectConfigPath(root: string): string {
  return path.join(root, ".planning", "config.json");
}

async function readJsonIfExists(p: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fs.readFile(p, "utf8")) as Record<string, unknown>;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw e;
  }
}

// Deep-merge plain objects; arrays and primitives from `b` replace `a`.
export function deepMerge<T>(a: T, b: unknown): T {
  if (Array.isArray(b)) return b as unknown as T;
  if (b && typeof b === "object" && a && typeof a === "object" && !Array.isArray(a)) {
    const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const k of Object.keys(b as Record<string, unknown>)) {
      out[k] = deepMerge((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]);
    }
    return out as T;
  }
  return (b === undefined ? a : (b as T));
}

export async function loadConfig(
  root: string,
  opts?: { globalPath?: string },
): Promise<BanxConfig> {
  const globalRaw = await readJsonIfExists(opts?.globalPath ?? GLOBAL_CONFIG_PATH);
  const projectRaw = await readJsonIfExists(projectConfigPath(root));
  const merged = deepMerge(globalRaw, projectRaw);
  return BanxConfig.parse(merged);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/config/load.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/config/load.ts tests/config/load.test.ts
git commit -m "feat(config): layered loader (defaults < global < project)"
```

---

## Task 4: `.planning/` scaffolder

**Files:**
- Create: `src/planning/scaffold.ts`
- Test: `tests/planning/scaffold.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/planning/scaffold.test.ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BanxConfig } from "../../src/config/schema.js";
import { scaffoldPlanning } from "../../src/planning/scaffold.js";

describe("scaffoldPlanning", () => {
  let root: string;
  const answers = {
    projectName: "demo",
    projectType: "saas-app",
    tags: ["nextjs", "drizzle"],
    stack: { db: "postgres", orm: "drizzle" },
  };

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "banx-scaffold-"));
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("creates the .planning structure with a valid config", async () => {
    const dir = await scaffoldPlanning(root, answers);
    for (const f of ["config.json", "PROJECT.md", "roadmap.md", "log.md", "claims.json", "backlog.md"]) {
      await expect(fs.access(path.join(dir, f))).resolves.toBeUndefined();
    }
    await expect(fs.access(path.join(dir, "plans"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(dir, "sessions"))).resolves.toBeUndefined();

    const raw = JSON.parse(await fs.readFile(path.join(dir, "config.json"), "utf8"));
    const cfg = BanxConfig.parse(raw);
    expect(cfg.projectType).toBe("saas-app");
    expect(cfg.tags).toEqual(["nextjs", "drizzle"]);
    expect(cfg.stack.db).toBe("postgres");

    const project = await fs.readFile(path.join(dir, "PROJECT.md"), "utf8");
    expect(project).toContain("demo");
    expect(project).toContain("postgres");
  });

  it("refuses to overwrite an existing .planning unless force=true", async () => {
    await scaffoldPlanning(root, answers);
    await expect(scaffoldPlanning(root, answers)).rejects.toThrow(/already exists/);
    await expect(scaffoldPlanning(root, answers, { force: true })).resolves.toContain(".planning");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/planning/scaffold.test.ts`
Expected: FAIL — cannot find module `../../src/planning/scaffold.js`.

- [ ] **Step 3: Write `src/planning/scaffold.ts`**

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { BanxConfig } from "../config/schema.js";

export interface InitAnswers {
  projectName: string;
  projectType: string | null;
  tags: string[];
  stack: Record<string, string>;
}

export function renderProjectMd(a: InitAnswers): string {
  const stackLines =
    Object.entries(a.stack)
      .map(([k, v]) => `- **${k}:** ${v}`)
      .join("\n") || "- (noch nicht festgelegt)";
  return `# ${a.projectName}

## Stack
${stackLines}

## Architektur-Entscheidungen
- (werden hier festgehalten — das Warum, nicht nur das Was)

## Aktueller Stand
- Projekt initialisiert. Nächster Schritt: \`/banx:brief\` oder \`/banx:plan\`.

## Constraints
- (immer geltende Leitplanken hier)
`;
}

export async function scaffoldPlanning(
  root: string,
  answers: InitAnswers,
  opts?: { force?: boolean },
): Promise<string> {
  const dir = path.join(root, ".planning");
  const exists = await fs
    .access(dir)
    .then(() => true)
    .catch(() => false);
  if (exists && !opts?.force) {
    throw new Error(`.planning already exists at ${dir} (use force to overwrite)`);
  }

  await fs.mkdir(path.join(dir, "plans"), { recursive: true });
  await fs.mkdir(path.join(dir, "sessions"), { recursive: true });

  const config = BanxConfig.parse({
    projectType: answers.projectType,
    tags: answers.tags,
    stack: answers.stack,
  });

  await fs.writeFile(path.join(dir, "config.json"), `${JSON.stringify(config, null, 2)}\n`);
  await fs.writeFile(path.join(dir, "PROJECT.md"), renderProjectMd(answers));
  await fs.writeFile(
    path.join(dir, "roadmap.md"),
    "# Roadmap\n\n## Meilenstein 1\n- [ ] 1.1 (erste Phase definieren)\n",
  );
  await fs.writeFile(path.join(dir, "log.md"), "# Log\n");
  await fs.writeFile(path.join(dir, "claims.json"), "{}\n");
  await fs.writeFile(path.join(dir, "backlog.md"), "# Backlog\n\n_Ideen hier ablegen; Triage bei /banx:plan oder /banx:adjust._\n");

  return dir;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/planning/scaffold.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite + typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: all tests PASS; `tsc --noEmit` clean.

- [ ] **Step 6: Commit**

```bash
git add src/planning/scaffold.ts tests/planning/scaffold.test.ts
git commit -m "feat(planning): .planning scaffolder with overwrite guard"
```

---

## Task 5: CLI `banx init`

**Files:**
- Create: `src/cli/index.ts`, `bin/banx.mjs`

- [ ] **Step 1: Write `src/cli/index.ts`**

```ts
import path from "node:path";
import { Command } from "commander";
import prompts from "prompts";
import { loadConfig } from "../config/load.js";
import { scaffoldPlanning } from "../planning/scaffold.js";

// Daniels Default-Stack — vorbefüllt im Interview.
const STACK_DEFAULTS: Record<string, string> = {
  language: "TypeScript",
  app: "Next.js",
  api: "Hono",
  db: "Postgres",
  orm: "Drizzle",
  ui: "shadcn + Base UI",
  styling: "Tailwind CSS",
  queue: "BullMQ + Redis",
  deploy: "Coolify",
};

export function buildProgram(): Command {
  const program = new Command();
  program.name("banx").description("Config-driven agentic workflow harness").version("0.0.0");

  program
    .command("init")
    .description("Initialize .planning/ in the current project")
    .option("-f, --force", "overwrite an existing .planning/")
    .option("-y, --yes", "accept stack defaults without prompting")
    .action(async (opts: { force?: boolean; yes?: boolean }) => {
      const root = process.cwd();
      const projectName = path.basename(root);

      let stack = { ...STACK_DEFAULTS };
      if (!opts.yes) {
        const res = await prompts({
          type: "confirm",
          name: "useDefaults",
          message: `Use the default stack (${STACK_DEFAULTS.app}/${STACK_DEFAULTS.api}/${STACK_DEFAULTS.db})?`,
          initial: true,
        });
        if (res.useDefaults === false) {
          const edited = await prompts(
            Object.keys(STACK_DEFAULTS).map((k) => ({
              type: "text" as const,
              name: k,
              message: k,
              initial: STACK_DEFAULTS[k],
            })),
          );
          stack = { ...STACK_DEFAULTS, ...edited };
        }
      }

      const dir = await scaffoldPlanning(
        root,
        { projectName, projectType: null, tags: [], stack },
        { force: opts.force },
      );
      const cfg = await loadConfig(root);
      console.log(`banx: initialized ${path.relative(root, dir) || ".planning"}`);
      console.log(`banx: provider=${cfg.tasks.provider} models=${cfg.models.mode} parallel=${cfg.execution.parallel}`);
    });

  return program;
}

export async function run(argv: string[]): Promise<void> {
  await buildProgram().parseAsync(argv);
}

// Executed via bin shim.
run(process.argv).catch((e) => {
  console.error(`banx: ${(e as Error).message}`);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Write `bin/banx.mjs`**

```js
#!/usr/bin/env node
import "../dist/cli/index.js";
```

- [ ] **Step 3: Build and smoke-test the CLI in a temp project**

Run:
```bash
pnpm build
mkdir -p /tmp/banx-smoke && cd /tmp/banx-smoke && node /Users/daniel/Sites/banx/bin/banx.mjs init --yes
ls -a .planning && cat .planning/config.json | head -5
cd - >/dev/null
```
Expected: `.planning/` created with `config.json`, `PROJECT.md`, `roadmap.md`, `log.md`, `claims.json`, `plans/`, `sessions/`; console prints `banx: initialized .planning` and a config summary line.

- [ ] **Step 4: Verify the overwrite guard**

Run: `cd /tmp/banx-smoke && node /Users/daniel/Sites/banx/bin/banx.mjs init && cd - >/dev/null`
Expected: exits non-zero with `banx: .planning already exists ...`.

- [ ] **Step 5: Commit**

```bash
git add src/cli/index.ts bin/banx.mjs
git commit -m "feat(cli): banx init with stack-default interview"
```

---

## Task 6: Plugin manifest + `/banx:status`

**Files:**
- Create: `.claude-plugin/plugin.json`, `commands/status.md`

- [ ] **Step 1: Write `.claude-plugin/plugin.json`**

```json
{
  "name": "banx",
  "version": "0.0.0",
  "description": "Config-driven agentic workflow harness",
  "commands": "./commands",
  "agents": "./agents",
  "skills": "./skills",
  "hooks": "./hooks/hooks.json"
}
```

- [ ] **Step 2: Create empty surface dirs so the manifest resolves**

Run: `mkdir -p agents skills hooks && printf '{ "hooks": {} }\n' > hooks/hooks.json && touch agents/.gitkeep skills/.gitkeep`
Expected: dirs exist; `hooks/hooks.json` is valid empty JSON.

- [ ] **Step 3: Write `commands/status.md`**

```markdown
---
description: Show the current project status from .planning/ (roadmap + log).
---

# /banx:status

Read and summarize the current project state. Do not modify anything.

## Steps

1. If `.planning/` does not exist, tell the user to run `banx init` and stop.
2. Read `.planning/roadmap.md` and report, per milestone: phases done (`[x]`), active (`[>]`), pending (`[ ]`), deferred (`[~]`), including any `@worktree` claim markers.
3. Read the last 5 lines of `.planning/log.md` and show recent progress (incl. token/cost notes if present).
4. Read `.planning/claims.json`; if any phase is claimed, list which instance/worktree holds it.
5. Output a compact summary: active milestone, current phase, next pending phase, open claims.

Keep it read-only and concise.
```

- [ ] **Step 4: Smoke-test plugin load in Claude Code**

Run (manual): install the local plugin and confirm `/banx:status` is listed.
```
/plugin marketplace add /Users/daniel/Sites/banx
/plugin install banx
```
Expected: `/banx:status` appears in the command list; running it in `/tmp/banx-smoke` reports the empty roadmap without errors.

- [ ] **Step 5: Commit**

```bash
git add .claude-plugin/plugin.json commands/status.md hooks/hooks.json agents/.gitkeep skills/.gitkeep
git commit -m "feat(plugin): manifest + /banx:status command"
```

---

## Task 7: README (install + usage)

**Files:**
- Create/replace: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# banx

Config-driven agentic workflow harness for Claude Code. Lightweight planning,
strong cross-session context handling, configurable verify pipeline and model
management. Project state lives in a committed `.planning/` directory.

## Install (Claude Code plugin)

```
/plugin marketplace add <repo-or-path>
/plugin install banx
```

## Initialize a project

```
npx banx init        # or: pnpm dlx banx init / bunx banx init
```

Creates `.planning/` with `config.json`, `PROJECT.md`, `roadmap.md`, `log.md`,
`claims.json`, `plans/`, `sessions/`.

## Status

```
/banx:status
```

## Configuration

Behavior is controlled by `.planning/config.json` (project) layered over
`~/.claude/banx/config.json` (global) over built-in defaults. See
`docs/specs/2026-06-12-banx-harness-core-design.md` for the full schema.
```

- [ ] **Step 2: Final verification**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: tests PASS, typecheck clean, lint clean.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README with install and usage"
```

---

## Self-Review

**Spec coverage (Plan 1 scope):**
- Plugin manifest + install → Task 6. ✅
- `.planning/` committed state model (config, PROJECT.md, roadmap, log, claims, plans/, sessions/) → Task 4, Task 6. ✅
- `config.json` schema + project/global layering → Task 2, Task 3. ✅
- `banx init` + stack interview with "use defaults" path → Task 5. ✅
- `/banx:status` → Task 6. ✅
- Out-of-scope-for-now (archetypes, core loop, verify, parallelism, providers, learn, notifications, rollback) → Plans 2–6. Documented in Plan Sequence. ✅

**Placeholder scan:** No "TBD"/"handle edge cases"; every code step has complete code. `agents/`, `skills/`, `hooks/` are intentionally empty shells in Plan 1 (filled in later plans) — created explicitly in Task 6 Step 2, not left implicit.

**Type consistency:** `BanxConfig` (Zod object) is reused identically in schema/load/scaffold tasks. `InitAnswers` shape (`projectName, projectType, tags, stack`) matches between `scaffold.ts` and `cli/index.ts`. `scaffoldPlanning(root, answers, opts?)` signature consistent across Task 4 and Task 5. `loadConfig(root, { globalPath? })` consistent across Task 3 and Task 5.

**Note for executor:** `tsdown`/`tsdown.config.ts` API and exact dep versions should be confirmed against the registry at execution time; if `tsdown` differs, `tsup` is a drop-in (`entry`, `format`, `dts`, `clean`). Lockfile is committed in Task 1.
