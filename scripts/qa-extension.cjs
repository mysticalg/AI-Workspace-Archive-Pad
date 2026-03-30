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

async function gotoWithRetry(page, url, attempts = 3) {
  let lastError;
  for (let index = 0; index < attempts; index += 1) {
    try {
      await page.goto(url, { waitUntil: "load" });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(1000);
    }
  }

  throw lastError;
}

async function main() {
  const repo = process.cwd();
  const extensionPath = path.join(repo, "extension", "dist");
  const outputDir = path.join(repo, "output", "playwright");
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "aiwa-chrome-"));
  const builtManifest = JSON.parse(
    fs.readFileSync(path.join(extensionPath, "manifest.json"), "utf8"),
  );

  requirePath(extensionPath, "Built extension");
  ensureDirectory(outputDir);

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    headless: false,
    viewport: { width: 1440, height: 1100 },
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
    const optionsUrl = `chrome-extension://${extensionId}/${builtManifest.options_page}`;
    const sidepanelUrl = `chrome-extension://${extensionId}/${builtManifest.side_panel.default_path}`;

    const optionsPage = await context.newPage();
    await gotoWithRetry(optionsPage, optionsUrl);
    await optionsPage.waitForTimeout(1500);
    await optionsPage.locator("body").waitFor({ state: "visible" });
    await optionsPage.screenshot({
      path: path.join(outputDir, "options-page.png"),
      fullPage: true,
    });
    const optionsText = await optionsPage.locator("body").innerText();
    const optionsTextLower = optionsText.toLowerCase();
    const initialChatgptPermission = await optionsPage.evaluate(async () => {
      return chrome.permissions.contains({ origins: ["https://chatgpt.com/*"] });
    });
    await optionsPage.evaluate(async () => {
      await chrome.permissions.remove({ origins: ["https://chatgpt.com/*"] });
    });
    const chatgptPermissionAfterRemoval = await optionsPage.evaluate(async () => {
      return chrome.permissions.contains({ origins: ["https://chatgpt.com/*"] });
    });

    const sidepanelPage = await context.newPage();
    await gotoWithRetry(sidepanelPage, sidepanelUrl);
    await sidepanelPage.waitForTimeout(1500);
    await sidepanelPage.screenshot({
      path: path.join(outputDir, "sidepanel-page.png"),
      fullPage: true,
    });
    const sidepanelText = await sidepanelPage.locator("body").innerText();

    const chatgptPage = await context.newPage();
    let chatgptReachable = true;
    try {
      await chatgptPage.goto("https://chatgpt.com/", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await chatgptPage.waitForTimeout(3000);
      await chatgptPage.screenshot({
        path: path.join(outputDir, "chatgpt-without-access.png"),
        fullPage: true,
      });
    } catch {
      chatgptReachable = false;
    }

    const overlayExists = chatgptReachable
      ? await chatgptPage.evaluate(() => Boolean(document.getElementById("aiwa-overlay-host")))
      : null;

    const report = {
      extensionId,
      initialChatgptPermission,
      chatgptPermissionAfterRemoval,
      optionsContains: {
        onboarding: optionsText.includes("First-Run Onboarding"),
        platformControls: optionsText.includes("Platform Controls"),
        captureDisclosure: optionsText.includes("Capture Disclosure"),
        importSection:
          optionsTextLower.includes("import normalized json") &&
          optionsTextLower.includes("chatgpt export zip/json"),
      },
      sidepanelContains: {
        projectLayer: sidepanelText.includes("Project Layer"),
        captureConsole: sidepanelText.includes("Capture Console"),
        archiveSearch: sidepanelText.includes("Archive Search"),
      },
      chatgptReachable,
      chatgptOverlayExistsWithoutPermission: overlayExists,
      capturedAt: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(outputDir, "qa-report.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
