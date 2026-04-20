/**
 * Full-page PNGs for PDF handoff: Insights index, Communities listing, one article.
 * Requires mirror preview, e.g. `npx serve -l 5173 site-mirror` (default base below).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.env.MIRROR_PREVIEW_URL || 'http://localhost:5173';
const OUT_DIR = path.join(__dirname, '..', 'export', 'pdf-handoff-screenshots');

const SHOTS = [
  {
    name: '01-insights-full-page.png',
    url: `${BASE}/insights.html`,
    title: 'Insights (full page)',
  },
  {
    name: '02-communities-full-page.png',
    url: `${BASE}/insights-engineering-community.html`,
    title: 'Communities listing (full page)',
  },
  {
    name: '03-article-example-full-page.png',
    url: `${BASE}/implementing-model-context-protocol-mcp-tips-tricks-and-pitfalls.html`,
    title: 'Article example (full page)',
  },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  for (const shot of SHOTS) {
    process.stderr.write(`Capturing ${shot.title} … ${shot.url}\n`);
    const res = await page.goto(shot.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!res || !res.ok()) {
      throw new Error(`HTTP not OK for ${shot.url}: ${res && res.status()}`);
    }
    await new Promise((r) => setTimeout(r, 2500));
    const dest = path.join(OUT_DIR, shot.name);
    await page.screenshot({ path: dest, fullPage: true, type: 'png' });
    process.stderr.write(`  wrote ${dest}\n`);
  }

  await browser.close();
  process.stdout.write(
    JSON.stringify(
      {
        outDir: OUT_DIR,
        files: SHOTS.map((s) => s.name),
        base: BASE,
      },
      null,
      2,
    ) + '\n',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
