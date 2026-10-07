import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
// The app is authored as deployable static files. The cloud build validates
// that exact output; no dependencies or network calls are needed to build it.
for (const filename of ['app.js', 'guide.js', 'catalogue.js', 'slime-guide.js', 'engine.js', 'sw.js']) {
  const check = spawnSync(process.execPath, ['--check', path.join(dist, filename)], { stdio: 'inherit' });
  if (check.status !== 0) throw new Error(`Invalid JavaScript: ${filename}`);
}
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
const manifest = JSON.parse(await readFile(path.join(dist, 'manifest.webmanifest'), 'utf8'));
for (const filename of ['index.html', 'style.css', 'app.js', 'guide.js', 'catalogue.js', 'slime-guide.js', 'engine.js', 'sw.js', 'favicon.svg']) {
  await access(path.join(dist, filename));
}
for (const icon of manifest.icons) await access(path.join(dist, icon.src));
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(?:https?:|#|\.\/\s*$)/.test(match[1])) continue;
  await access(path.join(dist, match[1]));
}
const sw = await readFile(path.join(dist, 'sw.js'), 'utf8');
for (const match of sw.matchAll(/'\.\/([^']+)'/g)) await access(path.join(dist, match[1]));
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML element IDs');
if (manifest.start_url !== '/' || manifest.scope !== '/') throw new Error('PWA must be hosted at the origin root');
const tests = spawnSync(process.execPath, ['--test', 'tests/app.test.mjs'], { cwd: root, stdio: 'inherit' });
if (tests.status !== 0) throw new Error('App verification failed');
console.log('Mycelium ready: verified static PWA in dist/.');
