import { SalesService, type SaleResponse } from '@/api';
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
      <Grid container spacing={4} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, position: 'sticky', top: 24 }}>
            <Typography
              variant="overline"
              sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}
            >
              Sale Details
            </Typography>
            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Sale Period
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatMonthYear(sale.saleMonth, sale.saleYear)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Source
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {saleSourceLabel}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Format
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatLabel}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
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
              mb: 2.5,
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline', color: 'primary.main' },
            }}
          >
            by {sale.bookAuthor}
          </Typography>

          <Divider sx={{ mb: 2.5 }} />

          <Stack spacing={1} sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 160, fontWeight: 600 }}
              >
                Quantity
              </Typography>
              <Typography variant="body1">
                {isKindleUnlimited ? '—' : (sale.quantitySold ?? '—')}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 160, fontWeight: 600 }}
              >
                KENP
              </Typography>
              <Typography variant="body1">
                {isKindleUnlimited ? (sale.kenp ?? '—') : '—'}
              </Typography>
            </Stack>
            {isDistributor && (
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 160, fontWeight: 600 }}
                >
                  Distributor
                </Typography>
                <Typography variant="body1">{distributorLabel}</Typography>
              </Stack>
            )}
          </Stack>

          <Divider sx={{ mb: 2.5 }} />

          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 160, fontWeight: 600 }}
              >
                Comment
              </Typography>
              <Typography variant="body1" color={sale.comment ? 'text.primary' : 'text.secondary'}>
                {sale.comment ?? '—'}
              </Typography>
            </Stack>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography
              variant="overline"
              sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}
            >
              Payout Snapshot
            </Typography>
            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={2}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Payout Currency
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  USD
                  {isDistributor && isNonUSD ? ` · Original: ${sale.saleCurrency}` : ''}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Publisher Revenue {isDistributor && isNonUSD ? '(USD)' : ''}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}
                >
                  {formatCurrency(Number(sale.publisherRevenue))}
                </Typography>
                {isDistributor && isNonUSD && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {Number(sale.originalPublisherRevenue).toFixed(2)} {sale.saleCurrency}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Author Royalty
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: 'secondary.main', lineHeight: 1.2 }}
                >
                  {formatCurrency(Number(sale.authorRoyalty))}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Payment Status
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  <PaidStatusChip paid={sale.hasAuthorBeenPaid} />
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
