import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import * as salesData from '../data/sales';
import useNotifications from '../hooks/useNotifications/useNotifications';

type Props = {
  bookId?: number;
  royaltyRate?: number;
  sales?: salesData.Sale[];
  isLoading?: boolean;
};

export default function FinancialSummary({ bookId, royaltyRate, sales: controlledSales, isLoading: controlledLoading }: Props) {
  const notifications = useNotifications();

  const [internalSales, setInternalSales] = React.useState<salesData.Sale[]>([]);
  const [internalLoading, setInternalLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const usingControlled = Array.isArray(controlledSales);

  React.useEffect(() => {
    if (usingControlled) {
      setInternalSales(controlledSales ?? []);
      setInternalLoading(Boolean(controlledLoading));
      setError(null);
      return;
    }

    let mounted = true;
    setInternalLoading(true);
    setError(null);

    if (bookId === undefined) {
      setInternalSales([]);
      setInternalLoading(false);
      return;
    }

    salesData
      .getForBook(bookId)
      .then((s) => {
        if (!mounted) return;
        const sorted = (s ?? []).sort((a, b) => {
          const aKey = (a.saleYear ?? 0) * 100 + (a.saleMonth ?? 0);
          const bKey = (b.saleYear ?? 0) * 100 + (b.saleMonth ?? 0);
          return bKey - aKey;
        });
        setInternalSales(sorted);
      })
      .catch((e) => {
        if (!mounted) return;
        const msg = (e as Error)?.message ?? 'Failed to load sales';
        setError(msg);
        notifications.show(`Failed to load sales: ${msg}`, { severity: 'error' });
        setInternalSales([]);
      })
      .finally(() => {
        if (!mounted) return;
        setInternalLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [bookId, controlledSales, controlledLoading, usingControlled, notifications]);

  const sales = usingControlled ? (controlledSales ?? []) : internalSales;
  const loading = usingControlled ? Boolean(controlledLoading) : internalLoading;

  let publisherRevenue = 0;
  let paidAuthorRoyalty = 0;
  let unpaidAuthorRoyalty = 0;
  let totalQuantitySold = 0;

  for (const s of sales) {
    const pr = Number(s.publisherRevenue ?? 0);
    const qty = Number(s.quantitySold ?? 0);

    const arFromField = (s as any).authorRoyalty != null ? Number((s as any).authorRoyalty) : null;
    const arComputed = arFromField != null ? arFromField : royaltyRate != null ? pr * royaltyRate : 0;

    publisherRevenue += pr;
    totalQuantitySold += Number.isFinite(qty) ? qty : 0;

    if (s.hasAuthorBeenPaid) {
      paidAuthorRoyalty += arComputed;
    } else {
      unpaidAuthorRoyalty += arComputed;
    }
  }

  const totals = {
    publisherRevenue,
    paidAuthorRoyalty,
    unpaidAuthorRoyalty,
    totalAuthorRoyalty: paidAuthorRoyalty + unpaidAuthorRoyalty,
    totalQuantitySold,
  };

  const currency = React.useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }), []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography color="error" variant="body2">
          {error}
        </Typography>
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
            <Typography variant="h6">{currency.format(totals.publisherRevenue)}</Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2, width: '100%' }}>
            <Typography variant="caption">Author Royalty (Unpaid)</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6">{currency.format(totals.unpaidAuthorRoyalty)}</Typography>
              {totals.unpaidAuthorRoyalty > 0 ? <MoneyOffIcon color="warning" /> : null}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2, width: '100%' }}>
            <Typography variant="caption">Author Royalty (Paid)</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6">{currency.format(totals.paidAuthorRoyalty)}</Typography>
              <CheckCircleOutlineIcon color="success" />
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2, width: '100%' }}>
            <Typography variant="caption">Author Royalty (Total)</Typography>
            <Typography variant="h6">{currency.format(totals.totalAuthorRoyalty)}</Typography>
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
