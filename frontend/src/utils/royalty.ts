/** Sale source union — matches backend SaleSource enum. */
type SaleSourceCode = 'HAND_SOLD' | 'DISTRIBUTOR' | 'KICKSTARTER';

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
 * For handsold sales, computes from (cover - print) * quantity.
 * For Kickstarter sales, print cost is treated as 0, so revenue is cover * quantity.
 * For distributor sales, returns the provided distributor revenue as-is.
 */
export function computePublisherRevenue(
  saleSource: SaleSourceCode,
  coverPrice: number,
  printCost: number,
  quantity: number | null,
  distributorRevenue: number | null,
): number | null {
  if (saleSource === 'DISTRIBUTOR') return distributorRevenue;
  if (quantity == null) return null;
  const effectivePrintCost = saleSource === 'KICKSTARTER' ? 0 : printCost;
  return computeHandsoldRevenue(coverPrice, effectivePrintCost, quantity);
}

/**
 * Compute author royalty for a sale, selecting the rate by sale source.
 * Handsold and Kickstarter both use the handsold/Kickstarter rate per def 10.
 */
export function computeSaleRoyalty(
  revenue: number | null,
  saleSource: SaleSourceCode,
  handsoldRate: number,
  distributorRate: number,
): number | null {
  if (revenue == null) return null;
  const rate = saleSource === 'DISTRIBUTOR' ? distributorRate : handsoldRate;
  return computeRoyalty(revenue, rate);
}
