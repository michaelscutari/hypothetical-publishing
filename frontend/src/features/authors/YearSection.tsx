import { type RoyaltyReportResponse } from '@/api';
import { formatCurrency } from '@/utils/formatting';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { getQuarterLabel } from './royaltyReportUtils';

type Quarter = RoyaltyReportResponse['quarters'][number];
type Book = RoyaltyReportResponse['allTime']['books'][number];

type Totals = {
  quantity: number;
  handsold: number;
  ingramPrint: number;
  amazonPrint: number;
  amazonEbook: number;
  otherPrint: number;
  otherEbook: number;
  kenpTotal: number;
  unpaidRoyalty: number;
  paidRoyalty: number;
  totalRoyalty: number;
};

const EMPTY_TOTALS: Totals = {
  quantity: 0,
  handsold: 0,
  ingramPrint: 0,
  amazonPrint: 0,
  amazonEbook: 0,
  otherPrint: 0,
  otherEbook: 0,
  kenpTotal: 0,
  unpaidRoyalty: 0,
  paidRoyalty: 0,
  totalRoyalty: 0,
};

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

  const sumBookForYear = (book: Book): Totals =>
    sorted.reduce<Totals>((acc, q) => {
      const qb = q.books.find((c) => c.displayName === book.displayName);
      return {
        quantity: acc.quantity + (qb?.quantity ?? 0),
        handsold: acc.handsold + (qb?.handsold ?? 0),
        ingramPrint: acc.ingramPrint + (qb?.ingramPrint ?? 0),
        amazonPrint: acc.amazonPrint + (qb?.amazonPrint ?? 0),
        amazonEbook: acc.amazonEbook + (qb?.amazonEbook ?? 0),
        otherPrint: acc.otherPrint + (qb?.otherPrint ?? 0),
        otherEbook: acc.otherEbook + (qb?.otherEbook ?? 0),
        kenpTotal: acc.kenpTotal + (qb?.kenpTotal ?? 0),
        unpaidRoyalty: acc.unpaidRoyalty + (qb?.unpaidRoyalty ?? 0),
        paidRoyalty: acc.paidRoyalty + (qb?.paidRoyalty ?? 0),
        totalRoyalty: acc.totalRoyalty + (qb?.totalRoyalty ?? 0),
      };
    }, EMPTY_TOTALS);

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

      <Box className="quarterly-table" sx={{ display: 'grid', gap: 2 }}>
        {sorted.map((q) => (
          <Box key={`q-table-${year}-q${q.quarter}`} className="quarter-table">
            <Typography
              variant="body2"
              className="quarter-header"
              sx={{ fontWeight: 700, mb: 0.5, color: 'text.secondary' }}
            >
              {getQuarterLabel(q.quarter)} {year}
            </Typography>
            <TableContainer className="report-fit-table">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Book</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Handsold</TableCell>
                    <TableCell align="right">Ingram Print</TableCell>
                    <TableCell align="right">Amazon Print</TableCell>
                    <TableCell align="right">Amazon Ebook</TableCell>
                    <TableCell align="right">Other Print</TableCell>
                    <TableCell align="right">Other Ebook</TableCell>
                    <TableCell align="right">KENP</TableCell>
                    <TableCell align="right">Unpaid USD</TableCell>
                    <TableCell align="right">Paid USD</TableCell>
                    <TableCell align="right">Total USD</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {books.map((book) => {
                    const qb = q.books.find((c) => c.displayName === book.displayName);
                    return (
                      <TableRow key={`q-row-${year}-${q.quarter}-${book.displayName}`}>
                        <TableCell>
                          <BookCell
                            title={book.title}
                            seriesName={book.seriesName}
                            seriesPosition={book.seriesPosition}
                          />
                        </TableCell>
                        <TableCell align="right">{qb?.quantity ?? 0}</TableCell>
                        <TableCell align="right">{qb?.handsold ?? 0}</TableCell>
                        <TableCell align="right">{qb?.ingramPrint ?? 0}</TableCell>
                        <TableCell align="right">{qb?.amazonPrint ?? 0}</TableCell>
                        <TableCell align="right">{qb?.amazonEbook ?? 0}</TableCell>
                        <TableCell align="right">{qb?.otherPrint ?? 0}</TableCell>
                        <TableCell align="right">{qb?.otherEbook ?? 0}</TableCell>
                        <TableCell align="right">{qb?.kenpTotal ?? 0}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(qb?.unpaidRoyalty ?? 0)}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(qb?.paidRoyalty ?? 0)}</TableCell>
                        <TableCell align="right">{formatCurrency(qb?.totalRoyalty ?? 0)}</TableCell>
                      </TableRow>
                    );
                  })}

                  <TableRow className="quarter-totals" sx={{ '& td': { fontWeight: 700 } }}>
                    <TableCell>{getQuarterLabel(q.quarter)} Totals</TableCell>
                    <TableCell align="right">{q.totals.quantity}</TableCell>
                    <TableCell align="right">{q.totals.handsold}</TableCell>
                    <TableCell align="right">{q.totals.ingramPrint}</TableCell>
                    <TableCell align="right">{q.totals.amazonPrint}</TableCell>
                    <TableCell align="right">{q.totals.amazonEbook}</TableCell>
                    <TableCell align="right">{q.totals.otherPrint}</TableCell>
                    <TableCell align="right">{q.totals.otherEbook}</TableCell>
                    <TableCell align="right">{q.totals.kenpTotal}</TableCell>
                    <TableCell align="right">{formatCurrency(q.totals.unpaidRoyalty)}</TableCell>
                    <TableCell align="right">{formatCurrency(q.totals.paidRoyalty)}</TableCell>
                    <TableCell align="right">{formatCurrency(q.totals.totalRoyalty)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}
      </Box>

      <Box className="year-totals-section" sx={{ mt: 2 }}>
        <Typography
          variant="subtitle2"
          className="year-totals-title"
          sx={{ fontWeight: 600, mb: 1 }}
        >
          {year} Year Totals
        </Typography>
        <TableContainer className="year-totals-table report-fit-table">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Book</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Handsold</TableCell>
                <TableCell align="right">Ingram Print</TableCell>
                <TableCell align="right">Amazon Print</TableCell>
                <TableCell align="right">Amazon Ebook</TableCell>
                <TableCell align="right">Other Print</TableCell>
                <TableCell align="right">Other Ebook</TableCell>
                <TableCell align="right">KENP</TableCell>
                <TableCell align="right">Unpaid USD</TableCell>
                <TableCell align="right">Paid USD</TableCell>
                <TableCell align="right">Total USD</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {books.map((book) => {
                const metrics = sumBookForYear(book);
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
                    <TableCell align="right">{metrics.ingramPrint}</TableCell>
                    <TableCell align="right">{metrics.amazonPrint}</TableCell>
                    <TableCell align="right">{metrics.amazonEbook}</TableCell>
                    <TableCell align="right">{metrics.otherPrint}</TableCell>
                    <TableCell align="right">{metrics.otherEbook}</TableCell>
                    <TableCell align="right">{metrics.kenpTotal}</TableCell>
                    <TableCell align="right">{formatCurrency(metrics.unpaidRoyalty)}</TableCell>
                    <TableCell align="right">{formatCurrency(metrics.paidRoyalty)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(metrics.totalRoyalty)}
                    </TableCell>
                  </TableRow>
                );
              })}

              <TableRow className="year-totals" sx={{ '& td': { fontWeight: 700 } }}>
                <TableCell>{year} Totals</TableCell>
                <TableCell align="right">
                  {sorted.reduce((t, q) => t + q.totals.quantity, 0)}
                </TableCell>
                <TableCell align="right">
                  {sorted.reduce((t, q) => t + q.totals.handsold, 0)}
                </TableCell>
                <TableCell align="right">
                  {sorted.reduce((t, q) => t + q.totals.ingramPrint, 0)}
                </TableCell>
                <TableCell align="right">
                  {sorted.reduce((t, q) => t + q.totals.amazonPrint, 0)}
                </TableCell>
                <TableCell align="right">
                  {sorted.reduce((t, q) => t + q.totals.amazonEbook, 0)}
                </TableCell>
                <TableCell align="right">
                  {sorted.reduce((t, q) => t + q.totals.otherPrint, 0)}
                </TableCell>
                <TableCell align="right">
                  {sorted.reduce((t, q) => t + q.totals.otherEbook, 0)}
                </TableCell>
                <TableCell align="right">
                  {sorted.reduce((t, q) => t + q.totals.kenpTotal, 0)}
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
