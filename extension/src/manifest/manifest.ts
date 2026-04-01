import { defineManifest } from "@crxjs/vite-plugin";

export const SUPPORTED_HOSTS = [
  "https://chatgpt.com/*",
  "https://claude.ai/*",
  "https://gemini.google.com/*",
  "https://www.perplexity.ai/*",
] as const;

export default defineManifest({
  manifest_version: 3,
  name: "AI Workspace Archive",
  version: "0.1.0",
  description:
    "Save, organize, search, and export your AI workspace across platforms.",
  permissions: ["activeTab", "scripting", "sidePanel"],
  optional_host_permissions: [...SUPPORTED_HOSTS],
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },
  action: {
    default_popup: "src/popup/index.html",
  },
  options_page: "src/options/index.html",
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },
  icons: {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
  web_accessible_resources: [
    {
      resources: ["icons/*"],
      matches: ["<all_urls>"],
    },
  ],
});
