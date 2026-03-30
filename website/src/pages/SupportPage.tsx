import { SiteFrame } from "../components/SiteFrame";

const faqs = [
  {
    question: "The save buttons do not appear on a supported site.",
    answer: "Check Settings first. Supported-site access is optional, so you must grant access to the specific platform and then reload the tab once for the parser and overlay to attach.",
  },
  {
    question: "A page is supported but capture is not ready.",
    answer: "Reload the tab after installing or updating the extension. If the page layout changed upstream, capture may need a parser update before that workspace is reliable again.",
  },
  {
    question: "How do I remove everything stored locally?",
    answer: "Open Settings and use Wipe Local Archive. That clears records, projects, snippets, and settings from the local database.",
  },
  {
    question: "What should I include in a bug report?",
    answer: "Include the extension version, Chrome version, the supported site URL pattern, a short reproduction sequence, and whether site access had already been granted before the issue happened.",
  },
];

export function SupportPage() {
  return (
    <SiteFrame current="support">
      <main className="support-page">
        <section className="policy-hero reveal rise-delay-1">
          <span className="eyebrow">Support</span>
          <h1>Install guidance, troubleshooting, and issue reporting in one place.</h1>
          <p className="lead">
            Use this page as the public support URL for the current release while the extension remains local-first.
          </p>
        </section>

        <section className="support-grid reveal rise-delay-2">
          <article className="support-card">
            <span className="eyebrow">Install</span>
            <h2>Local development install</h2>
            <ol>
              <li>Run `npm install` and `npm run build` in the repo root.</li>
              <li>Open `chrome://extensions` and enable Developer mode.</li>
              <li>Load unpacked from `extension/dist`.</li>
              <li>Open Settings, review the disclosure, and grant site access only where needed.</li>
            </ol>
          </article>

          <article className="support-card">
            <span className="eyebrow">Troubleshooting</span>
            <h2>Fast checks before reporting a bug</h2>
            <ul>
              <li>Reload the supported AI tab after granting site access.</li>
              <li>Confirm the platform is still enabled in Settings.</li>
              <li>Use the popup to verify the current page is recognized as supported.</li>
              <li>Re-run `npm run qa:extension` if you are testing from source.</li>
            </ul>
          </article>

          <article className="support-card">
            <span className="eyebrow">Contact</span>
            <h2>Report an issue</h2>
            <p>The active support channel for this repository is GitHub Issues.</p>
            <div className="cta-row">
              <a className="button-link primary" href="https://github.com/mysticalg/AI-Workspace-Archive-Pad/issues">
                Open GitHub issues
              </a>
              <a className="button-link secondary" href="./privacy.html">
                Review privacy policy
              </a>
            </div>
          </article>
        </section>

        <section className="faq-list reveal">
          {faqs.map((faq) => (
            <article key={faq.question} className="faq-item">
              <h2>{faq.question}</h2>
              <p>{faq.answer}</p>
            </article>
          ))}
        </section>
      </main>
    </SiteFrame>
  );
}
