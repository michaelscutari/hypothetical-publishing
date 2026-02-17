import {
  Autocomplete,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  type AutocompleteRenderInputParams,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { type Dayjs } from 'dayjs';
import * as React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BooksService, SalesService, SaleRequest, type BookResponse } from '../../../../api';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';

// Custom adapter to force MMM YYYY format
class CustomAdapterDayjs extends AdapterDayjs {
  getMonthArray = (date: Dayjs) => {
    const year = this.getYear(date);
    return Array.from({ length: 12 }, (_, i) => dayjs().year(year).month(i));
  };
}

function computePublisherRevenue(
  book: BookResponse | null,
  quantity: number | null,
  saleSource: SaleRequest.saleSource,
  publisherRevenue: number | null,
): number | null {
  if (saleSource === SaleRequest.saleSource.DISTRIBUTOR) {
    return publisherRevenue;
  }
  if (!book || quantity == null) return null;
  const coverPrice = Number(book.coverPrice ?? 0);
  const printCost = Number(book.printCost ?? 0);
  return Number(((coverPrice - printCost) * quantity).toFixed(2));
}

function computeRoyalty(
  book: BookResponse | null,
  saleSource: SaleRequest.saleSource,
  revenue: number | null,
): number | null {
  if (!book || revenue == null) return null;
  const rate =
    saleSource === SaleRequest.saleSource.HAND_SOLD
      ? book.handsoldAuthorRoyaltyRate ?? 0
      : book.distributorAuthorRoyaltyRate ?? 0;
  return Number((revenue * rate).toFixed(2));
}

interface SaleRecordInput {
  id: string; // Temporary ID for UI tracking
  saleDate: Dayjs | null; // Combined month/year as Dayjs
  book: BookResponse | null;
  saleSource: SaleRequest.saleSource;
  quantitySold: number | null;
  publisherRevenue: number | null;
  authorRoyalty: number | null;
  // Requirement: defaults to false
  hasAuthorBeenPaid: boolean;
  comment: string;

  // Placeholder row: visually greyed out; becomes active when user focuses/edits
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
}

