/**
 * Calculate percentage of a value
 * @param part - The part value
 * @param total - The total value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Calculated percentage
 */
export const calculatePercentage = (part: number, total: number, decimals: number = 2): number => {
  if (total === 0) return 0;
  return parseFloat(((part / total) * 100).toFixed(decimals));
};
