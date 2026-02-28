import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SalesService, type ReportBookRow, type RoyaltyReportResponse } from '../../../../api';
import './AuthorRoyaltyReportView.css';

export default function AuthorRoyaltyReportView() {
  const [searchParams] = useSearchParams();
  const [reportData, setReportData] = useState<RoyaltyReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
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
      );

      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const formatCurrency = (value?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value ?? 0);
  };

  const getQuarterLabel = (quarter?: number) => {
    const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
    return labels[(quarter ?? 1) - 1];
  };

  const renderBookRow = (row: ReportBookRow | undefined, periodLabel?: string, key?: string) => {
    if (!row) return null;
    return (
      <TableRow key={key}>
        <TableCell>
          {periodLabel ? (
            periodLabel
          ) : (
            <Box>
              <div style={{ fontWeight: 500 }}>{row.title}</div>
              {row.seriesName && (
                <div style={{ fontSize: '0.85em', color: '#666' }}>
                  {row.seriesName} ({row.seriesPosition})
                </div>
              )}
            </Box>
          )}
        </TableCell>
        <TableCell align="right">{row.quantity ?? 0}</TableCell>
        <TableCell align="right">{row.handsold ?? 0}</TableCell>
        <TableCell align="right">{formatCurrency(row.unpaidRoyalty)}</TableCell>
        <TableCell align="right">{formatCurrency(row.paidRoyalty)}</TableCell>
        <TableCell align="right">
          <strong>{formatCurrency(row.totalRoyalty)}</strong>
        </TableCell>
      </TableRow>
    );
  };

  const getQuarterlyDataForBook = (displayName: string | undefined) => {
    if (!displayName || !reportData?.quarters) return [];
    // For each quarter, find the row matching this book's displayName
    return reportData.quarters
      .map((quarter) => ({
        quarter: quarter.quarter,
        year: quarter.year,
        bookRow: quarter.books?.find((b) => b.displayName === displayName),
      }))
      .filter((q) => q.bookRow);
  };

  const getGeneratedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
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

  return (
    <Box className="report-container">
      {/* PDF Export Instructions (hidden when printing) */}
      <Box className="no-print" sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Save as PDF
        </Typography>
        <Typography variant="body2" sx={{ color: '#555', mb: 1 }}>
          To save this report as a PDF document suitable for sharing with the author:
        </Typography>
        <Typography
          variant="body2"
          component="ol"
          sx={{
            color: '#555',
            pl: 2,
            m: 0,
            '& li': { mb: 0.5 },
          }}
        >
          <li>Use your browser's print function (Ctrl+P on Windows, Cmd+P on Mac)</li>
          <li>Select "Save as PDF" in the printer dropdown</li>
          <li>Click "Save" and choose your desired file location</li>
        </Typography>
      </Box>

      <Paper className="report-page" elevation={0}>
        {/* Header */}
        <Box className="report-header">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                Hypothetical Publishing
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                Author Royalty Report
              </Typography>
              <Typography variant="caption" sx={{ color: '#999' }}>
                Generated: {getGeneratedDate()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ borderTop: '2px solid #1976d2', pt: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Author Name:</strong> {reportData.author}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Report Period:</strong> {getQuarterLabel(reportData.startQuarter)}{' '}
              {reportData.startYear} – {getQuarterLabel(reportData.endQuarter)} {reportData.endYear}
            </Typography>
          </Box>
        </Box>

        {/* Per-Book Sections */}
        {reportData.allTime?.books?.map((book) => {
          const quarterlyData = getQuarterlyDataForBook(book.displayName);
          return (
            <Box key={`book-${book.displayName}`} className="report-section book-section">
              <Typography variant="h5" className="section-title" sx={{ mb: 0.5 }}>
                {book.title}
              </Typography>
              {book.seriesName && (
                <Typography variant="subtitle1" sx={{ color: '#666', mb: 2 }}>
                  {book.seriesName} ({book.seriesPosition})
                </Typography>
              )}

              <TableContainer sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell align="right">Total Sold</TableCell>
                      <TableCell align="right">Handsold</TableCell>
                      <TableCell align="right">Unpaid Royalty</TableCell>
                      <TableCell align="right">Paid Royalty</TableCell>
                      <TableCell align="right">Total Royalty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quarterlyData.map((qData) =>
                      renderBookRow(
                        qData.bookRow,
                        `${getQuarterLabel(qData.quarter)} ${qData.year}`,
                        `${book.displayName}-q${qData.quarter}${qData.year}`,
                      ),
                    )}
                    {renderBookRow(book, 'All-Time', `${book.displayName}-alltime`)}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })}

        {/* All-Book Totals Section */}
        <Box className="report-section">
          <Typography variant="h6" className="section-title">
            All-Book Quarterly Summary
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Total Sold</TableCell>
                  <TableCell align="right">Handsold</TableCell>
                  <TableCell align="right">Unpaid Royalty</TableCell>
                  <TableCell align="right">Paid Royalty</TableCell>
                  <TableCell align="right">Total Royalty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.quarters?.map((quarter) =>
                  renderBookRow(
                    quarter.totals,
                    `${getQuarterLabel(quarter.quarter)} ${quarter.year}`,
                    `allbooks-q${quarter.quarter}${quarter.year}`,
                  ),
                )}
                {renderBookRow(reportData.allTime?.totals, 'All-Time', 'allbooks-alltime')}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            borderTop: '1px solid #e0e0e0',
            mt: 4,
            pt: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: '#999' }}>
            © 2026 Hypothetical Publishing. All rights reserved.
          </Typography>
          <Typography variant="caption" sx={{ color: '#999' }}>
            Document ID: {reportData.author?.toLowerCase().replace(/\s+/g, '-')}-
            {reportData.startYear}-q{reportData.startQuarter}-{reportData.endYear}-q
            {reportData.endQuarter}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
