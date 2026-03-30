const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium } = require("playwright");

const PLATFORM_CONFIGS = [
  {
    platform: "chatgpt",
    homeUrl: "https://chatgpt.com/",
    rootSelectors: ["main", "[data-testid='conversation-view']", "#thread", "body"],
    messageSelectors: [
      "[data-message-author-role]",
      "article[data-testid*='conversation-turn']",
      "div[data-message-author-role]",
    ],
    titleSelectors: ["nav h1", "main h1", "header h1"],
    modelSelectors: ["header button", "nav button", "[data-testid='model-switcher-dropdown-button']"],
    conversationHrefPatterns: ["/c/"],
  },
  {
    platform: "claude",
    homeUrl: "https://claude.ai/",
    rootSelectors: ["main", "[data-test-id='conversation']", "body"],
    messageSelectors: [
      "[data-testid='user-message']",
      ".font-claude-response.relative",
    ],
    titleSelectors: ["[data-testid='chat-title-button']", "title"],
    modelSelectors: ["[data-testid='model-selector-dropdown']", "[data-testid*='model']", "header button"],
    conversationHrefPatterns: ["/chat/"],
  },
  {
    platform: "gemini",
    homeUrl: "https://gemini.google.com/",
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
    conversationHrefPatterns: ["/app/"],
  },
  {
    platform: "perplexity",
    homeUrl: "https://www.perplexity.ai/",
    rootSelectors: ["main", "[role='tabpanel']", "[class*='thread']", "[class*='conversation']", "body"],
    messageSelectors: ["h1[class*='group/query']", "div.prose"],
    titleSelectors: ["main h1", "header h1", "title"],
    modelSelectors: ["header button", "[class*='model']", "[data-testid*='model']"],
    conversationHrefPatterns: ["/search/", "/page/"],
  },
];

const IGNORED_PATH_SEGMENTS = new Set([
  "Cache",
  "Code Cache",
  "GPUCache",
  "GrShaderCache",
  "Media Cache",
  "ShaderCache",
]);

const IGNORED_FILE_BASENAMES = new Set([
  "LOCK",
  "lockfile",
  "SingletonCookie",
  "SingletonLock",
  "SingletonSocket",
]);

function ensureDirectory(target) {
  fs.mkdirSync(target, { recursive: true });
}

