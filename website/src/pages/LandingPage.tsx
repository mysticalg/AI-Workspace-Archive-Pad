import { FeatureCard } from "../components/FeatureCard";

const features = [
  {
    title: "Own your AI work",
    body: "Capture visible chats from supported AI tools and keep a portable, local-first archive.",
  },
  {
    title: "Project layer above chat apps",
    body: "Group prompts, outputs, snippets, and exports into real projects with notes and tags.",
  },
  {
    title: "Export cleanly",
    body: "Move conversations into Markdown, JSON, PDF, DOCX, or full ZIP project bundles.",
  },
];

export function LandingPage() {
  return (
    <main className="site-shell">
      <section className="hero">
        <div className="eyebrow">Chrome Extension + Local Archive</div>
        <h1>Own your AI work.</h1>
        <p>
          AI Workspace Archive turns scattered AI sessions into searchable, exportable project knowledge.
        </p>
        <div className="hero-actions">
          <a href="#pricing" className="primary-link">
            View pricing
          </a>
          <a href="#features" className="secondary-link">
            Explore features
          </a>
        </div>
      </section>

      <section id="features" className="feature-grid">
        {features.map((feature) => (
          <FeatureCard key={feature.title} title={feature.title} body={feature.body} />
        ))}
      </section>

      <section id="pricing" className="pricing">
        <div className="pricing-card">
          <h3>Free</h3>
          <p>5 projects, local-only storage, manual capture, Markdown, JSON, and simple PDF export.</p>
        </div>
        <div className="pricing-card featured">
          <h3>Pro</h3>
          <p>£4.99/month or £39/year for unlimited projects, sync, DOCX, batch export, and prompt library.</p>
        </div>
        <div className="pricing-card">
          <h3>Team</h3>
          <p>Shared spaces, permissions, and retention controls for small teams with serious AI workflows.</p>
        </div>
      </section>
    </main>
  );
}

