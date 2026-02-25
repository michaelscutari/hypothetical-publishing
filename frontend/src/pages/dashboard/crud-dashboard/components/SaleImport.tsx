import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { type Dayjs } from 'dayjs';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SalesService,
  type IngramImportResponse,
  type ParsingError,
  type SaleResponse,
} from '../../../../api';
import { MONTH_NAMES_SHORT as MONTH_NAMES } from '../../../../constants/months';
import useNotifications from '../hooks/useNotifications/useNotifications';
import PageContainer from './PageContainer';

function formatMonthYear(sale: SaleResponse) {
  if (!sale.saleMonth || !sale.saleYear) return '';
  return `${MONTH_NAMES[sale.saleMonth - 1]} ${sale.saleYear}`;
}

type ErrorState = {
  csvErrors: ParsingError[];
  savingErrors: ParsingError[];
};

export default function SaleImport() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const fileInputId = React.useId();

  const [saleDate, setSaleDate] = React.useState<Dayjs | null>(null);
  const [csvFile, setCsvFile] = React.useState<File | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [errorState, setErrorState] = React.useState<ErrorState>({
    csvErrors: [],
    savingErrors: [],
  });
  const [isErrorDialogOpen, setIsErrorDialogOpen] = React.useState(false);
  const [previewSales, setPreviewSales] = React.useState<SaleResponse[]>([]);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = React.useState(false);

  const hasErrors =
    errorState.csvErrors.length > 0 || errorState.savingErrors.length > 0;

  const handleBack = React.useCallback(() => {
    navigate('/sales');
  }, [navigate]);

  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0] ?? null;
      setCsvFile(file);
      setValidationError(null);
      event.currentTarget.value = '';
    },
    [],
  );

  const buildRequest = React.useCallback(
    (isPreview: boolean) => {
      if (!saleDate || !csvFile) return null;
      return {
        saleMonth: saleDate.month() + 1,
        saleYear: saleDate.year(),
        csvFile,
        isPreview,
      };
    },
    [csvFile, saleDate],
  );

  const handleResponse = React.useCallback((response: IngramImportResponse) => {
    const csvErrors = response.csvErrors ?? [];
    const savingErrors = response.savingErrors ?? [];
    if (csvErrors.length > 0 || savingErrors.length > 0) {
      setErrorState({ csvErrors, savingErrors });
      setIsErrorDialogOpen(true);
      return false;
    }
    const sales = response.savedSales ?? [];
    setPreviewSales(sales);
    setIsPreviewDialogOpen(true);
    return true;
  }, []);

  const handlePreview = React.useCallback(async () => {
    setValidationError(null);
    if (!saleDate || !csvFile) {
      setValidationError('Please choose a month/year and a CSV file.');
      return;
    }

    const payload = buildRequest(true);
    if (!payload) return;

    setIsSubmitting(true);
    try {
      const response = await SalesService.previewCsv(payload);
      handleResponse(response);
    } catch (error) {
      setValidationError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [buildRequest, csvFile, handleResponse, saleDate]);

  const handleCommit = React.useCallback(async () => {
    const payload = buildRequest(false);
    if (!payload) return;

    setIsSubmitting(true);
    try {
      const response = await SalesService.previewCsv(payload);
      const csvErrors = response.csvErrors ?? [];
      const savingErrors = response.savingErrors ?? [];

      if (csvErrors.length > 0 || savingErrors.length > 0) {
        setIsPreviewDialogOpen(false);
        setErrorState({ csvErrors, savingErrors });
        setIsErrorDialogOpen(true);
        return;
      }

      const committedCount = response.savedSales?.length ?? 0;
      notifications.show(`Imported ${committedCount} sales successfully.`, {
        severity: 'success',
        autoHideDuration: 3000,
      });
      navigate('/sales');
    } catch (error) {
      setValidationError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [buildRequest, navigate, notifications]);

  const renderErrorTable = React.useCallback((title: string, errors: ParsingError[]) => {
    if (errors.length === 0) return null;
    return (
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          {title}
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={90}>Row</TableCell>
                <TableCell width={240}>Message</TableCell>
                <TableCell>Raw Line</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {errors.map((error, index) => (
                <TableRow key={`${title}-${index}`}>
                  <TableCell>{error.rowNumber ?? '-'}</TableCell>
                  <TableCell>{error.errorMessage ?? 'Unknown error'}</TableCell>
                  <TableCell>{error.rawLine?.join(' | ') ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }, []);

  return (
    <PageContainer
      breadcrumbs={[
        { title: 'Sales Records', path: '/sales' },
        { title: 'Import CSV' },
      ]}
      actions={
        <Button variant="text" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to Sales
        </Button>
      }
    >
      <Stack spacing={2}>
        <Paper sx={{ p: 3 }} variant="outlined">
          <Stack spacing={2}>
            <Typography variant="h5">Import Ingram CSV</Typography>
            <Typography variant="body2" color="text.secondary">
              Upload a CSV and preview the sales before committing them to the repository.
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Sale Month/Year"
                value={saleDate}
                onChange={(v) => setSaleDate(v)}
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
              />
            </LocalizationProvider>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                component="label"
                htmlFor={fileInputId}
              >
                Choose CSV
              </Button>
              <input
                id={fileInputId}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={handleFileChange}
              />
              <TextField
                label="Selected File"
                value={csvFile?.name ?? ''}
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
                placeholder="No file selected"
              />
            </Stack>

            {validationError && !isPreviewDialogOpen ? (
              <Alert severity="error">{validationError}</Alert>
            ) : null}

            <Box>
              <Button variant="contained" onClick={handlePreview} disabled={isSubmitting}>
                Preview Import
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Stack>

      <Dialog
        open={isErrorDialogOpen && hasErrors}
        onClose={() => setIsErrorDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import Errors</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              Fix the issues below and try the import again.
            </Typography>
            {renderErrorTable('CSV Parsing Errors', errorState.csvErrors)}
            {renderErrorTable('Mapping Errors', errorState.savingErrors)}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsErrorDialogOpen(false)}>Back to Import</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Preview Sales Import</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Review the sales below. Confirm to import {previewSales.length} records.
            </Typography>
            {validationError ? <Alert severity="error">{validationError}</Alert> : null}
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 480 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Book</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Month/Year</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Publisher Revenue</TableCell>
                    <TableCell align="right">Author Royalty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewSales.map((sale, index) => (
                    <TableRow key={`${sale.bookId ?? 'book'}-${index}`}>
                      <TableCell>{sale.bookTitle ?? `Book ${sale.bookId ?? ''}`}</TableCell>
                      <TableCell>{sale.bookAuthor ?? '-'}</TableCell>
                      <TableCell>{formatMonthYear(sale)}</TableCell>
                      <TableCell align="right">{sale.quantitySold ?? 0}</TableCell>
                      <TableCell align="right">
                        {sale.publisherRevenue != null
                          ? `$${Number(sale.publisherRevenue).toFixed(2)}`
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {sale.authorRoyalty != null
                          ? `$${Number(sale.authorRoyalty).toFixed(2)}`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPreviewDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCommit} disabled={isSubmitting}>
            Confirm Import
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
