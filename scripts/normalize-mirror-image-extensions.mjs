#!/usr/bin/env node
/**
 * Next.js mirror saved optimized images as extensionless files (image_123).
 * Static servers (serve, Live Preview) often omit image/* Content-Type, so
 * <img src="image_226"> appears broken. Rename to image_123.png|.jpg from
 * magic bytes and rewrite references in mirror HTML/CSS/JS.
 *
 * Run from repo root: node scripts/normalize-mirror-image-extensions.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MIRROR = path.join(ROOT, "site-mirror");

const NAME_RE = /^image_(\d+)$/;

function sniffExt(filePath) {
  const fd = fs.openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(12);
    const n = fs.readSync(fd, buf, 0, 12, 0);
    if (n < 3) return null;
    if (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    ) {
      return ".png";
    }
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
      return ".jpg";
    }
    if (
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      n >= 12 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    ) {
      return ".webp";
    }
    return null;
  } finally {
    fs.closeSync(fd);
  }
}

function collectRenames() {
  /** @type {Map<string, string>} bareName -> newName with ext */
  const map = new Map();
  for (const ent of fs.readdirSync(MIRROR, { withFileTypes: true })) {
    if (!ent.isFile()) continue;
    if (!NAME_RE.test(ent.name)) continue;
    const oldPath = path.join(MIRROR, ent.name);
    const ext = sniffExt(oldPath);
    if (!ext) {
      console.warn("skip (unknown type):", ent.name);
      continue;
    }
    const newName = `${ent.name}${ext}`;
    map.set(ent.name, newName);
  }
  return map;
}

function renameFiles(map) {
  let ok = 0;
  let skip = 0;
  for (const [oldName, newName] of map) {
    const oldPath = path.join(MIRROR, oldName);
    const newPath = path.join(MIRROR, newName);
    if (fs.existsSync(newPath)) {
      console.warn("target exists, skip rename:", newName);
      skip += 1;
      continue;
    }
    fs.renameSync(oldPath, newPath);
    ok += 1;
  }
  console.log("Renamed files:", ok, "skipped:", skip);
}

const TEXT_EXT = /\.(html|css|js|mjs|svg|json)$/i;

function* mirrorTextFiles(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".git") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      yield* mirrorTextFiles(p);
    } else if (TEXT_EXT.test(ent.name)) {
      yield p;
    }
  }
}

function rewriteReferences(map) {
  /** Do not match `image_226` inside `image_226.png` (already fixed). */
  const re = /\bimage_\d+\b(?!\.)/g;
  let files = 0;
  let hits = 0;
  for (const filePath of mirrorTextFiles(MIRROR)) {
    const raw = fs.readFileSync(filePath, "utf8");
    if (!/\bimage_\d+\b(?!\.)/.test(raw)) continue;
    const next = raw.replace(re, (m) => {
      if (!map.has(m)) return m;
      hits += 1;
      return map.get(m);
    });
    if (next !== raw) {
      fs.writeFileSync(filePath, next, "utf8");
      files += 1;
    }
  }
  console.log("Updated text files:", files, "placeholder refs rewritten:", hits);
}

function main() {
  const map = collectRenames();
  console.log("Extensionless image_* files:", map.size);
  if (map.size === 0) {
    console.log("Nothing to do.");
    return;
  }
  renameFiles(map);
  rewriteReferences(map);
  console.log("Done.");
}

main();
