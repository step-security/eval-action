import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/index.ts"],
    format: "esm",
    outDir: "dist",
    target: "node24",
    minify: true,
    sourcemap: true,
    fixedExtension: false,
    deps: {
      alwaysBundle: [/.*/],
      onlyBundle: false,
    },
  },
});
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: ["dist/**", "package.json", "package-lock.json", "node_modules/**"],
  },
  lint: {
    ignorePatterns: ["dist/**", "package.json", "package-lock.json", "node_modules/**"],
  },
  pack: {
    entry: ["src/index.ts"],
    format: "esm",
    outDir: "dist",
    target: "node24",
    minify: true,
    sourcemap: true,
    fixedExtension: false,
    deps: {
      alwaysBundle: [/.*/],
      onlyBundle: false,
    },
  },
});
