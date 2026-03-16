import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SalesService, type SaleResponse } from '@/api';
import { getErrorMessage } from '@/utils/error';
import { formatCurrency, formatMonthYear } from '@/utils/formatting';
import { useDialogs } from '@/hooks/useDialogs/useDialogs';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';
import PaidStatusChip from '@/components/PaidStatusChip';

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
    if (!sale) {
      return;
    }

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

  const pageTitle = `Sale Record ${saleId}`;

  if (isLoading) {
    return <FullPageLoader />;
  }

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
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<EditIcon />} onClick={handleSaleEdit}>
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleSaleDelete}
          >
            Delete
          </Button>
        </Stack>
      </Stack>
      <Divider sx={{ my: 3 }} />
      <Grid container spacing={2} sx={{ width: '100%' }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Book</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <Box
                component="a"
                href={`/books/${sale.bookId}`}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  navigate(`/books/${sale.bookId}`);
                }}
                sx={{
                  color: 'inherit',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main',
                  },
                }}
              >
                {sale.bookTitle}
              </Box>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              by {sale.bookAuthor}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Sale Period</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {formatMonthYear(sale.saleMonth, sale.saleYear)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Sale Source</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {sale.saleSource === 'DISTRIBUTOR'
                ? 'Distributor'
                : sale.saleSource === 'HAND_SOLD'
                  ? 'Hand Sold'
                  : '—'}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Quantity Sold</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {sale.quantitySold}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Publisher Revenue</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {formatCurrency(Number(sale.publisherRevenue))}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Author Royalty</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {formatCurrency(Number(sale.authorRoyalty))}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Comment</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {sale.comment ?? '—'}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Payment Status</Typography>
            <Box sx={{ mb: 1 }}>
              <PaidStatusChip paid={sale.hasAuthorBeenPaid} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
