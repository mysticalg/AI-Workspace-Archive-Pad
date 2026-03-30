const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

function requirePath(target, label) {
  if (!fs.existsSync(target)) {
    throw new Error(`${label} not found at ${target}. Run the build first.`);
  }
}

function ensureDirectory(target) {
  fs.mkdirSync(target, { recursive: true });
}

function addDirectoryToZip(zip, directory, root = directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(root, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      addDirectoryToZip(zip, fullPath, root);
      continue;
    }

    zip.file(relativePath, fs.readFileSync(fullPath));
  }
}

async function main() {
  const repo = process.cwd();
  const extensionDist = path.join(repo, "extension", "dist");
  const extensionPackage = JSON.parse(
    fs.readFileSync(path.join(repo, "extension", "package.json"), "utf8"),
  );
  const manifest = JSON.parse(fs.readFileSync(path.join(extensionDist, "manifest.json"), "utf8"));
  const outputDir = path.join(repo, "artifacts");
  const fileName = `ai-workspace-archive-extension-v${extensionPackage.version}.zip`;
  const manifestName = `ai-workspace-archive-extension-v${extensionPackage.version}.json`;

  requirePath(extensionDist, "Built extension");
  ensureDirectory(outputDir);

  const zip = new JSZip();
  addDirectoryToZip(zip, extensionDist);

  const archive = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  fs.writeFileSync(path.join(outputDir, fileName), archive);
  fs.writeFileSync(
    path.join(outputDir, manifestName),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "extension/dist",
        artifact: fileName,
        extensionVersion: extensionPackage.version,
        manifestVersion: manifest.version,
        extensionName: manifest.name,
      },
      null,
      2,
    ),
  );

  console.log(
    JSON.stringify(
      {
        artifact: path.join("artifacts", fileName),
        manifest: path.join("artifacts", manifestName),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
