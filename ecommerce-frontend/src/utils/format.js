// DRF's JSON encoder serializes DecimalField values as strings (e.g. "49.99")
// rather than floats, to avoid float precision issues. Every price/total
// coming from the API needs to pass through this before arithmetic or display.
export function formatMoney(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num) || num === null || num === undefined) return '—';
  return `Rs. ${num.toFixed(2)}`;
}

export function toNumber(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isNaN(num) ? 0 : num;
}
