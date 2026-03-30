import { describe, expect, it } from "vitest";
import type { ArchiveRecord } from "types/archive";
import type { Project } from "types/project";
import { archiveRecordToMarkdown } from "./markdown";

const project: Project = {
  id: "project-1",
  title: "Launch",
  tags: ["release"],
  status: "active",
  createdAt: "2026-03-30T00:00:00.000Z",
  updatedAt: "2026-03-30T00:00:00.000Z",
  exportHistory: [],
};

const record: ArchiveRecord = {
  id: "record-1",
  projectId: "project-1",
  platform: "chatgpt",
  sourceUrl: "https://chatgpt.com/c/1",
  sourceTitle: "Release checklist",
  capturedAt: "2026-03-30T10:00:00.000Z",
  modelName: "gpt-4.1",
  messages: [
    {
      id: "msg-1",
      role: "user",
      contentBlocks: [{ type: "text", text: "Draft the release checklist." }],
    },
    {
      id: "msg-2",
      role: "assistant",
      contentBlocks: [{ type: "code", code: "npm run build", language: "bash" }],
    },
  ],
  attachments: [],
  tags: ["release"],
  cleanText: "Draft the release checklist.",
  dedupeHash: "hash-1",
  exportCount: 0,
  exportHistory: [],
};

describe("archiveRecordToMarkdown", () => {
  it("renders frontmatter when enabled", () => {
    const markdown = archiveRecordToMarkdown(record, project, true);
    expect(markdown).toContain('title: "Release checklist"');
    expect(markdown).toContain("## Turn 1 - user");
  });

  it("omits frontmatter when disabled", () => {
    const markdown = archiveRecordToMarkdown(record, project, false);
    expect(markdown.startsWith("---")).toBe(false);
    expect(markdown).toContain("```bash");
  });
});
