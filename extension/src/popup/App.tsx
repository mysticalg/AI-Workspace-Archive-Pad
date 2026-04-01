import { useEffect, useState } from "react";
import {
  captureCurrentPage,
  loadReviewWorkspace,
  loadAppData,
  openSidePanel,
  requestCurrentPlatformPermission,
  requestPageStatus,
} from "lib/appState";
import { getDemoPageStatus, isDemoMode, seedDemoWorkspace } from "lib/demo";
import type { PageStatusResponse } from "lib/appState";
import type { ArchiveRecord } from "types/archive";
import type { Project } from "types/project";

export default function App() {
  const demoMode = isDemoMode();
  const [status, setStatus] = useState<PageStatusResponse>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    if (demoMode) {
      await seedDemoWorkspace();
    }

    const [pageStatus, data] = await Promise.all([
      demoMode ? Promise.resolve(getDemoPageStatus()) : requestPageStatus(),
      loadAppData(),
    ]);
    setStatus(pageStatus ?? {});
    setProjects(data.projects);
    setRecords(data.records.slice(0, 4));
    setOnboardingCompleted(data.settings.onboardingCompleted);
  };

  useEffect(() => {
    void refresh().finally(() => setReady(true));
  }, [demoMode]);

  useEffect(() => {
    document.body.dataset.demoMode = demoMode ? "true" : "false";
    document.body.dataset.ready = ready ? "true" : "false";
  }, [demoMode, ready]);

  if (!ready) {
    return null;
  }

  return (
    <div
      className="app-shell"
      style={{ minWidth: 380, maxWidth: 460, margin: "0 auto", width: "100%" }}
    >
      <section className="hero">
        <div className="hero-copy">
          <div>
            <div className="hero-kicker">PRIVACY-FIRST AI WORKSPACE</div>
            <h1>Capture once. Organize cleanly. Export anywhere.</h1>
          </div>
          <span className="badge">{status.supported ? "Supported page" : "Unavailable"}</span>
        </div>
        <div className="hero-grid">
          <div className="stat">
            <div className="stat-label">Current Page</div>
            <div className="stat-value">{status.platform ?? "Unknown"}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Projects</div>
            <div className="stat-value">{projects.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Archive Items</div>
            <div className="stat-value">{records.length}</div>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h3>Quick Save</h3>
            <div className="muted">
              {status.title ?? "Open a supported AI workspace to capture the visible thread."}
            </div>
          </div>
        </div>
        <div className="toolbar">
          <button
            className="button-primary"
            disabled={!status.captureReady || busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await captureCurrentPage({ tags: [] });
                await refresh();
              } catch (value) {
                setError(value instanceof Error ? value.message : "Capture failed.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving..." : "Save Current Chat"}
          </button>
          <button className="button-secondary" onClick={() => void openSidePanel()}>
            Open Side Panel
          </button>
          {records.length === 0 ? (
            <button
              className="button-secondary"
              disabled={sampleBusy}
              onClick={async () => {
                setSampleBusy(true);
                setError("");
                try {
                  await loadReviewWorkspace();
                  await refresh();
                  setError("Sample archive loaded. Open the side panel to review search, export, and delete flows.");
                } catch (value) {
                  setError(value instanceof Error ? value.message : "Unable to load the sample archive.");
                } finally {
                  setSampleBusy(false);
                }
              }}
            >
              {sampleBusy ? "Loading sample..." : "Load Sample Archive"}
            </button>
          ) : null}
          {!status.permissionGranted && status.supportedUrl ? (
            <button
              className="button-secondary"
              disabled={permissionBusy}
              onClick={async () => {
                setPermissionBusy(true);
                setError("");
                try {
                  const result = await requestCurrentPlatformPermission();
                  setError(result?.reason ?? "");
                  await refresh();
                } catch (value) {
                  setError(value instanceof Error ? value.message : "Unable to request site access.");
                } finally {
                  setPermissionBusy(false);
                }
              }}
            >
              {permissionBusy ? "Requesting..." : "Grant Site Access"}
            </button>
          ) : null}
          <button className="button-soft" onClick={() => void chrome.runtime.openOptionsPage()}>
            Settings
          </button>
        </div>
        <div className="muted">{error || status.reason}</div>
      </section>

      {!onboardingCompleted ? (
        <section className="section-card">
          <div className="section-header">
            <div>
              <h3>First Capture Checklist</h3>
              <div className="muted">Keep the first run explicit and review-friendly.</div>
            </div>
          </div>
          <div className="list">
            <div className="list-item">
              <div className="list-item-title">1. Open a supported AI workspace.</div>
              <div className="muted">ChatGPT, Claude, Gemini, or Perplexity in the current tab.</div>
            </div>
            <div className="list-item">
              <div className="list-item-title">2. Save only visible content.</div>
              <div className="muted">The extension captures visible conversation content after you click save.</div>
            </div>
            <div className="list-item">
              <div className="list-item-title">3. Review storage and privacy settings.</div>
              <div className="muted">Local-only mode is the default. You can wipe the archive from Settings at any time.</div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-card">
        <div className="section-header">
          <div>
            <h3>Capture Disclosure</h3>
            <div className="muted">Exactly what this extension does and does not collect.</div>
          </div>
        </div>
        <div className="list">
          <div className="list-item">
            <div className="list-item-title">Captured after you click save</div>
            <div className="muted">Visible messages, code blocks, links, tables, page URL, timestamps, and model labels when present.</div>
          </div>
          <div className="list-item">
            <div className="list-item-title">Never captured</div>
            <div className="muted">Unrelated tabs, hidden browsing history, keystrokes, or continuous background activity.</div>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h3>Recent Captures</h3>
            <div className="muted">Latest saved conversations and snippets.</div>
          </div>
        </div>
        <div className="list">
          {records.length === 0 ? (
            <div className="surface muted">
              No local captures yet. Load the sample archive to review export and search flows without a live AI account.
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="list-item">
                <div className="list-item-title">{record.sourceTitle ?? "Untitled capture"}</div>
                <div className="list-item-meta">
                  <span>{record.platform}</span>
                  <span>{new Date(record.capturedAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
