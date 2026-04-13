/**
 * Ensures site-mirror is served on port 4173 (localhost, IPv4 + IPv6), then opens the preview hub
 * in Cursor's Simple Browser (in-editor tab), not Chrome/Safari.
 *
 * Run: npm run preview:cursor
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const PORT = 4173;
const HUB = `http://localhost:${PORT}/cursor-preview-hub`;

function ping(cb) {
  const req = http.get(HUB, (res) => {
    res.resume();
    cb(true);
  });
  req.on('error', () => cb(false));
  req.setTimeout(2500, () => {
    req.destroy();
    cb(false);
  });
}

function waitForServer(maxMs = 30000) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const poll = () => {
      ping((ok) => {
        if (ok) return resolve();
        if (Date.now() - t0 > maxMs) {
          return reject(
            new Error(
              `Nothing answered on ${HUB} within ${maxMs / 1000}s. Check that port ${PORT} is free.`,
            ),
          );
        }
        setTimeout(poll, 400);
      });
    };
    poll();
  });
}

function openCursorSimpleBrowser() {
  const uri = `cursor://vscode.simple-browser/show?url=${encodeURIComponent(HUB)}`;
  if (process.platform === 'darwin') {
    spawn('open', [uri], { detached: true, stdio: 'ignore' }).unref();
  } else if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', uri], {
      detached: true,
      stdio: 'ignore',
      shell: true,
    }).unref();
  } else {
    spawn('xdg-open', [uri], { detached: true, stdio: 'ignore' }).unref();
  }
}

async function main() {
  const alreadyUp = await new Promise((r) => ping(r));

  if (!alreadyUp) {
    console.log('Starting preview server on http://localhost:4173 …');
    const child = spawn(
      'npx',
      ['--yes', 'serve', 'site-mirror', '-p', String(PORT), '--no-etag'],
      {
        cwd: root,
        detached: true,
        stdio: 'ignore',
        shell: process.platform === 'win32',
      },
    );
    child.unref();
  }

  try {
    await waitForServer();
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }

  console.log('\nOpening in Cursor Simple Browser (in-editor preview tab)…\n');
  openCursorSimpleBrowser();

  console.log('── Two different things in Cursor ──');
  console.log('• EDITOR tab (what you have now for .html files) = SOURCE CODE only.');
  console.log('• SIMPLE BROWSER tab = the real website you can click around.\n');
  console.log('If no new tab appeared, do this manually:');
  console.log('  1. Cmd+Shift+P');
  console.log('  2. Type:  Simple Browser: Show');
  console.log('  3. Paste: ' + HUB);
  console.log('');

  if (!alreadyUp) {
    console.log('Preview server is running in the background. To stop:');
    console.log('  lsof -ti :4173 | xargs kill\n');
  }

  process.exit(0);
}

main();
