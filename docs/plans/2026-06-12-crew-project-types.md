# crew Project Types & Setup — Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add a global, user-curatable registry of **project types (archetypes)** and **tags**, a `crew setup` command that writes a starter registry, and enhance `crew init` to let the user pick an archetype that seeds the project's tags/stack/test-policy.

**Architecture:** A new `src/registry/` module (Zod schema + a built-in starter registry + loader/resolver). The CLI gains a `setup` command and the `init` command gains archetype selection. `scaffoldPlanning` is extended (backward-compatibly) to accept seeded tags/stack/test-policy. Tags reference skill/rule names that later plans will create — references are fine now.

**Tech Stack:** TypeScript, Zod, Commander, prompts, Vitest. Builds on Plan 1 (merged to `main`).

---

## File Structure (Plan 2)

| File | Responsibility |
|---|---|
| `src/registry/schema.ts` | Zod schemas: `Tag`, `Archetype`, `Registry` |
| `src/registry/starter.ts` | Built-in `STARTER_REGISTRY` (Daniel's stack archetypes/tags) |
| `src/registry/load.ts` | `loadRegistry`, `resolveArchetype`, `writeStarterRegistry` |
| `src/cli/index.ts` (modify) | add `setup` command; `init` archetype selection + seeding |
| `src/planning/scaffold.ts` (modify) | accept optional `testingPolicy` to seed `config.testing.policy` |
| `src/index.ts` (modify) | re-export registry surface |
| `tests/registry/schema.test.ts` | schema defaults/validation |
| `tests/registry/load.test.ts` | load (file + fallback), resolveArchetype, writeStarterRegistry |
| `tests/planning/scaffold.test.ts` (modify) | assert testingPolicy seeds config |

---

## Task 1: Registry schema

**Files:** Create `src/registry/schema.ts`, `tests/registry/schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/registry/schema.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/registry/schema.test.ts`
Expected: FAIL — cannot find module `../../src/registry/schema.js`.

- [ ] **Step 3: Write `src/registry/schema.ts`**

```ts
import { z } from "zod";

export const Tag = z.object({
  name: z.string(),
  description: z.string().default(""),
  skills: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
});
export type Tag = z.infer<typeof Tag>;

export const Archetype = z.object({
  name: z.string(),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  stack: z.record(z.string(), z.string()).default({}),
  defaults: z
    .object({
      testing: z
        .enum(["from-archetype", "tdd", "tests-required", "optional"])
        .default("tests-required"),
    })
    .default({}),
});
export type Archetype = z.infer<typeof Archetype>;

export const Registry = z.object({
  tags: z.array(Tag).default([]),
  archetypes: z.array(Archetype).default([]),
});
export type Registry = z.infer<typeof Registry>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/registry/schema.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/registry/schema.ts tests/registry/schema.test.ts
git commit -m "feat(registry): zod schema for tags and archetypes"
```

---

## Task 2: Starter registry

**Files:** Create `src/registry/starter.ts`

- [ ] **Step 1: Write `src/registry/starter.ts`**

```ts
import { type Registry, Registry as RegistrySchema } from "./schema.js";

// Built-in starter registry seeded with Daniel's default stack.
// Tag skills/rules reference modules later plans create; references are fine.
const raw = {
  tags: [
    { name: "nextjs", description: "Next.js app", skills: ["nextjs", "react-patterns"], rules: ["react"] },
    { name: "hono", description: "Hono API", skills: ["hono-api"], rules: ["api"] },
    { name: "drizzle", description: "Drizzle ORM", skills: ["drizzle-postgres"], rules: ["database"] },
    { name: "postgres", description: "PostgreSQL", skills: ["drizzle-postgres"], rules: ["database"] },
    { name: "tailwind", description: "Tailwind CSS", skills: ["tailwind"], rules: [] },
    { name: "shadcn-baseui", description: "shadcn + Base UI", skills: ["shadcn-baseui"], rules: [] },
    { name: "tanstack", description: "TanStack Query/Form/Table", skills: ["tanstack-query", "tanstack-form", "tanstack-table"], rules: [] },
    { name: "bullmq-redis", description: "BullMQ + Redis", skills: ["bullmq-redis"], rules: [] },
    { name: "bun", description: "Bun runtime/scripts", skills: ["bun-scripts"], rules: [] },
    { name: "auth", description: "Authentication", skills: [], rules: ["security"] },
    { name: "payments", description: "Payments/billing", skills: [], rules: ["security"] },
    { name: "realtime", description: "Realtime features", skills: [], rules: [] },
  ],
  archetypes: [
    {
      name: "saas-app",
      description: "Full-stack SaaS app (Next.js + Drizzle + Postgres)",
      tags: ["nextjs", "drizzle", "postgres", "tailwind", "shadcn-baseui", "tanstack", "auth"],
      stack: { language: "TypeScript", app: "Next.js", db: "Postgres", orm: "Drizzle", ui: "shadcn + Base UI", styling: "Tailwind CSS" },
      defaults: { testing: "tests-required" },
    },
    {
      name: "api-service",
      description: "Hono API service on Bun",
      tags: ["hono", "drizzle", "postgres", "bun"],
      stack: { language: "TypeScript", api: "Hono", runtime: "Bun", db: "Postgres", orm: "Drizzle" },
      defaults: { testing: "tdd" },
    },
    {
      name: "cli",
      description: "TypeScript CLI on Bun",
      tags: ["bun"],
      stack: { language: "TypeScript", runtime: "Bun" },
      defaults: { testing: "tests-required" },
    },
    {
      name: "marketing-site",
      description: "Marketing / content site",
      tags: ["nextjs", "tailwind"],
      stack: { language: "TypeScript", app: "Next.js", styling: "Tailwind CSS" },
      defaults: { testing: "optional" },
    },
  ],
};

export const STARTER_REGISTRY: Registry = RegistrySchema.parse(raw);
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: clean (the parse validates the literal at module load; if a field is wrong, tsc/zod-types surface it).

- [ ] **Step 3: Commit**

```bash
git add src/registry/starter.ts
git commit -m "feat(registry): built-in starter registry for default stack"
```

---

## Task 3: Registry loader & resolver

**Files:** Create `src/registry/load.ts`, `tests/registry/load.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/registry/load.test.ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadRegistry, resolveArchetype, writeStarterRegistry } from "../../src/registry/load.js";
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
    await fs.writeFile(p, JSON.stringify({ archetypes: [{ name: "custom", tags: ["x"] }] }));
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/registry/load.test.ts`
Expected: FAIL — cannot find module `../../src/registry/load.js`.

- [ ] **Step 3: Write `src/registry/load.ts`**

```ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { type Registry, Registry as RegistrySchema } from "./schema.js";
import { STARTER_REGISTRY } from "./starter.js";

