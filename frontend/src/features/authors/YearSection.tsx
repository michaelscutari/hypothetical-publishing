import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { type RoyaltyReportResponse } from '@/api';
import { formatCurrency } from '@/utils/formatting';
import { getQuarterLabel } from './royaltyReportUtils';

type Quarter = RoyaltyReportResponse['quarters'][number];
type Book = RoyaltyReportResponse['allTime']['books'][number];

interface BookCellProps {
  title?: string | null;
  seriesName?: string | null;
  seriesPosition?: number | null;
}

function BookCell({ title, seriesName, seriesPosition }: BookCellProps) {
  return (
    <Box>
      <Box component="div" sx={{ fontWeight: 500 }}>
        {title}
      </Box>
      {seriesName && (
        <Box component="div" sx={{ fontSize: '0.85em', color: 'text.secondary' }}>
          {seriesName} ({seriesPosition})
        </Box>
      )}
    </Box>
  );
}

interface YearSectionProps {
  year: number;
  quarters: Quarter[];
  books: Book[];
  isFirst: boolean;
}

export default function YearSection({ year, quarters, books, isFirst }: YearSectionProps) {
  const sorted = [...quarters].sort((a, b) => a.quarter - b.quarter);

  return (
    <Box
      className="year-section"
      sx={{
        mb: 3,
        ...(!isFirst && {
          pt: 3,
          borderTop: 2,
          borderColor: 'divider',
        }),
      }}
    >
      <Typography variant="subtitle1" className="year-title" sx={{ fontWeight: 600, mb: 1 }}>
        {year}
      </Typography>

      {/* Quarterly pivot table */}
      <TableContainer className="quarterly-table">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2}>Book</TableCell>
              {sorted.map((q) => (
                <TableCell
                  key={`header-${year}-q${q.quarter}`}
                  align="center"
                  colSpan={5}
                  sx={{ borderLeft: 2, borderColor: 'divider' }}
                >
                  {getQuarterLabel(q.quarter)}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              {sorted.map((q) => (
                <React.Fragment key={`h-${year}-q${q.quarter}`}>
                  <TableCell
                    align="right"
                    sx={{ borderLeft: 2, borderColor: 'divider', fontSize: '0.7rem' }}
                  >
                    Qty
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.7rem' }}>
                    Hand
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.7rem' }}>
                    Unpaid
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.7rem' }}>
                    Paid
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.7rem' }}>
                    Total
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {books.map((book) => (
              <TableRow key={`matrix-${year}-${book.displayName}`}>
                <TableCell>
                  <BookCell
                    title={book.title}
                    seriesName={book.seriesName}
                    seriesPosition={book.seriesPosition}
                  />
                </TableCell>
                {sorted.map((q) => {
                  const qb = q.books.find((c) => c.displayName === book.displayName);
                  return (
                    <React.Fragment key={`m-${year}-${book.displayName}-q${q.quarter}`}>
                      <TableCell align="right" sx={{ borderLeft: 2, borderColor: 'divider' }}>
                        {qb?.quantity ?? 0}
                      </TableCell>
                      <TableCell align="right">{qb?.handsold ?? 0}</TableCell>
                      <TableCell align="right">{formatCurrency(qb?.unpaidRoyalty ?? 0)}</TableCell>
                      <TableCell align="right">{formatCurrency(qb?.paidRoyalty ?? 0)}</TableCell>
                      <TableCell align="right">{formatCurrency(qb?.totalRoyalty ?? 0)}</TableCell>
                    </React.Fragment>
                  );
                })}
              </TableRow>
            ))}

            <TableRow sx={{ '& td': { fontWeight: 700 } }}>
              <TableCell>Quarter Totals</TableCell>
              {sorted.map((q) => (
                <React.Fragment key={`qt-${year}-q${q.quarter}`}>
                  <TableCell align="right" sx={{ borderLeft: 2, borderColor: 'divider' }}>
                    {q.totals.quantity}
                  </TableCell>
                  <TableCell align="right">{q.totals.handsold}</TableCell>
                  <TableCell align="right">{formatCurrency(q.totals.unpaidRoyalty)}</TableCell>
                  <TableCell align="right">{formatCurrency(q.totals.paidRoyalty)}</TableCell>
                  <TableCell align="right">{formatCurrency(q.totals.totalRoyalty)}</TableCell>
                </React.Fragment>
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
                const metrics = sorted.reduce(
                  (acc, q) => {
                    const qb = q.books.find((c) => c.displayName === book.displayName);
                    return {
                      quantity: acc.quantity + (qb?.quantity ?? 0),
                      handsold: acc.handsold + (qb?.handsold ?? 0),
                      unpaidRoyalty: acc.unpaidRoyalty + (qb?.unpaidRoyalty ?? 0),
                      paidRoyalty: acc.paidRoyalty + (qb?.paidRoyalty ?? 0),
                      totalRoyalty: acc.totalRoyalty + (qb?.totalRoyalty ?? 0),
                    };
                  },
                  { quantity: 0, handsold: 0, unpaidRoyalty: 0, paidRoyalty: 0, totalRoyalty: 0 },
                );

                return (
                  <TableRow key={`ys-${year}-${book.displayName}`}>
                    <TableCell>
                      <BookCell
                        title={book.title}
                        seriesName={book.seriesName}
                        seriesPosition={book.seriesPosition}
                      />
                    </TableCell>
                    <TableCell align="right">{metrics.quantity}</TableCell>
                    <TableCell align="right">{metrics.handsold}</TableCell>
                    <TableCell align="right">{formatCurrency(metrics.unpaidRoyalty)}</TableCell>
                    <TableCell align="right">{formatCurrency(metrics.paidRoyalty)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(metrics.totalRoyalty)}
                    </TableCell>
                  </TableRow>
                );
              })}

              <TableRow sx={{ '& td': { fontWeight: 700 } }}>
                <TableCell>{year} Totals</TableCell>
                <TableCell align="right">
                  {sorted.reduce((t, q) => t + q.totals.quantity, 0)}
                </TableCell>
                <TableCell align="right">
                  {sorted.reduce((t, q) => t + q.totals.handsold, 0)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(sorted.reduce((t, q) => t + q.totals.unpaidRoyalty, 0))}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(sorted.reduce((t, q) => t + q.totals.paidRoyalty, 0))}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(sorted.reduce((t, q) => t + q.totals.totalRoyalty, 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
