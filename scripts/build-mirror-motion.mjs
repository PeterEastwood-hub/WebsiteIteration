import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

await esbuild.build({
  entryPoints: [path.join(root, 'scripts', 'mirror-motion-entry.mjs')],
  bundle: true,
  outfile: path.join(root, 'site-mirror', 'js', 'mirror-motion.js'),
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
});

console.log('Built site-mirror/js/mirror-motion.js');
