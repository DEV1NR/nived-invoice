import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('new invoice, reset defaults, and undo', { skip: !existsSync('/usr/bin/google-chrome') && 'no chrome' }, () => {
  execFileSync('node', [join(root, 'build.mjs')], { cwd: root });
  const out = execFileSync('python3', ['-I', join(root, 'test/reset_check.py'), join(root, 'dist/index.html')], { encoding: 'utf8' });
  const r = JSON.parse(out.trim().split('\n').pop());
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.afterNew, { client: '', lines: 0, notes: '', total: 'Rp 0' });
  assert.deepEqual(r.afterUndoNew, { client: 'PT Kopi Senja', lines: 2, notes: 'Thanks', total: 'Rp 4.700.000' });
  assert.deepEqual(r.afterReset, { bank: 'BCA', holder: 'Nived Studio', hostingPrice: '1.200.000', prefix: 'NVD', storedBank: 'BCA' });
  assert.deepEqual(r.afterUndoReset, { bank: 'Mandiri', holder: 'Nived', hostingPrice: '999.000', prefix: 'NIV', storedBank: 'Mandiri' });
  assert.equal(r.linesKeptOnReset, 2);
});