export const GLOBAL_REGISTRY_PATH = path.join(os.homedir(), ".claude", "crew", "project-types.json");

export async function loadRegistry(opts?: { path?: string }): Promise<Registry> {
  const p = opts?.path ?? GLOBAL_REGISTRY_PATH;
  try {
    return RegistrySchema.parse(JSON.parse(await fs.readFile(p, "utf8")));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return STARTER_REGISTRY;
    throw e;
  }
}

export interface ResolvedArchetype {
  tags: string[];
  stack: Record<string, string>;
  testing: "from-archetype" | "tdd" | "tests-required" | "optional";
}

export function resolveArchetype(reg: Registry, name: string): ResolvedArchetype | null {
  const a = reg.archetypes.find((x) => x.name === name);
  if (!a) return null;
  return { tags: a.tags, stack: a.stack, testing: a.defaults.testing };
}

export async function writeStarterRegistry(targetPath?: string): Promise<string> {
  const target = targetPath ?? GLOBAL_REGISTRY_PATH;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(STARTER_REGISTRY, null, 2)}\n`);
  return target;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/registry/load.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/registry/load.ts tests/registry/load.test.ts
git commit -m "feat(registry): loader, resolver, starter writer"
```

---

## Task 4: Seed test-policy through the scaffolder

**Files:** Modify `src/planning/scaffold.ts`, `tests/planning/scaffold.test.ts`

