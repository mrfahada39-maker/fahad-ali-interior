/** Consistent PKR price formatting across the storefront. */
export function formatPricePk(amount: number, decimals: 0 | 2 = 0): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(decimals === 0 ? Math.round(amount) : amount);
}
