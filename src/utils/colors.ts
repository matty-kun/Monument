const namedColorHints: Array<[RegExp, string]> = [
  [/\bred\b/i, '#ff3b30'],
  [/\bblue\b/i, '#0a84ff'],
  [/\bsilver\b/i, '#8e8e93'],
  [/\bgold(?:en)?\b/i, '#d6a51f'],
  [/\bgreen\b/i, '#30b46c'],
  [/\bpurple\b|\bviolet\b/i, '#8b5cf6'],
  [/\borange\b/i, '#ff8a1f'],
  [/\byellow\b/i, '#e7b416'],
  [/\bpink\b/i, '#ff4f9a'],
];

/**
 * Returns a stable team color, honoring color words in a team name before
 * falling back to a deterministic hue.
 */
export function teamNameToColor(str: string): string {
  const namedColor = namedColorHints.find(([pattern]) => pattern.test(str));
  if (namedColor) return namedColor[1];

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

export const stringToColor = teamNameToColor;

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
