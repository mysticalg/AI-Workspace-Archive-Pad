import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { CaptureDraft } from "types/archive";
import { cleanTextFromMessages } from "lib/normalize";
import { unwrapRuntimeResponse } from "lib/runtime";
import { SaveButton } from "./inject/saveButton";
import { SelectionToolbar } from "./inject/selectionToolbar";
import chatgptParser from "./parsers/chatgpt";
import claudeParser from "./parsers/claude";
import geminiParser from "./parsers/gemini";
import perplexityParser from "./parsers/perplexity";
import { assessCaptureReadiness } from "./parsers/shared/readiness";

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

type InspectionResult = {
  supported: boolean;
  platform?: string;
  title?: string;
  captureReady: boolean;
  reason: string;
  parsed: ReturnType<typeof parseCurrentDocument>;
};

function resolveParser() {
  return parsers.find((parser) => parser.matches(location.href));
}

function parseCurrentDocument() {
  const parser = resolveParser();
  return parser?.parse(document) ?? null;
}

function inspectCurrentDocument(): InspectionResult {
  const parser = resolveParser();
  if (!parser) {
    return {
      supported: false,
      captureReady: false,
      reason: "Open ChatGPT, Claude, Gemini, or Perplexity to capture a visible AI conversation.",
      parsed: null,
      title: document.title,
    };
  }

  const parsed = parser.parse(document);
  if (!parsed) {
    return {
      supported: true,
      platform: parser.platform,
      title: document.title,
      captureReady: false,
      reason: `Open an existing ${parser.platform} conversation with visible messages before capture.`,
      parsed: null,
    };
  }

  const readiness = assessCaptureReadiness({
    platform: parsed.platform,
    url: location.href,
    pageTitle: document.title,
    sourceTitle: parsed.sourceTitle,
    bodyText: document.body?.innerText ?? document.body?.textContent ?? "",
    cleanText: parsed.cleanText,
    parsedMessageCount: parsed.messages.length,
    candidateMessageCount: parsed.candidateMessageCount,
    usedFallback: parsed.usedFallback,
    hasUserMessage: parsed.messages.some((message) => message.role === "user"),
    hasAssistantMessage: parsed.messages.some((message) => message.role === "assistant"),
    hasComposer: Boolean(
      document.querySelector(
        "textarea, [contenteditable='true'], input[placeholder*='Ask'], input[placeholder*='Message']",
      ),
    ),
  });

  return {
    supported: true,
    platform: parsed.platform,
    title: parsed.sourceTitle ?? document.title,
    captureReady: readiness.ready,
    reason: readiness.reason,
    parsed: readiness.ready ? parsed : null,
  };
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
  const [inspection, setInspection] = useState<InspectionResult>(() => inspectCurrentDocument());
  const [flash, setFlash] = useState<{ label: string; detail?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toolbar, setToolbar] = useState<ToolbarState>({
    x: 0,
    y: 0,
    visible: false,
  });

  const pageLabel = inspection.platform
    ? `Connected to ${inspection.platform[0].toUpperCase()}${inspection.platform.slice(1)}`
    : "Unsupported page";
  const status = flash?.label ?? (busy ? "Saving" : inspection.captureReady ? "Ready" : "Blocked");
  const detail = flash?.detail ?? inspection.reason;

  useEffect(() => {
    const refreshInspection = () => {
      const next = inspectCurrentDocument();
      setInspection(next);
      if (!next.captureReady) {
        setToolbar((current) => ({ ...current, visible: false }));
      }
    };

    refreshInspection();
    const intervalId = window.setInterval(refreshInspection, 2500);
    window.addEventListener("focus", refreshInspection);
    window.addEventListener("popstate", refreshInspection);
    window.addEventListener("hashchange", refreshInspection);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshInspection);
      window.removeEventListener("popstate", refreshInspection);
      window.removeEventListener("hashchange", refreshInspection);
    };
  }, []);

  useEffect(() => {
    const onMouseUp = () => {
      if (!inspection.captureReady) {
        setToolbar((current) => ({ ...current, visible: false }));
        return;
      }

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
  }, [inspection.captureReady]);

  const sendCapture = async (messageType: "CAPTURE_CURRENT_PAGE" | "CAPTURE_SELECTION") => {
    setBusy(true);
    setFlash(null);

    try {
      const response = unwrapRuntimeResponse<{ deduped?: boolean }>(
        await chrome.runtime.sendMessage({
          type: messageType,
          payload: { tags: [] },
        }),
      );

      setFlash({
        label: response?.deduped ? "Already saved" : "Saved",
      });
      setToolbar((current) => ({ ...current, visible: false }));
      setInspection(inspectCurrentDocument());
    } catch (value) {
      setFlash({
        label: "Blocked",
        detail: value instanceof Error ? value.message : "Capture failed.",
      });
    } finally {
      setBusy(false);
      window.setTimeout(() => setFlash(null), 2200);
    }
  };

  return (
    <>
      <SaveButton
        isBusy={busy}
        pageLabel={pageLabel}
        status={status}
        detail={detail}
        saveDisabled={!inspection.captureReady}
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
    const inspection = inspectCurrentDocument();
    sendResponse({
      supported: inspection.supported,
      platform: inspection.platform,
      title: inspection.title ?? document.title,
      captureReady: inspection.captureReady,
      reason: inspection.reason,
      hasSelection: Boolean(window.getSelection()?.toString().trim()),
    });
    return;
  }

  if (message.type === "PARSE_PAGE") {
    sendResponse(inspectCurrentDocument().parsed);
    return;
  }

  if (message.type === "PARSE_SELECTION") {
    sendResponse(buildSelectionDraft(inspectCurrentDocument().parsed));
    return;
  }

  if (message.type === "PARSE_LAST_EXCHANGE") {
    sendResponse(buildLastExchangeDraft(inspectCurrentDocument().parsed));
  }
});
