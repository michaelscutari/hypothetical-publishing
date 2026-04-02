import { describe, expect, it } from 'vitest';
import { getFriendlyErrorMessage } from '@/features/sales/saleImportErrorMessages';

describe('saleImportErrorMessages', () => {
  it('maps known amazon parser keys to friendly copy', () => {
    const message = getFriendlyErrorMessage({ errorMessage: 'import.amazon.salesPeriod.invalid' });
    expect(message).toBe('Sales Period is invalid. Expected format like "January 2025".');
  });

  it('maps missing column parser keys with column name', () => {
    const message = getFriendlyErrorMessage({
      errorMessage: 'import.amazon.header.missingColumn:Units Sold',
    });
    expect(message).toBe('Missing required column: Units Sold.');
  });

  it('maps invalid integer parser keys with column name', () => {
    const message = getFriendlyErrorMessage({
      errorMessage: 'import.amazon.value.invalidInteger:Kindle Edition Normalized Pages (KENP)',
    });
    expect(message).toBe('Kindle Edition Normalized Pages (KENP) must be a whole number.');
  });

  it('falls back to generic numeric parse message for raw parser exceptions', () => {
    const message = getFriendlyErrorMessage({ errorMessage: 'NumberFormatException: For input string' });
    expect(message).toBe('One of the numeric fields has an invalid value.');
  });
});

