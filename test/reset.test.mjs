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
  assert.deepEqual(r.afterReset, { bank: '', holder: 'Nived Studio', hostingPrice: '1.200.000', prefix: 'NVD', storedBank: '' });
  assert.deepEqual(r.afterUndoReset, { bank: 'Mandiri', holder: 'Nived', hostingPrice: '999.000', prefix: 'NIV', storedBank: 'Mandiri' });
  assert.equal(r.linesKeptOnReset, 2);
});

test('fresh page shows no bank name on the paper', { skip: !existsSync('/usr/bin/google-chrome') && 'no chrome' }, () => {
  execFileSync('node', [join(root, 'build.mjs')], { cwd: root });
  const out = execFileSync('python3', ['-I', '-c', `
import sys, json
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome'); pg = b.new_page()
    pg.route(lambda u: not u.startswith('file:'), lambda r: r.abort())
    pg.goto('file://' + sys.argv[1]); pg.evaluate('localStorage.clear()'); pg.reload()
    print(json.dumps({'bank': pg.text_content('#pBank')}))
`, join(root, 'dist/index.html')], { encoding: 'utf8' });
  assert.equal(JSON.parse(out.trim()).bank.includes('BCA'), false);
});
