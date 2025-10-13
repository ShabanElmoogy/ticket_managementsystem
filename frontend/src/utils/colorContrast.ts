/**
 * Simple color contrast utility for automatic dark mode color calculation
 */

/**
 * Converts hex color to RGB values
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Converts RGB to hex
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Calculates the relative luminance of a color
 */
export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Determines if a color is light or dark
 */
export const isLightColor = (color: string): boolean => {
  const rgb = hexToRgb(color);
  if (!rgb) return true;
  
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5;
};

/**
 * Gets the best contrast color (black or white) for text on a background
 */
export const getTextContrastColor = (backgroundColor: string): string => {
  return isLightColor(backgroundColor) ? '#000000' : '#ffffff';
};

/**
 * Generates a darker variant of a color for dark mode
 * If the color is light, make it darker
 * If the color is dark, make it lighter
 */
export const getDarkModeColor = (lightColor: string): string => {
  const rgb = hexToRgb(lightColor);
  if (!rgb) return lightColor;

  const { r, g, b } = rgb;
  
  if (isLightColor(lightColor)) {
    // For light colors, make them darker for dark mode
    const factor = 0.3; // Darken by 70%
    return rgbToHex(
      Math.round(r * factor),
      Math.round(g * factor),
      Math.round(b * factor)
    );
  } else {
    // For dark colors, make them lighter for dark mode
    const factor = 0.7; // Lighten by adding 70% of the remaining brightness
    return rgbToHex(
      Math.round(r + (255 - r) * factor),
      Math.round(g + (255 - g) * factor),
      Math.round(b + (255 - b) * factor)
    );
  }
};

/**
 * Simple function to get both light and dark mode colors
 * Returns an object with lightColor, darkColor, and text contrast colors
 */
export const getColorPair = (selectedColor: string) => {
  const lightColor = selectedColor;
  const darkColor = getDarkModeColor(selectedColor);
  
  return {
    lightColor,
    darkColor,
    lightTextColor: getTextContrastColor(lightColor),
    darkTextColor: getTextContrastColor(darkColor),
  };
};