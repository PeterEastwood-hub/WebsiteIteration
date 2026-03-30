/**
 * Starts the site-mirror static server on 127.0.0.1:4173 and opens the Insights Explore hub
 * in the default browser after a short delay. Keep this process running while you preview.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const url = 'http://127.0.0.1:4173/insights-explore.html';

function openBrowser() {
  const { platform } = process;
  if (platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
  } else if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore',
      shell: true,
    }).unref();
  } else {
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  }
}

const serve = spawn(
  'npx',
  ['--yes', 'serve', 'site-mirror', '-l', 'tcp://127.0.0.1:4173', '--no-etag'],
  {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  },
);

setTimeout(openBrowser, 1500);

serve.on('error', (err) => {
  console.error(err);
  process.exit(1);
});

serve.on('exit', (code) => {
  process.exit(code ?? 0);
});
