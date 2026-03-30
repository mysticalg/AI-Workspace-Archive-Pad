import jsPDF from "jspdf";
import type { ArchiveRecord, ContentBlock } from "types/archive";
import type { Project } from "types/project";

function renderBlock(block: ContentBlock) {
  switch (block.type) {
    case "text":
      return block.text;
    case "markdown":
      return block.markdown;
    case "code":
      return `${block.language ? `[${block.language}]` : "[code]"}\n${block.code}`;
    case "table":
      return block.html.replace(/<[^>]+>/g, " ");
    case "link":
      return `${block.text || block.href} (${block.href})`;
    case "image":
      return `[image] ${block.alt ?? block.src ?? ""}`;
    case "file":
      return `[file] ${block.name}`;
  }
}

export async function archiveRecordToPdfBlob(
  record: ArchiveRecord,
  project?: Project,
  options?: { pageBreakBetweenTurns?: boolean },
) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const writeText = (text: string, fontSize = 11, font = "helvetica", style = "normal") => {
    doc.setFont(font, style);
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, pageWidth);

    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += fontSize + 5;
    }

    y += 8;
  };

  doc.setFillColor("#edf5ff");
  doc.roundedRect(margin, y, pageWidth, 32, 12, 12, "F");
  doc.setTextColor("#1a3d78");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(record.platform.toUpperCase(), margin + 14, y + 20);
  y += 48;

  doc.setTextColor("#0b1527");
  writeText(record.sourceTitle ?? "Untitled capture", 22, "helvetica", "bold");
  writeText(`Captured ${record.capturedAt}`, 10);
  writeText(`Source ${record.sourceUrl}`, 10);
  if (record.modelName) {
    writeText(`Model ${record.modelName}`, 10);
  }
  if (project) {
    writeText(`Project ${project.title}`, 10);
  }
  if (record.notes) {
    writeText(`Notes ${record.notes}`, 10);
  }

  record.messages.forEach((message, index) => {
    if (index > 0 && options?.pageBreakBetweenTurns) {
      doc.addPage();
      y = margin;
    }

    writeText(`Turn ${index + 1} · ${message.role}`, 13, "helvetica", "bold");
    writeText(message.contentBlocks.map(renderBlock).join("\n\n"), 11);
  });

  return doc.output("blob");
}
