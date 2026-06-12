import { promises as fs } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import prompts from "prompts";
import { loadConfig } from "../config/load.js";
import { scaffoldPlanning } from "../planning/scaffold.js";
import {
  GLOBAL_REGISTRY_PATH,
  loadRegistry,
  resolveArchetype,
  writeStarterRegistry,
} from "../registry/load.js";

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
  program
    .name("crew")
    .description("Config-driven agentic workflow harness")
    .version("0.0.0");

  program
    .command("init")
    .description("Initialize .planning/ in the current project")
    .option("-f, --force", "overwrite an existing .planning/")
    .option("-y, --yes", "accept stack defaults without prompting")
    .action(async (opts: { force?: boolean; yes?: boolean }) => {
      const root = process.cwd();
      const projectName = path.basename(root);

      if (!opts.force) {
        const planningDir = path.join(root, ".planning");
        const exists = await fs
          .access(planningDir)
          .then(() => true)
          .catch(() => false);
        if (exists) {
          process.stderr.write(
            `crew: .planning already exists at ${planningDir} (use --force to overwrite)\n`,
          );
          process.exitCode = 1;
          return;
        }
      }

      const registry = await loadRegistry();
      let projectType: string | null = null;
      let tags: string[] = [];
      let stack = { ...STACK_DEFAULTS };
      let testingPolicy:
        | "from-archetype"
        | "tdd"
        | "tests-required"
        | "optional"
        | undefined;

      if (!opts.yes && registry.archetypes.length > 0) {
        const pick = await prompts({
          type: "select",
          name: "archetype",
          message: "Project type?",
          choices: [
            ...registry.archetypes.map((a) => ({
              title: a.name,
              description: a.description,
              value: a.name,
            })),
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
      console.log(
        `crew: initialized ${path.relative(root, dir) || ".planning"}`,
      );
      console.log(
        `crew: type=${projectType ?? "none"} tags=[${tags.join(",")}] provider=${cfg.tasks.provider} models=${cfg.models.mode}`,
      );
    });

  program
    .command("setup")
    .description(
      "Write the starter project-type/tag registry to ~/.claude/crew/",
    )
    .option("-f, --force", "overwrite an existing registry")
    .action(async (opts: { force?: boolean }) => {
      const exists = await fs
        .access(GLOBAL_REGISTRY_PATH)
        .then(() => true)
        .catch(() => false);
      if (exists && !opts.force) {
        console.error(
          `crew: registry already exists at ${GLOBAL_REGISTRY_PATH} (use --force to overwrite)`,
        );
        process.exitCode = 1;
        return;
      }
      const written = await writeStarterRegistry();
      console.log(`crew: wrote starter registry to ${written}`);
    });

  return program;
}

export async function run(argv: string[]): Promise<void> {
  await buildProgram().parseAsync(argv);
}

// Executed via bin shim.
run(process.argv).catch((e) => {
  console.error(`crew: ${(e as Error).message}`);
  process.exitCode = 1;
});