function readJson(target) {
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

function sanitizeSegment(value) {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
}

function trimText(value, limit = 220) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function isTruthyEnv(name) {
  return /^(1|true|yes)$/i.test(process.env[name] ?? "");
}

function shouldIgnorePath(target) {
  const segments = target.split(path.sep);
  return segments.some((segment) => IGNORED_PATH_SEGMENTS.has(segment));
}

function copyTree(source, destination, summary) {
  if (shouldIgnorePath(source)) {
    summary.ignored += 1;
    return;
  }

  const basename = path.basename(source);
  if (IGNORED_FILE_BASENAMES.has(basename)) {
    summary.ignored += 1;
    return;
  }

  let stat;
  try {
    stat = fs.lstatSync(source);
  } catch (error) {
    summary.skipped.push({
      source,
      reason: error.code ?? String(error),
    });
    return;
  }

  if (stat.isDirectory()) {
    ensureDirectory(destination);
    for (const entry of fs.readdirSync(source)) {
      copyTree(path.join(source, entry), path.join(destination, entry), summary);
    }
    return;
  }

  if (!stat.isFile()) {
    return;
  }

  ensureDirectory(path.dirname(destination));
  try {
    fs.copyFileSync(source, destination);
    summary.copiedFiles += 1;
  } catch (error) {
    summary.skipped.push({
      source,
      reason: error.code ?? String(error),
    });
  }
}

function buildProfileSnapshot(sourceRoot, profileName, snapshotRoot) {
  const profileIncludePaths = [
    "Preferences",
    "Secure Preferences",
    "Local Storage",
    "Network",
    "Session Storage",
    "SharedStorage",
    "Storage",
    "WebStorage",
  ];

  if (isTruthyEnv("AIWA_QA_INCLUDE_HISTORY")) {
    profileIncludePaths.push("History");
  }

  if (isTruthyEnv("AIWA_QA_INCLUDE_INDEXEDDB")) {
    profileIncludePaths.push("IndexedDB");
  }

  if (isTruthyEnv("AIWA_QA_INCLUDE_SERVICE_WORKER")) {
    profileIncludePaths.push("Service Worker");
  }

  if (isTruthyEnv("AIWA_QA_INCLUDE_FILE_SYSTEM")) {
    profileIncludePaths.push("File System");
  }

  const summary = {
    copiedFiles: 0,
    ignored: 0,
    skipped: [],
  };

  ensureDirectory(snapshotRoot);
  copyTree(path.join(sourceRoot, "Local State"), path.join(snapshotRoot, "Local State"), summary);
  ensureDirectory(path.join(snapshotRoot, profileName));
  for (const relativePath of profileIncludePaths) {
    const sourcePath = path.join(sourceRoot, profileName, relativePath);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    copyTree(sourcePath, path.join(snapshotRoot, profileName, relativePath), summary);
  }

  return {
    copiedFiles: summary.copiedFiles,
    ignoredEntries: summary.ignored,
    skippedCount: summary.skipped.length,
    skippedSamples: summary.skipped.slice(0, 25),
  };
}

async function settlePage(page, waitMs = 4000) {
  await page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(waitMs);
}

async function navigate(page, url) {
  try {
    await page.goto(url, {
      waitUntil: "commit",
      timeout: 45000,
    });

    return {
      ok: true,
      finalUrl: page.url(),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      finalUrl: page.url(),
    };
  }
}

function attachPageDiagnostics(page, bucket) {
  page.on("console", (message) => {
    const type = message.type();
    if (type === "error" || type === "warning") {
      bucket.push({
        type,
        text: trimText(message.text(), 400),
      });
    }
  });

  page.on("pageerror", (error) => {
    bucket.push({
      type: "pageerror",
      text: trimText(error.message, 400),
    });
  });
}

async function discoverConversationLink(page, config) {
  return page.evaluate(({ conversationHrefPatterns, homeUrl }) => {
    const patterns = conversationHrefPatterns.map((pattern) => new RegExp(pattern, "i"));
    const entries = Array.from(document.querySelectorAll("a[href]"))
      .map((anchor) => {
        const href = anchor.href;
        const text = (anchor.textContent ?? "").replace(/\s+/g, " ").trim();
        return {
          href,
          text,
          ariaLabel: anchor.getAttribute("aria-label") ?? undefined,
        };
      })
      .filter((entry) => entry.href && patterns.some((pattern) => pattern.test(entry.href)))
      .filter((entry) => entry.href !== homeUrl)
      .filter((entry) => !/(new chat|new thread|home|discover|library|spaces|settings)/i.test(entry.text))
      .sort((left, right) => {
        const leftScore = (left.text ? 10 : 0) + left.href.length;
        const rightScore = (right.text ? 10 : 0) + right.href.length;
        return rightScore - leftScore;
      });

    return entries[0] ?? null;
  }, config);
}

async function collectProbe(page, config) {
  return page.evaluate((parserConfig) => {
    const sampleLimit = 5;

    function text(value, limit = 240) {
      return String(value ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, limit);
    }

    function queryFirst(root, selectors) {
      for (const selector of selectors) {
        const node = root.querySelector(selector);
        if (node) {
          return {
            selector,
            node,
          };
        }
      }

      return null;
    }

    function uniqueElements(elements) {
      return elements.filter(
        (element, index) => elements.findIndex((candidate) => candidate === element) === index,
      );
    }

    function dropNested(elements) {
      return elements.filter(
        (element) => !elements.some((candidate) => candidate !== element && candidate.contains(element)),
      );
    }

    function sortByDocumentOrder(elements) {
      return [...elements].sort((left, right) => {
        if (left === right) {
          return 0;
        }

        const position = left.compareDocumentPosition(right);
        if (position & 2) {
          return 1;
        }

        if (position & 4) {
          return -1;
        }

        return 0;
      });
    }

    function queryAllUnique(root, selectors) {
      const nodes = uniqueElements(
        selectors.flatMap((selector) => Array.from(root.querySelectorAll(selector))),
      );
      return sortByDocumentOrder(dropNested(nodes));
    }

    function inferRole(element) {
      const explicit = element.getAttribute("data-message-author-role");
      if (explicit === "user" || explicit === "assistant" || explicit === "system") {
        return explicit;
      }

      const metadata = [
        element.getAttribute("data-testid"),
        element.getAttribute("aria-label"),
        typeof element.className === "string" ? element.className : undefined,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (/(assistant|claude|chatgpt|gemini|model|response|prose)/.test(metadata)) {
        return "assistant";
      }

      if (/(user|human|prompt|query)/.test(metadata)) {
        return "user";
      }

      if (/(system|tool)/.test(metadata)) {
        return "system";
      }

      const previewText = text(element.textContent, 80).toLowerCase();
      if (/(you said|human:|user:|prompt:)/.test(previewText)) {
        return "user";
      }

      if (/(assistant|claude|chatgpt|gemini|model|response)/.test(previewText)) {
        return "assistant";
      }

      if (/(system|tool)/.test(previewText)) {
        return "system";
      }

      return "unknown";
    }

    function findText(selectors) {
      for (const selector of selectors) {
        const node = document.querySelector(selector);
        const value = text(node?.textContent);
        if (value) {
          return {
            selector,
            text: value,
          };
        }
      }

      return null;
    }

    const rootMatch = queryFirst(document, parserConfig.rootSelectors);
    const root = rootMatch?.node ?? document.body;
    const messageSelectorCounts = parserConfig.messageSelectors.map((selector) => ({
      selector,
      count: root.querySelectorAll(selector).length,
    }));
    const candidates = queryAllUnique(root, parserConfig.messageSelectors);
    const messageElements = candidates.length > 0 ? candidates : [root];
    const sampledMessages = messageElements
      .map((element, index) => ({
        index,
        role: inferRole(element),
        tagName: element.tagName.toLowerCase(),
        text: text(element.innerText || element.textContent, 320),
        ariaLabel: element.getAttribute("aria-label") ?? undefined,
        dataTestId: element.getAttribute("data-testid") ?? undefined,
      }))
      .filter((entry) => entry.text.length > 0)
      .slice(0, sampleLimit);

    const bodyText = text(document.body?.innerText, 1500);
    const anchorCandidates = Array.from(document.querySelectorAll("a[href]"))
      .map((anchor) => ({
        href: anchor.href,
        text: text(anchor.textContent, 120),
      }))
      .filter((entry) =>
        parserConfig.conversationHrefPatterns.some((pattern) => new RegExp(pattern, "i").test(entry.href)),
      )
      .slice(0, 8);

    const hasComposer = Boolean(
      document.querySelector(
        "textarea, [contenteditable='true'], input[placeholder*='Ask'], input[placeholder*='Message']",
      ),
    );
    const hasAccountButton = Boolean(
      document.querySelector(
        "[aria-label*='account' i], [aria-label*='profile' i], img[alt*='profile' i], button[aria-haspopup='menu']",
      ),
    );
    const authTextHit = /(log in|login|sign in|sign up|continue with google|continue with email)/i.test(
      bodyText,
    );
    const authUrlHit = /(login|signin|auth|register)/i.test(location.pathname);
    const loginPromptHit =
      /(sign up for free|continue with google|continue with email|continue with sso|log in to get answers based on saved chats|before you continue)/i.test(
        bodyText,
      );
    const challengeHit = /(cloudflare|security verification|challenge detected|just a moment)/i.test(
      bodyText,
    );

    let authState = "unknown";
    if (challengeHit) {
      authState = "blocked_by_challenge";
    } else if (
      (authUrlHit || loginPromptHit || authTextHit) &&
      anchorCandidates.length === 0 &&
      sampledMessages.length <= 1
    ) {
      authState = "unauthenticated";
    } else if (hasComposer || hasAccountButton || anchorCandidates.length > 0) {
      authState = "authenticated";
    } else if (authTextHit) {
      authState = "maybe_unauthenticated";
    }

    return {
      locationHref: location.href,
      pageTitle: text(document.title, 180),
      rootSelectorUsed: rootMatch?.selector ?? null,
      rootTagName: root?.tagName?.toLowerCase() ?? null,
      messageSelectorCounts,
      uniqueMessageCount: candidates.length,
      fallbackUsed: candidates.length === 0,
      sampleMessages: sampledMessages,
      titleMatch: findText(parserConfig.titleSelectors),
      modelMatch: findText(parserConfig.modelSelectors),
      bodySnippet: bodyText,
      anchorCandidates,
      authSignals: {
        hasComposer,
        hasAccountButton,
        authTextHit,
        authUrlHit,
        loginPromptHit,
        challengeHit,
      },
      authState,
    };
  }, config);
}

function summarizePlatform(result) {
  if (!result.navigation.ok) {
    return "fail";
  }

  if (result.finalProbe?.authState === "unauthenticated") {
    return "warn";
  }

  if (!result.finalProbe?.rootSelectorUsed) {
    return "warn";
  }

  if ((result.finalProbe?.uniqueMessageCount ?? 0) === 0) {
    return "warn";
  }

  return "pass";
}

async function probePlatform(context, reportDir, config) {
  const page = await context.newPage();
  const diagnostics = [];
  attachPageDiagnostics(page, diagnostics);

  const baseName = sanitizeSegment(config.platform);
  const homeScreenshotPath = path.join(reportDir, `${baseName}-home.png`);
  const finalScreenshotPath = path.join(reportDir, `${baseName}-final.png`);

  try {
    const navigation = await navigate(page, config.homeUrl);
    if (!navigation.ok) {
      return {
        platform: config.platform,
        navigation,
        diagnostics,
        status: "fail",
      };
    }

    await settlePage(page);
    await page.screenshot({ path: homeScreenshotPath, fullPage: true }).catch(() => {});
    const homeProbe = await collectProbe(page, config);

    let conversationLink = null;
    let conversationNavigation = null;
    if (homeProbe.authState !== "unauthenticated" && homeProbe.uniqueMessageCount === 0) {
      conversationLink = await discoverConversationLink(page, config);
      if (conversationLink?.href) {
        conversationNavigation = await navigate(page, conversationLink.href);
        if (conversationNavigation.ok) {
          await settlePage(page, 5000);
        }
      }
    }

    await page.screenshot({ path: finalScreenshotPath, fullPage: true }).catch(() => {});
    const finalProbe = await collectProbe(page, config);

    const result = {
      platform: config.platform,
      navigation,
      homeProbe,
      conversationLink,
      conversationNavigation,
      finalProbe,
      diagnostics: diagnostics.slice(0, 25),
      screenshots: {
        home: path.relative(process.cwd(), homeScreenshotPath),
        final: path.relative(process.cwd(), finalScreenshotPath),
      },
    };

    return {
      ...result,
      status: summarizePlatform(result),
    };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const repo = process.cwd();
  const cdpEndpoint = process.env.AIWA_QA_CDP_ENDPOINT;
  const timestamp = sanitizeSegment(new Date().toISOString());
  const reportDir = path.join(repo, "output", "playwright", `live-parser-qa-${timestamp}`);
  ensureDirectory(reportDir);
  const headless = cdpEndpoint ? false : isTruthyEnv("AIWA_QA_HEADLESS");

  let chromeUserDataRoot = null;
  let profileName = null;
  let snapshotRoot = null;
  let copySummary = null;
  let browser = null;
  let context = null;

  if (cdpEndpoint) {
    browser = await chromium.connectOverCDP(cdpEndpoint);
    context = browser.contexts()[0];
    if (!context) {
      throw new Error(`No browser context available via CDP endpoint ${cdpEndpoint}`);
    }
  } else {
    chromeUserDataRoot =
      process.env.AIWA_CHROME_USER_DATA_DIR ??
      path.join(
        process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"),
        "Google",
        "Chrome",
        "User Data",
      );
    const localStatePath = path.join(chromeUserDataRoot, "Local State");
    if (!fs.existsSync(localStatePath)) {
      throw new Error(`Chrome Local State not found at ${localStatePath}`);
    }

    const localState = readJson(localStatePath);
    profileName = process.env.AIWA_CHROME_PROFILE ?? localState.profile?.last_used ?? "Default";
    const sourceProfileDir = path.join(chromeUserDataRoot, profileName);
    if (!fs.existsSync(sourceProfileDir)) {
      throw new Error(`Chrome profile not found at ${sourceProfileDir}`);
    }

    const snapshotBase = process.env.AIWA_QA_SNAPSHOT_ROOT ?? os.tmpdir();
    ensureDirectory(snapshotBase);
    snapshotRoot = fs.mkdtempSync(path.join(snapshotBase, "aiwa-live-parser-"));
    copySummary = buildProfileSnapshot(chromeUserDataRoot, profileName, snapshotRoot);

    context = await chromium.launchPersistentContext(snapshotRoot, {
      channel: "chrome",
      headless,
      viewport: { width: 1440, height: 1100 },
      args: [
        `--profile-directory=${profileName}`,
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });
  }

  try {
    const platforms = [];
    for (const config of PLATFORM_CONFIGS) {
      platforms.push(await probePlatform(context, reportDir, config));
    }

    const report = {
      generatedAt: new Date().toISOString(),
      mode: cdpEndpoint ? "attached" : "snapshot",
      cdpEndpoint: cdpEndpoint ?? null,
      chromeUserDataRoot,
      profileName,
      headless,
      copySummary,
      reportDir: path.relative(repo, reportDir),
      platforms,
      summary: {
        pass: platforms.filter((platform) => platform.status === "pass").length,
        warn: platforms.filter((platform) => platform.status === "warn").length,
        fail: platforms.filter((platform) => platform.status === "fail").length,
      },
    };

    const reportPath = path.join(reportDir, "live-parser-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (cdpEndpoint) {
      await browser?.close().catch(() => {});
    } else {
      await context?.close().catch(() => {});
      if (snapshotRoot) {
        fs.rmSync(snapshotRoot, { recursive: true, force: true });
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
