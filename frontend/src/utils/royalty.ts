/** Compute publisher revenue for a hand-sold sale: (coverPrice - printCost) * quantity. */
export function computeHandsoldRevenue(
  coverPrice: number,
  printCost: number,
  quantity: number,
): number {
  return Number(((coverPrice - printCost) * quantity).toFixed(2));
}

/** Compute author royalty: revenue * rate. */
export function computeRoyalty(revenue: number, rate: number): number {
  return Number((revenue * rate).toFixed(2));
}

/**
 * Compute publisher revenue for a sale, dispatching on sale source.
 * For handsold sales, computes from cover price / print cost.
 * For distributor sales, returns the provided distributor revenue as-is.
 */
export function computePublisherRevenue(
  saleSource: 'HAND_SOLD' | 'DISTRIBUTOR',
  coverPrice: number,
  printCost: number,
  quantity: number,
  distributorRevenue: number | null,
): number | null {
  if (saleSource === 'DISTRIBUTOR') return distributorRevenue;
  return computeHandsoldRevenue(coverPrice, printCost, quantity);
}

/**
 * Compute author royalty for a sale, selecting the rate by sale source.
 */
export function computeSaleRoyalty(
  revenue: number | null,
  saleSource: 'HAND_SOLD' | 'DISTRIBUTOR',
  handsoldRate: number,
  distributorRate: number,
): number | null {
  if (revenue == null) return null;
  const rate = saleSource === 'HAND_SOLD' ? handsoldRate : distributorRate;
  return computeRoyalty(revenue, rate);
}
