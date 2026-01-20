import type { GridFilterModel, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn13: string;
  isbn10?: string | null;
  publicationDate: string;
  royaltyRate: number;
}

const API_BASE = '/api/books';

async function parseError(res: Response) {
  const text = await res.text();
  return text || res.statusText || 'Request failed';
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json() as Promise<T>;
}

export async function getMany({
  paginationModel,
  filterModel,
  sortModel,
}: {
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;
  filterModel: GridFilterModel;
}): Promise<{ items: Book[]; itemCount: number }> {
  const books = await fetchJson<Book[]>(API_BASE);

  let filteredBooks = [...books];

  if (filterModel?.items?.length) {
    filterModel.items.forEach(({ field, value, operator }) => {
      if (!field || value == null) {
        return;
      }

      filteredBooks = filteredBooks.filter((book) => {
        const bookValue = book[field as keyof Book];

        switch (operator) {
          case 'contains':
            return String(bookValue).toLowerCase().includes(String(value).toLowerCase());
          case 'equals':
            return String(bookValue) === String(value);
          case 'startsWith':
            return String(bookValue).toLowerCase().startsWith(String(value).toLowerCase());
          case 'endsWith':
            return String(bookValue).toLowerCase().endsWith(String(value).toLowerCase());
          case '>':
            return Number(bookValue) > Number(value);
          case '<':
            return Number(bookValue) < Number(value);
          default:
            return true;
        }
      });
    });
  }

  if (sortModel?.length) {
    filteredBooks.sort((a, b) => {
      for (const { field, sort } of sortModel) {
        const aValue = a[field as keyof Book];
        const bValue = b[field as keyof Book];
        if (aValue < bValue) {
          return sort === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sort === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });
  }

  const start = paginationModel.page * paginationModel.pageSize;
  const end = start + paginationModel.pageSize;
  const paginatedBooks = filteredBooks.slice(start, end);

  return {
    items: paginatedBooks,
    itemCount: filteredBooks.length,
  };
}

export async function getOne(bookId: number) {
  return fetchJson<Book>(`${API_BASE}/${bookId}`);
}

export async function createOne(data: Omit<Book, 'id'>) {
  return fetchJson<Book>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOne(bookId: number, data: Partial<Omit<Book, 'id'>>) {
  return fetchJson<Book>(`${API_BASE}/${bookId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteOne(bookId: number) {
  const res = await fetch(`${API_BASE}/${bookId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
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

  if (book.isbn10 && !/^\d{10}$/.test(book.isbn10.replace(/-/g, ''))) {
    issues = [...issues, { message: 'ISBN-10 must be 10 digits', path: ['isbn10'] }];
  }

  if (!book.publicationDate) {
    issues = [...issues, { message: 'Publication date is required', path: ['publicationDate'] }];
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
