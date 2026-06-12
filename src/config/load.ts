import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { CrewConfig } from "./schema.js";

export const GLOBAL_CONFIG_PATH = path.join(os.homedir(), ".claude", "crew", "config.json");

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
): Promise<CrewConfig> {
  const globalRaw = await readJsonIfExists(opts?.globalPath ?? GLOBAL_CONFIG_PATH);
  const projectRaw = await readJsonIfExists(projectConfigPath(root));
  const merged = deepMerge(globalRaw, projectRaw);
  return CrewConfig.parse(merged);
}
