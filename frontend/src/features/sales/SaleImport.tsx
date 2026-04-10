import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
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
import { SalesService, type ParsingError, type SaleResponse } from '@/api';
import PageContainer from '@/components/PageContainer';
import { useNotifications } from '@/hooks/useNotifications/useNotifications';
import { getErrorMessage } from '@/utils/error';
import { formatCurrency, formatMonthYear } from '@/utils/formatting';
import { getFriendlyErrorMessage } from './saleImportErrorMessages';

type ErrorState = {
  parseErrors: ParsingError[];
  validationErrors: ParsingError[];
  warnings: ParsingError[];
};

type ImportMode = 'csv' | 'xlsx';

type SalesImportResponseShape = {
  savedSales?: SaleResponse[];
  parseErrors?: ParsingError[];
  validationErrors?: ParsingError[];
  warnings?: ParsingError[];
  csvErrors?: ParsingError[];
  savingErrors?: ParsingError[];
};

const asResponse = (response: unknown): SalesImportResponseShape =>
  response as SalesImportResponseShape;

export default function SaleImport() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const fileInputId = React.useId();

  const [importMode, setImportMode] = React.useState<ImportMode>('csv');
  const [saleDate, setSaleDate] = React.useState<Dayjs | null>(null);
  const [csvFile, setCsvFile] = React.useState<File | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [errorState, setErrorState] = React.useState<ErrorState>({
    parseErrors: [],
    validationErrors: [],
    warnings: [],
  });
  const [isErrorDialogOpen, setIsErrorDialogOpen] = React.useState(false);
  const [previewSales, setPreviewSales] = React.useState<SaleResponse[]>([]);
  const [previewWarnings, setPreviewWarnings] = React.useState<ParsingError[]>([]);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = React.useState(false);

  const hasErrors = errorState.parseErrors.length > 0 || errorState.validationErrors.length > 0;

  const handleBack = React.useCallback(() => {
    navigate('/sales');
  }, [navigate]);

  const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    setCsvFile(file);
    setValidationError(null);
    event.currentTarget.value = '';
  }, []);

  const handleImportModeChange = React.useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, nextMode: string) => {
      if (nextMode !== 'csv' && nextMode !== 'xlsx') {
        return;
      }
      setImportMode(nextMode);
      setCsvFile(null);
      setSaleDate(null);
      setValidationError(null);
    },
    [],
  );

  const acceptedFileTypes =
    importMode === 'csv'
      ? '.csv,text/csv'
      : '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const buildRequest = React.useCallback(
    (isPreview: boolean, acknowledgeWarnings = false) => {
      if (!csvFile) return null;
      return {
        saleMonth: saleDate ? saleDate.month() + 1 : undefined,
        saleYear: saleDate ? saleDate.year() : undefined,
        importFile: csvFile,
        // Keep legacy key during transition until frontend API client is regenerated.
        csvFile,
        isPreview,
        acknowledgeWarnings,
      };
    },
    [csvFile, saleDate],
  );

  const normalizeErrors = React.useCallback((response: SalesImportResponseShape) => {
    const parseErrors = response.parseErrors ?? response.csvErrors ?? [];
    const validationErrors = response.validationErrors ?? response.savingErrors ?? [];
    const warnings = response.warnings ?? [];
    return { parseErrors, validationErrors, warnings };
  }, []);

  const handleResponse = React.useCallback(
    (response: SalesImportResponseShape) => {
      const { parseErrors, validationErrors, warnings } = normalizeErrors(response);
      if (parseErrors.length > 0 || validationErrors.length > 0) {
        setErrorState({ parseErrors, validationErrors, warnings });
        setIsErrorDialogOpen(true);
        return false;
      }
      const sales = response.savedSales ?? [];
      setPreviewWarnings(warnings);
      setPreviewSales(sales);
      setIsPreviewDialogOpen(true);
      return true;
    },
    [normalizeErrors],
  );

  const handlePreview = React.useCallback(async () => {
    setValidationError(null);
    const fileName = csvFile?.name.toLowerCase() ?? '';
    const isCsvFile = fileName.endsWith('.csv');
    const isXlsxFile = fileName.endsWith('.xlsx');

    if (!csvFile) {
      setValidationError('Please choose a file to import.');
      return;
    }

    if (importMode === 'csv' && !isCsvFile) {
      setValidationError('Import mode is CSV, so please upload a .csv file.');
      return;
    }

    if (importMode === 'xlsx' && !isXlsxFile) {
      setValidationError('Import mode is Amazon XLSX, so please upload a .xlsx file.');
      return;
    }

    if (importMode === 'csv' && !saleDate) {
      setValidationError('CSV imports require a Sale Month/Year.');
      return;
    }

    const payload = buildRequest(true);
    if (!payload) return;

    setIsSubmitting(true);
    try {
      const response = asResponse(await SalesService.importCsv(payload));
      handleResponse(response);
    } catch (error) {
      setValidationError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [buildRequest, csvFile, handleResponse, importMode, saleDate]);

  const handleCommit = React.useCallback(async () => {
    const payload = buildRequest(false, true);
    if (!payload) return;

    setIsSubmitting(true);
    try {
      const response = asResponse(await SalesService.importCsv(payload));
      const { parseErrors, validationErrors, warnings } = normalizeErrors(response);

      if (parseErrors.length > 0 || validationErrors.length > 0) {
        setIsPreviewDialogOpen(false);
        setErrorState({ parseErrors, validationErrors, warnings });
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
  }, [buildRequest, navigate, normalizeErrors, notifications]);

  const renderIssueTable = React.useCallback((title: string, issues: ParsingError[]) => {
    if (issues.length === 0) return null;
    return (
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          {title}
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={130}>Sheet/Row</TableCell>
                <TableCell width={240}>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {issues.map((error, index) => (
                <TableRow key={`${title}-${index}`}>
                  <TableCell>
                    {error.sheetName ? `${error.sheetName} / ` : ''}
                    {error.rowNumber ?? '-'}
                  </TableCell>
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
      breadcrumbs={[{ title: 'Sales Records', path: '/sales' }, { title: 'Import Sales File' }]}
      actions={
        <Button variant="text" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to Sales
        </Button>
      }
    >
      <Stack spacing={2}>
        <Paper sx={{ p: 3 }} variant="outlined">
          <Stack spacing={2}>
            <Typography variant="h5">Import Sales File</Typography>
            <Typography variant="body2" color="text.secondary">
              Upload a sales file (CSV or Amazon XLSX) and preview before committing.
            </Typography>

            <FormControl>
              <RadioGroup row value={importMode} onChange={handleImportModeChange}>
                <FormControlLabel value="csv" control={<Radio />} label="CSV Import" />
                <FormControlLabel value="xlsx" control={<Radio />} label="Amazon XLSX Import" />
              </RadioGroup>
            </FormControl>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                component="label"
                htmlFor={fileInputId}
                size="small"
                sx={{ height: 40, minWidth: 140 }}
              >
                Choose File
              </Button>
              <input
                id={fileInputId}
                type="file"
                accept={acceptedFileTypes}
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

              {importMode === 'csv' ? (
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
              ) : null}
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
        <DialogTitle>Import Issues</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              Fix the issues below and try the import again.
            </Typography>
            {renderIssueTable('Parse Errors', errorState.parseErrors)}
            {renderIssueTable('Validation Errors', errorState.validationErrors)}
            {renderIssueTable('Warnings', errorState.warnings)}
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
            {previewWarnings.length > 0 ? (
              <Alert severity="warning">
                This import contains {previewWarnings.length} warning(s). Unsupported rows will be
                ignored.
              </Alert>
            ) : null}
            {validationError ? <Alert severity="error">{validationError}</Alert> : null}
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 480 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Book</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Month/Year</TableCell>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Quantity / KENP</TableCell>
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
                      <TableCell>
                        {sale.quantitySold && sale.quantitySold !== 0
                          ? 'Quantity'
                          : sale.kenp && sale.kenp !== 0
                            ? 'KENP'
                            : '—'}
                      </TableCell>
                      <TableCell align="right">
                        {sale.quantitySold && sale.quantitySold !== 0
                          ? sale.quantitySold
                          : sale.kenp && sale.kenp !== 0
                            ? sale.kenp
                            : 0}
                      </TableCell>
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
