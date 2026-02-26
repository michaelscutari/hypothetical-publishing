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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AuthorsService,
  BooksService,
  type AuthorResponse,
  type BookDetailResponse,
} from '../../../../api';
import FullPageLoader from '../../../../components/FullPageLoader';
import { useDialogs } from '../hooks/useDialogs/useDialogs';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';
export default function AuthorShow() {
  const { authorId } = useParams<{ authorId?: string }>();
  const navigate = useNavigate();
  const dialogs = useDialogs();
  const notifications = useNotifications();
  const [author, setAuthor] = React.useState<AuthorResponse | null>(null);
  const [books, setBooks] = React.useState<BookDetailResponse[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const authorData = await AuthorsService.getAuthorById(Number(authorId));
      setAuthor(authorData);
      const booksResponse = await BooksService.getAllBooks(0, 1000, true, undefined, authorData.id);
      const bookList = booksResponse.content ?? [];
      const bookDetails = await Promise.all(bookList.map((b) => BooksService.getBookById(b.id!)));
      setBooks(bookDetails);
    } catch (loadError) {
      setError(loadError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [authorId]);
  React.useEffect(() => {
    void loadData();
  }, [loadData]);
  const handleEdit = React.useCallback(() => {
    navigate(`/authors/${authorId}/edit`);
  }, [navigate, authorId]);
  const handleDelete = React.useCallback(async () => {
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
        notifications.show(`Failed to delete author. Reason: ${(deleteError as Error).message}`, {
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
  const formatCurrency = (value?: number) =>
    value != null ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '$0.00';
  if (isLoading) {
    return <FullPageLoader />;
  }
  const renderShow = () => {
    if (error) {
      return (
        <Box sx={{ flexGrow: 1 }}>
          <Alert severity="error">{error.message}</Alert>
        </Box>
      );
    }
    if (!author) return null;
    return (
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back
          </Button>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit}>
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
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
                      <TableCell>ISBN-13</TableCell>
                      <TableCell align="right">Total Sales</TableCell>
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
                        onClick={() => navigate(`/books/${book.id}`)}
                      >
                        <TableCell>{book.title}</TableCell>
                        <TableCell>{book.isbn13}</TableCell>
                        <TableCell align="right">{book.totalSalesToDate ?? 0}</TableCell>
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
      </Box>
    );
  };
  const truncate = (value: string | undefined, maxLength = 30) =>
    value && value.length > maxLength ? `${value.slice(0, maxLength)}…` : (value ?? '');
  return (
    <PageContainer
      title={author?.name}
      breadcrumbs={[
        { title: 'Authors', path: '/authors' },
        { title: truncate(author?.name) || 'Author' },
      ]}
    >
      <Box sx={{ display: 'flex', flex: 1, width: '100%' }}>{renderShow()}</Box>
    </PageContainer>
  );
}
