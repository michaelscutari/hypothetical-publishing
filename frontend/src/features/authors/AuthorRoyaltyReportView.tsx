import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { SalesService, type RoyaltyReportResponse } from '@/api';
import { formatCurrency } from '@/utils/formatting';
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
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, includeEmptyQuarters]);

  React.useEffect(() => {
    loadReport();
  }, [loadReport]);

  const getQuarterLabel = (quarter?: number) => {
    const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
    return labels[(quarter ?? 1) - 1];
  };

  const getGeneratedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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

  const quarterColumns = reportData.quarters;
  const books = reportData.allTime.books;
  const quarterColumnsByYear = quarterColumns.reduce<Record<number, typeof quarterColumns>>(
    (grouped, quarter) => {
      const year = quarter.year;
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(quarter);
      return grouped;
    },
    {},
  );
  const sortedYears = Object.keys(quarterColumnsByYear)
    .map((year) => Number(year))
    .sort((a, b) => a - b);

  const allYearsBookMap = new Map<
    string,
    {
      title: string;
      seriesName?: string;
      seriesPosition?: number;
      quantity: number;
      handsold: number;
      unpaidRoyalty: number;
      paidRoyalty: number;
      totalRoyalty: number;
    }
  >();

  quarterColumns.forEach((quarter) => {
    quarter.books.forEach((book) => {
      const key = book.displayName;

      const existing = allYearsBookMap.get(key);
      if (existing) {
        existing.quantity += book.quantity;
        existing.handsold += book.handsold;
        existing.unpaidRoyalty += book.unpaidRoyalty;
        existing.paidRoyalty += book.paidRoyalty;
        existing.totalRoyalty += book.totalRoyalty;
      } else {
        allYearsBookMap.set(key, {
          title: book.title ?? 'Unknown Book',
          seriesName: book.seriesName ?? undefined,
          seriesPosition: book.seriesPosition ?? undefined,
          quantity: book.quantity,
          handsold: book.handsold,
          unpaidRoyalty: book.unpaidRoyalty,
          paidRoyalty: book.paidRoyalty,
          totalRoyalty: book.totalRoyalty,
        });
      }
    });
  });

  const allYearsBooks = Array.from(allYearsBookMap.values()).sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  const allYearsTotals = quarterColumns.reduce(
    (totals, quarter) => ({
      quantity: totals.quantity + quarter.totals.quantity,
      handsold: totals.handsold + quarter.totals.handsold,
      unpaidRoyalty: totals.unpaidRoyalty + quarter.totals.unpaidRoyalty,
      paidRoyalty: totals.paidRoyalty + quarter.totals.paidRoyalty,
      totalRoyalty: totals.totalRoyalty + quarter.totals.totalRoyalty,
    }),
    {
      quantity: 0,
      handsold: 0,
      unpaidRoyalty: 0,
      paidRoyalty: 0,
      totalRoyalty: 0,
    },
  );

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
      {/* PDF Export Instructions (hidden when printing) */}
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
          '@media print': {
            bgcolor: 'white !important',
          },
        }}
      >
        {/* Header */}
        <Box className="report-header" sx={{ borderBottom: 3, borderColor: 'primary.main' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}>
                Hypothetical Publishing
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Author Royalty Report
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Generated: {getGeneratedDate()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ borderTop: 2, borderColor: 'primary.main', pt: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Author Name:</strong> {reportData.author}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Report Period:</strong> {getQuarterLabel(reportData.startQuarter)}{' '}
              {reportData.startYear} – {getQuarterLabel(reportData.endQuarter)} {reportData.endYear}
            </Typography>
          </Box>
        </Box>

        {/* Pivot Sales Matrix */}
        <Box className="report-section">
          {sortedYears.map((year, index) => {
            const yearQuarters = quarterColumnsByYear[year] ?? [];
            const sortedYearQuarters = [...yearQuarters].sort((a, b) => a.quarter - b.quarter);

            return (
              <Box
                key={`year-section-${year}`}
                className="year-section"
                sx={{
                  mb: 3,
                  ...(index > 0 && {
                    pt: 3,
                    borderTop: 2,
                    borderColor: 'divider',
                  }),
                }}
              >
                <Typography
                  variant="subtitle1"
                  className="year-title"
                  sx={{ fontWeight: 600, mb: 1 }}
                >
                  {year}
                </Typography>
                <TableContainer className="quarterly-table">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell rowSpan={2}>Book</TableCell>
                        {sortedYearQuarters.map((quarter) => (
                          <TableCell
                            key={`header-${year}-q${quarter.quarter}`}
                            align="center"
                            colSpan={5}
                            sx={{ borderLeft: 2, borderColor: 'divider' }}
                          >
                            {getQuarterLabel(quarter.quarter)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        {sortedYearQuarters.map((quarter) => (
                          <>
                            <TableCell
                              key={`header-${year}-q${quarter.quarter}-qty`}
                              align="right"
                              sx={{ borderLeft: 2, borderColor: 'divider', fontSize: '0.7rem' }}
                            >
                              Qty
                            </TableCell>
                            <TableCell
                              key={`header-${year}-q${quarter.quarter}-hand`}
                              align="right"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              Hand
                            </TableCell>
                            <TableCell
                              key={`header-${year}-q${quarter.quarter}-unpaid`}
                              align="right"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              Unpaid
                            </TableCell>
                            <TableCell
                              key={`header-${year}-q${quarter.quarter}-paid`}
                              align="right"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              Paid
                            </TableCell>
                            <TableCell
                              key={`header-${year}-q${quarter.quarter}-total`}
                              align="right"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              Total
                            </TableCell>
                          </>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {books.map((book) => {
                        return (
                          <TableRow key={`matrix-${year}-book-${book.displayName}`}>
                            <TableCell>
                              <Box>
                                <Box component="div" sx={{ fontWeight: 500 }}>
                                  {book.title}
                                </Box>
                                {book.seriesName && (
                                  <Box
                                    component="div"
                                    sx={{ fontSize: '0.85em', color: 'text.secondary' }}
                                  >
                                    {book.seriesName} ({book.seriesPosition})
                                  </Box>
                                )}
                              </Box>
                            </TableCell>
                            {sortedYearQuarters.map((quarter) => {
                              const quarterBook = quarter.books.find(
                                (candidate) => candidate.displayName === book.displayName,
                              );

                              return (
                                <>
                                  <TableCell
                                    key={`matrix-${year}-${book.displayName}-q${quarter.quarter}-qty`}
                                    align="right"
                                    sx={{ borderLeft: 2, borderColor: 'divider' }}
                                  >
                                    {quarterBook?.quantity ?? 0}
                                  </TableCell>
                                  <TableCell
                                    key={`matrix-${year}-${book.displayName}-q${quarter.quarter}-hand`}
                                    align="right"
                                  >
                                    {quarterBook?.handsold ?? 0}
                                  </TableCell>
                                  <TableCell
                                    key={`matrix-${year}-${book.displayName}-q${quarter.quarter}-unpaid`}
                                    align="right"
                                  >
                                    {formatCurrency(quarterBook?.unpaidRoyalty ?? 0)}
                                  </TableCell>
                                  <TableCell
                                    key={`matrix-${year}-${book.displayName}-q${quarter.quarter}-paid`}
                                    align="right"
                                  >
                                    {formatCurrency(quarterBook?.paidRoyalty ?? 0)}
                                  </TableCell>
                                  <TableCell
                                    key={`matrix-${year}-${book.displayName}-q${quarter.quarter}-total`}
                                    align="right"
                                  >
                                    {formatCurrency(quarterBook?.totalRoyalty ?? 0)}
                                  </TableCell>
                                </>
                              );
                            })}
                          </TableRow>
                        );
                      })}

                      <TableRow sx={{ '& td': { fontWeight: 700 } }}>
                        <TableCell>Quarter Totals</TableCell>
                        {sortedYearQuarters.map((quarter) => (
                          <>
                            <TableCell
                              key={`year-total-${year}-q${quarter.quarter}-qty`}
                              align="right"
                              sx={{ borderLeft: 2, borderColor: 'divider' }}
                            >
                              {quarter.totals.quantity}
                            </TableCell>
                            <TableCell
                              key={`year-total-${year}-q${quarter.quarter}-hand`}
                              align="right"
                            >
                              {quarter.totals.handsold}
                            </TableCell>
                            <TableCell
                              key={`year-total-${year}-q${quarter.quarter}-unpaid`}
                              align="right"
                            >
                              {formatCurrency(quarter.totals.unpaidRoyalty)}
                            </TableCell>
                            <TableCell
                              key={`year-total-${year}-q${quarter.quarter}-paid`}
                              align="right"
                            >
                              {formatCurrency(quarter.totals.paidRoyalty)}
                            </TableCell>
                            <TableCell
                              key={`year-total-${year}-q${quarter.quarter}-total`}
                              align="right"
                            >
                              {formatCurrency(quarter.totals.totalRoyalty)}
                            </TableCell>
                          </>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Year totals table */}
                <Box className="year-totals-section" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    {year} Year Totals
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Book</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Handsold</TableCell>
                          <TableCell align="right">Unpaid</TableCell>
                          <TableCell align="right">Paid</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {books.map((book) => {
                          const yearBookMetrics = sortedYearQuarters.reduce(
                            (accumulated, quarter) => {
                              const quarterBook = quarter.books.find(
                                (candidate) => candidate.displayName === book.displayName,
                              );

                              return {
                                quantity: accumulated.quantity + (quarterBook?.quantity ?? 0),
                                handsold: accumulated.handsold + (quarterBook?.handsold ?? 0),
                                unpaidRoyalty:
                                  accumulated.unpaidRoyalty + (quarterBook?.unpaidRoyalty ?? 0),
                                paidRoyalty:
                                  accumulated.paidRoyalty + (quarterBook?.paidRoyalty ?? 0),
                                totalRoyalty:
                                  accumulated.totalRoyalty + (quarterBook?.totalRoyalty ?? 0),
                              };
                            },
                            {
                              quantity: 0,
                              handsold: 0,
                              unpaidRoyalty: 0,
                              paidRoyalty: 0,
                              totalRoyalty: 0,
                            },
                          );

                          return (
                            <TableRow key={`year-summary-${year}-${book.displayName}`}>
                              <TableCell>
                                <Box>
                                  <Box component="div" sx={{ fontWeight: 500 }}>
                                    {book.title}
                                  </Box>
                                  {book.seriesName && (
                                    <Box
                                      component="div"
                                      sx={{ fontSize: '0.85em', color: 'text.secondary' }}
                                    >
                                      {book.seriesName} ({book.seriesPosition})
                                    </Box>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align="right">{yearBookMetrics.quantity}</TableCell>
                              <TableCell align="right">{yearBookMetrics.handsold}</TableCell>
                              <TableCell align="right">
                                {formatCurrency(yearBookMetrics.unpaidRoyalty)}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(yearBookMetrics.paidRoyalty)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {formatCurrency(yearBookMetrics.totalRoyalty)}
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        <TableRow sx={{ '& td': { fontWeight: 700 } }}>
                          <TableCell>{year} Totals</TableCell>
                          <TableCell align="right">
                            {sortedYearQuarters.reduce(
                              (total, quarter) => total + quarter.totals.quantity,
                              0,
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {sortedYearQuarters.reduce(
                              (total, quarter) => total + quarter.totals.handsold,
                              0,
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(
                              sortedYearQuarters.reduce(
                                (total, quarter) => total + quarter.totals.unpaidRoyalty,
                                0,
                              ),
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(
                              sortedYearQuarters.reduce(
                                (total, quarter) => total + quarter.totals.paidRoyalty,
                                0,
                              ),
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(
                              sortedYearQuarters.reduce(
                                (total, quarter) => total + quarter.totals.totalRoyalty,
                                0,
                              ),
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            );
          })}

          <Box
            className="year-section year-totals-section"
            sx={{ mt: 4, pt: 3, borderTop: 2, borderColor: 'divider' }}
          >
            <Typography variant="subtitle1" className="year-title" sx={{ fontWeight: 600, mb: 1 }}>
              All Years Total
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Book</TableCell>
                    <TableCell align="right">Quantity Sold</TableCell>
                    <TableCell align="right">Quantity Handsold</TableCell>
                    <TableCell align="right">Author Royalty (Unpaid)</TableCell>
                    <TableCell align="right">Author Royalty (Paid)</TableCell>
                    <TableCell align="right">Author Royalty (Total)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allYearsBooks.map((book) => (
                    <TableRow key={`all-years-book-${book.title}`}>
                      <TableCell>
                        <Box>
                          <Box component="div" sx={{ fontWeight: 500 }}>
                            {book.title}
                          </Box>
                          {book.seriesName && (
                            <Box
                              component="div"
                              sx={{ fontSize: '0.85em', color: 'text.secondary' }}
                            >
                              {book.seriesName} ({book.seriesPosition})
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{book.quantity}</TableCell>
                      <TableCell align="right">{book.handsold}</TableCell>
                      <TableCell align="right">{formatCurrency(book.unpaidRoyalty)}</TableCell>
                      <TableCell align="right">{formatCurrency(book.paidRoyalty)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatCurrency(book.totalRoyalty)}
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow sx={{ '& td': { fontWeight: 700 } }}>
                    <TableCell>Totals</TableCell>
                    <TableCell align="right">{allYearsTotals.quantity}</TableCell>
                    <TableCell align="right">{allYearsTotals.handsold}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(allYearsTotals.unpaidRoyalty)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(allYearsTotals.paidRoyalty)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(allYearsTotals.totalRoyalty)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
