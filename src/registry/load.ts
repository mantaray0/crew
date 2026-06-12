import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { type Registry, Registry as RegistrySchema } from "./schema.js";
import { STARTER_REGISTRY } from "./starter.js";

export const GLOBAL_REGISTRY_PATH = path.join(
  os.homedir(),
  ".claude",
  "crew",
  "project-types.json",
);

export async function loadRegistry(opts?: {
  path?: string;
}): Promise<Registry> {
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

export function resolveArchetype(
  reg: Registry,
  name: string,
): ResolvedArchetype | null {
  const a = reg.archetypes.find((x) => x.name === name);
  if (!a) return null;
  return { tags: a.tags, stack: a.stack, testing: a.defaults.testing };
}

export async function writeStarterRegistry(
  targetPath?: string,
): Promise<string> {
  const target = targetPath ?? GLOBAL_REGISTRY_PATH;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(STARTER_REGISTRY, null, 2)}\n`);
  return target;
}
