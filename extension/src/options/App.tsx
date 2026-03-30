import { useEffect, useState } from "react";
import { createProject, importJsonFile, loadAppData, updateSettings, wipeData } from "lib/appState";
import type { Settings } from "types/settings";

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; title: string }>>([]);
  const [importStatus, setImportStatus] = useState("");

  const refresh = async () => {
    const data = await loadAppData();
    setSettings(data.settings);
    setProjectOptions(data.projects.map((project) => ({ id: project.id, title: project.title })));
  };

  useEffect(() => {
    void refresh();
  }, []);

  if (!settings) {
    return null;
  }

  return (
    <div className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <div>
            <div className="hero-kicker">SETTINGS / IMPORT / PRIVACY</div>
            <h2>Local-first controls with explicit deletion and export defaults.</h2>
          </div>
          <div className="badge-row">
            <span className="badge">{settings.storageMode}</span>
            <span className="badge alt">{settings.billing.tier}</span>
          </div>
        </div>
      </section>

      <div className="two-column">
        <section className="section-card">
          <div className="section-header">
            <div>
              <h3>Storage and Defaults</h3>
              <div className="muted">Control storage mode, default project routing, and export behavior.</div>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="storage-mode">Storage Mode</label>
              <select
                id="storage-mode"
                value={settings.storageMode}
                onChange={async (event) => {
                  const next = await updateSettings({
                    ...settings,
                    storageMode: event.target.value as Settings["storageMode"],
                  });
                  setSettings(next);
                }}
              >
                <option value="local-only">Local only</option>
                <option value="sync-enabled">Sync enabled</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="default-project">Default Project</label>
              <select
                id="default-project"
                value={settings.defaultProjectId ?? ""}
                onChange={async (event) => {
                  const next = await updateSettings({
                    ...settings,
                    defaultProjectId: event.target.value,
                  });
                  setSettings(next);
                }}
              >
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="billing-tier">Tier Preview</label>
              <select
                id="billing-tier"
                value={settings.billing.tier}
                onChange={async (event) => {
                  const next = await updateSettings({
                    ...settings,
                    billing: {
                      ...settings.billing,
                      tier: event.target.value as Settings["billing"]["tier"],
                    },
                  });
                  setSettings(next);
                }}
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="team">Team</option>
              </select>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={settings.exportDefaults.includeFrontmatter}
                  onChange={async (event) => {
                    const next = await updateSettings({
                      ...settings,
                      exportDefaults: {
                        ...settings.exportDefaults,
                        includeFrontmatter: event.target.checked,
                      },
                    });
                    setSettings(next);
                  }}
                />{" "}
                Include Markdown frontmatter
              </label>
            </div>
            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={settings.exportDefaults.includeRawSnapshot}
                  onChange={async (event) => {
                    const next = await updateSettings({
                      ...settings,
                      exportDefaults: {
                        ...settings.exportDefaults,
                        includeRawSnapshot: event.target.checked,
                      },
                    });
                    setSettings(next);
                  }}
                />{" "}
                Include raw HTML in JSON exports
              </label>
            </div>
            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={settings.exportDefaults.pageBreakBetweenTurns}
                  onChange={async (event) => {
                    const next = await updateSettings({
                      ...settings,
                      exportDefaults: {
                        ...settings.exportDefaults,
                        pageBreakBetweenTurns: event.target.checked,
                      },
                    });
                    setSettings(next);
                  }}
                />{" "}
                Page breaks between major turns in PDF
              </label>
            </div>
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <div>
              <h3>Platform Controls</h3>
              <div className="muted">Application-level enablement for supported AI workspaces.</div>
            </div>
          </div>
          <div className="mini-grid">
            {(["chatgpt", "claude", "gemini", "perplexity"] as const).map((platform) => (
              <label key={platform} className="surface">
                <input
                  type="checkbox"
                  checked={settings.enabledPlatforms.includes(platform)}
                  onChange={async (event) => {
                    const nextPlatforms = event.target.checked
                      ? [...settings.enabledPlatforms, platform]
                      : settings.enabledPlatforms.filter((value) => value !== platform);
                    const next = await updateSettings({
                      ...settings,
                      enabledPlatforms: nextPlatforms,
                    });
                    setSettings(next);
                  }}
                />{" "}
                {platform}
              </label>
            ))}
          </div>
          <div className="toolbar">
            <button
              className="button-secondary"
              onClick={async () => {
                await createProject("Imported Archive");
                await refresh();
              }}
            >
              Create Import Project
            </button>
          </div>
        </section>
      </div>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h3>Import and Deletion</h3>
            <div className="muted">Explicit import path plus a full local wipe control.</div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="import-json">Import normalized JSON archive</label>
          <input
            id="import-json"
            type="file"
            accept=".json"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              setImportStatus("Importing...");
              const text = await file.text();
              await importJsonFile(text);
              setImportStatus("Import complete");
              await refresh();
            }}
          />
        </div>
        {importStatus ? <div className="muted">{importStatus}</div> : null}

        <div className="toolbar">
          <button
            className="button-danger"
            onClick={async () => {
              await wipeData();
              await refresh();
            }}
          >
            Wipe Local Archive
          </button>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h3>Plans and Monetization</h3>
            <div className="muted">Pricing copied from the PRD, with local tier simulation until billing is wired.</div>
          </div>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Free</h3>
            <p className="muted">5 projects, local-only storage, manual capture, Markdown/JSON/basic PDF.</p>
          </div>
          <div className="pricing-card">
            <h3>Pro</h3>
            <p className="muted">£4.99/month or £39/year. Unlimited projects, sync, DOCX, batch export, prompt library.</p>
          </div>
          <div className="pricing-card">
            <h3>Team</h3>
            <p className="muted">Per-seat pricing with shared spaces, admin controls, and retention features.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
