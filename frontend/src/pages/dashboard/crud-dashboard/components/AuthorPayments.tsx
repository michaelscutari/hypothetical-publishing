import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PaymentIcon from '@mui/icons-material/Payments';
import PendingIcon from '@mui/icons-material/Pending';
import RefreshIcon from '@mui/icons-material/Refresh';
import ViewListIcon from '@mui/icons-material/ViewList';
import SearchIcon from '@mui/icons-material/Search';
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
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageContainer from './PageContainer';

import {
  SalesService,
  BooksService,
  type PagedResponseAuthorPaymentGroupResponse,
  type AuthorPaymentGroupResponse,
  type AuthorPaymentSaleResponse,
  type MarkAllPaidRequest,
  type MarkAllPaidResponse,
  type PagedResponseString,
} from '../../../../api';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const INITIAL_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const ALL_SENTINEL = -1;

function formatCurrency(n?: number) {
  if (n == null) return '';
  return `$${Number(n).toFixed(2)}`;
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

function isPagedResponseString(x: unknown): x is PagedResponseString {
  if (!x || typeof x !== 'object') return false;
  const rec = x as Record<string, unknown>;
  return Array.isArray(rec.content) || Array.isArray(x);
}

export default function AuthorPaymentsView() {
  const navigate = useNavigate();

  const [showAll, setShowAll] = React.useState(false);
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

  const [authorInputValue, setAuthorInputValue] = React.useState<string>('');
  const [authorOptions, setAuthorOptions] = React.useState<string[]>([]);
  const authorDebounceRef = React.useRef<number | null>(null);

  const [confirmingAuthor, setConfirmingAuthor] = React.useState<string | null>(null);
  const [confirmingUnpaidCount, setConfirmingUnpaidCount] = React.useState<number>(0);
  const [confirmingUnpaidTotal, setConfirmingUnpaidTotal] = React.useState<number>(0);
  const [processing, setProcessing] = React.useState<boolean>(false);

  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity?: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [clientFilteredGroups, setClientFilteredGroups] = React.useState<
    AuthorPaymentGroupResponse[]
  >([]);

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
    if (!authorInputValue || authorInputValue.trim().length < 2) {
      setAuthorOptions([]);
      return;
    }

    authorDebounceRef.current = window.setTimeout(async () => {
      try {
        const maybe = await BooksService.searchAuthors(authorInputValue, 0, 25, true);
        const payload = unwrap<unknown>(maybe);

        if (isPagedResponseString(payload)) {
          const suggestions = payload.content ?? [];
          setAuthorOptions(Array.isArray(suggestions) ? suggestions : []);
        } else if (Array.isArray(payload)) {
          setAuthorOptions(payload as string[]);
        } else {
          setAuthorOptions([]);
        }
      } catch {
        setAuthorOptions([]);
      }
    }, 250);

    return () => {
      if (authorDebounceRef.current) window.clearTimeout(authorDebounceRef.current);
    };
  }, [authorInputValue]);

  const loadGroups = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const sizeToUse = showAll ? 1000 : pageSize;
      const maybeResponse = await SalesService.getAuthorPayments(
        showAll ? 0 : page,
        sizeToUse,
        showAll,
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

      normalized.sort((a, b) => {
        const A = (a.author ?? '').toLowerCase();
        const B = (b.author ?? '').toLowerCase();
        if (A < B) return -1;
        if (A > B) return 1;
        return 0;
      });

      setGroups(normalized);
      setTotalPages(response.totalPages ?? 0);
      setTotalElements(response.totalElements ?? 0);
    } catch (loadError) {
      setError(loadError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, showAll]);

  React.useEffect(() => {
    function applyClientFilter(src: AuthorPaymentGroupResponse[], q: string) {
      if (!q) return src;
      const lower = q.toLowerCase();
      return src
        .map((g) => {
          const matchingSales = (g.sales ?? []).filter((s) => {
            if (g.author && g.author.toLowerCase().includes(lower)) return true;
            if (s.bookTitle && s.bookTitle.toLowerCase().includes(lower)) return true;
            if (s.bookAuthor && s.bookAuthor.toLowerCase().includes(lower)) return true;
            if ((s.saleYear ?? '').toString().includes(lower)) return true;
            if ((s.saleMonth ?? '').toString().includes(lower)) return true;
            if ((s.quantitySold ?? '').toString().includes(lower)) return true;
            if ((s.authorRoyalty ?? '').toString().includes(lower)) return true;
            return false;
          });

          if (matchingSales.length === 0) return null;
          return {
            ...g,
            sales: matchingSales,
            unpaidTotal: matchingSales.reduce(
              (sum, s) => sum + (s.hasAuthorBeenPaid ? 0 : (s.authorRoyalty ?? 0)),
              0,
            ),
          } as AuthorPaymentGroupResponse;
        })
        .filter(Boolean) as AuthorPaymentGroupResponse[];
    }

    const filtered = applyClientFilter(groups, debouncedQuery);
    setClientFilteredGroups(filtered);
  }, [groups, debouncedQuery]);

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
    if (v === ALL_SENTINEL) {
      setShowAll(true);
    } else {
      setPageSize(v);
      setShowAll(false);
    }
    setPage(0);
  }, []);

  const handleCreateClick = React.useCallback(() => {
    navigate('/dashboard/sales/new');
  }, [navigate]);

  function beginPayAuthor(group: AuthorPaymentGroupResponse) {
    const unpaidCount = (group.sales ?? []).filter((s) => !s.hasAuthorBeenPaid).length;
    if (unpaidCount === 0) {
      setSnackbar({ open: true, message: 'No unpaid records for this author', severity: 'error' });
      return;
    }
    setConfirmingAuthor(group.author ?? null);
    setConfirmingUnpaidCount(unpaidCount);
    setConfirmingUnpaidTotal(group.unpaidTotal ?? 0);
  }

  async function confirmPayAuthor() {
    if (!confirmingAuthor) return;
    setProcessing(true);

    try {
      const req: MarkAllPaidRequest = { author: confirmingAuthor };
      const maybeResp = await SalesService.markAuthorPaymentsPaid(req);
      const resp = unwrap<MarkAllPaidResponse>(maybeResp);
      const updatedCount = resp?.updatedCount ?? 0;
      setSnackbar({
        open: true,
        message: `Marked ${updatedCount} record(s) for ${confirmingAuthor} as paid.`,
        severity: 'success',
      });

      await loadGroups();
    } catch (e) {
      setSnackbar({
        open: true,
        message: `Failed to mark paid: ${(e as Error).message}`,
        severity: 'error',
      });
    } finally {
      setProcessing(false);
      setConfirmingAuthor(null);
      setConfirmingUnpaidCount(0);
      setConfirmingUnpaidTotal(0);
    }
  }

  const effectiveGroups = debouncedQuery ? clientFilteredGroups : groups;

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
            title={showAll ? 'Switch to filtered view' : 'Show all records'}
            placement="bottom"
            enterDelay={1000}
          >
            <div>
              <Button
                size="small"
                variant={showAll ? 'contained' : 'outlined'}
                onClick={handleShowAllToggle}
                startIcon={<ViewListIcon />}
              >
                {showAll ? 'Filtered' : 'Show All'}
              </Button>
            </div>
          </Tooltip>

          <Tooltip title="Reload data" placement="bottom" enterDelay={1000}>
            <div>
              <IconButton size="small" aria-label="refresh" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </div>
          </Tooltip>

          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel id="ap-page-size-label">Page size</InputLabel>
            <Select
              labelId="ap-page-size-label"
              label="Page size"
              value={showAll ? ALL_SENTINEL : pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              disabled={isLoading}
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
              <MenuItem value={ALL_SENTINEL}>All</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            freeSolo
            options={authorOptions}
            inputValue={authorInputValue}
            onInputChange={(_, v) => setAuthorInputValue(v)}
            onChange={(_, value) => {
              const q = typeof value === 'string' ? value : (value ?? '');
              setSearchQuery(q);
              setAuthorInputValue(q);
            }}
            sx={{ minWidth: 280 }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Search author, book, month."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
      <Box sx={{ mt: 2 }}>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Book Title</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Month/Year</th>
                            <th style={{ textAlign: 'right', padding: '8px' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '8px' }}>Author Royalty</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(group.sales ?? []).map((s) => (
                            <tr key={s.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                              <td style={{ padding: '8px' }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    display: 'inline-block',
                                  }}
                                  onClick={() => navigate(`/dashboard/books/${s.bookId}`)}
                                >
                                  {s.bookTitle ?? `Book ${s.bookId}`}
                                </Typography>
                              </td>
                              <td style={{ padding: '8px' }}>{formatMonthYear(s)}</td>
                              <td style={{ textAlign: 'right', padding: '8px' }}>
                                {s.quantitySold ?? '-'}
                              </td>
                              <td style={{ textAlign: 'right', padding: '8px' }}>
                                {formatCurrency(s.authorRoyalty)}
                              </td>
                              <td style={{ padding: '8px' }}>
                                <Chip
                                  icon={s.hasAuthorBeenPaid ? <CheckCircleIcon /> : <PendingIcon />}
                                  label={s.hasAuthorBeenPaid ? 'Paid' : 'Unpaid'}
                                  color={s.hasAuthorBeenPaid ? 'success' : 'warning'}
                                  size="small"
                                  variant={s.hasAuthorBeenPaid ? 'filled' : 'outlined'}
                                />
                              </td>
                              <td style={{ padding: '8px' }}>
                                <Button
                                  size="small"
                                  onClick={() => navigate(`/dashboard/sales/${s.id}`)}
                                >
                                  Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={Math.max(1, computedTotalPages)}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                color="primary"
              />
            </Box>
          </Box>
        )}
      </Box>

      <Dialog
        open={Boolean(confirmingAuthor)}
        onClose={() => !processing && setConfirmingAuthor(null)}
      >
        <DialogTitle>Confirm mark paid</DialogTitle>
        <DialogContent>
          <Typography>
            You are about to mark <strong>{confirmingAuthor}</strong>’s {confirmingUnpaidCount}{' '}
            unpaid sale record(s) as paid. Total:{' '}
            <strong>{formatCurrency(confirmingUnpaidTotal)}</strong>.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmingAuthor(null)} disabled={processing}>
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </PageContainer>
  );
}
