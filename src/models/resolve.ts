import type { CrewConfig } from "../config/schema.js";

export type TaskType =
  | "planning"
  | "execution"
  | "review"
  | "simplify"
  | "trivial";

// auto-mode tiers: planning/review -> strong, execution/simplify -> mid, trivial -> cheap
const AUTO: Record<TaskType, string> = {
  planning: "opus",
  review: "opus",
  execution: "sonnet",
  simplify: "sonnet",
  trivial: "haiku",
};

/**
 * Resolve the model id for a task-type.
 * Precedence: explicit override > manual-mode config map > auto-mode tier.
 */
export function resolveModel(
  config: CrewConfig,
  taskType: TaskType,
  override?: string,
): string {
  if (override) return override;
  if (config.models.mode === "manual") return config.models[taskType];
  return AUTO[taskType];
}
