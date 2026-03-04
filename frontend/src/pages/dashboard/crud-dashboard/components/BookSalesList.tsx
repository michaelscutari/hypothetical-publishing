import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PendingIcon from '@mui/icons-material/Pending';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { type Dayjs } from 'dayjs';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { SalesService, type SaleResponse, type PagedResponseSaleResponse } from '../../../../api';
import { useDialogs } from '../hooks/useDialogs/useDialogs';
import useNotifications from '../hooks/useNotifications/useNotifications';
import { MONTH_NAMES } from '../../../../constants/months';

type Props = {
  bookId?: number;
  onChange?: () => void;
  sales?: SaleResponse[];
  reloadSales?: () => Promise<void>;
};

type Order = 'asc' | 'desc';
type OrderBy =
  | 'saleDate'
  | 'quantitySold'
  | 'publisherRevenue'
  | 'authorRoyalty'
  | 'hasAuthorBeenPaid';

export default function BookSalesList({
  bookId,
  onChange,
  sales: controlledSales,
  reloadSales,
}: Props) {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const dialogs = useDialogs();
  const [sales, setSales] = React.useState<SaleResponse[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [startMonth, setStartMonth] = React.useState<Dayjs | null>(null);
  const [endMonth, setEndMonth] = React.useState<Dayjs | null>(null);
  const [order, setOrder] = React.useState<Order>('desc');
  const [orderBy, setOrderBy] = React.useState<OrderBy>('saleDate');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      if (bookId === undefined) {
        setSales([]);
        setLoading(false);
        return;
      }
      // TODO: replace with a backend endpoint that filters by bookId server-side
      const response: PagedResponseSaleResponse = await SalesService.getSales(
        0,
        1000,
        true,
        'saleYear',
        'desc',
      );
      const s = (response.content ?? []).filter((sale) => sale.bookId === bookId);
      setSales(s ?? []);
    } catch (e) {
      notifications.show(`Failed to load sales: ${(e as Error).message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [bookId, notifications]);

  React.useEffect(() => {
    if (Array.isArray(controlledSales)) {
      setSales(controlledSales);
      setLoading(false);
      return;
    }
    void load();
  }, [controlledSales, load]);

  const handleEdit = React.useCallback(
    (saleId?: number) => {
      if (!saleId) return;
      navigate(`/sales/${saleId}`);
    },
    [navigate],
  );

  const handleDelete = React.useCallback(
    async (saleId?: number) => {
      if (!saleId) return;
      const confirmed = await dialogs.confirm('Delete this sale record?', {
        title: 'Delete sale',
        severity: 'error',
        okText: 'Delete',
        cancelText: 'Cancel',
      });
      if (!confirmed) return;

      try {
        await SalesService.deleteSale(saleId);
        notifications.show('Sale deleted', { severity: 'success', autoHideDuration: 3000 });

        if (reloadSales) {
          await reloadSales();
        } else {
          await load();
        }

        onChange?.();
      } catch (e) {
        notifications.show(`Failed to delete sale: ${(e as Error).message}`, {
          severity: 'error',
          autoHideDuration: 3000,
        });
      }
    },
    [dialogs, load, notifications, onChange, reloadSales],
  );

  const currency = React.useMemo(
    () => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    [],
  );

  const saleToKey = React.useCallback((s: SaleResponse) => {
    const y = Number(s.saleYear ?? 0);
    const m = Number(s.saleMonth ?? 0);
    return y * 100 + m;
  }, []);

  const stableSort = (
    array: SaleResponse[],
    comparator: (a: SaleResponse, b: SaleResponse) => number,
  ) => {
    const stabilized = array.map((el, index) => [el, index] as [SaleResponse, number]);
    stabilized.sort((a, b) => {
      const orderRes = comparator(a[0], b[0]);
      if (orderRes !== 0) return orderRes;
      return a[1] - b[1];
    });
    return stabilized.map((el) => el[0]);
  };

  const filteredSales = React.useMemo(() => {
    return (sales ?? []).filter((s) => {
      if (!s.saleYear || !s.saleMonth) return true;
      const saleDate = dayjs(`${s.saleYear}-${String(s.saleMonth).padStart(2, '0')}-01`);
      if (startMonth && saleDate.isBefore(startMonth.startOf('month'))) return false;
      if (endMonth && saleDate.isAfter(endMonth.endOf('month'))) return false;
      return true;
    });
  }, [sales, startMonth, endMonth]);

  const filteredSortedSales = React.useMemo(() => {
    // helpers moved inside the memo so they don't appear in the hook deps
    const compareNumber = (a: number | undefined | null, b: number | undefined | null) => {
      const na = Number(a ?? 0);
      const nb = Number(b ?? 0);
      if (na < nb) return -1;
      if (na > nb) return 1;
      return 0;
    };

    const compareBoolean = (a: boolean | undefined, b: boolean | undefined) => {
      const va = a ? 1 : 0;
      const vb = b ? 1 : 0;
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    };

    const comparator = (a: SaleResponse, b: SaleResponse) => {
      let cmp = 0;
      switch (orderBy) {
        case 'saleDate':
          cmp = saleToKey(a) - saleToKey(b);
          break;
        case 'quantitySold':
          cmp = compareNumber(a.quantitySold, b.quantitySold);
          break;
        case 'publisherRevenue':
          cmp = compareNumber(a.publisherRevenue, b.publisherRevenue);
          break;
        case 'authorRoyalty':
          cmp = compareNumber(a.authorRoyalty ?? 0, b.authorRoyalty ?? 0);
          break;
        case 'hasAuthorBeenPaid':
          cmp = compareBoolean(a.hasAuthorBeenPaid, b.hasAuthorBeenPaid);
          break;
        default:
          cmp = 0;
      }
      return order === 'asc' ? cmp : -cmp;
    };

    return stableSort(filteredSales, comparator);
  }, [filteredSales, order, orderBy, saleToKey]);

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    const nextOrder: Order = orderBy === property ? (isAsc ? 'desc' : 'asc') : 'desc';
    setOrder(nextOrder);
    setOrderBy(property);
  };

  const handleRowClick = React.useCallback(
    (saleId?: number) => {
      if (!saleId) return;
      navigate(`/sales/${saleId}`);
    },
    [navigate],
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
        spacing={2}
      >
        <Typography variant="h6">Sales Records</Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start"
              value={startMonth}
              onChange={setStartMonth}
              views={['year', 'month']}
              format="MMM YYYY"
              openTo="year"
              minDate={dayjs('1900-01-01')}
              maxDate={dayjs()}
              slotProps={{
                textField: { size: 'small' },
                toolbar: { hidden: true },
              }}
            />
            <DatePicker
              label="End"
              value={endMonth}
              onChange={setEndMonth}
              views={['year', 'month']}
              format="MMM YYYY"
              openTo="year"
              minDate={dayjs('1900-01-01')}
              maxDate={dayjs()}
              slotProps={{
                textField: { size: 'small' },
                toolbar: { hidden: true },
              }}
            />
          </LocalizationProvider>

          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setStartMonth(null);
              setEndMonth(null);
            }}
          >
            Clear
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              const params = new URLSearchParams();
              if (bookId) params.set('bookId', String(bookId));
              navigate(`/sales/new?${params.toString()}`);
            }}
          >
            Add sale
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : filteredSortedSales.length === 0 ? (
        <Alert severity="info">No sales recorded for this book (in the selected range).</Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sortDirection={orderBy === 'saleDate' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'saleDate'}
                    direction={orderBy === 'saleDate' ? order : 'desc'}
                    onClick={() => handleRequestSort('saleDate')}
                  >
                    Month / Year
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right" sortDirection={orderBy === 'quantitySold' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'quantitySold'}
                    direction={orderBy === 'quantitySold' ? order : 'desc'}
                    onClick={() => handleRequestSort('quantitySold')}
                  >
                    Qty
                  </TableSortLabel>
                </TableCell>

                <TableCell
                  align="right"
                  sortDirection={orderBy === 'publisherRevenue' ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === 'publisherRevenue'}
                    direction={orderBy === 'publisherRevenue' ? order : 'desc'}
                    onClick={() => handleRequestSort('publisherRevenue')}
                  >
                    Publisher Revenue
                  </TableSortLabel>
                </TableCell>

                <TableCell
                  align="right"
                  sortDirection={orderBy === 'authorRoyalty' ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === 'authorRoyalty'}
                    direction={orderBy === 'authorRoyalty' ? order : 'desc'}
                    onClick={() => handleRequestSort('authorRoyalty')}
                  >
                    Author Royalty
                  </TableSortLabel>
                </TableCell>

                <TableCell
                  align="center"
                  sortDirection={orderBy === 'hasAuthorBeenPaid' ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === 'hasAuthorBeenPaid'}
                    direction={orderBy === 'hasAuthorBeenPaid' ? order : 'desc'}
                    onClick={() => handleRequestSort('hasAuthorBeenPaid')}
                  >
                    Paid?
                  </TableSortLabel>
                </TableCell>

                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredSortedSales.map((s) => {
                const monthLabel =
                  s.saleMonth && s.saleYear ? `${MONTH_NAMES[s.saleMonth - 1]} ${s.saleYear}` : '—';
                const computedAuthorRoyalty = s.authorRoyalty != null ? s.authorRoyalty : null;
                return (
                  <TableRow
                    key={s.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(s.id)}
                    tabIndex={0}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2">{monthLabel}</Typography>
                      </Stack>
                    </TableCell>

                    <TableCell align="right">{s.quantitySold ?? 0}</TableCell>
                    <TableCell align="right">
                      {currency.format(Number(s.publisherRevenue ?? 0))}
                    </TableCell>
                    <TableCell align="right">
                      {computedAuthorRoyalty != null ? currency.format(computedAuthorRoyalty) : '—'}
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        icon={s.hasAuthorBeenPaid ? <CheckCircleIcon /> : <PendingIcon />}
                        label={s.hasAuthorBeenPaid ? 'Paid' : 'Unpaid'}
                        color={s.hasAuthorBeenPaid ? 'success' : 'warning'}
                        size="small"
                        variant={s.hasAuthorBeenPaid ? 'filled' : 'outlined'}
                      />
                    </TableCell>

                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(s.id)}
                          aria-label="edit-sale"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(s.id)}
                          aria-label="delete-sale"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
