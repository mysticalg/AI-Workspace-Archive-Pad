import { useEffect, useMemo, useState } from "react";
import {
  captureCurrentPage,
  captureLastExchange,
  captureSelection,
  createProject,
  deleteRecord,
  exportProject,
  exportRecord,
  loadAppData,
  searchRecords,
} from "lib/appState";
import type { ArchiveRecord } from "types/archive";
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
      title: `Project export · ${entry.format.toUpperCase()}`,
      description: `${entry.recordIds.length} records`,
      createdAt: entry.createdAt,
    })) ?? [];

  const recordEvents = records.map((record) => ({
    id: record.id,
    title: record.sourceTitle ?? "Untitled capture",
    description: `${record.platform} · ${record.modelName ?? "Model unknown"}`,
    createdAt: record.capturedAt,
  }));

  return [...recordEvents, ...exportEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [searchResults, setSearchResults] = useState<ArchiveRecord[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>();

  const refresh = async () => {
    const data = await loadAppData();
    setProjects(data.projects);
    setRecords(data.records);
    setSearchResults(data.records);
    setSettings(data.settings);
    setSelectedProjectId((current) => current ?? data.settings.defaultProjectId ?? data.projects[0]?.id);
  };

  useEffect(() => {
    void refresh();
  }, []);

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
            <span className="badge alt">{settings?.billing.tier ?? "free"} tier</span>
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

      <ProjectSelector
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelect={setSelectedProjectId}
        onCreate={async (title) => {
          await createProject(title);
          await refresh();
        }}
      />

      <div className="two-column">
        <SavePanel
          projects={projects}
          selectedProjectId={selectedProjectId}
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

      <RecentCaptures
        records={projectRecords.slice(0, 12)}
        onExport={(recordId, format) => void exportRecord(recordId, format)}
        onDelete={(recordId) => void deleteRecord(recordId).then(refresh)}
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
              disabled={!selectedProjectId}
              onClick={() => selectedProjectId && void exportProject(selectedProjectId, "markdown")}
            >
              Batch Markdown
            </button>
            <button
              className="button-secondary"
              disabled={!selectedProjectId}
              onClick={() => selectedProjectId && void exportProject(selectedProjectId, "pdf")}
            >
              Batch PDF
            </button>
            <button
              className="button-soft"
              disabled={!selectedProjectId}
              onClick={() => selectedProjectId && void exportProject(selectedProjectId, "zip")}
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

