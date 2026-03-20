import scrape from 'website-scraper';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'site-mirror');

await rm(outDir, { recursive: true, force: true });

const nearformHost = /^(www\.)?nearform\.com$/i;

await scrape({
  urls: ['https://nearform.com/'],
  directory: outDir,
  recursive: true,
  // Cap depth so blog archives do not enqueue thousands of pages; raise if you need full crawl
  maxRecursiveDepth: 6,
  prettifyUrls: true,
  ignoreErrors: true,
  request: {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
  },
  urlFilter: (url) => {
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
      if (nearformHost.test(u.hostname)) return true;
      // Third-party: only fetch obvious static assets (avoid crawling external sites)
      const p = u.pathname.toLowerCase();
      return /\.(css|js|mjs|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|mp4|webm|avif|json)(\?|$)/i.test(
        p,
      );
    } catch {
      return false;
    }
  },
});

console.log('Mirror complete:', outDir);
