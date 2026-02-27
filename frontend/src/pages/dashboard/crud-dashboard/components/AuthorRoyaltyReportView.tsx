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
import {
  SalesService,
  type AuthorRoyaltyReportResponse,
  type BookReportData,
} from '../../../../api';
import './AuthorRoyaltyReportView.css';

export default function AuthorRoyaltyReportView() {
  const [searchParams] = useSearchParams();
  const [reportData, setReportData] = useState<AuthorRoyaltyReportResponse | null>(null);
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

      const data = await SalesService.generateAuthorRoyaltyReport({
        authorId,
        startQuarter,
        startYear,
        endQuarter,
        endYear,
      });

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

  const getBookLabel = (book: BookReportData) => {
    if (book.seriesName && book.seriesPosition) {
      return `${book.seriesName} #${book.seriesPosition}: ${book.title}`;
    }
    return book.title;
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
      <Paper className="report-page" elevation={0}>
        {/* Header */}
        <Box className="report-header">
          <Box className="report-branding">
            <Typography variant="h4" className="report-title">
              Hypothetical Publishing
            </Typography>
            <Typography variant="subtitle1" className="report-subtitle">
              Author Royalty Report
            </Typography>
          </Box>
          <Box className="report-info">
            <Typography variant="body1">
              <strong>Author:</strong> {reportData.authorName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {reportData.authorEmail}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Report Period:</strong> {getQuarterLabel(reportData.startQuarter)}{' '}
              {reportData.startYear} – {getQuarterLabel(reportData.endQuarter)} {reportData.endYear}
            </Typography>
            <Typography variant="body2">
              <strong>Generated:</strong> {reportData.generatedDate}
            </Typography>
          </Box>
        </Box>

        {/* All-Time Summary */}
        <Box className="report-section">
          <Typography variant="h6" className="section-title">
            All-Time Totals
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Total Sold</TableCell>
                  <TableCell>Handsold</TableCell>
                  <TableCell align="right">Unpaid Royalty</TableCell>
                  <TableCell align="right">Paid Royalty</TableCell>
                  <TableCell align="right">Total Royalty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{reportData.allTimeTotals?.quantitySold ?? 0}</TableCell>
                  <TableCell>{reportData.allTimeTotals?.quantityHandsold ?? 0}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(reportData.allTimeTotals?.authorRoyaltyUnpaid)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(reportData.allTimeTotals?.authorRoyaltyPaid)}
                  </TableCell>
                  <TableCell align="right">
                    <strong>{formatCurrency(reportData.allTimeTotals?.authorRoyaltyTotal)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Quarterly Breakdown */}
        <Box className="report-section">
          <Typography variant="h6" className="section-title">
            Quarterly Breakdown
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Quarter</TableCell>
                  <TableCell>Total Sold</TableCell>
                  <TableCell>Handsold</TableCell>
                  <TableCell align="right">Unpaid Royalty</TableCell>
                  <TableCell align="right">Paid Royalty</TableCell>
                  <TableCell align="right">Total Royalty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.quarters?.map((q) => (
                  <TableRow key={`${q.year}-${q.quarter}`}>
                    <TableCell>
                      {getQuarterLabel(q.quarter)} {q.year}
                    </TableCell>
                    <TableCell>{q.totals?.quantitySold ?? 0}</TableCell>
                    <TableCell>{q.totals?.quantityHandsold ?? 0}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(q.totals?.authorRoyaltyUnpaid)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(q.totals?.authorRoyaltyPaid)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(q.totals?.authorRoyaltyTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Books Breakdown */}
        {reportData.books?.map((book) => (
          <Box key={book.bookId} className="report-section book-section">
            <Typography variant="h6" className="section-title">
              {getBookLabel(book)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Published: {book.publicationMonth}/{book.publicationYear}
            </Typography>

            {/* Book All-Time Totals */}
            <TableContainer sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={6}>
                      <strong>Book Totals</strong>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Sold</TableCell>
                    <TableCell>Handsold</TableCell>
                    <TableCell align="right">Unpaid Royalty</TableCell>
                    <TableCell align="right">Paid Royalty</TableCell>
                    <TableCell align="right">Total Royalty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{book.totals?.quantitySold ?? 0}</TableCell>
                    <TableCell>{book.totals?.quantityHandsold ?? 0}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(book.totals?.authorRoyaltyUnpaid)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(book.totals?.authorRoyaltyPaid)}
                    </TableCell>
                    <TableCell align="right">
                      <strong>{formatCurrency(book.totals?.authorRoyaltyTotal)}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Book Quarterly Breakdown */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={6}>
                      <strong>Quarterly Breakdown</strong>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Quarter</TableCell>
                    <TableCell>Total Sold</TableCell>
                    <TableCell>Handsold</TableCell>
                    <TableCell align="right">Unpaid Royalty</TableCell>
                    <TableCell align="right">Paid Royalty</TableCell>
                    <TableCell align="right">Total Royalty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {book.quarters?.map((q) => (
                    <TableRow key={`${book.bookId}-${q.year}-${q.quarter}`}>
                      <TableCell>
                        {getQuarterLabel(q.quarter)} {q.year}
                      </TableCell>
                      <TableCell>{q.totals?.quantitySold ?? 0}</TableCell>
                      <TableCell>{q.totals?.quantityHandsold ?? 0}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(q.totals?.authorRoyaltyUnpaid)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(q.totals?.authorRoyaltyPaid)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(q.totals?.authorRoyaltyTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}

        {/* Footer */}
        <Box className="report-footer">
          <Typography variant="caption" color="text.secondary">
            Hypothetical Publishing • Author Royalty Report • Generated {reportData.generatedDate}
          </Typography>
        </Box>
      </Paper>

      {/* Print instructions (hidden when printing) */}
      <Box className="no-print" sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Use your browser's print function (Ctrl+P or Cmd+P) and save as PDF
        </Typography>
      </Box>
    </Box>
  );
}
