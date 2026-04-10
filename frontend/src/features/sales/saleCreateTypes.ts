import dayjs, { type Dayjs } from 'dayjs';
import { SaleRequest, type BookResponse } from '@/api';

export interface SaleRecordInput {
  id: string;
  saleDate: Dayjs | null;
  book: BookResponse | null;
  saleSource: SaleRequest.saleSource;
  distributor: SaleRequest.distributor | null;
  format: SaleRequest.format;
  saleCurrency: SaleRequest.saleCurrency;
  quantitySold: number | null;
  kenp: number | null;
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
    distributor?: string;
    format?: string;
    quantitySold?: string;
    kenp?: string;
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
    distributor: defaults?.distributor ?? SaleRequest.distributor.OTHER,
    format: defaults?.format ?? SaleRequest.format.PRINT,
    saleCurrency: defaults?.saleCurrency ?? SaleRequest.saleCurrency.USD,
    quantitySold: null,
    kenp: null,
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

  const isKU = record.format === SaleRequest.format.KINDLE_UNLIMITED;
  const isDistributor = record.saleSource === SaleRequest.saleSource.DISTRIBUTOR;

  if (isDistributor && !record.distributor) {
    errors.distributor = 'Distributor is required';
    isValid = false;
  }

  if (isKU) {
    if (record.kenp == null || record.kenp <= 0) {
      errors.kenp = 'KENP is required for Kindle Unlimited';
      isValid = false;
    }
  } else {
    if (record.quantitySold == null) {
      errors.quantitySold = 'Quantity is required';
      isValid = false;
    } else if (record.quantitySold <= 0) {
      errors.quantitySold = 'Quantity must be a positive number';
      isValid = false;
    }
  }

  if (isDistributor) {
    if (record.publisherRevenue == null) {
      errors.publisherRevenue = 'Revenue is required for distributor sales';
      isValid = false;
    } else if (record.publisherRevenue < 0) {
      errors.publisherRevenue = 'Revenue must be non-negative';
      isValid = false;
    }
  }

  record.errors = errors;
  return isValid;
}
