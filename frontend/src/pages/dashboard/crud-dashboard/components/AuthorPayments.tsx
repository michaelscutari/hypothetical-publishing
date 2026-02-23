import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PaymentIcon from '@mui/icons-material/Payments';
import PendingIcon from '@mui/icons-material/Pending';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from './PageContainer';

import {
  BooksService,
  SalesService,
  type AuthorPaymentGroupResponse,
  type AuthorPaymentSaleResponse,
  type AuthorResponse,
  type MarkAllPaidRequest,
  type MarkAllPaidResponse,
  type PagedResponseAuthorPaymentGroupResponse,
} from '../../../../api';
import useNotifications from '../hooks/useNotifications/useNotifications';
import { MONTH_NAMES_SHORT as MONTH_NAMES } from '../../../../constants/months';
const INITIAL_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
function formatCurrency(n?: number) {
  if (n == null) return '';
  return currencyFormatter.format(n);
}
function formatMonthYear(s: AuthorPaymentSaleResponse) {
  if (s.saleYear && s.saleMonth) return `${MONTH_NAMES[(s.saleMonth ?? 1) - 1]} ${s.saleYear}`;
  return '';
}

function unwrap<T>(r: unknown): T {
  if (r && typeof r === 'object') {
    const rec = r as Record<string, unknown>;
    if ('data' in rec) {
      return rec.data as T;
    }
  }
  return r as T;
}

