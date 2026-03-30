import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "docx";
import type { ArchiveRecord } from "types/archive";
import type { Project } from "types/project";

function paragraphFromBlock(block: ArchiveRecord["messages"][number]["contentBlocks"][number]) {
  switch (block.type) {
    case "text":
      return new Paragraph(block.text);
    case "markdown":
      return new Paragraph(block.markdown);
    case "code":
      return new Paragraph({
        children: [new TextRun({ text: block.code, font: "Courier New" })],
      });
    case "table":
      return new Paragraph(block.html.replace(/<[^>]+>/g, " "));
    case "link":
      return new Paragraph(`${block.text || block.href} (${block.href})`);
    case "image":
      return new Paragraph(`[image] ${block.alt ?? block.src ?? ""}`);
    case "file":
      return new Paragraph(`[file] ${block.name}`);
  }
}

export async function archiveRecordToDocxBlob(record: ArchiveRecord, project?: Project) {
  const metadataTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Platform")] }),
          new TableCell({ children: [new Paragraph(record.platform)] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Captured")] }),
          new TableCell({ children: [new Paragraph(record.capturedAt)] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Model")] }),
          new TableCell({ children: [new Paragraph(record.modelName ?? "Unknown")] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Project")] }),
          new TableCell({ children: [new Paragraph(project?.title ?? "")] }),
        ],
      }),
    ],
  });

  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: record.sourceTitle ?? "Untitled capture",
            heading: HeadingLevel.TITLE,
          }),
          metadataTable,
          ...record.messages.flatMap((message, index) => [
            new Paragraph({
              text: `Turn ${index + 1} · ${message.role}`,
              heading: HeadingLevel.HEADING_2,
            }),
            ...message.contentBlocks.map(paragraphFromBlock),
          ]),
        ],
      },
    ],
  });

  return Packer.toBlob(document);
}

