import { ApiError, type BookResponse } from '@/api';

type ValidationResult = { issues: { message: string; path: (keyof BookResponse)[] }[] };

export function validateBook(book: Partial<BookResponse>): ValidationResult {
  let issues: ValidationResult['issues'] = [];

  if (!book.title) {
    issues = [...issues, { message: 'Title is required', path: ['title'] }];
  }

  if (!book.authorId) {
    issues = [...issues, { message: 'Author is required', path: ['authorId'] }];
  }

  if (!book.isbn13) {
    issues = [...issues, { message: 'ISBN-13 is required', path: ['isbn13'] }];
  } else if (!/^\d{13}$/.test(book.isbn13.replace(/-/g, ''))) {
    issues = [...issues, { message: 'ISBN-13 must be 13 digits', path: ['isbn13'] }];
  }

  if (book.isbn10 && !/^\d{9}[\dXx]$/.test(book.isbn10.replace(/-/g, ''))) {
    issues = [
      ...issues,
      { message: 'ISBN-10 must be 9 digits followed by a digit or X', path: ['isbn10'] },
    ];
  }

  if (!book.publicationYear) {
    issues = [...issues, { message: 'Publication year is required', path: ['publicationYear'] }];
  } else if (book.publicationYear < 1900 || book.publicationYear > 2100) {
    issues = [
      ...issues,
      { message: 'Publication year must be between 1900 and 2100', path: ['publicationYear'] },
    ];
  }

  if (!book.publicationMonth) {
    issues = [...issues, { message: 'Publication month is required', path: ['publicationMonth'] }];
  } else if (book.publicationMonth < 1 || book.publicationMonth > 12) {
    issues = [
      ...issues,
      { message: 'Publication month must be between 1 and 12', path: ['publicationMonth'] },
    ];
  }

  if (book.distributorAuthorRoyaltyRate != null) {
    const rate = Number(book.distributorAuthorRoyaltyRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 1) {
      issues = [
        ...issues,
        {
          message: 'Distributor royalty rate must be between 0% and 100%',
          path: ['distributorAuthorRoyaltyRate'],
        },
      ];
    }
  }

  if (book.handsoldAuthorRoyaltyRate != null) {
    const rate = Number(book.handsoldAuthorRoyaltyRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 1) {
      issues = [
        ...issues,
        {
          message: 'Handsold royalty rate must be between 0% and 100%',
          path: ['handsoldAuthorRoyaltyRate'],
        },
      ];
    }
  }

  if (book.coverPrice == null) {
    issues = [...issues, { message: 'Cover price is required', path: ['coverPrice'] }];
  } else if (Number.isNaN(Number(book.coverPrice)) || Number(book.coverPrice) < 0) {
    issues = [...issues, { message: 'Cover price must be non-negative', path: ['coverPrice'] }];
  }

  if (book.printCost == null) {
    issues = [...issues, { message: 'Print cost is required', path: ['printCost'] }];
  } else if (Number.isNaN(Number(book.printCost)) || Number(book.printCost) < 0) {
    issues = [...issues, { message: 'Print cost must be non-negative', path: ['printCost'] }];
  }

  if (book.seriesName && !book.seriesPosition) {
    issues = [
      ...issues,
      { message: 'Series position is required when series name is set', path: ['seriesPosition'] },
    ];
  } else if (!book.seriesName && book.seriesPosition) {
    issues = [
      ...issues,
      { message: 'Series name is required when position is set', path: ['seriesName'] },
    ];
  } else if (book.seriesPosition != null && book.seriesPosition < 1) {
    issues = [
      ...issues,
      { message: 'Series position must be at least 1', path: ['seriesPosition'] },
    ];
  }

  return { issues };
}

/**
 * Parse field-level errors from a backend 400/409 response.
 * Returns a partial record suitable for setFormErrors, or null if the error
 * isn't a field-level validation error.
 */
export function parseFieldErrors(err: unknown): Partial<Record<keyof BookResponse, string>> | null {
  if (!(err instanceof ApiError)) return null;
  if (err.status !== 400 && err.status !== 409) return null;
  const body = err.body;
  if (!body || typeof body !== 'object') return null;

  const result: Partial<Record<string, string>> = {};
  let found = false;
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      result[key] = value;
      found = true;
    }
  }
  return found ? result : null;
}
