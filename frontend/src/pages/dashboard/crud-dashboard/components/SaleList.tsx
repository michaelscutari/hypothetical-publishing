import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import RefreshIcon from '@mui/icons-material/Refresh';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import {
  DataGrid,
  type GridColDef,
  type GridEventListener,
  type GridPaginationModel,
  type GridSortModel,
  gridClasses,
} from '@mui/x-data-grid';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { type Dayjs } from 'dayjs';
import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type SaleResponse, SalesService } from '../../../../api';
import PageContainer from './PageContainer';
import { MONTH_NAMES_SHORT as MONTH_NAMES } from '../../../../constants/months';
const INITIAL_PAGE_SIZE = 10;
const SHOW_ALL_SIZE = 10000;

export default function SaleList() {
  const navigate = useNavigate();

  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: INITIAL_PAGE_SIZE,
  });

  const showAll = paginationModel.pageSize === SHOW_ALL_SIZE;

  // Default sort: descending by date (newest first) - requirement 3.1.1
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: 'saleYear', sort: 'desc' },
  ]);

  const [sales, setSales] = React.useState<SaleResponse[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [startDate, setStartDate] = React.useState<Dayjs | null>(null);
  const [endDate, setEndDate] = React.useState<Dayjs | null>(null);

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const sortField = sortModel?.[0]?.field;
      const sortDirection = sortModel?.[0]?.sort ?? 'desc';

      // Date range filter - requirement 3.1.2
      // Convert to first day of month for start, last day of month for end
      const startDateParam = startDate
        ? startDate.startOf('month').format('YYYY-MM-DD')
        : undefined;
      const endDateParam = endDate ? endDate.endOf('month').format('YYYY-MM-DD') : undefined;

      const response = await SalesService.getSales(
        showAll ? 0 : paginationModel.page,
        showAll ? 1000 : paginationModel.pageSize, // Use large number for showAll
        showAll,
        sortField,
        sortDirection,
        startDateParam,
        endDateParam,
      );

      setSales(response.content ?? []);
      setTotalCount(response.totalElements ?? 0);
    } catch (loadError) {
      setError(loadError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [paginationModel, sortModel, showAll, startDate, endDate]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = React.useCallback(() => {
    if (!isLoading) loadData();
  }, [isLoading, loadData]);

  // Requirement 3.1.3 - Navigate to detail/modify view
  const handleRowClick = React.useCallback<GridEventListener<'rowClick'>>(
    ({ row }) => {
      navigate(`/sales/${row.id}`);
    },
    [navigate],
  );

  // Requirement 3.1.4 - Navigate to sales input tool
  const handleCreateClick = React.useCallback(() => {
    navigate('/sales/new');
  }, [navigate]);

  const columns = React.useMemo<GridColDef<SaleResponse>[]>(
    () => [
      {
        field: 'bookTitle',
        headerName: 'Book Title',
        width: 200,
        renderCell: (params) => {
          const bookId = params.row.bookId;
          const title = params.row.bookTitle ?? `Book ${bookId}`;

          return (
            <Link
              to={`/books/${bookId}`}
              style={{
                color: 'inherit',
                textDecoration: 'none',
              }}
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
              {title}
            </Link>
          );
        },
      },
      {
        field: 'bookAuthor',
        headerName: 'Author',
        width: 180,
      },
      {
        field: 'saleYear',
        headerName: 'Month/Year',
        width: 120,
        valueGetter: (_value, row) => {
          if (row.saleYear && row.saleMonth)
            return `${MONTH_NAMES[row.saleMonth - 1]} ${row.saleYear}`;
          return '';
        },
      },
      {
        field: 'quantitySold',
        headerName: 'Quantity Sold',
        type: 'number',
        width: 130,
      },
      {
        field: 'publisherRevenue',
        headerName: 'Publisher Revenue',
        type: 'number',
        width: 160,
        valueFormatter: (value) => (value != null ? `$${Number(value).toFixed(2)}` : ''),
      },
      {
        field: 'authorRoyalty',
        headerName: 'Author Royalty',
        type: 'number',
        width: 150,
        valueFormatter: (value) => (value != null ? `$${Number(value).toFixed(2)}` : ''),
      },
      {
        field: 'hasAuthorBeenPaid',
        headerName: 'Paid Status',
        width: 140,
        renderCell: (params) => {
          const isPaid = params.row.hasAuthorBeenPaid;
          return (
            <Chip
              icon={isPaid ? <CheckCircleIcon /> : <PendingIcon />}
              label={isPaid ? 'Paid' : 'Unpaid'}
              color={isPaid ? 'success' : 'warning'}
              size="small"
              variant={isPaid ? 'filled' : 'outlined'}
            />
          );
        },
      },
    ],
    [],
  );

  const pageTitle = 'Sales Records';

  return (
    <PageContainer
      title={pageTitle}
      breadcrumbs={[{ title: pageTitle }]}
      actions={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="Reload data" placement="bottom" enterDelay={1000}>
            <span>
              <IconButton size="small" aria-label="refresh" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start"
              value={startDate}
              onChange={(v) => setStartDate(v)}
              views={['year', 'month']}
              format="MM/YYYY"
              openTo="year"
              minDate={dayjs('1900-01-01')}
              maxDate={dayjs()}
              slotProps={{
                textField: {
                  size: 'small',
                  placeholder: 'MM/YYYY',
                  InputLabelProps: { shrink: true },
                },
                toolbar: { hidden: true },
                field: {
                  clearable: true,
                },
              }}
            />
            <DatePicker
              label="End"
              value={endDate}
              onChange={(v) => setEndDate(v)}
              views={['year', 'month']}
              format="MM/YYYY"
              openTo="year"
              minDate={dayjs('1900-01-01')}
              maxDate={dayjs()}
              slotProps={{
                textField: {
                  size: 'small',
                  placeholder: 'MM/YYYY',
                  InputLabelProps: { shrink: true },
                },
                toolbar: { hidden: true },
                field: {
                  clearable: true,
                },
              }}
            />
          </LocalizationProvider>

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
        ) : (
          <DataGrid
            rows={sales}
            rowCount={totalCount}
            columns={columns}
            sortingMode="server"
            paginationMode="server"
            hideFooter={false}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            disableRowSelectionOnClick
            onRowClick={handleRowClick}
            loading={isLoading}
            pageSizeOptions={[10, 25, 50, 100, { value: SHOW_ALL_SIZE, label: 'All' }]}
            sx={{
              [`& .${gridClasses.columnHeader}, & .${gridClasses.cell}`]: {
                outline: 'transparent',
              },
              [`& .${gridClasses.columnHeader}:focus-within, & .${gridClasses.cell}:focus-within`]:
                {
                  outline: 'none',
                },
              [`& .${gridClasses.row}:hover`]: {
                cursor: 'pointer',
              },
            }}
            slotProps={{
              loadingOverlay: {
                variant: 'circular-progress',
                noRowsVariant: 'circular-progress',
              },
            }}
          />
        )}
      </Box>
    </PageContainer>
  );
}
