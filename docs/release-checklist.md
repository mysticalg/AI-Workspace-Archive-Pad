# Release Checklist

## Product

- Validate live capture on current ChatGPT, Claude, Gemini, and Perplexity DOMs.
- Review first-run onboarding and popup messaging on a clean Chrome profile.
- Confirm exports open cleanly in Markdown viewers, PDF readers, and Word.
- Run `npm run qa:extension` and review the generated artifacts under `output/playwright/`.
- Package the upload bundle with `npm run package:extension`

## Quality

- Run `npm run build`
- Run `npm run test -w extension`
- Manually test import of normalized JSON and ChatGPT export ZIP/JSON
- Verify local wipe and record deletion behaviors

## Store readiness

- Run `npm run assets:store`
- Review `docs/chrome-web-store-submission.md`
- Deploy the website so `privacy.html` and `support.html` are publicly reachable
- Confirm the GitHub Pages workflow succeeded and note the final public URLs
- Review privacy policy against actual shipped behavior
- Re-check permissions and disclosures before submission
- Publish a real privacy policy URL and support URL before store submission

## Platform

- Re-check the explicit optional site-access flow against current Chrome Web Store guidance before submission
- Integrate real auth, licensing, and billing before enabling paid plans
- Add live parser monitoring or scheduled QA after launch
