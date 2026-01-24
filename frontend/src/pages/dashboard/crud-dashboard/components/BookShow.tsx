import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useDialogs } from '../hooks/useDialogs/useDialogs';
import useNotifications from '../hooks/useNotifications/useNotifications';
import { deleteOne as deleteBook, getOne as getBook, type Book } from '../data/books';
import PageContainer from './PageContainer';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function BookShow() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const dialogs = useDialogs();
  const notifications = useNotifications();

  const [book, setBook] = React.useState<Book | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const showData = await getBook(Number(bookId));

      setBook(showData);
    } catch (showDataError) {
      setError(showDataError as Error);
    }
    setIsLoading(false);
  }, [bookId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBookEdit = React.useCallback(() => {
    navigate(`/dashboard/books/${bookId}/edit`);
  }, [navigate, bookId]);

  const handleBookDelete = React.useCallback(async () => {
    if (!book) {
      return;
    }

    const confirmed = await dialogs.confirm(`Do you wish to delete ${book.title}?`, {
      title: `Delete book?`,
      severity: 'error',
      okText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      setIsLoading(true);
      try {
        await deleteBook(Number(bookId));

        navigate('/dashboard/books');

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
    navigate('/dashboard/books');
  }, [navigate]);

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

    return book ? (
      <Box sx={{ flexGrow: 1, width: '100%' }}>
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
                {book.author}
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
                {formatPublicationDate(book.publicationYear, book.publicationMonth)}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper sx={{ px: 2, py: 1 }}>
              <Typography variant="overline">Royalty Rate</Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {formatRoyaltyRate(book.royaltyRate)}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper sx={{ px: 2, py: 1 }}>
              <Typography variant="overline">Total Sales to Date</Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {book.totalSalesToDate ?? 0}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
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
      </Box>
    ) : null;
  }, [isLoading, error, book, handleBack, handleBookEdit, handleBookDelete]);

  const pageTitle = `Book ${bookId}`;

  return (
    <PageContainer
      title={pageTitle}
      breadcrumbs={[{ title: 'Books', path: '/dashboard/books' }, { title: pageTitle }]}
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>{renderShow}</Box>
    </PageContainer>
  );
}
