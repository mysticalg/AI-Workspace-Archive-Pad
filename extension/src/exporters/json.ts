import type { ArchiveRecord } from "types/archive";

function stableSort(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableSort);
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = stableSort((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }

  return value;
}

export function archiveRecordToJson(record: ArchiveRecord, includeRawSnapshot = false) {
  const payload = includeRawSnapshot
    ? record
    : {
        ...record,
        rawSnapshotHtml: undefined,
      };
  return JSON.stringify(stableSort(payload), null, 2);
}

