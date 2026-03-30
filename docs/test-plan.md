# Test Plan

## Functional

- Save current chat on ChatGPT, Claude, and Gemini.
- Save selection and save last exchange on supported pages.
- Create projects, assign captures, and verify search filtering.
- Export individual records to Markdown, JSON, PDF, and DOCX.
- Export full projects as ZIP bundles.

## Regression

- Confirm unsupported pages fail gracefully in popup status.
- Confirm IndexedDB survives reload and reinstall scenarios with versioned schema.
- Re-check parser behavior when supported platform DOM changes.

## Security

- Validate sanitization of raw HTML before rendering.
- Validate that exported files do not include executable scripts.
- Confirm wipe control deletes projects, records, snippets, and settings.
