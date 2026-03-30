import { normalizeWhitespace } from "lib/normalize";
import type { SupportedPlatform } from "types/archive";

export type CaptureReadinessState =
  | "ready"
  | "login_required"
  | "challenge_required"
  | "empty_state";

export interface CaptureReadinessSignals {
  platform: SupportedPlatform;
  url: string;
  pageTitle?: string;
  sourceTitle?: string;
  bodyText?: string;
  cleanText?: string;
  parsedMessageCount: number;
  candidateMessageCount: number;
  usedFallback: boolean;
  hasUserMessage: boolean;
  hasAssistantMessage: boolean;
  hasComposer: boolean;
}

export interface CaptureReadinessResult {
  ready: boolean;
  state: CaptureReadinessState;
  reason: string;
}

const PLATFORM_LABELS: Record<SupportedPlatform, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  copilot: "Copilot",
  other: "this workspace",
};

const CHALLENGE_PATTERNS = [
  /cloudflare/i,
  /security verification/i,
  /just a moment/i,
  /verify you are not a bot/i,
  /challenge detected/i,
];

const LOGIN_PATTERNS = {
  chatgpt: [
    /log in to get answers based on saved chats/i,
    /sign up for free/i,
    /\bchatgpt\b.*\blog in\b/i,
  ],
  claude: [
    /continue with google/i,
    /continue with email/i,
    /continue with sso/i,
    /\/login\b/i,
  ],
  gemini: [
    /before you continue/i,
    /consent\.google\.com/i,
    /reject all/i,
    /accept all/i,
  ],
  perplexity: [
    /sign in/i,
    /join perplexity/i,
    /continue with google/i,
  ],
  copilot: [/sign in/i],
  other: [/sign in/i],
} satisfies Record<SupportedPlatform, RegExp[]>;

const EMPTY_STATE_PATTERNS = {
  chatgpt: [/what are you working on\?/i, /\bnew chat\b/i],
  claude: [/start a new chat/i, /\bprojects\b/i],
  gemini: [/start a chat/i, /\bnew chat\b/i],
  perplexity: [/recent and active threads will appear here/i, /ask anything/i],
  copilot: [/start a new conversation/i],
  other: [/open a conversation/i],
} satisfies Record<SupportedPlatform, RegExp[]>;

function platformLabel(platform: SupportedPlatform) {
  return PLATFORM_LABELS[platform] ?? "this workspace";
}

function includesAny(input: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(input));
}

function buildLoginReason(platform: SupportedPlatform, url: string, text: string) {
  if (platform === "gemini" && (/consent\.google\.com/i.test(url) || /before you continue/i.test(text))) {
    return "Accept the Google consent screen and sign in to Gemini before capture.";
  }

  return `Sign in to ${platformLabel(platform)} and open a conversation with visible messages before capture.`;
}

function buildEmptyStateReason(platform: SupportedPlatform) {
  return `Open an existing ${platformLabel(platform)} conversation with visible messages before capture.`;
}

export function assessCaptureReadiness(
  signals: CaptureReadinessSignals,
): CaptureReadinessResult {
  const normalized = normalizeWhitespace(
    [
      signals.pageTitle,
      signals.sourceTitle,
      signals.cleanText,
      signals.bodyText,
      signals.url,
    ]
      .filter(Boolean)
      .join("\n"),
  ).toLowerCase();

  if (includesAny(normalized, CHALLENGE_PATTERNS)) {
    return {
      ready: false,
      state: "challenge_required",
      reason: `Complete the ${platformLabel(signals.platform)} security check before capture.`,
    };
  }

  if (includesAny(normalized, LOGIN_PATTERNS[signals.platform])) {
    return {
      ready: false,
      state: "login_required",
      reason: buildLoginReason(signals.platform, signals.url, normalized),
    };
  }

  const hasStructuredMessages =
    signals.candidateMessageCount > 0 &&
    signals.parsedMessageCount > 0 &&
    (signals.parsedMessageCount >= 2 ||
      signals.hasUserMessage ||
      signals.hasAssistantMessage);

  if (hasStructuredMessages && !signals.usedFallback) {
    return {
      ready: true,
      state: "ready",
      reason: "Ready to capture visible content from this page.",
    };
  }

  if (
    signals.parsedMessageCount === 0 ||
    signals.usedFallback ||
    (signals.hasComposer && signals.candidateMessageCount === 0) ||
    includesAny(normalized, EMPTY_STATE_PATTERNS[signals.platform])
  ) {
    return {
      ready: false,
      state: "empty_state",
      reason: buildEmptyStateReason(signals.platform),
    };
  }

  return {
    ready: true,
    state: "ready",
    reason: "Ready to capture visible content from this page.",
  };
}
