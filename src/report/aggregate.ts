export interface ReportTotals {
  phases: number;
  tokens: number;
  costUsd: number;
}

/** Aggregate token/cost from log.md lines like:
 * "2026-06-12 14:30 · M1.2 erledigt · commit abc1234 · Verify: pass · ~38k tok / $0.42"
 * - phases = number of lines containing a "~<n>k tok" entry
 * - tokens = sum of those (k → *1000)
 * - costUsd = sum of "$<x>" amounts on those lines */
export function aggregateLog(markdown: string): ReportTotals {
  const tokRe = /~(\d+(?:\.\d+)?)k tok/;
  const costRe = /\$(\d+(?:\.\d+)?)/;

  let phases = 0;
  let tokens = 0;
  let costUsd = 0;

  for (const line of markdown.split("\n")) {
    const tokMatch = tokRe.exec(line);
    if (!tokMatch) continue;

    phases += 1;
    tokens += Math.round(Number(tokMatch[1]) * 1000);

    const costMatch = costRe.exec(line);
    if (costMatch) {
      costUsd += Number(costMatch[1]);
    }
  }

  return { phases, tokens, costUsd };
}
