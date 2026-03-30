import type { ArchiveRecord, CaptureDraft } from "types/archive";

export function normalizeWhitespace(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+\n/g, "\n").trim();
}

export function cleanTextFromMessages(
  messages: CaptureDraft["messages"],
  fallbackText?: string,
) {
  const text = messages
    .map((message) =>
      message.contentBlocks
        .map((block) => {
          switch (block.type) {
            case "text":
              return block.text;
            case "markdown":
              return block.markdown;
            case "code":
              return block.code;
            case "table":
              return block.html.replace(/<[^>]+>/g, " ");
            case "link":
              return [block.text, block.href].filter(Boolean).join(" ");
            case "image":
              return block.alt ?? block.src ?? "";
            case "file":
              return block.name;
          }
        })
        .join("\n"),
    )
    .join("\n\n");

  return normalizeWhitespace(text || fallbackText || "");
}

export function summarizeRecord(record: Pick<ArchiveRecord, "cleanText">) {
  return normalizeWhitespace(record.cleanText).slice(0, 240);
}

