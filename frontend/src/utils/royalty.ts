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
