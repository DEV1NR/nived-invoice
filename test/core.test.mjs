import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatIDR, formatRp, parseAmount, lineAmount, visibleLines, computeTotal,
  formatDate, addDays, formatInvoiceNumber, nextInvoiceNumber, pdfFileName, PRESETS,
} from '../src/core.js';

test('formats rupiah', () => {
  assert.equal(formatIDR(1200000), '1.200.000');
  assert.equal(formatIDR(0), '0');
  assert.equal(formatIDR(999), '999');
  assert.equal(formatRp(6750000), 'Rp 6.750.000');
});

test('parses amounts', () => {
  assert.equal(parseAmount('1.200.000'), 1200000);
  assert.equal(parseAmount(''), 0);
  assert.equal(parseAmount('-5'), 0);
  assert.equal(parseAmount('2.5'), 3);
  assert.equal(parseAmount('abc'), 0);
  assert.equal(parseAmount(3), 3);
  assert.equal(parseAmount(undefined), 0);
});

test('lines and totals', () => {
  const lines = [
    { desc: 'Hosting', detail: '1 year', qty: 1, price: 1200000 },
    { desc: 'Domain', detail: 'kopisenja.com', qty: 1, price: 250000 },
    { desc: 'Maintenance', detail: 'monthly', qty: 3, price: 500000 },
    { desc: 'Design', detail: 'landing page', qty: 1, price: 3500000 },
    { desc: 'Review Card', detail: '', qty: 2, price: 150000 },
    { desc: '', detail: '', qty: 1, price: 999 },
    { desc: 'Ghost', detail: '', qty: 0, price: 999 },
    { desc: '   ', detail: '', qty: 1, price: 999 },
  ];
  assert.equal(lineAmount({ qty: 3, price: 500000 }), 1500000);
  assert.equal(visibleLines(lines).length, 5);
  assert.equal(computeTotal(lines), 6750000);
});

test('dates', () => {
  assert.equal(formatDate('2026-11-17'), '17.11.2026');
  assert.equal(formatDate(''), '');
  assert.equal(addDays('2026-11-17', 14), '2026-12-01');
  assert.equal(addDays('2026-01-31', 14), '2026-02-14');
  assert.equal(addDays('2026-12-25', 14), '2027-01-08');
});

test('invoice numbers', () => {
  assert.equal(formatInvoiceNumber('NVD', 2026, 14), 'NVD-2026-014');
  assert.deepEqual(nextInvoiceNumber('NVD-2026-040', 'NVD', '2026-11-17', 3), { number: 'NVD-2026-041', seq: 41 });
  assert.deepEqual(nextInvoiceNumber('CUSTOM', 'NVD', '2026-11-17', 3), { number: 'NVD-2026-004', seq: 4 });
  assert.deepEqual(nextInvoiceNumber('NVD-2026-009', 'NVD', '2027-01-02', 9), { number: 'NVD-2027-001', seq: 1 });
});

test('pdf file name', () => {
  assert.equal(pdfFileName('NVD-2026-014', 'PT A/B & Co.'), 'NVD-2026-014 PT A-B Co');
  assert.equal(pdfFileName('NVD-2026-014', ''), 'NVD-2026-014');
});

test('presets', () => {
  assert.equal(PRESETS.length, 7);
  assert.deepEqual(PRESETS.map(p => p.desc), ['Hosting', 'Domain', 'Maintenance', 'Design', 'Review Card', 'Grow Package Plan', 'Bloom Package Plan']);
  assert.equal(new Set(PRESETS.map(p => p.key)).size, 7);
  assert.equal(PRESETS.find(p => p.desc === 'Design').price, 3500000);
});
