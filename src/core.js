export const PRESETS = [
  { key: 'hosting', desc: 'Hosting', detail: '1 year', price: 1200000 },
  { key: 'domain', desc: 'Domain', detail: 'domain name', price: 250000 },
  { key: 'maintenance', desc: 'Maintenance', detail: 'monthly', price: 500000 },
  { key: 'design', desc: 'Design', detail: 'landing page', price: 3500000 },
  { key: 'reviewcard', desc: 'Review Card', detail: '', price: 150000 },
  { key: 'grow', desc: 'Grow Package Plan', detail: '', price: 0 },
  { key: 'bloom', desc: 'Bloom Package Plan', detail: '', price: 0 },
];

export function formatIDR(n) {
  const s = String(Math.max(0, Math.round(Number(n) || 0)));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatRp(n) {
  return 'Rp ' + formatIDR(n);
}

function normalizeAmount(s) {
  return String(s ?? '').trim().replace(/^rp\.?/i, '').replace(/\s+/g, '');
}

const GROUPED = /^\d{1,3}(?:([.,])\d{3})(?:\1\d{3})*$/;
const DECIMAL = /^\d+[.,]\d+$/;

export function isValidAmount(s) {
  const str = normalizeAmount(s);
  return str === '' || /^\d+$/.test(str) || GROUPED.test(str) || DECIMAL.test(str);
}

export function parseAmount(s) {
  if (typeof s === 'number') return Number.isFinite(s) && s > 0 ? Math.round(s) : 0;
  const str = normalizeAmount(s);
  if (/^\d+$/.test(str) || GROUPED.test(str)) return parseInt(str.replace(/[.,]/g, ''), 10);
  if (DECIMAL.test(str)) return Math.round(parseFloat(str.replace(',', '.')));
  return 0;
}

export function isValidQty(s) {
  const str = String(s ?? '').trim();
  return str === '' || /^\d+(?:[.,]\d+)?$/.test(str);
}

export function parseQty(s) {
  if (typeof s === 'number') return Number.isFinite(s) && s > 0 ? s : 0;
  const str = String(s ?? '').trim();
  return /^\d+(?:[.,]\d+)?$/.test(str) ? parseFloat(str.replace(',', '.')) : 0;
}

export function formatQty(q) {
  const n = Math.round(Number(q) * 100) / 100;
  return String(n).replace('.', ',');
}

export function lineAmount(line) {
  return Math.round(parseQty(line.qty) * parseAmount(line.price));
}

export function visibleLines(lines) {
  return lines.filter(l => String(l.desc ?? '').trim() !== '' && parseQty(l.qty) > 0);
}

export function computeTotal(lines) {
  return visibleLines(lines).reduce((sum, l) => sum + lineAmount(l), 0);
}

export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

export function parseDateDMY(str) {
  const m = /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec(String(str || '').trim());
  if (!m) return '';
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return '';
  return dt.toISOString().slice(0, 10);
}

export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function formatInvoiceNumber(prefix, year, seq) {
  return `${prefix}-${year}-${String(seq).padStart(3, '0')}`;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function nextInvoiceNumber(current, prefix, issueIso, storedSeq) {
  const year = Number(String(issueIso).slice(0, 4));
  const m = new RegExp(`^${escapeRe(prefix)}-(\\d{4})-(\\d+)$`).exec(current || '');
  let seq;
  if (m && Number(m[1]) !== year) seq = 1;
  else if (m) seq = parseInt(m[2], 10) + 1;
  else seq = (Number(storedSeq) || 0) + 1;
  return { number: formatInvoiceNumber(prefix, year, seq), seq };
}

export function laterNumber(a, b, prefix) {
  const re = new RegExp(`^${escapeRe(prefix)}-(\\d{4})-(\\d+)$`);
  const pa = re.exec(a || ''), pb = re.exec(b || '');
  if (!pb) return a || '';
  if (!pa) return b;
  const ka = Number(pa[1]) * 1e6 + Number(pa[2]);
  const kb = Number(pb[1]) * 1e6 + Number(pb[2]);
  return kb > ka ? b : a;
}

export function pdfFileName(invoiceNo, client) {
  const c = String(client || '')
    .replace(/[\/\\:]/g, '-')
    .replace(/[*?"<>|&.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return c ? `${invoiceNo} ${c}` : invoiceNo;
}

export function invoiceFileName(client, invoiceNo) {
  const clean = v => String(v || '')
    .replace(/[\/\\:]/g, ' ')
    .replace(/[*?"<>|&.,'()]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const base = clean(client) || clean(invoiceNo);
  return base ? `${base}-Invoice.pdf` : 'Invoice.pdf';
}

export function pageCuts(total, firstCap, nextCap, candidates) {
  const sorted = [...candidates].filter(c => c > 0 && c <= total).sort((a, b) => a - b);
  const cuts = [];
  let start = 0, cap = firstCap;
  while (total - start > cap) {
    const limit = start + cap;
    let cut = 0;
    for (const c of sorted) if (c > start && c <= limit) cut = c;
    if (!cut) cut = limit;
    cuts.push(cut);
    start = cut;
    cap = nextCap;
  }
  cuts.push(total);
  return cuts;
}

export function buildPdf(pages, pageW = 595.28, pageH = 841.89) {
  const enc = new TextEncoder();
  const chunks = [];
  let length = 0;
  const offsets = [];
  const push = part => { const b = typeof part === 'string' ? enc.encode(part) : part; chunks.push(b); length += b.length; };
  const obj = (n, body) => { offsets[n] = length; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
  const fmt = n => (Math.round(n * 100) / 100).toString();

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`));
  pages.forEach((pg, i) => {
    const pageN = 3 + i * 3, imgN = pageN + 1, contN = pageN + 2;
    obj(pageN, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(pageW)} ${fmt(pageH)}] /Resources << /XObject << /Im0 ${imgN} 0 R >> >> /Contents ${contN} 0 R >>`));
    obj(imgN, () => {
      push(`<< /Type /XObject /Subtype /Image /Width ${pg.width} /Height ${pg.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.bytes.length} >>\nstream\n`);
      push(pg.bytes);
      push('\nendstream');
    });
    const content = `q ${fmt(pageW)} 0 0 ${fmt(pageH)} 0 0 cm /Im0 Do Q`;
    obj(contN, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
  });
  const count = 3 + pages.length * 3;
  const xref = length;
  let table = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let n = 1; n < count; n++) table += String(offsets[n]).padStart(10, '0') + ' 00000 n \n';
  push(table + `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(length);
  let pos = 0;
  for (const c of chunks) { out.set(c, pos); pos += c.length; }
  return out;
}

if (typeof globalThis !== 'undefined') {
  globalThis.NivedCore = {
    PRESETS, formatIDR, formatRp, parseAmount, parseQty, isValidAmount, isValidQty, formatQty, laterNumber, lineAmount, visibleLines, computeTotal,
    formatDate, parseDateDMY, addDays, invoiceFileName, pageCuts, buildPdf, formatInvoiceNumber, nextInvoiceNumber, pdfFileName,
  };
}
