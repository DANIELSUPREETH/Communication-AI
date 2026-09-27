const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

const toDate = (value) => (value instanceof Date ? value : new Date(value));

/** "September 27, 2026" */
export function formatDate(value) {
  const d = toDate(value);
  return Number.isNaN(d.getTime()) ? '' : dateFmt.format(d);
}

/** "Sep 27" */
export function formatShortDate(value) {
  const d = toDate(value);
  return Number.isNaN(d.getTime()) ? '' : shortFmt.format(d);
}

/** "September 27, 2026 · 4:05 PM" */
export function formatDateTime(value) {
  const d = toDate(value);
  return Number.isNaN(d.getTime()) ? '' : `${dateFmt.format(d)} · ${timeFmt.format(d)}`;
}
