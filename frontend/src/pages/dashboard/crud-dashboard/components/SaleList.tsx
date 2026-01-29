
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
// import { SalesService, type SaleResponse } from '../../../../api';
import PageContainer from './PageContainer';
import { SalesService, BooksService, type SaleResponse, type BookResponse } from '../../../../api';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';



const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
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

const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const sortField = sortModel?.[0]?.field;
      const sortDirection = sortModel?.[0]?.sort ?? 'desc';

      // Date range filter placeholder - requirement 3.1.2
    const startDateParam = startDate ? startDate.format('YYYY-MM-DD') : undefined;
    const endDateParam = endDate ? endDate.format('YYYY-MM-DD') : undefined;


    //   const response = await SalesService.getSales(
    //     paginationModel.page,
    //     paginationModel.pageSize,
    //     showAll,
    //     sortField,
    //     sortDirection,
    //     startDate,
    //     endDate,
    //   );
    const response = await SalesService.getSales(
    paginationModel.page,
    paginationModel.pageSize,
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
        new Set((response.content ?? []).map((sale) => sale.bookId).filter(Boolean))
      ) as number[];

      if (uniqueBookIds.length > 0) {
        const bookPromises = uniqueBookIds.map((bookId) =>
          BooksService.getBookById(bookId).catch(() => null)
        );
        const books = await Promise.all(bookPromises);

        const newBooksMap = new Map<number, BookResponse>();
        books.forEach((book) => {
          if (book && book.id) {
            newBooksMap.set(book.id, book);
          }
        });
        setBooksMap(newBooksMap);
      }
    } catch (loadError) {
      setError(loadError as Error);
    }

    setIsLoading(false);
  }, [paginationModel, sortModel, showAll, startDate, endDate]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = React.useCallback(() => {
    if (!isLoading) {
      loadData();
    }
  }, [isLoading, loadData]);

  const handleShowAllToggle = React.useCallback(() => {
    setShowAll((prev) => !prev);
  }, []);

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
            if (row.saleYear && row.saleMonth) {
            return `${MONTH_NAMES[row.saleMonth - 1]} ${row.saleYear}`;
            }
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
        // Visual indicator with different color AND shape - requirement 3.1
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
            title={showAll ? 'Switch to paginated view' : 'Show all records'}
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
                {showAll ? 'Paginated' : 'Show All'}
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
          <LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    label="Start"
    value={startDate}
    onChange={(v) => setStartDate(v)}
    slotProps={{ textField: { size: 'small' } }}
  />
  <DatePicker
    label="End"
    value={endDate}
    onChange={(v) => setEndDate(v)}
    slotProps={{ textField: { size: 'small' } }}
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
            pagination
            sortingMode="server"
            paginationMode="server"
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
              [`& .${gridClasses.columnHeader}:focus-within, & .${gridClasses.cell}:focus-within`]: {
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
