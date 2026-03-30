import type { CaptureDraft } from "types/archive";
import { parseImportText } from "lib/importers";
import {
  ensureSettings,
  ensureStarterProject,
  mergeImportBundle,
  saveArchiveRecord,
  saveSnippet,
  wipeLocalData,
} from "lib/storage";
import { cleanTextFromMessages } from "lib/normalize";
import { getPlatformFromUrl } from "lib/permissions";

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

  try {
    return (await chrome.tabs.sendMessage(tab.id, message)) as T | null;
  } catch {
    return null;
  }
}

async function getPageStatus() {
  const [tab, settings] = await Promise.all([getActiveTab(), ensureSettings()]);
  const url = tab?.url ?? "";
  const platform = getPlatformFromUrl(url);

  if (platform === "other") {
    return {
      supported: false,
      supportedUrl: false,
      captureReady: false,
      title: tab?.title,
      reason: "Open ChatGPT, Claude, Gemini, or Perplexity to capture a visible AI conversation.",
    };
  }

  const enabled = settings.enabledPlatforms.includes(platform);
  const contentStatus = await askContentScript<{
    supported?: boolean;
    platform?: string;
    title?: string;
    hasSelection?: boolean;
  }>({ type: "GET_PAGE_STATUS" });

  if (!enabled) {
    return {
      supported: true,
      supportedUrl: true,
      captureReady: false,
      enabled: false,
      platform,
      title: contentStatus?.title ?? tab?.title,
      reason: `Capture is disabled for ${platform}. Re-enable it in Settings to save this workspace.`,
    };
  }

  if (contentStatus?.supported) {
    return {
      ...contentStatus,
      supported: true,
      supportedUrl: true,
      captureReady: true,
      enabled: true,
      reason: "Ready to capture visible content from this page.",
    };
  }

  return {
    supported: true,
    supportedUrl: true,
    captureReady: false,
    enabled: true,
    platform,
    title: tab?.title,
    reason:
      "This is a supported site, but capture is not ready yet. Reload the page if you just installed or updated the extension.",
  };
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
    const status = await getPageStatus();
    throw new Error(status.reason ?? "Capture is unavailable on this page.");
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
        const status = await getPageStatus();
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
          const status = await getPageStatus();
          throw new Error(status.captureReady ? "Nothing selected to save." : status.reason ?? "Nothing selected to save.");
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
        const bundle = await parseImportText(message.payload.text);
        await mergeImportBundle(bundle);
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
