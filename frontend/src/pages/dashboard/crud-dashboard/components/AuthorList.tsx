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
import { AuthorsService, type AuthorResponse } from '../../../../api';
import { useDialogs } from '../hooks/useDialogs/useDialogs';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';

const INITIAL_PAGE_SIZE = 25;
const SHOW_ALL_SIZE = -1;
const SHOW_ALL_PAGE_SIZE = 1000;

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function AuthorList() {
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
    rows: AuthorResponse[];
    rowCount: number;
  }>({ rows: [], rowCount: 0 });

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const sortField = sortModel?.[0]?.field;
      const sortDirection = sortModel?.[0]?.sort ?? 'asc';

      const response = await AuthorsService.getAllAuthors(
        showAll ? 0 : paginationModel.page,
        showAll ? SHOW_ALL_PAGE_SIZE : paginationModel.pageSize,
        showAll,
        debouncedQuery || undefined,
        sortField,
        sortDirection,
      );

      setRowsState({
        rows: response.content ?? [],
        rowCount: response.totalElements ?? 0,
      });
    } catch (loadError) {
      setError(loadError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [paginationModel, sortModel, debouncedQuery, showAll]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = React.useCallback(() => {
    if (!isLoading) loadData();
  }, [isLoading, loadData]);

  const initialState = React.useMemo(
    () => ({
      pagination: { paginationModel: { pageSize: INITIAL_PAGE_SIZE } },
    }),
    [],
  );
  const handleRowClick = React.useCallback<GridEventListener<'rowClick'>>(
    ({ row }) => {
      navigate(`/authors/${row.id}`);
    },
    [navigate],
  );

  const handleCreateClick = React.useCallback(() => {
    navigate('/authors/new');
  }, [navigate]);

  const handleRowEdit = React.useCallback(
    (author: AuthorResponse) => () => {
      navigate(`/authors/${author.id}/edit`);
    },
    [navigate],
  );

  const handleRowDelete = React.useCallback(
    (author: AuthorResponse) => async () => {
      const confirmed = await dialogs.confirm(
        `Do you wish to delete ${author.name}? This will also delete all their sales.`,
        {
          title: 'Delete author?',
          severity: 'error',
          okText: 'Delete',
          cancelText: 'Cancel',
        },
      );

      if (confirmed) {
        setIsLoading(true);
        try {
          await AuthorsService.deleteAuthor(Number(author.id));
          notifications.show('Author deleted successfully.', {
            severity: 'success',
            autoHideDuration: 3000,
          });
          loadData();
        } catch (deleteError) {
          notifications.show(`Failed to delete author. Reason: ${(deleteError as Error).message}`, {
            severity: 'error',
            autoHideDuration: 3000,
          });
        }
        setIsLoading(false);
      }
    },
    [dialogs, notifications, loadData],
  );

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'email', headerName: 'Email', width: 220 },
      {
        field: 'bookCount',
        headerName: 'Books',
        type: 'number',
        width: 90,
      },
      {
        field: 'totalRoyalty',
        headerName: 'Total Royalty',
        type: 'number',
        width: 140,
        valueFormatter: (value) => (value != null ? currencyFormatter.format(Number(value)) : ''),
      },
      {
        field: 'paidRoyalty',
        headerName: 'Paid Royalty',
        type: 'number',
        width: 130,
        valueFormatter: (value) => (value != null ? currencyFormatter.format(Number(value)) : ''),
      },
      {
        field: 'unpaidRoyalty',
        headerName: 'Unpaid Royalty',
        type: 'number',
        width: 130,
        valueFormatter: (value) => (value != null ? currencyFormatter.format(Number(value)) : ''),
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

  return (
    <PageContainer
      title="Authors"
      breadcrumbs={[{ title: 'Authors' }]}
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
            placeholder="Search name or email..."
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
            initialState={initialState}
            pageSizeOptions={[
              10,
              INITIAL_PAGE_SIZE,
              50,
              100,
              { value: SHOW_ALL_SIZE, label: 'All' },
            ]}
            slotProps={{
              loadingOverlay: {
                variant: 'circular-progress',
                noRowsVariant: 'circular-progress',
              },
              baseIconButton: { size: 'small' },
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
                { outline: 'none' },
              [`& .${gridClasses.row}:hover`]: { cursor: 'pointer' },
            }}
          />
        )}
      </Box>
    </PageContainer>
  );
}
