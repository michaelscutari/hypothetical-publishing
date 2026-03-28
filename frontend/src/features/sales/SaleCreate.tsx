import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BooksService, SaleRequest, SalesService, type BookResponse } from '@/api';
import { getErrorMessage } from '@/utils/error';
import { computePublisherRevenue, computeSaleRoyalty } from '@/utils/royalty';
import { useDebounce } from '@/hooks/useDebounce';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import PageContainer from '@/components/PageContainer';
import SaleCreateRow from './SaleCreateRow';
import { type SaleRecordInput, createEmptyRecord, validateRecord } from './saleCreateTypes';

export default function SaleCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notifications = useNotifications();
  const bookIdParam = React.useMemo(() => {
    const v = searchParams.get('bookId');
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }, [searchParams]);

  const [records, setRecords] = React.useState<SaleRecordInput[]>([createEmptyRecord({}, false)]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [books, setBooks] = React.useState<BookResponse[]>([]);
  const [bookSearchInput, setBookSearchInput] = React.useState('');
  const [isLoadingBooks, setIsLoadingBooks] = React.useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = React.useState<number | null>(null);
  const [commentDialogValue, setCommentDialogValue] = React.useState('');

  const [debouncedBookSearch] = useDebounce(bookSearchInput, 300);

  // Prefill first row with book when opened from Book Detail (?bookId=...)
  React.useEffect(() => {
    if (!bookIdParam) return;
    let mounted = true;
    void (async () => {
      try {
        const book = await BooksService.getBookById(bookIdParam);
        if (!mounted) return;

        setBooks((prev) => (prev.some((b) => b.id === book.id) ? prev : [book, ...prev]));
        setRecords((prev) => {
          const next = [...prev];
          next[0] = { ...next[0], book, isPlaceholder: false };
          return next;
        });
      } catch {
        if (!mounted) return;
        setRecords((prev) => {
          const next = [...prev];
          next[0] = { ...next[0], isPlaceholder: false };
          return next;
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [bookIdParam]);

  const activateRow = React.useCallback((index: number) => {
    setRecords((prev) => {
      const next = [...prev];
      if (!next[index] || !next[index].isPlaceholder) return prev;
      next[index] = { ...next[index], isPlaceholder: false };
      if (index === next.length - 1) {
        next.push(createEmptyRecord({
          saleDate: next[index].saleDate,
          saleSource: next[index].saleSource,
          distributor: next[index].distributor,
          format: next[index].format,
          saleCurrency: next[index].saleCurrency,
        }, true));
      }
      return next;
    });
  }, []);

  const loadBooks = React.useCallback(async (searchQuery: string) => {
    setIsLoadingBooks(true);
    try {
      const response = await BooksService.getAllBooks(
        undefined,
        0,
        100,
        false,
        searchQuery || undefined,
      );
      setBooks(response.content ?? []);
    } catch {
      // Silent — autocomplete will show empty list
    } finally {
      setIsLoadingBooks(false);
    }
  }, []);

  React.useEffect(() => {
    void loadBooks(debouncedBookSearch);
  }, [debouncedBookSearch, loadBooks]);

  const updateRecord = React.useCallback((index: number, updates: Partial<SaleRecordInput>) => {
    setRecords((prev) => {
      const newRecords = [...prev];
      const next = { ...newRecords[index], ...updates };

      if (next.isPlaceholder) {
        const keys = Object.keys(updates).filter((k) => k !== 'errors' && k !== 'dateError');
        if (keys.length > 0) next.isPlaceholder = false;
      }

      const revenueChanged = updates.publisherRevenue !== undefined;
      const bookChanged = updates.book !== undefined;
      const saleSourceChanged = updates.saleSource !== undefined;
      const quantityChanged = updates.quantitySold !== undefined;
      const formatChanged = updates.format !== undefined;

      if (revenueChanged || bookChanged || saleSourceChanged || quantityChanged || formatChanged) {
        const isNextDistributor = next.saleSource === SaleRequest.saleSource.DISTRIBUTOR;

        let computedRevenue: number | null;
        if (isNextDistributor) {
          computedRevenue = next.publisherRevenue;
        } else if (next.book && next.quantitySold != null) {
          computedRevenue = computePublisherRevenue(
            next.saleSource,
            Number(next.book.coverPrice),
            Number(next.book.printCost),
            next.quantitySold,
            next.publisherRevenue,
          );
        } else {
          computedRevenue = null;
        }

        next.publisherRevenue = computedRevenue;
        next.authorRoyalty = next.book
          ? computeSaleRoyalty(
              computedRevenue,
              next.saleSource,
              next.book.handsoldAuthorRoyaltyRate,
              next.book.distributorAuthorRoyaltyRate,
            )
          : null;
      }

      newRecords[index] = next;

      if (index === newRecords.length - 1 && !next.isPlaceholder) {
        const hasGhostAlready = prev.length > index + 1 && prev[index + 1]?.isPlaceholder;
        if (!hasGhostAlready) {
          newRecords.push(createEmptyRecord({
            saleDate: next.saleDate,
            saleSource: next.saleSource,
            distributor: next.distributor,
            format: next.format,
            saleCurrency: next.saleCurrency,
          }, true));
        }
      }

      return newRecords;
    });
  }, []);

  const handleOpenCommentDialog = React.useCallback(
    (index: number) => {
      activateRow(index);
      setCommentDialogValue(records[index].comment || '');
      setCommentDialogOpen(index);
    },
    [records, activateRow],
  );

  const handleCloseCommentDialog = React.useCallback(() => {
    setCommentDialogOpen(null);
    setCommentDialogValue('');
  }, []);

  const handleSaveComment = React.useCallback(() => {
    if (commentDialogOpen !== null) {
      updateRecord(commentDialogOpen, { comment: commentDialogValue, errors: {} });
      handleCloseCommentDialog();
    }
  }, [commentDialogOpen, commentDialogValue, updateRecord, handleCloseCommentDialog]);

  const handleDeleteRecord = React.useCallback((index: number) => {
    setRecords((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      if (filtered.length === 0) return [createEmptyRecord({}, false)];
      return filtered;
    });
  }, []);

  const handleSubmit = React.useCallback(async () => {
    const filledRecords = records.filter(
      (r) => !r.isPlaceholder && (r.saleDate || r.book || r.quantitySold || r.publisherRevenue),
    );

    const allValid = filledRecords.every((record) => validateRecord(record));

    if (!allValid) {
      setValidationError('Please fix the highlighted fields before submitting.');
      setRecords([...filledRecords, ...records.filter((r) => r.isPlaceholder)]);
      return;
    }

    setValidationError(null);

    if (filledRecords.length === 0) {
      notifications.show('Please enter at least one sale record', {
        severity: 'error',
        autoHideDuration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const promises = filledRecords.map((record) => {
        const isHandsold = record.saleSource === SaleRequest.saleSource.HAND_SOLD;
        const isKU = record.format === SaleRequest.format.KINDLE_UNLIMITED;
        const resolvedRevenue = record.publisherRevenue ?? 0;
        const req = {
          bookId: record.book!.id!,
          saleSource: record.saleSource,
          distributor: isHandsold ? undefined : (record.distributor ?? undefined),
          format: record.format,
          saleMonth: record.saleDate!.month() + 1,
          saleYear: record.saleDate!.year(),
          quantitySold: isKU ? undefined : record.quantitySold!,
          kenp: isKU ? record.kenp! : undefined,
          saleCurrency: isHandsold ? SaleRequest.saleCurrency.USD : record.saleCurrency,
          originalPublisherRevenue: isHandsold ? resolvedRevenue : record.publisherRevenue!,
          publisherRevenue: isHandsold ? undefined : record.publisherRevenue!,
          hasAuthorBeenPaid: record.hasAuthorBeenPaid,
          comment: record.comment || undefined,
        };
        return SalesService.createSale(req);
      });

      await Promise.all(promises);

      notifications.show(`Successfully created ${filledRecords.length} sale record(s)`, {
        severity: 'success',
        autoHideDuration: 3000,
      });

      if (bookIdParam) {
        navigate(`/books/${bookIdParam}`);
      } else {
        navigate('/sales');
      }
    } catch (error) {
      notifications.show(`Failed to create sales records: ${getErrorMessage(error)}`, {
        severity: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [records, notifications, navigate, bookIdParam]);

  const handleBack = React.useCallback(() => {
    if (bookIdParam) {
      navigate(`/books/${bookIdParam}`);
    } else {
      navigate('/sales');
    }
  }, [navigate, bookIdParam]);

  const breadcrumbs = React.useMemo(() => {
    if (bookIdParam) {
      return [
        { title: 'Books', path: '/books' },
        { title: 'Book Detail', path: `/books/${bookIdParam}` },
        { title: 'New' },
      ];
    }
    return [{ title: 'Sales Records', path: '/sales' }, { title: 'New' }];
  }, [bookIdParam]);

  return (
    <PageContainer title="New Sales Records" breadcrumbs={breadcrumbs} maxWidth={false}>
      <Stack spacing={3} sx={{ width: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          Use Tab to navigate between fields.
        </Typography>

        <TableContainer component={Paper}>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ '& th': { whiteSpace: 'nowrap', fontSize: '0.8rem' } }}>
                <TableCell>Book</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Distributor</TableCell>
                <TableCell>Format</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Qty / KENP</TableCell>
                <TableCell>Revenue</TableCell>
                <TableCell>Royalty</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {records.map((record, index) => (
                <SaleCreateRow
                  key={record.id}
                  record={record}
                  index={index}
                  books={books}
                  isLoadingBooks={isLoadingBooks}
                  bookSearchInput={bookSearchInput}
                  totalRecords={records.length}
                  onActivateRow={activateRow}
                  onUpdateRecord={updateRecord}
                  onBookSearchInputChange={setBookSearchInput}
                  onLoadBooks={loadBooks}
                  onOpenCommentDialog={handleOpenCommentDialog}
                  onDeleteRecord={handleDeleteRecord}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {validationError && (
          <Alert severity="error" onClose={() => setValidationError(null)}>
            {validationError}
          </Alert>
        )}

        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={records.filter((r) => !r.isPlaceholder && r.book).length === 0}
            loading={isSubmitting}
            size="large"
          >
            {`Create ${records.filter((r) => !r.isPlaceholder && r.book).length} Record(s)`}
          </Button>
        </Stack>

        <Dialog
          open={commentDialogOpen !== null}
          onClose={handleCloseCommentDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Comment</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              multiline
              rows={4}
              value={commentDialogValue}
              onChange={(e) => setCommentDialogValue(e.target.value)}
              placeholder="Enter comment (optional)"
              inputProps={{ maxLength: 256 }}
              fullWidth
              helperText={`${commentDialogValue.length}/256 characters`}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCommentDialog}>Cancel</Button>
            <Button onClick={handleSaveComment} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </PageContainer>
  );
}
