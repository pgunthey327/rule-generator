/**
 * Check if an object is empty
 * @param obj - The object to check
 * @returns true if object is empty, false otherwise
 */
export const isEmptyObject = (obj: Record<string, any>): boolean => {
  return Object.keys(obj).length === 0;
};
