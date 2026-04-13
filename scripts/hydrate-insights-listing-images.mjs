#!/usr/bin/env node
/**
 * Replace broken / placeholder image refs on Insights listing cards and on
 * individual insight-article mirror pages (Next.js image_* assets that were not
 * scraped, etc.) using each article’s twitter:image / og:image and related-card targets.
 *
 * Updates:
 *   - site-mirror/insights.html (source for build-insights-explore)
 *   - site-mirror/insights-engineering-community.html (if present)
 *   - every *.html with data-nf-layout="insight-article"
 *
 * Run: node scripts/hydrate-insights-listing-images.mjs
 * Then: npm run build-insights-explore
 */

import fs from "fs";
import path from "path";
import { load } from "cheerio";
import { fileURLToPath } from "url";
import { readOgImageUrl } from "./mirror-og-image.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MIRROR = path.join(ROOT, "site-mirror");

const LISTING_TARGETS = ["insights.html", "insights-engineering-community.html"];

/** Next mirror assets: extensionless or .png/.jpg/.webp after normalize-mirror-image-extensions.mjs */
const IMAGE_MIRROR_FILE = /^image_\d+(\.(?:png|jpe?g|webp))?$/i;

function needsHydration(src) {
  if (!src) return true;
  const s = String(src).trim();
  if (/^https?:\/\//i.test(s)) return false;
  const local = path.join(MIRROR, s.replace(/^\//, ""));
  if (IMAGE_MIRROR_FILE.test(s)) return !fs.existsSync(local);
  return !fs.existsSync(local);
}

/**
 * @param {import("cheerio").CheerioAPI} $
 * @param {import("cheerio").Element} el
 */
function hydrateCard($, el, cache) {
  const block = $(el);
  const mainA = block.find('a.group.overflow-hidden[href$=".html"]').first();
  const href = mainA.attr("href");
  if (!href) return false;

  const img = mainA.find("img").first();
  if (!img.length) return false;
  if (!needsHydration(img.attr("src"))) return false;

  let url = cache.get(href);
  if (url === undefined) {
    url = readOgImageUrl(MIRROR, href) || null;
    cache.set(href, url);
  }
  if (!url) return false;

  img.attr("src", url);
  img.attr("srcset", `${url} 1x, ${url} 2x`);
  return true;
}

function processListingFile(relPath) {
  const filePath = path.join(MIRROR, relPath);
  if (!fs.existsSync(filePath)) {
    console.warn("skip (missing):", relPath);
    return { file: relPath, cards: 0, updated: 0 };
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const $ = load(raw);
  const cache = new Map();
  let updated = 0;

  $(".nf-insights-article-card").each((_, el) => {
    if (hydrateCard($, el, cache)) updated += 1;
  });

  fs.writeFileSync(filePath, $.html(), "utf8");
  const total = $(".nf-insights-article-card").length;
  console.log(relPath, "— cards:", total, "images hydrated:", updated);
  return { file: relPath, cards: total, updated };
}

function resolveImgFallback($, img, selfName) {
  const parentA = img.closest('a[href$=".html"]');
  if (parentA.length) {
    const href = (parentA.attr("href") || "").trim();
    if (href && href !== selfName) {
      const u = readOgImageUrl(MIRROR, href);
      if (u) return u;
    }
  }
  return readOgImageUrl(MIRROR, selfName);
}

function processInsightArticleFile(fileName) {
  const filePath = path.join(MIRROR, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.includes('data-nf-layout="insight-article"')) return 0;

  const $ = load(raw);
  let updated = 0;

  $("main img").each((_, el) => {
    const img = $(el);
    const src = (img.attr("src") || "").trim();
    if (/^https?:\/\//i.test(src)) return;

    const localPath = (s) =>
      path.join(MIRROR, String(s).replace(/^\//, ""));

    const srcOk = src && fs.existsSync(localPath(src));

    const srcset = (img.attr("srcset") || "").trim();
    const srcsetPaths = [
      ...srcset.matchAll(/\b(image_\d+(?:\.(?:png|jpe?g|webp))?)\b/gi),
    ].map((m) => m[1]);
    const srcsetBroken =
      srcsetPaths.length > 0 &&
      srcsetPaths.some((id) => !fs.existsSync(localPath(id)));

    if (srcOk && !srcsetBroken) return;

    const fallback = resolveImgFallback($, img, fileName);
    if (!fallback) return;

    img.attr("src", fallback);
    img.attr("srcset", `${fallback} 1x, ${fallback} 2x`);
    updated += 1;
  });

  if (updated > 0) {
    fs.writeFileSync(filePath, $.html(), "utf8");
  }
  return updated;
}

function processAllInsightArticles() {
  const names = fs.readdirSync(MIRROR).filter((f) => f.endsWith(".html"));
  let files = 0;
  let imgs = 0;
  for (const name of names) {
    const p = path.join(MIRROR, name);
    const head = fs.readFileSync(p, "utf8").slice(0, 120000);
    if (!head.includes('data-nf-layout="insight-article"')) continue;
    const n = processInsightArticleFile(name);
    if (n > 0) {
      files += 1;
      imgs += n;
    }
  }
  console.log(
    "insight-article pages:",
    "files touched:",
    files,
    "img tags fixed:",
    imgs,
  );
}

function main() {
  let sum = 0;
  for (const f of LISTING_TARGETS) {
    const r = processListingFile(f);
    sum += r.updated;
  }
  console.log("Listing: total card images updated:", sum);

  processAllInsightArticles();

  console.log("Done.");
  console.log("Run: npm run build-insights-explore");
}

main();
