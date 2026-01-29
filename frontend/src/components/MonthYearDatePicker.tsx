import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import { TextField } from '@mui/material';

//TODO: implement into pages that need month/year picker
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
        slots={{ textField: TextField }}
        slotProps={
          {textField: { helperText: 'MM/YYYY', fullWidth: true } }
        }
      />
    </LocalizationProvider>
  );
}