export default function AuthorPaymentsView() {
  const navigate = useNavigate();
  const notifications = useNotifications();

  const [showAll, setShowAll] = React.useState<boolean>(false);
  const [page, setPage] = React.useState<number>(0);
  const [pageSize, setPageSize] = React.useState<number>(INITIAL_PAGE_SIZE);

  const [groups, setGroups] = React.useState<AuthorPaymentGroupResponse[]>([]);
  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [totalElements, setTotalElements] = React.useState<number>(0);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);

  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = React.useState<string>('');
  const debounceRef = React.useRef<number | null>(null);

  const [authorOptions, setAuthorOptions] = React.useState<AuthorResponse[]>([]);
  const authorDebounceRef = React.useRef<number | null>(null);

  const [confirmingGroup, setConfirmingGroup] = React.useState<AuthorPaymentGroupResponse | null>(
    null,
  );
  const [confirmingUnpaidCount, setConfirmingUnpaidCount] = React.useState<number>(0);
  const [confirmingUnpaidTotal, setConfirmingUnpaidTotal] = React.useState<number>(0);
  const [processing, setProcessing] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

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
      const maybeResponse = await SalesService.getAuthorPayments(
        showAll ? 0 : page,
        sizeToUse,
        showAll,
        undefined,
        undefined,
        debouncedQuery || undefined,
      );
      const response = unwrap<PagedResponseAuthorPaymentGroupResponse>(maybeResponse);

      const normalized: AuthorPaymentGroupResponse[] = (response.content ?? []).map((g) => {
        const sales = (g.sales ?? []).slice().sort((a, b) => {
          const yearDiff = (b.saleYear ?? 0) - (a.saleYear ?? 0);
          if (yearDiff !== 0) return yearDiff;
          return (b.saleMonth ?? 0) - (a.saleMonth ?? 0);
        });
        const unpaidTotal = sales.reduce(
          (sum, s) => sum + (s.hasAuthorBeenPaid ? 0 : (s.authorRoyalty ?? 0)),
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

  const handleShowAllToggle = React.useCallback(() => {
    setShowAll((prev) => !prev);
    setPage(0);
  }, []);

  const handlePageSizeChange = React.useCallback((v: number) => {
    setPageSize(v);
    setPage(0);
  }, []);

  const handleCreateClick = React.useCallback(() => {
    navigate('/sales/new');
  }, [navigate]);

  function beginPayAuthor(group: AuthorPaymentGroupResponse) {
    const unpaidCount = (group.sales ?? []).filter((s) => !s.hasAuthorBeenPaid).length;
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
  }

  async function confirmPayAuthor() {
    if (!confirmingGroup?.authorId) return;
    setProcessing(true);

    const authorName = confirmingGroup.author ?? 'this author';

    try {
      const req: MarkAllPaidRequest = { authorId: confirmingGroup.authorId };
      const maybeResp = await SalesService.markAuthorPaymentsPaid(req);
      const resp = unwrap<MarkAllPaidResponse>(maybeResp);
      const updatedCount = resp?.updatedCount ?? 0;
      notifications.show(`Marked ${updatedCount} record(s) for ${authorName} as paid.`, {
        severity: 'success',
        autoHideDuration: 3000,
      });

      await loadGroups();
    } catch (e) {
      notifications.show(`Failed to mark paid: ${(e as Error).message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
    } finally {
      setProcessing(false);
      setConfirmingGroup(null);
      setConfirmingUnpaidCount(0);
      setConfirmingUnpaidTotal(0);
    }
  }

  const handleSearchEnter = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        setDebouncedQuery(searchQuery.trim());
      }
    },
    [searchQuery],
  );

  const effectiveGroups = groups;

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
          <Tooltip
            title={showAll ? 'Switch to paginated view' : 'Show all records'}
            placement="bottom"
            enterDelay={1000}
          >
            <div>
              <ToggleButton
                value="showAll"
                selected={showAll}
                onChange={handleShowAllToggle}
                size="small"
              >
                <ViewListIcon sx={{ mr: 0.5 }} />
                Show All
              </ToggleButton>
            </div>
          </Tooltip>

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

              if (debounceRef.current) window.clearTimeout(debounceRef.current);
              setDebouncedQuery((q ?? '').trim());
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
        ) : effectiveGroups.length === 0 ? (
          <Alert severity="info">No author payment groups found.</Alert>
        ) : (
          <Box>
            {effectiveGroups.map((group, idx) => {
              const unpaidTotal = group.unpaidTotal ?? 0;
              return (
                <Accordion
                  key={`${group.author ?? 'author'}-${idx}`}
                  defaultExpanded={false}
                  sx={{ mb: 1 }}
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
                                beginPayAuthor(group);
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
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Book Title</TableCell>
                            <TableCell>Month/Year</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell align="right">Author Royalty</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {(group.sales ?? []).map((s) => (
                            <TableRow key={s.id} hover>
                              <TableCell>
                                <Typography
                                  variant="body1"
                                  sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                                  onClick={() => navigate(`/books/${s.bookId}`)}
                                >
                                  {s.bookTitle ?? `Book ${s.bookId}`}
                                </Typography>
                              </TableCell>

                              <TableCell>{formatMonthYear(s)}</TableCell>

                              <TableCell align="right">{s.quantitySold ?? '-'}</TableCell>

                              <TableCell align="right">{formatCurrency(s.authorRoyalty)}</TableCell>

                              <TableCell>
                                <Chip
                                  icon={s.hasAuthorBeenPaid ? <CheckCircleIcon /> : <PendingIcon />}
                                  label={s.hasAuthorBeenPaid ? 'Paid' : 'Unpaid'}
                                  color={s.hasAuthorBeenPaid ? 'success' : 'warning'}
                                  size="small"
                                  variant={s.hasAuthorBeenPaid ? 'filled' : 'outlined'}
                                />
                              </TableCell>

                              <TableCell>
                                <Button size="small" onClick={() => navigate(`/sales/${s.id}`)}>
                                  Details
                                </Button>
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

            {!showAll && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
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
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Dialog
        open={Boolean(confirmingGroup)}
        onClose={() => !processing && setConfirmingGroup(null)}
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
          <Button onClick={() => setConfirmingGroup(null)} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmPayAuthor}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={18} /> : <PaymentIcon />}
          >
            {processing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
