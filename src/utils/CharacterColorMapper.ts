/**
 * CharacterColorMapper.ts
 * Maps Mana Seed Farmer sprite colors to DelphiTown's 23-color locked palette
 * Enables runtime color remapping without re-coloring sprite assets
 */

import { COLORS, type ColorKey } from '../constants/colors';

/**
 * Color ramp mapping: Mana Seed base colors -> DelphiTown palette
 * Based on visual analysis of Mana Seed color ramps.png
 */
export const MANA_SEED_BASE_RAMPS = {
  skin: ['#9D6C47', '#B8956A', '#D4A574'], // Light to dark brown skin tones
  hair: ['#3D2817', '#54341A', '#6B4423'], // Dark brown hair ramp
  clothing1: ['#8B4513', '#A0522D', '#CD853F'], // Brown clothing ramp
  clothing2: ['#4A4A4A', '#696969', '#808080'], // Gray clothing ramp
  tool: ['#5F3D2D', '#7B5A3D', '#A0704D'], // Wood/tool brown
};

/**
 * DelphiTown color mappings for character customization
 * Maps to locked color palette keys
 */
export const DELPHITOWN_CHARACTER_COLORS = {
  skinLight: 'mediumBrown' as ColorKey,
  skinMedium: 'richBrown' as ColorKey,
  skinDark: 'darkBrown' as ColorKey,

  hairDark: 'darkGray' as ColorKey,
  hairMedium: 'charcoal' as ColorKey,
  hairLight: 'stone' as ColorKey,

  clothingNeutral1: 'taupe' as ColorKey,
  clothingNeutral2: 'stoneGray' as ColorKey,
  clothingNeutral3: 'warmBeige' as ColorKey,

  clothingAccent1: 'burgundy' as ColorKey,
  clothingAccent2: 'darkRed' as ColorKey,
  clothingAccent3: 'rustOrange' as ColorKey,

  toolColor: 'richBrown' as ColorKey,
};

/**
 * Color remap configuration for character presets
 */
export interface ColorRemapPreset {
  name: string;
  skinTone: [ColorKey, ColorKey, ColorKey];
  hairColor: [ColorKey, ColorKey, ColorKey];
  clothingPrimary: [ColorKey, ColorKey, ColorKey];
  clothingAccent: [ColorKey, ColorKey, ColorKey];
}

/**
 * Pre-built color presets for characters
 */
export const CHARACTER_COLOR_PRESETS: Record<string, ColorRemapPreset> = {
  default: {
    name: 'Default',
    skinTone: ['mediumBrown', 'richBrown', 'darkBrown'],
    hairColor: ['charcoal', 'darkGray', 'stone'],
    clothingPrimary: ['taupe', 'stoneGray', 'warmBeige'],
    clothingAccent: ['burgundy', 'darkRed', 'rustOrange'],
  },
  fairSkin: {
    name: 'Fair Skin',
    skinTone: ['warmBeige', 'mediumBrown', 'richBrown'],
    hairColor: ['darkGray', 'charcoal', 'stone'],
    clothingPrimary: ['warmBeige', 'taupe', 'stoneGray'],
    clothingAccent: ['burgundy', 'darkRed', 'rustOrange'],
  },
  darkSkin: {
    name: 'Dark Skin',
    skinTone: ['richBrown', 'darkBrown', 'darkestBrown'],
    hairColor: ['darkGray', 'charcoal', 'darkestBrown'],
    clothingPrimary: ['stoneGray', 'taupe', 'warmBeige'],
    clothingAccent: ['burgundy', 'darkRed', 'rustOrange'],
  },
  rusticFarmer: {
    name: 'Rustic Farmer',
    skinTone: ['mediumBrown', 'richBrown', 'darkBrown'],
    hairColor: ['charcoal', 'darkGray', 'stone'],
    clothingPrimary: ['earthy', 'richBrown', 'rustOrange'],
    clothingAccent: ['darkRed', 'burgundy', 'darkestBrown'],
  },
  forest: {
    name: 'Forest Green',
    skinTone: ['warmBeige', 'mediumBrown', 'richBrown'],
    hairColor: ['darkGray', 'charcoal', 'darkestBrown'],
    clothingPrimary: ['darkGreen', 'forestGreen', 'lightGreen'],
    clothingAccent: ['richBrown', 'darkBrown', 'earthy'],
  },
};

/**
 * CharacterColorMapper: Remaps sprite color palettes at runtime
 * Converts Mana Seed's broader palette to DelphiTown's locked 23-color system
 */
export class CharacterColorMapper {
  /**
   * Get hex color from DelphiTown palette by key
   */
  static getDelphiTownColor(colorKey: ColorKey): string {
    return COLORS[colorKey] || '#000000';
  }

