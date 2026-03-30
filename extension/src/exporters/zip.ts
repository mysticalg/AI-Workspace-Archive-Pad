import JSZip from "jszip";
import type { ArchiveRecord } from "types/archive";
import type { Project } from "types/project";
import { archiveRecordToDocxBlob } from "./docx";
import { archiveRecordToJson } from "./json";
import { archiveRecordToMarkdown } from "./markdown";
import { archiveRecordToPdfBlob } from "./pdf";

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function projectToZipBlob(project: Project, records: ArchiveRecord[]) {
  const zip = new JSZip();
  const folder = zip.folder(slug(project.title) || "project-export");
  if (!folder) {
    throw new Error("Unable to create project export");
  }

  folder.file(
    "manifest.json",
    JSON.stringify(
      {
        project,
        exportedAt: new Date().toISOString(),
        recordCount: records.length,
      },
      null,
      2,
    ),
  );

  for (const record of records) {
    const base = slug(record.sourceTitle || record.id) || record.id;
    folder.file(`${base}.md`, archiveRecordToMarkdown(record, project));
    folder.file(`${base}.json`, archiveRecordToJson(record, true));
    folder.file(`${base}.pdf`, await archiveRecordToPdfBlob(record, project));
    folder.file(`${base}.docx`, await archiveRecordToDocxBlob(record, project));
  }

  return zip.generateAsync({ type: "blob" });
}
