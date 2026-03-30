import { SiteFrame } from "../components/SiteFrame";
import timelineShot from "../../../assets/chrome-web-store/screenshots/02-project-timeline.png";
import controlsShot from "../../../assets/chrome-web-store/screenshots/04-control-site-access.png";
import popupShot from "../../../assets/chrome-web-store/screenshots/01-capture-current-chat.png";

export function LandingPage() {
  return (
    <SiteFrame current="home">
      <main>
        <section className="launch-hero">
          <div className="launch-copy reveal rise-delay-1">
            <div className="eyebrow">Chrome extension + store-ready release pack</div>
            <h1>Own the AI work you already did.</h1>
            <p className="lead">
              AI Workspace Archive turns visible ChatGPT, Claude, Gemini, and Perplexity sessions into a local archive you can search, organize, and export without surrendering the record.
            </p>
            <div className="cta-row">
              <a href="./support.html" className="button-link primary">
                Install and support
              </a>
              <a href="./privacy.html" className="button-link secondary">
                Review privacy policy
              </a>
            </div>
            <ul className="hero-notes">
              <li>Manual capture only</li>
              <li>Optional site access per platform</li>
              <li>Markdown, JSON, PDF, DOCX, ZIP export</li>
            </ul>
          </div>

          <div className="launch-visual reveal rise-delay-2">
            <div className="screen-stack">
              <img src={timelineShot} alt="Project timeline view of AI Workspace Archive" className="screen-large drift" />
              <img src={popupShot} alt="Popup save flow" className="screen-tall drift delay" />
              <img src={controlsShot} alt="Optional site access controls" className="screen-wide drift delay-2" />
            </div>
          </div>
        </section>

        <section className="content-band reveal">
          <div className="band-heading">
            <span className="eyebrow">Why it feels different</span>
            <h2>Built like an archive, not another disposable chat sidebar.</h2>
          </div>
          <div className="band-grid">
            <article>
              <h3>Permission discipline</h3>
              <p>Supported AI sites are granted one at a time, and access can be removed cleanly from settings.</p>
            </article>
            <article>
              <h3>Project-first structure</h3>
              <p>Captures sit inside durable projects with notes, tags, timelines, and export history instead of floating as isolated threads.</p>
            </article>
            <article>
              <h3>Portable output</h3>
              <p>Records leave the extension in standard formats, and ChatGPT exports can come back in without a rewrite.</p>
            </article>
          </div>
        </section>

        <section className="workflow-strip reveal">
          <div className="workflow-copy">
            <span className="eyebrow">Workflow</span>
            <h2>Capture. Sort. Retrieve. Ship.</h2>
          </div>
          <ol className="workflow-list">
            <li>
              <strong>Capture visible work on request.</strong>
              <span>Save the whole thread, a selected range, or the last exchange from a supported AI workspace.</span>
            </li>
            <li>
              <strong>Route it into a real project.</strong>
              <span>Use notes, tags, and recent history to turn a one-off conversation into reusable project memory.</span>
            </li>
            <li>
              <strong>Search and export without lock-in.</strong>
              <span>Find exact decisions later, then deliver them as Markdown, JSON, PDF, DOCX, or ZIP packages.</span>
            </li>
          </ol>
        </section>

        <section className="document-panel reveal">
          <div>
            <span className="eyebrow">Submission status</span>
            <h2>The repo already contains the store screenshots, promo tiles, and submission copy.</h2>
          </div>
          <div className="document-list">
            <a href="https://github.com/mysticalg/AI-Workspace-Archive-Pad">Repository and release history</a>
            <a href="./privacy.html">Hosted privacy policy page</a>
            <a href="./support.html">Hosted support and troubleshooting page</a>
          </div>
        </section>
      </main>
    </SiteFrame>
  );
}
