#!/usr/bin/env node
// Keep the plugin + marketplace manifests in sync with package.json's version.
// Run automatically after `changeset version` (see package.json "version" script).
import { promises as fs } from "node:fs";

const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
const { version } = pkg;

async function patch(file, mutate) {
  const json = JSON.parse(await fs.readFile(file, "utf8"));
  mutate(json);
  await fs.writeFile(file, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`synced ${file} -> ${version}`);
}

await patch(".claude-plugin/plugin.json", (j) => {
  j.version = version;
});
await patch(".claude-plugin/marketplace.json", (j) => {
  for (const p of j.plugins ?? []) {
    if (p.name === "crew") p.version = version;
  }
});
