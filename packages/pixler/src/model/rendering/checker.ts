type ColorTuple = [number, number, number, number];
type BitmapData = [Uint8ClampedArray, number];

interface CheckerPatternParams {
  tileSize: number;
  colorA: ColorTuple;
  colorB: ColorTuple;
}

const CHECKER_SIZE = 5;
const CHECKER_RATIO = 2;
const COLOR_BYTES = 4;
const PAD_0 = 0;
const PAD_1 = 1;
const PAD_2 = 2;
const PAD_3 = 3;
const POWER_2 = 2;
const GRAY = 242;
const ALPHA = 255;

const checkerEven: ColorTuple = [0, 0, 0, 0];
const checkerOdd: ColorTuple = [GRAY, GRAY, GRAY, ALPHA];

export function createCheckerPattern(
  params?: CheckerPatternParams
): BitmapData {
  const {
    tileSize = CHECKER_SIZE,
    colorA = checkerEven,
    colorB = checkerOdd,
  } = params || {};
  const dataSize = (tileSize * CHECKER_RATIO) ** POWER_2 * COLOR_BYTES;
  const bmpWidth = tileSize * CHECKER_RATIO;
  const data = new Uint8ClampedArray(dataSize);

  for (let i = 0; i < bmpWidth; i++) {
    for (let j = 0; j < bmpWidth; j++) {
      const evenOdd = i < tileSize ? j >= tileSize : j < tileSize;
      const color = evenOdd ? colorB : colorA;
      data[(i * bmpWidth + j) * COLOR_BYTES + PAD_0] = color[PAD_0];
      data[(i * bmpWidth + j) * COLOR_BYTES + PAD_1] = color[PAD_1];
      data[(i * bmpWidth + j) * COLOR_BYTES + PAD_2] = color[PAD_2];
      data[(i * bmpWidth + j) * COLOR_BYTES + PAD_3] = color[PAD_3];
    }
  }

  return [data, bmpWidth];
}

function createBitmapCanvas(bmp: BitmapData): HTMLCanvasElement {
  const [data, width] = bmp;
  const imageData = new ImageData(data, width);
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = width;
  canvas.height = data.length / COLOR_BYTES / width;

  const cx = canvas.getContext("2d");

  if (!cx) {
    throw new Error("No memory");
  }

  cx.putImageData(imageData, 0, 0);
  return canvas;
}

export function createCheckerPatternDataUrl(
  params?: CheckerPatternParams
): string {
  const bmp = createCheckerPattern(params);
  const canvas = createBitmapCanvas(bmp);
  return canvas.toDataURL();
}
