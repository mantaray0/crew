import { type Registry, Registry as RegistrySchema } from "./schema.js";

// Built-in starter registry seeded with Daniel's default stack.
// Tag skills/rules reference modules later plans create; references are fine.
const raw = {
  tags: [
    { name: "nextjs", description: "Next.js app", skills: ["nextjs", "react-patterns"], rules: ["react"] },
    { name: "hono", description: "Hono API", skills: ["hono-api"], rules: ["api"] },
    { name: "drizzle", description: "Drizzle ORM", skills: ["drizzle-postgres"], rules: ["database"] },
    { name: "postgres", description: "PostgreSQL", skills: ["drizzle-postgres"], rules: ["database"] },
    { name: "tailwind", description: "Tailwind CSS", skills: ["tailwind"], rules: [] },
    { name: "shadcn-baseui", description: "shadcn + Base UI", skills: ["shadcn-baseui"], rules: [] },
    { name: "tanstack", description: "TanStack Query/Form/Table", skills: ["tanstack-query", "tanstack-form", "tanstack-table"], rules: [] },
    { name: "bullmq-redis", description: "BullMQ + Redis", skills: ["bullmq-redis"], rules: [] },
    { name: "bun", description: "Bun runtime/scripts", skills: ["bun-scripts"], rules: [] },
    { name: "auth", description: "Authentication", skills: [], rules: ["security"] },
    { name: "payments", description: "Payments/billing", skills: [], rules: ["security"] },
    { name: "realtime", description: "Realtime features", skills: [], rules: [] },
  ],
  archetypes: [
    {
      name: "saas-app",
      description: "Full-stack SaaS app (Next.js + Drizzle + Postgres)",
      tags: ["nextjs", "drizzle", "postgres", "tailwind", "shadcn-baseui", "tanstack", "auth"],
      stack: { language: "TypeScript", app: "Next.js", db: "Postgres", orm: "Drizzle", ui: "shadcn + Base UI", styling: "Tailwind CSS" },
      defaults: { testing: "tests-required" },
    },
    {
      name: "api-service",
      description: "Hono API service on Bun",
      tags: ["hono", "drizzle", "postgres", "bun"],
      stack: { language: "TypeScript", api: "Hono", runtime: "Bun", db: "Postgres", orm: "Drizzle" },
      defaults: { testing: "tdd" },
    },
    {
      name: "cli",
      description: "TypeScript CLI on Bun",
      tags: ["bun"],
      stack: { language: "TypeScript", runtime: "Bun" },
      defaults: { testing: "tests-required" },
    },
    {
      name: "marketing-site",
      description: "Marketing / content site",
      tags: ["nextjs", "tailwind"],
      stack: { language: "TypeScript", app: "Next.js", styling: "Tailwind CSS" },
      defaults: { testing: "optional" },
    },
  ],
};

export const STARTER_REGISTRY: Registry = RegistrySchema.parse(raw);
