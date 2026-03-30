import { describe, expect, it } from "vitest";
import type { ArchiveRecord } from "types/archive";
import type { Project } from "types/project";
import { searchArchive } from "./search";

const projects: Project[] = [
  {
    id: "project-1",
    title: "Launch",
    tags: ["release"],
    status: "active",
    createdAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:00:00.000Z",
    exportHistory: [],
  },
];

const records: ArchiveRecord[] = [
  {
    id: "record-1",
    projectId: "project-1",
    platform: "chatgpt",
    sourceUrl: "https://chatgpt.com/c/1",
    sourceTitle: "Release checklist",
    capturedAt: "2026-03-30T10:00:00.000Z",
    modelName: "gpt-4.1",
    messages: [],
    attachments: [],
    tags: ["release", "checklist"],
    cleanText: "Finalize QA, docs, and launch checklist",
    dedupeHash: "hash-1",
    exportCount: 0,
    exportHistory: [],
  },
  {
    id: "record-2",
    platform: "claude",
    sourceUrl: "https://claude.ai/chat/2",
    sourceTitle: "Research notes",
    capturedAt: "2026-03-29T10:00:00.000Z",
    modelName: "sonnet",
    messages: [],
    attachments: [],
    tags: ["research"],
    cleanText: "Parser hardening notes",
    dedupeHash: "hash-2",
    exportCount: 0,
    exportHistory: [],
  },
];

describe("searchArchive", () => {
  it("matches full-text queries", () => {
    const results = searchArchive(records, projects, "launch checklist");
    expect(results.map((record) => record.id)).toEqual(["record-1"]);
  });

  it("applies project and platform filters", () => {
    const results = searchArchive(records, projects, "", {
      projectId: "project-1",
      platform: "chatgpt",
    });
    expect(results.map((record) => record.id)).toEqual(["record-1"]);
  });
});

