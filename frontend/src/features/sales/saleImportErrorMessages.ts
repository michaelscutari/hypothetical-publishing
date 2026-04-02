import type { ParsingError } from '@/api';

const ERROR_MESSAGE_MAP: Record<string, string> = {
  'sale.mappingFailed':
    'This row could not be converted to a sale. Check ISBN/ASIN and numeric values.',
  'book.notFound': 'Book does not exist on the website catalog',
  'book.asin.multipleMatches':
    'Multiple books share this ASIN. Update catalog so each ASIN maps to one book.',
  'isbn.isRequired': 'ISBN is required',
  'asin.isRequired': 'ASIN is required',
  'title.isRequired': 'Title is required',
  'author.invalidFormat': 'Author must be in "Last, First" format',
  'format.isRequired': 'Format is required',
  'grossQty.isRequired': 'Gross Qty is required',
  'returnedQty.isRequired': 'Returned Qty is required',
  'netQty.isRequired': 'Net Qty is required',
  'netCompensation.mustBeGreaterThanZero': 'Net Compensation must be greater than 0',
  'netCompensation.isRequired': 'Net Compensation is required',
  'salesMarket.isRequired': 'Sales Market is required',
  'returnedQty.mustBeZero': 'Units Refunded must be 0',
  'grossQty.mustEqual.netQty': 'Units Sold must equal Net Units Sold',
  'import.file.unsupportedType': 'Only CSV and Amazon XLSX files are supported.',
  'import.file.readFailed': 'Unable to read the uploaded file. Please re-export and try again.',
  'import.file.invalidXlsx': 'The XLSX file format is invalid or unsupported.',
  'import.warnings.mustAcknowledge': 'Please review warnings before commit.',
  'import.amazon.supportedSheetMissing':
    'Amazon XLSX is missing required sheets. Expected one of: Paperback Royalty, Hardcover Royalty, eBook Royalty, or KENP.',
  'import.amazon.header.missing': 'Header row is missing from this sheet.',
  'import.amazon.salesPeriod.missing':
    'Sales Period row is missing. Row 1 should include a valid month and year.',
  'import.amazon.salesPeriod.invalid':
    'Sales Period is invalid. Expected format like "January 2025".',
  'import.amazon.value.invalidCurrency':
    'Currency is invalid. Use a supported 3-letter currency code (for example, USD).',
  'import.amazon.kenp.unsupportedAsin':
    'KENP row has ASIN "N/A" and was skipped because it cannot be matched to a book.',
  'import.amazon.audiobook.notSupported':
    'Audiobook Royalty rows are not currently supported and were skipped.',
};

const humanizeHeader = (header: string) => {
  const normalized = header.trim();
  if (!normalized) return 'this field';

  const overrides: Record<string, string> = {
    ISBN: 'ISBN',
    ASIN: 'ASIN',
    'eBook ASIN': 'eBook ASIN',
    KENP: 'KENP',
  };

  return overrides[normalized] ?? normalized;
};

export const getFriendlyErrorMessage = (error: ParsingError) => {
  const rawMessage = error.errorMessage?.trim();
  if (!rawMessage) return 'Unknown error.';

  const mapped = ERROR_MESSAGE_MAP[rawMessage];
  if (mapped) return mapped;

  if (rawMessage.startsWith('import.amazon.header.missingColumn:')) {
    const header = rawMessage.split(':', 2)[1] ?? '';
    return `Missing required column: ${humanizeHeader(header)}.`;
  }

  if (rawMessage.startsWith('import.amazon.value.required:')) {
    const header = rawMessage.split(':', 2)[1] ?? '';
    return `${humanizeHeader(header)} is required.`;
  }

  if (rawMessage.startsWith('import.amazon.value.invalidInteger:')) {
    const header = rawMessage.split(':', 2)[1] ?? '';
    return `${humanizeHeader(header)} must be a whole number.`;
  }

  if (rawMessage.startsWith('import.amazon.value.invalidDecimal:')) {
    const header = rawMessage.split(':', 2)[1] ?? '';
    return `${humanizeHeader(header)} must be a valid number.`;
  }

  if (rawMessage.startsWith('Failed to read file:')) {
    return 'Unable to read the file. Please re-export it and try again.';
  }
  if (/numberformat|for input string/i.test(rawMessage)) {
    return 'One of the numeric fields has an invalid value.';
  }
  return rawMessage;
};
