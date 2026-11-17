# Nived Invoice Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A single self-contained web page where Nived fills a form, sees a live B1-style invoice, and downloads it as an A4 PDF.

**Architecture:** Pure logic (formatting, totals, numbering, dates, filenames) lives in `src/core.js` and is unit-tested with `node:test`. The UI is `src/app.html`, which contains the markup, CSS, and DOM wiring. `build.mjs` inlines `core.js` into `app.html` to produce `dist/index.html`, one file with no external JS. PDF is made by `window.print()` with `@page { size: A4 }` and print CSS that shows only the invoice.

**Tech Stack:** Vanilla HTML/CSS/JS, Node 22 (`node:test`, `node:assert`), Google Fonts (Bricolage Grotesque, JetBrains Mono). No dependencies.

**Spec:** `docs/2026-11-17-nived-invoice-generator-design.md`

## Global Constraints

- Currency IDR only, format `Rp 6.750.000` (dot thousands separator, no decimals). Table cells show the number without "Rp" (`1.200.000`); the total shows `Rp 6.750.000`.
- No tax line, no PPN, no NPWP.
- Fonts: Bricolage Grotesque (text/headings), JetBrains Mono (numbers, dates, labels).
- B1 look: "nived" wordmark with ocean-blue dot `#0B6BC4`, invoice number in `#0B6BC4`, ink `#141414`, muted `#8a8a8a`. Footer: "Curiosity first. Intention always." left, "nived.studio" right.
- Dates on the invoice: `DD.MM.YYYY`.
- Invoice number: `{PREFIX}-{YYYY}-{NNN}`, default prefix `NVD`, NNN zero-padded to 3.
- Default due = issue date + 14 days.
- Presets (label / default detail / default price): Hosting / 1 year / 1200000; Domain / domain name / 250000; Maintenance / monthly / 500000; Design / landing page / 3500000; Review Card / "" / 150000.
- localStorage key `nived-invoice-v1`; every access wrapped in try/catch, so the app works without storage.
- Output must be one file with no external scripts (fonts from Google Fonts are allowed).

## Review Focus

1. Quantity or price typed as empty, negative, decimal, or with dots ("1.200.000") → parse to a non-negative integer of rupiah (dots stripped); empty/invalid = 0. Owned by Task 1 (`parseAmount`).
2. A line with qty 0 or an empty description → left off the invoice and out of the total. Task 1 (`visibleLines`).
3. A month-end issue date (31 Jan) or a year boundary → due date rolls over correctly; the invoice number year comes from the issue date, not today. Task 1.
4. A client name with slashes or symbols (`PT A/B & Co.`) → safe filename. Task 1 (`pdfFileName`).
5. A user-edited invoice number (`NVD-2026-040`) → after download, the next number is `041`. A non-matching custom number → the counter just increments the stored count. Task 1 (`nextInvoiceNumber`).

---

### Task 1: Core logic

**Files:**
- Create: `src/core.js`
- Test: `test/core.test.mjs`

**Interfaces:**
- Produces (all exported via `export`; also attached to `globalThis.NivedCore` for the inlined build):
  - `formatIDR(n: number): string` → `"1.200.000"`
  - `formatRp(n: number): string` → `"Rp 1.200.000"`
  - `parseAmount(s: string|number): number` → non-negative integer
  - `lineAmount(line: {qty, price}): number`
  - `visibleLines(lines: Line[]): Line[]` where `Line = {desc, detail, qty, price}`
  - `computeTotal(lines: Line[]): number` (visible lines only)
  - `formatDate(iso: string): string` → `"17.11.2026"`
  - `addDays(iso: string, days: number): string` → ISO `YYYY-MM-DD`
  - `formatInvoiceNumber(prefix: string, year: number, seq: number): string`
  - `nextInvoiceNumber(current: string, prefix: string, issueIso: string, storedSeq: number): {number: string, seq: number}`
  - `pdfFileName(invoiceNo: string, client: string): string`
  - `PRESETS: Array<{key, desc, detail, price}>` (values from Global Constraints)

- [ ] **Step 1: Write failing tests** in `test/core.test.mjs`, importing from `../src/core.js`:

