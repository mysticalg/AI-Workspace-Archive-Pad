import { useEffect, useMemo, useState } from "react";
import {
  captureCurrentPage,
  captureLastExchange,
  captureSelection,
  createProject,
  deleteRecord,
  exportProject,
  exportRecord,
  loadReviewWorkspace,
  loadAppData,
  requestPageStatus,
  searchRecords,
} from "lib/appState";
import { getDemoPageStatus, isDemoMode, seedDemoWorkspace } from "lib/demo";
import type { ArchiveRecord } from "types/archive";
import type { PageStatusResponse } from "lib/appState";
import type { Project } from "types/project";
import type { Settings } from "types/settings";
import { ProjectSelector } from "./components/ProjectSelector";
import { RecentCaptures } from "./components/RecentCaptures";
import { SavePanel } from "./components/SavePanel";
import { SearchPanel } from "./components/SearchPanel";

type SaveMode = "current" | "selection" | "exchange";

function buildTimeline(project: Project | undefined, records: ArchiveRecord[]) {
  const exportEvents =
    project?.exportHistory.map((entry) => ({
      id: entry.id,
      title: `Project export - ${entry.format.toUpperCase()}`,
      description: `${entry.recordIds.length} records`,
      createdAt: entry.createdAt,
    })) ?? [];

  const recordEvents = records.map((record) => ({
    id: record.id,
    title: record.sourceTitle ?? "Untitled capture",
    description: `${record.platform} - ${record.modelName ?? "Model unknown"}`,
    createdAt: record.capturedAt,
  }));

  return [...recordEvents, ...exportEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export default function App() {
  const demoMode = isDemoMode();
  const [projects, setProjects] = useState<Project[]>([]);
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [searchResults, setSearchResults] = useState<ArchiveRecord[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [pageStatus, setPageStatus] = useState<PageStatusResponse>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [activityMessage, setActivityMessage] = useState("");
  const [sampleBusy, setSampleBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = async () => {
    if (demoMode) {
      await seedDemoWorkspace();
    }

    const [data, currentPageStatus] = await Promise.all([
      loadAppData(),
      demoMode ? Promise.resolve(getDemoPageStatus()) : requestPageStatus(),
    ]);
    setProjects(data.projects);
    setRecords(data.records);
    setSearchResults(data.records);
    setSettings(data.settings);
    setPageStatus(currentPageStatus ?? {});
    setSelectedProjectId((current) => current ?? data.settings.defaultProjectId ?? data.projects[0]?.id);
  };

  useEffect(() => {
    void refresh().finally(() => setReady(true));
  }, [demoMode]);

  useEffect(() => {
    document.body.dataset.demoMode = demoMode ? "true" : "false";
    document.body.dataset.ready = ready ? "true" : "false";
  }, [demoMode, ready]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId],
  );
  const projectRecords = useMemo(
    () =>
      selectedProjectId
        ? records.filter((record) => record.projectId === selectedProjectId)
        : records,
    [records, selectedProjectId],
  );
  const timeline = useMemo(
    () => buildTimeline(selectedProject, projectRecords),
    [projectRecords, selectedProject],
  );

  if (!ready) {
    return null;
  }

  const hasProjectRecords = projectRecords.length > 0;

  const handleSave = async (
    mode: SaveMode,
    payload: { projectId?: string; tags: string[]; notes?: string },
  ) => {
    if (mode === "current") {
      await captureCurrentPage(payload);
    } else if (mode === "selection") {
      await captureSelection(payload);
    } else {
      await captureLastExchange(payload);
    }
    await refresh();
    setActivityMessage("Capture saved.");
  };

  return (
    <div className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <div>
            <div className="hero-kicker">ARCHIVE / EXPORT / PROJECT LAYER</div>
            <h2>Serious project management for AI work, not another chat sidebar.</h2>
          </div>
          <div className="badge-row">
            <span className="badge">{settings?.storageMode ?? "local-only"}</span>
            <span className="badge alt">manual capture only</span>
          </div>
        </div>
        <div className="hero-grid">
          <div className="stat">
            <div className="stat-label">Projects</div>
            <div className="stat-value">{projects.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Records</div>
            <div className="stat-value">{records.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Selected Timeline</div>
            <div className="stat-value">{timeline.length}</div>
          </div>
        </div>
      </section>

      {!settings?.onboardingCompleted ? (
        <section className="section-card">
          <div className="section-header">
            <div>
              <h3>First Capture Checklist</h3>
              <div className="muted">Choose a project, save a visible conversation, and verify the archive item below.</div>
            </div>
            <span className="badge warn">Onboarding</span>
          </div>
        </section>
      ) : null}

      {records.length === 0 ? (
        <section className="section-card">
          <div className="section-header">
            <div>
              <h3>Review Sample Workspace</h3>
              <div className="muted">
                Load a local sample archive so search, export, and deletion flows are reproducible without signing into a third-party AI account.
              </div>
            </div>
            <span className="badge">Local demo</span>
          </div>
          <div className="toolbar">
            <button
              className="button-primary"
              disabled={sampleBusy}
              onClick={async () => {
                setSampleBusy(true);
                setActivityMessage("");
                try {
                  await loadReviewWorkspace();
                  await refresh();
                  setActivityMessage("Sample archive loaded. Search, export, and delete actions are now available locally.");
                } catch (value) {
                  setActivityMessage(value instanceof Error ? value.message : "Unable to load the sample archive.");
                } finally {
                  setSampleBusy(false);
                }
              }}
            >
              {sampleBusy ? "Loading sample..." : "Load Sample Archive"}
            </button>
          </div>
        </section>
      ) : null}

      {activityMessage ? <div className="section-card muted">{activityMessage}</div> : null}

      <ProjectSelector
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelect={setSelectedProjectId}
        onCreate={async (title) => {
          try {
            setActivityMessage("");
            await createProject(title);
            await refresh();
            setActivityMessage("Project created.");
          } catch (value) {
            setActivityMessage(value instanceof Error ? value.message : "Unable to create the project.");
          }
        }}
      />

      <div className="two-column">
        <SavePanel
          projects={projects}
          selectedProjectId={selectedProjectId}
          pageStatus={pageStatus}
          onSelectProject={setSelectedProjectId}
          onSave={handleSave}
        />
        <SearchPanel
          projects={projects}
          results={searchResults}
          onSearch={(query, filters) =>
            void searchRecords(query, filters).then((results) => setSearchResults(results))
          }
        />
      </div>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h3>Capture Boundaries</h3>
            <div className="muted">The extension only saves visible AI workspace content after you trigger capture.</div>
          </div>
        </div>
        <div className="mini-grid">
          <div className="surface">
            <strong>Included</strong>
            <div className="muted">Visible messages, notes, tags, links, code blocks, URLs, and export history.</div>
          </div>
          <div className="surface">
            <strong>Excluded</strong>
            <div className="muted">Unrelated browsing, hidden background activity, keystrokes, and non-supported sites.</div>
          </div>
        </div>
      </section>

      <RecentCaptures
        records={projectRecords.slice(0, 12)}
        onExport={(recordId, format) =>
          void exportRecord(recordId, format)
            .then(() => setActivityMessage(`${format.toUpperCase()} export downloaded.`))
            .catch((value) =>
              setActivityMessage(value instanceof Error ? value.message : "Unable to export the record."),
            )
        }
        onDelete={(recordId) =>
          void deleteRecord(recordId)
            .then(async () => {
              await refresh();
              setActivityMessage("Capture deleted.");
            })
            .catch((value) =>
              setActivityMessage(value instanceof Error ? value.message : "Unable to delete the record."),
            )
        }
      />

      <section className="section-card">
        <div className="section-header">
          <div>
            <h3>Project Timeline</h3>
            <div className="muted">
              Chronological archive records and export events for the current project.
            </div>
          </div>
          <div className="toolbar">
            <button
              className="button-secondary"
              disabled={!selectedProjectId || !hasProjectRecords}
              onClick={() =>
                selectedProjectId &&
                void exportProject(selectedProjectId, "markdown")
                  .then(() => setActivityMessage("Project Markdown export downloaded."))
                  .catch((value) =>
                    setActivityMessage(
                      value instanceof Error ? value.message : "Unable to export the project.",
                    ),
                  )
              }
            >
              Batch Markdown
            </button>
            <button
              className="button-secondary"
              disabled={!selectedProjectId || !hasProjectRecords}
              onClick={() =>
                selectedProjectId &&
                void exportProject(selectedProjectId, "pdf")
                  .then(() => setActivityMessage("Project PDF export downloaded."))
                  .catch((value) =>
                    setActivityMessage(
                      value instanceof Error ? value.message : "Unable to export the project.",
                    ),
                  )
              }
            >
              Batch PDF
            </button>
            <button
              className="button-soft"
              disabled={!selectedProjectId || !hasProjectRecords}
              onClick={() =>
                selectedProjectId &&
                void exportProject(selectedProjectId, "zip")
                  .then(() => setActivityMessage("Project ZIP export downloaded."))
                  .catch((value) =>
                    setActivityMessage(
                      value instanceof Error ? value.message : "Unable to export the project.",
                    ),
                  )
              }
            >
              Full ZIP Package
            </button>
          </div>
        </div>

        <div className="timeline">
          {timeline.length === 0 ? (
            <div className="surface muted">No timeline events yet for this project.</div>
          ) : (
            timeline.map((entry) => (
              <div key={entry.id} className="timeline-entry">
                <div className="list-item-title">{entry.title}</div>
                <div className="list-item-meta">
                  <span>{new Date(entry.createdAt).toLocaleString()}</span>
                </div>
                <div className="muted">{entry.description}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
