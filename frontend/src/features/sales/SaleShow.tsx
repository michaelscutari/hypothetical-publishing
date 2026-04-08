import { SalesService, SaleRequest, type SaleResponse } from '@/api';
import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';
import PaidStatusChip from '@/components/PaidStatusChip';
import { useDialogs } from '@/hooks/useDialogs/useDialogs';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import { getErrorMessage } from '@/utils/error';
import { formatCurrency, formatMonthYear } from '@/utils/formatting';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';

export default function SaleShow() {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = (location.state as { from?: string } | null)?.from ?? '/sales';

  const dialogs = useDialogs();
  const notifications = useNotifications();

  const [sale, setSale] = React.useState<SaleResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdatingPaid, setIsUpdatingPaid] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const saleData = await SalesService.getSaleById(Number(saleId));
      setSale(saleData);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [saleId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaleEdit = React.useCallback(() => {
    navigate(`/sales/${saleId}/edit`);
  }, [navigate, saleId]);

  const handleSaleDelete = React.useCallback(async () => {
    if (!sale) return;

    const confirmed = await dialogs.confirm(
      `Do you wish to delete this sale record for ${sale.bookTitle}?`,
      {
        title: `Delete sale record?`,
        severity: 'error',
        okText: 'Delete',
        cancelText: 'Cancel',
      },
    );

    if (confirmed) {
      setIsLoading(true);
      try {
        await SalesService.deleteSale(Number(saleId));
        navigate('/sales');
        notifications.show('Sale record deleted successfully.', {
          severity: 'success',
          autoHideDuration: 3000,
        });
      } catch (deleteError) {
        notifications.show(
          `Failed to delete sale record. Reason: ${getErrorMessage(deleteError)}`,
          {
            severity: 'error',
            autoHideDuration: 3000,
          },
        );
      }
      setIsLoading(false);
    }
  }, [sale, dialogs, saleId, navigate, notifications]);

  const handleBack = React.useCallback(() => {
    navigate(backPath);
  }, [navigate, backPath]);

  const buildSaleUpdatePayload = React.useCallback(
    (saleData: SaleResponse, hasAuthorBeenPaid: boolean): SaleRequest => ({
      bookId: saleData.bookId,
      saleSource: saleData.saleSource as SaleRequest.saleSource,
      distributor:
        saleData.saleSource === 'DISTRIBUTOR'
          ? (saleData.distributor as SaleRequest.distributor)
          : undefined,
      format: saleData.format as SaleRequest.format,
      saleMonth: saleData.saleMonth,
      saleYear: saleData.saleYear,
      quantitySold: saleData.format === 'KINDLE_UNLIMITED' ? 0 : saleData.quantitySold,
      kenp: saleData.format === 'KINDLE_UNLIMITED' ? saleData.kenp : undefined,
      saleCurrency:
        saleData.saleSource === 'HAND_SOLD'
          ? SaleRequest.saleCurrency.USD
          : (saleData.saleCurrency as SaleRequest.saleCurrency),
      originalPublisherRevenue: Number(saleData.originalPublisherRevenue),
      publisherRevenue:
        saleData.saleSource === 'DISTRIBUTOR' ? Number(saleData.publisherRevenue) : undefined,
      hasAuthorBeenPaid,
      comment: saleData.comment ?? undefined,
    }),
    [],
  );

  const handlePaidChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!sale) return;

      const nextPaidState = event.target.checked;
      setIsUpdatingPaid(true);

      try {
        const updatedSale = await SalesService.updateSale(
          Number(saleId),
          buildSaleUpdatePayload(sale, nextPaidState),
        );

        setSale(updatedSale);
        notifications.show(
          nextPaidState ? 'Sale marked as paid.' : 'Sale marked as unpaid.',
          {
            severity: 'success',
            autoHideDuration: 3000,
          },
        );
      } catch (updateError) {
        notifications.show(
          `Failed to update payment status. Reason: ${getErrorMessage(updateError)}`,
          {
            severity: 'error',
            autoHideDuration: 3000,
          },
        );
      } finally {
        setIsUpdatingPaid(false);
      }
    },
    [sale, saleId, notifications, buildSaleUpdatePayload],
  );

  const formatSaleSource = (source: string) => {
    if (source === 'DISTRIBUTOR') return 'Distributor';
    if (source === 'HAND_SOLD') return 'Hand Sold';
    return '—';
  };

  const formatDistributor = (dist: string | null | undefined) => {
    if (!dist) return '—';
    if (dist === 'INGRAM_SPARK') return 'Ingram Spark';
    if (dist === 'AMAZON') return 'Amazon';
    if (dist === 'OTHER') return 'Other';
    return dist;
  };

  const formatFormat = (fmt: string | null | undefined) => {
    if (!fmt) return '—';
    if (fmt === 'PRINT') return 'Print';
    if (fmt === 'EBOOK') return 'Ebook';
    if (fmt === 'KINDLE_UNLIMITED') return 'Kindle Unlimited';
    return fmt;
  };

  const pageTitle = 'Sale Details';

  if (isLoading) return <FullPageLoader />;

  if (error) {
    return (
      <PageContainer
        title="Error"
        breadcrumbs={[
          {
            title: backPath === '/author-payments' ? 'Author Payments' : 'Sales Records',
            path: backPath,
          },
          { title: 'Error' },
        ]}
      >
        <Alert severity="error">{error}</Alert>
      </PageContainer>
    );
  }

  if (!sale) return null;

  const isDistributor = sale.saleSource === 'DISTRIBUTOR';
  const isKindleUnlimited = sale.format === 'KINDLE_UNLIMITED';
  const isNonUSD = sale.saleCurrency && sale.saleCurrency !== 'USD';
  const saleSourceLabel = formatSaleSource(sale.saleSource);
  const formatLabel = formatFormat(sale.format);
  const distributorLabel = formatDistributor(sale.distributor);

  return (
    <PageContainer
      title={pageTitle}
      breadcrumbs={[
        {
          title: backPath === '/author-payments' ? 'Author Payments' : 'Sales Records',
          path: backPath,
        },
        { title: pageTitle },
      ]}
    >
      <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mb: 3 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ color: 'text.secondary', fontWeight: 500, '&:hover': { color: 'primary.main' } }}
        >
          Back
        </Button>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={handleSaleEdit} size="small">
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleSaleDelete}
            size="small"
          >
            Delete
          </Button>
        </Stack>
      </Stack>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={3}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography
              component={RouterLink}
              to={`/books/${sale.bookId}`}
              variant="h4"
              sx={{
                display: 'inline-block',
                fontWeight: 700,
                lineHeight: 1.2,
                mb: 1,
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {sale.bookTitle}
            </Typography>

            <Typography
              component={RouterLink}
              to={`/authors/${sale.authorId}`}
              variant="h6"
              sx={{
                display: 'block',
                fontWeight: 400,
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline', color: 'primary.main' },
              }}
            >
              by {sale.bookAuthor}
            </Typography>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              minWidth: { xs: '100%', md: 320 },
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: { xs: 'wrap', md: 'nowrap' },
            }}
          >
            <Typography
              variant="overline"
              sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, lineHeight: 1 }}
            >
              Payment Status
            </Typography>
            <PaidStatusChip paid={sale.hasAuthorBeenPaid} />
            <Switch
              checked={sale.hasAuthorBeenPaid}
              onChange={handlePaidChange}
              disabled={isUpdatingPaid}
              inputProps={{ 'aria-label': 'Toggle paid status' }}
            />
          </Paper>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}
              >
                Publisher Revenue {isDistributor && isNonUSD ? '(USD)' : ''}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 500, color: 'primary.main', lineHeight: 1.15 }}>
                {formatCurrency(Number(sale.publisherRevenue))}
              </Typography>
              {isDistributor && isNonUSD && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Original: {Number(sale.originalPublisherRevenue).toFixed(2)} {sale.saleCurrency}
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}
              >
                Author Royalty
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 500, color: 'secondary.main', lineHeight: 1.15 }}>
                {formatCurrency(Number(sale.authorRoyalty))}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2.5 }} />

        <Typography
          variant="overline"
          sx={{ display: 'block', mb: 1.5, fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}
        >
          Additional Details
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1 }}>
            <Chip
              size="small"
              variant="outlined"
              label={saleSourceLabel}
              sx={{ fontWeight: 500, borderColor: 'divider', color: 'text.secondary' }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={formatLabel}
              sx={{ fontWeight: 500, borderColor: 'divider', color: 'text.secondary' }}
            />
            {isDistributor && (
              <Chip
                size="small"
                variant="outlined"
                label={distributorLabel}
                sx={{ fontWeight: 500, borderColor: 'divider', color: 'text.secondary' }}
              />
            )}
          </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
                Sale Breakdown
              </Typography>
              <Stack divider={<Divider flexItem />}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Sale Period
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatMonthYear(sale.saleMonth, sale.saleYear)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Quantity
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {isKindleUnlimited ? '—' : (sale.quantitySold ?? '—')}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    KENP
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {isKindleUnlimited ? (sale.kenp ?? '—') : '—'}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
                Settlement Details
              </Typography>
              <Stack divider={<Divider flexItem />}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Payout Currency
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    USD{isDistributor && isNonUSD ? ` (from ${sale.saleCurrency})` : ''}
                  </Typography>
                </Stack>
                {isDistributor && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Distributor
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {distributorLabel}
                    </Typography>
                  </Stack>
                )}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Comment
                  </Typography>
                  <Typography
                    variant="body1"
                    color={sale.comment ? 'text.primary' : 'text.secondary'}
                    sx={{ maxWidth: '70%', textAlign: 'right' }}
                  >
                    {sale.comment ?? '—'}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </PageContainer>
  );
}
