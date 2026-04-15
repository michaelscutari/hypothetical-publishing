import {
  BooksService,
  SaleRequest,
  SalesService,
  type BookResponse,
  type SaleResponse,
} from '@/api';
import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';
import { MONTH_NAMES } from '@/constants/months';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import { getErrorMessage } from '@/utils/error';
import { isValidMonetaryInput } from '@/utils/monetary';
import { computePublisherRevenue, computeSaleRoyalty } from '@/utils/royalty';
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
  const [distributor, setDistributor] = React.useState<SaleRequest.distributor>(
    SaleRequest.distributor.OTHER,
  );
  const [format, setFormat] = React.useState<SaleRequest.format>(SaleRequest.format.PRINT);
  const [saleCurrency, setSaleCurrency] = React.useState<SaleRequest.saleCurrency>(
    SaleRequest.saleCurrency.USD,
  );
  const [hasAuthorBeenPaid, setHasAuthorBeenPaid] = React.useState<boolean>(false);
  const [kenp, setKenp] = React.useState<number | undefined>(undefined);
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
      const saleData = await SalesService.getSaleById(Number(saleId));
      setSale(saleData);

      setSaleMonth(saleData.saleMonth);
      setSaleYear(saleData.saleYear);
      setQuantitySold(saleData.quantitySold);
      setPublisherRevenue(String(saleData.publisherRevenue));
      setAuthorRoyalty(String(saleData.authorRoyalty));
      setSaleSource(saleData.saleSource as SaleRequest.saleSource);
      setDistributor(saleData.distributor as SaleRequest.distributor);
      setFormat(saleData.format as SaleRequest.format);
      setSaleCurrency(saleData.saleCurrency as SaleRequest.saleCurrency);
      setHasAuthorBeenPaid(saleData.hasAuthorBeenPaid);
      setKenp(saleData.kenp ?? undefined);
      setComment(saleData.comment ?? '');

      const booksResponse = await BooksService.getAllBooks(undefined, 0, 100, false);
      setBooks(booksResponse.content ?? []);

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

  // Reset format when saleSource or distributor changes to avoid invalid combinations
  React.useEffect(() => {
    if (saleSource === SaleRequest.saleSource.HAND_SOLD) {
      setFormat(SaleRequest.format.PRINT);
    } else if (
      distributor === SaleRequest.distributor.INGRAM_SPARK &&
      format !== SaleRequest.format.PRINT
    ) {
      setFormat(SaleRequest.format.PRINT);
    } else if (
      distributor === SaleRequest.distributor.OTHER &&
      format === SaleRequest.format.KINDLE_UNLIMITED
    ) {
      setFormat(SaleRequest.format.PRINT);
    }
  }, [saleSource, distributor, format]);

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
          distributor: saleSource === SaleRequest.saleSource.DISTRIBUTOR ? distributor : undefined,
          format,
          saleMonth,
          saleYear,
          quantitySold: format === SaleRequest.format.KINDLE_UNLIMITED ? undefined : quantitySold,
          kenp: format === SaleRequest.format.KINDLE_UNLIMITED ? kenp : undefined,
          saleCurrency:
            saleSource === SaleRequest.saleSource.HAND_SOLD
              ? SaleRequest.saleCurrency.USD
              : saleCurrency,
          originalPublisherRevenue:
            saleSource === SaleRequest.saleSource.DISTRIBUTOR
              ? parseFloat(publisherRevenue)
              : computedRevenue,
          publisherRevenue:
            saleSource === SaleRequest.saleSource.DISTRIBUTOR
              ? parseFloat(publisherRevenue)
              : undefined,
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
      kenp,
      distributor,
      format,
      saleCurrency,
      saleId,
      notifications,
      navigate,
      saleSource,
      comment,
      computedRevenue,
    ],
  );

  const handleBack = React.useCallback(() => {
    navigate(`/sales/${saleId}`);
  }, [navigate, saleId]);

  const getCurrencySymbol = (currency: SaleRequest.saleCurrency) => {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency, minimumFractionDigits: 0 })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? currency
    );
  };

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
          {/* Sale Month */}
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

          {/* Sale Year */}
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

          {/* Book */}
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={books}
              value={selectedBook}
              onChange={(_, value) => setSelectedBook(value)}
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

          {/* Sale Source */}
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

          {/* Distributor — only shown for distributor sales */}
          {saleSource === SaleRequest.saleSource.DISTRIBUTOR && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="distributor-label">Distributor</InputLabel>
                <Select
                  labelId="distributor-label"
                  label="Distributor"
                  value={distributor}
                  onChange={(e) => setDistributor(e.target.value as SaleRequest.distributor)}
                >
                  <MenuItem value={SaleRequest.distributor.INGRAM_SPARK}>Ingram Spark</MenuItem>
                  <MenuItem value={SaleRequest.distributor.AMAZON}>Amazon</MenuItem>
                  <MenuItem value={SaleRequest.distributor.OTHER}>Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Format */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel id="format-label">Format</InputLabel>
              <Select
                labelId="format-label"
                label="Format"
                value={format}
                onChange={(e) => setFormat(e.target.value as SaleRequest.format)}
                disabled={saleSource === SaleRequest.saleSource.HAND_SOLD}
              >
                {saleSource === SaleRequest.saleSource.HAND_SOLD ? (
                  <MenuItem value={SaleRequest.format.PRINT}>Print</MenuItem>
                ) : distributor === SaleRequest.distributor.INGRAM_SPARK ? (
                  <MenuItem value={SaleRequest.format.PRINT}>Print</MenuItem>
                ) : distributor === SaleRequest.distributor.AMAZON ? (
                  [
                    <MenuItem key="print" value={SaleRequest.format.PRINT}>
                      Print
                    </MenuItem>,
                    <MenuItem key="ebook" value={SaleRequest.format.EBOOK}>
                      Ebook
                    </MenuItem>,
                    <MenuItem key="ku" value={SaleRequest.format.KINDLE_UNLIMITED}>
                      Kindle Unlimited
                    </MenuItem>,
                  ]
                ) : (
                  [
                    <MenuItem key="print" value={SaleRequest.format.PRINT}>
                      Print
                    </MenuItem>,
                    <MenuItem key="ebook" value={SaleRequest.format.EBOOK}>
                      Ebook
                    </MenuItem>,
                  ]
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* Currency — only shown for distributor sales */}
          {saleSource === SaleRequest.saleSource.DISTRIBUTOR && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="currency-label">Currency</InputLabel>
                <Select
                  labelId="currency-label"
                  label="Currency"
                  value={saleCurrency}
                  onChange={(e) => setSaleCurrency(e.target.value as SaleRequest.saleCurrency)}
                >
                  {Object.values(SaleRequest.saleCurrency).map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Quantity Sold — disabled for Kindle Unlimited */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="number"
              value={quantitySold}
              onChange={(e) => setQuantitySold(Number(e.target.value))}
              label="Quantity Sold"
              fullWidth
              disabled={format === SaleRequest.format.KINDLE_UNLIMITED}
              inputProps={{ min: 0 }}
              onWheel={(e) => (e.target as HTMLElement).blur()}
            />
          </Grid>

          {/* KENP — disabled unless Kindle Unlimited */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="number"
              value={kenp ?? ''}
              onChange={(e) => setKenp(e.target.value ? Number(e.target.value) : undefined)}
              label="KENP"
              fullWidth
              disabled={format !== SaleRequest.format.KINDLE_UNLIMITED}
              inputProps={{ min: 0 }}
              onWheel={(e) => (e.target as HTMLElement).blur()}
            />
          </Grid>

          {/* Publisher Revenue — disabled for handsold (auto-computed) */}
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
                startAdornment: (
                  <InputAdornment position="start">
                    {getCurrencySymbol(
                      saleSource === SaleRequest.saleSource.HAND_SOLD
                        ? SaleRequest.saleCurrency.USD
                        : saleCurrency,
                    )}
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Author Royalty — always read-only, auto-computed */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="text"
              value={authorRoyalty}
              label="Author Royalty"
              fullWidth
              inputProps={{ inputMode: 'decimal', readOnly: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {getCurrencySymbol(
                      saleSource === SaleRequest.saleSource.HAND_SOLD
                        ? SaleRequest.saleCurrency.USD
                        : saleCurrency,
                    )}
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Comment */}
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

          {/* Author Paid */}
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
