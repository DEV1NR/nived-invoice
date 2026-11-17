import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseDateDMY } from '../src/core.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('parses dates typed on the paper', () => {
  assert.equal(parseDateDMY('17.11.2026'), '2026-11-17');
  assert.equal(parseDateDMY('1/2/2027'), '2027-02-01');
  assert.equal(parseDateDMY(' 05-03-2026 '), '2026-03-05');
  assert.equal(parseDateDMY('31.02.2026'), '');
  assert.equal(parseDateDMY('tomorrow'), '');
});

test('editing on the paper updates form and totals', { skip: !existsSync('/usr/bin/google-chrome') && 'no chrome' }, () => {
  execFileSync('node', [join(root, 'build.mjs')], { cwd: root });
  const out = execFileSync('python3', ['-I', join(root, 'test/edit_check.py'), join(root, 'dist/index.html')], { encoding: 'utf8' });
  const r = JSON.parse(out.trim().split('\n').pop());
  assert.deepEqual(r.errors, []);
  assert.equal(r.formClient, 'PT Kopi Senja');
  assert.equal(r.priceCell, '2.000.000');
  assert.equal(r.amountCell, '4.000.000');
  assert.equal(r.total, 'Rp 4.000.000');
  assert.equal(r.formPrice, '2.000.000');
  assert.equal(r.formIssue, '2026-12-20');
  assert.equal(r.badDateReverted, '20.12.2026');
  assert.equal(r.formDesc, 'Website build');
  assert.equal(r.linesAfterAdd, 2);
  assert.equal(r.linesAfterRemove, 1);
  assert.equal(r.editableWhenDone, 0);
  assert.equal(r.numberForm, 'NVD-2026-123');
});
