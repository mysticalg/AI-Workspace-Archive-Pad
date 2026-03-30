import { useState } from "react";
import type { Project } from "types/project";

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId?: string;
  onSelect: (projectId: string) => void;
  onCreate: (title: string) => Promise<void>;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onSelect,
  onCreate,
}: ProjectSelectorProps) {
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <h3>Project Layer</h3>
          <div className="muted">Route every capture into a durable workspace.</div>
        </div>
        <div className="badge-row">
          <span className="badge">Projects {projects.length}</span>
        </div>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="project-select">Current Project</label>
          <select
            id="project-select"
            value={selectedProjectId ?? ""}
            onChange={(event) => onSelect(event.target.value)}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title} - {project.status}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="new-project">New Project</label>
          <input
            id="new-project"
            placeholder="Project name"
            value={newProjectTitle}
            onChange={(event) => setNewProjectTitle(event.target.value)}
          />
        </div>
      </div>

      <div className="toolbar">
        <button
          className="button-primary"
          disabled={busy || !newProjectTitle.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              setError("");
              await onCreate(newProjectTitle.trim());
              setNewProjectTitle("");
            } catch (value) {
              setError(value instanceof Error ? value.message : "Unable to create project");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Creating..." : "Create Project"}
        </button>
      </div>
      {error ? <div className="muted">{error}</div> : null}
    </div>
  );
}
