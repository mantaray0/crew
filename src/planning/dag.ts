export interface Phase {
  id: string;
  deps: string[];
  done?: boolean;
}

/** Parse roadmap.md phase lines: "- [x] 1.2 Title (depends: 1.1, 1.0)".
 * id = first whitespace token after the status marker. done = marker is "x".
 * deps from an optional "(depends: a, b)" clause. Lines without a "- [ ] / [x] / [>] / [~]" marker are ignored. */
export function parseRoadmap(markdown: string): Phase[] {
  const lineRe = /^\s*-\s*\[([ x>~])\]\s+(\S+)(.*)/;
  const depsRe = /\(depends:\s*([^)]*)\)/;
  const phases: Phase[] = [];

  for (const line of markdown.split("\n")) {
    const m = lineRe.exec(line);
    if (!m) continue;

    const marker = m[1];
    const id = m[2];
    const rest = m[3];

    const done = marker === "x";

    let deps: string[] = [];
    const dm = depsRe.exec(rest);
    if (dm) {
      deps = dm[1]
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    phases.push({ id, deps, done });
  }

  return phases;
}

/** Topological waves: each wave is a list of phase ids whose deps are all in earlier waves.
 * Throws Error("cycle detected") on a dependency cycle. Ignores deps that reference unknown ids. */
export function topoWaves(phases: Phase[]): string[][] {
  const knownIds = new Set(phases.map((p) => p.id));
  const placed = new Set<string>();
  const waves: string[][] = [];

  const remaining = [...phases];

  while (remaining.length > 0) {
    const wave: string[] = [];

    for (const phase of remaining) {
      const knownDeps = phase.deps.filter((d) => knownIds.has(d));
      if (knownDeps.every((d) => placed.has(d))) {
        wave.push(phase.id);
      }
    }

    if (wave.length === 0) {
      throw new Error("cycle detected");
    }

    for (const id of wave) {
      placed.add(id);
      const idx = remaining.findIndex((p) => p.id === id);
      remaining.splice(idx, 1);
    }

    waves.push(wave);
  }

  return waves;
}

/** Phase ids that are not done and whose deps are all done (in the given done set or marked done). */
export function readyPhases(
  phases: Phase[],
  done: Set<string> = new Set(),
): string[] {
  const doneById = new Map<string, boolean>();
  for (const p of phases) {
    doneById.set(p.id, p.done === true || done.has(p.id));
  }

  const ready: string[] = [];

  for (const phase of phases) {
    if (phase.done === true || done.has(phase.id)) continue;

    const knownDeps = phase.deps.filter((d) => doneById.has(d));
    const allDepsDone = knownDeps.every((d) => doneById.get(d) === true);

    if (allDepsDone) {
      ready.push(phase.id);
    }
  }

  return ready;
}
