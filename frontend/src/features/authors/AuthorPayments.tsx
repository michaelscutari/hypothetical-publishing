import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PaymentIcon from '@mui/icons-material/Payments';
import PendingIcon from '@mui/icons-material/Pending';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PaidStatusChip from '@/components/PaidStatusChip';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';

import {
  BooksService,
  SalesService,
  type AuthorPaymentGroupResponse,
  type MarkAllPaidRequest,
  type AuthorResponse,
} from '@/api';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, formatMonthYear } from '@/utils/formatting';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
const INITIAL_PAGE_SIZE = 10;
const SHOW_ALL_SIZE = -1;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function AuthorPayments() {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const [page, setPage] = React.useState<number>(0);
  const [pageSize, setPageSize] = React.useState<number>(INITIAL_PAGE_SIZE);

  const showAll = pageSize === SHOW_ALL_SIZE;

  const [groups, setGroups] = React.useState<AuthorPaymentGroupResponse[]>([]);
  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [totalElements, setTotalElements] = React.useState<number>(0);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);

  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [debouncedQuery, flush] = useDebounce(searchQuery, 300);

  const [authorOptions, setAuthorOptions] = React.useState<AuthorResponse[]>([]);
  const authorDebounceRef = React.useRef<number | null>(null);

  const [confirmingGroup, setConfirmingGroup] = React.useState<AuthorPaymentGroupResponse | null>(
    null,
  );
  const [confirmingUnpaidCount, setConfirmingUnpaidCount] = React.useState<number>(0);
  const [confirmingUnpaidTotal, setConfirmingUnpaidTotal] = React.useState<number>(0);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);

  React.useEffect(() => {
    setPage(0);
  }, [debouncedQuery]);

  React.useEffect(() => {
    if (authorDebounceRef.current) window.clearTimeout(authorDebounceRef.current);

    const q = (searchQuery ?? '').trim();

    authorDebounceRef.current = window.setTimeout(async () => {
      try {
        const response = await BooksService.searchAuthors(q || undefined, 0, 25, true);
        setAuthorOptions(response.content ?? []);
      } catch {
        setAuthorOptions([]);
      }
    }, 250);

    return () => {
      if (authorDebounceRef.current) window.clearTimeout(authorDebounceRef.current);
    };
  }, [searchQuery]);

  // fetch grouped author payments from backend
  const loadGroups = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const sizeToUse = showAll ? 1000 : pageSize;
      // getAuthorPayments(page, size, showAll, startDate?, endDate?, query?)
      const response = await SalesService.getAuthorPayments(
        showAll ? 0 : page,
        sizeToUse,
        showAll,
        undefined,
        undefined,
        debouncedQuery || undefined,
      );

      const normalized: AuthorPaymentGroupResponse[] = (response.content ?? []).map((g) => {
        const sales = (g.sales ?? []).slice().sort((a, b) => {
          const yearDiff = (b.saleYear ?? 0) - (a.saleYear ?? 0);
          if (yearDiff !== 0) return yearDiff;
          return (b.saleMonth ?? 0) - (a.saleMonth ?? 0);
        });
        const unpaidTotal = sales.reduce(
          (sum, sale) => sum + (sale.hasAuthorBeenPaid ? 0 : (sale.authorRoyalty ?? 0)),
          0,
        );
        return { ...g, sales, unpaidTotal };
      });

      setGroups(normalized);
      setTotalPages(response.totalPages ?? 0);
      setTotalElements(response.totalElements ?? 0);
    } catch (loadError) {
      setError(loadError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, showAll, debouncedQuery]);

  React.useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const handleRefresh = React.useCallback(() => {
    if (!isLoading) void loadGroups();
  }, [isLoading, loadGroups]);

  const handlePageSizeChange = React.useCallback((v: number) => {
    setPageSize(v);
    setPage(0);
  }, []);

  const handleCreateClick = React.useCallback(() => {
    navigate('/sales/new');
  }, [navigate]);

  const handleBeginPayAuthor = React.useCallback(
    (group: AuthorPaymentGroupResponse) => {
      const unpaidCount = (group.sales ?? []).filter((sale) => !sale.hasAuthorBeenPaid).length;
      if (unpaidCount === 0) {
        notifications.show('No unpaid records for this author', {
          severity: 'error',
          autoHideDuration: 3000,
        });
        return;
      }
      setConfirmingGroup(group);
      setConfirmingUnpaidCount(unpaidCount);
      setConfirmingUnpaidTotal(group.unpaidTotal ?? 0);
    },
    [notifications],
  );

  const handleConfirmPayAuthor = React.useCallback(async () => {
    if (!confirmingGroup?.authorId) return;
    setIsProcessing(true);

    try {
      const req: MarkAllPaidRequest = { authorId: confirmingGroup.authorId };
      const resp = await SalesService.markAuthorPaymentsPaid(req);
      const updatedCount = resp?.updatedCount ?? 0;
      notifications.show(
        `Marked ${updatedCount} record(s) for ${confirmingGroup.author} as paid.`,
        {
          severity: 'success',
          autoHideDuration: 3000,
        },
      );

      await loadGroups();
    } catch (paymentError) {
      notifications.show(`Failed to mark paid: ${(paymentError as Error).message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
    } finally {
      setIsProcessing(false);
      setConfirmingGroup(null);
      setConfirmingUnpaidCount(0);
      setConfirmingUnpaidTotal(0);
    }
  }, [confirmingGroup, loadGroups, notifications]);

  const handleSearchEnter = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        flush();
      }
    },
    [flush],
  );

  const computedTotalPages = React.useMemo(() => {
    if ((totalPages ?? 0) > 0) return Math.max(1, totalPages);
    if (showAll) return 1;
    return Math.max(1, Math.ceil((totalElements ?? 0) / pageSize));
  }, [totalPages, totalElements, pageSize, showAll]);

  const pageTitle = 'Author Payments';

  return (
    <PageContainer
      title={pageTitle}
      breadcrumbs={[{ title: pageTitle }]}
      actions={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="Reload data" placement="bottom" enterDelay={1000}>
            <div>
              <IconButton size="small" aria-label="refresh" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </div>
          </Tooltip>

          <Autocomplete
            freeSolo
            options={authorOptions.map((a) => a.name ?? '')}
            inputValue={searchQuery}
            onInputChange={(_e, v) => setSearchQuery(typeof v === 'string' ? v : '')}
            onChange={(_e, v) => {
              const q = typeof v === 'string' ? v : (v ?? '');
              setSearchQuery(q);
              flush(q);
            }}
            sx={{ minWidth: 280 }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Search author or book title..."
                onKeyDown={handleSearchEnter}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Button variant="contained" onClick={handleCreateClick} startIcon={<AddIcon />}>
            New Sale
          </Button>
        </Stack>
      }
    >
      <Box sx={{ flex: 1, width: '100%' }}>
        {error ? (
          <Box sx={{ flexGrow: 1 }}>
            <Alert severity="error">{error.message}</Alert>
          </Box>
        ) : isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : groups.length === 0 ? (
          <Alert severity="info">No author payment groups found.</Alert>
        ) : (
          <Box>
            {groups.map((group, idx) => {
              const unpaidTotal = group.unpaidTotal ?? 0;
              return (
                <Accordion
                  key={`${group.author ?? 'author'}-${idx}`}
                  defaultExpanded={false}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
                    '&:before': { display: 'none' },
                    '&:first-of-type': { borderRadius: 2 },
                    '&:last-of-type': { borderRadius: 2 },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ width: '100%' }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="h6">{group.author}</Typography>
                        <Chip
                          icon={unpaidTotal > 0 ? <PendingIcon /> : <CheckCircleIcon />}
                          label={
                            unpaidTotal > 0 ? `Unpaid: ${formatCurrency(unpaidTotal)}` : 'All Paid'
                          }
                          color={unpaidTotal > 0 ? 'warning' : 'success'}
                          size="small"
                          variant={unpaidTotal > 0 ? 'outlined' : 'filled'}
                        />
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title="Pay & mark unpaid records as paid" placement="bottom">
                          <div>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<PaymentIcon />}
                              disabled={unpaidTotal === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBeginPayAuthor(group);
                              }}
                            >
                              Pay
                            </Button>
                          </div>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </AccordionSummary>

                  <AccordionDetails>
                    <Box sx={{ width: '100%' }}>
                      <Table size="small" sx={{ '& td, & th': { borderColor: 'divider' } }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Book Title</TableCell>
                            <TableCell>Month/Year</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell align="right">Author Royalty</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {(group.sales ?? []).map((sale) => (
                            <TableRow
                              key={sale.id}
                              hover
                              sx={{ cursor: 'pointer' }}
                              onClick={() =>
                                navigate(`/sales/${sale.id}`, {
                                  state: { from: '/author-payments' },
                                })
                              }
                            >
                              <TableCell>
                                <Typography
                                  component="span"
                                  variant="body1"
                                  sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/books/${sale.bookId}`, {
                                      state: { from: '/author-payments' },
                                    });
                                  }}
                                >
                                  {sale.bookTitle ?? `Book ${sale.bookId}`}
                                </Typography>
                              </TableCell>

                              <TableCell>
                                {sale.saleYear && sale.saleMonth
                                  ? formatMonthYear(sale.saleMonth, sale.saleYear)
                                  : '—'}
                              </TableCell>

                              <TableCell align="right">{sale.quantitySold ?? '-'}</TableCell>

                              <TableCell align="right">
                                {sale.authorRoyalty != null
                                  ? formatCurrency(sale.authorRoyalty)
                                  : '—'}
                              </TableCell>

                              <TableCell>
                                <PaidStatusChip paid={sale.hasAuthorBeenPaid} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: 2,
                gap: 2,
              }}
            >
              <Pagination
                count={Math.max(1, computedTotalPages)}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                color="primary"
              />
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel id="ap-page-size-label">Page size</InputLabel>
                <Select
                  labelId="ap-page-size-label"
                  label="Page size"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  disabled={isLoading}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                  <MenuItem value={SHOW_ALL_SIZE}>All</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        )}
      </Box>

      <Dialog
        open={Boolean(confirmingGroup)}
        onClose={() => !isProcessing && setConfirmingGroup(null)}
      >
        <DialogTitle>Confirm mark paid</DialogTitle>
        <DialogContent>
          <Typography>
            You are about to mark <strong>{confirmingGroup?.author}</strong>’s{' '}
            {confirmingUnpaidCount} unpaid sale record(s) as paid. Total:{' '}
            <strong>{formatCurrency(confirmingUnpaidTotal)}</strong>.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmingGroup(null)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmPayAuthor}
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={18} /> : <PaymentIcon />}
          >
            {isProcessing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
