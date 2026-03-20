import { load } from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, 'site-mirror');
const HOME_COPY = 'mirrored-home.html';
const AUDIT_MARKER = '<!-- ux-audit-page-list -->';

const TRACKING_HOST_RE =
  /^(?:.*\.)?(googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com|facebook\.net|connect\.facebook\.net|hotjar\.com|segment\.(com|io)|cdn\.segment\.com|api\.segment\.io|plausible\.io|clarity\.ms|fullstory\.com|mxpnl\.com|mixpanel\.com|heapanalytics\.com|cdn\.heapanalytics\.com|amplitude\.com|cdn\.amplitude\.com|hs-scripts\.com|js\.hs-scripts\.com|js\.hs-analytics\.net|usemessages\.com|hs-banner\.com|optimizely\.com|cdn\.optimizely\.com|browser-update\.org|static\.ads-twitter\.com|snap\.licdn\.com|px\.ads\.linkedin\.com|bat\.bing\.com|sc\.static\.net)$/i;

const TRACKING_SRC_RE =
  /googletagmanager|google-analytics|analytics\.google|g\.doubleclick|doubleclick|facebook\.net|connect\.facebook|hotjar|segment\.(?:com|io)|plausible\.io|clarity\.ms|fullstory|mxpnl|mixpanel|heap\.|heapanalytics|amplitude|hs-scripts|hs-analytics|hubspot.*\.js|optimizely|browser-update|ads-twitter|snap\.licdn|linkedin\.com\/px|bat\.bing|static\.hotjar/i;

const INLINE_TRACKING_RE =
  /gtag\s*\(|dataLayer\.|googletagmanager|GTM-[A-Z0-9]+|fbq\s*\(|facebook\s*pixel|analytics\.js|ga\s*\(\s*['"]create|_gaq\.|hjBootstrap|hj\(|hotjar|plausible\(|mixpanel\.|amplitude\.|segment\.|heap\.|fullstory|optimizely|linkedin_insight|lms_analytics/i;

const BAR_HTML = `
<div id="ux-audit-spacer" style="height:56px" aria-hidden="true"></div>
<div id="ux-audit-bar" role="region" aria-label="UX audit notes" style="position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#12121a;color:#e8e8ef;padding:10px 16px;box-shadow:0 -4px 24px rgba(0,0,0,.35);font:14px/1.4 system-ui,-apple-system,sans-serif;display:flex;align-items:center;gap:12px;border-top:1px solid #2a2a38;">
  <label for="ux-audit-notes" style="white-space:nowrap;font-weight:600;flex-shrink:0;">UX notes</label>
  <input id="ux-audit-notes" type="text" placeholder="Notes for this page (saved locally in your browser)…" style="flex:1;min-width:0;padding:8px 12px;border-radius:8px;border:1px solid #3d3d52;background:#fff;color:#111;" autocomplete="off" />
</div>
<script>
(function(){
  var el = document.getElementById('ux-audit-notes');
  if (!el) return;
  var k = 'ux-audit-notes:' + location.pathname;
  try { el.value = localStorage.getItem(k) || ''; } catch (e) {}
  el.addEventListener('input', function () {
    try { localStorage.setItem(k, el.value); } catch (e) {}
  });
})();
</script>
`.trim();

function isTrackingScript($, el) {
  const $el = $(el);
  const src = ($el.attr('src') || '').trim();
  if (src) {
    const lower = src.toLowerCase();
    if (TRACKING_SRC_RE.test(lower)) return true;
    try {
      const u = new URL(src, 'https://nearform.com/');
      if (TRACKING_HOST_RE.test(u.hostname)) return true;
    } catch {
      /* ignore */
    }
  }
  const inline = $el.html() || '';
  if (INLINE_TRACKING_RE.test(inline)) return true;
  return false;
}

function stripAndAnnotate(html) {
  const $ = load(html, { decodeEntities: false });
  $('script').each((_, el) => {
    if (isTrackingScript($, el)) $(el).remove();
  });
  $('link[rel="preconnect"][href*="googletagmanager.com"]').remove();
  $('link[rel="dns-prefetch"][href*="googletagmanager.com"]').remove();
  $('noscript').each((_, el) => {
    const inner = $(el).html() || '';
    if (/googletagmanager\.com|google-analytics\.com|doubleclick\.net/i.test(inner)) $(el).remove();
  });
  if ($('#ux-audit-bar').length === 0) {
    $('body').append(BAR_HTML);
  }
  return $.root().html();
}

function walkHtmlFiles(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) out.push(...walkHtmlFiles(p));
    else if (name.isFile() && name.name.endsWith('.html')) out.push(p);
  }
  return out;
}

// Preserve scraped homepage before we replace index.html with the audit listing
const homePath = path.join(root, HOME_COPY);
const indexPath = path.join(root, 'index.html');
if (fs.existsSync(indexPath) && !fs.existsSync(homePath)) {
  fs.renameSync(indexPath, homePath);
}

const htmlPaths = walkHtmlFiles(root);
for (const file of htmlPaths) {
  const raw = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, stripAndAnnotate(raw), 'utf8');
}

// Build audit index grouped by directory (relative to site-mirror)
const relFiles = htmlPaths
  .map((p) => path.relative(root, p).split(path.sep).join('/'))
  .filter((f) => f !== 'index.html')
  .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

const byDir = new Map();
for (const f of relFiles) {
  const d = path.posix.dirname(f);
  const key = d === '.' ? '(site root)' : d;
  if (!byDir.has(key)) byDir.set(key, []);
  byDir.get(key).push(f);
}

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

let body = `${AUDIT_MARKER}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nearform mirror — page index (UX audit)</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px 24px 96px; background: #f4f4f7; color: #1a1a1f; }
    h1 { font-size: 1.5rem; margin: 0 0 8px; }
    p { margin: 0 0 24px; color: #444; max-width: 60ch; }
    section { margin-bottom: 32px; }
    h2 { font-size: 1.05rem; margin: 0 0 12px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
    ul { list-style: none; padding: 0; margin: 0; columns: 1; column-gap: 24px; }
    @media (min-width: 640px) { ul { columns: 2; } }
    @media (min-width: 1100px) { ul { columns: 3; } }
    li { break-inside: avoid; margin: 0 0 6px; }
    a { color: #1a56b0; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .count { color: #666; font-weight: normal; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Scraped pages <span class="count">(${relFiles.length} files)</span></h1>
  <p>Mirror of <a href="https://nearform.com">nearform.com</a> for offline UX review. Homepage copy: <a href="${esc(HOME_COPY)}">${esc(HOME_COPY)}</a>. Tracking scripts were removed; notes field persists per path in <code>localStorage</code>.</p>
`;

const dirKeys = [...byDir.keys()].sort((a, b) => a.localeCompare(b));
for (const dir of dirKeys) {
  const files = byDir.get(dir);
  body += `  <section>\n    <h2>${esc(dir)} <span class="count">(${files.length})</span></h2>\n    <ul>\n`;
  for (const f of files) {
    body += `      <li><a href="${esc(f)}">${esc(f)}</a></li>\n`;
  }
  body += `    </ul>\n  </section>\n`;
}

body += `</body>\n</html>\n`;

fs.writeFileSync(indexPath, stripAndAnnotate(body), 'utf8');

console.log('Post-process done:', root);
console.log('Open listing:', indexPath);
