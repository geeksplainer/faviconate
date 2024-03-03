import { GraphicsMemoryError } from "../errors";
import { Color, ColorTuple } from "../util/Color";
import { makeSz, Point, Rectangle, Size, tuplePt } from "../util/Rectangle";
import { createCheckerPattern } from "./checker";

export type BitmapData = [Uint8ClampedArray, number];

// const darkMode = () => darkModeOn();
// const CHECKER_SIZE = 5;
// const checkerEven: () => ColorTuple = () => Color.transparent.tupleInt8;
// const checkerOdd: () => ColorTuple = () =>
//   Color.fromHex(darkMode() ? "fff" : "000").withAlpha(0.05).tupleInt8;

export function darkModeOn(): boolean | undefined {
  if (window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return undefined;
}

export function dataUrlFromImageData(
  data: Uint8ClampedArray,
  width: number
): string {
  const imageData = new ImageData(data, width);
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = width;
  canvas.height = data.length / 4 / width;

  const cx = canvas.getContext("2d");

  if (!cx) {
    throw new GraphicsMemoryError();
  }

  cx.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}

export interface CheckerPatternParams {
  tileSize: number;
  colorA: ColorTuple;
  colorB: ColorTuple;
}

export function createLegoPegOverlay(pixelSize: Size): HTMLCanvasElement {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  const MULTIPLIER = 1; // pixelSize.width / Math.round(pixelSize.width);
  const size = makeSz(
    pixelSize.width * MULTIPLIER,
    pixelSize.height * MULTIPLIER
  );
  const dark = Color.black.withAlpha(0.5);
  const light = Color.white.withAlpha(0.5);
  const bounds = Rectangle.fromSize(makeSz(size.width - 1, size.height - 1));
  canvas.width = Math.ceil(size.width);
  canvas.height = Math.ceil(size.height);
  const lightPath: Point[] = [
    bounds.southWest,
    bounds.location,
    bounds.northEast,
  ];
  const darkPath: Point[] = [
    bounds.southWest,
    bounds.southEast,
    bounds.northEast,
  ];

  const x = canvas.getContext("2d");

  if (!x) {
    throw new GraphicsMemoryError();
  }

  const drawLine = (points: Point[], color: Color) => {
    if (points.length < 2) {
      return;
    }
    x.beginPath();

    const point = points.shift();
    if (!point) {
      throw new Error("No point");
    }

    x.moveTo(...tuplePt(point));
    points.forEach((p) => x.lineTo(...tuplePt(p)));

    x.strokeStyle = color.cssRgba;
    x.stroke();
  };

  drawLine(darkPath, dark);
  drawLine(lightPath, light);

  return canvas;
}

export function createBitmapCanvas(bmp: BitmapData): HTMLCanvasElement {
  const [data, width] = bmp;
  const imageData = new ImageData(data, width);
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = width;
  canvas.height = data.length / 4 / width;

  const cx = canvas.getContext("2d");

  if (!cx) {
    throw new GraphicsMemoryError();
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
