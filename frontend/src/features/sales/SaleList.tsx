import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

import {
  GridActionsCellItem,
  type GridColDef,
  type GridEventListener,
  type GridSortModel,
} from '@mui/x-data-grid';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { type Dayjs } from 'dayjs';
import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type AuthorResponse, AuthorsService, type SaleResponse, SalesService } from '@/api';
import { formatCurrency, formatMonthYear } from '@/utils/formatting';
import { useServerDataGrid } from '@/hooks/useServerDataGrid';
import { useDialogs } from '@/hooks/useDialogs/useDialogs';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import PageContainer from '@/components/PageContainer';
import PaidStatusChip from '@/components/PaidStatusChip';
import StandardDataGrid from '@/components/StandardDataGrid';

export default function SaleList() {
  const navigate = useNavigate();
  const dialogs = useDialogs();
  const notifications = useNotifications();

  // Default sort: descending by date (newest first) - requirement 3.1.1
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: 'saleYear', sort: 'desc' },
  ]);

  const [startDate, setStartDate] = React.useState<Dayjs | null>(null);
  const [endDate, setEndDate] = React.useState<Dayjs | null>(null);
  const [selectedAuthor, setSelectedAuthor] = React.useState<AuthorResponse | null>(null);
  const [saleSource, setSaleSource] = React.useState<string>('all');
  const [authors, setAuthors] = React.useState<AuthorResponse[]>([]);

  const fetchFn = React.useCallback(
    async (params: { page: number; pageSize: number; showAll: boolean }) => {
      const sortField = sortModel?.[0]?.field;
      const sortDirection = sortModel?.[0]?.sort ?? 'desc';

      // Date range filter - requirement 3.1.2
      const startDateParam = startDate
        ? startDate.startOf('month').format('YYYY-MM-DD')
        : undefined;
      const endDateParam = endDate ? endDate.endOf('month').format('YYYY-MM-DD') : undefined;

      // Author and sale source filters - requirement 3.1.2
      const authorIdParam = selectedAuthor?.id;
      const saleSourceParam = saleSource === 'all' ? undefined : saleSource.toUpperCase();

      return SalesService.getSales(
        params.page,
        params.pageSize,
        params.showAll,
        sortField,
        sortDirection,
        startDateParam,
        endDateParam,
        authorIdParam,
        saleSourceParam,
      );
    },
    [sortModel, startDate, endDate, selectedAuthor, saleSource],
  );

  const {
    rows,
    rowCount,
    isLoading,
    error,
    paginationModel,
    onPaginationModelChange,
    refresh,
    setIsLoading,
  } = useServerDataGrid<SaleResponse>({ fetchFn });

  const loadAuthors = React.useCallback(async () => {
    try {
      const response = await AuthorsService.getAllAuthors(0, 1000, true);
      setAuthors(response.content ?? []);
    } catch (error) {
      console.error('Failed to load authors:', error);
    }
  }, []);

  React.useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  // Requirement 3.1.3 - Navigate to detail/modify view
  const handleRowClick = React.useCallback<GridEventListener<'rowClick'>>(
    ({ row }) => navigate(`/sales/${row.id}`),
    [navigate],
  );

  // Requirement 3.1.4 - Navigate to sales input tool
  const handleCreateClick = React.useCallback(() => navigate('/sales/new'), [navigate]);

  const handleImportClick = React.useCallback(() => navigate('/sales/import'), [navigate]);

  const handleRowEdit = React.useCallback(
    (sale: SaleResponse) => () => navigate(`/sales/${sale.id}/edit`),
    [navigate],
  );

  const handleRowDelete = React.useCallback(
    (sale: SaleResponse) => async () => {
      const confirmed = await dialogs.confirm(
        `Do you wish to delete this sale record for ${sale.bookTitle || 'this book'}?`,
        {
          title: 'Delete sale record?',
          severity: 'error',
          okText: 'Delete',
          cancelText: 'Cancel',
        },
      );

      if (confirmed) {
        setIsLoading(true);
        try {
          await SalesService.deleteSale(Number(sale.id));
          notifications.show('Sale record deleted successfully.', {
            severity: 'success',
            autoHideDuration: 3000,
          });
          refresh();
        } catch (deleteError) {
          notifications.show(
            `Failed to delete sale record. Reason: ${(deleteError as Error).message}`,
            {
              severity: 'error',
              autoHideDuration: 3000,
            },
          );
        }
        setIsLoading(false);
      }
    },
    [dialogs, notifications, refresh, setIsLoading],
  );

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
        field: 'saleSource',
        headerName: 'Sale Source',
        width: 130,
        valueGetter: (_value, row) => {
          if (row.saleSource === 'DISTRIBUTOR') return 'Distributor';
          if (row.saleSource === 'HAND_SOLD') return 'Hand Sold';
          return row.saleSource;
        },
      },
      {
        field: 'saleYear',
        headerName: 'Month/Year',
        width: 120,
        valueGetter: (_value, row) => {
          if (row.saleYear && row.saleMonth) return formatMonthYear(row.saleMonth, row.saleYear);
          return '—';
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
        valueFormatter: (value) => (value != null ? formatCurrency(Number(value)) : '—'),
      },
      {
        field: 'authorRoyalty',
        headerName: 'Author Royalty',
        type: 'number',
        width: 150,
        valueFormatter: (value) => (value != null ? formatCurrency(Number(value)) : '—'),
      },
      {
        field: 'hasAuthorBeenPaid',
        headerName: 'Paid Status',
        width: 140,
        renderCell: (params) => <PaidStatusChip paid={params.row.hasAuthorBeenPaid} />,
      },
      {
        field: 'actions',
        type: 'actions',
        flex: 1,
        align: 'right',
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="edit-item"
            icon={<EditIcon />}
            label="Edit"
            onClick={handleRowEdit(row)}
          />,
          <GridActionsCellItem
            key="delete-item"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleRowDelete(row)}
          />,
        ],
      },
    ],
    [handleRowEdit, handleRowDelete],
  );

  const pageTitle = 'Sales Records';

  return (
    <PageContainer
      title={pageTitle}
      breadcrumbs={[{ title: pageTitle }]}
      actions={
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="Reload data" placement="bottom" enterDelay={1000}>
            <div>
              <IconButton size="small" aria-label="refresh" onClick={refresh}>
                <RefreshIcon />
              </IconButton>
            </div>
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

          <Autocomplete
            options={authors}
            getOptionLabel={(author) => author.name ?? ''}
            renderInput={(params) => (
              <TextField {...params} label="Author" size="small" placeholder="All Authors" />
            )}
            value={selectedAuthor}
            onChange={(_, newValue) => setSelectedAuthor(newValue)}
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sale Source</InputLabel>
            <Select
              value={saleSource}
              label="Sale Source"
              onChange={(e: SelectChangeEvent) => setSaleSource(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="distributor">Distributor</MenuItem>
              <MenuItem value="hand_sold">Hand Sold</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            size="small"
            onClick={handleCreateClick}
            startIcon={<AddIcon />}
          >
            New Sale
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleImportClick}
            startIcon={<UploadFileIcon />}
          >
            Import CSV
          </Button>
        </Stack>
      }
    >
      <Box sx={{ flex: 1, width: '100%' }}>
        <StandardDataGrid
          rows={rows}
          rowCount={rowCount}
          columns={columns}
          error={error}
          onRowClick={handleRowClick}
          loading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
        />
      </Box>
    </PageContainer>
  );
}
