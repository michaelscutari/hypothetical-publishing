import { BooksService, type BookResponse } from '@/api';
import PageContainer from '@/components/PageContainer';
import SortDialog, { type SortOption } from '@/components/SortDialog';
import StandardDataGrid from '@/components/StandardDataGrid';
import { useDebounce } from '@/hooks/useDebounce';
import { useDialogs } from '@/hooks/useDialogs/useDialogs';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import { useServerDataGrid } from '@/hooks/useServerDataGrid';
import { getErrorMessage } from '@/utils/error';
import { formatMonthYear } from '@/utils/formatting';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import {
  GridActionsCellItem,
  type GridColDef,
  type GridEventListener,
  type GridSortModel,
} from '@mui/x-data-grid';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';

const BOOK_SORT_OPTIONS: SortOption[] = [
  { field: 'author', label: 'Author' },
  { field: 'title', label: 'Title' },
  { field: 'publicationDate', label: 'Publication Date' },
  { field: 'seriesName', label: 'Series Name' },
  { field: 'seriesPosition', label: 'Series Position' },
];

const BOOK_DEFAULT_SORT: GridSortModel = [
  { field: 'author', sort: 'asc' },
  { field: 'seriesName', sort: 'asc' },
  { field: 'seriesPosition', sort: 'asc' },
  { field: 'title', sort: 'asc' },
];

export default function BookList() {
  const navigate = useNavigate();
  const dialogs = useDialogs();
  const notifications = useNotifications();

  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, flush] = useDebounce(searchQuery, 300);
  const [multiSortOpen, setMultiSortOpen] = React.useState(false);

  const fetchFn = React.useCallback(
    async (params: { page: number; pageSize: number; showAll: boolean }) => {
      const sortFields = sortModel?.map((col) => col.field);
      const sortDirections = sortModel?.map((col) => col.sort ?? 'asc');

      return BooksService.getAllBooks(
        undefined,
        params.showAll ? 0 : params.page,
        params.showAll ? 1000 : params.pageSize,
        params.showAll,
        debouncedQuery || undefined,
        sortFields.length ? sortFields : undefined,
        sortDirections.length ? sortDirections : undefined,
      );
    },
    [sortModel, debouncedQuery],
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
  } = useServerDataGrid<BookResponse>({ fetchFn });

  const handleRowClick = React.useCallback<GridEventListener<'rowClick'>>(
    ({ row }) => navigate(`/books/${row.id}`),
    [navigate],
  );

  const handleCreateClick = React.useCallback(() => navigate('/books/new'), [navigate]);

  const handleRowEdit = React.useCallback(
    (book: BookResponse) => () => navigate(`/books/${book.id}/edit`),
    [navigate],
  );

  const handleRowDelete = React.useCallback(
    (book: BookResponse) => async () => {
      const confirmed = await dialogs.confirm(
        `Do you wish to delete ${book.title} by ${book.author}? By doing so, you will also be deleting ${book.totalSalesToDate} sales.`,
        {
          title: `Delete book?`,
          severity: 'error',
          okText: 'Delete',
          cancelText: 'Cancel',
        },
      );

      if (confirmed) {
        setIsLoading(true);
        try {
          await BooksService.deleteBook(Number(book.id));
          notifications.show('Book deleted successfully.', {
            severity: 'success',
            autoHideDuration: 3000,
          });
          refresh();
        } catch (deleteError) {
          notifications.show(`Failed to delete book. Reason: ${getErrorMessage(deleteError)}`, {
            severity: 'error',
            autoHideDuration: 3000,
          });
        }
        setIsLoading(false);
      }
    },
    [dialogs, notifications, refresh, setIsLoading],
  );

  const columns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: 'cover',
        headerName: '',
        width: 52,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) =>
          row.hasCover ? (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 0.75,
              }}
            >
              <Box
                component="img"
                src={`/api/books/${row.id}/cover/thumbnail`}
                alt=""
                sx={{
                  height: '100%',
                  width: 'auto',
                  maxWidth: 36,
                  objectFit: 'contain',
                  borderRadius: 0.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'block',
                }}
              />
            </Box>
          ) : null,
      },
      { field: 'title', headerName: 'Title', width: 200 },
      { field: 'author', headerName: 'Author', width: 180 },
      { field: 'isbn13', headerName: 'ISBN-13', width: 140 },
      { field: 'isbn10', headerName: 'ISBN-10', width: 120 },
      { field: 'asin', headerName: 'Amazon ASIN', width: 130 },
      {
        field: 'seriesPosition',
        headerName: 'Series',
        width: 180,
        valueGetter: (_value, row) => {
          if (row.seriesName) {
            return `${row.seriesName} (#${row.seriesPosition})`;
          }
          return '';
        },
      },
      {
        field: 'publicationDate',
        headerName: 'Publication',
        width: 120,
        valueGetter: (_value, row) => {
          const year = row.publicationYear;
          const month = row.publicationMonth;
          if (year && month) {
            return formatMonthYear(month, year);
          }
          return '';
        },
        sortComparator: (v1, v2, param1, param2) => {
          const row1 = param1.api.getRow(param1.id);
          const row2 = param2.api.getRow(param2.id);
          const date1 = (row1?.publicationYear ?? 0) * 12 + (row1?.publicationMonth ?? 0);
          const date2 = (row2?.publicationYear ?? 0) * 12 + (row2?.publicationMonth ?? 0);
          return date1 - date2;
        },
      },
      {
        field: 'totalSalesToDate',
        headerName: 'Total Sales',
        type: 'number',
        width: 100,
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

  const pageTitle = 'Books';

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

          <TextField
            size="small"
            placeholder="Search title, author, series, ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') flush();
            }}
            sx={{ minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="outlined"
            startIcon={<SortIcon />}
            onClick={() => setMultiSortOpen(true)}
            sx={{
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
              },
            }}
          >
            Sort
          </Button>
          <Button variant="contained" onClick={handleCreateClick} startIcon={<AddIcon />}>
            Create
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
          disableColumnSorting
          onRowClick={handleRowClick}
          rowHeight={60}
          loading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
        />
      </Box>
      <SortDialog
        open={multiSortOpen}
        onClose={() => setMultiSortOpen(false)}
        currentSortModel={sortModel}
        onApply={setSortModel}
        sortOptions={BOOK_SORT_OPTIONS}
        defaultSort={BOOK_DEFAULT_SORT}
      />
    </PageContainer>
  );
}
