export type SupportedPlatform =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "copilot"
  | "other";

export interface ArchiveAttachment {
  id: string;
  name: string;
  mimeType?: string;
  href?: string;
  localRef?: string;
}

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "markdown"; markdown: string }
  | { type: "code"; code: string; language?: string }
  | { type: "table"; html: string }
  | { type: "link"; href: string; text?: string }
  | { type: "image"; src?: string; alt?: string; localRef?: string }
  | { type: "file"; name: string; mimeType?: string; localRef?: string };

export interface ArchiveMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool" | "unknown";
  authorLabel?: string;
  createdAt?: string;
  contentBlocks: ContentBlock[];
}

export interface ExportEvent {
  id: string;
  format: "markdown" | "json" | "pdf" | "docx" | "zip";
  createdAt: string;
}

export interface ArchiveRecord {
  id: string;
  projectId?: string;
  platform: SupportedPlatform;
  sourceUrl: string;
  sourceTitle?: string;
  sourceAccountLabel?: string;
  capturedAt: string;
  originalCreatedAt?: string;
  originalUpdatedAt?: string;
  modelName?: string;
  messages: ArchiveMessage[];
  attachments: ArchiveAttachment[];
  tags: string[];
  notes?: string;
  summary?: string;
  cleanText: string;
  rawSnapshotHtml?: string;
  dedupeHash: string;
  exportCount: number;
  exportHistory: ExportEvent[];
  isFallbackCapture?: boolean;
}

export interface CaptureDraft {
  sourceTitle?: string;
  platform: SupportedPlatform;
  sourceUrl: string;
  modelName?: string;
  messages: ArchiveMessage[];
  attachments: ArchiveAttachment[];
  cleanText: string;
  rawSnapshotHtml?: string;
  originalCreatedAt?: string;
  originalUpdatedAt?: string;
  isFallbackCapture?: boolean;
}

export interface SearchFilters {
  projectId?: string;
  tags?: string[];
  platform?: SupportedPlatform;
  modelName?: string;
  hasAttachments?: boolean;
  dateFrom?: string;
  dateTo?: string;
}
