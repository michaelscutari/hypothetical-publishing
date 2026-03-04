import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatCurrency } from '@/utils/formatting';

type FinancialSummaryProps = {
  isLoading?: boolean;
  summary: {
    revenue?: number;
    unpaidRoyalty?: number;
    paidRoyalty?: number;
    totalRoyalty?: number;
    totalSalesToDate?: number;
  };
};

export default function FinancialSummary({ isLoading, summary }: FinancialSummaryProps) {
  const numberOrZero = (value: number | undefined) => (Number.isFinite(value) ? Number(value) : 0);

  const totals = {
    publisherRevenue: numberOrZero(summary.revenue),
    paidAuthorRoyalty: numberOrZero(summary.paidRoyalty),
    unpaidAuthorRoyalty: numberOrZero(summary.unpaidRoyalty),
    totalAuthorRoyalty:
      summary.totalRoyalty != null
        ? numberOrZero(summary.totalRoyalty)
        : numberOrZero(summary.paidRoyalty) + numberOrZero(summary.unpaidRoyalty),
    totalQuantitySold: numberOrZero(summary.totalSalesToDate),
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ px: 2, py: 2 }}>
      <Typography variant="overline">Financial summary</Typography>

      <Grid container spacing={2} sx={{ mt: 1 }} justifyContent="center">
        <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2, width: '100%' }}>
            <Typography variant="caption">Publisher Revenue</Typography>
            <Typography variant="h6">{formatCurrency(totals.publisherRevenue)}</Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2, width: '100%' }}>
            <Typography variant="caption">Author Royalty (Unpaid)</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6">{formatCurrency(totals.unpaidAuthorRoyalty)}</Typography>
              {totals.unpaidAuthorRoyalty > 0 ? <MoneyOffIcon color="warning" /> : null}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2, width: '100%' }}>
            <Typography variant="caption">Author Royalty (Paid)</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6">{formatCurrency(totals.paidAuthorRoyalty)}</Typography>
              <CheckCircleOutlineIcon color="success" />
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2, width: '100%' }}>
            <Typography variant="caption">Author Royalty (Total)</Typography>
            <Typography variant="h6">{formatCurrency(totals.totalAuthorRoyalty)}</Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2, width: '100%' }}>
            <Typography variant="caption">Copies Sold (Total)</Typography>
            <Typography variant="h6">{totals.totalQuantitySold.toLocaleString()}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}
