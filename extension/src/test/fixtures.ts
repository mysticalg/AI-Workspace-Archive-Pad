import type { ArchiveRecord, CaptureDraft } from "types/archive";
import type { Project } from "types/project";
import type { Snippet } from "types/snippet";

export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    title: "Launch",
    description: "Chrome Web Store launch project.",
    tags: ["release"],
    status: "active",
    color: "#3f7cff",
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:00.000Z",
    exportHistory: [],
    ...overrides,
  };
}

export function makeRecord(overrides: Partial<ArchiveRecord> = {}): ArchiveRecord {
  return {
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
    notes: "Verify production readiness before submission.",
    cleanText: "Draft the release checklist.",
    rawSnapshotHtml: "<article>Release checklist</article>",
    dedupeHash: "hash-1",
    exportCount: 0,
    exportHistory: [],
    ...overrides,
  };
}

export function makeCaptureDraft(overrides: Partial<CaptureDraft> = {}): CaptureDraft {
  return {
    platform: "chatgpt",
    sourceUrl: "https://chatgpt.com/c/demo",
    sourceTitle: "Demo capture",
    modelName: "gpt-4.1",
    messages: [
      {
        id: "msg-user",
        role: "user",
        contentBlocks: [{ type: "text", text: "Draft the release checklist." }],
      },
      {
        id: "msg-assistant",
        role: "assistant",
        contentBlocks: [{ type: "text", text: "Run build, tests, and store QA." }],
      },
    ],
    attachments: [],
    cleanText: "Draft the release checklist. Run build, tests, and store QA.",
    rawSnapshotHtml: "<article>Demo capture</article>",
    ...overrides,
  };
}

export function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
  return {
    id: "snippet-1",
    projectId: "project-1",
    archiveRecordId: "record-1",
    kind: "decision",
    title: "Launch decision",
    body: "Ship local-first first, then add paid sync later.",
    tags: ["release"],
    sourceUrl: "https://chatgpt.com/c/1",
    platform: "chatgpt",
    createdAt: "2026-03-30T11:00:00.000Z",
    ...overrides,
  };
}
