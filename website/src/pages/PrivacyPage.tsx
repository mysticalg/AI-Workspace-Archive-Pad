import { SiteFrame } from "../components/SiteFrame";

const sections = [
  {
    title: "What the extension does",
    body: "AI Workspace Archive captures visible AI workspace content only after you trigger a save action. It is designed for ChatGPT, Claude, Gemini, and Perplexity when those sites are explicitly enabled by you.",
  },
  {
    title: "What is stored",
    body: "The local archive can include visible messages, code blocks, links, timestamps, model labels, source URLs, tags, notes, snippets, and export history. Settings and project metadata are also stored locally so the archive remains usable between sessions.",
  },
  {
    title: "What is not collected",
    body: "The extension does not continuously monitor browsing activity, does not capture keystrokes, and does not record unrelated tabs or unsupported sites. It also does not claim cloud sync in the current shipped release.",
  },
  {
    title: "Where data lives",
    body: "Default behavior is local-first storage in the browser on your device. The current release does not require an account and does not transmit archive data to a remote backend as part of normal use.",
  },
  {
    title: "Deletion controls",
    body: "You can delete individual archive records from the side panel and wipe the local archive completely from settings. Optional host access can also be removed per platform.",
  },
  {
    title: "Permissions",
    body: "Storage is used for local persistence. Active tab and scripting are used to inspect and capture the current supported page after user action. Side panel permission opens the archive workspace. Host permissions for supported AI sites are requested at runtime, not granted silently at install.",
  },
];

export function PrivacyPage() {
  return (
    <SiteFrame current="privacy">
      <main className="policy-page">
        <section className="policy-hero reveal rise-delay-1">
          <span className="eyebrow">Privacy policy</span>
          <h1>Manual capture, local-first storage, and explicit site access.</h1>
          <p className="lead">
            This policy reflects the current product behavior in the repository as of March 30, 2026.
          </p>
        </section>

        <section className="quick-facts reveal rise-delay-2">
          <div>
            <strong>Default mode</strong>
            <span>Local-only</span>
          </div>
          <div>
            <strong>Capture model</strong>
            <span>User-triggered save action</span>
          </div>
          <div>
            <strong>Site access</strong>
            <span>Optional per supported platform</span>
          </div>
        </section>

        <section className="policy-grid reveal">
          {sections.map((section) => (
            <article key={section.title} className="policy-block">
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </section>

        <section className="document-panel reveal">
          <div>
            <span className="eyebrow">Support and contact</span>
            <h2>Need help or want to report a privacy concern?</h2>
          </div>
          <div className="document-list">
            <a href="./support.html">Open the support page</a>
            <a href="https://github.com/mysticalg/AI-Workspace-Archive-Pad/issues">Report an issue on GitHub</a>
          </div>
        </section>
      </main>
    </SiteFrame>
  );
}
