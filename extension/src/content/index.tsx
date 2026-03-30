import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { CaptureDraft } from "types/archive";
import { cleanTextFromMessages } from "lib/normalize";
import { SaveButton } from "./inject/saveButton";
import { SelectionToolbar } from "./inject/selectionToolbar";
import chatgptParser from "./parsers/chatgpt";
import claudeParser from "./parsers/claude";
import geminiParser from "./parsers/gemini";
import perplexityParser from "./parsers/perplexity";

const parsers = [chatgptParser, claudeParser, geminiParser, perplexityParser];

type ToolbarState = {
  x: number;
  y: number;
  visible: boolean;
};

type ContentRequest =
  | { type: "GET_PAGE_STATUS" }
  | { type: "PARSE_PAGE" }
  | { type: "PARSE_SELECTION" }
  | { type: "PARSE_LAST_EXCHANGE" };

function resolveParser() {
  return parsers.find((parser) => parser.matches(location.href));
}

function parseCurrentDocument() {
  const parser = resolveParser();
  return parser?.parse(document) ?? null;
}

function buildSelectionDraft(parsed: ReturnType<typeof parseCurrentDocument>) {
  if (!parsed) {
    return null;
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.toString().trim().length === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const selectedNodes = parsed.messageNodes.filter((node) => {
    try {
      return range.intersectsNode(node.element);
    } catch {
      return false;
    }
  });

  if (selectedNodes.length === 0) {
    const text = selection.toString().trim();
    if (!text) {
      return null;
    }

    return {
      ...parsed,
      sourceTitle: `${parsed.sourceTitle ?? document.title} (Selection)`,
      messages: [
        {
          id: `msg_${crypto.randomUUID()}`,
          role: "unknown" as const,
          contentBlocks: [{ type: "text", text }],
        },
      ],
      cleanText: text,
    } satisfies CaptureDraft;
  }

  const messages = selectedNodes.map((node) => node.message);
  return {
    ...parsed,
    sourceTitle: `${parsed.sourceTitle ?? document.title} (Selection)`,
    messages,
    cleanText: cleanTextFromMessages(messages),
  } satisfies CaptureDraft;
}

function buildLastExchangeDraft(parsed: ReturnType<typeof parseCurrentDocument>) {
  if (!parsed) {
    return null;
  }

  const assistantIndex = [...parsed.messages]
    .reverse()
    .findIndex((message) => message.role === "assistant");
  if (assistantIndex < 0) {
    return null;
  }

  const absoluteAssistantIndex = parsed.messages.length - 1 - assistantIndex;
  const assistantMessage = parsed.messages[absoluteAssistantIndex];
  const userMessage = [...parsed.messages.slice(0, absoluteAssistantIndex)]
    .reverse()
    .find((message) => message.role === "user");

  const messages = [userMessage, assistantMessage].filter(
    (message): message is NonNullable<typeof message> => Boolean(message),
  );
  if (messages.length === 0) {
    return null;
  }

  return {
    ...parsed,
    sourceTitle: `${parsed.sourceTitle ?? document.title} (Last Exchange)`,
    messages,
    cleanText: cleanTextFromMessages(messages),
  } satisfies CaptureDraft;
}

function App() {
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);
  const [toolbar, setToolbar] = useState<ToolbarState>({
    x: 0,
    y: 0,
    visible: false,
  });

  const parser = useMemo(() => resolveParser(), []);
  const pageLabel = parser
    ? `Connected to ${parser.platform[0].toUpperCase()}${parser.platform.slice(1)}`
    : "Unsupported page";

  useEffect(() => {
    const onMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
        setToolbar((current) => ({ ...current, visible: false }));
        return;
      }

      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setToolbar({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY,
        visible: true,
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setToolbar((current) => ({ ...current, visible: false }));
      }
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keyup", onMouseUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("keyup", onMouseUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const sendCapture = async (messageType: "CAPTURE_CURRENT_PAGE" | "CAPTURE_SELECTION") => {
    setBusy(true);
    setStatus("Saving");

    try {
      const response = await chrome.runtime.sendMessage({
        type: messageType,
        payload: { tags: [] },
      });

      setStatus(response?.deduped ? "Already saved" : "Saved");
      setToolbar((current) => ({ ...current, visible: false }));
    } catch {
      setStatus("Capture failed");
    } finally {
      setBusy(false);
      window.setTimeout(() => setStatus("Ready"), 2000);
    }
  };

  return (
    <>
      <SaveButton
        isBusy={busy}
        pageLabel={pageLabel}
        status={status}
        onSavePage={() => void sendCapture("CAPTURE_CURRENT_PAGE")}
        onOpenSidePanel={() =>
          void chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL_REQUESTED" })
        }
      />
      <SelectionToolbar
        x={toolbar.x}
        y={toolbar.y}
        visible={toolbar.visible}
        onSaveSelection={() => void sendCapture("CAPTURE_SELECTION")}
        onSaveSnippet={() =>
          void chrome.runtime.sendMessage({
            type: "SAVE_SNIPPET",
            payload: {
              tags: [],
              kind: "quote",
              title: window.getSelection()?.toString().trim().slice(0, 48) || "Saved snippet",
            },
          })
        }
      />
    </>
  );
}

function ensureOverlay(id: string) {
  const existing = document.getElementById(id);
  if (existing) {
    return existing;
  }

  const host = document.createElement("div");
  host.id = id;
  const shadow = host.attachShadow({ mode: "open" });
  const mount = document.createElement("div");
  shadow.appendChild(mount);
  document.documentElement.appendChild(host);
  return mount;
}

if (!document.getElementById("aiwa-overlay-host")) {
  const mount = ensureOverlay("aiwa-overlay-host");
  createRoot(mount).render(<App />);
}

chrome.runtime.onMessage.addListener((message: ContentRequest, _sender, sendResponse) => {
  if (message.type === "GET_PAGE_STATUS") {
    const parsed = parseCurrentDocument();
    sendResponse({
      supported: Boolean(parsed),
      platform: parsed?.platform,
      title: parsed?.sourceTitle ?? document.title,
      hasSelection: Boolean(window.getSelection()?.toString().trim()),
    });
    return;
  }

  if (message.type === "PARSE_PAGE") {
    sendResponse(parseCurrentDocument());
    return;
  }

  if (message.type === "PARSE_SELECTION") {
    sendResponse(buildSelectionDraft(parseCurrentDocument()));
    return;
  }

  if (message.type === "PARSE_LAST_EXCHANGE") {
    sendResponse(buildLastExchangeDraft(parseCurrentDocument()));
  }
});
