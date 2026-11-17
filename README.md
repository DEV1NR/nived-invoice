# Nived invoice generator

A single-page tool for making Nived invoices: fill in the form (or type straight onto the paper), then download a clean A4 PDF named `Client-Name-Invoice.pdf`.

## Using it

1. Download **`invoice.html`** from this repo. Click the file, then the download button (↓) at the top right.
2. Open it in Chrome, Edge or Safari.
3. The first time, open **Settings** at the bottom left and fill in your bank account and your item prices. They're saved in that browser.
4. Add items with the preset buttons, or use **Custom**. Check the preview, then click **Download PDF**.

| Button | What it does |
|---|---|
| Edit on paper | Click any dashed text on the invoice and type there |
| New invoice | Clears the client, items and notes, sets today's date and moves to the next invoice number |
| Reset settings to defaults | Restores the default prices, bank details and prefix |
| Undo | Appears for 10 seconds after New invoice or a reset |
| Print a paper copy | Opens the print window; untick "Headers and footers" |

Settings and the invoice counter live in each person's own browser. Always open the tool in the same browser.

## Getting updates

When a new version is pushed here, download `invoice.html` again and replace your old copy. Your saved settings stay as long as you open it in the same browser.

## For developers

- `src/core.js` holds the calculations (rupiah formatting, totals, dates, numbering, file names and the PDF writer).
- `src/app.html` holds the page.
- `node build.mjs` builds `dist/index.html` and copies it to `invoice.html`.
- `node --test` runs the tests. The browser tests need Chrome and Playwright, and skip themselves otherwise.
