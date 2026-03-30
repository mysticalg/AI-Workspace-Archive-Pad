import { db } from "db/dexie";
import { parseImportFile } from "lib/importers";
import {
  hasPlatformPermission,
  removePlatformPermission,
} from "lib/permissions";
import { unwrapRuntimeResponse } from "lib/runtime";
import { searchArchive } from "lib/search";
import {
  canCreateMoreProjects,
  ensureSettings,
  getAppState,
  mergeImportBundle,
  markExport,
  upsertProject,
} from "lib/storage";
import type { ArchiveRecord, SearchFilters } from "types/archive";
import type { SupportedPlatform } from "types/archive";
import type { ExportFormat } from "./messaging";

type CaptureResponse = {
  record: ArchiveRecord;
  deduped: boolean;
};

type PermissionResponse = {
  granted: boolean;
  platform: string;
  reason?: string;
};

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function loadAppData() {
  const state = await getAppState();
  return {
    projects: state.projects,
    records: state.records,
    snippets: state.snippets,
    settings: state.settings,
  };
}

export async function createProject(title: string, description?: string) {
  if (!(await canCreateMoreProjects())) {
    throw new Error("Free tier supports up to 5 projects. Upgrade to Pro for unlimited projects.");
  }

  return upsertProject({
    title,
    description,
    tags: [],
    status: "active",
  });
}

export async function updateSettings(
  updater: Parameters<typeof db.settings.put>[0] | ((current: Awaited<ReturnType<typeof ensureSettings>>) => Awaited<ReturnType<typeof ensureSettings>>),
) {
  const current = await ensureSettings();
  const next = typeof updater === "function" ? updater(current) : updater;
  await db.settings.put(next);
  return next;
}

export async function deleteRecord(recordId: string) {
  await db.archiveRecords.delete(recordId);
}

export async function deleteSnippet(snippetId: string) {
  await db.snippets.delete(snippetId);
}

export async function searchRecords(query: string, filters: SearchFilters = {}) {
  const { projects, records } = await loadAppData();
  return searchArchive(records, projects, query, filters);
}

export async function openSidePanel() {
  return unwrapRuntimeResponse<{ ok: boolean }>(
    await chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL_REQUESTED" }),
  );
}

export async function captureCurrentPage(payload: {
  projectId?: string;
  tags?: string[];
  notes?: string;
}) {
  return unwrapRuntimeResponse<CaptureResponse>(
    await chrome.runtime.sendMessage({
      type: "CAPTURE_CURRENT_PAGE",
      payload,
    }),
  );
}

export async function captureSelection(payload: {
  projectId?: string;
  tags?: string[];
  notes?: string;
}) {
  return unwrapRuntimeResponse<CaptureResponse>(
    await chrome.runtime.sendMessage({
      type: "CAPTURE_SELECTION",
      payload,
    }),
  );
}

export async function captureLastExchange(payload: {
  projectId?: string;
  tags?: string[];
  notes?: string;
}) {
  return unwrapRuntimeResponse<CaptureResponse>(
    await chrome.runtime.sendMessage({
      type: "CAPTURE_LAST_EXCHANGE",
      payload,
    }),
  );
}

export async function requestPageStatus() {
  return chrome.runtime.sendMessage({ type: "GET_PAGE_STATUS" });
}

export async function requestCurrentPlatformPermission() {
  return requestPlatformPermission();
}

export async function requestPlatformPermission(platform?: SupportedPlatform) {
  return unwrapRuntimeResponse<PermissionResponse>(
    await chrome.runtime.sendMessage({
      type: "REQUEST_PLATFORM_PERMISSION",
      payload: platform ? { platform } : undefined,
    }),
  );
}

export async function revokePlatformPermission(platform: SupportedPlatform) {
  return removePlatformPermission(platform);
}

export async function getPlatformPermissionStatuses(platforms: SupportedPlatform[]) {
  const statuses = await Promise.all(
    platforms.map(async (platform) => [platform, await hasPlatformPermission(platform)] as const),
  );
  return Object.fromEntries(statuses) as Record<SupportedPlatform, boolean>;
}

export async function wipeData() {
  return unwrapRuntimeResponse<{ ok: boolean }>(
    await chrome.runtime.sendMessage({ type: "WIPE_LOCAL_DATA" }),
  );
}

export async function importJsonFile(text: string) {
  return unwrapRuntimeResponse<{ ok: boolean }>(
    await chrome.runtime.sendMessage({
      type: "IMPORT_FILE",
      payload: { text },
    }),
  );
}

export async function importArchiveFile(file: File) {
  const bundle = await parseImportFile(file);
  return mergeImportBundle(bundle);
}

async function resolveRecordBlob(record: ArchiveRecord, format: Exclude<ExportFormat, "zip">) {
  const project = record.projectId ? await db.projects.get(record.projectId) : undefined;
  const settings = await ensureSettings();

  switch (format) {
    case "markdown": {
      const { archiveRecordToMarkdown } = await import("exporters/markdown");
      return new Blob(
        [archiveRecordToMarkdown(record, project, settings.exportDefaults.includeFrontmatter)],
        {
          type: "text/markdown;charset=utf-8",
        },
      );
    }
    case "json": {
      const { archiveRecordToJson } = await import("exporters/json");
      return new Blob(
        [archiveRecordToJson(record, settings.exportDefaults.includeRawSnapshot)],
        {
          type: "application/json;charset=utf-8",
        },
      );
    }
    case "pdf": {
      const { archiveRecordToPdfBlob } = await import("exporters/pdf");
      return archiveRecordToPdfBlob(record, project, {
        pageBreakBetweenTurns: settings.exportDefaults.pageBreakBetweenTurns,
      });
    }
    case "docx": {
      const { archiveRecordToDocxBlob } = await import("exporters/docx");
      return archiveRecordToDocxBlob(record, project);
    }
  }

  throw new Error(`Unsupported export format: ${String(format)}`);
}

export async function exportRecord(recordId: string, format: Exclude<ExportFormat, "zip">) {
  const record = await db.archiveRecords.get(recordId);
  if (!record) {
    throw new Error("Record not found");
  }

  const blob = await resolveRecordBlob(record, format);
  await markExport([record.id], format, record.projectId);
  downloadBlob(`${slug(record.sourceTitle ?? record.id)}.${format === "markdown" ? "md" : format}`, blob);
}

export async function exportProject(projectId: string, format: ExportFormat) {
  const project = await db.projects.get(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const records = await db.archiveRecords.where("projectId").equals(projectId).toArray();
  if (records.length === 0) {
    throw new Error("Project has no archive records");
  }

  if (format === "zip") {
    const { projectToZipBlob } = await import("exporters/zip");
    const blob = await projectToZipBlob(project, records);
    await markExport(records.map((record) => record.id), "zip", projectId);
    downloadBlob(`${slug(project.title)}.zip`, blob);
    return;
  }

  const fileExt = format === "markdown" ? "md" : format;
  const joined = await Promise.all(
    records.map(async (record) => ({
      name: `${slug(record.sourceTitle ?? record.id)}.${fileExt}`,
      blob: await resolveRecordBlob(record, format),
    })),
  );

  for (const file of joined) {
    downloadBlob(file.name, file.blob);
  }
  await markExport(records.map((record) => record.id), format, projectId);
}

export function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
