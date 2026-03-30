import { parseConversationWithConfig, type PlatformParser } from "./shared/parserTypes";

const parser: PlatformParser = {
  platform: "chatgpt",
  matches(url) {
    return /^https:\/\/chatgpt\.com\//.test(url);
  },
  parse(document) {
    return parseConversationWithConfig(document, {
      platform: "chatgpt",
      rootSelectors: ["main", "[data-testid='conversation-view']", "#thread", "body"],
      messageSelectors: [
        "[data-message-author-role]",
        "article[data-testid*='conversation-turn']",
        "div[data-message-author-role]",
      ],
      titleSelectors: ["nav h1", "main h1", "header h1"],
      modelSelectors: ["header button", "nav button", "[data-testid='model-switcher-dropdown-button']"],
    });
  },
};

export default parser;

