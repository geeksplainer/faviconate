import { InvalidObjectError } from "./errors";
import { Color } from "./util/Color";
import { uuid } from "./util/uuid";

const VER = "1";

export interface PaletteColor {
  name: string;
  hex: string;
}

export interface Palette {
  version?: string;
  id?: string;
  name: string;
  native?: boolean;
  unsaved?: boolean;
  unnamed?: boolean;
  colors: PaletteColor[];
}

const PALETTES_STORAGE_KEY = "palettes-v1";

function validateVersion(arr: { version: string }[]): Palette[] {
  const r: Palette[] = [];

  arr.forEach((obj) => {
    if (obj.version === VER) {
      r.push(obj as Palette);
    }
  });

  return r;
}

export function colorStats(data: Uint8ClampedArray): Record<string, number> {
  const stats: Record<string, number> = {};

  for (let i = 0; i < data.length; i += 4) {
    const color = Color.fromInt8Array(data, i).hexRgba;

    if (color in stats) {
      stats[color]++;
    } else {
      stats[color] = 1;
    }
  }

  return stats;
}

export function replaceColor(
  data: Uint8ClampedArray,
  oldColor: Color,
  newColor: Color
): void {
  for (let i = 0; i < data.length; i += 4) {
    const color = Color.fromInt8Array(data, i);

    if (color.equals(oldColor)) {
      newColor.copyToUint8(data, i);
    }
  }
}

export const PaletteService = {
  async getAll(): Promise<Palette[]> {
    const value = String(window.localStorage.getItem(PALETTES_STORAGE_KEY));

    if (value) {
      const obj = JSON.parse(value);

      if (!obj) {
        return [];
      }
      if (!Array.isArray(obj)) {
        throw new InvalidObjectError("Invalid data in localStorage");
      }
      return validateVersion(obj);
    }
    return [];
  },

  async upsert(palette: Palette): Promise<Palette> {
    if (!palette.id) {
      // eslint-disable-next-line no-param-reassign
      palette.id = uuid();
    }

    // eslint-disable-next-line no-param-reassign
    palette = { ...palette, unsaved: false, version: VER };

    const all = await this.getAll();
    const index = all.findIndex((p) => p.id === palette.id);

    if (index >= 0) {
      all[index] = palette;
    } else {
      all.push(palette);
    }

    window.localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(all));
    return palette;
  },
};
