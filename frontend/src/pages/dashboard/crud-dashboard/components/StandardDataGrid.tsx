import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { DataGrid, gridClasses, type DataGridProps } from '@mui/x-data-grid';
import type { SxProps, Theme } from '@mui/material/styles';

const SHOW_ALL_SIZE = -1;

const BASE_SX: SxProps<Theme> = {
  '--DataGrid-rowBorderColor': (theme: Theme) => theme.palette.divider,
  '--DataGrid-containerBackground': (theme: Theme) => theme.palette.background.paper,
  borderColor: 'divider',
  borderRadius: 2,
  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
  '& .MuiDataGrid-footerContainer': {
    borderColor: 'divider',
  },
  [`& .${gridClasses.columnHeader}, & .${gridClasses.cell}`]: {
    outline: 'transparent',
  },
  [`& .${gridClasses.columnHeader}:focus-within, & .${gridClasses.cell}:focus-within`]: {
    outline: 'none',
  },
  [`& .${gridClasses.row}:hover`]: {
    cursor: 'pointer',
  },
  [`& .${gridClasses.columnHeaderTitle}`]: {
    fontWeight: 700,
    color: '#5C4033',
  },
};

const BASE_SLOT_PROPS = {
  loadingOverlay: {
    variant: 'circular-progress' as const,
    noRowsVariant: 'circular-progress' as const,
  },
  baseIconButton: {
    size: 'small' as const,
  },
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, { value: SHOW_ALL_SIZE, label: 'All' }];

export interface StandardDataGridProps extends Omit<
  DataGridProps,
  'paginationMode' | 'pageSizeOptions'
> {
  error?: Error | null;
}

export default function StandardDataGrid({ error, sx, slotProps, ...rest }: StandardDataGridProps) {
  if (error) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Alert severity="error">{error.message}</Alert>
      </Box>
    );
  }

  const mergedSx = sx ? [BASE_SX, ...(Array.isArray(sx) ? sx : [sx])] : BASE_SX;

  const mergedSlotProps = slotProps ? { ...BASE_SLOT_PROPS, ...slotProps } : BASE_SLOT_PROPS;

  return (
    <DataGrid
      paginationMode="server"
      sortingMode="server"
      disableRowSelectionOnClick
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      sx={mergedSx}
      slotProps={mergedSlotProps}
      {...rest}
    />
  );
}
