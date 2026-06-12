import { promises as fs } from "node:fs";
import path from "node:path";

export interface Claims {
  [phaseId: string]: string;
}

function claimsPath(root: string): string {
  return path.join(root, ".planning", "claims.json");
}

export async function readClaims(root: string): Promise<Claims> {
  try {
    const raw = await fs.readFile(claimsPath(root), "utf8");
    return JSON.parse(raw) as Claims;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw err;
  }
}

export async function claimPhase(
  root: string,
  phaseId: string,
  owner: string,
): Promise<{ ok: boolean; owner: string }> {
  const claims = await readClaims(root);

  const existing = claims[phaseId];
  if (existing !== undefined && existing !== owner) {
    return { ok: false, owner: existing };
  }

  claims[phaseId] = owner;

  const filePath = claimsPath(root);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(claims, null, 2)}\n`, "utf8");

  return { ok: true, owner };
}

export async function releasePhase(
  root: string,
  phaseId: string,
): Promise<void> {
  const claims = await readClaims(root);
  delete claims[phaseId];

  const filePath = claimsPath(root);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(claims, null, 2)}\n`, "utf8");
}
