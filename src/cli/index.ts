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
  program.name("crew").description("Config-driven agentic workflow harness").version("0.0.0");

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
      console.log(`crew: initialized ${path.relative(root, dir) || ".planning"}`);
      console.log(`crew: provider=${cfg.tasks.provider} models=${cfg.models.mode} parallel=${cfg.execution.parallel}`);
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
