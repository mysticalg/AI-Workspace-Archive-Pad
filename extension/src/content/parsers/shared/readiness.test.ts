import { describe, expect, it } from "vitest";
import { assessCaptureReadiness } from "./readiness";

describe("assessCaptureReadiness", () => {
  it("blocks ChatGPT login walls", () => {
    const result = assessCaptureReadiness({
      platform: "chatgpt",
      url: "https://chatgpt.com/",
      pageTitle: "ChatGPT",
      sourceTitle: "What are you working on?",
      bodyText:
        "Log in to get answers based on saved chats, plus create images and upload files. Sign up for free.",
      cleanText: "",
      parsedMessageCount: 1,
      candidateMessageCount: 0,
      usedFallback: true,
      hasUserMessage: false,
      hasAssistantMessage: false,
      hasComposer: true,
    });

    expect(result.ready).toBe(false);
    expect(result.state).toBe("login_required");
  });

  it("blocks challenge pages", () => {
    const result = assessCaptureReadiness({
      platform: "claude",
      url: "https://claude.ai/api/challenge_redirect?to=%2Flogin",
      pageTitle: "Just a moment...",
      bodyText:
        "Performing security verification. This page is displayed while the website verifies you are not a bot.",
      cleanText: "",
      parsedMessageCount: 0,
      candidateMessageCount: 0,
      usedFallback: true,
      hasUserMessage: false,
      hasAssistantMessage: false,
      hasComposer: false,
    });

    expect(result.ready).toBe(false);
    expect(result.state).toBe("challenge_required");
  });

  it("blocks empty landing pages", () => {
    const result = assessCaptureReadiness({
      platform: "perplexity",
      url: "https://www.perplexity.ai/",
      pageTitle: "Perplexity",
      bodyText:
        "Recent and active threads will appear here. Ask anything. Computer Model Try Computer.",
      cleanText: "Ask anything",
      parsedMessageCount: 1,
      candidateMessageCount: 0,
      usedFallback: true,
      hasUserMessage: false,
      hasAssistantMessage: false,
      hasComposer: true,
    });

    expect(result.ready).toBe(false);
    expect(result.state).toBe("empty_state");
  });

  it("allows structured conversation pages", () => {
    const result = assessCaptureReadiness({
      platform: "chatgpt",
      url: "https://chatgpt.com/c/example",
      pageTitle: "ChatGPT",
      sourceTitle: "Pricing model",
      bodyText: "You said Draft pricing tiers. ChatGPT Here is a draft pricing table.",
      cleanText: "Draft pricing tiers Here is a draft pricing table.",
      parsedMessageCount: 2,
      candidateMessageCount: 2,
      usedFallback: false,
      hasUserMessage: true,
      hasAssistantMessage: true,
      hasComposer: true,
    });

    expect(result.ready).toBe(true);
    expect(result.state).toBe("ready");
  });

  it("treats Gemini consent as login required", () => {
    const result = assessCaptureReadiness({
      platform: "gemini",
      url: "https://consent.google.com/m?continue=https://gemini.google.com/",
      pageTitle: "Before you continue",
      bodyText: "Before you continue to Google Reject all Accept all",
      cleanText: "",
      parsedMessageCount: 0,
      candidateMessageCount: 0,
      usedFallback: true,
      hasUserMessage: false,
      hasAssistantMessage: false,
      hasComposer: false,
    });

    expect(result.ready).toBe(false);
    expect(result.state).toBe("login_required");
  });
});
