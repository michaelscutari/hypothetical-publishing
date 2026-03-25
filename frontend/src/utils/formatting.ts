import { MONTH_NAMES } from '@/constants/months';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** Format a number as USD currency with thousands separators. Callers handle null display. */
export function formatCurrency(n: number): string {
  return currencyFormatter.format(n);
}

/** Format month (1-12) and year as "January 2026". Callers handle null display. */
export function formatMonthYear(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Format a decimal rate (0.0-1.0) as a percentage string like "50%". */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

/** Truncate a string to maxLength characters with ellipsis. */
export function truncate(value: string, maxLength = 30): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

/** Format a number as currency with the given ISO currency code. */
export function formatCurrencyWithCode(n: number, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(n);
}
