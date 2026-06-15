#!/usr/bin/env node
// Notification hook: best-effort desktop/push notification, gated by .planning config.
// Usage: node notify.mjs <event>   where <event> is "blocker" or "completion".
// Never throws — a notification failure must not break the session.
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const event = process.argv[2] ?? "completion";

// Built-in defaults — the bottom layer (always concrete, never "inherit").
// Mirror of crew-config's defaults for notifications.*.
const DEFAULTS = { enabled: true, events: ["blocker", "completion"], channel: "os" };

async function readJson(p) {
  try {
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch {
    return null;
  }
}

// Resolve one notifications leaf per the canonical read-side contract (crew-config):
// a value of "inherit" — or a missing key — falls through to the layer below
// (project → global → built-in default). No reader ever yields "inherit".
function resolveLeaf(key, projectN, globalN) {
  const isInherited = (v) => v === undefined || v === "inherit";
  if (!isInherited(projectN[key])) return projectN[key];
  if (!isInherited(globalN[key])) return globalN[key];
  return DEFAULTS[key];
}

function titleFor(ev) {
  return ev === "blocker" ? "crew · needs you" : "crew · run complete";
}

async function main() {
  const root = process.cwd();
  const projectCfg = await readJson(path.join(root, ".planning", "config.json"));
  const globalCfg = await readJson(
    path.join(os.homedir(), ".claude", "crew", "config.json"),
  );
  const projectN = projectCfg?.notifications ?? {};
  const globalN = globalCfg?.notifications ?? {};

  // Fully resolved notifications — every field concrete, never "inherit".
  const n = {
    enabled: resolveLeaf("enabled", projectN, globalN),
    events: resolveLeaf("events", projectN, globalN),
    channel: resolveLeaf("channel", projectN, globalN),
  };
  if (n.enabled === false || n.channel === "off") return;
  if (Array.isArray(n.events) && !n.events.includes(event)) return;

  const message = titleFor(event);
  if (n.channel === "os") {
    if (process.platform === "darwin") {
      execFile(
        "osascript",
        ["-e", `display notification "${message}" with title "crew"`],
        () => {},
      );
    } else if (process.platform === "linux") {
      execFile("notify-send", ["crew", message], () => {});
    }
    return;
  }
  if (n.channel === "push:ntfy" && process.env.CREW_NTFY_TOPIC) {
    execFile(
      "curl",
      ["-fsS", "-d", message, `https://ntfy.sh/${process.env.CREW_NTFY_TOPIC}`],
      () => {},
    );
  }
  // push:pushover and other channels: configured by the user's own integration; no-op here.
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
