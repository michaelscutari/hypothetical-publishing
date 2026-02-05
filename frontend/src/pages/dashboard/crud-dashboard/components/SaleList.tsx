import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
  type GridEventListener,
  gridClasses,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import ViewListIcon from '@mui/icons-material/ViewList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { useNavigate } from 'react-router-dom';
import PageContainer from './PageContainer';
import { SalesService, BooksService, type SaleResponse, type BookResponse } from '../../../../api';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';

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

export default function SaleList() {
  const navigate = useNavigate();

  const [showAll, setShowAll] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: INITIAL_PAGE_SIZE,
  });

  // Default sort: descending by date (newest first) - requirement 3.1.1
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: 'saleYear', sort: 'desc' },
  ]);

  const [sales, setSales] = React.useState<SaleResponse[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [booksMap, setBooksMap] = React.useState<Map<number, BookResponse>>(new Map());

  const [startDate, setStartDate] = React.useState<Dayjs | null>(null);
  const [endDate, setEndDate] = React.useState<Dayjs | null>(null);

  // ✅ NEW: remember the user's date filter when they temporarily switch to "Show All"
  const [prevStartDate, setPrevStartDate] = React.useState<Dayjs | null>(null);
  const [prevEndDate, setPrevEndDate] = React.useState<Dayjs | null>(null);

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
        showAll ? undefined : paginationModel.page,
        showAll ? 1000 : paginationModel.pageSize, // Use large number for showAll
        showAll,
        sortField,
        sortDirection,
        startDateParam,
        endDateParam,
      );

      setSales(response.content ?? []);
      setTotalCount(response.totalElements ?? 0);

      // Fetch book details for all sales records
      const uniqueBookIds = Array.from(
        new Set((response.content ?? []).map((s) => s.bookId).filter(Boolean)),
      ) as number[];

      if (uniqueBookIds.length > 0) {
        const bookPromises = uniqueBookIds.map((bookId) =>
          BooksService.getBookById(bookId).catch(() => null),
        );
        const books = await Promise.all(bookPromises);

        const newBooksMap = new Map<number, BookResponse>();
        books.forEach((book) => {
          if (book && book.id) newBooksMap.set(book.id, book);
        });
        setBooksMap(newBooksMap);
      } else {
        setBooksMap(new Map());
      }
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

  // ✅ UPDATED: toggle Show All, but preserve/restore prior date filter
  const handleShowAllToggle = React.useCallback(() => {
    setShowAll((prev) => {
      const next = !prev;

      if (next) {
        // going INTO "Show All": remember current filters, then clear them
        setPrevStartDate(startDate);
        setPrevEndDate(endDate);
        setStartDate(null);
        setEndDate(null);
      } else {
        // going BACK to filtered view: restore what user had before
        setStartDate(prevStartDate);
        setEndDate(prevEndDate);
      }

      return next;
    });

    // Reset to first page when toggling
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [startDate, endDate, prevStartDate, prevEndDate]);

  // Requirement 3.1.3 - Navigate to detail/modify view
  const handleRowClick = React.useCallback<GridEventListener<'rowClick'>>(
    ({ row }) => {
      navigate(`/dashboard/sales/${row.id}`);
    },
    [navigate],
  );

  // Requirement 3.1.4 - Navigate to sales input tool
  const handleCreateClick = React.useCallback(() => {
    navigate('/dashboard/sales/new');
  }, [navigate]);

  const columns = React.useMemo<GridColDef<SaleResponse>[]>(
    () => [
      {
        field: 'bookTitle',
        headerName: 'Book Title',
        width: 200,
        valueGetter: (_value, row) => {
          const book = booksMap.get(row.bookId ?? 0);
          return book?.title ?? `Book ${row.bookId}`;
        },
      },
      {
        field: 'bookAuthor',
        headerName: 'Author',
        width: 180,
        valueGetter: (_value, row) => {
          const book = booksMap.get(row.bookId ?? 0);
          return book?.author ?? `Author ${row.bookId}`;
        },
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
    [booksMap],
  );

  const pageTitle = 'Sales Records';

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
            <span>
              <Button
                size="small"
                variant={showAll ? 'contained' : 'outlined'}
                onClick={handleShowAllToggle}
                startIcon={<ViewListIcon />}
              >
                {showAll ? 'Filtered' : 'Show All'}
              </Button>
            </span>
          </Tooltip>

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
              format="MMM YYYY"
              openTo="year"
              minDate={dayjs('1900-01-01')}
              maxDate={dayjs('2026-02-28')}
              disabled={showAll}
              slotProps={{
                textField: { size: 'small' },
                toolbar: { hidden: true },
              }}
            />
            <DatePicker
              label="End"
              value={endDate}
              onChange={(v) => setEndDate(v)}
              views={['year', 'month']}
              format="MMM YYYY"
              openTo="year"
              minDate={dayjs('1900-01-01')}
              maxDate={dayjs('2026-02-28')}
              disabled={showAll}
              slotProps={{
                textField: { size: 'small' },
                toolbar: { hidden: true },
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
            rowCount={showAll ? sales.length : totalCount}
            columns={columns}
            pagination={!showAll}
            sortingMode="server"
            paginationMode={showAll ? 'client' : 'server'}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            disableRowSelectionOnClick
            onRowClick={handleRowClick}
            loading={isLoading}
            pageSizeOptions={[10, INITIAL_PAGE_SIZE, 50, 100]}
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
