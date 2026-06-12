import { promises as fs } from "node:fs";
import path from "node:path";

const planningDir = (root: string) => path.join(root, ".planning");

/** Read .planning/PROJECT.md, bounded to maxChars. Returns null if absent. */
export async function readProjectContext(
  root: string,
  maxChars: number,
): Promise<string | null> {
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
      for (const f of await fs.readdir(subPath))
        files.push(path.join(subPath, f));
    } else if (stat.isFile()) {
      files.push(subPath);
    }
  }
  if (files.length === 0) return null;
  files.sort((a, b) => (path.basename(a) < path.basename(b) ? -1 : 1));
  return files[files.length - 1];
}
