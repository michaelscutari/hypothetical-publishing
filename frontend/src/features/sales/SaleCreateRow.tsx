import CommentIcon from '@mui/icons-material/Comment';
import DeleteIcon from '@mui/icons-material/Delete';
import Autocomplete, { type AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { type Dayjs } from 'dayjs';
import * as React from 'react';
import { SaleRequest, type BookResponse } from '@/api';
import { isValidMonetaryInput } from '@/utils/monetary';
import { type SaleRecordInput } from './saleCreateTypes';

interface SaleCreateRowProps {
  record: SaleRecordInput;
  index: number;
  books: BookResponse[];
  isLoadingBooks: boolean;
  bookSearchInput: string;
  totalRecords: number;
  onActivateRow: (index: number) => void;
  onUpdateRecord: (index: number, updates: Partial<SaleRecordInput>) => void;
  onBookSearchInputChange: (value: string) => void;
  onLoadBooks: (query: string) => void;
  onOpenCommentDialog: (index: number) => void;
  onDeleteRecord: (index: number) => void;
}

export default function SaleCreateRow({
  record,
  index,
  books,
  isLoadingBooks,
  bookSearchInput,
  totalRecords,
  onActivateRow,
  onUpdateRecord,
  onBookSearchInputChange,
  onLoadBooks,
  onOpenCommentDialog,
  onDeleteRecord,
}: SaleCreateRowProps) {
  const handleBookChange = React.useCallback(
    (_event: React.SyntheticEvent, value: BookResponse | null) => {
      onUpdateRecord(index, { book: value, errors: {} });
    },
    [index, onUpdateRecord],
  );

  const handleDateChange = React.useCallback(
    (value: Dayjs | null) => {
      onUpdateRecord(index, { saleDate: value, errors: {}, dateError: null });
    },
    [index, onUpdateRecord],
  );

  const handleDateError = React.useCallback(
    (error: unknown) => {
      let errorMessage: string | null = null;
      if (error === 'minDate') errorMessage = 'Date cannot be before January 1900';
      else if (error === 'maxDate') errorMessage = 'Date cannot be in the future';
      else if (error === 'invalidDate') errorMessage = 'Invalid date format';
      onUpdateRecord(index, { dateError: errorMessage });
    },
    [index, onUpdateRecord],
  );

  const handleSaleSourceChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateRecord(index, {
        saleSource: event.target.value as SaleRequest.saleSource,
        errors: {},
      });
    },
    [index, onUpdateRecord],
  );

  const handleQuantityChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.trim();
      if (value === '') {
        onUpdateRecord(index, { quantitySold: null, errors: {} });
        return;
      }
      if (!/^\d+$/.test(value)) return;
      const parsed = Number.parseInt(value, 10);
      if (!Number.isSafeInteger(parsed) || parsed <= 0) return;
      onUpdateRecord(index, { quantitySold: parsed, errors: {} });
    },
    [index, onUpdateRecord],
  );

  const handleRevenueChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (isValidMonetaryInput(value)) {
        const parsed = value === '' ? null : Number.parseFloat(value);
        const publisherRevenue =
          typeof parsed === 'number' && !Number.isNaN(parsed) ? parsed : null;
        onUpdateRecord(index, { publisherRevenueInput: value, publisherRevenue, errors: {} });
      }
    },
    [index, onUpdateRecord],
  );

  const handlePaidChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateRecord(index, { hasAuthorBeenPaid: event.target.checked, errors: {} });
    },
    [index, onUpdateRecord],
  );

  return (
    <TableRow
      sx={{
        opacity: record.isPlaceholder ? 0.5 : 1,
        backgroundColor: record.isPlaceholder ? 'action.hover' : 'transparent',
      }}
    >
      <TableCell>
        <Autocomplete
          size="small"
          options={books}
          value={record.book}
          onChange={handleBookChange}
          loading={isLoadingBooks}
          onOpen={() => {
            void onLoadBooks(bookSearchInput);
          }}
          onInputChange={(_, value) => {
            onActivateRow(index);
            onBookSearchInputChange(value);
          }}
          onFocus={() => onActivateRow(index)}
          getOptionLabel={(option) => `${option.title} - ${option.author} (${option.isbn13})`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          filterOptions={(x) => x}
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField
              {...params}
              placeholder="Search book..."
              error={!!record.errors.book}
              onFocus={() => onActivateRow(index)}
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <Box>
                <Typography variant="body2">{option.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.author} • {option.isbn13}
                </Typography>
              </Box>
            </li>
          )}
        />
      </TableCell>

      <TableCell>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={record.saleDate}
            onChange={handleDateChange}
            onError={handleDateError}
            views={['year', 'month']}
            openTo="year"
            format="MM/YYYY"
            minDate={dayjs('1900-01-01')}
            maxDate={dayjs()}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                error: !!record.errors.saleDate || !!record.dateError,
                placeholder: 'MM/YYYY',
                onFocus: () => onActivateRow(index),
              },
              field: { clearable: true },
            }}
          />
        </LocalizationProvider>
      </TableCell>

      <TableCell>
        <TextField
          select
          size="small"
          value={record.saleSource}
          onFocus={() => onActivateRow(index)}
          onChange={handleSaleSourceChange}
          error={!!record.errors.saleSource}
          helperText={record.errors.saleSource}
          fullWidth
        >
          <MenuItem value={SaleRequest.saleSource.DISTRIBUTOR}>Distributor</MenuItem>
          <MenuItem value={SaleRequest.saleSource.HAND_SOLD}>Handsold</MenuItem>
        </TextField>
      </TableCell>

      <TableCell>
        <TextField
          size="small"
          type="text"
          placeholder="1"
          value={Number.isFinite(record.quantitySold) ? record.quantitySold : ''}
          onFocus={() => onActivateRow(index)}
          onChange={handleQuantityChange}
          error={!!record.errors.quantitySold}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 1 }}
          fullWidth
        />
      </TableCell>

      <TableCell>
        <TextField
          size="small"
          type="text"
          placeholder="0.00"
          value={record.publisherRevenueInput}
          onFocus={() => onActivateRow(index)}
          onChange={handleRevenueChange}
          disabled={record.saleSource === SaleRequest.saleSource.HAND_SOLD}
          error={!!record.errors.publisherRevenue}
          inputProps={{ inputMode: 'decimal' }}
          fullWidth
          InputProps={{
            startAdornment: <Typography>$</Typography>,
          }}
        />
      </TableCell>

      <TableCell>
        <TextField
          size="small"
          type="text"
          placeholder="0.00"
          value={record.authorRoyalty ?? ''}
          onFocus={() => onActivateRow(index)}
          error={!!record.errors.authorRoyalty}
          helperText={record.errors.authorRoyalty}
          inputProps={{ inputMode: 'decimal', readOnly: true }}
          fullWidth
          InputProps={{
            startAdornment: <Typography>$</Typography>,
          }}
        />
      </TableCell>

      <TableCell>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
            p: 0.5,
            borderRadius: 1,
          }}
          onClick={() => onOpenCommentDialog(index)}
        >
          <IconButton size="small" sx={{ p: 0.25 }}>
            <CommentIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="body2"
            sx={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: record.comment ? 'text.primary' : 'text.disabled',
            }}
          >
            {record.comment || 'Add comment...'}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Switch
              checked={record.hasAuthorBeenPaid}
              onFocus={() => onActivateRow(index)}
              onChange={handlePaidChange}
            />
          }
          label={record.hasAuthorBeenPaid ? 'Paid' : 'Unpaid'}
        />
      </TableCell>

      <TableCell align="right">
        {!record.isPlaceholder && totalRecords > 1 && (
          <IconButton size="small" onClick={() => onDeleteRecord(index)} aria-label="delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );
}
