import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SortIcon from '@mui/icons-material/Sort';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { GridSortModel } from '@mui/x-data-grid';
import * as React from 'react';

export interface SortOption {
  field: string;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { field: 'name', label: 'Name' },
  { field: 'email', label: 'Email' },
  { field: 'bookCount', label: 'Books' },
  { field: 'totalRoyalty', label: 'Total Royalty' },
  { field: 'paidRoyalty', label: 'Paid Royalty' },
  { field: 'unpaidRoyalty', label: 'Unpaid Royalty' },
];

interface SortRow {
  id: number;
  field: string;
  direction: 'asc' | 'desc';
}

interface AuthorSortDialogProps {
  open: boolean;
  onClose: () => void;
  currentSortModel: GridSortModel;
  onApply: (sortModel: GridSortModel) => void;
}

let nextId = 1;

export default function AuthorSortDialog({
  open,
  onClose,
  currentSortModel,
  onApply,
}: AuthorSortDialogProps) {
  const [rows, setRows] = React.useState<SortRow[]>([]);
  const dragIndex = React.useRef<number | null>(null);
  const dragOverIndex = React.useRef<number | null>(null);

  // Sync with current sort model when dialog opens
  React.useEffect(() => {
    if (open) {
      if (currentSortModel.length > 0) {
        setRows(
          currentSortModel.map((s) => ({
            id: nextId++,
            field: s.field,
            direction: s.sort ?? 'asc',
          })),
        );
      } else {
        setRows([{ id: nextId++, field: 'name', direction: 'asc' }]);
      }
    }
  }, [open, currentSortModel]);

  const usedFields = rows.map((r) => r.field);

  const handleAddRow = () => {
    const available = SORT_OPTIONS.find((o) => !usedFields.includes(o.field));
    if (!available) return;
    setRows((prev) => [...prev, { id: nextId++, field: available.field, direction: 'asc' }]);
  };

  const handleRemoveRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleFieldChange = (id: number, field: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, field } : r)));
  };

  const handleDirectionToggle = (id: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, direction: r.direction === 'asc' ? 'desc' : 'asc' } : r,
      ),
    );
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverIndex.current = index;
    if (dragIndex.current === null || dragIndex.current === index) return;
    setRows((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex.current!, 1);
      updated.splice(index, 0, moved);
      dragIndex.current = index;
      return updated;
    });
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    dragOverIndex.current = null;
  };

  const handleApply = () => {
    const sortModel: GridSortModel = rows
      .filter((r) => r.field)
      .map((r) => ({ field: r.field, sort: r.direction }));
    onApply(sortModel);
    onClose();
  };

  const handleReset = () => {
    setRows([{ id: nextId++, field: 'name', direction: 'asc' }]);
  };

  const canAddMore = usedFields.length < SORT_OPTIONS.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SortIcon fontSize="small" color="action" />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Sort Order
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Drag to reorder. First row is the primary sort.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {rows.map((row, index) => {
            const availableOptions = SORT_OPTIONS.filter(
              (o) => o.field === row.field || !usedFields.includes(o.field),
            );

            return (
              <Box
                key={row.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  cursor: 'grab',
                  '&:active': { cursor: 'grabbing' },
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  transition: 'border-color 0.15s, background-color 0.15s',
                }}
              >
                {/* Priority badge */}
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: index === 0 ? 'primary.main' : 'action.selected',
                    color: index === 0 ? 'primary.contrastText' : 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </Box>

                <DragIndicatorIcon
                  fontSize="small"
                  sx={{ color: 'text.disabled', flexShrink: 0 }}
                />

                {/* Field selector */}
                <Select
                  value={row.field}
                  onChange={(e) => handleFieldChange(row.id, e.target.value)}
                  size="small"
                  variant="standard"
                  disableUnderline
                  sx={{ flex: 1, fontWeight: 500 }}
                >
                  {availableOptions.map((o) => (
                    <MenuItem key={o.field} value={o.field}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>

                {/* Asc/Desc toggle */}
                <Tooltip title={row.direction === 'asc' ? 'Ascending' : 'Descending'}>
                  <Chip
                    size="small"
                    icon={
                      row.direction === 'asc' ? (
                        <KeyboardArrowUpIcon fontSize="small" />
                      ) : (
                        <KeyboardArrowDownIcon fontSize="small" />
                      )
                    }
                    label={row.direction === 'asc' ? 'Asc' : 'Desc'}
                    onClick={() => handleDirectionToggle(row.id)}
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      flexShrink: 0,
                      fontWeight: 500,
                      borderColor: row.direction === 'asc' ? 'primary.main' : 'warning.main',
                      color: row.direction === 'asc' ? 'primary.main' : 'warning.dark',
                      '& .MuiChip-icon': {
                        color: row.direction === 'asc' ? 'primary.main' : 'warning.dark',
                      },
                    }}
                  />
                </Tooltip>

                {/* Remove button */}
                <IconButton
                  size="small"
                  onClick={() => handleRemoveRow(row.id)}
                  disabled={rows.length === 1}
                  sx={{ flexShrink: 0, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}

          {/* Add sort row */}
          {canAddMore && (
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddRow}
              size="small"
              variant="text"
              sx={{ alignSelf: 'flex-start', color: 'text.secondary', mt: 0.5 }}
            >
              Add sort field
            </Button>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button onClick={handleReset} size="small" color="inherit" sx={{ color: 'text.secondary' }}>
          Reset
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} size="small" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleApply} variant="contained" size="small">
            Apply Sort
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
