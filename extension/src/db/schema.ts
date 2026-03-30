import { z } from "zod";

export const contentBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("markdown"), markdown: z.string() }),
  z.object({
    type: z.literal("code"),
    code: z.string(),
    language: z.string().optional(),
  }),
  z.object({ type: z.literal("table"), html: z.string() }),
  z.object({
    type: z.literal("link"),
    href: z.string(),
    text: z.string().optional(),
  }),
  z.object({
    type: z.literal("image"),
    src: z.string().optional(),
    alt: z.string().optional(),
    localRef: z.string().optional(),
  }),
  z.object({
    type: z.literal("file"),
    name: z.string(),
    mimeType: z.string().optional(),
    localRef: z.string().optional(),
  }),
]);

export const archiveRecordSchema = z.object({
  id: z.string(),
  platform: z.enum([
    "chatgpt",
    "claude",
    "gemini",
    "perplexity",
    "copilot",
    "other",
  ]),
  sourceUrl: z.string(),
  sourceTitle: z.string().optional(),
  sourceAccountLabel: z.string().optional(),
  capturedAt: z.string(),
  originalCreatedAt: z.string().optional(),
  originalUpdatedAt: z.string().optional(),
  modelName: z.string().optional(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system", "tool", "unknown"]),
      authorLabel: z.string().optional(),
      createdAt: z.string().optional(),
      contentBlocks: z.array(contentBlockSchema),
    }),
  ),
  attachments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      mimeType: z.string().optional(),
      href: z.string().optional(),
      localRef: z.string().optional(),
    }),
  ),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  summary: z.string().optional(),
  cleanText: z.string(),
  rawSnapshotHtml: z.string().optional(),
  dedupeHash: z.string(),
  exportCount: z.number(),
  exportHistory: z.array(
    z.object({
      id: z.string(),
      format: z.enum(["markdown", "json", "pdf", "docx", "zip"]),
      createdAt: z.string(),
    }),
  ),
  projectId: z.string().optional(),
  isFallbackCapture: z.boolean().optional(),
});