- [ ] **Step 1: Add a failing test (append to the existing describe block)**

Add this `it(...)` inside the existing `describe("scaffoldPlanning", ...)` in `tests/planning/scaffold.test.ts`:

```ts
  it("seeds config.testing.policy from answers when provided", async () => {
    const dir = await scaffoldPlanning(root, { ...answers, testingPolicy: "tdd" });
    const cfg = CrewConfig.parse(JSON.parse(await fs.readFile(path.join(dir, "config.json"), "utf8")));
    expect(cfg.testing.policy).toBe("tdd");
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/planning/scaffold.test.ts`
Expected: FAIL — `testingPolicy` is not accepted / `config.testing.policy` is default `from-archetype`, not `tdd`.

- [ ] **Step 3: Extend `InitAnswers` and the config build in `src/planning/scaffold.ts`**

In the `InitAnswers` interface, add an optional field:

```ts
export interface InitAnswers {
  projectName: string;
  projectType: string | null;
  tags: string[];
  stack: Record<string, string>;
  testingPolicy?: "from-archetype" | "tdd" | "tests-required" | "optional";
}
```

In `scaffoldPlanning`, change the `CrewConfig.parse({...})` call to seed testing when provided:

```ts
  const config = CrewConfig.parse({
    projectType: answers.projectType,
    tags: answers.tags,
    stack: answers.stack,
    ...(answers.testingPolicy ? { testing: { policy: answers.testingPolicy } } : {}),
  });
```

- [ ] **Step 4: Run to verify it passes (and the rest still pass)**

Run: `pnpm vitest run tests/planning/scaffold.test.ts`
Expected: PASS (3 tests — the new one plus the 2 existing).

- [ ] **Step 5: Commit**

```bash
git add src/planning/scaffold.ts tests/planning/scaffold.test.ts
git commit -m "feat(planning): seed config.testing.policy from archetype"
```

---

## Task 5: CLI `setup` + archetype selection in `init`

**Files:** Modify `src/cli/index.ts`, `src/index.ts`

- [ ] **Step 1: Add the registry re-export to `src/index.ts`**

Append:

```ts
export { loadRegistry, resolveArchetype, writeStarterRegistry } from "./registry/load.js";
export { STARTER_REGISTRY } from "./registry/starter.js";
export { Registry, Archetype, Tag } from "./registry/schema.js";
```

- [ ] **Step 2: Add a `setup` command and archetype selection to `init` in `src/cli/index.ts`**

Add these imports at the top (alongside existing imports):

```ts
import { GLOBAL_REGISTRY_PATH, loadRegistry, resolveArchetype, writeStarterRegistry } from "../registry/load.js";
```

Add the `setup` command (register it on `program` before `return program;`):

```ts
  program
    .command("setup")
    .description("Write the starter project-type/tag registry to ~/.claude/crew/")
    .option("-f, --force", "overwrite an existing registry")
    .action(async (opts: { force?: boolean }) => {
      const exists = await fs
        .access(GLOBAL_REGISTRY_PATH)
        .then(() => true)
        .catch(() => false);
      if (exists && !opts.force) {
        console.error(`crew: registry already exists at ${GLOBAL_REGISTRY_PATH} (use --force to overwrite)`);
        process.exitCode = 1;
        return;
      }
      const written = await writeStarterRegistry();
      console.log(`crew: wrote starter registry to ${written}`);
    });
```

In the `init` action, AFTER the fail-fast `.planning` existence guard and BEFORE the stack interview, insert archetype selection that seeds tags/stack/testing. Replace the existing stack-seeding block so it reads:

