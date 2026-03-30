import type { ArchiveAttachment, ContentBlock } from "types/archive";
import { normalizeWhitespace } from "lib/normalize";

function textBlockFromElement(element: Element) {
  const text = normalizeWhitespace(element.textContent ?? "");
  return text ? ({ type: "text", text } satisfies ContentBlock) : null;
}

function markdownList(element: Element) {
  const items = Array.from(element.querySelectorAll(":scope > li"))
    .map((item, index) => {
      const prefix = element.tagName.toLowerCase() === "ol" ? `${index + 1}.` : "-";
      return `${prefix} ${normalizeWhitespace(item.textContent ?? "")}`;
    })
    .join("\n");

  return items ? ({ type: "markdown", markdown: items } satisfies ContentBlock) : null;
}

function blockForElement(element: Element): ContentBlock | null {
  const tag = element.tagName.toLowerCase();

  if (tag === "pre") {
    const code = element.textContent?.trim() ?? "";
    const language =
      element.getAttribute("data-language") ??
      element.querySelector("code")?.getAttribute("class")?.replace(/^language-/, "") ??
      undefined;
    return code ? { type: "code", code, language } : null;
  }

  if (tag === "code" && element.parentElement?.tagName.toLowerCase() !== "pre") {
    const code = element.textContent?.trim() ?? "";
    return code ? { type: "code", code } : null;
  }

  if (tag === "table") {
    return { type: "table", html: element.outerHTML };
  }

  if (tag === "a" && element.getAttribute("href")) {
    return {
      type: "link",
      href: element.getAttribute("href") ?? "",
      text: normalizeWhitespace(element.textContent ?? ""),
    };
  }

  if (tag === "img") {
    return {
      type: "image",
      src: element.getAttribute("src") ?? undefined,
      alt: element.getAttribute("alt") ?? undefined,
    };
  }

  if (tag === "ul" || tag === "ol") {
    return markdownList(element);
  }

  if (/^h[1-6]$/.test(tag)) {
    const level = Number(tag[1]);
    const text = normalizeWhitespace(element.textContent ?? "");
    return text
      ? {
          type: "markdown",
          markdown: `${"#".repeat(level)} ${text}`,
        }
      : null;
  }

  return textBlockFromElement(element);
}

export function htmlToBlocks(root: Element): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const directChildren = Array.from(root.children);

  if (directChildren.length === 0) {
    const text = normalizeWhitespace(root.textContent ?? "");
    return text ? [{ type: "text", text }] : [];
  }

  for (const child of directChildren) {
    const block = blockForElement(child);
    if (block) {
      blocks.push(block);
      continue;
    }

    const nestedText = normalizeWhitespace(child.textContent ?? "");
    if (nestedText) {
      blocks.push({ type: "text", text: nestedText });
    }
  }

  return blocks;
}

export function extractAttachments(root: Element): ArchiveAttachment[] {
  const attachments = Array.from(
    root.querySelectorAll("a[download], a[href*='file'], [data-testid*='attachment'] a[href]"),
  );

  return attachments.map((element) => ({
    id: `att_${crypto.randomUUID()}`,
    name:
      normalizeWhitespace(element.textContent ?? "") ||
      element.getAttribute("download") ||
      "attachment",
    mimeType: undefined,
    href: element.getAttribute("href") ?? undefined,
  }));
}

