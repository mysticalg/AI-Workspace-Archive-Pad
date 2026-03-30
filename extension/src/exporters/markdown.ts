import type { ArchiveRecord, ContentBlock } from "types/archive";
import type { Project } from "types/project";

function renderBlock(block: ContentBlock) {
  switch (block.type) {
    case "text":
      return block.text;
    case "markdown":
      return block.markdown;
    case "code":
      return `\`\`\`${block.language ?? ""}\n${block.code}\n\`\`\``;
    case "table":
      return block.html;
    case "link":
      return `[${block.text || block.href}](${block.href})`;
    case "image":
      return block.src ? `![${block.alt ?? ""}](${block.src})` : block.alt ?? "";
    case "file":
      return `Attachment: ${block.name}`;
  }
}

export function archiveRecordToMarkdown(
  record: ArchiveRecord,
  project?: Project,
  includeFrontmatter = true,
) {
  const frontmatter = includeFrontmatter
    ? [
        "---",
        `title: "${(record.sourceTitle ?? "Untitled capture").replace(/"/g, '\\"')}"`,
        `platform: "${record.platform}"`,
        `capturedAt: "${record.capturedAt}"`,
        `modelName: "${record.modelName ?? ""}"`,
        `project: "${project?.title ?? ""}"`,
        `sourceUrl: "${record.sourceUrl}"`,
        `tags: [${record.tags.map((tag) => `"${tag}"`).join(", ")}]`,
        "---",
        "",
      ].join("\n")
    : "";

  const header = [
    `# ${record.sourceTitle ?? "Untitled capture"}`,
    "",
    `- Platform: ${record.platform}`,
    `- Captured: ${record.capturedAt}`,
    `- Model: ${record.modelName ?? "Unknown"}`,
    `- Source: ${record.sourceUrl}`,
    project ? `- Project: ${project.title}` : null,
    record.notes ? `- Notes: ${record.notes}` : null,
    "",
  ]
    .filter(Boolean)
    .join("\n");

  const body = record.messages
    .map((message, index) => {
      const blocks = message.contentBlocks.map(renderBlock).join("\n\n");
      return `## Turn ${index + 1} - ${message.role}\n\n${blocks}`;
    })
    .join("\n\n");

  return `${frontmatter}${header}${body}\n`;
}
