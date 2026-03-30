import type {
  ArchiveAttachment,
  ArchiveMessage,
  CaptureDraft,
  SupportedPlatform,
} from "types/archive";
import { cleanTextFromMessages, normalizeWhitespace } from "lib/normalize";
import { extractAttachments, htmlToBlocks } from "./htmlToBlocks";
import { detectDocumentTitle, detectModelLabel } from "./metadata";

export interface ParsedMessageNode {
  element: Element;
  message: ArchiveMessage;
}

export interface ParsedConversationResult extends CaptureDraft {
  messageNodes: ParsedMessageNode[];
  candidateMessageCount: number;
  usedFallback: boolean;
}

export interface ParserConfig {
  platform: SupportedPlatform;
  rootSelectors: string[];
  messageSelectors: string[];
  titleSelectors?: string[];
  modelSelectors?: string[];
}

export interface PlatformParser {
  platform: SupportedPlatform;
  matches(url: string): boolean;
  parse(document: Document): ParsedConversationResult | null;
}

export function queryFirst(root: ParentNode, selectors: string[]) {
  for (const selector of selectors) {
    const node = root.querySelector(selector);
    if (node) {
      return node;
    }
  }

  return null;
}

function uniqueElements(elements: Element[]) {
  return elements.filter(
    (element, index) =>
      elements.findIndex((candidate) => candidate === element) === index,
  );
}

function dropNested(elements: Element[]) {
  return elements.filter(
    (element) => !elements.some((candidate) => candidate !== element && candidate.contains(element)),
  );
}

export function queryAllUnique(root: ParentNode, selectors: string[]) {
  const nodes = uniqueElements(
    selectors.flatMap((selector) => Array.from(root.querySelectorAll(selector))),
  );
  return dropNested(nodes);
}

export function inferRole(element: Element): ArchiveMessage["role"] {
  const explicit = element.getAttribute("data-message-author-role");
  if (explicit === "user" || explicit === "assistant" || explicit === "system") {
    return explicit;
  }

  const joined =
    [
      element.getAttribute("data-testid"),
      element.getAttribute("aria-label"),
      element.className,
      element.textContent?.slice(0, 80),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase() ?? "";

  if (/(user|human|prompt|you said)/.test(joined)) {
    return "user";
  }

  if (/(assistant|claude|chatgpt|gemini|model|response)/.test(joined)) {
    return "assistant";
  }

  if (/(system|tool)/.test(joined)) {
    return "system";
  }

  return "unknown";
}

function compactMessages(nodes: ParsedMessageNode[]) {
  return nodes.filter(
    (node) =>
      node.message.contentBlocks.length > 0 &&
      normalizeWhitespace(cleanTextFromMessages([node.message])).length > 0,
  );
}

function buildFallbackMessages(root: Element) {
  const blocks = htmlToBlocks(root);
  if (blocks.length === 0) {
    return [];
  }

  return [
    {
      element: root,
      message: {
        id: `msg_${crypto.randomUUID()}`,
        role: "unknown" as const,
        contentBlocks: blocks,
      },
    },
  ];
}

export function parseConversationWithConfig(
  document: Document,
  config: ParserConfig,
): ParsedConversationResult | null {
  const root = queryFirst(document, config.rootSelectors) ?? document.body;
  if (!root) {
    return null;
  }

  const candidates = queryAllUnique(root, config.messageSelectors);
  const usedFallback = candidates.length === 0;
  const messageNodes = compactMessages(
    (usedFallback ? buildFallbackMessages(root) : candidates).map((element) => {
      if ("message" in element) {
        return element as ParsedMessageNode;
      }

      const blocks = htmlToBlocks(element as Element);
      const createdAt = (element as Element).querySelector("time")?.getAttribute("datetime") ?? undefined;

      return {
        element: element as Element,
        message: {
          id: `msg_${crypto.randomUUID()}`,
          role: inferRole(element as Element),
          authorLabel:
            (element as Element).getAttribute("aria-label") ??
            (element as Element).querySelector("[aria-label]")?.getAttribute("aria-label") ??
            undefined,
          createdAt,
          contentBlocks: blocks,
        },
      };
    }),
  );

  const attachments = extractAttachments(root);
  const messages = messageNodes.map((node) => node.message);
  const cleanText = cleanTextFromMessages(messages, root.textContent ?? "");
  const snapshot = root instanceof HTMLElement ? root.innerHTML : document.body.innerHTML;

  return {
    platform: config.platform,
    sourceUrl: location.href,
    sourceTitle: detectDocumentTitle(document, config.titleSelectors),
    modelName: detectModelLabel(document, config.modelSelectors),
    messages,
    attachments,
    cleanText,
    rawSnapshotHtml: snapshot,
    messageNodes,
    candidateMessageCount: candidates.length,
    usedFallback,
  };
}

export function extractAttachmentsFromMessages(root: Element): ArchiveAttachment[] {
  return extractAttachments(root);
}
