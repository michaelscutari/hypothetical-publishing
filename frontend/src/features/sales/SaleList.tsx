import AddIcon from '@mui/icons-material/Add';
import CommentIcon from '@mui/icons-material/Comment';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { type AuthorResponse, AuthorsService, type SaleResponse, SalesService } from '@/api';
import PageContainer from '@/components/PageContainer';
import PaidStatusChip from '@/components/PaidStatusChip';
import StandardDataGrid from '@/components/StandardDataGrid';
import { useDialogs } from '@/hooks/useDialogs/useDialogs';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import { useServerDataGrid } from '@/hooks/useServerDataGrid';
import { getErrorMessage } from '@/utils/error';
import { formatCurrency, formatCurrencyWithCode, formatMonthYear } from '@/utils/formatting';
import type { GridRowClassNameParams } from '@mui/x-data-grid';
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

export default function SaleList() {
  const navigate = useNavigate();
  const dialogs = useDialogs();
  const notifications = useNotifications();

  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: 'saleYear', sort: 'desc' },
  ]);

  const [startDate, setStartDate] = React.useState<Dayjs | null>(null);
  const [endDate, setEndDate] = React.useState<Dayjs | null>(null);
  const [selectedAuthor, setSelectedAuthor] = React.useState<AuthorResponse | null>(null);
  const [saleSource, setSaleSource] = React.useState<string>('all');
  const [format, setFormat] = React.useState<string>('all');
  const [distributor, setDistributor] = React.useState<string>('all');
  const [projectedStatus, setProjectedStatus] = React.useState<string>('all');
  const [authors, setAuthors] = React.useState<AuthorResponse[]>([]);

  const fetchFn = React.useCallback(
    async (params: { page: number; pageSize: number; showAll: boolean }) => {
      const sortFields = sortModel?.map((col) => col.field);
      const sortDirections = sortModel?.map((col) => col.sort ?? 'desc');

      const startDateParam = startDate
        ? startDate.startOf('month').format('YYYY-MM-DD')
        : undefined;
      const endDateParam = endDate ? endDate.endOf('month').format('YYYY-MM-DD') : undefined;

      const authorIdParam = selectedAuthor?.id;
      const saleSourceParam =
        saleSource === 'all'
          ? undefined
          : (saleSource.toUpperCase() as 'DISTRIBUTOR' | 'HAND_SOLD' | 'KICKSTARTER');
      const distributorParam =
        distributor === 'all'
          ? undefined
          : (distributor.toUpperCase() as 'INGRAM_SPARK' | 'AMAZON' | 'OTHER');
      const formatParam =
        format === 'all'
          ? undefined
          : (format.toUpperCase() as 'PRINT' | 'EBOOK' | 'KINDLE_UNLIMITED');
      const isProjectedParam =
        projectedStatus === 'all' ? undefined : projectedStatus === 'projected';

      return SalesService.getSales(
        params.page,
        params.pageSize,
        params.showAll,
        sortFields,
        sortDirections,
        startDateParam,
        endDateParam,
        authorIdParam,
        saleSourceParam,
        distributorParam,
        formatParam,
        isProjectedParam,
      );
    },
    [
      sortModel,
      startDate,
      endDate,
      selectedAuthor,
      saleSource,
      distributor,
      format,
      projectedStatus,
    ],
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
    } catch {
      // silent — empty author filter is acceptable
    }
  }, []);

  React.useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  const handleRowClick = React.useCallback<GridEventListener<'rowClick'>>(
    ({ row }, event) => {
      if (event.button === 1 || event.metaKey || event.ctrlKey) {
        window.open(`/sales/${row.id}`, '_blank', 'noopener,noreferrer');
        return;
      }
      if (event.button !== 0) return;
      navigate(`/sales/${row.id}`);
    },
    [navigate],
  );

  const handleCreateClick = React.useCallback(() => navigate('/sales/new'), [navigate]);
  const handleImportClick = React.useCallback(() => navigate('/sales/import'), [navigate]);

  const handleExportClick = React.useCallback(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate.startOf('month').format('YYYY-MM-DD'));
    if (endDate) params.set('endDate', endDate.endOf('month').format('YYYY-MM-DD'));
    if (selectedAuthor?.id) params.set('authorId', String(selectedAuthor.id));
    if (saleSource !== 'all') params.set('saleSource', saleSource.toUpperCase());
    if (distributor !== 'all') params.set('distributor', distributor.toUpperCase());
    if (format !== 'all') params.set('format', format.toUpperCase());
    if (projectedStatus === 'projected') params.set('isProjected', 'true');
    if (projectedStatus === 'actual') params.set('isProjected', 'false');
    window.open(`/api/sales/export?${params.toString()}`, '_blank');
  }, [startDate, endDate, selectedAuthor, saleSource, distributor, format, projectedStatus]);

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
            `Failed to delete sale record. Reason: ${getErrorMessage(deleteError)}`,
            { severity: 'error', autoHideDuration: 3000 },
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
        flex: 1.5,
        minWidth: 150,
        renderCell: (params) => {
          const isProjected = params.row.isProjected;
          return (
            <Link
              to={`/books/${params.row.bookId}`}
              style={{
                color: 'inherit',
                textDecoration: 'none',
                opacity: isProjected ? 0.5 : 1,
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
              {params.row.bookTitle}
            </Link>
          );
        },
      },
      {
        field: 'bookAuthor',
        headerName: 'Author',
        flex: 1,
        minWidth: 120,
      },
      {
        field: 'saleSource',
        headerName: 'Source',
        flex: 1,
        minWidth: 130,
        renderCell: (params) => {
          const source = params.row.saleSource;
          const dist = params.row.distributor;

          let sourceLabel = source;
          if (source === 'DISTRIBUTOR') sourceLabel = 'Distributor';
          else if (source === 'HAND_SOLD') sourceLabel = 'Hand Sold';
          else if (source === 'KICKSTARTER') sourceLabel = 'Kickstarter';

          let distLabel: string | null = null;
          if (source === 'DISTRIBUTOR' && dist) {
            if (dist === 'INGRAM_SPARK') distLabel = 'Ingram Spark';
            else if (dist === 'AMAZON') distLabel = 'Amazon';
            else if (dist === 'OTHER') distLabel = 'Other';
          }

          return (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                py: 1,
              }}
            >
              <Typography variant="body2">{sourceLabel}</Typography>
              {distLabel && (
                <Typography variant="caption" color="text.secondary">
                  {distLabel}
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: 'format',
        headerName: 'Format',
        flex: 0.9,
        minWidth: 110,
        valueGetter: (_value, row) => {
          if (row.format === 'PRINT') return 'Print';
          if (row.format === 'EBOOK') return 'Ebook';
          if (row.format === 'KINDLE_UNLIMITED') return 'Kindle Unlimited';
          return row.format;
        },
      },
      {
        field: 'saleYear',
        headerName: 'Date',
        flex: 1,
        minWidth: 120,
        valueGetter: (_value, row) => formatMonthYear(row.saleMonth, row.saleYear),
      },
      {
        field: 'quantitySold',
        headerName: 'Qty / KENP',
        type: 'number',
        flex: 0.6,
        minWidth: 75,
        valueGetter: (_value, row) =>
          row.format === 'KINDLE_UNLIMITED' ? row.kenp : row.quantitySold,
      },
      {
        field: 'originalPublisherRevenue',
        headerName: 'Revenue',
        flex: 1,
        minWidth: 130,
        renderCell: (params) => {
          const original = Number(params.row.originalPublisherRevenue);
          const usd = Number(params.row.publisherRevenue);
          const currency = params.row.saleCurrency;
          const isSameCurrency = currency === 'USD';
          return (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                py: 1,
              }}
            >
              <Typography variant="body2">{formatCurrencyWithCode(original, currency)}</Typography>
              {!isSameCurrency && (
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(usd)} USD
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: 'authorRoyalty',
        headerName: 'Royalty',
        type: 'number',
        flex: 0.8,
        minWidth: 90,
        valueFormatter: (value) => formatCurrency(Number(value)),
      },
      {
        field: 'comment',
        headerName: '',
        width: 50,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const comment = params.row.comment;
          if (!comment) return null;
          return (
            <Tooltip title={comment} placement="top" enterDelay={300}>
              <IconButton
                size="small"
                onClick={(e) => e.stopPropagation()}
                aria-label="View comment"
              >
                <CommentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        },
      },
      {
        // align both header and content to center
        field: 'hasAuthorBeenPaid',
        headerName: 'Paid',
        flex: 0.7,
        minWidth: 90,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => <PaidStatusChip paid={params.row.hasAuthorBeenPaid} />,
      },
      {
        field: 'actions',
        type: 'actions',
        width: 45,
        align: 'right',
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="delete-item"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleRowDelete(row)}
          />,
        ],
      },
    ],
    [handleRowDelete],
  );

  const pageTitle = 'Records';

  const getRowClassName = React.useCallback((params: GridRowClassNameParams<SaleResponse>) => {
    if (params.row?.isProjected) {
      return 'projected-row';
    }
    return '';
  }, []);

  return (
    <PageContainer
      title={pageTitle}
      breadcrumbs={[{ title: pageTitle }]}
      actions={
        <Stack spacing={1.25} sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ButtonGroup variant="outlined" size="small" aria-label="sales actions">
              <Button variant="contained" onClick={handleCreateClick} startIcon={<AddIcon />}>
                New Sale
              </Button>
              <Button onClick={handleImportClick}>Import</Button>
              <Button onClick={handleExportClick}>Export</Button>
            </ButtonGroup>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            flexWrap="wrap"
            useFlexGap
            sx={{ fontSize: '0.875rem', color: 'text.secondary' }}
          >
            <span style={{ opacity: 0.5 }}>●</span>
            <span>Greyed out records are projected sales (unreleased books)</span>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap" useFlexGap>
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
                  field: { clearable: true },
                }}
                sx={{ width: 150 }}
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
                  field: { clearable: true },
                }}
                sx={{ width: 150 }}
              />
            </LocalizationProvider>

            <Autocomplete
              options={authors}
              getOptionLabel={(author) => author.name}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Author"
                  size="small"
                  placeholder="All Authors"
                  InputLabelProps={{ shrink: true }}
                />
              )}
              value={selectedAuthor}
              onChange={(_, newValue) => setSelectedAuthor(newValue)}
              sx={{ minWidth: 150 }}
            />

            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Sale Source</InputLabel>
              <Select
                value={saleSource}
                label="Sale Source"
                onChange={(e: SelectChangeEvent) => setSaleSource(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="distributor">Distributor</MenuItem>
                <MenuItem value="hand_sold">Hand Sold</MenuItem>
                <MenuItem value="kickstarter">Kickstarter</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Projected Status</InputLabel>
              <Select
                value={projectedStatus}
                label="Projected Status"
                onChange={(e: SelectChangeEvent) => setProjectedStatus(e.target.value)}
              >
                <MenuItem value="all">All Sales</MenuItem>
                <MenuItem value="actual">Actual Only</MenuItem>
                <MenuItem value="projected">Projected Only</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 110 }}>
              <InputLabel shrink>Format</InputLabel>
              <Select
                value={format}
                label="Format"
                onChange={(e: SelectChangeEvent) => setFormat(e.target.value)}
                notched
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="print">Print</MenuItem>
                <MenuItem value="ebook">Ebook</MenuItem>
                <MenuItem value="kindle_unlimited">Kindle Unlimited</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 155 }}>
              <InputLabel>Distributor</InputLabel>
              <Select
                value={distributor}
                label="Distributor"
                onChange={(e: SelectChangeEvent) => setDistributor(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="amazon">Amazon</MenuItem>
                <MenuItem value="ingram_spark">Ingram Spark</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Stack>
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
          getRowClassName={getRowClassName}
          getRowHeight={() => 'auto'}
          sx={{
            '& .projected-row': {
              opacity: 0.55,
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
        />
      </Box>
    </PageContainer>
  );
}
