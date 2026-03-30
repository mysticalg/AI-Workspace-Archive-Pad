import MiniSearch from "minisearch";
import type { ArchiveRecord, SearchFilters } from "types/archive";
import type { Project } from "types/project";

interface SearchDoc {
  id: string;
  sourceTitle: string;
  cleanText: string;
  tags: string[];
  notes: string;
  projectTitle: string;
  platform: string;
  modelName: string;
}

function filterRecord(record: ArchiveRecord, filters: SearchFilters) {
  if (filters.projectId && record.projectId !== filters.projectId) {
    return false;
  }

  if (filters.platform && record.platform !== filters.platform) {
    return false;
  }

  if (filters.modelName && record.modelName !== filters.modelName) {
    return false;
  }

  if (filters.hasAttachments && record.attachments.length === 0) {
    return false;
  }

  if (filters.tags?.length) {
    const recordTags = new Set(record.tags);
    if (!filters.tags.every((tag) => recordTags.has(tag))) {
      return false;
    }
  }

  const capturedAt = Date.parse(record.capturedAt);
  if (filters.dateFrom && capturedAt < Date.parse(filters.dateFrom)) {
    return false;
  }

  if (filters.dateTo && capturedAt > Date.parse(filters.dateTo)) {
    return false;
  }

  return true;
}

export function searchArchive(
  records: ArchiveRecord[],
  projects: Project[],
  query: string,
  filters: SearchFilters = {},
) {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const search = new MiniSearch<SearchDoc>({
    fields: ["sourceTitle", "cleanText", "tags", "notes", "projectTitle", "platform", "modelName"],
    storeFields: [
      "id",
      "sourceTitle",
      "cleanText",
      "platform",
      "projectTitle",
      "tags",
      "modelName",
    ],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
    },
  });

  search.addAll(
    records.map((record) => ({
      id: record.id,
      sourceTitle: record.sourceTitle ?? "",
      cleanText: record.cleanText,
      tags: record.tags,
      notes: record.notes ?? "",
      projectTitle: projectById.get(record.projectId ?? "")?.title ?? "",
      platform: record.platform,
      modelName: record.modelName ?? "",
    })),
  );

  const filteredRecords = records.filter((record) => filterRecord(record, filters));
  if (!query.trim()) {
    return filteredRecords.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  }

  const allowedIds = new Set(filteredRecords.map((record) => record.id));
  const results = search.search(query);

  return results
    .filter((result) => allowedIds.has(result.id))
    .map((result) => filteredRecords.find((record) => record.id === result.id))
    .filter((record): record is ArchiveRecord => Boolean(record));
}

