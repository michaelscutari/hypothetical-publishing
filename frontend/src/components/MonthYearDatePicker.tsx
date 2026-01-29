import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import { TextField } from '@mui/material';

export default function MonthYearPicker({
  value,
  onChange,
}: {
  value: Dayjs | null;
  onChange: (v: Dayjs | null) => void;
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        views={['year', 'month']}
        format="MM/YYYY"
        value={value}
        onChange={(newValue) => onChange(newValue)}
        slotProps={
          {textField: { helperText: 'MM/YYYY', fullWidth: true } }
        }
      />
    </LocalizationProvider>
  );
}
