import { parseConversationWithConfig, type PlatformParser } from "./shared/parserTypes";

const parser: PlatformParser = {
  platform: "claude",
  matches(url) {
    return /^https:\/\/claude\.ai\//.test(url);
  },
  parse(document) {
    return parseConversationWithConfig(document, {
      platform: "claude",
      rootSelectors: ["main", "[data-test-id='conversation']", "body"],
      messageSelectors: [
        "[data-testid='user-message']",
        ".font-claude-response.relative",
      ],
      titleSelectors: ["[data-testid='chat-title-button']", "title"],
      modelSelectors: ["[data-testid='model-selector-dropdown']", "[data-testid*='model']", "header button"],
    });
  },
};

export default parser;
