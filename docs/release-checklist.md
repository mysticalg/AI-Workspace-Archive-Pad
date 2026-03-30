# Release Checklist

## Product

- Validate live capture on current ChatGPT, Claude, Gemini, and Perplexity DOMs.
- Review first-run onboarding and popup messaging on a clean Chrome profile.
- Confirm exports open cleanly in Markdown viewers, PDF readers, and Word.

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

- Decide whether to keep current supported-host access model or move to a stricter optional-permission flow before launch
- Integrate real auth, licensing, and billing before enabling paid plans
- Add live parser monitoring or scheduled QA after launch
