import { SalesService, type SaleResponse } from '@/api';
import PaidStatusChip from '@/components/PaidStatusChip';
import { useDialogs } from '@/hooks/useDialogs/useDialogs';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import { getErrorMessage } from '@/utils/error';
import { formatCurrency, formatMonthYear } from '@/utils/formatting';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import { Link, useNavigate } from 'react-router-dom';

type BookSalesTableProps = {
  bookId?: number;
  onChange?: () => void;
};

type Order = 'asc' | 'desc';
type OrderBy =
  | 'saleDate'
  | 'quantitySold'
  | 'publisherRevenue'
  | 'authorRoyalty'
  | 'hasAuthorBeenPaid';

/** Maps UI sort field to backend field names. */
function toSortParams(orderBy: OrderBy, order: Order): { fields: string[]; directions: string[] } {
  if (orderBy === 'saleDate') {
    return { fields: ['saleYear', 'saleMonth'], directions: [order, order] };
  }
  return { fields: [orderBy], directions: [order] };
}

export default function BookSalesTable({ bookId, onChange }: BookSalesTableProps) {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const dialogs = useDialogs();
  const [sales, setSales] = React.useState<SaleResponse[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [startMonth, setStartMonth] = React.useState<Dayjs | null>(null);
  const [endMonth, setEndMonth] = React.useState<Dayjs | null>(null);
  const [order, setOrder] = React.useState<Order>('desc');
  const [orderBy, setOrderBy] = React.useState<OrderBy>('saleDate');

  const loadSales = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (bookId === undefined) {
        setSales([]);
        setIsLoading(false);
        return;
      }
      const { fields, directions } = toSortParams(orderBy, order);
      const startDateParam = startMonth
        ? startMonth.startOf('month').format('YYYY-MM-DD')
        : undefined;
      const endDateParam = endMonth ? endMonth.endOf('month').format('YYYY-MM-DD') : undefined;

      const response = await SalesService.getSales(
        0,
        1000,
        true,
        fields,
        directions,
        startDateParam,
        endDateParam,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        bookId,
      );
      setSales(response.content ?? []);
    } catch (loadError) {
      notifications.show(`Failed to load sales: ${getErrorMessage(loadError)}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, order, orderBy, startMonth, endMonth, notifications]);

  React.useEffect(() => {
    void loadSales();
  }, [loadSales]);

  const handleViewSale = React.useCallback(
    (saleId?: number) => {
      if (!saleId) return;
      navigate(`/sales/${saleId}`);
    },
    [navigate],
  );

  const handleSaleDelete = React.useCallback(
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
        await loadSales();
        onChange?.();
      } catch (deleteError) {
        notifications.show(`Failed to delete sale: ${getErrorMessage(deleteError)}`, {
          severity: 'error',
          autoHideDuration: 3000,
        });
      }
    },
    [dialogs, loadSales, notifications, onChange],
  );

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    const nextOrder: Order = orderBy === property ? (isAsc ? 'desc' : 'asc') : 'desc';
    setOrder(nextOrder);
    setOrderBy(property);
  };

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
              format="MM/YYYY"
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
              format="MM/YYYY"
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

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : sales.length === 0 ? (
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
                    Publisher Revenue (in USD)
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
                    Author Royalty (in USD)
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
              {sales.map((sale) => {
                const monthLabel = formatMonthYear(sale.saleMonth, sale.saleYear);
                return (
                  <TableRow
                    key={sale.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViewSale(sale.id)}
                    tabIndex={0}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2">
                          <Link
                            to={`/sales/${sale.id}`}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            {monthLabel}
                          </Link>
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell align="right">{sale.quantitySold}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(Number(sale.publisherRevenue))}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(sale.authorRoyalty)}</TableCell>

                    <TableCell align="center">
                      <PaidStatusChip paid={sale.hasAuthorBeenPaid} />
                    </TableCell>

                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleViewSale(sale.id)}
                          aria-label="edit-sale"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleSaleDelete(sale.id)}
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
