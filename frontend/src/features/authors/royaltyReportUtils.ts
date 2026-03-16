import { type RoyaltyReportResponse } from '@/api';

type Quarter = RoyaltyReportResponse['quarters'][number];

export function groupQuartersByYear(quarters: Quarter[]): Record<number, Quarter[]> {
  return quarters.reduce<Record<number, Quarter[]>>((grouped, quarter) => {
    const year = quarter.year;
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(quarter);
    return grouped;
  }, {});
}

export interface AggregatedBook {
  title: string;
  seriesName?: string;
  seriesPosition?: number;
  quantity: number;
  handsold: number;
  unpaidRoyalty: number;
  paidRoyalty: number;
  totalRoyalty: number;
}

export function aggregateAllYearsBooks(quarters: Quarter[]): AggregatedBook[] {
  const bookMap = new Map<string, AggregatedBook>();

  quarters.forEach((quarter) => {
    quarter.books.forEach((book) => {
      const key = book.displayName;
      const existing = bookMap.get(key);
      if (existing) {
        existing.quantity += book.quantity;
        existing.handsold += book.handsold;
        existing.unpaidRoyalty += book.unpaidRoyalty;
        existing.paidRoyalty += book.paidRoyalty;
        existing.totalRoyalty += book.totalRoyalty;
      } else {
        bookMap.set(key, {
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

  return Array.from(bookMap.values()).sort((a, b) => a.title.localeCompare(b.title));
}

export interface TotalsRow {
  quantity: number;
  handsold: number;
  unpaidRoyalty: number;
  paidRoyalty: number;
  totalRoyalty: number;
}

export function computeAllYearsTotals(quarters: Quarter[]): TotalsRow {
  return quarters.reduce<TotalsRow>(
    (totals, quarter) => ({
      quantity: totals.quantity + quarter.totals.quantity,
      handsold: totals.handsold + quarter.totals.handsold,
      unpaidRoyalty: totals.unpaidRoyalty + quarter.totals.unpaidRoyalty,
      paidRoyalty: totals.paidRoyalty + quarter.totals.paidRoyalty,
      totalRoyalty: totals.totalRoyalty + quarter.totals.totalRoyalty,
    }),
    { quantity: 0, handsold: 0, unpaidRoyalty: 0, paidRoyalty: 0, totalRoyalty: 0 },
  );
}

export function getQuarterLabel(quarter?: number): string {
  const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
  return labels[(quarter ?? 1) - 1];
}

export function getGeneratedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
