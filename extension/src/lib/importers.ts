import { createDedupeHash } from "lib/dedupe";
import { cleanTextFromMessages, summarizeRecord } from "lib/normalize";
import type { ArchiveRecord, ArchiveMessage, ContentBlock } from "types/archive";
import type { Project } from "types/project";
import type { Snippet } from "types/snippet";

export interface ImportBundle {
  source: string;
  projects: Project[];
  records: ArchiveRecord[];
  snippets: Snippet[];
  warnings: string[];
}

type ChatGptConversation = {
  id?: string;
  conversation_id?: string;
  title?: string;
  create_time?: number | string;
  update_time?: number | string;
  current_node?: string;
  mapping?: Record<
    string,
    {
      id?: string;
      parent?: string | null;
      children?: string[];
      message?: {
        id?: string;
        author?: { role?: string; name?: string };
        create_time?: number | string;
        recipient?: string;
        metadata?: Record<string, unknown>;
        content?: {
          content_type?: string;
          parts?: unknown[];
        };
      };
    }
  >;
};

function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function toIso(value: unknown, fallback = nowIso()) {
  if (typeof value === "number") {
    return new Date(value * 1000).toISOString();
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && value.trim() !== "") {
      return new Date(numeric * 1000).toISOString();
    }

    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return fallback;
}

function inferRole(value: unknown): ArchiveMessage["role"] {
  if (
    value === "user" ||
    value === "assistant" ||
    value === "system" ||
    value === "tool"
  ) {
    return value;
  }

  return "unknown";
}

function blocksFromChatGptParts(parts: unknown[] | undefined): ContentBlock[] {
  if (!parts?.length) {
    return [];
  }

  return parts.reduce<ContentBlock[]>((blocks, part) => {
    if (typeof part === "string" && part.trim()) {
      blocks.push({ type: "text", text: part.trim() });
      return blocks;
    }

    if (part && typeof part === "object") {
      blocks.push({
        type: "markdown",
        markdown: JSON.stringify(part, null, 2),
      });
    }

    return blocks;
  }, []);
}

function orderedChatGptNodes(conversation: ChatGptConversation) {
  const nodes = Object.values(conversation.mapping ?? {});
  if (nodes.length === 0) {
    return [];
  }

  if (conversation.current_node && conversation.mapping?.[conversation.current_node]) {
    const path: typeof nodes = [];
    let current: (typeof nodes)[number] | undefined = conversation.mapping[conversation.current_node];

    while (current) {
      path.unshift(current);
      current = current.parent ? conversation.mapping?.[current.parent] : undefined;
    }

    return path;
  }

  return nodes.sort((left, right) => {
    const leftTime = Number(left.message?.create_time ?? 0);
    const rightTime = Number(right.message?.create_time ?? 0);
    return leftTime - rightTime;
  });
}

async function recordFromChatGptConversation(
  conversation: ChatGptConversation,
  projectId: string,
): Promise<ArchiveRecord | null> {
  const messages = orderedChatGptNodes(conversation).reduce<ArchiveMessage[]>((allMessages, node) => {
      const message = node.message;
      if (!message) {
        return allMessages;
      }

      const contentBlocks = blocksFromChatGptParts(message.content?.parts);
      if (contentBlocks.length === 0) {
        return allMessages;
      }

      allMessages.push({
        id: message.id ?? node.id ?? uid("msg"),
        role: inferRole(message.author?.role ?? message.recipient),
        authorLabel: message.author?.name,
        createdAt: toIso(message.create_time, toIso(conversation.create_time)),
        contentBlocks,
      });

      return allMessages;
    }, []);

  if (messages.length === 0) {
    return null;
  }

  const sourceUrl = `https://chatgpt.com/c/${conversation.id ?? conversation.conversation_id ?? uid("imported")}`;
  const sourceTitle = conversation.title?.trim() || "Imported ChatGPT conversation";
  const cleanText = cleanTextFromMessages(messages);
  const modelName = orderedChatGptNodes(conversation)
    .map((node) => node.message?.metadata?.model_slug)
    .find((value): value is string => typeof value === "string" && value.length > 0);
  const dedupeHash = await createDedupeHash({
    platform: "chatgpt",
    sourceUrl,
    sourceTitle,
    modelName,
    cleanText,
  });
  const capturedAt = toIso(conversation.update_time, toIso(conversation.create_time));

  return {
    id: uid("record"),
    projectId,
    platform: "chatgpt",
    sourceUrl,
    sourceTitle,
    capturedAt,
    originalCreatedAt: toIso(conversation.create_time, capturedAt),
    originalUpdatedAt: capturedAt,
    modelName,
    messages,
    attachments: [],
    tags: ["imported", "chatgpt-export"],
    summary: summarizeRecord({ cleanText }),
    cleanText,
    dedupeHash,
    exportCount: 0,
    exportHistory: [],
  };
}

