import * as React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
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
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { BooksService, SalesService, type BookResponse } from '../../../../api';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';
import { FormControlLabel, Switch } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';

// Custom adapter to force MMM YYYY format
class CustomAdapterDayjs extends AdapterDayjs {
  getMonthArray = (date: Dayjs) => {
    const year = this.getYear(date);
    return Array.from({ length: 12 }, (_, i) => dayjs().year(year).month(i));
  };
}

interface SaleRecordInput {
  id: string; // Temporary ID for UI tracking
  saleDate: Dayjs | null; // Combined month/year as Dayjs
  book: BookResponse | null;
  quantitySold: number | null;
  publisherRevenue: number | null;
  // Requirement: auto-compute unless overridden; delete => revert
  authorRoyalty: number | null;
  isRoyaltyOverridden: boolean;
  // Requirement: defaults to false
  hasAuthorBeenPaid: boolean;

  // Placeholder row: visually greyed out; becomes active when user focuses/edits
  isPlaceholder: boolean;

  errors: {
    saleDate?: string;
    book?: string;
    quantitySold?: string;
    publisherRevenue?: string;
    authorRoyalty?: string;
  };
}

export default function SaleCreate() {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const [records, setRecords] = React.useState<SaleRecordInput[]>([createEmptyRecord({}, false)]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [books, setBooks] = React.useState<BookResponse[]>([]);
  const [bookSearchInput, setBookSearchInput] = React.useState('');
  const [isLoadingBooks, setIsLoadingBooks] = React.useState(false);

  function computeRoyalty(book: BookResponse | null, revenue: number | null): number | null {
    if (!book || revenue == null) return null;
    const rate = book.royaltyRate ?? 0;
    return Number((revenue * rate).toFixed(2));
  }

  function createEmptyRecord(
    defaults?: Partial<SaleRecordInput>,
    isPlaceholder = false,
  ): SaleRecordInput {
    return {
      id: Math.random().toString(36).substr(2, 9),
      saleDate: defaults?.saleDate ?? null,
      book: defaults?.book ?? null,
      quantitySold: null,
      publisherRevenue: null,
      authorRoyalty: null,
      isRoyaltyOverridden: false,
      hasAuthorBeenPaid: defaults?.hasAuthorBeenPaid ?? false,
      isPlaceholder,
      errors: {},
    };
  }

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

  const updateRecord = React.useCallback((index: number, updates: Partial<SaleRecordInput>) => {
    setRecords((prev) => {
      const newRecords = [...prev];
      const next = { ...newRecords[index], ...updates };

      // ✅ If user updates anything (other than errors), activate placeholder row
      if (next.isPlaceholder) {
        const keys = Object.keys(updates).filter((k) => k !== 'errors');
        if (keys.length > 0) next.isPlaceholder = false;
      }

      // Auto-calc royalty if NOT overridden and we have book+revenue.
      const revenueChanged = updates.publisherRevenue !== undefined;
      const bookChanged = updates.book !== undefined;

      if ((revenueChanged || bookChanged) && !next.isRoyaltyOverridden) {
        next.authorRoyalty = computeRoyalty(next.book, next.publisherRevenue);
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
            },
            true,
          ),
        );
      }

      return newRecords;
    });
  }, []);

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
        isRoyaltyOverridden: false,
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

  // Requirement: editable royalty, override indicator, delete => revert to computed
  const handleRoyaltyChange = React.useCallback(
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setRecords((prev) => {
        const next = [...prev];
        const record = { ...next[index] };

        // ✅ if user types here, activate the row too
        if (record.isPlaceholder) record.isPlaceholder = false;

        if (value === '') {
          // Deleted -> revert to computed + clear override
          record.authorRoyalty = computeRoyalty(record.book, record.publisherRevenue);
          record.isRoyaltyOverridden = false;
        } else {
          const parsed = parseFloat(value);
          record.authorRoyalty = Number.isNaN(parsed) ? null : parsed;
          record.isRoyaltyOverridden = true;
        }

        record.errors = { ...(record.errors ?? {}) };
        next[index] = record;
        return next;
      });
    },
    [],
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

    if (record.quantitySold == null) {
      errors.quantitySold = 'Quantity is required';
      isValid = false;
    } else if (record.quantitySold < 0) {
      errors.quantitySold = 'Quantity must be non-negative';
      isValid = false;
    }

    if (record.publisherRevenue == null) {
      errors.publisherRevenue = 'Revenue is required';
      isValid = false;
    } else if (record.publisherRevenue < 0) {
      errors.publisherRevenue = 'Revenue must be non-negative';
      isValid = false;
    }

    if (record.authorRoyalty != null && record.authorRoyalty < 0) {
      errors.authorRoyalty = 'Royalty must be non-negative';
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
        const req: SalesService.createSale = {
          bookId: record.book!.id!,
          saleMonth: record.saleDate!.month() + 1,
          saleYear: record.saleDate!.year(),
          quantitySold: record.quantitySold!,
          publisherRevenue: record.publisherRevenue!,
          hasAuthorBeenPaid: record.hasAuthorBeenPaid,
          authorRoyalty: record.authorRoyalty ?? undefined,
        };
        return SalesService.createSale(req);
      });

      await Promise.all(promises);

      notifications.show(`Successfully created ${filledRecords.length} sale record(s)`, {
        severity: 'success',
        autoHideDuration: 3000,
      });

      navigate('/dashboard/sales');
    } catch (error) {
      notifications.show(`Failed to create sales records: ${(error as Error).message}`, {
        severity: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [records, notifications, navigate]);

  const handleBack = React.useCallback(() => {
    navigate('/dashboard/sales');
  }, [navigate]);

  return (
    <PageContainer
      title="New Sales Records"
      breadcrumbs={[{ title: 'Sales Records', path: '/dashboard/sales' }, { title: 'New' }]}
    >
      <Stack spacing={3} sx={{ width: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          Enter multiple sale records efficiently. The month/year will carry forward to help you
          input multiple sales from the same period. Use Tab to navigate between fields.
        </Typography>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="180">Sale Date (Month/Year)</TableCell>
                <TableCell width="250">Book</TableCell>
                <TableCell width="100">Quantity</TableCell>
                <TableCell width="140">Publisher Revenue</TableCell>
                <TableCell width="160">Author Royalty</TableCell>
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
                      size="small"
                      type="number"
                      placeholder="0"
                      value={record.quantitySold ?? ''}
                      onFocus={() => activateRow(index)}
                      onChange={handleQuantityChange(index)}
                      error={!!record.errors.quantitySold}
                      helperText={record.errors.quantitySold}
                      inputProps={{ min: 0 }}
                      fullWidth
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="0.00"
                      value={record.publisherRevenue ?? ''}
                      onFocus={() => activateRow(index)}
                      onChange={handleRevenueChange(index)}
                      error={!!record.errors.publisherRevenue}
                      helperText={record.errors.publisherRevenue}
                      inputProps={{ min: 0, step: 0.01 }}
                      fullWidth
                      InputProps={{
                        startAdornment: <Typography>$</Typography>,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="0.00"
                        value={record.authorRoyalty ?? ''}
                        onFocus={() => activateRow(index)}
                        onChange={handleRoyaltyChange(index)}
                        error={!!record.errors.authorRoyalty}
                        helperText={record.errors.authorRoyalty}
                        inputProps={{ min: 0, step: 0.01 }}
                        fullWidth
                        InputProps={{
                          startAdornment: <Typography>$</Typography>,
                        }}
                        sx={
                          record.isRoyaltyOverridden
                            ? { '& .MuiInputBase-root': { bgcolor: 'warning.lighter' } }
                            : undefined
                        }
                      />

                      {record.isRoyaltyOverridden && (
                        <Chip
                          label="Override"
                          size="small"
                          color="warning"
                          sx={{ ml: 'auto', height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <FormControlLabel
                      sx={{ m: 0 }}
                      control={
                        <Switch
                          checked={record.hasAuthorBeenPaid}
                          onFocus={() => activateRow(index)}
                          onChange={handlePaidChange(index)}
                        />
                      }
                      label={undefined}
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
