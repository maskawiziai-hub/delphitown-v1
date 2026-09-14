/**
 * colors.ts
 * DelphiTown v1 locked color palette
 * 23-color system for consistent visual identity across all assets
 * Based on Secret of Mana, Terranigma, and Stardew Valley inspiration
 */

export type ColorKey =
  // Skin tones (3 values)
  | 'mediumBrown'
  | 'richBrown'
  | 'darkBrown'
  | 'darkestBrown'
  | 'warmBeige'

  // Hair/neutral darks (3 values)
  | 'charcoal'
  | 'darkGray'
  | 'stone'

  // Clothing/neutral (3 values)
  | 'taupe'
  | 'stoneGray'
  | 'warmGray'

  // Reds/burgundy (3 values)
  | 'burgundy'
  | 'darkRed'
  | 'rustOrange'

  // Greens (3 values)
  | 'darkGreen'
  | 'forestGreen'
  | 'lightGreen'
  | 'earthy'

  // Town/natural (3 values)
  | 'grassGreen'
  | 'waterBlue'
  | 'sandBrown'

  // UI/accents (2 values)
  | 'gold'
  | 'white';

/**
 * DelphiTown color palette
 * Each color locked for v1 and referenced by all sprite/UI systems
 */
export const COLORS: Record<ColorKey, string> = {
  // Skin tones - warm earth tones for character diversity
  mediumBrown: '#B8956A',
  richBrown: '#8B6F47',
  darkBrown: '#5D4E37',
  darkestBrown: '#3D2817',
  warmBeige: '#D4A574',

  // Hair and dark neutrals - shadow/depth colors
  charcoal: '#2C2416',
  darkGray: '#54341A',
  stone: '#6B7280',

  // Neutral clothing - wardrobe foundation
  taupe: '#A39E93',
  stoneGray: '#8B8680',
  warmGray: '#9B9080',

  // Reds and warm accents - clothing accent colors
  burgundy: '#8B3A3A',
  darkRed: '#A0522D',
  rustOrange: '#CD853F',

  // Greens - nature/plants/forest
  darkGreen: '#2D5016',
  forestGreen: '#3D6B1F',
  lightGreen: '#6B9F3A',
  earthy: '#6B5F3A',

  // Town environment - terrain and structures
  grassGreen: '#7CB342',
  waterBlue: '#4A90E2',
  sandBrown: '#C9B59A',

  // UI and accents - interface and highlights
  gold: '#FFD700',
  white: '#F5F5F5',
};

/**
 * Color groupings for semantic use
 */
export const COLOR_GROUPS = {
  skinTones: ['mediumBrown', 'richBrown', 'darkBrown', 'darkestBrown', 'warmBeige'] as ColorKey[],
  hairColors: ['charcoal', 'darkGray', 'stone'] as ColorKey[],
  clothingNeutral: ['taupe', 'stoneGray', 'warmGray'] as ColorKey[],
  clothingAccent: ['burgundy', 'darkRed', 'rustOrange'] as ColorKey[],
  nature: ['darkGreen', 'forestGreen', 'lightGreen', 'grassGreen', 'earthy'] as ColorKey[],
  terrain: ['grassGreen', 'waterBlue', 'sandBrown'] as ColorKey[],
  ui: ['gold', 'white'] as ColorKey[],
};

/**
 * Get a color by key
 */
export function getColor(key: ColorKey): string {
  return COLORS[key] || '#000000';
}

/**
 * Get a random color from a group
 */
export function getRandomColorFromGroup(group: ColorKey[]): ColorKey {
  return group[Math.floor(Math.random() * group.length)];
}

/**
 * Get a color group by name
 */
export function getColorGroup(name: keyof typeof COLOR_GROUPS): ColorKey[] {
  return COLOR_GROUPS[name];
}
