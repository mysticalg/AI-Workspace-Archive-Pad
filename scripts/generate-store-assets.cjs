const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium } = require("playwright");

function ensureDirectory(target) {
  fs.mkdirSync(target, { recursive: true });
}

function requirePath(target, label) {
  if (!fs.existsSync(target)) {
    throw new Error(`${label} not found at ${target}. Run the build first.`);
  }
}

function readDataUrl(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  const value = fs.readFileSync(filePath).toString("base64");
  return `data:${mimeType};base64,${value}`;
}

async function gotoDemoPage(page, url) {
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => document.body?.dataset.ready === "true", undefined, {
    timeout: 15000,
  });
  await page.waitForTimeout(400);
}

async function captureExtensionView(context, options) {
  const page = await context.newPage();
  try {
    await page.setViewportSize(options.viewport);
    await gotoDemoPage(page, options.url);

    if (typeof options.prepare === "function") {
      await options.prepare(page);
    }

    await page.waitForTimeout(250);
    await page.screenshot({
      path: options.path,
      fullPage: false,
    });
  } finally {
    await page.close();
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderFeatureHtml(config) {
  const tiny = config.width <= 500;
  const badges = config.badges
    .map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`)
    .join("");
  const secondary = config.secondaryImage
    ? `
      <div class="shot secondary ${config.secondaryKind || "wide"}">
        <img src="${config.secondaryImage}" alt="" />
      </div>
    `
    : "";

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(config.title)}</title>
        <style>
          :root {
            color-scheme: light;
            font-family: "Segoe UI Variable Display", "Segoe UI", sans-serif;
            --navy: #10223d;
            --sky: #2f6df6;
            --teal: #dbfbf2;
            --gold: #fff1db;
            --line: rgba(16, 34, 61, 0.14);
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            width: ${config.width}px;
            height: ${config.height}px;
            overflow: hidden;
            color: #f7fbff;
            background:
              radial-gradient(circle at 14% 20%, rgba(86, 183, 255, 0.34), transparent 32%),
              radial-gradient(circle at 88% 82%, rgba(255, 206, 125, 0.2), transparent 26%),
              linear-gradient(135deg, #0d1c35, #17345f 58%, #244f93);
          }

          .canvas {
            width: 100%;
            height: 100%;
            padding: ${tiny ? 20 : config.compact ? 28 : 42}px;
            display: grid;
            grid-template-columns: ${tiny ? "0.88fr 1.12fr" : config.compact ? "1.05fr 1fr" : "0.94fr 1.06fr"};
            gap: ${tiny ? 14 : config.compact ? 24 : 36}px;
            align-items: center;
          }

          .copy {
            display: flex;
            flex-direction: column;
            gap: ${tiny ? 12 : config.compact ? 16 : 22}px;
            max-width: ${tiny ? 170 : config.compact ? 430 : 470}px;
          }

          .kicker {
            font-size: ${tiny ? 11 : config.compact ? 13 : 14}px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.72);
          }

          h1 {
            margin: 0;
            font-size: ${tiny ? 32 : config.compact ? 42 : 56}px;
            line-height: 0.98;
            letter-spacing: -0.04em;
          }

          p {
            margin: 0;
            color: rgba(247, 251, 255, 0.84);
            font-size: ${tiny ? 12 : config.compact ? 18 : 21}px;
            line-height: 1.45;
          }

          .badge-row {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            padding: ${tiny ? "6px 10px" : "9px 14px"};
            border-radius: 999px;
            font-size: ${tiny ? 10 : 13}px;
            font-weight: 700;
            color: var(--navy);
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .visual {
            position: relative;
            min-height: ${tiny ? 220 : config.compact ? 360 : 520}px;
          }

          .deck {
            position: absolute;
            inset: 0;
          }

          .shot {
            position: absolute;
            overflow: hidden;
            border-radius: ${tiny ? 18 : config.compact ? 22 : 28}px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(225, 236, 255, 0.96));
            border: 1px solid var(--line);
            box-shadow:
              0 30px 80px rgba(7, 17, 34, 0.36),
              inset 0 1px 0 rgba(255, 255, 255, 0.7);
          }

          .shot.primary {
            width: ${config.primaryKind === "narrow" ? (tiny ? 180 : config.compact ? 260 : 340) : tiny ? 220 : config.compact ? 420 : 620}px;
            height: ${config.primaryKind === "narrow" ? (tiny ? 210 : config.compact ? 320 : 560) : tiny ? 160 : config.compact ? 310 : 560}px;
            right: ${tiny ? 0 : config.compact ? 20 : 10}px;
            top: ${tiny ? 10 : config.compact ? 20 : 8}px;
            transform: rotate(-2.4deg);
            padding: ${tiny ? 10 : 16}px;
          }

          .shot.secondary {
            width: ${config.secondaryKind === "narrow" ? (tiny ? 120 : config.compact ? 200 : 260) : tiny ? 150 : config.compact ? 260 : 360}px;
            height: ${config.secondaryKind === "narrow" ? (tiny ? 150 : config.compact ? 250 : 380) : tiny ? 100 : config.compact ? 200 : 270}px;
            left: 0;
            bottom: ${tiny ? 8 : config.compact ? 10 : 24}px;
            transform: rotate(3deg);
            padding: ${tiny ? 8 : 12}px;
            background: linear-gradient(180deg, rgba(220, 251, 242, 0.97), rgba(255, 255, 255, 0.96));
          }

          .shot img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
            border-radius: ${tiny ? 12 : config.compact ? 16 : 18}px;
            background: white;
          }

          .footer {
            position: absolute;
            left: ${tiny ? 20 : config.compact ? 28 : 42}px;
            bottom: ${tiny ? 12 : config.compact ? 22 : 28}px;
            font-size: 12px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: rgba(247, 251, 255, 0.6);
            display: ${tiny ? "none" : "block"};
          }
        </style>
      </head>
      <body>
        <main class="canvas">
          <section class="copy">
            <div class="kicker">${escapeHtml(config.kicker)}</div>
            <h1>${escapeHtml(config.title)}</h1>
            <p>${escapeHtml(config.body)}</p>
            <div class="badge-row">${badges}</div>
          </section>
          <section class="visual">
            <div class="deck">
              <div class="shot primary ${config.primaryKind || "wide"}">
                <img src="${config.primaryImage}" alt="" />
              </div>
              ${secondary}
            </div>
          </section>
        </main>
        <div class="footer">AI Workspace Archive</div>
      </body>
    </html>
  `;
}

async function renderGraphic(browserContext, config, outputPath) {
  const page = await browserContext.newPage();
  try {
    await page.setViewportSize({ width: config.width, height: config.height });
    await page.setContent(renderFeatureHtml(config), { waitUntil: "load" });
    await page.screenshot({
      path: outputPath,
      fullPage: false,
    });
  } finally {
    await page.close();
  }
}

async function main() {
  const repo = process.cwd();
  const extensionPath = path.join(repo, "extension", "dist");
  const rawDir = path.join(repo, "output", "playwright", "store-assets");
  const assetDir = path.join(repo, "assets", "chrome-web-store");
  const screenshotDir = path.join(assetDir, "screenshots");
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "aiwa-store-"));

  requirePath(extensionPath, "Built extension");
  ensureDirectory(rawDir);
  ensureDirectory(screenshotDir);

  const builtManifest = JSON.parse(
    fs.readFileSync(path.join(extensionPath, "manifest.json"), "utf8"),
  );

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    headless: true,
    viewport: { width: 1440, height: 1200 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });

  try {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker", { timeout: 15000 });
    }

    const extensionId = new URL(serviceWorker.url()).host;
    const popupUrl = `chrome-extension://${extensionId}/${builtManifest.action.default_popup}?demo=1`;
    const optionsUrl = `chrome-extension://${extensionId}/${builtManifest.options_page}?demo=1`;
    const sidepanelUrl = `chrome-extension://${extensionId}/${builtManifest.side_panel.default_path}?demo=1`;

    const rawShots = {
      popup: path.join(rawDir, "popup.png"),
      sidepanel: path.join(rawDir, "sidepanel-overview.png"),
      sidepanelSearch: path.join(rawDir, "sidepanel-search.png"),
      options: path.join(rawDir, "options-controls.png"),
      optionsImport: path.join(rawDir, "options-import.png"),
    };

    await captureExtensionView(context, {
      url: popupUrl,
      path: rawShots.popup,
      viewport: { width: 620, height: 1100 },
    });

    await captureExtensionView(context, {
      url: sidepanelUrl,
      path: rawShots.sidepanel,
      viewport: { width: 1280, height: 1220 },
    });

    await captureExtensionView(context, {
      url: sidepanelUrl,
      path: rawShots.sidepanelSearch,
      viewport: { width: 1280, height: 1220 },
      prepare: async (page) => {
        await page.getByLabel("Query").fill("pricing");
        await page.getByRole("button", { name: "Run Search" }).click();
        await page.waitForTimeout(300);
      },
    });

    await captureExtensionView(context, {
      url: optionsUrl,
      path: rawShots.options,
      viewport: { width: 1440, height: 1220 },
    });

    await captureExtensionView(context, {
      url: optionsUrl,
      path: rawShots.optionsImport,
      viewport: { width: 1440, height: 1100 },
      prepare: async (page) => {
        await page.getByRole("heading", { name: "Import and Deletion" }).scrollIntoViewIfNeeded();
        await page.waitForTimeout(250);
      },
    });

    const screenshotAssets = [
      {
        file: "01-capture-current-chat.png",
        title: "Capture current AI chats with one click",
        caption: "The popup keeps save actions simple, explicit, and local-first.",
        config: {
          width: 1280,
          height: 800,
          kicker: "Manual Capture",
          title: "Capture current AI chats with one click",
          body: "Save visible conversations into projects, keep notes next to the source thread, and open the full archive when you need to organize the work.",
          badges: ["Popup workflow", "Manual save only", "Local archive"],
          primaryImage: readDataUrl(rawShots.popup),
          secondaryImage: readDataUrl(rawShots.sidepanel),
          primaryKind: "narrow",
          secondaryKind: "wide",
        },
      },
      {
        file: "02-project-timeline.png",
        title: "Route captures into durable projects",
        caption: "Projects, timeline history, and export actions sit above any individual chat app.",
        config: {
          width: 1280,
          height: 800,
          kicker: "Project Layer",
          title: "Route captures into durable projects",
          body: "Organize records by project, keep export history attached, and turn scattered prompts into something the rest of the team can actually review.",
          badges: ["Projects", "Timeline", "Batch export"],
          primaryImage: readDataUrl(rawShots.sidepanel),
          primaryKind: "wide",
        },
      },
      {
        file: "03-search-local-archive.png",
        title: "Search local archives by project and platform",
        caption: "Find exact decisions, prompts, and outputs without reopening old tabs.",
        config: {
          width: 1280,
          height: 800,
          kicker: "Search + Filters",
          title: "Search local archives by project and platform",
          body: "Query records instantly, filter by workspace, and keep research, delivery, and launch conversations separated without losing recall.",
          badges: ["Full text search", "Project filters", "Cross-platform"],
          primaryImage: readDataUrl(rawShots.sidepanelSearch),
          primaryKind: "wide",
        },
      },
      {
        file: "04-control-site-access.png",
        title: "Control exactly where the extension can run",
        caption: "Supported sites are granted one by one, with onboarding and privacy disclosure built in.",
        config: {
          width: 1280,
          height: 800,
          kicker: "Optional Site Access",
          title: "Control exactly where the extension can run",
          body: "Grant or remove access per platform, keep onboarding explicit, and show reviewers what is captured before any archive item is saved.",
          badges: ["Optional permissions", "Onboarding", "Privacy disclosure"],
          primaryImage: readDataUrl(rawShots.options),
          primaryKind: "wide",
        },
      },
      {
        file: "05-import-and-cleanup.png",
        title: "Import existing exports and wipe local data cleanly",
        caption: "Bring in ChatGPT exports, review what is stored, and remove everything when needed.",
        config: {
          width: 1280,
          height: 800,
          kicker: "Import + Delete",
          title: "Import existing exports and wipe local data cleanly",
          body: "Import normalized JSON or ChatGPT export files, keep the archive portable, and offer direct local wipe controls instead of trapping data inside the extension.",
          badges: ["ChatGPT import", "Portable export", "Full local wipe"],
          primaryImage: readDataUrl(rawShots.optionsImport),
          primaryKind: "wide",
        },
      },
    ];

    const promoAssets = [
      {
        file: "small-promo-tile.png",
        title: "Archive AI work locally",
        type: "small_promo",
        config: {
          width: 440,
          height: 280,
          kicker: "Chrome Extension",
          title: "Archive AI work locally",
          body: "Capture, search, and export visible AI chats without surrendering the archive.",
          badges: ["Local-first", "Exportable"],
          primaryImage: readDataUrl(rawShots.popup),
          primaryKind: "narrow",
          compact: true,
        },
      },
      {
        file: "marquee-promo-tile.png",
        title: "Own your AI workspace",
        type: "marquee",
        config: {
          width: 1400,
          height: 560,
          kicker: "AI Workspace Archive",
          title: "Own your AI workspace",
          body: "Save visible ChatGPT, Claude, Gemini, and Perplexity threads into projects you can search and export.",
          badges: ["Manual capture", "Project archive", "Optional site access"],
          primaryImage: readDataUrl(rawShots.sidepanel),
          secondaryImage: readDataUrl(rawShots.popup),
          primaryKind: "wide",
          secondaryKind: "narrow",
          compact: true,
        },
      },
    ];

    for (const item of screenshotAssets) {
      await renderGraphic(context, item.config, path.join(screenshotDir, item.file));
    }

    for (const item of promoAssets) {
      await renderGraphic(context, item.config, path.join(assetDir, item.file));
    }

    const manifest = {
      generatedAt: new Date().toISOString(),
      extensionId,
      screenshots: screenshotAssets.map(({ file, title, caption }) => ({
        file: `screenshots/${file}`,
        title,
        caption,
      })),
      promo: promoAssets.map(({ file, title, type }) => ({
        file,
        title,
        type,
      })),
    };

    fs.writeFileSync(
      path.join(assetDir, "asset-manifest.json"),
      JSON.stringify(manifest, null, 2),
    );

    console.log(JSON.stringify(manifest, null, 2));
  } finally {
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
