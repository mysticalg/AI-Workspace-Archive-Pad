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
- `npm run test -w extension`
- `npm run typecheck -w extension`
- `npm run dev -w website`
- `npm run dev -w backend`

## Notes

- Local-only mode is the default.
- The extension captures visible content only after a user-triggered save action.
- Supported AI-site access is requested explicitly and can be removed per platform from Settings.
- Cloud sync and billing are scaffolded but not yet production-integrated.
- Generated Chrome Web Store assets are written to `assets/chrome-web-store/`.
- A Chrome Web Store upload ZIP is written to `artifacts/` by `npm run package:extension`.
- The website is configured for GitHub Pages deployment from `.github/workflows/deploy-website.yml`.
