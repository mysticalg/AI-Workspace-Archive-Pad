import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.WEBSITE_BASE_PATH || "/",
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "index.html"),
        privacy: path.resolve(__dirname, "privacy.html"),
        support: path.resolve(__dirname, "support.html"),
      },
    },
  },
});
