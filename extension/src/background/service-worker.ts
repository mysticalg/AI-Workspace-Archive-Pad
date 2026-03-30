import type { CaptureDraft } from "types/archive";
import {
  ensureSettings,
  ensureStarterProject,
  importNormalizedJson,
  saveArchiveRecord,
  saveSnippet,
  wipeLocalData,
} from "lib/storage";
import { cleanTextFromMessages } from "lib/normalize";

type ContentRequest =
  | { type: "GET_PAGE_STATUS" }
  | { type: "PARSE_PAGE" }
  | { type: "PARSE_SELECTION" }
  | { type: "PARSE_LAST_EXCHANGE" };

type RuntimeRequest =
  | { type: "OPEN_SIDE_PANEL_REQUESTED" }
  | { type: "GET_PAGE_STATUS" }
  | { type: "CAPTURE_CURRENT_PAGE"; payload?: CapturePayload }
  | { type: "CAPTURE_SELECTION"; payload?: CapturePayload }
  | { type: "CAPTURE_LAST_EXCHANGE"; payload?: CapturePayload }
  | {
      type: "SAVE_SNIPPET";
      payload: CapturePayload & { kind: string; title: string; body?: string };
    }
  | { type: "WIPE_LOCAL_DATA" }
  | { type: "IMPORT_FILE"; payload: { text: string } };

type CapturePayload = {
  projectId?: string;
  tags?: string[];
  notes?: string;
  titleOverride?: string;
};

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  return tab;
}

async function askContentScript<T>(message: ContentRequest) {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return null;
  }

  return chrome.tabs.sendMessage(tab.id, message) as Promise<T | null>;
}

async function resolveProjectId(projectId?: string) {
  if (projectId) {
    return projectId;
  }

  const settings = await ensureSettings();
  return settings.defaultProjectId ?? (await ensureStarterProject()).id;
}

async function capture(messageType: ContentRequest["type"], payload: CapturePayload = {}) {
  const draft = await askContentScript<CaptureDraft>({ type: messageType });
  if (!draft) {
    throw new Error("Unsupported page or capture unavailable");
  }

  const settings = await ensureSettings();
  if (!settings.enabledPlatforms.includes(draft.platform)) {
    throw new Error(`Capture disabled for ${draft.platform}`);
  }

  return saveArchiveRecord(draft, {
    projectId: await resolveProjectId(payload.projectId),
    tags: payload.tags ?? [],
    notes: payload.notes,
    titleOverride: payload.titleOverride,
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  void ensureSettings();
  void ensureStarterProject();

  if (details.reason === "install") {
    chrome.runtime.openOptionsPage().catch(() => undefined);
  }
});

chrome.runtime.onStartup.addListener(() => {
  void ensureSettings();
  void ensureStarterProject();
});

chrome.runtime.onMessage.addListener((message: RuntimeRequest, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case "OPEN_SIDE_PANEL_REQUESTED": {
        const tab = await getActiveTab();
        if (tab?.windowId) {
          await chrome.sidePanel.open({ windowId: tab.windowId });
        }
        sendResponse({ ok: true });
        return;
      }

      case "GET_PAGE_STATUS": {
        const status = await askContentScript({ type: "GET_PAGE_STATUS" });
        sendResponse(status);
        return;
      }

      case "CAPTURE_CURRENT_PAGE": {
        const result = await capture("PARSE_PAGE", message.payload);
        sendResponse(result);
        return;
      }

      case "CAPTURE_SELECTION": {
        const result = await capture("PARSE_SELECTION", message.payload);
        sendResponse(result);
        return;
      }

      case "CAPTURE_LAST_EXCHANGE": {
        const result = await capture("PARSE_LAST_EXCHANGE", message.payload);
        sendResponse(result);
        return;
      }

      case "SAVE_SNIPPET": {
        const selectionDraft =
          message.payload.body
            ? ({
                cleanText: message.payload.body,
                messages: [
                  {
                    id: crypto.randomUUID(),
                    role: "unknown" as const,
                    contentBlocks: [{ type: "text", text: message.payload.body }],
                  },
                ],
              } satisfies Pick<CaptureDraft, "cleanText" | "messages">)
            : await askContentScript<CaptureDraft>({ type: "PARSE_SELECTION" });

        if (!selectionDraft) {
          throw new Error("Nothing selected to save");
        }

        const snippet = await saveSnippet({
          title: message.payload.title,
          body: message.payload.body ?? cleanTextFromMessages(selectionDraft.messages),
          kind: message.payload.kind as never,
          tags: message.payload.tags ?? [],
          projectId: await resolveProjectId(message.payload.projectId),
          sourceUrl: "sourceUrl" in selectionDraft ? selectionDraft.sourceUrl : undefined,
          platform: "platform" in selectionDraft ? selectionDraft.platform : undefined,
        });
        sendResponse(snippet);
        return;
      }

      case "WIPE_LOCAL_DATA": {
        await wipeLocalData();
        sendResponse({ ok: true });
        return;
      }

      case "IMPORT_FILE": {
        await importNormalizedJson(message.payload.text);
        sendResponse({ ok: true });
        return;
      }
    }
  })().catch((error: unknown) => {
    sendResponse({
      error: error instanceof Error ? error.message : "Unknown extension error",
    });
  });

  return true;
});
