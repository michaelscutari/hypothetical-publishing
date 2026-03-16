import dayjs, { type Dayjs } from 'dayjs';
import { SaleRequest, type BookResponse } from '@/api';

export interface SaleRecordInput {
  id: string;
  saleDate: Dayjs | null;
  book: BookResponse | null;
  saleSource: SaleRequest.saleSource;
  quantitySold: number | null;
  publisherRevenue: number | null;
  publisherRevenueInput: string;
  authorRoyalty: number | null;
  hasAuthorBeenPaid: boolean;
  comment: string;
  isPlaceholder: boolean;
  errors: {
    saleDate?: string;
    book?: string;
    saleSource?: string;
    quantitySold?: string;
    publisherRevenue?: string;
    authorRoyalty?: string;
    comment?: string;
  };
  dateError?: string | null;
}

export function createEmptyRecord(
  defaults?: Partial<SaleRecordInput>,
  isPlaceholder = false,
): SaleRecordInput {
  return {
    id: Math.random().toString(36).substr(2, 9),
    saleDate: defaults?.saleDate ?? null,
    book: defaults?.book ?? null,
    saleSource: defaults?.saleSource ?? SaleRequest.saleSource.DISTRIBUTOR,
    quantitySold: null,
    publisherRevenue: null,
    publisherRevenueInput: '',
    authorRoyalty: null,
    hasAuthorBeenPaid: defaults?.hasAuthorBeenPaid ?? false,
    comment: defaults?.comment ?? '',
    isPlaceholder,
    errors: {},
    dateError: null,
  };
}

export function validateRecord(record: SaleRecordInput): boolean {
  const errors: SaleRecordInput['errors'] = {};
  let isValid = true;

  if (!record.saleDate) {
    errors.saleDate = 'Date is required';
    isValid = false;
  } else {
    const year = record.saleDate.year();
    const now = dayjs();

    if (year < 1900) {
      errors.saleDate = 'Date must be between January 1900 and today';
      isValid = false;
    } else if (record.saleDate.isAfter(now, 'month')) {
      errors.saleDate = 'Date must be between January 1900 and today';
      isValid = false;
    }
  }

  if (!record.book) {
    errors.book = 'Book is required';
    isValid = false;
  }

  if (!record.saleSource) {
    errors.saleSource = 'Sale source is required';
    isValid = false;
  }

  if (record.quantitySold == null) {
    errors.quantitySold = 'Quantity is required';
    isValid = false;
  } else if (record.quantitySold <= 0) {
    errors.quantitySold = 'Quantity must be a positive number';
    isValid = false;
  }

  if (record.saleSource === SaleRequest.saleSource.DISTRIBUTOR) {
    if (record.publisherRevenue == null) {
      errors.publisherRevenue = 'Revenue is required for distributor sales';
      isValid = false;
    } else if (record.publisherRevenue < 0) {
      errors.publisherRevenue = 'Revenue must be non-negative';
      isValid = false;
    }
  } else if (record.publisherRevenue != null && record.publisherRevenue < 0) {
    errors.publisherRevenue = 'Revenue must be non-negative';
    isValid = false;
  }

  record.errors = errors;
  return isValid;
}
