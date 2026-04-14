import { AuthorsService, type AuthorResponse } from '@/api';
import PageContainer from '@/components/PageContainer';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useSearchParams } from 'react-router-dom';

export default function AuthorRoyaltyReport() {
  const [searchParams] = useSearchParams();
  const [authors, setAuthors] = React.useState<AuthorResponse[]>([]);
  const [selectedAuthor, setSelectedAuthor] = React.useState<AuthorResponse | null>(null);
  const [isLoadingAuthors, setLoadingAuthors] = React.useState(false);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  const getDefaultStartQuarter = () => {
    let quarter = currentQuarter - 3;
    let year = currentYear;
    while (quarter <= 0) {
      quarter += 4;
      year -= 1;
    }
    return { quarter, year };
  };

  const defaultStart = getDefaultStartQuarter();
  const [authorStartQuarter, setAuthorStartQuarter] = React.useState(defaultStart.quarter);
  const [authorStartYear, setAuthorStartYear] = React.useState(defaultStart.year);
  const [authorEndQuarter, setAuthorEndQuarter] = React.useState(currentQuarter);
  const [authorEndYear, setAuthorEndYear] = React.useState(currentYear);

  const [financialStartQuarter, setFinancialStartQuarter] = React.useState(defaultStart.quarter);
  const [financialStartYear, setFinancialStartYear] = React.useState(defaultStart.year);
  const [financialEndQuarter, setFinancialEndQuarter] = React.useState(currentQuarter);
  const [financialEndYear, setFinancialEndYear] = React.useState(currentYear);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isDownloadingReport, setIsDownloadingReport] = React.useState(false);

  React.useEffect(() => {
    loadAuthors();
  }, []);

  React.useEffect(() => {
    // If authorId is passed as query parameter, pre-select that author
    const authorId = searchParams.get('authorId');
    if (authorId && authors.length > 0) {
      const author = authors.find((a) => a.id?.toString() === authorId);
      if (author) {
        setSelectedAuthor(author);
      }
    }
  }, [searchParams, authors]);

  const loadAuthors = async () => {
    setLoadingAuthors(true);
    try {
      const response = await AuthorsService.getAllAuthors(0, 1000, true);
      setAuthors(response.content ?? []);
    } catch {
      // silent — empty author list is acceptable
    } finally {
      setLoadingAuthors(false);
    }
  };

  const handleGenerateReport = () => {
    if (!selectedAuthor || !selectedAuthor.id) return;
    if (
      !isValidQuarterRange(authorStartQuarter, authorStartYear, authorEndQuarter, authorEndYear)
    ) {
      setValidationError(
        'Author report range is invalid. End quarter must be after start quarter.',
      );
      return;
    }
    setValidationError(null);

    const params = new URLSearchParams({
      authorId: selectedAuthor.id.toString(),
      startQuarter: authorStartQuarter.toString(),
      startYear: authorStartYear.toString(),
      endQuarter: authorEndQuarter.toString(),
      endYear: authorEndYear.toString(),
    });

    window.open(`/author-royalty-report?${params.toString()}`, '_blank');
  };

  const handleAllAuthorsRoyaltyExport = async () => {
    if (
      !isValidQuarterRange(
        financialStartQuarter,
        financialStartYear,
        financialEndQuarter,
        financialEndYear,
      )
    ) {
      setValidationError(
        'Financial report range is invalid. End quarter must be after start quarter.',
      );
      return;
    }
    setValidationError(null);

    const params = new URLSearchParams({
      startQuarter: String(financialStartQuarter),
      startYear: String(financialStartYear),
      endQuarter: String(financialEndQuarter),
      endYear: String(financialEndYear),
    });
    await downloadReportFile(`/api/sales/reports/all-authors-royalty?${params.toString()}`);
  };

  const handlePublisherProfitExport = async () => {
    if (
      !isValidQuarterRange(
        financialStartQuarter,
        financialStartYear,
        financialEndQuarter,
        financialEndYear,
      )
    ) {
      setValidationError(
        'Financial report range is invalid. End quarter must be after start quarter.',
      );
      return;
    }
    setValidationError(null);

    const params = new URLSearchParams({
      startQuarter: String(financialStartQuarter),
      startYear: String(financialStartYear),
      endQuarter: String(financialEndQuarter),
      endYear: String(financialEndYear),
    });
    await downloadReportFile(`/api/sales/reports/publisher-profit?${params.toString()}`);
  };

  const handleAmazonSalesExport = async () => {
    setValidationError(null);
    await downloadReportFile('/api/sales/reports/amazon-sales');
  };

  const downloadReportFile = async (url: string) => {
    setIsDownloadingReport(true);
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setValidationError('You are not logged in. Please log in and try again.');
          return;
        }
        setValidationError('Unable to download report. Please try again.');
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const filename =
        extractFilename(contentDisposition) ??
        `financial-report-${new Date().toISOString().replace(/[:]/g, '-')}.xlsx`;

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setValidationError('Unable to download report. Please try again.');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const years = Array.from({ length: 201 }, (_, i) => 1900 + i);
  const actionButtonSx = { minWidth: 240 };

  return (
    <PageContainer title="Reports">
      <Card>
        <CardContent>
          <Stack spacing={3}>
            {validationError ? <Alert severity="error">{validationError}</Alert> : null}

            <Typography variant="subtitle1" fontWeight={600}>
              Author PDF Report
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Select an author and timespan to generate a detailed royalty report. The report will
              be generated as a PDF document.
            </Typography>

            <Autocomplete
              options={authors}
              getOptionLabel={(author) => `${author.name} (${author.email})`}
              renderInput={(params) => <TextField {...params} label="Select Author" required />}
              value={selectedAuthor}
              onChange={(_, newValue) => setSelectedAuthor(newValue)}
              loading={isLoadingAuthors}
              disabled={isLoadingAuthors}
            />

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Start Quarter</InputLabel>
                <Select
                  value={authorStartQuarter}
                  label="Start Quarter"
                  onChange={(e) => setAuthorStartQuarter(e.target.value as number)}
                >
                  <MenuItem value={1}>Q1 (Jan-Mar)</MenuItem>
                  <MenuItem value={2}>Q2 (Apr-Jun)</MenuItem>
                  <MenuItem value={3}>Q3 (Jul-Sep)</MenuItem>
                  <MenuItem value={4}>Q4 (Oct-Dec)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Start Year</InputLabel>
                <Select
                  value={authorStartYear}
                  label="Start Year"
                  onChange={(e) => setAuthorStartYear(e.target.value as number)}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>End Quarter</InputLabel>
                <Select
                  value={authorEndQuarter}
                  label="End Quarter"
                  onChange={(e) => setAuthorEndQuarter(e.target.value as number)}
                >
                  <MenuItem value={1}>Q1 (Jan-Mar)</MenuItem>
                  <MenuItem value={2}>Q2 (Apr-Jun)</MenuItem>
                  <MenuItem value={3}>Q3 (Jul-Sep)</MenuItem>
                  <MenuItem value={4}>Q4 (Oct-Dec)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>End Year</InputLabel>
                <Select
                  value={authorEndYear}
                  label="End Year"
                  onChange={(e) => setAuthorEndYear(e.target.value as number)}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleGenerateReport}
                disabled={!selectedAuthor || isLoadingAuthors}
                sx={actionButtonSx}
              >
                {isLoadingAuthors ? <CircularProgress size={24} /> : 'Generate Report'}
              </Button>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle1" fontWeight={600}>
              Financial XLSX Exports
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Amazon sales is a lifetime export. Use the quarter range below only for the other XLSX
              reports.
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAmazonSalesExport}
                  disabled={isDownloadingReport}
                  sx={actionButtonSx}
                >
                  Export Amazon Sales (All Time)
                </Button>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Quarter range for royalties and publisher profit
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Start Quarter</InputLabel>
                      <Select
                        value={financialStartQuarter}
                        label="Start Quarter"
                        onChange={(e) => setFinancialStartQuarter(e.target.value as number)}
                      >
                        <MenuItem value={1}>Q1 (Jan-Mar)</MenuItem>
                        <MenuItem value={2}>Q2 (Apr-Jun)</MenuItem>
                        <MenuItem value={3}>Q3 (Jul-Sep)</MenuItem>
                        <MenuItem value={4}>Q4 (Oct-Dec)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Start Year</InputLabel>
                      <Select
                        value={financialStartYear}
                        label="Start Year"
                        onChange={(e) => setFinancialStartYear(e.target.value as number)}
                      >
                        {years.map((year) => (
                          <MenuItem key={year} value={year}>
                            {year}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>End Quarter</InputLabel>
                      <Select
                        value={financialEndQuarter}
                        label="End Quarter"
                        onChange={(e) => setFinancialEndQuarter(e.target.value as number)}
                      >
                        <MenuItem value={1}>Q1 (Jan-Mar)</MenuItem>
                        <MenuItem value={2}>Q2 (Apr-Jun)</MenuItem>
                        <MenuItem value={3}>Q3 (Jul-Sep)</MenuItem>
                        <MenuItem value={4}>Q4 (Oct-Dec)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>End Year</InputLabel>
                      <Select
                        value={financialEndYear}
                        label="End Year"
                        onChange={(e) => setFinancialEndYear(e.target.value as number)}
                      >
                        {years.map((year) => (
                          <MenuItem key={year} value={year}>
                            {year}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1}
                  justifyContent="flex-end"
                  useFlexGap
                  sx={{ flexWrap: 'wrap' }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAllAuthorsRoyaltyExport}
                    sx={actionButtonSx}
                  >
                    Export All Authors Royalty (XLSX)
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePublisherProfitExport}
                    sx={actionButtonSx}
                  >
                    Export Publisher Profit (XLSX)
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function isValidQuarterRange(
  startQuarter: number,
  startYear: number,
  endQuarter: number,
  endYear: number,
) {
  if (startQuarter < 1 || startQuarter > 4 || endQuarter < 1 || endQuarter > 4) {
    return false;
  }
  if (endYear < startYear) {
    return false;
  }
  return endYear !== startYear || endQuarter >= startQuarter;
}

function extractFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null;
  }

  const match = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (!match || !match[1]) {
    return null;
  }

  return match[1].trim();
}
