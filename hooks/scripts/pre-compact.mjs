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
process.stdout.write(
  `crew: wrote snapshot scaffold ${path.relative(root, file)}\n`,
);
process.exit(0);
