import type { ArchiveRecord, SearchFilters } from "types/archive";
import type { Project } from "types/project";
import type { Settings } from "types/settings";
import type { Snippet, SnippetKind } from "types/snippet";

export type ExportFormat = "markdown" | "json" | "pdf" | "docx" | "zip";

export interface CaptureOptions {
  projectId?: string;
  tags: string[];
  notes?: string;
  titleOverride?: string;
}

export type RuntimeMessage =
  | { type: "GET_APP_STATE" }
  | { type: "GET_PAGE_STATUS" }
  | { type: "CAPTURE_CURRENT_PAGE"; payload: CaptureOptions }
  | { type: "CAPTURE_SELECTION"; payload: CaptureOptions }
  | { type: "CAPTURE_LAST_EXCHANGE"; payload: CaptureOptions & { snippetKind?: SnippetKind } }
  | {
      type: "SAVE_SNIPPET";
      payload: CaptureOptions & { kind: SnippetKind; title: string; body?: string };
    }
  | { type: "SEARCH_RECORDS"; payload: { query: string; filters: SearchFilters } }
  | { type: "EXPORT_RECORD"; payload: { recordId: string; format: ExportFormat } }
  | { type: "EXPORT_PROJECT"; payload: { projectId: string; format: ExportFormat } }
  | { type: "REQUEST_PLATFORM_PERMISSION"; payload: { originUrl: string } }
  | { type: "WIPE_LOCAL_DATA" }
  | { type: "IMPORT_FILE"; payload: { text: string; fileName: string } };

export interface AppStatePayload {
  projects: Project[];
  records: ArchiveRecord[];
  snippets: Snippet[];
  settings: Settings;
}

