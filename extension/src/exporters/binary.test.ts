import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { makeProject, makeRecord } from "../test/fixtures";
import { archiveRecordToDocxBlob } from "./docx";
import { archiveRecordToPdfBlob } from "./pdf";
import { projectToZipBlob } from "./zip";

async function blobToZip(blob: Blob) {
  return JSZip.loadAsync(await blob.arrayBuffer());
}

describe("binary exporters", () => {
  const project = makeProject();
  const record = makeRecord();

  it("creates a PDF blob with a PDF file signature", async () => {
    const blob = await archiveRecordToPdfBlob(record, project, {
      pageBreakBetweenTurns: true,
    });
    const bytes = new Uint8Array(await blob.arrayBuffer()).slice(0, 5);
    const signature = new TextDecoder().decode(bytes);

    expect(blob.type).toBe("application/pdf");
    expect(signature).toBe("%PDF-");
  });

  it("creates a DOCX blob with the expected Word document parts", async () => {
    const blob = await archiveRecordToDocxBlob(record, project);
    const zip = await blobToZip(blob);
    const documentXml = await zip.file("word/document.xml")?.async("string");

    expect(zip.file("[Content_Types].xml")).toBeTruthy();
    expect(documentXml).toContain("Release checklist");
    expect(documentXml).toContain("npm run build");
  });

  it("creates a ZIP export that contains the full project bundle", async () => {
    const blob = await projectToZipBlob(project, [record]);
    const zip = await blobToZip(blob);
    const folder = "launch";
    const manifest = await zip.file(`${folder}/manifest.json`)?.async("string");
    const jsonExport = await zip.file(`${folder}/release-checklist.json`)?.async("string");
    const pdfExport = await zip.file(`${folder}/release-checklist.pdf`)?.async("nodebuffer");
    const docxExport = await zip.file(`${folder}/release-checklist.docx`)?.async("nodebuffer");
    const markdownExport = await zip.file(`${folder}/release-checklist.md`)?.async("string");

    expect(manifest).toBeTruthy();
    expect(JSON.parse(manifest ?? "{}")).toMatchObject({
      project: { title: "Launch" },
      recordCount: 1,
    });
    expect(JSON.parse(jsonExport ?? "{}")).toMatchObject({
      sourceTitle: "Release checklist",
      rawSnapshotHtml: "<article>Release checklist</article>",
    });
    expect(markdownExport).toContain("# Release checklist");
    expect(new TextDecoder().decode(pdfExport?.subarray(0, 5))).toBe("%PDF-");
    expect(docxExport).toBeTruthy();
  });
});