```ts
      const registry = await loadRegistry();
      let projectType: string | null = null;
      let tags: string[] = [];
      let stack = { ...STACK_DEFAULTS };
      let testingPolicy: "from-archetype" | "tdd" | "tests-required" | "optional" | undefined;

      if (!opts.yes && registry.archetypes.length > 0) {
        const pick = await prompts({
          type: "select",
          name: "archetype",
          message: "Project type?",
          choices: [
            ...registry.archetypes.map((a) => ({ title: a.name, description: a.description, value: a.name })),
            { title: "(none / decide later)", value: "__none__" },
          ],
        });
        if (pick.archetype && pick.archetype !== "__none__") {
          const resolved = resolveArchetype(registry, pick.archetype);
          if (resolved) {
            projectType = pick.archetype;
            tags = resolved.tags;
            stack = { ...STACK_DEFAULTS, ...resolved.stack };
            testingPolicy = resolved.testing;
          }
        }
      }

      if (!opts.yes) {
        const res = await prompts({
          type: "confirm",
          name: "useDefaults",
          message: `Use this stack (${stack.app ?? stack.api ?? "?"} / ${stack.db ?? "?"})?`,
          initial: true,
        });
        if (res.useDefaults === false) {
          const edited = await prompts(
            Object.keys(stack).map((k) => ({
              type: "text" as const,
              name: k,
              message: k,
              initial: stack[k],
            })),
          );
          stack = { ...stack, ...edited };
        }
      }

      const dir = await scaffoldPlanning(
        root,
        { projectName, projectType, tags, stack, testingPolicy },
        { force: opts.force },
      );
      const cfg = await loadConfig(root);
      console.log(`crew: initialized ${path.relative(root, dir) || ".planning"}`);
      console.log(
        `crew: type=${projectType ?? "none"} tags=[${tags.join(",")}] provider=${cfg.tasks.provider} models=${cfg.models.mode}`,
      );
```

Remove the old `let stack = { ...STACK_DEFAULTS }; if (!opts.yes) {... confirm ...}` block and the old `scaffoldPlanning(...)`/summary lines that this replaces (do not leave duplicates). Keep the fail-fast `.planning` guard and the `STACK_DEFAULTS` constant.

- [ ] **Step 3: Build and smoke-test**

Run:
```bash
pnpm build
# setup writes registry (use a temp HOME to avoid touching the real one)
TMPHOME=$(mktemp -d); HOME="$TMPHOME" node /Users/daniel/Sites/crew/bin/crew.mjs setup && ls "$TMPHOME/.claude/crew"
# init with --yes still works (no prompts, defaults)
mkdir -p /tmp/crew-p2 && cd /tmp/crew-p2 && HOME="$TMPHOME" node /Users/daniel/Sites/crew/bin/crew.mjs init --yes && cat .planning/config.json | grep -E 'projectType|policy' ; cd - >/dev/null
rm -rf /tmp/crew-p2 "$TMPHOME"
```
Expected: `setup` writes `project-types.json`; `init --yes` creates `.planning` and prints the type/tags summary (type=none with `--yes`, since selection is interactive).

- [ ] **Step 4: Full verification**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all tests pass (schema 3, load 3, scaffold 3, registry-schema 3, registry-load 4 = 16), typecheck clean, lint clean (run `pnpm format` if lint flags wrapping).

- [ ] **Step 5: Commit**

```bash
git add src/cli/index.ts src/index.ts
git commit -m "feat(cli): crew setup + archetype selection in init"
```

---

## Self-Review

**Spec coverage (spec §5.1):** global registry of archetypes (curated tag bundles) + atomic tags → Tasks 1–3. `crew setup` writes the registry → Task 5. `crew init` selects an archetype and seeds tags/stack/test-policy → Tasks 4–5. Tag→skills/rules mapping carried on each tag → Task 1/2 (consumed by later plans). ✅

**Placeholder scan:** complete code in every step; tag `skills`/`rules` names intentionally reference modules built in later plans (documented).

**Type consistency:** `Registry`/`Archetype`/`Tag` reused identically; `resolveArchetype` returns `{tags, stack, testing}` consumed by `init`; `InitAnswers.testingPolicy` union matches `config.testing.policy` enum and `ResolvedArchetype.testing`.
