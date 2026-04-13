#!/usr/bin/env node
/**
 * Open Services orbital diagram in the browser with Figma html-to-design hash params.
 * Usage: node scripts/open-orbital-figma-capture.mjs <captureId> [port]
 * Example: node scripts/open-orbital-figma-capture.mjs e68e9da9-97b2-47f5-85cd-72aa195c66f9 4173
 */
import { spawn } from 'child_process';
import process from 'process';

const captureId = process.argv[2];
const port = process.argv[3] || '4173';

if (!captureId || captureId.startsWith('-')) {
  console.error('Usage: node scripts/open-orbital-figma-capture.mjs <captureId> [port]');
  process.exit(1);
}

const endpoint = `https://mcp.figma.com/mcp/capture/${captureId}/submit`;
const figmaendpoint = encodeURIComponent(endpoint);
const hash = [
  `figmacapture=${captureId}`,
  `figmaendpoint=${figmaendpoint}`,
  'figmadelay=3500',
  'figmaselector=%23orbital-convergence',
].join('&');

/* figmaRaster=1 swaps the DOM for a flat PNG — Figma’s importer reliably picks up <img> */
const url = `http://localhost:${port}/services.html?orbitalStatic=1&figmaRaster=1#${hash}`;

const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
const child =
  process.platform === 'win32'
    ? spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true })
    : spawn(opener, [url], { stdio: 'ignore', detached: true });

child.unref();
console.log(url);
