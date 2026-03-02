/** Digits, optional decimal point, max 2 decimal places. */
const MONETARY_REGEX = /^\d*\.?\d{0,2}$/;

/** Returns true if the value is a valid in-progress monetary input (empty, partial, or complete). */
export function isValidMonetaryInput(value: string): boolean {
  return value === '' || MONETARY_REGEX.test(value);
}
