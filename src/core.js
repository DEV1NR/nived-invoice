export const PRESETS = [
  { key: 'hosting', desc: 'Hosting', detail: '1 year', price: 1200000 },
  { key: 'domain', desc: 'Domain', detail: 'domain name', price: 250000 },
  { key: 'maintenance', desc: 'Maintenance', detail: 'monthly', price: 500000 },
  { key: 'design', desc: 'Design', detail: 'landing page', price: 3500000 },
  { key: 'reviewcard', desc: 'Review Card', detail: '', price: 150000 },
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

if (typeof globalThis !== 'undefined') {
  globalThis.NivedCore = {
    PRESETS, formatIDR, formatRp, parseAmount, parseQty, isValidAmount, isValidQty, formatQty, laterNumber, lineAmount, visibleLines, computeTotal,
    formatDate, addDays, formatInvoiceNumber, nextInvoiceNumber, pdfFileName,
  };
}
