import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarningIcon from '@mui/icons-material/Warning';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BooksService, SalesService, type BookResponse, type SaleResponse } from '../../../../api';
import { isValidMonetaryInput } from '../../../../utils/monetary';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';
import { MONTH_NAMES } from '../../../../constants/months';

export default function SaleEdit() {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();

  const [sale, setSale] = React.useState<SaleResponse | null>(null);
  const [books, setBooks] = React.useState<BookResponse[]>([]);
  const [selectedBook, setSelectedBook] = React.useState<BookResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Form fields
  const [saleMonth, setSaleMonth] = React.useState<number>(1);
  const [saleYear, setSaleYear] = React.useState<number>(new Date().getFullYear());
  const [quantitySold, setQuantitySold] = React.useState<number>(0);
  const [publisherRevenue, setPublisherRevenue] = React.useState<string>('0.00');
  const [authorRoyalty, setAuthorRoyalty] = React.useState<string>('0.00');
  const [hasAuthorBeenPaid, setHasAuthorBeenPaid] = React.useState<boolean>(false);
  const [isRoyaltyOverridden, setIsRoyaltyOverridden] = React.useState<boolean>(false);

  // Track original computed royalty
  const computedRoyalty = React.useMemo(() => {
    const revenue = parseFloat(publisherRevenue) || 0;
    const rate = selectedBook?.royaltyRate ?? 0;
    return (revenue * rate).toFixed(2);
  }, [publisherRevenue, selectedBook]);

  // Validation error for royalty
  const royaltyError = React.useMemo(() => {
    const royalty = parseFloat(authorRoyalty) || 0;
    const revenue = parseFloat(publisherRevenue) || 0;
    if (royalty > revenue) {
      return 'Author royalty cannot exceed publisher revenue';
    }
    return null;
  }, [authorRoyalty, publisherRevenue]);

  // Load sale and books
  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Load sale
      const saleData = await SalesService.getSaleById(Number(saleId));
      setSale(saleData);

      // Set form values
      setSaleMonth(saleData.saleMonth ?? 1);
      setSaleYear(saleData.saleYear ?? new Date().getFullYear());
      setQuantitySold(saleData.quantitySold ?? 0);
      setPublisherRevenue(String(saleData.publisherRevenue ?? 0));
      setAuthorRoyalty(String(saleData.authorRoyalty ?? 0));
      setHasAuthorBeenPaid(saleData.hasAuthorBeenPaid ?? false);

      // Load all books for dropdown
      const booksResponse = await BooksService.getAllBooks(undefined, 100, false);
      setBooks(booksResponse.content ?? []);

      // Find and set selected book
      const book = (booksResponse.content ?? []).find((b) => b.id === saleData.bookId);
      setSelectedBook(book ?? null);

      // Detect if the saved royalty was overridden from the computed default
      const savedRoyalty = saleData.authorRoyalty ?? 0;
      const expectedRoyalty = (saleData.publisherRevenue ?? 0) * (book?.royaltyRate ?? 0);
      const wasOverridden = Math.abs(savedRoyalty - parseFloat(expectedRoyalty.toFixed(2))) > 0.001;
      setIsRoyaltyOverridden(wasOverridden);
    } catch (loadError) {
      setError(loadError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [saleId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-update royalty when publisher revenue or book changes (unless manually overridden)
  React.useEffect(() => {
    if (!isRoyaltyOverridden && selectedBook) {
      setAuthorRoyalty(computedRoyalty);
    }
  }, [computedRoyalty, isRoyaltyOverridden, selectedBook]);

  const handleRoyaltyChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (!isValidMonetaryInput(value)) return;
      setAuthorRoyalty(value);
      const valueNum = parseFloat(value);
      const computedNum = parseFloat(computedRoyalty);
      setIsRoyaltyOverridden(
        value.trim() !== '' && !isNaN(valueNum) && Math.abs(valueNum - computedNum) > 0.001,
      );
    },
    [computedRoyalty],
  );

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedBook?.id) {
        notifications.show('Please select a book', {
          severity: 'error',
          autoHideDuration: 3000,
        });
        return;
      }

      if (royaltyError) {
        notifications.show(royaltyError, {
          severity: 'error',
          autoHideDuration: 3000,
        });
        return;
      }

      setIsSubmitting(true);
      try {
        await SalesService.updateSale(Number(saleId), {
          bookId: selectedBook.id,
          saleMonth,
          saleYear,
          quantitySold,
          publisherRevenue: parseFloat(publisherRevenue),
          authorRoyalty: isRoyaltyOverridden ? parseFloat(authorRoyalty) : undefined,
          hasAuthorBeenPaid,
        });

        notifications.show('Sale record updated successfully.', {
          severity: 'success',
          autoHideDuration: 3000,
        });

        navigate(`/sales/${saleId}`);
      } catch (updateError) {
        notifications.show(
          `Failed to update sale record. Reason: ${(updateError as Error).message}`,
          {
            severity: 'error',
            autoHideDuration: 3000,
          },
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      selectedBook,
      saleMonth,
      saleYear,
      quantitySold,
      publisherRevenue,
      hasAuthorBeenPaid,
      saleId,
      royaltyError,
      notifications,
      navigate,
      authorRoyalty,
      isRoyaltyOverridden,
    ],
  );

  const handleBack = React.useCallback(() => {
    navigate(`/sales/${saleId}`);
  }, [navigate, saleId]);

  const renderEdit = React.useMemo(() => {
    if (isLoading) {
      return (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            m: 1,
          }}
        >
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return (
        <Box sx={{ flexGrow: 1 }}>
          <Alert severity="error">{error.message}</Alert>
        </Box>
      );
    }

    return sale ? (
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
        <Grid container spacing={2} sx={{ mb: 2, width: '100%' }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel id="sale-month-label">Sale Month</InputLabel>
              <Select
                labelId="sale-month-label"
                value={saleMonth}
                onChange={(e) => setSaleMonth(Number(e.target.value))}
                label="Sale Month"
              >
                {MONTH_NAMES.map((month, index) => (
                  <MenuItem key={index + 1} value={index + 1}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="number"
              value={saleYear}
              onChange={(e) => setSaleYear(Number(e.target.value))}
              label="Sale Year"
              fullWidth
              inputProps={{ min: 1900, max: 2100 }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={books}
              value={selectedBook}
              onChange={(_, value) => {
                setSelectedBook(value);
                setIsRoyaltyOverridden(false); // Reset override when book changes
              }}
              getOptionLabel={(option) => `${option.title} - ${option.author} (${option.isbn13})`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Book"
                  placeholder="Search by title, author, or ISBN"
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body2">{option.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.author} • ISBN: {option.isbn13}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="number"
              value={quantitySold}
              onChange={(e) => setQuantitySold(Number(e.target.value))}
              label="Quantity Sold"
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="text"
              value={publisherRevenue}
              onChange={(e) => {
                if (isValidMonetaryInput(e.target.value)) setPublisherRevenue(e.target.value);
              }}
              label="Publisher Revenue"
              fullWidth
              inputProps={{ inputMode: 'decimal' }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="text"
              value={authorRoyalty}
              onChange={handleRoyaltyChange}
              label="Author Royalty"
              fullWidth
              error={!!royaltyError}
              helperText={royaltyError || ' '}
              inputProps={{ inputMode: 'decimal' }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{
                '& .MuiInputBase-root': isRoyaltyOverridden
                  ? {
                      backgroundColor: 'rgba(255, 167, 38, 0.12)',
                    }
                  : {},
              }}
            />
            {isRoyaltyOverridden && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                <WarningIcon fontSize="small" color="warning" />
                <Typography variant="caption" color="warning.main">
                  Overriding default calculation (${computedRoyalty})
                </Typography>
              </Stack>
            )}
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={hasAuthorBeenPaid}
                  onChange={(e) => setHasAuthorBeenPaid(e.target.checked)}
                />
              }
              label="Author has been paid"
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting || !!royaltyError}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </Stack>
      </Box>
    ) : null;
  }, [
    isLoading,
    error,
    sale,
    books,
    selectedBook,
    saleMonth,
    saleYear,
    quantitySold,
    publisherRevenue,
    authorRoyalty,
    hasAuthorBeenPaid,
    isSubmitting,
    isRoyaltyOverridden,
    computedRoyalty,
    royaltyError,
    handleRoyaltyChange,
    handleSubmit,
    handleBack,
  ]);

  return (
    <PageContainer
      title={`Edit Sale Record ${saleId}`}
      breadcrumbs={[
        { title: 'Sales Records', path: '/sales' },
        { title: `Sale ${saleId}`, path: `/sales/${saleId}` },
        { title: 'Edit' },
      ]}
    >
      <Box sx={{ display: 'flex', flex: 1 }}>{renderEdit}</Box>
    </PageContainer>
  );
}
