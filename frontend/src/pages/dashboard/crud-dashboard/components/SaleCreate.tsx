import * as React from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  FormHelperText,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { BooksService, SalesService, type BookResponse } from '../../../../api';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';
import { FormControlLabel, Switch } from '@mui/material';


const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface SaleRecordInput {
  id: string; // Temporary ID for UI tracking
  saleMonth: number | null;
  saleYear: number | null;
  book: BookResponse | null;
  quantitySold: number | null;
  publisherRevenue: number | null;
  // Requirement: auto-compute unless overridden; delete => revert
  authorRoyalty: number | null;
  isRoyaltyOverridden: boolean;
  // Requirement: defaults to false
  hasAuthorBeenPaid: boolean;

  errors: {
    saleMonth?: string;
    saleYear?: string;
    book?: string;
    quantitySold?: string;
    publisherRevenue?: string;
    authorRoyalty?: string;
  };
}

export default function SaleCreate() {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const [records, setRecords] = React.useState<SaleRecordInput[]>([
    createEmptyRecord(),
  ]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [books, setBooks] = React.useState<BookResponse[]>([]);
  const [bookSearchInput, setBookSearchInput] = React.useState('');
  const [isLoadingBooks, setIsLoadingBooks] = React.useState(false);

  function computeRoyalty(book: BookResponse | null, revenue: number | null): number | null {
    if (!book || revenue == null) return null;
    const rate = book.royaltyRate ?? 0;
    return Number((revenue * rate).toFixed(2));
  }

  function createEmptyRecord(defaults?: Partial<SaleRecordInput>): SaleRecordInput {
    return {
      id: Math.random().toString(36).substr(2, 9),
      saleMonth: defaults?.saleMonth ?? null,
      saleYear: defaults?.saleYear ?? null,
      book: defaults?.book ?? null,
      quantitySold: null,
      publisherRevenue: null,
      authorRoyalty: null,
      isRoyaltyOverridden: false,
      hasAuthorBeenPaid: defaults?.hasAuthorBeenPaid ?? false,
      
      errors: {},
    };
  }

  

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

        // Auto-calc royalty if NOT overridden and we have book+revenue.
        // Trigger on revenue OR book change (not just revenue).
        const revenueChanged = updates.publisherRevenue !== undefined;
        const bookChanged = updates.book !== undefined;

        if ((revenueChanged || bookChanged) && !next.isRoyaltyOverridden) {
          next.authorRoyalty = computeRoyalty(next.book, next.publisherRevenue);
        }

        newRecords[index] = next;

        // Requirement 3.4.2: Auto-add new row when current row is being filled
        const isLastRecord = index === newRecords.length - 1;
        const hasMinimalData = !!(next.saleMonth && next.saleYear && next.book);

        if (isLastRecord && hasMinimalData) {
          newRecords.push(
            createEmptyRecord({
              saleMonth: next.saleMonth,
              saleYear: next.saleYear,
            }),
          );
        }

        return newRecords;
      });
    },
    [],
  );

  const handleMonthChange = React.useCallback(
    (index: number) => (event: any) => {
      updateRecord(index, { saleMonth: event.target.value, errors: {} });
    },
    [updateRecord],
  );

  const handleYearChange = React.useCallback(
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      updateRecord(index, {
        saleYear: value ? parseInt(value, 10) : null,
        errors: {},
      });
    },
    [updateRecord],
  );

  const handleBookChange = React.useCallback(
    (index: number) => (_event: any, value: BookResponse | null) => {
      updateRecord(index, {
        book: value,
        // If the user had overridden, switching books should reset to computed
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
      const revenue = value === '' ? null : parseFloat(value);
      updateRecord(index, {
        publisherRevenue: Number.isNaN(revenue as any) ? null : revenue,
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
      setRecords((prev) => prev.filter((_, i) => i !== index));
    },
    [],
  );

  const validateRecord = (record: SaleRecordInput): boolean => {
    const errors: SaleRecordInput['errors'] = {};
    let isValid = true;

    if (!record.saleMonth) {
      errors.saleMonth = 'Month is required';
      isValid = false;
    }

    if (!record.saleYear) {
      errors.saleYear = 'Year is required';
      isValid = false;
    } else if (record.saleYear < 1900 || record.saleYear > 2100) {
      errors.saleYear = 'Year must be between 1900 and 2100';
      isValid = false;
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
    const filledRecords = records.filter(
      (r) => r.saleMonth || r.saleYear || r.book || r.quantitySold || r.publisherRevenue,
    );

    const validatedRecords = filledRecords.map((record) => ({
      ...record,
      isValid: validateRecord(record),
    }));

    setRecords(validatedRecords as any);

    const allValid = validatedRecords.every((r) => r.isValid);
    if (!allValid) {
      notifications.show('Please fix validation errors before submitting', {
        severity: 'error',
        autoHideDuration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const promises = validatedRecords.map((record) =>
        SalesService.createSale({
          bookId: record.book!.id!,
          saleMonth: record.saleMonth!,
          saleYear: record.saleYear!,
          quantitySold: record.quantitySold!,
          publisherRevenue: record.publisherRevenue!,
          hasAuthorBeenPaid: record.hasAuthorBeenPaid,
          authorRoyalty: record.authorRoyalty,
        } as any),
      );
      

      await Promise.all(promises);

      notifications.show(`Successfully created ${validatedRecords.length} sale record(s)`, {
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
      breadcrumbs={[
        { title: 'Sales Records', path: '/dashboard/sales' },
        { title: 'New' },
      ]}
    >
      <Stack spacing={3} sx={{ width: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          Enter multiple sale records efficiently. The month/year will carry forward to
          help you input multiple sales from the same period. Use Tab to navigate between
          fields.
        </Typography>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="120">Month</TableCell>
                <TableCell width="140">Year</TableCell>
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
                <TableRow key={record.id}>
                  <TableCell>
                    <FormControl fullWidth size="small" error={!!record.errors.saleMonth}>
                      <Select
                    value={record.saleMonth ?? ''}
                    onChange={handleMonthChange(index)}
                    displayEmpty
                    renderValue={(selected) => {
                        if (!selected) {
                        return (
                            <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                            Month
                            </Typography>
                        );
                        }
                        return MONTH_NAMES[(selected as number) - 1];
                    }}
>
  <MenuItem value="" disabled>
    Month
  </MenuItem>
  {MONTH_NAMES.map((month, idx) => (
    <MenuItem key={idx + 1} value={idx + 1}>
      {month}
    </MenuItem>
  ))}
</Select>

                      {record.errors.saleMonth && (
                        <FormHelperText>{record.errors.saleMonth}</FormHelperText>
                      )}
                    </FormControl>
                  </TableCell>

                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="Year"
                      value={record.saleYear ?? ''}
                      onChange={handleYearChange(index)}
                      error={!!record.errors.saleYear}
                      helperText={record.errors.saleYear}
                      inputProps={{ min: 1900, max: 2100 }}
                      fullWidth
                    />
                  </TableCell>

                  <TableCell>
                    <Autocomplete
                      size="small"
                      options={books}
                      value={record.book}
                      onChange={handleBookChange(index)}
                      loading={isLoadingBooks}
                      onInputChange={(_, value) => setBookSearchInput(value)}
                      getOptionLabel={(option) =>
                        `${option.title} - ${option.author} (${option.isbn13})`
                      }
                      filterOptions={(x) => x}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search by title, author, or ISBN"
                          error={!!record.errors.book}
                          helperText={record.errors.book}
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
      onChange={handleRoyaltyChange(index)}
      error={!!record.errors.authorRoyalty}
      helperText={
        record.errors.authorRoyalty ||
        (record.publisherRevenue == null || record.book == null
        )
      }
      inputProps={{ min: 0, step: 0.01 }}
      fullWidth
      InputProps={{
        startAdornment: <Typography>$</Typography>,
      }}
      sx={{
        '& .MuiInputBase-root': record.isRoyaltyOverridden
          ? { bgcolor: 'warning.lighter' }
          : undefined,
      }}
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
                        onChange={handlePaidChange(index)}
                    />
                    }
                />
                </TableCell>



                  <TableCell>
                    {records.length > 1 && (
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
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting || records.length === 0}
            size="large"
          >
            {isSubmitting
              ? 'Saving...'
              : `Create ${records.filter((r) => r.book).length} Record(s)`}
          </Button>
        </Stack>
      </Stack>
    </PageContainer>
  );
}
