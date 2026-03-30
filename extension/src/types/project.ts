export type ProjectStatus = "active" | "draft" | "archived" | "approved";

export interface Project {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  status: ProjectStatus;
  color?: string;
  createdAt: string;
  updatedAt: string;
  memberIds?: string[];
  exportHistory: ProjectExportEvent[];
}

export interface ProjectExportEvent {
  id: string;
  projectId: string;
  format: "markdown" | "json" | "pdf" | "docx" | "zip";
  createdAt: string;
  recordIds: string[];
}

export interface ProjectDefaults {
  defaultProjectId?: string;
  defaultTags: string[];
}
