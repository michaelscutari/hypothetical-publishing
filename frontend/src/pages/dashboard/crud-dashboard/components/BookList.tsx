import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import {
  DataGrid,
  GridActionsCellItem,
  gridClasses,
  type GridColDef,
  type GridEventListener,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { MONTH_NAMES_SHORT as MONTH_NAMES } from '../../../../constants/months';
import { deleteOne as deleteBook, getMany as getBooks, type Book } from '../data/books';
import { useDialogs } from '../hooks/useDialogs/useDialogs';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';

const INITIAL_PAGE_SIZE = 10;
const SHOW_ALL_SIZE = -1;

export default function BookList() {
  const navigate = useNavigate();

  const dialogs = useDialogs();
  const notifications = useNotifications();

  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: INITIAL_PAGE_SIZE,
  });

  const showAll = paginationModel.pageSize === SHOW_ALL_SIZE;
  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const debounceRef = React.useRef<number | null>(null);

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
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [debouncedQuery]);

  const [rowsState, setRowsState] = React.useState<{
    rows: Book[];
    rowCount: number;
  }>({
    rows: [],
    rowCount: 0,
  });

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const listData = await getBooks({
        paginationModel,
        sortModel,
        query: debouncedQuery || undefined,
        showAll,
      });

      setRowsState({
        rows: listData.items,
        rowCount: listData.itemCount,
      });
    } catch (listDataError) {
      setError(listDataError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [paginationModel, sortModel, debouncedQuery, showAll]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = React.useCallback(() => {
    if (!isLoading) {
      loadData();
    }
  }, [isLoading, loadData]);

  const handleRowClick = React.useCallback<GridEventListener<'rowClick'>>(
    ({ row }) => {
      navigate(`/books/${row.id}`);
    },
    [navigate],
  );

  const handleCreateClick = React.useCallback(() => {
    navigate('/books/new');
  }, [navigate]);

  const handleRowEdit = React.useCallback(
    (book: Book) => () => {
      navigate(`/books/${book.id}/edit`);
    },
    [navigate],
  );

  const handleRowDelete = React.useCallback(
    (book: Book) => async () => {
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
          await deleteBook(Number(book.id));

          notifications.show('Book deleted successfully.', {
            severity: 'success',
            autoHideDuration: 3000,
          });
          loadData();
        } catch (deleteError) {
          notifications.show(`Failed to delete book. Reason: ${(deleteError as Error).message}`, {
            severity: 'error',
            autoHideDuration: 3000,
          });
        }
        setIsLoading(false);
      }
    },
    [dialogs, notifications, loadData],
  );

  const initialState = React.useMemo(
    () => ({
      pagination: { paginationModel: { pageSize: INITIAL_PAGE_SIZE } },
    }),
    [],
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
      {
        field: 'publicationDate',
        headerName: 'Publication',
        width: 120,
        valueGetter: (_value, row) => {
          const year = row.publicationYear;
          const month = row.publicationMonth;
          if (year && month) {
            return `${MONTH_NAMES[month - 1]} ${year}`;
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
        field: 'distributorAuthorRoyaltyRate',
        headerName: 'Distributor Royalty',
        type: 'number',
        width: 150,
        valueFormatter: (value) => (value != null ? `${(value * 100).toFixed(0)}%` : ''),
      },
      {
        field: 'handsoldAuthorRoyaltyRate',
        headerName: 'Handsold Royalty',
        type: 'number',
        width: 140,
        valueFormatter: (value) => (value != null ? `${(value * 100).toFixed(0)}%` : ''),
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
              <IconButton size="small" aria-label="refresh" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </div>
          </Tooltip>

          <TextField
            size="small"
            placeholder="Search title, author, ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (debounceRef.current) window.clearTimeout(debounceRef.current);
                setDebouncedQuery(searchQuery.trim());
              }
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

          <Button variant="contained" onClick={handleCreateClick} startIcon={<AddIcon />}>
            Create
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
            rows={rowsState.rows}
            rowCount={rowsState.rowCount}
            disableMultipleColumnsSorting={false}
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
            rowHeight={60}
            loading={isLoading}
            initialState={initialState}
            pageSizeOptions={[10, 25, 50, 100, { value: SHOW_ALL_SIZE, label: 'All' }]}
            slotProps={{
              loadingOverlay: {
                variant: 'circular-progress',
                noRowsVariant: 'circular-progress',
              },
              baseIconButton: {
                size: 'small',
              },
            }}
            sx={{
              '--DataGrid-rowBorderColor': (theme) => theme.palette.divider,
              '--DataGrid-containerBackground': (theme) => theme.palette.background.paper,
              borderColor: 'divider',
              borderRadius: 2,
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
              '& .MuiDataGrid-footerContainer': {
                borderColor: 'divider',
              },
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
          />
        )}
      </Box>
    </PageContainer>
  );
}