export default function SaleCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notifications = useNotifications();
  const bookIdParam = React.useMemo(() => {
    const v = searchParams.get('bookId');
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }, [searchParams]);

  const [records, setRecords] = React.useState<SaleRecordInput[]>([createEmptyRecord({}, false)]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [books, setBooks] = React.useState<BookResponse[]>([]);
  const [bookSearchInput, setBookSearchInput] = React.useState('');
  const [isLoadingBooks, setIsLoadingBooks] = React.useState(false);
  const [preselectedBook, setPreselectedBook] = React.useState<BookResponse | null>(null);

  function createEmptyRecord(
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
      authorRoyalty: null,
      hasAuthorBeenPaid: defaults?.hasAuthorBeenPaid ?? false,
      comment: defaults?.comment ?? '',
      isPlaceholder,
      errors: {},
    };
  }
  // Prefill first row with book when opened from Book Detail (?bookId=...)
  React.useEffect(() => {
    if (!bookIdParam) return;
    let mounted = true;
    void (async () => {
      try {
        const book = await BooksService.getBookById(bookIdParam);
        if (!mounted) return;

        setBooks((prev) => (prev.some((b) => b.id === book.id) ? prev : [book, ...prev]));
        setRecords((prev) => {
          const next = [...prev];
          next[0] = { ...next[0], book, isPlaceholder: false };
          return next;
        });
      } catch {
        if (!mounted) return;
        setRecords((prev) => {
          const next = [...prev];
          next[0] = { ...next[0], isPlaceholder: false };
          return next;
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [bookIdParam]);

  // ✅ Load the preselected book from URL parameter
  React.useEffect(() => {
    const bookIdParam = searchParams.get('bookId');
    if (bookIdParam) {
      const bookId = parseInt(bookIdParam, 10);
      if (!isNaN(bookId)) {
        BooksService.getBookById(bookId)
          .then((book) => {
            setPreselectedBook(book);
            // Pre-populate the first record with the book
            setRecords([createEmptyRecord({ book }, false)]);
          })
          .catch((error) => {
            console.error('Failed to load preselected book:', error);
            notifications.show('Failed to load book details', {
              severity: 'warning',
              autoHideDuration: 3000,
            });
          });
      }
    }
  }, [searchParams, notifications]);

  // ✅ NEW: activate (un-grey) a placeholder row as soon as the user focuses any field
  const activateRow = React.useCallback((index: number) => {
    setRecords((prev) => {
      const next = [...prev];
      if (!next[index] || !next[index].isPlaceholder) return prev;
      next[index] = { ...next[index], isPlaceholder: false };
      return next;
    });
  }, []);

  // Load books for autocomplete
  const loadBooks = React.useCallback(async (searchQuery: string) => {
    setIsLoadingBooks(true);
    try {
      const response = await BooksService.getAllBooks(
        undefined,
        100,
        false,
        searchQuery || undefined,
      );
      setBooks(response.content ?? []);
    } catch (error) {
      console.error('Failed to load books:', error);
    }
    setIsLoadingBooks(false);
  }, []);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadBooks(bookSearchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [bookSearchInput, loadBooks]);

  // Initial load
  React.useEffect(() => {
    loadBooks('');
  }, [loadBooks]);

  const updateRecord = React.useCallback(
    (index: number, updates: Partial<SaleRecordInput>) => {
      setRecords((prev) => {
        const newRecords = [...prev];
        const next = { ...newRecords[index], ...updates };

        // ✅ If user updates anything (other than errors), activate placeholder row
        if (next.isPlaceholder) {
          const keys = Object.keys(updates).filter((k) => k !== 'errors');
          if (keys.length > 0) next.isPlaceholder = false;
        }

        const revenueChanged = updates.publisherRevenue !== undefined;
        const bookChanged = updates.book !== undefined;
        const saleSourceChanged = updates.saleSource !== undefined;
        const quantityChanged = updates.quantitySold !== undefined;

        if (revenueChanged || bookChanged || saleSourceChanged || quantityChanged) {
          const computedRevenue = computePublisherRevenue(
            next.book,
            next.quantitySold,
            next.saleSource,
            next.publisherRevenue,
          );
          next.publisherRevenue = computedRevenue;
          next.authorRoyalty = computeRoyalty(next.book, next.saleSource, computedRevenue);
        }

        newRecords[index] = next;

        // Auto-add new PLACEHOLDER row when current row is being filled
        const isLastRecord = index === newRecords.length - 1;
        const hasMinimalData = !!(next.saleDate && next.book);

        if (isLastRecord && hasMinimalData && !next.isPlaceholder) {
          newRecords.push(
            createEmptyRecord(
              {
                saleDate: next.saleDate,
                book: preselectedBook, // ✅ Carry forward the preselected book to new rows
              },
              true,
            ),
          );
        }

        return newRecords;
      });
    },
    [preselectedBook],
  );

  const handleDateChange = React.useCallback(
    (index: number) => (value: Dayjs | null) => {
      updateRecord(index, { saleDate: value, errors: {} });
    },
    [updateRecord],
  );

  const handleBookChange = React.useCallback(
    (index: number) => (_event: React.SyntheticEvent, value: BookResponse | null) => {
      updateRecord(index, {
        book: value,
        errors: {},
      });
    },
    [updateRecord],
  );

  const handleQuantityChange = React.useCallback(
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      updateRecord(index, {
        quantitySold: value ? parseInt(value, 10) : null,
        errors: {},
      });
    },
    [updateRecord],
  );

  const handleSaleSourceChange = React.useCallback(
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      updateRecord(index, {
        saleSource: event.target.value as SaleRequest.saleSource,
        errors: {},
      });
    },
    [updateRecord],
  );

  const handleRevenueChange = React.useCallback(
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      const parsed = value === '' ? null : Number.parseFloat(value);
      const publisherRevenue = typeof parsed === 'number' && !Number.isNaN(parsed) ? parsed : null;

      updateRecord(index, {
        publisherRevenue,
        errors: {},
      });
    },
    [updateRecord],
  );

  const handleCommentChange = React.useCallback(
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      updateRecord(index, { comment: event.target.value, errors: {} });
    },
    [updateRecord],
  );

  const handlePaidChange = React.useCallback(
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      updateRecord(index, { hasAuthorBeenPaid: event.target.checked, errors: {} });
    },
    [updateRecord],
  );

  const handleDeleteRecord = React.useCallback(
    (index: number) => () => {
      setRecords((prev) => {
        const filtered = prev.filter((_, i) => i !== index);
        if (filtered.length === 0) return [createEmptyRecord({}, false)];
        return filtered;
      });
    },
    [],
  );

  const validateRecord = (record: SaleRecordInput): boolean => {
    const errors: SaleRecordInput['errors'] = {};
    let isValid = true;

    if (!record.saleDate) {
      errors.saleDate = 'Date is required';
      isValid = false;
    } else {
      const year = record.saleDate.year();
      const month = record.saleDate.month() + 1; // Dayjs months are 0-indexed

      if (year < 1900 || year > 2026) {
        errors.saleDate = 'Year must be between 1900 and 2026';
        isValid = false;
      } else if (year === 2026 && month > 2) {
        errors.saleDate = 'Date cannot be after February 2026';
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
    } else if (record.quantitySold < 0) {
      errors.quantitySold = 'Quantity must be non-negative';
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
  };

  const handleSubmit = React.useCallback(async () => {
    // Filter out placeholder rows and rows without any data
    const filledRecords = records.filter(
      (r) => !r.isPlaceholder && (r.saleDate || r.book || r.quantitySold || r.publisherRevenue),
    );

    const allValid = filledRecords.every((record) => validateRecord(record));

    setRecords(filledRecords);

    if (!allValid) {
      notifications.show('Please fix validation errors before submitting', {
        severity: 'error',
        autoHideDuration: 3000,
      });
      return;
    }

    if (filledRecords.length === 0) {
      notifications.show('Please enter at least one sale record', {
        severity: 'error',
        autoHideDuration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const promises = filledRecords.map((record) => {
        const req = {
          bookId: record.book!.id!,
          saleSource: record.saleSource,
          saleMonth: record.saleDate!.month() + 1,
          saleYear: record.saleDate!.year(),
          quantitySold: record.quantitySold!,
          publisherRevenue:
            record.saleSource === SaleRequest.saleSource.DISTRIBUTOR
              ? record.publisherRevenue!
              : undefined,
          hasAuthorBeenPaid: record.hasAuthorBeenPaid,
          comment: record.comment || undefined,
        };
        return SalesService.createSale(req);
      });

      await Promise.all(promises);

      notifications.show(`Successfully created ${filledRecords.length} sale record(s)`, {
        severity: 'success',
        autoHideDuration: 3000,
      });

      if (bookIdParam) {
        navigate(`/books/${bookIdParam}`);
      } else {
        navigate('/sales');
      }
    } catch (error) {
      notifications.show(`Failed to create sales records: ${(error as Error).message}`, {
        severity: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [records, notifications, navigate, bookIdParam]);

  const handleBack = React.useCallback(() => {
    if (bookIdParam) {
      navigate(`/books/${bookIdParam}`);
    } else {
      navigate('/sales');
    }
  }, [navigate, bookIdParam]);

  const breadcrumbs = React.useMemo(() => {
    if (bookIdParam) {
      return [
        { title: 'Books', path: '/books' },
        { title: 'Book Detail', path: `/books/${bookIdParam}` },
        { title: 'New' },
      ];
    }
    return [{ title: 'Sales Records', path: '/sales' }, { title: 'New' }];
  }, [bookIdParam]);

  return (
    <PageContainer title="New Sales Records" breadcrumbs={breadcrumbs}>
      <Stack spacing={3} sx={{ width: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          Enter multiple sale records efficiently. The month/year will carry forward to help you
          input multiple sales from the same period. Use Tab to navigate between fields.
        </Typography>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="20">Sale Date (Month/Year)</TableCell>
                <TableCell width="250">Book</TableCell>
                <TableCell width="140">Sale Source</TableCell>
                <TableCell width="130">Quantity</TableCell>
                <TableCell width="160">Publisher Revenue</TableCell>
                <TableCell width="200">Author Royalty</TableCell>
                <TableCell width="220">Comment</TableCell>
                <TableCell width="170">Payment Status</TableCell>
                <TableCell width="60"></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {records.map((record, index) => (
                <TableRow
                  key={record.id}
                  sx={{
                    opacity: record.isPlaceholder ? 0.5 : 1,
                    backgroundColor: record.isPlaceholder ? 'action.hover' : 'transparent',
                  }}
                >
                  <TableCell>
                    <LocalizationProvider dateAdapter={CustomAdapterDayjs}>
                      <DatePicker
                        value={record.saleDate}
                        onChange={handleDateChange(index)}
                        views={['year', 'month']}
                        openTo="year"
                        format="MMM YYYY"
                        minDate={dayjs('1900-01-01')}
                        maxDate={dayjs('2026-02-28')}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            error: !!record.errors.saleDate,
                            helperText: record.errors.saleDate,
                            placeholder: '',
                            InputLabelProps: { shrink: true },
                            onFocus: () => activateRow(index),
                          },
                          field: {
                            clearable: true,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </TableCell>

                  <TableCell>
                    <Autocomplete
                      size="small"
                      options={books}
                      value={record.book}
                      onChange={handleBookChange(index)}
                      loading={isLoadingBooks}
                      onInputChange={(_, value) => {
                        activateRow(index);
                        setBookSearchInput(value);
                      }}
                      getOptionLabel={(option) =>
                        `${option.title} - ${option.author} (${option.isbn13})`
                      }
                      filterOptions={(x) => x}
                      renderInput={(params: AutocompleteRenderInputParams) => (
                        <TextField
                          {...params}
                          placeholder="Search by title, author, or ISBN"
                          onFocus={() => activateRow(index)}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Box>
                            <Typography variant="body2">{option.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.author} • ISBN: {option.isbn13}
                              {option.isbn10 && ` / ${option.isbn10}`}
                            </Typography>
                          </Box>
                        </li>
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={record.saleSource}
                      onFocus={() => activateRow(index)}
                      onChange={handleSaleSourceChange(index)}
                      error={!!record.errors.saleSource}
                      helperText={record.errors.saleSource}
                      fullWidth
                    >
                      <MenuItem value={SaleRequest.saleSource.DISTRIBUTOR}>Distributor</MenuItem>
                      <MenuItem value={SaleRequest.saleSource.HAND_SOLD}>Handsold</MenuItem>
                    </TextField>
                  </TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="text"
                      placeholder="0"
                      value={record.quantitySold ?? ''}
                      onFocus={() => activateRow(index)}
                      onChange={handleQuantityChange(index)}
                      error={!!record.errors.quantitySold}
                      helperText={record.errors.quantitySold}
                      inputProps={{ inputMode: 'numeric' }}
                      fullWidth
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="text"
                      placeholder="0.00"
                      value={record.publisherRevenue ?? ''}
                      onFocus={() => activateRow(index)}
                      onChange={handleRevenueChange(index)}
                      disabled={record.saleSource === SaleRequest.saleSource.HAND_SOLD}
                      error={!!record.errors.publisherRevenue}
                      helperText={record.errors.publisherRevenue}
                      inputProps={{ inputMode: 'decimal' }}
                      fullWidth
                      InputProps={{
                        startAdornment: <Typography>$</Typography>,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="text"
                      placeholder="0.00"
                      value={record.authorRoyalty ?? ''}
                      onFocus={() => activateRow(index)}
                      error={!!record.errors.authorRoyalty}
                      helperText={record.errors.authorRoyalty}
                      inputProps={{ inputMode: 'decimal', readOnly: true }}
                      fullWidth
                      InputProps={{
                        startAdornment: <Typography>$</Typography>,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      value={record.comment ?? ''}
                      onFocus={() => activateRow(index)}
                      onChange={handleCommentChange(index)}
                      error={!!record.errors.comment}
                      helperText={record.errors.comment}
                      inputProps={{ maxLength: 256 }}
                      fullWidth
                    />
                  </TableCell>

                  <TableCell>
                    <FormControlLabel
                      sx={{ m: 0, minWidth: 120 }}
                      control={
                        <Switch
                          checked={record.hasAuthorBeenPaid}
                          onFocus={() => activateRow(index)}
                          onChange={handlePaidChange(index)}
                        />
                      }
                      label={record.hasAuthorBeenPaid ? 'Paid' : 'Unpaid'}
                    />
                  </TableCell>

                  <TableCell>
                    {!record.isPlaceholder && records.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={handleDeleteRecord(index)}
                        aria-label="delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              isSubmitting || records.filter((r) => !r.isPlaceholder && r.book).length === 0
            }
            size="large"
          >
            {isSubmitting
              ? 'Saving...'
              : `Create ${records.filter((r) => !r.isPlaceholder && r.book).length} Record(s)`}
          </Button>
        </Stack>
      </Stack>
    </PageContainer>
  );
}
