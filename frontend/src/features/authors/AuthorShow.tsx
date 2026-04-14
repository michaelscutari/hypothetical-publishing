import { getErrorMessage } from '@/utils/error';
import { formatCurrency, formatMonthYear, formatPercent, truncate } from '@/utils/formatting';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import * as React from 'react';

import { AuthorsService, BooksService, type AuthorResponse, type BookDetailResponse } from '@/api';
import FullPageLoader from '@/components/FullPageLoader';
import PageContainer from '@/components/PageContainer';
import { useDialogs } from '@/hooks/useDialogs/useDialogs';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import { useNavigate, useParams } from 'react-router-dom';
export default function AuthorShow() {
  const { authorId } = useParams<{ authorId?: string }>();
  const navigate = useNavigate();
  const dialogs = useDialogs();
  const notifications = useNotifications();
  const [author, setAuthor] = React.useState<AuthorResponse | null>(null);
  const [books, setBooks] = React.useState<BookDetailResponse[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const authorData = await AuthorsService.getAuthorById(Number(authorId));
      setAuthor(authorData);
      const booksResponse = await BooksService.getAllBooks(
        authorData.id,
        0,
        1000,
        true,
        undefined,
        ['seriesName', 'seriesPosition', 'title'],
        ['asc', 'asc', 'asc'],
      );
      const bookList = booksResponse.content ?? [];
      const bookDetails = await Promise.all(bookList.map((b) => BooksService.getBookById(b.id)));
      setBooks(bookDetails);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [authorId]);
  React.useEffect(() => {
    void loadData();
  }, [loadData]);
  const handleAuthorEdit = React.useCallback(() => {
    navigate(`/authors/${authorId}/edit`);
  }, [navigate, authorId]);
  const handleAuthorDelete = React.useCallback(async () => {
    if (!author) return;
    const confirmed = await dialogs.confirm(
      `Do you wish to delete ${author.name}? This will also delete all their books and sales.`,
      {
        title: 'Delete author?',
        severity: 'error',
        okText: 'Delete',
        cancelText: 'Cancel',
      },
    );
    if (confirmed) {
      setIsLoading(true);
      try {
        await AuthorsService.deleteAuthor(Number(authorId));
        navigate('/authors');
        notifications.show('Author deleted successfully.', {
          severity: 'success',
          autoHideDuration: 3000,
        });
      } catch (deleteError) {
        notifications.show(`Failed to delete author. Reason: ${getErrorMessage(deleteError)}`, {
          severity: 'error',
          autoHideDuration: 3000,
        });
      }
      setIsLoading(false);
    }
  }, [author, dialogs, authorId, navigate, notifications]);

  const handleBack = React.useCallback(() => {
    navigate('/authors');
  }, [navigate]);

  const handleGenerateReport = React.useCallback(() => {
    if (author?.id) {
      navigate(`/reports/author-royalty?authorId=${author.id}`);
    }
  }, [author?.id, navigate]);

  const handleBookRowClick = React.useCallback(
    (bookId: number, event: React.MouseEvent) => {
      if (event.button === 0 && !event.metaKey && !event.ctrlKey) {
        navigate(`/books/${bookId}`);
        return;
      }

      if (event.button === 1 || event.metaKey || event.ctrlKey) {
        window.open(`/books/${bookId}`, '_blank', 'noopener,noreferrer');
      }
    },
    [navigate],
  );

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <PageContainer
        title="Error"
        breadcrumbs={[{ title: 'Authors', path: '/authors' }, { title: 'Error' }]}
      >
        <Alert severity="error">{error}</Alert>
      </PageContainer>
    );
  }

  if (!author) return null;

  return (
    <PageContainer
      title={author.name}
      breadcrumbs={[{ title: 'Authors', path: '/authors' }, { title: truncate(author.name) }]}
    >
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<DescriptionIcon />}
            onClick={handleGenerateReport}
          >
            Generate Report
          </Button>
          <Button variant="contained" startIcon={<EditIcon />} onClick={handleAuthorEdit}>
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleAuthorDelete}
          >
            Delete
          </Button>
        </Stack>
      </Stack>
      <Divider sx={{ my: 3 }} />
      <Grid container spacing={2} sx={{ width: '100%' }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Name</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {author.name}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper sx={{ px: 2, py: 1 }}>
            <Typography variant="overline">Email</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {author.email ?? '—'}
            </Typography>
          </Paper>
        </Grid>
        {author.paypalAccount && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper sx={{ px: 2, py: 1 }}>
              <Typography variant="overline">PayPal</Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {author.paypalAccount}
              </Typography>
            </Paper>
          </Grid>
        )}
        {author.venmoAccount && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper sx={{ px: 2, py: 1 }}>
              <Typography variant="overline">Venmo</Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {author.venmoAccount}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Books
          </Typography>
          {books.length === 0 ? (
            <Alert severity="info">No books found for this author.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Series</TableCell>
                    <TableCell>Publication</TableCell>
                    <TableCell align="right">Distributor Royalty</TableCell>
                    <TableCell align="right">Handsold Royalty</TableCell>
                    <TableCell align="right">Total Royalty</TableCell>
                    <TableCell align="right">Paid Royalty</TableCell>
                    <TableCell align="right">Unpaid Royalty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {books.map((book) => (
                    <TableRow
                      key={book.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={(event) => handleBookRowClick(book.id, event)}
                      onAuxClick={(event) => handleBookRowClick(book.id, event)}
                    >
                      <TableCell>{book.title}</TableCell>
                      <TableCell>
                        {book.seriesName
                          ? `${book.seriesName}${book.seriesPosition ? ` (#${book.seriesPosition})` : ''}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {formatMonthYear(book.publicationMonth, book.publicationYear)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercent(Number(book.distributorAuthorRoyaltyRate))}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercent(Number(book.handsoldAuthorRoyaltyRate))}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(book.totalRoyalty)}</TableCell>
                      <TableCell align="right">{formatCurrency(book.paidRoyalty)}</TableCell>
                      <TableCell align="right">{formatCurrency(book.unpaidRoyalty)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </PageContainer>
  );
}
