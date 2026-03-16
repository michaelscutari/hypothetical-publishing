import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
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
} from '@/api';
import { getErrorMessage } from '@/utils/error';
import { formatCurrency, formatMonthYear } from '@/utils/formatting';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import PageContainer from '@/components/PageContainer';

type ErrorState = {
  csvErrors: ParsingError[];
  savingErrors: ParsingError[];
};

const ERROR_MESSAGE_MAP: Record<string, string> = {
  'sale.mappingFailed':
    'This row could not be converted to a sale. Check ISBN, quantities, and compensation',
  'book.notFound': 'Book does not exist on the website catalog',
  'isbn.isRequired': 'ISBN is required',
  'title.isRequired': 'Title is required',
  'author.invalidFormat': 'Author must be in "Last, First" format',
  'format.isRequired': 'Format is required',
  'grossQty.isRequired': 'Gross Qty is required',
  'returnedQty.isRequired': 'Returned Qty is required',
  'netQty.isRequired': 'Net Qty is required',
  'netCompensation.mustBeGreaterThanZero': 'Net Compensation must be greater than 0',
  'netCompensation.isRequired': 'Net Compensation is required',
  'salesMarket.isRequired': 'Sales Market is required',
  'returnedQty.mustBeZero': 'Returned Qty must be 0 for Ingram imports',
  'grossQty.mustEqual.netQty': 'Gross Qty must equal Net Qty',
};

const getFriendlyErrorMessage = (error: ParsingError) => {
  const rawMessage = error.errorMessage?.trim();
  if (!rawMessage) return 'Unknown error.';
  const mapped = ERROR_MESSAGE_MAP[rawMessage];
  if (mapped) return mapped;
  if (rawMessage.startsWith('Failed to read file:')) {
    return 'Unable to read the CSV file. Please re-export it and try again.';
  }
  if (/numberformat|for input string/i.test(rawMessage)) {
    return 'One of the numeric fields has an invalid value.';
  }
  return rawMessage;
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

  const hasErrors = errorState.csvErrors.length > 0 || errorState.savingErrors.length > 0;

  const handleBack = React.useCallback(() => {
    navigate('/sales');
  }, [navigate]);

  const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    setCsvFile(file);
    setValidationError(null);
    event.currentTarget.value = '';
  }, []);

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
      setValidationError(getErrorMessage(error));
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
      setValidationError(getErrorMessage(error));
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
              </TableRow>
            </TableHead>
            <TableBody>
              {errors.map((error, index) => (
                <TableRow key={`${title}-${index}`}>
                  <TableCell>{error.rowNumber ?? '-'}</TableCell>
                  <TableCell>{getFriendlyErrorMessage(error)}</TableCell>
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
      breadcrumbs={[{ title: 'Sales Records', path: '/sales' }, { title: 'Import CSV' }]}
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                component="label"
                htmlFor={fileInputId}
                size="small"
                sx={{ height: 40, minWidth: 140 }}
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
            {renderErrorTable('Data Integrity Errors', errorState.savingErrors)}
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
                    <TableCell>Comment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewSales.map((sale, index) => (
                    <TableRow key={`${sale.bookId ?? 'book'}-${index}`}>
                      <TableCell>{sale.bookTitle ?? `Book ${sale.bookId ?? ''}`}</TableCell>
                      <TableCell>{sale.bookAuthor ?? '—'}</TableCell>
                      <TableCell>
                        {sale.saleMonth && sale.saleYear
                          ? formatMonthYear(sale.saleMonth, sale.saleYear)
                          : '—'}
                      </TableCell>
                      <TableCell align="right">{sale.quantitySold ?? 0}</TableCell>
                      <TableCell align="right">
                        {sale.publisherRevenue != null
                          ? formatCurrency(Number(sale.publisherRevenue))
                          : '—'}
                      </TableCell>
                      <TableCell align="right">
                        {sale.authorRoyalty != null
                          ? formatCurrency(Number(sale.authorRoyalty))
                          : '—'}
                      </TableCell>
                      <TableCell>{sale.comment ?? '—'}</TableCell>
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
