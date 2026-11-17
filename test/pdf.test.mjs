import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { invoiceFileName, pageCuts, buildPdf } from '../src/core.js';

const JPEG = Uint8Array.from(Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDxOiiigD//2Q==', 'base64'));

test('download file name is Name-Invoice.pdf', () => {
  assert.equal(invoiceFileName('Warkop Pasundan', 'NVD-2026-001'), 'Warkop-Pasundan-Invoice.pdf');
  assert.equal(invoiceFileName('PT A/B & Co.', 'NVD-2026-001'), 'PT-A-B-Co-Invoice.pdf');
  assert.equal(invoiceFileName('  ', 'NVD-2026-001'), 'NVD-2026-001-Invoice.pdf');
  assert.equal(invoiceFileName('', ''), 'Invoice.pdf');
});

test('page cuts land on safe rows', () => {
  assert.deepEqual(pageCuts(900, 1080, 1030, [100, 500, 900]), [900]);
  const rows = Array.from({ length: 20 }, (_, i) => (i + 1) * 100);
  assert.deepEqual(pageCuts(2000, 1080, 1030, rows), [1000, 2000]);
  assert.deepEqual(pageCuts(3000, 1080, 1030, [2500]), [1080, 2110, 3000]);
});

test('buildPdf writes a valid A4 pdf with one page per image', () => {
  const bytes = buildPdf([{ bytes: JPEG, width: 8, height: 8 }, { bytes: JPEG, width: 8, height: 8 }]);
  assert.ok(bytes instanceof Uint8Array);
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), '%PDF-');
  if (!existsSync('/usr/bin/pdfinfo')) return;
  const dir = mkdtempSync(join(tmpdir(), 'pdf-'));
  const f = join(dir, 't.pdf');
  writeFileSync(f, bytes);
  const info = execFileSync('pdfinfo', [f], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  assert.match(info, /Pages:\s+2/);
  assert.match(info, /Page size:\s+595\.\d+ x 841\.\d+ pts \(A4\)/);
  const err = execFileSync('sh', ['-c', 'pdftoppm -r 10 -png "' + f + '" "' + dir + '/p" 2>&1; echo done'], { encoding: 'utf8' });
  assert.equal(err.trim(), 'done');
});
