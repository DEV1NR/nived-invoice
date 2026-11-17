import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'test/print_check.py');
const hasChrome = existsSync('/usr/bin/google-chrome');

test('F1/F4: long invoice prints total; number follows issue date', { skip: !hasChrome && 'no chrome' }, () => {
  execFileSync('node', [join(root, 'build.mjs')], { cwd: root });
  const out = execFileSync('python3', ['-I', script, join(root, 'dist/index.html')], { encoding: 'utf8' });
  const r = JSON.parse(out.trim().split('\n').pop());
  assert.deepEqual(r.errors, []);
  assert.equal(r.numberAfterYearChange, 'NVD-2027-001');
  assert.ok(r.pdfText.includes('Rp 30.000.000'), 'total missing from PDF');
  assert.ok(r.pdfText.includes('a.n. Nived Studio'), 'bank details missing from PDF');
  assert.ok(r.pdfText.includes('nived.studio'), 'footer missing from PDF');
  assert.ok(r.pages >= 2);
});
