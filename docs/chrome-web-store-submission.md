# Chrome Web Store Submission Pack

This repo now includes a reproducible asset pack under `assets/chrome-web-store/` and generated UI captures under `output/playwright/store-assets/`.

## Submission assets

- Screenshots: `assets/chrome-web-store/screenshots/`
- Small promo tile: `assets/chrome-web-store/small-promo-tile.png`
- Marquee promo tile: `assets/chrome-web-store/marquee-promo-tile.png`
- Asset manifest: `assets/chrome-web-store/asset-manifest.json`
- Hosted site target after GitHub Pages is enabled and the manual workflow is run: `https://<owner>.github.io/AI-Workspace-Archive-Pad/`

Run this before refreshing the pack:

1. `npm run qa:release`
2. `npm run qa:live-parsers`

## Suggested listing metadata

Name:
`AI Workspace Archive`

Category:
`Productivity`

Summary:
`Save visible AI chats into a local archive you can organize, search, and export.`

Description:
`AI Workspace Archive is a local-first Chrome extension for saving visible AI conversations from ChatGPT, Claude, Gemini, and Perplexity. Capture only after you click save, route records into projects, search locally, and export the archive in standard formats.`

`Current capabilities:`

- `Save the current chat, a selection, or the last exchange from supported AI sites`
- `Organize captures into projects with tags, notes, and recent history`
- `Search local archive records by query, project, and platform`
- `Export records to Markdown, JSON, PDF, DOCX, or ZIP bundles`
- `Import normalized JSON archives and ChatGPT export ZIP or JSON files`
- `Grant or remove supported-site access one platform at a time`
- `Delete individual records or wipe the local archive completely`

Claims to avoid until shipped:

- `cloud sync`
- `billing`
- `paid plans`
- `team collaboration`
- `background monitoring`

## Screenshot order

Use the five generated screenshots in this order:

1. `screenshots/01-capture-current-chat.png`
2. `screenshots/02-project-timeline.png`
3. `screenshots/03-search-local-archive.png`
4. `screenshots/04-control-site-access.png`
5. `screenshots/05-import-and-cleanup.png`

The paired titles and captions live in `assets/chrome-web-store/asset-manifest.json`.

## Permissions justification

`storage`
: Stores projects, archive records, snippets, and user settings locally in IndexedDB.

`activeTab`
: Reads the active supported tab after a user-triggered capture action or popup status check.

`scripting`
: Registers and injects the content script only on supported origins after the user grants optional site access.

`sidePanel`
: Opens the archive UI in Chrome's side panel.

Optional host access:

- `https://chatgpt.com/*`
- `https://claude.ai/*`
- `https://gemini.google.com/*`
- `https://www.perplexity.ai/*`

These are requested at runtime, not granted silently at install.

## Privacy field guidance

Single purpose:
`Capture visible AI workspace content on user request, then store it locally for organization, search, and export.`

Data handled by the current shipped extension:

- `website content` on supported AI sites, only after the user clicks save
- `user-provided content` that is already visible in the supported chat workspace
- `extension settings and archive metadata` stored locally on-device

Current non-claims that should remain true in the dashboard:

- `No sale of personal data`
- `No use for creditworthiness or lending decisions`
- `No unrelated browsing-history tracking`
- `No continuous background capture`
- `No remote sync in the current release`

Before submission, ensure the dashboard disclosures match:

- this file
- `docs/privacy-policy.md`
- the current extension behavior

## Reviewer notes

No reviewer credentials are required for the current local-first release.

Suggested reviewer instructions:

1. Load the unpacked extension from `extension/dist`.
2. Open the popup and options page to review onboarding, privacy disclosure, and optional site-access controls.
3. Grant access to one supported site if you want to test live capture.
4. Confirm that removal of site access stops automatic overlay injection after a page reload.

If a later release introduces gated cloud features, add reviewer credentials in the Chrome Web Store `Test instructions` tab instead of hiding them in the public listing.

## Final pre-submit checks

- Host a real privacy policy URL based on `docs/privacy-policy.md`
- Add a real support URL in the developer dashboard
- Re-run `npm run qa:extension`
- Re-run `npm run assets:store`
- Rebuild the upload ZIP with `npm run package:extension`
- Re-check dashboard privacy answers against the latest extension package
- After Pages is enabled and the workflow is run, use `/privacy.html` as the privacy-policy URL and `/support.html` as the support URL
