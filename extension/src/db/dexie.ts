import Dexie, { type Table } from "dexie";
import type { ArchiveRecord } from "types/archive";
import type { Project } from "types/project";
import type { Settings } from "types/settings";
import type { Snippet } from "types/snippet";

export class ArchiveDexie extends Dexie {
  projects!: Table<Project, string>;
  archiveRecords!: Table<ArchiveRecord, string>;
  snippets!: Table<Snippet, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("ai-workspace-archive");
    this.version(1).stores({
      projects: "id, title, updatedAt, status, *tags",
      archiveRecords:
        "id, projectId, platform, capturedAt, sourceTitle, modelName, dedupeHash, *tags",
      snippets: "id, projectId, archiveRecordId, kind, title, createdAt, *tags",
      settings: "id",
    });
  }
}

export const db = new ArchiveDexie();

