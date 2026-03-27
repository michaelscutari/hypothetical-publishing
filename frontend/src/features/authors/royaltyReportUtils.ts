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
  ingramPrint: number;
  amazonPrint: number;
  amazonEbook: number;
  otherPrint: number;
  otherEbook: number;
  kenpTotal: number;
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
        existing.ingramPrint += book.ingramPrint;
        existing.amazonPrint += book.amazonPrint;
        existing.amazonEbook += book.amazonEbook;
        existing.otherPrint += book.otherPrint;
        existing.otherEbook += book.otherEbook;
        existing.kenpTotal += book.kenpTotal;
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
          ingramPrint: book.ingramPrint,
          amazonPrint: book.amazonPrint,
          amazonEbook: book.amazonEbook,
          otherPrint: book.otherPrint,
          otherEbook: book.otherEbook,
          kenpTotal: book.kenpTotal,
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
  ingramPrint: number;
  amazonPrint: number;
  amazonEbook: number;
  otherPrint: number;
  otherEbook: number;
  kenpTotal: number;
  unpaidRoyalty: number;
  paidRoyalty: number;
  totalRoyalty: number;
}

export function computeAllYearsTotals(quarters: Quarter[]): TotalsRow {
  return quarters.reduce<TotalsRow>(
    (totals, quarter) => ({
      quantity: totals.quantity + quarter.totals.quantity,
      handsold: totals.handsold + quarter.totals.handsold,
      ingramPrint: totals.ingramPrint + quarter.totals.ingramPrint,
      amazonPrint: totals.amazonPrint + quarter.totals.amazonPrint,
      amazonEbook: totals.amazonEbook + quarter.totals.amazonEbook,
      otherPrint: totals.otherPrint + quarter.totals.otherPrint,
      otherEbook: totals.otherEbook + quarter.totals.otherEbook,
      kenpTotal: totals.kenpTotal + quarter.totals.kenpTotal,
      unpaidRoyalty: totals.unpaidRoyalty + quarter.totals.unpaidRoyalty,
      paidRoyalty: totals.paidRoyalty + quarter.totals.paidRoyalty,
      totalRoyalty: totals.totalRoyalty + quarter.totals.totalRoyalty,
    }),
    {
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
    },
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
