import type { ArchiveRecord } from "types/archive";

interface RecentCapturesProps {
  records: ArchiveRecord[];
  onExport: (recordId: string, format: "markdown" | "json" | "pdf" | "docx") => void;
  onDelete: (recordId: string) => void;
}

export function RecentCaptures({
  records,
  onExport,
  onDelete,
}: RecentCapturesProps) {
  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <h3>Recent Captures</h3>
          <div className="muted">Latest archived chats and outputs across platforms.</div>
        </div>
        <span className="badge alt">{records.length} items</span>
      </div>

      <div className="list">
        {records.length === 0 ? (
          <div className="surface muted">
            No captures yet. Save a live chat, selection, or last exchange to start your archive.
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="list-item">
              <div className="list-item-title">{record.sourceTitle ?? "Untitled capture"}</div>
              <div className="list-item-meta">
                <span>{record.platform}</span>
                <span>{new Date(record.capturedAt).toLocaleString()}</span>
                <span>{record.modelName ?? "Model unknown"}</span>
                {record.isFallbackCapture ? <span>Fallback capture</span> : null}
              </div>
              <div className="muted">{record.summary ?? record.cleanText.slice(0, 160)}</div>
              <div className="badge-row">
                {record.tags.map((tag) => (
                  <span key={tag} className="badge">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="toolbar">
                <button className="button-secondary" onClick={() => onExport(record.id, "markdown")}>
                  Markdown
                </button>
                <button className="button-secondary" onClick={() => onExport(record.id, "pdf")}>
                  PDF
                </button>
                <button className="button-secondary" onClick={() => onExport(record.id, "docx")}>
                  DOCX
                </button>
                <button className="button-soft" onClick={() => onExport(record.id, "json")}>
                  JSON
                </button>
                <button className="button-danger" onClick={() => onDelete(record.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