  /**
   * Create a color remap function for canvas-based sprite rendering
   * Maps Mana Seed base colors -> DelphiTown colors via ramp substitution
   *
   * Usage: Use in canvas imageData manipulation or CSS filter chains
   * @param preset Color preset to apply
   * @returns Function that maps hex color to remapped color
   */
  static createRemapFunction(preset: ColorRemapPreset): (hexColor: string) => string {
    // Build reverse lookup: Mana Seed hex -> DelphiTown hex
    const remapTable = new Map<string, string>();

    // Skin ramp
    const manaSkinRamp = MANA_SEED_BASE_RAMPS.skin;
    const delphiSkinRamp = [
      this.getDelphiTownColor(preset.skinTone[0]),
      this.getDelphiTownColor(preset.skinTone[1]),
      this.getDelphiTownColor(preset.skinTone[2]),
    ];
    for (let i = 0; i < manaSkinRamp.length; i++) {
      remapTable.set(manaSkinRamp[i].toLowerCase(), delphiSkinRamp[i].toLowerCase());
    }

    // Hair ramp
    const manaHairRamp = MANA_SEED_BASE_RAMPS.hair;
    const delphiHairRamp = [
      this.getDelphiTownColor(preset.hairColor[0]),
      this.getDelphiTownColor(preset.hairColor[1]),
      this.getDelphiTownColor(preset.hairColor[2]),
    ];
    for (let i = 0; i < manaHairRamp.length; i++) {
      remapTable.set(manaHairRamp[i].toLowerCase(), delphiHairRamp[i].toLowerCase());
    }

    // Clothing primary ramp
    const manaClothRamp = MANA_SEED_BASE_RAMPS.clothing1;
    const delphiClothRamp = [
      this.getDelphiTownColor(preset.clothingPrimary[0]),
      this.getDelphiTownColor(preset.clothingPrimary[1]),
      this.getDelphiTownColor(preset.clothingPrimary[2]),
    ];
    for (let i = 0; i < manaClothRamp.length; i++) {
      remapTable.set(manaClothRamp[i].toLowerCase(), delphiClothRamp[i].toLowerCase());
    }

    // Clothing accent ramp
    const manaAccentRamp = MANA_SEED_BASE_RAMPS.clothing2;
    const delphiAccentRamp = [
      this.getDelphiTownColor(preset.clothingAccent[0]),
      this.getDelphiTownColor(preset.clothingAccent[1]),
      this.getDelphiTownColor(preset.clothingAccent[2]),
    ];
    for (let i = 0; i < manaAccentRamp.length; i++) {
      remapTable.set(manaAccentRamp[i].toLowerCase(), delphiAccentRamp[i].toLowerCase());
    }

    // Return remap function
    return (hexColor: string): string => {
      const normalized = hexColor.toLowerCase();
      return remapTable.get(normalized) || hexColor;
    };
  }

  /**
   * Apply color remap to ImageData (for canvas-based rendering)
   * @param imageData Canvas ImageData to remap
   * @param remapFn Remap function from createRemapFunction()
   */
  static remapImageData(imageData: ImageData, remapFn: (hex: string) => string): ImageData {
    const data = imageData.data;
    const remappedData = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip transparent pixels
      if (a === 0) {
        remappedData[i] = r;
        remappedData[i + 1] = g;
        remappedData[i + 2] = b;
        remappedData[i + 3] = a;
        continue;
      }

      // Convert RGB to hex
      const hex = `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
      const remappedHex = remapFn(hex);

      // Convert hex back to RGB
      const remappedColor = parseInt(remappedHex.slice(1), 16);
      remappedData[i] = (remappedColor >> 16) & 255;
      remappedData[i + 1] = (remappedColor >> 8) & 255;
      remappedData[i + 2] = remappedColor & 255;
      remappedData[i + 3] = a;
    }

    return new ImageData(remappedData, imageData.width, imageData.height);
  }

  /**
   * Generate CSS filter chain to approximate color shift
   * (Alternative to canvas remapping; less precise but GPU-accelerated)
   * Not recommended for accurate palette matching
   */
  static generateCSSFilter(preset: ColorRemapPreset): string {
    // Rough approximation using hue rotation, saturation, brightness
    // This is a fallback; canvas-based remapping is more accurate
    return `hue-rotate(0deg) saturate(1.0) brightness(1.0)`;
  }

  /**
   * List all available color presets
   */
  static getAvailablePresets(): ColorRemapPreset[] {
    return Object.values(CHARACTER_COLOR_PRESETS);
  }

  /**
   * Get preset by name
   */
  static getPreset(name: string): ColorRemapPreset | null {
    return CHARACTER_COLOR_PRESETS[name] || null;
  }
}
