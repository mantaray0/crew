import { z } from "zod";

const Git = z
  .object({
    autoCommitPerPhase: z.boolean().default(true),
    autoPush: z.boolean().default(false),
    autoPR: z.boolean().default(false),
    commitStyle: z.enum(["conventional", "plain"]).default("conventional"),
    branchPattern: z.string().default("feat/{slug}"),
    isolation: z
      .enum(["worktree-per-feature", "branch-per-feature", "linear"])
      .default("worktree-per-feature"),
    mergeStrategy: z.enum(["integration-branch", "pr", "ask-each"]).default("integration-branch"),
    askBeforeMerge: z.boolean().default(false),
    conflictPolicy: z.enum(["resolve-or-ask", "always-ask", "autonomous"]).default("resolve-or-ask"),
  })
  .default({});

const Execution = z
  .object({
    parallel: z.enum(["auto", "manual", "off"]).default("auto"),
    maxConcurrent: z.number().int().positive().default(3),
    onDeviation: z
      .enum(["small-self-major-ask", "always-ask", "autonomous"])
      .default("small-self-major-ask"),
  })
  .default({});

const Verify = z
  .object({
    default: z
      .array(z.enum(["verify", "review", "harden", "simplify"]))
      .default(["verify", "review", "harden", "simplify"]),
    perPhaseOverride: z.boolean().default(true),
  })
  .default({});

const Models = z
  .object({
    mode: z.enum(["auto", "manual"]).default("auto"),
    planning: z.string().default("opus"),
    execution: z.string().default("sonnet"),
    review: z.string().default("opus"),
    simplify: z.string().default("sonnet"),
    trivial: z.string().default("haiku"),
  })
  .default({});

const Clarify = z
  .object({
    depth: z.enum(["light", "normal", "deep"]).default("normal"),
    askOnlyWhenStuck: z.boolean().default(true),
    specArtifact: z.enum(["section", "separate", "off"]).default("section"),
  })
  .default({});

const Tasks = z
  .object({
    provider: z.string().default("local"),
    writeBack: z.boolean().default(false),
    projectKey: z.string().nullable().default(null),
  })
  .default({});

const Notifications = z
  .object({
    enabled: z.boolean().default(true),
    events: z.array(z.enum(["blocker", "completion"])).default(["blocker", "completion"]),
    channel: z.enum(["os", "push:ntfy", "push:pushover", "off"]).default("os"),
  })
  .default({});

export const CrewConfig = z
  .object({
    git: Git,
    execution: Execution,
    verify: Verify,
    models: Models,
    clarify: Clarify,
    tasks: Tasks,
    testing: z
      .object({
        policy: z.enum(["from-archetype", "tdd", "tests-required", "optional"]).default("from-archetype"),
      })
      .default({}),
    security: z.object({ auto: z.boolean().default(false) }).default({}),
    notifications: Notifications,
    learn: z.object({ enabled: z.boolean().default(true) }).default({}),
    state: z.object({ commitSessions: z.boolean().default(true) }).default({}),
    loop: z.object({ maxIterations: z.number().int().positive().default(6) }).default({}),
    observability: z.object({ trackCost: z.boolean().default(true) }).default({}),
    projectType: z.string().nullable().default(null),
    tags: z.array(z.string()).default([]),
    stack: z.record(z.string(), z.string()).default({}),
  })
  .default({});

export type CrewConfig = z.infer<typeof CrewConfig>;
