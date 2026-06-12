import { promises as fs } from "node:fs";
import path from "node:path";
import { CrewConfig } from "../config/schema.js";

export interface InitAnswers {
  projectName: string;
  projectType: string | null;
  tags: string[];
  stack: Record<string, string>;
  testingPolicy?: "from-archetype" | "tdd" | "tests-required" | "optional";
}

export function renderProjectMd(a: InitAnswers): string {
  const stackLines =
    Object.entries(a.stack)
      .map(([k, v]) => `- **${k}:** ${v}`)
      .join("\n") || "- (noch nicht festgelegt)";
  return `# ${a.projectName}

## Stack
${stackLines}

## Architektur-Entscheidungen
- (werden hier festgehalten — das Warum, nicht nur das Was)

## Aktueller Stand
- Projekt initialisiert. Nächster Schritt: \`/crew:brief\` oder \`/crew:plan\`.

## Constraints
- (immer geltende Leitplanken hier)
`;
}

export async function scaffoldPlanning(
  root: string,
  answers: InitAnswers,
  opts?: { force?: boolean },
): Promise<string> {
  const dir = path.join(root, ".planning");
  const exists = await fs
    .access(dir)
    .then(() => true)
    .catch(() => false);
  if (exists && !opts?.force) {
    throw new Error(
      `.planning already exists at ${dir} (use force to overwrite)`,
    );
  }

  await fs.mkdir(path.join(dir, "plans"), { recursive: true });
  await fs.mkdir(path.join(dir, "sessions"), { recursive: true });

  const config = CrewConfig.parse({
    projectType: answers.projectType,
    tags: answers.tags,
    stack: answers.stack,
    ...(answers.testingPolicy ? { testing: { policy: answers.testingPolicy } } : {}),
  });

  await fs.writeFile(
    path.join(dir, "config.json"),
    `${JSON.stringify(config, null, 2)}\n`,
  );
  await fs.writeFile(path.join(dir, "PROJECT.md"), renderProjectMd(answers));
  await fs.writeFile(
    path.join(dir, "roadmap.md"),
    "# Roadmap\n\n## Meilenstein 1\n- [ ] 1.1 (erste Phase definieren)\n",
  );
  await fs.writeFile(path.join(dir, "log.md"), "# Log\n");
  await fs.writeFile(path.join(dir, "claims.json"), "{}\n");
  await fs.writeFile(
    path.join(dir, "backlog.md"),
    "# Backlog\n\n_Ideen hier ablegen; Triage bei /crew:plan oder /crew:adjust._\n",
  );

  return dir;
}
