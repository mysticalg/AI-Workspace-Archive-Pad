import { parseConversationWithConfig, type PlatformParser } from "./shared/parserTypes";

const parser: PlatformParser = {
  platform: "gemini",
  matches(url) {
    return /^https:\/\/gemini\.google\.com\//.test(url);
  },
  parse(document) {
    return parseConversationWithConfig(document, {
      platform: "gemini",
      rootSelectors: [
        "chat-window-content",
        "[data-test-id='chat-history-container']",
        "main",
        "chat-app",
        "bard-sidenav-container",
        "body",
      ],
      messageSelectors: [
        "div.user-query-container",
        "div.response-container",
      ],
      titleSelectors: ["[data-test-id='conversation-title']", "main h1", "header h1", "title"],
      modelSelectors: [
        "[data-test-id='bard-mode-menu-button']",
        "[data-test-id*='mode']",
        "mat-select",
        "[class*='model']",
      ],
    });
  },
};

export default parser;
