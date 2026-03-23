import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import {
  BooksService,
  SaleRequest,
  SalesService,
  type BookResponse,
  type SaleResponse,
} from '@/api';
import { MONTH_NAMES } from '@/constants/months';
import { getErrorMessage } from '@/utils/error';
import { isValidMonetaryInput } from '@/utils/monetary';
import { computePublisherRevenue, computeSaleRoyalty } from '@/utils/royalty';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';

export default function SaleEdit() {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();

  const [sale, setSale] = React.useState<SaleResponse | null>(null);
  const [books, setBooks] = React.useState<BookResponse[]>([]);
  const [selectedBook, setSelectedBook] = React.useState<BookResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form fields
  const [saleMonth, setSaleMonth] = React.useState<number>(1);
  const [saleYear, setSaleYear] = React.useState<number>(new Date().getFullYear());
  const [quantitySold, setQuantitySold] = React.useState<number>(0);
  const [publisherRevenue, setPublisherRevenue] = React.useState<string>('0.00');
  const [authorRoyalty, setAuthorRoyalty] = React.useState<string>('0.00');
  const [saleSource, setSaleSource] = React.useState<SaleRequest.saleSource>(
    SaleRequest.saleSource.DISTRIBUTOR,
  );
  const [hasAuthorBeenPaid, setHasAuthorBeenPaid] = React.useState<boolean>(false);
  const [comment, setComment] = React.useState<string>('');

  const computedRevenue = React.useMemo(() => {
    return (
      computePublisherRevenue(
        saleSource,
        Number(selectedBook?.coverPrice ?? 0),
        Number(selectedBook?.printCost ?? 0),
        quantitySold,
        parseFloat(publisherRevenue) || 0,
      ) ?? 0
    );
  }, [publisherRevenue, saleSource, selectedBook, quantitySold]);

  const computedRoyalty = React.useMemo(() => {
    return (
      computeSaleRoyalty(
        computedRevenue,
        saleSource,
        selectedBook?.handsoldAuthorRoyaltyRate ?? 0,
        selectedBook?.distributorAuthorRoyaltyRate ?? 0,
      ) ?? 0
    );
  }, [computedRevenue, saleSource, selectedBook]);

  // Load sale and books
  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Load sale
      const saleData = await SalesService.getSaleById(Number(saleId));
      setSale(saleData);

      // Set form values
      setSaleMonth(saleData.saleMonth);
      setSaleYear(saleData.saleYear);
      setQuantitySold(saleData.quantitySold);
      setPublisherRevenue(String(saleData.publisherRevenue));
      setAuthorRoyalty(String(saleData.authorRoyalty));
      setSaleSource(saleData.saleSource as SaleRequest.saleSource);
      setHasAuthorBeenPaid(saleData.hasAuthorBeenPaid);
      setComment(saleData.comment ?? '');

      // Load all books for dropdown
      const booksResponse = await BooksService.getAllBooks(undefined, 0, 100, false);
      setBooks(booksResponse.content ?? []);

      // Find and set selected book
      const book = (booksResponse.content ?? []).find((b) => b.id === saleData.bookId);
      setSelectedBook(book ?? null);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [saleId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    setAuthorRoyalty(computedRoyalty.toFixed(2));
    if (saleSource === SaleRequest.saleSource.HAND_SOLD) {
      setPublisherRevenue(computedRevenue.toFixed(2));
    }
  }, [computedRevenue, computedRoyalty, saleSource]);

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

      setIsSubmitting(true);
      try {
        await SalesService.updateSale(Number(saleId), {
          bookId: selectedBook.id,
          saleSource,
          distributor: sale?.distributor ?? SaleRequest.distributor.OTHER,
          format: sale?.format ?? SaleRequest.format.PRINT,
          saleMonth,
          saleYear,
          quantitySold,
          saleCurrency: sale?.saleCurrency ?? SaleRequest.saleCurrency.USD,
          originalPublisherRevenue:
            saleSource === SaleRequest.saleSource.DISTRIBUTOR
              ? parseFloat(publisherRevenue)
              : computedRevenue,
          publisherRevenue:
            saleSource === SaleRequest.saleSource.DISTRIBUTOR
              ? parseFloat(publisherRevenue)
              : computedRevenue,
          hasAuthorBeenPaid,
          comment: comment || undefined,
        });

        notifications.show('Sale record updated successfully.', {
          severity: 'success',
          autoHideDuration: 3000,
        });

        navigate(`/sales/${saleId}`);
      } catch (updateError) {
        notifications.show(
          `Failed to update sale record. Reason: ${getErrorMessage(updateError)}`,
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
      notifications,
      navigate,
      saleSource,
      comment,
      sale,
      computedRevenue,
    ],
  );

  const handleBack = React.useCallback(() => {
    navigate(`/sales/${saleId}`);
  }, [navigate, saleId]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <PageContainer
        title="Edit Sale Record"
        breadcrumbs={[
          { title: 'Sales Records', path: '/sales' },
          { title: `Sale ${saleId}`, path: `/sales/${saleId}` },
          { title: 'Edit' },
        ]}
      >
        <Alert severity="error">{error}</Alert>
      </PageContainer>
    );
  }

  if (!sale) return null;

  return (
    <PageContainer
      title={`Edit Sale Record ${saleId}`}
      breadcrumbs={[
        { title: 'Sales Records', path: '/sales' },
        { title: `Sale ${saleId}`, path: `/sales/${saleId}` },
        { title: 'Edit' },
      ]}
    >
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
              onWheel={(e) => (e.target as HTMLElement).blur()}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={books}
              value={selectedBook}
              onChange={(_, value) => {
                setSelectedBook(value);
              }}
              getOptionLabel={(option) => `${option.title} - ${option.author} (${option.isbn13})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
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
            <FormControl fullWidth>
              <InputLabel id="sale-source-label">Sale Source</InputLabel>
              <Select
                labelId="sale-source-label"
                label="Sale Source"
                value={saleSource}
                onChange={(e) => setSaleSource(e.target.value as SaleRequest.saleSource)}
              >
                <MenuItem value={SaleRequest.saleSource.DISTRIBUTOR}>Distributor</MenuItem>
                <MenuItem value={SaleRequest.saleSource.HAND_SOLD}>Handsold</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="number"
              value={quantitySold}
              onChange={(e) => setQuantitySold(Number(e.target.value))}
              label="Quantity Sold"
              fullWidth
              inputProps={{ min: 0 }}
              onWheel={(e) => (e.target as HTMLElement).blur()}
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
              disabled={saleSource === SaleRequest.saleSource.HAND_SOLD}
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
              label="Author Royalty"
              fullWidth
              inputProps={{ inputMode: 'decimal', readOnly: true }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              label="Comment"
              fullWidth
              inputProps={{ maxLength: 256 }}
              helperText={`${comment.length}/256 characters`}
            />
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
          <Button type="submit" variant="contained" size="large" loading={isSubmitting}>
            Save
          </Button>
        </Stack>
      </Box>
    </PageContainer>
  );
}
