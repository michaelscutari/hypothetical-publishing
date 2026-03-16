import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { SalesService, type RoyaltyReportResponse } from '@/api';
import { getErrorMessage } from '@/utils/error';
import ReportHeader from './ReportHeader';
import YearSection from './YearSection';
import AllYearsTotals from './AllYearsTotals';
import {
  groupQuartersByYear,
  aggregateAllYearsBooks,
  computeAllYearsTotals,
} from './royaltyReportUtils';
import './AuthorRoyaltyReportView.css';

export default function AuthorRoyaltyReportView() {
  const [searchParams] = useSearchParams();
  const [reportData, setReportData] = React.useState<RoyaltyReportResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [includeEmptyQuarters, setIncludeEmptyQuarters] = React.useState(false);

  const loadReport = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authorId = parseInt(searchParams.get('authorId') || '');
      const startQuarter = parseInt(searchParams.get('startQuarter') || '');
      const startYear = parseInt(searchParams.get('startYear') || '');
      const endQuarter = parseInt(searchParams.get('endQuarter') || '');
      const endYear = parseInt(searchParams.get('endYear') || '');

      if (!authorId || !startQuarter || !startYear || !endQuarter || !endYear) {
        throw new Error('Missing required parameters');
      }

      const data = await SalesService.getRoyaltyReport(
        authorId,
        startQuarter,
        startYear,
        endQuarter,
        endYear,
        includeEmptyQuarters,
      );

      setReportData(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, includeEmptyQuarters]);

  React.useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !reportData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">{error || 'Failed to load report'}</Typography>
      </Box>
    );
  }

  const quartersByYear = groupQuartersByYear(reportData.quarters);
  const sortedYears = Object.keys(quartersByYear)
    .map(Number)
    .sort((a, b) => a - b);
  const allYearsBooks = aggregateAllYearsBooks(reportData.quarters);
  const allYearsTotals = computeAllYearsTotals(reportData.quarters);

  return (
    <Box
      className="report-container"
      sx={{
        bgcolor: 'background.default',
        '@media print': {
          bgcolor: 'white !important',
          color: '#000 !important',
          minHeight: 'auto !important',
          m: 0,
          p: 0,
        },
      }}
    >
      <Box
        className="no-print"
        sx={{
          mb: 3,
          p: 2,
          bgcolor: 'action.hover',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Save as PDF
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          To save this report as a PDF document suitable for sharing with the author:
        </Typography>
        <Typography
          variant="body2"
          component="ol"
          sx={{
            color: 'text.secondary',
            pl: 2,
            m: 0,
            '& li': { mb: 0.5 },
          }}
        >
          <li>Use your browser's print function (Ctrl+P on Windows, Cmd+P on Mac)</li>
          <li>Select "Save as PDF" in the printer dropdown</li>
          <li>Click "Save" and choose your desired file location</li>
        </Typography>

        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeEmptyQuarters}
                onChange={(e) => setIncludeEmptyQuarters(e.target.checked)}
              />
            }
            label="Include quarters with no sales"
          />
        </Box>
      </Box>

      <Paper
        className="report-page"
        elevation={3}
        sx={{
          bgcolor: 'background.paper',
          '@media print': { bgcolor: 'white !important' },
        }}
      >
        <ReportHeader reportData={reportData} />
        <Box className="report-section">
          {sortedYears.map((year, index) => (
            <YearSection
              key={year}
              year={year}
              quarters={quartersByYear[year]}
              books={reportData.allTime.books}
              isFirst={index === 0}
            />
          ))}

          <AllYearsTotals books={allYearsBooks} totals={allYearsTotals} />
        </Box>
      </Paper>
    </Box>
  );
}
