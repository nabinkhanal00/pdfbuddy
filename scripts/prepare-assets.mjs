import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const publicDir = join(rootDir, "public");

mkdirSync(publicDir, { recursive: true });

const assetCopies = [
  {
    source: join(
      rootDir,
      "node_modules",
      "@neslinesli93",
      "qpdf-wasm",
      "dist",
      "qpdf.wasm",
    ),
    target: join(publicDir, "qpdf.wasm"),
  },
  {
    source: join(
      rootDir,
      "node_modules",
      "@neslinesli93",
      "qpdf-wasm",
      "dist",
      "qpdf.js",
    ),
    target: join(publicDir, "qpdf.js"),
  },
  {
    source: join(
      rootDir,
      "node_modules",
      "pdfjs-dist",
      "build",
      "pdf.worker.min.mjs",
    ),
    target: join(publicDir, "pdf.worker.min.mjs"),
  },
];

for (const asset of assetCopies) {
  if (existsSync(asset.source)) {
    copyFileSync(asset.source, asset.target);
  }
}

const chromiumBinDir = join(
  rootDir,
  "node_modules",
  "@sparticuz",
  "chromium",
  "bin",
);
const chromiumTarget = join(publicDir, "chromium-pack.tar");
const chromiumFiles = [
  "chromium.br",
  "fonts.tar.br",
  "swiftshader.tar.br",
  "al2023.tar.br",
];

if (chromiumFiles.every((file) => existsSync(join(chromiumBinDir, file)))) {
  execFileSync(
    "tar",
    ["-cf", chromiumTarget, "-C", chromiumBinDir, ...chromiumFiles],
    { cwd: rootDir },
  );
}
