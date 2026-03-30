import type { SupportedPlatform } from "types/archive";

export const PLATFORM_HOSTS: Record<SupportedPlatform, string[]> = {
  chatgpt: ["https://chatgpt.com/*"],
  claude: ["https://claude.ai/*"],
  gemini: ["https://gemini.google.com/*"],
  perplexity: ["https://www.perplexity.ai/*"],
  copilot: ["https://copilot.microsoft.com/*"],
  other: [],
};

export const PLATFORM_PATTERNS: Array<[SupportedPlatform, RegExp]> = [
  ["chatgpt", /^https:\/\/chatgpt\.com\//],
  ["claude", /^https:\/\/claude\.ai\//],
  ["gemini", /^https:\/\/gemini\.google\.com\//],
  ["perplexity", /^https:\/\/www\.perplexity\.ai\//],
  ["copilot", /^https:\/\/copilot\.microsoft\.com\//],
];

export function getPlatformFromUrl(url: string): SupportedPlatform {
  return PLATFORM_PATTERNS.find(([, pattern]) => pattern.test(url))?.[0] ?? "other";
}

export function isSupportedUrl(url?: string) {
  return Boolean(url && getPlatformFromUrl(url) !== "other");
}

export async function requestPlatformPermission(platform: SupportedPlatform) {
  const origins = PLATFORM_HOSTS[platform];
  if (!origins.length) {
    return false;
  }

  return chrome.permissions.request({ origins });
}

export async function hasPlatformPermission(platform: SupportedPlatform) {
  const origins = PLATFORM_HOSTS[platform];
  if (!origins.length) {
    return false;
  }

  return chrome.permissions.contains({ origins });
}

export async function removePlatformPermission(platform: SupportedPlatform) {
  const origins = PLATFORM_HOSTS[platform];
  if (!origins.length) {
    return false;
  }

  return chrome.permissions.remove({ origins });
}
