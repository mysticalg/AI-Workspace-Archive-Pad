import type { ReactNode } from "react";

type PageKey = "home" | "privacy" | "support";

interface SiteFrameProps {
  current: PageKey;
  children: ReactNode;
}

const links: Array<{ key: PageKey; href: string; label: string }> = [
  { key: "home", href: "./", label: "Overview" },
  { key: "privacy", href: "./privacy.html", label: "Privacy" },
  { key: "support", href: "./support.html", label: "Support" },
];

export function SiteFrame({ current, children }: SiteFrameProps) {
  return (
    <div className={`site-page page-${current}`}>
      <header className="site-header">
        <a className="brand-lockup" href="./">
          <span className="brand-mark" />
          <span className="brand-copy">
            <strong>AI Workspace Archive</strong>
            <span>Local-first archive for browser AI work</span>
          </span>
        </a>

        <nav className="site-nav" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className={link.key === current ? "active" : undefined}
              aria-current={link.key === current ? "page" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      {children}

      <footer className="site-footer">
        <div>
          <strong>AI Workspace Archive</strong>
          <p>Capture visible AI chats on request, then keep the archive portable and local-first.</p>
        </div>
        <div className="footer-links">
          <a href="./privacy.html">Privacy policy</a>
          <a href="./support.html">Support</a>
          <a href="https://github.com/mysticalg/AI-Workspace-Archive-Pad">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
