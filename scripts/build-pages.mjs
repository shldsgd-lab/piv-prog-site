import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const output = resolve(root, 'dist');
if (output !== resolve(root, 'dist')) throw new Error('Unexpected Pages output directory.');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'app.js', 'styles.css']) {
  await cp(resolve(root, file), resolve(output, file));
}
console.log('Cloudflare Pages assets prepared in dist/.');
