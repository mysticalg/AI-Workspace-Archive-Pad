import { parseConversationWithConfig, type PlatformParser } from "./shared/parserTypes";

const parser: PlatformParser = {
  platform: "gemini",
  matches(url) {
    return /^https:\/\/gemini\.google\.com\//.test(url);
  },
  parse(document) {
    return parseConversationWithConfig(document, {
      platform: "gemini",
      rootSelectors: ["main", "chat-app", "bard-sidenav-container", "body"],
      messageSelectors: [
        "message-content",
        "[data-test-id*='message']",
        "[class*='conversation-container'] > div",
      ],
      titleSelectors: ["main h1", "header h1", "title"],
      modelSelectors: ["header button", "mat-select", "[class*='model']"],
    });
  },
};

export default parser;

