/**
 * Generates a consistent, vibrant hex color based on a string (like a department name).
 * Used for dynamic team gradients.
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert hash to HSL to ensure it's vibrant and not too dark/light
  // Hue: 0-360, Saturation: 70-100%, Lightness: 50-60%
  const h = Math.abs(hash) % 360;
  const s = 70 + (Math.abs(hash) % 30);
  const l = 50 + (Math.abs(hash) % 10);
  
  return hslToHex(h, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
