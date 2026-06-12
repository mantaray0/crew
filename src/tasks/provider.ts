import { promises as fs } from "node:fs";
import path from "node:path";

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: "open" | "active" | "done" | "deferred";
  externalRef?: string;
}

const MARKER_STATUS: Record<string, WorkItem["status"]> = {
  " ": "open",
  ">": "active",
  x: "done",
  "~": "deferred",
};

/** Read .planning/roadmap.md and return one WorkItem per phase line.
 * Phase line: "- [<marker>] <id> <title...>". id = first token after marker; title = the rest
 * with any "(depends: …)" clause stripped and trimmed. description/acceptanceCriteria empty for local. */
export async function localList(root: string): Promise<WorkItem[]> {
  const file = path.join(root, ".planning", "roadmap.md");
  let content: string;
  try {
    content = await fs.readFile(file, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }

  const lineRe = /^\s*-\s*\[([ x>~])\]\s+(\S+)\s*(.*)/;
  const items: WorkItem[] = [];

  for (const line of content.split("\n")) {
    const m = lineRe.exec(line);
    if (!m) continue;

    const marker = m[1];
    const id = m[2];
    const rawTitle = m[3].replace(/\(depends:[^)]*\)/g, "").trim();

    items.push({
      id,
      title: rawTitle,
      description: "",
      acceptanceCriteria: [],
      status: MARKER_STATUS[marker],
    });
  }

  return items;
}

/** Returns the provider's lister for a provider name. Only "local" is implemented now;
 * other names (mcp:linear, mcp:jira, mcp:clickup, crew-pm) throw Error("provider not available: <name>"). */
export function getProvider(name: string): {
  list: (root: string) => Promise<WorkItem[]>;
} {
  if (name === "local") {
    return { list: localList };
  }
  throw new Error(`provider not available: ${name}`);
}
