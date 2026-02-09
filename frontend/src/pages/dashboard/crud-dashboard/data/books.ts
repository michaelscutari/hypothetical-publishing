import {
  BooksService,
  type BookRequest,
  type BookDetailResponse,
  type BookResponse,
  type PagedResponseBookResponse,
} from '../../../../api';
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
    royaltyRate: data.royaltyRate ?? 0.5,
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
    royaltyRate: data.royaltyRate ?? 0.5,
  };
  return BooksService.updateBook(bookId, request);
}

export async function deleteOne(bookId: number): Promise<void> {
  return BooksService.deleteBook(bookId);
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

  if (book.royaltyRate != null) {
    const rate = Number(book.royaltyRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 1) {
      issues = [
        ...issues,
        { message: 'Royalty rate must be between 0 and 1', path: ['royaltyRate'] },
      ];
    }
  }

  return { issues };
}
