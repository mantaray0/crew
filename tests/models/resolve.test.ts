import { describe, expect, it } from "vitest";
import { CrewConfig } from "../../src/config/schema.js";
import { resolveModel } from "../../src/models/resolve.js";

describe("resolveModel", () => {
  describe("auto mode (default)", () => {
    it("maps planning to opus", () => {
      expect(resolveModel(CrewConfig.parse({}), "planning")).toBe("opus");
    });

    it("maps execution to sonnet", () => {
      expect(resolveModel(CrewConfig.parse({}), "execution")).toBe("sonnet");
    });

    it("maps trivial to haiku", () => {
      expect(resolveModel(CrewConfig.parse({}), "trivial")).toBe("haiku");
    });
  });

  describe("manual mode", () => {
    it("returns the configured per-type model", () => {
      const cfg = CrewConfig.parse({
        models: { mode: "manual", planning: "opus", execution: "haiku" },
      });
      expect(resolveModel(cfg, "execution")).toBe("haiku");
    });
  });

  describe("override", () => {
    it("wins over auto mode", () => {
      expect(resolveModel(CrewConfig.parse({}), "review", "sonnet")).toBe(
        "sonnet",
      );
    });
  });

  describe("auto mode ignores per-type config fields", () => {
    it("returns auto tier even when per-type field differs", () => {
      const cfg = CrewConfig.parse({
        models: { mode: "auto", review: "haiku" },
      });
      expect(resolveModel(cfg, "review")).toBe("opus");
    });
  });
});
