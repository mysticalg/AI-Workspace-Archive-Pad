import { useState } from "react";
import type { Project } from "types/project";

interface SavePanelProps {
  projects: Project[];
  selectedProjectId?: string;
  onSelectProject: (projectId: string) => void;
  onSave: (
    mode: "current" | "selection" | "exchange",
    payload: { projectId?: string; tags: string[]; notes?: string },
  ) => Promise<void>;
}

export function SavePanel({
  projects,
  selectedProjectId,
  onSelectProject,
  onSave,
}: SavePanelProps) {
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [busyMode, setBusyMode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const payload = {
    projectId: selectedProjectId,
    tags: tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    notes: notes.trim() || undefined,
  };

  const handleSave = async (mode: "current" | "selection" | "exchange") => {
    setBusyMode(mode);
    try {
      setStatusMessage("");
      await onSave(mode, payload);
      setNotes("");
      setStatusMessage("Capture saved.");
    } catch (value) {
      setStatusMessage(value instanceof Error ? value.message : "Capture failed.");
    } finally {
      setBusyMode(null);
    }
  };

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <h3>Capture Console</h3>
          <div className="muted">Whole thread, selected range, or last prompt/output pair.</div>
        </div>
        <span className="badge warn">Manual capture only</span>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="save-project">Destination Project</label>
          <select
            id="save-project"
            value={selectedProjectId ?? projects[0]?.id ?? ""}
            onChange={(event) => onSelectProject(event.target.value)}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="capture-tags">Tags</label>
          <input
            id="capture-tags"
            placeholder="research, launch, client-facing"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="capture-notes">Notes</label>
        <textarea
          id="capture-notes"
          placeholder="Add a summary, decision note, or follow-up."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      <div className="toolbar">
        <button className="button-primary" onClick={() => void handleSave("current")}>
          {busyMode === "current" ? "Saving..." : "Save Current Chat"}
        </button>
        <button className="button-secondary" onClick={() => void handleSave("selection")}>
          {busyMode === "selection" ? "Saving..." : "Save Selection"}
        </button>
        <button className="button-soft" onClick={() => void handleSave("exchange")}>
          {busyMode === "exchange" ? "Saving..." : "Save Last Exchange"}
        </button>
      </div>
      {statusMessage ? <div className="muted">{statusMessage}</div> : null}
    </div>
  );
}
