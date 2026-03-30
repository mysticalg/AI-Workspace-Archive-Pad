import { useEffect, useState } from "react";
import {
  createProject,
  getPlatformPermissionStatuses,
  importArchiveFile,
  loadAppData,
  requestPlatformPermission,
  revokePlatformPermission,
  updateSettings,
  wipeData,
} from "lib/appState";
import {
  getDemoPermissionStatuses,
  isDemoMode,
  seedDemoWorkspace,
} from "lib/demo";
import type { SupportedPlatform } from "types/archive";
import type { Settings } from "types/settings";

export default function App() {
  const demoMode = isDemoMode();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; title: string }>>([]);
  const [archiveCount, setArchiveCount] = useState(0);
  const [importStatus, setImportStatus] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [permissionStatuses, setPermissionStatuses] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  const platforms: SupportedPlatform[] = ["chatgpt", "claude", "gemini", "perplexity"];

  const refresh = async () => {
    if (demoMode) {
      await seedDemoWorkspace();
    }

    const data = await loadAppData();
    setSettings(data.settings);
    setProjectOptions(data.projects.map((project) => ({ id: project.id, title: project.title })));
    setArchiveCount(data.records.length);
    setPermissionStatuses(
      demoMode
        ? getDemoPermissionStatuses(platforms)
        : await getPlatformPermissionStatuses(platforms),
    );
  };

  useEffect(() => {
    void refresh().finally(() => setReady(true));
  }, [demoMode]);

  useEffect(() => {
    document.body.dataset.demoMode = demoMode ? "true" : "false";
    document.body.dataset.ready = ready ? "true" : "false";
  }, [demoMode, ready]);

  if (!ready || !settings) {
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
        <div className="hero-grid">
          <div className="stat">
            <div className="stat-label">Storage Mode</div>
            <div className="stat-value">{settings.storageMode}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Projects</div>
            <div className="stat-value">{projectOptions.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Archive Records</div>
            <div className="stat-value">{archiveCount}</div>
          </div>
        </div>
      </section>

      {!settings.onboardingCompleted ? (
        <section className="section-card">
          <div className="section-header">
            <div>
              <h3>First-Run Onboarding</h3>
              <div className="muted">Make the extension behavior explicit before you rely on it.</div>
            </div>
            <span className="badge warn">Setup in progress</span>
          </div>
          <div className="list">
            <div className="list-item">
              <div className="list-item-title">1. Confirm storage mode</div>
              <div className="muted">Local-only is the default and keeps archive data on-device.</div>
            </div>
            <div className="list-item">
              <div className="list-item-title">2. Choose the AI sites you want enabled</div>
              <div className="muted">Disable any supported platform you do not want the extension to operate on.</div>
            </div>
            <div className="list-item">
              <div className="list-item-title">3. Save the first visible conversation</div>
              <div className="muted">On first successful capture, onboarding completes automatically.</div>
            </div>
          </div>
          <div className="toolbar">
            <button
              className="button-primary"
              onClick={async () => {
                const next = await updateSettings({
                  ...settings,
                  onboardingCompleted: true,
                });
                setSettings(next);
              }}
            >
              Mark Onboarding Complete
            </button>
          </div>
        </section>
      ) : null}

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
                  setSettingsError("");
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
                  setSettingsError("");
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
                  setSettingsError("");
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
              <div className="muted">Supported AI workspaces are controlled here and captured only after user action.</div>
            </div>
          </div>
          <div className="mini-grid">
            {platforms.map((platform) => (
              <div key={platform} className="surface stack">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.enabledPlatforms.includes(platform)}
                    onChange={async (event) => {
                      setSettingsError("");
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
                <div className="badge-row">
                  <span className={`badge ${permissionStatuses[platform] ? "alt" : "warn"}`}>
                    {permissionStatuses[platform] ? "Access granted" : "Access not granted"}
                  </span>
                </div>
                <div className="toolbar">
                  <button
                    className="button-secondary"
                    onClick={async () => {
                      try {
                        setSettingsError("");
                        const result = await requestPlatformPermission(platform);
                        setSettingsError(result?.reason ?? "");
                        await refresh();
                      } catch (value) {
                        setSettingsError(
                          value instanceof Error ? value.message : "Unable to request site access.",
                        );
                      }
                    }}
                  >
                    Grant Access
                  </button>
                  <button
                    className="button-soft"
                    disabled={!permissionStatuses[platform]}
                    onClick={async () => {
                      try {
                        setSettingsError("");
                        await revokePlatformPermission(platform);
                        await refresh();
                        setSettingsError(
                          `Removed persistent site access for ${platform}. Reload any open ${platform} tabs to clear injected UI.`,
                        );
                      } catch (value) {
                        setSettingsError(
                          value instanceof Error ? value.message : "Unable to remove site access.",
                        );
                      }
                    }}
                  >
                    Remove Access
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="toolbar">
            <button
              className="button-secondary"
              onClick={async () => {
                try {
                  setSettingsError("");
                  await createProject("Imported Archive");
                  await refresh();
                } catch (value) {
                  setSettingsError(value instanceof Error ? value.message : "Unable to create project.");
                }
              }}
            >
              Create Import Project
            </button>
          </div>
          <div className="muted">
            Enabled platforms show the capture overlay on supported AI sites. Disable any platform you do not want to use.
          </div>
        </section>
      </div>

      {settingsError ? <div className="section-card muted">{settingsError}</div> : null}

      <section className="section-card">
        <div className="section-header">
          <div>
            <h3>Capture Disclosure</h3>
            <div className="muted">Plain-language explanation for users and Chrome Web Store review.</div>
          </div>
        </div>
        <div className="mini-grid">
          <div className="surface">
            <strong>Captured when you click save</strong>
            <div className="muted">Visible chat messages, code blocks, links, tables, timestamps, URL, and model labels when present.</div>
          </div>
          <div className="surface">
            <strong>Not captured</strong>
            <div className="muted">Unrelated browsing activity, keystrokes, hidden page content, or continuous background recording.</div>
          </div>
          <div className="surface">
            <strong>Deletion controls</strong>
            <div className="muted">You can remove individual records in the side panel or wipe the entire local archive below.</div>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h3>Import and Deletion</h3>
            <div className="muted">Explicit import path plus a full local wipe control.</div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="import-json">Import normalized JSON or ChatGPT export ZIP/JSON</label>
          <input
            id="import-json"
            type="file"
            accept=".json,.zip"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              setImportStatus("Importing...");
              try {
                const result = await importArchiveFile(file);
                const warningText =
                  result.warnings.length > 0 ? ` Warnings: ${result.warnings.join(" ")}` : "";
                setImportStatus(
                  `Imported ${result.importedProjects} projects, ${result.importedRecords} records, and ${result.importedSnippets} snippets from ${result.source}.${warningText}`,
                );
              } catch (value) {
                setImportStatus(value instanceof Error ? value.message : "Import failed.");
              }
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
            <p className="muted">GBP 4.99/month or GBP 39/year. Unlimited projects, sync, DOCX, batch export, prompt library.</p>
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
