import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, parseQty, isValidAmount, isValidQty, lineAmount, visibleLines, formatQty, laterNumber } from '../src/core.js';

test('F3: price accepts commas, Rp and spaces', () => {
  assert.equal(parseAmount('1,200,000'), 1200000);
  assert.equal(parseAmount('Rp 1.200.000'), 1200000);
  assert.equal(parseAmount('rp1.200.000'), 1200000);
  assert.equal(parseAmount('1 200 000'), 1200000);
  assert.equal(isValidAmount('1,200,000'), true);
  assert.equal(isValidAmount('abc'), false);
  assert.equal(isValidAmount(''), true);
});

test('F2: decimals are not read as thousands', () => {
  assert.equal(parseQty('1.5'), 1.5);
  assert.equal(parseQty('1,5'), 1.5);
  assert.equal(parseQty('2'), 2);
  assert.equal(parseQty('-1'), 0);
  assert.equal(parseQty('x'), 0);
  assert.equal(isValidQty('1,5'), true);
  assert.equal(isValidQty('1x'), false);
  assert.equal(lineAmount({ qty: '1.5', price: '500.000' }), 750000);
  assert.equal(lineAmount({ qty: '1,5', price: 500000 }), 750000);
  assert.equal(visibleLines([{ desc: 'M', qty: '1,5', price: 1 }]).length, 1);
  assert.equal(formatQty(1.5), '1,5');
  assert.equal(formatQty(3), '3');
  assert.equal(parseAmount('2.5'), 3);
});

test('F5: counter only moves forward', () => {
  assert.equal(laterNumber('NVD-2026-040', 'NVD-2026-010', 'NVD'), 'NVD-2026-040');
  assert.equal(laterNumber('NVD-2026-040', 'NVD-2026-041', 'NVD'), 'NVD-2026-041');
  assert.equal(laterNumber('NVD-2027-001', 'NVD-2026-099', 'NVD'), 'NVD-2027-001');
  assert.equal(laterNumber('', 'NVD-2026-005', 'NVD'), 'NVD-2026-005');
  assert.equal(laterNumber('NVD-2026-005', 'CUSTOM', 'NVD'), 'NVD-2026-005');
});
