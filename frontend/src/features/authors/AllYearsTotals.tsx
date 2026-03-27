import { formatCurrency } from '@/utils/formatting';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { type AggregatedBook, type TotalsRow } from './royaltyReportUtils';

interface AllYearsTotalsProps {
  books: AggregatedBook[];
  totals: TotalsRow;
}

export default function AllYearsTotals({ books, totals }: AllYearsTotalsProps) {
  return (
    <Box
      className="year-section year-totals-section"
      sx={{ mt: 4, pt: 3, borderTop: 2, borderColor: 'divider' }}
    >
      <Typography variant="subtitle1" className="year-title" sx={{ fontWeight: 600, mb: 1 }}>
        All Years Total
      </Typography>
      <TableContainer className="all-years-totals-table report-fit-table">
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
            {books.map((book) => (
              <TableRow key={`all-years-book-${book.title}`}>
                <TableCell>
                  <Box>
                    <Box component="div" sx={{ fontWeight: 500 }}>
                      {book.title}
                    </Box>
                    {book.seriesName && (
                      <Box component="div" sx={{ fontSize: '0.85em', color: 'text.secondary' }}>
                        {book.seriesName} ({book.seriesPosition})
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">{book.quantity}</TableCell>
                <TableCell align="right">{book.handsold}</TableCell>
                <TableCell align="right">{book.ingramPrint}</TableCell>
                <TableCell align="right">{book.amazonPrint}</TableCell>
                <TableCell align="right">{book.amazonEbook}</TableCell>
                <TableCell align="right">{book.otherPrint}</TableCell>
                <TableCell align="right">{book.otherEbook}</TableCell>
                <TableCell align="right">{book.kenpTotal}</TableCell>
                <TableCell align="right">{formatCurrency(book.unpaidRoyalty)}</TableCell>
                <TableCell align="right">{formatCurrency(book.paidRoyalty)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {formatCurrency(book.totalRoyalty)}
                </TableCell>
              </TableRow>
            ))}

            <TableRow sx={{ '& td': { fontWeight: 700 } }}>
              <TableCell>Totals</TableCell>
              <TableCell align="right">{totals.quantity}</TableCell>
              <TableCell align="right">{totals.handsold}</TableCell>
              <TableCell align="right">{totals.ingramPrint}</TableCell>
              <TableCell align="right">{totals.amazonPrint}</TableCell>
              <TableCell align="right">{totals.amazonEbook}</TableCell>
              <TableCell align="right">{totals.otherPrint}</TableCell>
              <TableCell align="right">{totals.otherEbook}</TableCell>
              <TableCell align="right">{totals.kenpTotal}</TableCell>
              <TableCell align="right">{formatCurrency(totals.unpaidRoyalty)}</TableCell>
              <TableCell align="right">{formatCurrency(totals.paidRoyalty)}</TableCell>
              <TableCell align="right">{formatCurrency(totals.totalRoyalty)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
