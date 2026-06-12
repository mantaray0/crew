import { z } from "zod";

export const Tag = z.object({
  name: z.string(),
  description: z.string().default(""),
  skills: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
});
export type Tag = z.infer<typeof Tag>;

export const Archetype = z.object({
  name: z.string(),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  stack: z.record(z.string(), z.string()).default({}),
  defaults: z
    .object({
      testing: z
        .enum(["from-archetype", "tdd", "tests-required", "optional"])
        .default("tests-required"),
    })
    .default({}),
});
export type Archetype = z.infer<typeof Archetype>;

export const Registry = z.object({
  tags: z.array(Tag).default([]),
  archetypes: z.array(Archetype).default([]),
});
export type Registry = z.infer<typeof Registry>;
