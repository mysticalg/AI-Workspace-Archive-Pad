# Release Checklist

## Product

- Validate live capture on current ChatGPT, Claude, Gemini, and Perplexity DOMs.
- Review first-run onboarding and popup messaging on a clean Chrome profile.
- Confirm exports open cleanly in Markdown viewers, PDF readers, and Word.
- Run `npm run qa:extension` and review the generated artifacts under `output/playwright/`.

## Quality

- Run `npm run build`
- Run `npm run test -w extension`
- Manually test import of normalized JSON and ChatGPT export ZIP/JSON
- Verify local wipe and record deletion behaviors

## Store readiness

- Prepare Chrome Web Store screenshots and promotional assets
- Finalize store listing copy and short description
- Review privacy policy against actual shipped behavior
- Re-check permissions and disclosures before submission

## Platform

- Re-check the explicit optional site-access flow against current Chrome Web Store guidance before submission
- Integrate real auth, licensing, and billing before enabling paid plans
- Add live parser monitoring or scheduled QA after launch
