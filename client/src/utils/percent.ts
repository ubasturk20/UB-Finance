// Percentages typed by people, stored as basis points (an integer: 2000 = %20, 425 = %4,25).
// Exact: digits are read as text, never through parseFloat.

/** Basis points from what was typed ("%20", "20", "4,25", "4.25 %"); null when it isn't one */
export function parsePercent(text: string): number | null {
  const s = text.replace(/\s/g, '').replace(/^%/, '').replace(/%$/, '');
  const m = /^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const bp = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return bp <= 10_000 ? bp : null;
}

/** Basis points as a field shows them for editing: 2000 → "20", 425 → "4,25", 450 → "4,5" */
export function percentToInput(bp: number | null): string {
  if (bp === null) return '';
  const whole = Math.floor(bp / 100);
  const rest = String(bp % 100)
    .padStart(2, '0')
    .replace(/0+$/, '');
  return rest ? `${whole},${rest}` : String(whole);
}

/** A day of the month typed in a field (1-31); null when empty or not one */
export function parseDayOfMonth(text: string): number | null {
  if (!/^\d{1,2}$/.test(text.trim())) return null;
  const n = Number(text.trim());
  return n >= 1 && n <= 31 ? n : null;
}
