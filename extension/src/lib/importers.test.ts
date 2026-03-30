import { describe, expect, it } from "vitest";
import { parseImportText } from "./importers";

describe("parseImportText", () => {
  it("parses normalized archive JSON", async () => {
    const bundle = await parseImportText(
      JSON.stringify({
        projects: [
          {
            id: "project_1",
            title: "Imported",
            tags: [],
            status: "active",
            createdAt: "2026-03-30T00:00:00.000Z",
            updatedAt: "2026-03-30T00:00:00.000Z",
            exportHistory: [],
          },
        ],
        records: [],
        snippets: [],
      }),
      "archive.json",
    );

    expect(bundle.source).toBe("normalized-json");
    expect(bundle.projects).toHaveLength(1);
    expect(bundle.records).toHaveLength(0);
  });

  it("parses a ChatGPT conversations export", async () => {
    const bundle = await parseImportText(
      JSON.stringify([
        {
          id: "conversation-1",
          title: "Release plan",
          create_time: 1710000000,
          update_time: 1710000600,
          current_node: "node-2",
          mapping: {
            "node-1": {
              id: "node-1",
              parent: null,
              children: ["node-2"],
              message: {
                id: "message-1",
                author: { role: "user", name: "User" },
                create_time: 1710000000,
                content: { parts: ["Draft a release plan for this extension."] },
              },
            },
            "node-2": {
              id: "node-2",
              parent: "node-1",
              children: [],
              message: {
                id: "message-2",
                author: { role: "assistant", name: "ChatGPT" },
                create_time: 1710000300,
                metadata: { model_slug: "gpt-4.1" },
                content: { parts: ["Ship local-first MVP, then polish exports and search."] },
              },
            },
          },
        },
      ]),
      "conversations.json",
    );

    expect(bundle.source).toBe("chatgpt-export");
    expect(bundle.projects).toHaveLength(1);
    expect(bundle.records).toHaveLength(1);
    expect(bundle.records[0]?.platform).toBe("chatgpt");
    expect(bundle.records[0]?.messages).toHaveLength(2);
    expect(bundle.records[0]?.modelName).toBe("gpt-4.1");
  });
});

