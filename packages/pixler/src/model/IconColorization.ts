import { Icon } from "./Icon";
import { ImageAdjustService } from "./ImageAdjustService";
import { colorStats } from "./PaletteService";
import { Color } from "./util/Color";

export interface IconColorization {
  brightness: number;
  contrast: number;
  palette: Color[];
  ditherKernel: number;
  ditherSerpentine: boolean;
  colorTrimThreshold: number;
}

export const EmptyIconColorization: IconColorization = {
  brightness: 0,
  contrast: 0,
  palette: [],
  ditherKernel: 0,
  ditherSerpentine: false,
  colorTrimThreshold: 0,
};

function filterPaletteThreshold(
  data: Uint8ClampedArray,
  threshold: number
): Color[] {
  const stats = colorStats(data);
  const result: Color[] = [];

  Object.entries(stats).forEach(([hex, freq]) => {
    if (freq > threshold) {
      result.push(Color.fromHex(hex));
    }
  });

  return result;
}

export function colorizeIcon(icon: Icon, params: IconColorization): void {
  const { brightness, contrast, palette } = params;
  const { width, height } = icon;

  if (brightness !== 0) {
    ImageAdjustService.brightness(icon.data, brightness);
  }

  if (contrast !== 0) {
    ImageAdjustService.contrast(icon.data, contrast);
  }

  if (palette.length > 0) {
    const { ditherKernel, ditherSerpentine, colorTrimThreshold } = params;

    ImageAdjustService.dither(
      icon.data,
      width,
      height,
      palette,
      ditherKernel,
      ditherSerpentine
    );

    if (colorTrimThreshold > 0) {
      const filteredPalette = filterPaletteThreshold(
        icon.data,
        colorTrimThreshold
      );
      ImageAdjustService.dither(
        icon.data,
        width,
        height,
        filteredPalette,
        ditherKernel,
        ditherSerpentine
      );
    }
  }
}
