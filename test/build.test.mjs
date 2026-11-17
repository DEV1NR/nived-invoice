import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('build produces a single self-contained page', () => {
  execFileSync('node', [join(root, 'build.mjs')], { cwd: root });
  const out = join(root, 'dist/index.html');
  assert.ok(existsSync(out));
  const html = readFileSync(out, 'utf8');
  assert.ok(html.includes('NivedCore'));
  assert.ok(!html.includes('<!--CORE-->'));
  assert.ok(!/\bexport\s/.test(html));
  assert.ok(!html.includes('<script src='));
  assert.ok(html.includes('@page'));
  assert.ok(html.includes('size: A4'));
  assert.ok(html.includes('Bricolage+Grotesque'));
  assert.ok(html.includes('JetBrains+Mono'));
  assert.ok(html.includes('Curiosity first. Intention always.'));
});
