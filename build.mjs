import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const core = readFileSync(join(root, 'src/core.js'), 'utf8').replace(/^export\s+/gm, '');
const app = readFileSync(join(root, 'src/app.html'), 'utf8');
if (!app.includes('<!--CORE-->')) throw new Error('app.html is missing the <!--CORE--> marker');
const out = app.replace('<!--CORE-->', () => `<script>\n${core}</script>`);
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/index.html'), out);
writeFileSync(join(root, 'invoice.html'), out);
console.log('built dist/index.html');
