import { BooksService, type BookDetailResponse } from '@/api';
import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';
import { useDialogs } from '@/hooks/useDialogs/useDialogs';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import { getErrorMessage } from '@/utils/error';
import { formatCurrency, formatMonthYear, formatPercent, truncate } from '@/utils/formatting';
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
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import BookSalesTable from './BookSalesTable';
import FinancialSummary from './FinancialSummary';

export default function BookShow() {
  const { bookId } = useParams<{ bookId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const backPath = (location.state as { from?: string } | null)?.from ?? '/books';

  const dialogs = useDialogs();
  const notifications = useNotifications();

  const [book, setBook] = React.useState<BookDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const bookData = await BooksService.getBookById(Number(bookId));
      setBook(bookData);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleBookEdit = React.useCallback(() => {
    navigate(`/books/${bookId}/edit`);
  }, [navigate, bookId]);

  const handleBookDelete = React.useCallback(async () => {
    if (!book) {
      return;
    }

    const confirmed = await dialogs.confirm(
      `Do you wish to delete ${book.title} by ${book.author}? By doing so, you will also be deleting ${book.totalSalesToDate} sales.`,
      {
        title: `Delete book?`,
        severity: 'error',
        okText: 'Delete',
        cancelText: 'Cancel',
      },
    );

    if (confirmed) {
      setIsLoading(true);
      try {
        await BooksService.deleteBook(Number(bookId));
        navigate('/books');
        notifications.show('Book deleted successfully.', {
          severity: 'success',
          autoHideDuration: 3000,
        });
      } catch (deleteError) {
        notifications.show(`Failed to delete book. Reason: ${getErrorMessage(deleteError)}`, {
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

  const breadcrumbTitle = book ? truncate(book.title, 30) : 'Book';

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <PageContainer
        title="Error"
        breadcrumbs={[
          { title: backPath === '/author-payments' ? 'Author Payments' : 'Books', path: backPath },
          { title: 'Error' },
        ]}
      >
        <Alert severity="error">{error}</Alert>
      </PageContainer>
    );
  }

  if (!book) return null;

  return (
    <PageContainer
      title={book.title}
      breadcrumbs={[
        { title: backPath === '/author-payments' ? 'Author Payments' : 'Books', path: backPath },
        { title: breadcrumbTitle },
      ]}
    >
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
          <Button variant="outlined" startIcon={<EditIcon />} onClick={handleBookEdit} size="small">
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
          {book.seriesName && (
            <Chip
              label={`${book.seriesName}${book.seriesPosition ? ` · Book ${book.seriesPosition}` : ''}`}
              size="small"
              variant="outlined"
              sx={{ mb: 1.5, fontWeight: 500, borderColor: 'divider', color: 'text.secondary' }}
            />
          )}

          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 1 }}>
            {book.title}
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 400, mb: 2.5, color: 'text.secondary' }}>
            by{' '}
            <Box
              component={Link}
              to={`/authors/${book.authorId}`}
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {book.author}
            </Box>
          </Typography>

          <Divider sx={{ mb: 2.5 }} />

          {/* Pricing */}
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ minWidth: 160, fontWeight: 600 }}
              >
                Cover Price
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 400, color: 'text.primary' }}>
                {formatCurrency(Number(book.coverPrice))}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ minWidth: 160, fontWeight: 600 }}
              >
                Print Cost
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                {formatCurrency(Number(book.printCost))}
              </Typography>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2.5 }} />

          {/* Publication + ISBNs */}
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 160, fontWeight: 600 }}
              >
                Publication Date
              </Typography>
              <Typography variant="body1">
                {formatMonthYear(book.publicationMonth, book.publicationYear)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 160, fontWeight: 600 }}
              >
                ISBN-13
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {book.isbn13}
              </Typography>
            </Stack>
            {book.isbn10 && (
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 160, fontWeight: 600 }}
                >
                  ISBN-10
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {book.isbn10}
                </Typography>
              </Stack>
            )}
            {book.amazonEbookAsin && (
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 160, fontWeight: 600 }}
                >
                  Amazon ASIN
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {book.amazonEbookAsin}
                </Typography>
              </Stack>
            )}
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
                  {formatPercent(book.distributorAuthorRoyaltyRate)}
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
                  {formatPercent(book.handsoldAuthorRoyaltyRate)}
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

      <Box sx={{ mt: 3 }}>
        <BookSalesTable bookId={book.id} onChange={loadData} />
      </Box>
    </PageContainer>
  );
}
