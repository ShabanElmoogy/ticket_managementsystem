/** Converts hex color to RGB values */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
};

/** Converts RGB to hex */
export const rgbToHex = (r: number, g: number, b: number): string =>
  '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

/** Relative luminance (WCAG formula) */
export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const isLightColor = (color: string): boolean => {
  const rgb = hexToRgb(color);
  if (!rgb) return true;
  return getLuminance(rgb.r, rgb.g, rgb.b) > 0.5;
};

/** Returns '#000000' or '#ffffff' for best contrast on the given background */
export const getTextContrastColor = (backgroundColor: string): string =>
  isLightColor(backgroundColor) ? '#000000' : '#ffffff';

/** Generates a dark-mode variant of a color */
export const getDarkModeColor = (lightColor: string): string => {
  const rgb = hexToRgb(lightColor);
  if (!rgb) return lightColor;
  const { r, g, b } = rgb;
  if (isLightColor(lightColor)) {
    return rgbToHex(Math.round(r * 0.3), Math.round(g * 0.3), Math.round(b * 0.3));
  }
  return rgbToHex(
    Math.round(r + (255 - r) * 0.7),
    Math.round(g + (255 - g) * 0.7),
    Math.round(b + (255 - b) * 0.7),
  );
};

export const getColorPair = (selectedColor: string) => ({
  lightColor:     selectedColor,
  darkColor:      getDarkModeColor(selectedColor),
  lightTextColor: getTextContrastColor(selectedColor),
  darkTextColor:  getTextContrastColor(getDarkModeColor(selectedColor)),
});
