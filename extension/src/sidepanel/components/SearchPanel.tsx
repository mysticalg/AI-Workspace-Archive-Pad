import { useState } from "react";
import type { ArchiveRecord, SupportedPlatform } from "types/archive";
import type { Project } from "types/project";

interface SearchPanelProps {
  projects: Project[];
  results: ArchiveRecord[];
  onSearch: (query: string, filters: { projectId?: string; platform?: SupportedPlatform }) => void;
}

export function SearchPanel({ projects, results, onSearch }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [platform, setPlatform] = useState<SupportedPlatform | "">("");

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <h3>Archive Search</h3>
          <div className="muted">Full text plus project and platform filters.</div>
        </div>
        <span className="badge">Search local</span>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="search-query">Query</label>
          <input
            id="search-query"
            value={query}
            placeholder="Find exact prompts, outputs, decisions..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="search-project">Project</label>
          <select
            id="search-project"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="search-platform">Platform</label>
          <select
            id="search-platform"
            value={platform}
            onChange={(event) => setPlatform(event.target.value as SupportedPlatform | "")}
          >
            <option value="">All platforms</option>
            <option value="chatgpt">ChatGPT</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
            <option value="perplexity">Perplexity</option>
          </select>
        </div>
      </div>

      <div className="toolbar">
        <button
          className="button-primary"
          onClick={() => onSearch(query, { projectId: projectId || undefined, platform: platform || undefined })}
        >
          Run Search
        </button>
        <button
          className="button-secondary"
          onClick={() => {
            setQuery("");
            setProjectId("");
            setPlatform("");
            onSearch("", {});
          }}
        >
          Clear
        </button>
      </div>

      <div className="list">
        {results.slice(0, 8).map((record) => (
          <div key={record.id} className="list-item">
            <div className="list-item-title">{record.sourceTitle ?? "Untitled capture"}</div>
            <div className="list-item-meta">
              <span>{record.platform}</span>
              <span>{new Date(record.capturedAt).toLocaleDateString()}</span>
            </div>
            <div className="muted">{record.summary ?? record.cleanText.slice(0, 180)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
