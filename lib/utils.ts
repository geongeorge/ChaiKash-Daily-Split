/**
 * Generates a consistent color from a string using a simple hashing algorithm.
 * The color will be in HSL format with:
 * - Hue: derived from string hash (0-360)
 * - Saturation: fixed at 85%
 * - Lightness: fixed at 75%
 */
export function getColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to hue (0-360)
  const hue = Math.abs(hash % 360);

  // Return HSL color with fixed saturation and lightness
  return `hsl(${hue}, 85%, 75%)`;
}
