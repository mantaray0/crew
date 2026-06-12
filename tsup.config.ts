import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli/index.ts", "src/planning/context.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
});
