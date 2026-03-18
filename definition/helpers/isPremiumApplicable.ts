/**
 * Check if a user is eligible for premium features
 * @param userTier - The user's subscription tier
 * @returns true if premium is applicable, false otherwise
 */
export const isPremiumApplicable = (userTier: string): boolean => {
  return ['premium', 'enterprise'].includes(userTier?.toLowerCase() || '');
};
