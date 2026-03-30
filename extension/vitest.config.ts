import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
      types: fileURLToPath(new URL("./src/types", import.meta.url)),
      exporters: fileURLToPath(new URL("./src/exporters", import.meta.url)),
      db: fileURLToPath(new URL("./src/db", import.meta.url)),
    },
  },
  test: {
    environment: "node",
  },
});

