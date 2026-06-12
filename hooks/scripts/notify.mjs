#!/usr/bin/env node
// Notification hook: best-effort desktop/push notification, gated by .planning config.
// Usage: node notify.mjs <event>   where <event> is "blocker" or "completion".
// Never throws — a notification failure must not break the session.
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const event = process.argv[2] ?? "completion";

async function readConfig(root) {
  try {
    return JSON.parse(
      await fs.readFile(path.join(root, ".planning", "config.json"), "utf8"),
    );
  } catch {
    return null;
  }
}

function titleFor(ev) {
  return ev === "blocker" ? "crew · needs you" : "crew · run complete";
}

async function main() {
  const root = process.cwd();
  const cfg = await readConfig(root);
  const n = cfg?.notifications;
  if (!n || n.enabled === false || n.channel === "off") return;
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
