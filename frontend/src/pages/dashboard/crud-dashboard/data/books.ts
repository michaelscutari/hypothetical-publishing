import {
  ApiError,
  BooksService,
  type BookRequest,
  type BookDetailResponse,
  type BookResponse,
  type PagedResponseBookResponse,
} from '../../../../api';
import { OpenAPI } from '../../../../api/generated/core/OpenAPI';
import { request as __request } from '../../../../api/generated/core/request';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';

export type Book = BookResponse;
export type BookDetail = BookDetailResponse;

export async function getMany({
  paginationModel,
  sortModel,
  query,
  showAll = false,
}: {
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;
  query?: string;
  showAll?: boolean;
}): Promise<{ items: Book[]; itemCount: number }> {
  const sortField = sortModel?.[0]?.field;
  const sortDirection = sortModel?.[0]?.sort ?? 'asc';

  const response: PagedResponseBookResponse = await BooksService.getAllBooks(
    showAll ? 0 : paginationModel.page,
    showAll ? 1000 : paginationModel.pageSize,
    showAll,
    query || undefined,
    sortField,
    sortDirection,
  );

  return {
    items: response.content ?? [],
    itemCount: response.totalElements ?? 0,
  };
}

export async function getOne(bookId: number): Promise<BookDetail> {
  return BooksService.getBookById(bookId);
}

export async function createOne(data: Omit<Book, 'id' | 'totalSalesToDate'>): Promise<Book> {
  const request: BookRequest = {
    title: data.title ?? '',
    author: data.author ?? '',
    isbn13: data.isbn13 ?? '',
    isbn10: data.isbn10 ?? undefined,
    publicationYear: data.publicationYear ?? new Date().getFullYear(),
    publicationMonth: data.publicationMonth ?? 1,
    distributorAuthorRoyaltyRate: data.distributorAuthorRoyaltyRate ?? 0.5,
    handsoldAuthorRoyaltyRate: data.handsoldAuthorRoyaltyRate ?? 0.2,
    seriesName: data.seriesName ?? undefined,
    seriesPosition: data.seriesPosition ?? undefined,
    coverPrice: data.coverPrice ?? 0,
    printCost: data.printCost ?? 0,
    coverImage: data.coverImage ?? undefined,
  };
  return BooksService.createBook(request);
}

export async function updateOne(
  bookId: number,
  data: Partial<Omit<Book, 'id' | 'totalSalesToDate'>>,
): Promise<Book> {
  const request: BookRequest = {
    title: data.title ?? '',
    author: data.author ?? '',
    isbn13: data.isbn13 ?? '',
    isbn10: data.isbn10 ?? undefined,
    publicationYear: data.publicationYear ?? new Date().getFullYear(),
    publicationMonth: data.publicationMonth ?? 1,
    distributorAuthorRoyaltyRate: data.distributorAuthorRoyaltyRate ?? 0.5,
    handsoldAuthorRoyaltyRate: data.handsoldAuthorRoyaltyRate ?? 0.2,
    seriesName: data.seriesName ?? undefined,
    seriesPosition: data.seriesPosition ?? undefined,
    coverPrice: data.coverPrice ?? 0,
    printCost: data.printCost ?? 0,
    coverImage: data.coverImage ?? undefined,
  };
  return BooksService.updateBook(bookId, request);
}

export async function deleteOne(bookId: number): Promise<void> {
  return BooksService.deleteBook(bookId);
}

export async function searchSeries(query?: string): Promise<string[]> {
  return __request(OpenAPI, {
    method: 'GET',
    url: '/api/books/series',
    query: { query },
  });
}

type ValidationResult = { issues: { message: string; path: (keyof Book)[] }[] };

export function validate(book: Partial<Book>): ValidationResult {
  let issues: ValidationResult['issues'] = [];

  if (!book.title) {
    issues = [...issues, { message: 'Title is required', path: ['title'] }];
  }

  if (!book.author) {
    issues = [...issues, { message: 'Author is required', path: ['author'] }];
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
          message: 'Distributor royalty rate must be between 0 and 1',
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
          message: 'Handsold royalty rate must be between 0 and 1',
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
export function parseFieldErrors(err: unknown): Partial<Record<keyof Book, string>> | null {
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
