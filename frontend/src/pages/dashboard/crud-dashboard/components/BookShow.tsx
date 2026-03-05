import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import FullPageLoader from '../../../../components/FullPageLoader';
import { MONTH_NAMES } from '../../../../constants/months';
import BookSalesList from '../components/BookSalesList';
import FinancialSummary from '../components/FinancialSummary';
import { deleteOne as deleteBook, getOne as getBook, type BookDetail } from '../data/books';
import * as salesData from '../data/sales';
import { useDialogs } from '../hooks/useDialogs/useDialogs';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';

export default function BookShow() {
  const { bookId } = useParams<{ bookId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = (location.state as { from?: string } | null)?.from ?? '/books';

  const dialogs = useDialogs();
  const notifications = useNotifications();

  const [book, setBook] = React.useState<BookDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [sales, setSales] = React.useState<salesData.Sale[]>([]);

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const showData = await getBook(Number(bookId));
      setBook(showData);
    } catch (showDataError) {
      setError(showDataError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const reloadSales = React.useCallback(async () => {
    if (!bookId) {
      setSales([]);
      return;
    }
    try {
      const s = await salesData.getForBook(Number(bookId));
      const sorted = (s ?? []).sort((a, b) => {
        const aKey = (a.saleYear ?? 0) * 100 + (a.saleMonth ?? 0);
        const bKey = (b.saleYear ?? 0) * 100 + (b.saleMonth ?? 0);
        return bKey - aKey;
      });
      setSales(sorted);
    } catch {
      setSales([]);
    }
  }, [bookId]);

  React.useEffect(() => {
    void reloadSales();
  }, [reloadSales]);

  const handleBookEdit = React.useCallback(() => {
    navigate(`/books/${bookId}/edit`);
  }, [navigate, bookId]);

  const handleBookDelete = React.useCallback(async () => {
    if (!book) return;
    const confirmed = await dialogs.confirm(
      `Do you wish to delete ${book.title} by ${book.author}? By doing so, you will also be deleting ${book.totalSalesToDate} sales.`,
      { title: `Delete book?`, severity: 'error', okText: 'Delete', cancelText: 'Cancel' },
    );
    if (confirmed) {
      setIsLoading(true);
      try {
        await deleteBook(Number(bookId));
        navigate('/books');
        notifications.show('Book deleted successfully.', {
          severity: 'success',
          autoHideDuration: 3000,
        });
      } catch (deleteError) {
        notifications.show(`Failed to delete book. Reason: ${(deleteError as Error).message}`, {
          severity: 'error',
          autoHideDuration: 3000,
        });
      }
      setIsLoading(false);
    }
  }, [book, dialogs, bookId, navigate, notifications]);

  const handleBack = React.useCallback(() => {
    navigate(backPath);
  }, [navigate, backPath]);

  const formatPublicationDate = (year?: number, month?: number) => {
    if (!year || !month) return '—';
    return `${MONTH_NAMES[month - 1]} ${year}`;
  };

  const formatRoyaltyRate = (rate?: number) => {
    if (rate == null) return '—';
    return `${(rate * 100).toFixed(0)}%`;
  };

  const renderShow = React.useMemo(() => {
    if (isLoading) {
      return (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
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

    if (!book) return null;

    return (
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        {/* Top action bar */}
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
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleBookEdit}
              size="small"
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBookDelete}
              size="small"
            >
              Delete
            </Button>
          </Stack>
        </Stack>

        {/* Main product layout */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* LEFT: Cover image */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              {book.hasCover ? (
                <Box
                  component="img"
                  src={`/api/books/${book.id}/cover/thumbnail`}
                  alt={`${book.title} cover`}
                  sx={{
                    width: '100%',
                    maxWidth: 280,
                    display: 'block',
                    mx: 'auto',
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 280,
                    aspectRatio: '2/3',
                    mx: 'auto',
                    borderRadius: 2,
                    bgcolor: 'grey.100',
                    border: '2px dashed',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.disabled">
                    No cover
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {/* CENTER: Title, author, metadata */}
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Series badge */}
            {book.seriesName && (
              <Chip
                label={`${book.seriesName}${book.seriesPosition ? ` · Book ${book.seriesPosition}` : ''}`}
                size="small"
                variant="outlined"
                sx={{ mb: 1.5, fontWeight: 500, borderColor: 'divider', color: 'text.secondary' }}
              />
            )}

            {/* Title */}
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, lineHeight: 1.2, mb: 1, color: 'text.primary' }}
            >
              {book.title}
            </Typography>

            {/* Author */}
            <Typography variant="h6" sx={{ fontWeight: 400, mb: 2.5, color: 'text.secondary' }}>
              by{' '}
              <Box
                component="span"
                onClick={() => navigate(`/authors/${book.authorId}`)}
                sx={{
                  color: 'primary.main',
                  cursor: 'pointer',
                  fontWeight: 500,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {book.author}
              </Box>
            </Typography>

            <Divider sx={{ mb: 2.5 }} />

            {/* Publication date + ISBNs */}
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 130, fontWeight: 600 }}
                >
                  Publication Date
                </Typography>
                <Typography variant="body1">
                  {formatPublicationDate(book.publicationYear, book.publicationMonth)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 130, fontWeight: 600 }}
                >
                  ISBN-13
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {book.isbn13}
                </Typography>
              </Stack>
              {book.isbn10 && (
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: 130, fontWeight: 600 }}
                  >
                    ISBN-10
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>
                    {book.isbn10}
                  </Typography>
                </Stack>
              )}
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            {/* Pricing */}
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 130, fontWeight: 600 }}
                >
                  Cover Price
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '1.1rem' }}>
                  {book.coverPrice != null ? `$${Number(book.coverPrice).toFixed(2)}` : '—'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 130, fontWeight: 600 }}
                >
                  Print Cost
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 400, fontSize: '1.1rem' }}>
                  {book.printCost != null ? `$${Number(book.printCost).toFixed(2)}` : '—'}
                </Typography>
              </Stack>
            </Stack>
          </Grid>

          {/* RIGHT: Royalty rates panel */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Typography
                variant="overline"
                sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}
              >
                Royalty Rates
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    Distributor
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}
                  >
                    {formatRoyaltyRate(book.distributorAuthorRoyaltyRate)}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    Handsold
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: 'secondary.main', lineHeight: 1.2 }}
                  >
                    {formatRoyaltyRate(book.handsoldAuthorRoyaltyRate)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Financial summary */}
        <Box sx={{ mb: 4 }}>
          <FinancialSummary
            summary={{
              revenue: book.revenue,
              unpaidRoyalty: book.unpaidRoyalty,
              paidRoyalty: book.paidRoyalty,
              totalRoyalty: book.totalRoyalty,
              totalSalesToDate: book.totalSalesToDate,
            }}
          />
        </Box>

        {/* Sales list */}
        <BookSalesList
          bookId={book.id}
          sales={sales}
          reloadSales={reloadSales}
          onChange={() => void reloadSales()}
        />
      </Box>
    );
  }, [
    isLoading,
    error,
    book,
    handleBack,
    handleBookEdit,
    handleBookDelete,
    sales,
    reloadSales,
    navigate,
  ]);

  const truncate = React.useCallback((value: string | undefined, maxLength = 30) => {
    if (!value) return value;
    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
  }, []);

  const breadcrumbTitle = truncate(book?.title, 30) ?? 'Book';

  if (isLoading) return <FullPageLoader />;

  return (
    <PageContainer
      title={book?.title}
      breadcrumbs={[
        { title: backPath === '/author-payments' ? 'Author Payments' : 'Books', path: backPath },
        { title: breadcrumbTitle },
      ]}
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>{renderShow}</Box>
    </PageContainer>
  );
}
