import { afterEach, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import claudeParser from "../claude";
import geminiParser from "../gemini";
import perplexityParser from "../perplexity";
import { queryAllUnique } from "./parserTypes";

const globalKeys = ["location", "crypto", "HTMLElement"] as const;
const originalDescriptors = new Map<string, PropertyDescriptor | undefined>();

function installDomGlobals(window: Window) {
  const values = {
    location: window.location,
    crypto: window.crypto,
    HTMLElement: (window as Window & typeof globalThis).HTMLElement,
  } satisfies Record<(typeof globalKeys)[number], unknown>;

  for (const key of globalKeys) {
    if (!originalDescriptors.has(key)) {
      originalDescriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    }

    Object.defineProperty(globalThis, key, {
      configurable: true,
      value: values[key],
    });
  }
}

function restoreDomGlobals() {
  for (const key of globalKeys) {
    const descriptor = originalDescriptors.get(key);
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor);
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (globalThis as Record<string, unknown>)[key];
  }
}

function createDocument(html: string, url: string) {
  const dom = new JSDOM(html, { url });
  installDomGlobals(dom.window as unknown as Window);
  return dom.window.document;
}

function firstText(message: { contentBlocks: Array<{ type: string; text?: string }> }) {
  const block = message.contentBlocks[0];
  return block?.type === "text" ? block.text ?? "" : "";
}

afterEach(() => {
  restoreDomGlobals();
});

describe("queryAllUnique", () => {
  it("returns matches in document order across selector groups", () => {
    const document = createDocument(
      `
        <body>
          <div id="user-1" class="user">First user</div>
          <div id="assistant-1" class="assistant">First assistant</div>
          <div id="user-2" class="user">Second user</div>
          <div id="assistant-2" class="assistant">Second assistant</div>
        </body>
      `,
      "https://example.com",
    );

    const ids = queryAllUnique(document.body, [".user", ".assistant"]).map((element) =>
      element.getAttribute("id"),
    );

    expect(ids).toEqual(["user-1", "assistant-1", "user-2", "assistant-2"]);
  });
});

describe("platform parsers", () => {
  it("captures Claude user and assistant turns in sequence", () => {
    const document = createDocument(
      `
        <body>
          <button data-testid="chat-title-button">Saboteur game replica with enhanced features</button>
          <button data-testid="model-selector-dropdown">Sonnet 4.6</button>
          <div data-testid="user-message">
            <p>can you make me a replica?</p>
          </div>
          <div class="font-claude-response relative">
            <div class="standard-markdown">
              <p>Now let me build this game.</p>
            </div>
          </div>
          <div data-testid="user-message">
            <p>cool ok</p>
          </div>
          <div class="font-claude-response relative">
            <div class="standard-markdown">
              <p>Gauged user satisfaction and opted for brevity.</p>
            </div>
          </div>
        </body>
      `,
      "https://claude.ai/chat/test-thread",
    );

    const parsed = claudeParser.parse(document);

    expect(parsed).not.toBeNull();
    expect(parsed?.sourceTitle).toBe("Saboteur game replica with enhanced features");
    expect(parsed?.modelName).toBe("Sonnet 4.6");
    expect(parsed?.candidateMessageCount).toBe(4);
    expect(parsed?.messages.map((message) => message.role)).toEqual([
      "user",
      "assistant",
      "user",
      "assistant",
    ]);
    expect(parsed?.messages.map((message) => message.contentBlocks[0]?.type)).toEqual([
      "text",
      "text",
      "text",
      "text",
    ]);
    expect(parsed?.messages.map((message) => firstText(message))).toEqual([
      "can you make me a replica?",
      "Now let me build this game.",
      "cool ok",
      "Gauged user satisfaction and opted for brevity.",
    ]);
  });

  it("captures Gemini user and assistant turns from the live container structure", () => {
    const document = createDocument(
      `
        <body>
          <chat-window-content>
            <span data-test-id="conversation-title">Current Time Inquiry</span>
            <button data-test-id="bard-mode-menu-button">Fast</button>
            <div class="conversation-container message-actions-hover-boundary">
              <div class="user-query-container">
                <div class="query-text">You said what time is it</div>
              </div>
              <div class="response-container response-container-with-gpi">
                <div class="response-content">
                  <p>Gemini said 3:38 PM</p>
                </div>
              </div>
            </div>
            <div class="conversation-container message-actions-hover-boundary">
              <div class="user-query-container">
                <div class="query-text">You said thanks</div>
              </div>
              <div class="response-container response-container-with-gpi">
                <div class="response-content">
                  <p>Gemini said You're welcome</p>
                </div>
              </div>
            </div>
          </chat-window-content>
        </body>
      `,
      "https://gemini.google.com/app/test-thread",
    );

    const parsed = geminiParser.parse(document);

    expect(parsed).not.toBeNull();
    expect(parsed?.sourceTitle).toBe("Current Time Inquiry");
    expect(parsed?.modelName).toBe("Fast");
    expect(parsed?.candidateMessageCount).toBe(4);
    expect(parsed?.messages.map((message) => message.role)).toEqual([
      "user",
      "assistant",
      "user",
      "assistant",
    ]);
    expect(parsed?.messages.map((message) => firstText(message))).toEqual([
      "You said what time is it",
      "Gemini said 3:38 PM",
      "You said thanks",
      "Gemini said You're welcome",
    ]);
  });

  it("captures Perplexity query and answer blocks from current search threads", () => {
    const document = createDocument(
      `
        <body>
          <main>
            <h1 class="group/query relative">What time is it in London right now?</h1>
            <div class="prose dark:prose-invert inline">
              <p>It’s 6:49 AM in London right now, on Monday, March 30, 2026, BST.</p>
            </div>
          </main>
        </body>
      `,
      "https://www.perplexity.ai/search/what-time-is-it-in-london-right-now",
    );

    const parsed = perplexityParser.parse(document);

    expect(parsed).not.toBeNull();
    expect(parsed?.sourceTitle).toBe("What time is it in London right now?");
    expect(parsed?.candidateMessageCount).toBe(2);
    expect(parsed?.messages.map((message) => message.role)).toEqual(["user", "assistant"]);
    expect(parsed?.messages.map((message) => firstText(message))).toEqual([
      "What time is it in London right now?",
      "It’s 6:49 AM in London right now, on Monday, March 30, 2026, BST.",
    ]);
  });
});
