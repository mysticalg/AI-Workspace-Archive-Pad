import { parseConversationWithConfig, type PlatformParser } from "./shared/parserTypes";

const parser: PlatformParser = {
  platform: "perplexity",
  matches(url) {
    return /^https:\/\/www\.perplexity\.ai\//.test(url);
  },
  parse(document) {
    return parseConversationWithConfig(document, {
      platform: "perplexity",
      rootSelectors: ["main", "[role='tabpanel']", "[class*='thread']", "[class*='conversation']", "body"],
      messageSelectors: ["h1[class*='group/query']", "div.prose"],
      titleSelectors: ["main h1", "header h1", "title"],
      modelSelectors: ["header button", "[class*='model']", "[data-testid*='model']"],
    });
  },
};

export default parser;