function isNormalizedBundle(value: unknown): value is Partial<ImportBundle> {
  return Boolean(
    value &&
      typeof value === "object" &&
      ("records" in value || "projects" in value || "snippets" in value),
  );
}

function isChatGptExportArray(value: unknown): value is ChatGptConversation[] {
  return Array.isArray(value) && value.some((item) => item && typeof item === "object" && "mapping" in item);
}

function sanitizeImportedRecord(record: ArchiveRecord): ArchiveRecord {
  const cleanText = record.cleanText || cleanTextFromMessages(record.messages);
  return {
    ...record,
    id: record.id || uid("record"),
    capturedAt: record.capturedAt || nowIso(),
    tags: record.tags ?? [],
    exportCount: record.exportCount ?? 0,
    exportHistory: record.exportHistory ?? [],
    attachments: record.attachments ?? [],
    cleanText,
    summary: record.summary ?? summarizeRecord({ cleanText }),
  };
}

function sanitizeImportedProject(project: Project): Project {
  const now = nowIso();
  return {
    ...project,
    id: project.id || uid("project"),
    tags: project.tags ?? [],
    status: project.status ?? "active",
    createdAt: project.createdAt || now,
    updatedAt: project.updatedAt || now,
    exportHistory: project.exportHistory ?? [],
  };
}

function sanitizeImportedSnippet(snippet: Snippet): Snippet {
  return {
    ...snippet,
    id: snippet.id || uid("snippet"),
    tags: snippet.tags ?? [],
    createdAt: snippet.createdAt || nowIso(),
  };
}

export async function parseImportText(text: string, fileName = "import.json"): Promise<ImportBundle> {
  const parsed = JSON.parse(text) as unknown;

  if (isNormalizedBundle(parsed)) {
    return {
      source: "normalized-json",
      projects: (parsed.projects ?? []).map(sanitizeImportedProject),
      records: (parsed.records ?? []).map(sanitizeImportedRecord),
      snippets: (parsed.snippets ?? []).map(sanitizeImportedSnippet),
      warnings: [],
    };
  }

  if (isChatGptExportArray(parsed)) {
    const project: Project = {
      id: uid("project"),
      title: `Imported ChatGPT - ${fileName.replace(/\.[^.]+$/, "")}`,
      description: "Imported from a ChatGPT export file.",
      tags: ["imported", "chatgpt"],
      status: "active",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      exportHistory: [],
    };

    const records = (
      await Promise.all(parsed.map((conversation) => recordFromChatGptConversation(conversation, project.id)))
    ).filter((record): record is ArchiveRecord => Boolean(record));

    return {
      source: "chatgpt-export",
      projects: [project],
      records,
      snippets: [],
      warnings:
        records.length === parsed.length
          ? []
          : ["Some conversations were skipped because they did not contain importable message content."],
    };
  }

  throw new Error("Unsupported import format. Use a normalized JSON export or ChatGPT conversations export.");
}

export async function parseImportFile(file: File): Promise<ImportBundle> {
  if (file.name.toLowerCase().endsWith(".zip")) {
    const { default: JSZip } = await import("jszip");
    const archive = await JSZip.loadAsync(await file.arrayBuffer());
    const preferred =
      archive.file("conversations.json") ??
      archive
        .filter((path) => path.toLowerCase().endsWith(".json"))
        .sort((left, right) => left.name.localeCompare(right.name))[0];

    if (!preferred) {
      throw new Error("ZIP import did not contain a supported JSON export file.");
    }

    return parseImportText(await preferred.async("text"), preferred.name);
  }

  return parseImportText(await file.text(), file.name);
}
