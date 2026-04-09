/**
 * Capture a static reference PNG of #orbital-convergence for Figma handoff.
 * Requires: npx playwright install chromium (once)
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'handoff', 'orbital-convergence-diagram');
const outFile = path.join(outDir, '06-reference-screenshot-2x.png');
const url = `file://${path.join(root, 'site-mirror', 'services.html')}?orbitalStatic=1`;

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    deviceScaleFactor: 2,
    viewport: { width: 1600, height: 1200 },
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
  await page.addStyleTag({
    content: `
      .orbital-pulse-layer { display: none !important; }
      body { background: #f8fafc !important; }
    `,
  });
  await new Promise((r) => setTimeout(r, 400));
  const fig = page.locator('#orbital-convergence');
  await fig.scrollIntoViewIfNeeded();
  await fig.screenshot({ path: outFile, type: 'png' });
  console.log('Wrote', outFile);
} finally {
  await browser.close();
}
