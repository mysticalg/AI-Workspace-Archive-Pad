import type { CaptureDraft } from "types/archive";

const encoder = new TextEncoder();

export async function createDedupeHash(
  payload: Pick<
    CaptureDraft,
    "platform" | "sourceUrl" | "cleanText" | "sourceTitle" | "modelName"
  >,
) {
  const input = JSON.stringify({
    platform: payload.platform,
    sourceUrl: payload.sourceUrl,
    sourceTitle: payload.sourceTitle ?? "",
    modelName: payload.modelName ?? "",
    cleanText: payload.cleanText.trim(),
  });

  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

