# Release Checklist

## Product

- Run `npm run qa:release` for the local pre-submit pass.
- Run `npm run qa:live-parsers` and review the signed-in DOM report for ChatGPT, Claude, Gemini, and Perplexity.
- If copied-profile mode falls back to login walls or challenge pages, rerun with `AIWA_QA_CDP_ENDPOINT=http://127.0.0.1:9222` against a manually launched signed-in Chrome session.
- Review first-run onboarding and popup messaging on a clean Chrome profile.
- Confirm exports open cleanly in Markdown viewers, PDF readers, and Word.
- Run `npm run qa:extension` and review the generated artifacts under `output/playwright/`.
- Package the upload bundle with `npm run package:extension`

## Quality

- `npm run test -w extension` now covers parser fixtures, export bundle generation, and local wipe/delete reset behavior.
- Manually test import of normalized JSON and ChatGPT export ZIP/JSON
- Verify local wipe and record deletion behaviors

## Store readiness

- Run `npm run assets:store`
- Review `docs/chrome-web-store-submission.md`
- Confirm the GitHub Pages site is live at `https://mysticalg.github.io/AI-Workspace-Archive-Pad/`
- Confirm `https://mysticalg.github.io/AI-Workspace-Archive-Pad/privacy.html` returns `200`
- Confirm `https://mysticalg.github.io/AI-Workspace-Archive-Pad/support.html` returns `200`
- Review privacy policy against actual shipped behavior
- Re-check permissions and disclosures before submission
- Use the live Pages privacy and support URLs in the Chrome Web Store dashboard before submission

## Platform

- Re-check the explicit optional site-access flow against current Chrome Web Store guidance before submission
- Integrate real auth, licensing, and billing before enabling paid plans
- Add live parser monitoring or scheduled QA after launch
