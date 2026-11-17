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

export function parseAmount(s) {
  if (typeof s === 'number') return Number.isFinite(s) && s > 0 ? Math.floor(s) : 0;
  const str = String(s ?? '').trim();
  if (str.startsWith('-')) return 0;
  const digits = str.replace(/\./g, '');
  if (!/^\d+$/.test(digits)) return 0;
  return parseInt(digits, 10);
}

export function lineAmount(line) {
  return parseAmount(line.qty) * parseAmount(line.price);
}

export function visibleLines(lines) {
  return lines.filter(l => String(l.desc ?? '').trim() !== '' && parseAmount(l.qty) > 0);
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
    PRESETS, formatIDR, formatRp, parseAmount, lineAmount, visibleLines, computeTotal,
    formatDate, addDays, formatInvoiceNumber, nextInvoiceNumber, pdfFileName,
  };
}
