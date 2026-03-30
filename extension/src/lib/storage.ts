import { db } from "db/dexie";
import { createDedupeHash } from "lib/dedupe";
import { cleanTextFromMessages, summarizeRecord } from "lib/normalize";
import { hasPro } from "lib/featureFlags";
import type { ArchiveRecord, CaptureDraft } from "types/archive";
import type { Project } from "types/project";
import type { Settings } from "types/settings";
import type { Snippet } from "types/snippet";

const DEFAULT_SETTINGS: Settings = {
  id: "settings",
  storageMode: "local-only",
  enabledPlatforms: ["chatgpt", "claude", "gemini"],
  defaultTags: [],
  exportDefaults: {
    includeFrontmatter: true,
    includeRawSnapshot: false,
    pageBreakBetweenTurns: false,
  },
  billing: {
    tier: "free",
    licenseState: "inactive",
  },
  onboardingCompleted: false,
};

function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function ensureSettings() {
  const existing = await db.settings.get("settings");
  if (existing) {
    return existing;
  }

  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function ensureStarterProject() {
  const projects = await db.projects.toArray();
  if (projects.length > 0) {
    return projects[0];
  }

  const now = new Date().toISOString();
  const project: Project = {
    id: uid("project"),
    title: "Inbox",
    description: "Default landing project for first captures.",
    tags: [],
    status: "active",
    color: "#3f7cff",
    createdAt: now,
    updatedAt: now,
    exportHistory: [],
  };
  await db.projects.add(project);

  const settings = await ensureSettings();
  await db.settings.put({
    ...settings,
    defaultProjectId: project.id,
  });

  return project;
}

export async function getAppState() {
  const [settings, starter, projects, records, snippets] = await Promise.all([
    ensureSettings(),
    ensureStarterProject(),
    db.projects.orderBy("updatedAt").reverse().toArray(),
    db.archiveRecords.orderBy("capturedAt").reverse().toArray(),
    db.snippets.orderBy("createdAt").reverse().toArray(),
  ]);

  return {
    settings,
    starter,
    projects,
    records,
    snippets,
  };
}

export async function saveArchiveRecord(
  draft: CaptureDraft,
  options: { projectId?: string; tags?: string[]; notes?: string; titleOverride?: string } = {},
) {
  const now = new Date().toISOString();
  const cleanText = cleanTextFromMessages(draft.messages, draft.cleanText);
  const dedupeHash = await createDedupeHash({
    platform: draft.platform,
    sourceUrl: draft.sourceUrl,
    sourceTitle: options.titleOverride ?? draft.sourceTitle,
    modelName: draft.modelName,
    cleanText,
  });

  const existing = await db.archiveRecords.where("dedupeHash").equals(dedupeHash).first();
  if (existing) {
    return { record: existing, deduped: true };
  }

  const record: ArchiveRecord = {
    id: uid("record"),
    projectId: options.projectId,
    platform: draft.platform,
    sourceUrl: draft.sourceUrl,
    sourceTitle: options.titleOverride ?? draft.sourceTitle,
    capturedAt: now,
    originalCreatedAt: draft.originalCreatedAt,
    originalUpdatedAt: draft.originalUpdatedAt,
    modelName: draft.modelName,
    messages: draft.messages,
    attachments: draft.attachments,
    tags: options.tags ?? [],
    notes: options.notes,
    summary: summarizeRecord({ cleanText }),
    cleanText,
    rawSnapshotHtml: draft.rawSnapshotHtml,
    dedupeHash,
    exportCount: 0,
    exportHistory: [],
    isFallbackCapture: draft.isFallbackCapture,
  };

  await db.archiveRecords.add(record);

  if (record.projectId) {
    const project = await db.projects.get(record.projectId);
    if (project) {
      await db.projects.put({
        ...project,
        updatedAt: now,
      });
    }
  }

  return { record, deduped: false };
}

export async function saveSnippet(
  snippet: Omit<Snippet, "id" | "createdAt">,
) {
  const value: Snippet = {
    ...snippet,
    id: uid("snippet"),
    createdAt: new Date().toISOString(),
  };

  await db.snippets.add(value);
  return value;
}

export async function upsertProject(
  project: Partial<Project> & { title: string; id?: string },
) {
  const now = new Date().toISOString();
  const existing = project.id ? await db.projects.get(project.id) : undefined;
  const value: Project = {
    id: existing?.id ?? uid("project"),
    title: project.title,
    description: project.description,
    tags: project.tags ?? existing?.tags ?? [],
    status: project.status ?? existing?.status ?? "active",
    color: project.color ?? existing?.color ?? "#3f7cff",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    memberIds: project.memberIds ?? existing?.memberIds,
    exportHistory: existing?.exportHistory ?? [],
  };

  await db.projects.put(value);
  return value;
}

export async function markExport(
  recordIds: string[],
  format: "markdown" | "json" | "pdf" | "docx" | "zip",
  projectId?: string,
) {
  const createdAt = new Date().toISOString();

  await db.transaction("rw", db.archiveRecords, db.projects, async () => {
    for (const recordId of recordIds) {
      const record = await db.archiveRecords.get(recordId);
      if (!record) {
        continue;
      }

      await db.archiveRecords.put({
        ...record,
        exportCount: record.exportCount + 1,
        exportHistory: [
          ...record.exportHistory,
          {
            id: uid("export"),
            format,
            createdAt,
          },
        ],
      });
    }

    if (projectId) {
      const project = await db.projects.get(projectId);
      if (project) {
        project.exportHistory.push({
          id: uid("project_export"),
          projectId,
          format,
          createdAt,
          recordIds,
        });
        project.updatedAt = createdAt;
        await db.projects.put(project);
      }
    }
  });
}

export async function wipeLocalData() {
  await db.transaction(
    "rw",
    db.archiveRecords,
    db.projects,
    db.snippets,
    db.settings,
    async () => {
      await Promise.all([
        db.archiveRecords.clear(),
        db.projects.clear(),
        db.snippets.clear(),
        db.settings.clear(),
      ]);
    },
  );

  await ensureSettings();
  await ensureStarterProject();
}

export async function importNormalizedJson(text: string) {
  const parsed = JSON.parse(text) as Partial<{
    projects: Project[];
    records: ArchiveRecord[];
    snippets: Snippet[];
  }>;

  await db.transaction(
    "rw",
    db.projects,
    db.archiveRecords,
    db.snippets,
    async () => {
      if (parsed.projects?.length) {
        await db.projects.bulkPut(parsed.projects);
      }

      if (parsed.records?.length) {
        await db.archiveRecords.bulkPut(parsed.records);
      }

      if (parsed.snippets?.length) {
        await db.snippets.bulkPut(parsed.snippets);
      }
    },
  );
}

export async function canCreateMoreProjects() {
  const [settings, count] = await Promise.all([
    ensureSettings(),
    db.projects.count(),
  ]);
  return hasPro(settings) || count < 5;
}
