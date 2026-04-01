import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ArchiveRecord, ContentBlock } from "types/archive";
import type { Project } from "types/project";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 48;

function renderBlock(block: ContentBlock) {
  switch (block.type) {
    case "text":
      return block.text;
    case "markdown":
      return block.markdown;
    case "code":
      return `${block.language ? `[${block.language}]` : "[code]"}\n${block.code}`;
    case "table":
      return block.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    case "link":
      return `${block.text || block.href} (${block.href})`;
    case "image":
      return `[image] ${block.alt ?? block.src ?? ""}`;
    case "file":
      return `[file] ${block.name}`;
  }
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const lines: string[] = [];

  for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
    if (paragraph.trim().length === 0) {
      lines.push("");
      continue;
    }

    let currentLine = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

export async function archiveRecordToPdfBlob(
  record: ArchiveRecord,
  project?: Project,
  options?: { pageBreakBetweenTurns?: boolean },
) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  const pageWidth = page.getWidth() - MARGIN * 2;
  let y = page.getHeight() - MARGIN;

  const addPage = () => {
    page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    y = page.getHeight() - MARGIN;
  };

  const ensureSpace = (height: number) => {
    if (y - height < MARGIN) {
      addPage();
    }
  };

  const writeText = (
    text: string,
    fontSize = 11,
    font: PDFFont = regular,
    color = rgb(0.04, 0.08, 0.15),
  ) => {
    const lineHeight = fontSize + 5;
    const lines = wrapText(text, font, fontSize, pageWidth);

    for (const line of lines) {
      ensureSpace(lineHeight);
      if (line) {
        page.drawText(line, {
          x: MARGIN,
          y: y - fontSize,
          size: fontSize,
          font,
          color,
        });
      }
      y -= lineHeight;
    }

    y -= 8;
  };

  ensureSpace(48);
  page.drawRectangle({
    x: MARGIN,
    y: y - 32,
    width: pageWidth,
    height: 32,
    color: rgb(0.93, 0.96, 1),
  });
  page.drawText(record.platform.toUpperCase(), {
    x: MARGIN + 14,
    y: y - 20,
    size: 13,
    font: bold,
    color: rgb(0.1, 0.24, 0.47),
  });
  y -= 48;

  writeText(record.sourceTitle ?? "Untitled capture", 22, bold);
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
      addPage();
    }

    writeText(`Turn ${index + 1} - ${message.role}`, 13, bold);
    writeText(message.contentBlocks.map(renderBlock).join("\n\n"), 11);
  });

  const pdfBytes = await doc.save();
  const output = new Uint8Array(pdfBytes.byteLength);
  output.set(pdfBytes);
  return new Blob([output], { type: "application/pdf" });
}
