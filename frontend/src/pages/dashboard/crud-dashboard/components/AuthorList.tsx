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
import { AuthorsService, type AuthorResponse } from '../../../../api';
import { formatCurrency } from '../../../../utils/formatting';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useServerDataGrid } from '../../../../hooks/useServerDataGrid';
import { useDialogs } from '../hooks/useDialogs/useDialogs';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';
import SortDialog, { type SortOption } from './SortDialog';
import StandardDataGrid from './StandardDataGrid';

const AUTHOR_SORT_OPTIONS: SortOption[] = [
  { field: 'name', label: 'Name' },
  { field: 'email', label: 'Email' },
  { field: 'bookCount', label: 'Books' },
  { field: 'totalRoyalty', label: 'Total Royalty' },
  { field: 'paidRoyalty', label: 'Paid Royalty' },
  { field: 'unpaidRoyalty', label: 'Unpaid Royalty' },
];

const AUTHOR_DEFAULT_SORT: GridSortModel = [{ field: 'name', sort: 'asc' }];

export default function AuthorList() {
  const navigate = useNavigate();
  const dialogs = useDialogs();
  const notifications = useNotifications();

  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, flush] = useDebounce(searchQuery, 300);
  const [multiSortOpen, setMultiSortOpen] = React.useState(false);

  const fetchFn = React.useCallback(
    async (params: { page: number; pageSize: number; showAll: boolean }) => {
      return AuthorsService.getAllAuthors(
        params.page,
        params.pageSize,
        params.showAll,
        debouncedQuery || undefined,
        sortModel.map((s) => s.field),
        sortModel.map((s) => s.sort ?? 'asc'),
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
  } = useServerDataGrid<AuthorResponse>({ fetchFn, initialPageSize: 25 });

  const handleRowClick = React.useCallback<GridEventListener<'rowClick'>>(
    ({ row }) => navigate(`/authors/${row.id}`),
    [navigate],
  );

  const handleCreateClick = React.useCallback(() => navigate('/authors/new'), [navigate]);

  const handleRowEdit = React.useCallback(
    (author: AuthorResponse) => () => navigate(`/authors/${author.id}/edit`),
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
          refresh();
        } catch (deleteError) {
          notifications.show(`Failed to delete author. Reason: ${(deleteError as Error).message}`, {
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
        valueFormatter: (value) => (value != null ? formatCurrency(Number(value)) : '—'),
      },
      {
        field: 'paidRoyalty',
        headerName: 'Paid Royalty',
        type: 'number',
        width: 130,
        valueFormatter: (value) => (value != null ? formatCurrency(Number(value)) : '—'),
      },
      {
        field: 'unpaidRoyalty',
        headerName: 'Unpaid Royalty',
        type: 'number',
        width: 130,
        valueFormatter: (value) => (value != null ? formatCurrency(Number(value)) : '—'),
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
              <IconButton size="small" aria-label="refresh" onClick={refresh}>
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
        sortOptions={AUTHOR_SORT_OPTIONS}
        defaultSort={AUTHOR_DEFAULT_SORT}
      />
    </PageContainer>
  );
}
