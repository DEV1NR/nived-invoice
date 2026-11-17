# Nived invoice generator: design

**Date:** 17 Nov 2026
**Size:** small tool (one self-contained web page)

## Why
The Nived team (three people, based in Indonesia) currently makes every invoice by hand. They want a quick, simple tool built on a fixed template so an invoice takes about a minute and always looks on-brand.

## Goals
- Fill a form and see a live B1-style invoice next to it.
- Five preset items: Hosting, Domain, Maintenance, Design and Review Card. Clicking one adds a line with its usual description and price, and both can still be edited per client.
- Download the invoice as an A4 PDF to send to the client.
- Shareable via a private link, with nothing to install.

## Non-goals
- Client database, invoice history, or payment status tracking.
- A shared invoice counter across the team (that's option 2, which can be added later).
- Sending invoices from the tool.

## Anti-goals
- Anything that makes an invoice slower to produce than doing it by hand.
- Wrong totals or broken Rupiah formatting on a document the client sees.

## Constraints
- Currency is IDR only, formatted as `Rp 6.750.000` (dot as the thousands separator, no decimals).
- No tax: Nived isn't PKP-registered, so there's no PPN line and no NPWP.
- Fonts are Bricolage Grotesque (text and headings) and JetBrains Mono (numbers, dates and labels), loaded from Google Fonts.
- Look: option B1. Minimal black and white, large "nived." wordmark with an ocean-blue dot, blue invoice number, a mono meta row (Billed to / Issued / Due), an item table (Item / Qty / Price / Amount), a large bold total, bank details bottom-left, and a footer reading "Curiosity first. Intention always." and "nived.studio".

## Approaches considered
1. **Single page with form and live preview, using browser memory** (chosen). Fastest to build and use. Trade-off: each person keeps their own invoice counter, so numbers could clash if two people invoice on the same day.
2. Same page plus shared team storage for the counter and clients. Removes clashes, but it's more to build and stores invoice data online. Deferred.
3. Spreadsheet template. Ruled out because it loses the fonts and layout and isn't faster.

## How it works (decided)
- **Form:** client name and address; issue date (defaults to today) and due date (defaults to today + 14 days, editable); invoice number; line items with description, detail (the grey subtext such as "1 year"), quantity and unit price; add and remove lines; optional notes.
- **Preset buttons:** one per item type. Each adds a line using that item's default detail and price.
- **Settings panel:** the five presets' default details and prices, bank name, account number, account holder, and invoice prefix (`NVD`). Saved in the browser.
- **Invoice number:** `NVD-YYYY-NNN`. It counts up automatically after each PDF download, stays editable, and is remembered per browser.
- **PDF:** generated using the browser's print-to-PDF at A4 size, with only the invoice on the page. The file name is the invoice number plus the client name.
- **Delivery:** published as a private artifact page, plus the same file as a standalone .html they can keep.

## Left to the builder (my calls)
- Default preset prices start out as the mockup placeholders until Nived edits them in Settings. Real prices weren't provided.
- Default due period is 14 days.
- Lines with a quantity of 0 or an empty description are left off the invoice.
- If browser storage is unavailable, the tool still works and just doesn't remember settings.