```js
assert.equal(formatIDR(1200000), '1.200.000');
assert.equal(formatIDR(0), '0');
assert.equal(formatRp(6750000), 'Rp 6.750.000');
assert.equal(parseAmount('1.200.000'), 1200000);
assert.equal(parseAmount(''), 0);
assert.equal(parseAmount('-5'), 0);
assert.equal(parseAmount('2.5'), 25);        // dots are thousands separators, stripped
assert.equal(parseAmount('abc'), 0);
const lines = [
  {desc:'Hosting',detail:'1 year',qty:1,price:1200000},
  {desc:'Domain',detail:'kopisenja.com',qty:1,price:250000},
  {desc:'Maintenance',detail:'monthly',qty:3,price:500000},
  {desc:'Design',detail:'landing page',qty:1,price:3500000},
  {desc:'Review Card',detail:'',qty:2,price:150000},
  {desc:'',detail:'',qty:1,price:999},
  {desc:'Ghost',detail:'',qty:0,price:999},
];
assert.equal(visibleLines(lines).length, 5);
assert.equal(computeTotal(lines), 6750000);
assert.equal(formatDate('2026-11-17'), '17.11.2026');
assert.equal(addDays('2026-11-17', 14), '2026-12-01');
assert.equal(addDays('2026-01-31', 14), '2026-02-14');
assert.equal(addDays('2026-12-25', 14), '2027-01-08');
assert.equal(formatInvoiceNumber('NVD', 2026, 14), 'NVD-2026-014');
assert.deepEqual(nextInvoiceNumber('NVD-2026-040','NVD','2026-11-17',3), {number:'NVD-2026-041', seq:41});
assert.deepEqual(nextInvoiceNumber('CUSTOM','NVD','2026-11-17',3), {number:'NVD-2026-004', seq:4});
assert.deepEqual(nextInvoiceNumber('NVD-2026-009','NVD','2027-01-02',9), {number:'NVD-2027-001', seq:1}); // new year resets
assert.equal(pdfFileName('NVD-2026-014', 'PT A/B & Co.'), 'NVD-2026-014 PT A-B Co');
assert.equal(PRESETS.length, 5);
```

- [ ] **Step 2: Run** `node --test test/` → FAIL (module not found).
- [ ] **Step 3: Implement `src/core.js`.** `formatIDR` inserts dots manually (don't rely on `Intl` locale data). Dates are pure string/UTC math (`Date.UTC`) so the timezone can't shift a day. `pdfFileName`: in the client name, replace `/ \ :` with `-`, remove `* ? " < > | & .`, collapse repeated spaces, and trim; join with a single space. The expected output above is the contract. `nextInvoiceNumber`: if the issue year differs from the year in `current`, reset to 1; else if `current` matches `^PREFIX-YYYY-(\d+)$`, use that number + 1; else `storedSeq + 1`. End the file with `if (typeof globalThis!=='undefined') globalThis.NivedCore = {...}`.
- [ ] **Step 4: Run** `node --test test/` → all pass.
- [ ] **Step 5: Commit** `feat: invoice core logic`.

### Task 2: UI page, build, and print

**Files:**
- Create: `src/app.html`, `build.mjs`
- Test: `test/build.test.mjs`
- Output: `dist/index.html`

**Interfaces:**
- Consumes: everything in `NivedCore` from Task 1.
- `app.html` contains the literal marker `<!--CORE-->` where `build.mjs` inserts `<script>` + the contents of `core.js` (with `export ` keywords stripped). The app script reads `const C = globalThis.NivedCore`.

- [ ] **Step 1: Write the failing build test**: run `build.mjs`, then assert that `dist/index.html` exists, contains `NivedCore`, contains no `<!--CORE-->`, contains no `export `, contains no `<script src=`, contains `@page`, `size: A4`, `Bricolage+Grotesque`, `JetBrains+Mono`, and `Curiosity first. Intention always.`.
- [ ] **Step 2: Run** `node --test test/` → build test FAILS.
- [ ] **Step 3: Build `src/app.html`.**
  - Layout: two columns (form ~380px | preview); stacks on narrow screens.
  - Form: client name, client address (textarea), issue date (default today), due date (auto = issue + 14 until the user edits it), invoice number (prefilled from storage), line editor (desc, detail, qty, price, remove), five preset buttons that append `PRESETS` values (taking prices from settings), "Add blank line", notes (optional; shown above the footer only when non-empty), and a primary "Download PDF" button.
  - Settings (collapsible `<details>`): preset detail/price per item, bank name, account number, account holder, prefix. Defaults: BCA / empty / "Nived Studio" / NVD. Saved on change.
  - Preview: the B1 markup from the approved mockup (wordmark + blue dot, "Invoice" + blue number, mono meta row Billed to / Issued / Due, table Item / Qty / Price / Amount using `formatIDR`, total with `formatRp`, bank details bottom-left, footer). Re-render on every `input` event. Set all text via `textContent` (never innerHTML with user input).
  - Print CSS: `@page { size: A4; margin: 0 }`; under `@media print`, hide everything except `#invoice`, and render `#invoice` at full A4 width with no border or radius.
  - Download: set `document.title = pdfFileName(...)` (so Save as PDF uses it), call `window.print()`, then on `afterprint` advance the number via `nextInvoiceNumber`, save the seq, and restore the title.
  - Storage: `{settings, seq}` under `nived-invoice-v1`, read and written in try/catch.
- [ ] **Step 4: Write `build.mjs`** (read, strip `export `, replace marker, write `dist/index.html`). Run `node build.mjs && node --test test/` → all pass.
- [ ] **Step 5: Visual check:** open `dist/index.html` in a headless browser if available (otherwise review it by hand). Confirm the preview matches B1, adding the Hosting preset updates the total, and the print preview shows only the invoice on one A4 page.
- [ ] **Step 6: Commit** `feat: invoice UI, build, and print`.

### Task 3: Deliver

- [ ] Publish `dist/index.html` as a private artifact titled "Nived invoice generator".
- [ ] Send `dist/index.html` to the user as a keepable file.
