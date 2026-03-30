import { parseConversationWithConfig, type PlatformParser } from "./shared/parserTypes";

const parser: PlatformParser = {
  platform: "claude",
  matches(url) {
    return /^https:\/\/claude\.ai\//.test(url);
  },
  parse(document) {
    return parseConversationWithConfig(document, {
      platform: "claude",
      rootSelectors: ["main", "[data-test-id='conversation']", "[class*='conversation']", "body"],
      messageSelectors: [
        "[data-testid*='message']",
        "[class*='font-claude-message']",
        "[class*='message']",
      ],
      titleSelectors: ["main h1", "header h1", "title"],
      modelSelectors: ["header button", "header div", "[data-testid*='model']"],
    });
  },
};

export default parser;

