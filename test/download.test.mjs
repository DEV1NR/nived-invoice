import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('Download PDF saves a clean A4 file named Name-Invoice.pdf', { skip: !existsSync('/usr/bin/google-chrome') && 'no chrome' }, () => {
  execFileSync('node', [join(root, 'build.mjs')], { cwd: root });
  const outdir = join(root, '.superpowers/pdfs'); mkdirSync(outdir, { recursive: true });
  const out = execFileSync('python3', ['-I', join(root, 'test/download_check.py'), join(root, 'dist/index.html'), outdir], { encoding: 'utf8' });
  const r = JSON.parse(out.trim().split('\n').pop());
  assert.deepEqual(r.errors, []);
  assert.equal(r.filename, 'Warkop-Pasundan-Invoice.pdf');
  assert.equal(r.short.pages, 1);
  assert.match(r.short.size, /\(A4\)/);
  assert.equal(r.numberAfter, 'NVD-2026-002');
  assert.equal(r.editingAfter, false);
  assert.equal(r.long.pages, 2);
  assert.ok(r.leftMarginPx >= 40, 'content touches the left edge: ' + r.leftMarginPx);
  assert.match(r.long.size, /\(A4\)/);
});
