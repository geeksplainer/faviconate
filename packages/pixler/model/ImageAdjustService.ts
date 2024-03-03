import { Color } from "./util/Color";
import { Point } from "./util/Rectangle";

export interface ValueRange {
  min?: number;
  max: number;
  value: number;
}

export interface ImageScaleScrollSettings {
  scrollX: ValueRange;
  scrollY: ValueRange;
  scale: ValueRange;
  onScaleChanged: (scale: number) => void;
  onScrollChanged: (scroll: Point) => void;
}

export const ImageAdjustService = {
  brightness(data: Uint8ClampedArray, delta: number) {
    for (let i = 0; i < data.length; i += 4) {
      // eslint-disable-next-line no-param-reassign
      data[i] = Math.max(Math.min(data[i] + delta, 255), 0);
      // eslint-disable-next-line no-param-reassign
      data[i + 1] = Math.max(Math.min(data[i + 1] + delta, 255), 0);
      // eslint-disable-next-line no-param-reassign
      data[i + 2] = Math.max(Math.min(data[i + 2] + delta, 255), 0);
    }
  },

  contrast(data: Uint8ClampedArray, delta: number) {
    const factor = (259 * (delta + 255)) / (255 * (259 - delta));
    const LIMIT = 128;

    for (let i = 0; i < data.length; i += 4) {
      // eslint-disable-next-line no-param-reassign
      data[i] = Math.max(Math.min(factor * (data[i] - LIMIT) + LIMIT, 255), 0);
      // eslint-disable-next-line no-param-reassign
      data[i + 1] = Math.max(
        Math.min(factor * (data[i + 1] - LIMIT) + LIMIT, 255),
        0
      );
      // eslint-disable-next-line no-param-reassign
      data[i + 2] = Math.max(
        Math.min(factor * (data[i + 2] - LIMIT) + LIMIT, 255),
        0
      );
    }
  },

  /**
   * Dithers the image in place
   */
  dither(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    palette: Color[],
    kernelIndex = 1,
    serpentine = true,
    wipeAlpha = true
  ) {
    // http://www.tannerhelland.com/4660/dithering-eleven-algorithms-source-code/
    const kernels: { [name: string]: number[][] } = {
      FloydSteinberg: [
        [7 / 16, 1, 0],
        [3 / 16, -1, 1],
        [5 / 16, 0, 1],
        [1 / 16, 1, 1],
      ],
      FalseFloydSteinberg: [
        [3 / 8, 1, 0],
        [3 / 8, 0, 1],
        [2 / 8, 1, 1],
      ],
      Stucki: [
        [8 / 42, 1, 0],
        [4 / 42, 2, 0],
        [2 / 42, -2, 1],
        [4 / 42, -1, 1],
        [8 / 42, 0, 1],
        [4 / 42, 1, 1],
        [2 / 42, 2, 1],
        [1 / 42, -2, 2],
        [2 / 42, -1, 2],
        [4 / 42, 0, 2],
        [2 / 42, 1, 2],
        [1 / 42, 2, 2],
      ],
      Atkinson: [
        [1 / 8, 1, 0],
        [1 / 8, 2, 0],
        [1 / 8, -1, 1],
        [1 / 8, 0, 1],
        [1 / 8, 1, 1],
        [1 / 8, 0, 2],
      ],
      Jarvis: [
        // Jarvis, Judice, and Ninke / JJN?
        [7 / 48, 1, 0],
        [5 / 48, 2, 0],
        [3 / 48, -2, 1],
        [5 / 48, -1, 1],
        [7 / 48, 0, 1],
        [5 / 48, 1, 1],
        [3 / 48, 2, 1],
        [1 / 48, -2, 2],
        [3 / 48, -1, 2],
        [5 / 48, 0, 2],
        [3 / 48, 1, 2],
        [1 / 48, 2, 2],
      ],
      Burkes: [
        [8 / 32, 1, 0],
        [4 / 32, 2, 0],
        [2 / 32, -2, 1],
        [4 / 32, -1, 1],
        [8 / 32, 0, 1],
        [4 / 32, 1, 1],
        [2 / 32, 2, 1],
      ],
      Sierra: [
        [5 / 32, 1, 0],
        [3 / 32, 2, 0],
        [2 / 32, -2, 1],
        [4 / 32, -1, 1],
        [5 / 32, 0, 1],
        [4 / 32, 1, 1],
        [2 / 32, 2, 1],
        [2 / 32, -1, 2],
        [3 / 32, 0, 2],
        [2 / 32, 1, 2],
      ],
      TwoSierra: [
        [4 / 16, 1, 0],
        [3 / 16, 2, 0],
        [1 / 16, -2, 1],
        [2 / 16, -1, 1],
        [3 / 16, 0, 1],
        [2 / 16, 1, 1],
        [1 / 16, 2, 1],
      ],
      SierraLite: [
        [2 / 4, 1, 0],
        [1 / 4, -1, 1],
        [1 / 4, 0, 1],
      ],
    };
    const names = [
      "FloydSteinberg",
      "FalseFloydSteinberg",
      "Stucki",
      "Atkinson",
      "Jarvis",
      "Burkes",
      "Sierra",
      "TwoSierra",
      "SierraLite",
    ];

    if (kernelIndex < 0 || kernelIndex > names.length - 1) {
      throw new Error(`Unknown dithering kernel: ${kernelIndex}`);
    }

    const nearestBuffer = new Map<number, Color>();
    const nearest = (r: number, g: number, b: number): Color => {
      const originInt =
        // eslint-disable-next-line no-bitwise
        (255 << 24) | // alpha
        // eslint-disable-next-line no-bitwise
        (b << 16) | // blue
        // eslint-disable-next-line no-bitwise
        (g << 8) | // green
        r;

      if (nearestBuffer.has(originInt)) {
        return nearestBuffer.get(originInt) || Color.transparent;
      }

      let min = {
        distance: Number.MAX_SAFE_INTEGER,
        color: Color.white,
      };

      palette.forEach((color) => {
        const distance = Math.sqrt(
          (r - color.r) ** 2 + (g - color.g) ** 2 + (b - color.b) ** 2
        );
        if (distance < min.distance) {
          min = { distance, color };
        }
      });

      nearestBuffer.set(originInt, min.color);

      return min.color;
    };
    const getPixel = (x: number, y: number): [number, number, number] => {
      const i = width * 4 * y + x * 4;
      return [data[i], data[i + 1], data[i + 2]];
    };
    const setPixel = (
      x: number,
      y: number,
      r: number,
      g: number,
      b: number
    ) => {
      const i = width * 4 * y + x * 4;
      // eslint-disable-next-line no-param-reassign
      data[i] = r;
      // eslint-disable-next-line no-param-reassign
      data[i + 1] = g;
      // eslint-disable-next-line no-param-reassign
      data[i + 2] = b;
      // eslint-disable-next-line no-param-reassign
      data[i + 3] = wipeAlpha ? 255 : data[i + 3];
    };

    const kernel: number[][] = kernels[names[kernelIndex]];

    let dir = serpentine ? -1 : 1;

    for (let y = 0; y < height; y++) {
      dir *= serpentine ? -1 : 1;

      for (
        let x = dir === 1 ? 0 : width - 1, xEnd = dir === 1 ? width : -1;
        x !== xEnd;
        x += dir
      ) {
        // Image pixel
        const [r1, g1, b1] = getPixel(x, y);

        // Reduced pixel
        const [r2, g2, b2] = nearest(r1, g1, b1).tupleInt8;

        setPixel(x, y, r2, g2, b2);

        // Component distance
        const er = r1 - r2;
        const eg = g1 - g2;
        const eb = b1 - b2;

        for (
          let i = dir === 1 ? 0 : kernel.length - 1,
            end = dir === 1 ? kernel.length : 0;
          i !== end;
          i += dir
        ) {
          const x1 = x + kernel[i][1] * dir;
          const y1 = y + kernel[i][2];

          if (x1 >= 0 && x1 < width && y1 >= 0 && y1 < height) {
            const d = kernel[i][0];

            const [r3, g3, b3] = getPixel(x1, y1);

            const r4 = Math.max(0, Math.min(255, r3 + er * d));
            const g4 = Math.max(0, Math.min(255, g3 + eg * d));
            const b4 = Math.max(0, Math.min(255, b3 + eb * d));

            setPixel(x1, y1, r4, g4, b4);
          }
        }
      }
    }
  },
};
