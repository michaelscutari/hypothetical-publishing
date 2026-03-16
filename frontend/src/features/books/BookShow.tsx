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
import FullPageLoader from '@/components/FullPageLoader';
import { getErrorMessage } from '@/utils/error';
import { formatCurrency, formatMonthYear, formatPercent, truncate } from '@/utils/formatting';
import BookSalesTable from './BookSalesTable';
import FinancialSummary from './FinancialSummary';
import { BooksService, type BookDetailResponse } from '@/api';
import { useDialogs } from '@/hooks/useDialogs/useDialogs';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import PageContainer from '@/components/PageContainer';

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
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<EditIcon />} onClick={handleBookEdit}>
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleBookDelete}
          >
            Delete
          </Button>
        </Stack>
      </Stack>
      <Divider sx={{ my: 3 }} />
      <Grid container spacing={2} sx={{ width: '100%' }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Title</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {book.title}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Author</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <Box
                component="a"
                href={`/authors/${book.authorId}`}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  navigate(`/authors/${book.authorId}`);
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
                {book.author}
              </Box>
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">ISBN-13</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {book.isbn13}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">ISBN-10</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {book.isbn10 ?? '—'}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Publication Date</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {formatMonthYear(book.publicationMonth, book.publicationYear)}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Distributor Royalty Rate</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {formatPercent(book.distributorAuthorRoyaltyRate)}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Handsold Royalty Rate</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {formatPercent(book.handsoldAuthorRoyaltyRate)}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Series</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {book.seriesName
                ? `${book.seriesName}${book.seriesPosition ? ` (${book.seriesPosition})` : ''}`
                : '—'}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Cover Price</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {formatCurrency(Number(book.coverPrice))}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Print Cost</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {formatCurrency(Number(book.printCost))}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Cover Image</Typography>
            {book.hasCover ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1 }}>
                <Box
                  component="img"
                  src={`/api/books/${book.id}/cover/thumbnail`}
                  alt={`${book.title} cover`}
                  sx={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain' }}
                />
              </Box>
            ) : (
              <Typography variant="body1" sx={{ mb: 1 }}>
                —
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FinancialSummary
            summary={{
              revenue: book.revenue,
              unpaidRoyalty: book.unpaidRoyalty,
              paidRoyalty: book.paidRoyalty,
              totalRoyalty: book.totalRoyalty,
              totalSalesToDate: book.totalSalesToDate,
            }}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <BookSalesTable bookId={book.id} onChange={loadData} />
      </Box>
    </PageContainer>
  );
}
