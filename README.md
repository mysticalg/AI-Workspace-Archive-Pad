# AI Workspace Archive

AI Workspace Archive is a local-first Chrome extension for saving, organizing, searching, and exporting work from browser-based AI chat tools.

## Workspace layout

- `extension/`: Manifest V3 Chrome extension built with React, Vite, Dexie, and TypeScript
- `backend/`: optional backend scaffold for future sync, licensing, and billing
- `website/`: marketing site starter
- `docs/`: PRD copy, privacy policy, parser guidance, test plan, and release checklist

## Current product scope

- Capture visible chats from ChatGPT, Claude, Gemini, and Perplexity
- Save full threads, selections, or the last prompt/response exchange
- Organize captures into projects with tags and notes
- Search locally across the archive
- Export to Markdown, JSON, PDF, DOCX, and project ZIP bundles
- Import normalized JSON archives and ChatGPT export JSON/ZIP files

## Install and run

1. `npm install`
2. `npm run build`
3. Open Chrome and go to `chrome://extensions`
4. Enable Developer mode
5. Load unpacked extension from `extension/dist`

## Development commands

- `npm run build`
- `npm run assets:store`
- `npm run package:extension`
- `npm run qa:extension`
- `npm run qa:live-parsers`
- `npm run test -w extension`
- `npm run typecheck -w extension`
- `npm run dev -w website`
- `npm run dev -w backend`

Live parser QA environment overrides:

- `AIWA_CHROME_PROFILE=Profile 5` to target a non-default Chrome profile
- `AIWA_QA_SNAPSHOT_ROOT=D:\aiwa-temp` to place the copied profile snapshot on a drive with more free space
- `AIWA_QA_INCLUDE_INDEXEDDB=1` to include IndexedDB-backed app state
- `AIWA_QA_INCLUDE_SERVICE_WORKER=1` to include service-worker storage when a platform depends on it
- `AIWA_QA_HEADLESS=1` to run the probe without opening visible Chrome windows
- `AIWA_QA_CDP_ENDPOINT=http://127.0.0.1:9222` to attach to an already running signed-in Chrome session instead of using a copied profile snapshot

## Notes

- Local-only mode is the default.
- The extension captures visible content only after a user-triggered save action.
- Supported AI-site access is requested explicitly and can be removed per platform from Settings.
- Cloud sync and billing are scaffolded but not yet production-integrated.
- Generated Chrome Web Store assets are written to `assets/chrome-web-store/`.
- A Chrome Web Store upload ZIP is written to `artifacts/` by `npm run package:extension`.
- `npm run qa:live-parsers` supports both copied-profile snapshot mode and attached-browser mode, and writes screenshots plus a JSON report under `output/playwright/`.
- Attached-browser mode is the most reliable way to validate real signed-in sessions on challenge-heavy sites. Start Chrome with remote debugging enabled, for example: `chrome.exe --remote-debugging-port=9222 --user-data-dir=D:\aiwa-temp\qa-browser-profile --profile-directory=Default`.
- The website includes a manual GitHub Pages workflow in `.github/workflows/deploy-website.yml` for use after Pages is enabled in repo settings.
