import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BooksService, SalesService, type BookResponse, type SaleResponse } from '@/api';
import { formatCurrency, formatMonthYear } from '@/utils/formatting';
import { useDialogs } from '@/hooks/useDialogs/useDialogs';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
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
  const [book, setBook] = React.useState<BookResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const saleData = await SalesService.getSaleById(Number(saleId));
      setSale(saleData);

      const bookData = await BooksService.getBookById(saleData.bookId);
      setBook(bookData);
    } catch (loadError) {
      setError(loadError as Error);
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
      `Do you wish to delete this sale record for ${book?.title || 'this book'}?`,
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
          `Failed to delete sale record. Reason: ${(deleteError as Error).message}`,
          {
            severity: 'error',
            autoHideDuration: 3000,
          },
        );
      }
      setIsLoading(false);
    }
  }, [sale, book, dialogs, saleId, navigate, notifications]);

  const handleBack = React.useCallback(() => {
    navigate(backPath);
  }, [navigate, backPath]);

  const renderShow = React.useMemo(() => {
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
      <Box sx={{ flexGrow: 1, width: '100%' }}>
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
                  {book?.title || `Book ID: ${sale.bookId}`}
                </Box>
              </Typography>
              {book?.author && (
                <Typography variant="caption" color="text.secondary">
                  by {book.author}
                </Typography>
              )}
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
      </Box>
    ) : null;
  }, [isLoading, error, sale, book, handleBack, handleSaleEdit, handleSaleDelete, navigate]);

  const pageTitle = `Sale Record ${saleId}`;

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
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>{renderShow}</Box>
    </PageContainer>
  );
}
