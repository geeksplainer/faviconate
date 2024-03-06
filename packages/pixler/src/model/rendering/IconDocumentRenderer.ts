import { makePt, makeSz, Point, Rectangle, Size } from "../util/Rectangle";
import { Color } from "../util/Color";
import { MemoryError } from "../errors";
import { MarchingAnts } from "./MarchingAnts";
import { IconService } from "../IconService";
import { createBitmapCanvas, createLegoPegOverlay } from "./RenderUtils";
import { createCheckerPattern } from "./checker";
import { IconDocument } from "../../models";

const CORNER_RADIUS = 0;
const MIN_PIXEL_SIZE_FOR_GRID = 10;
const CLOCK_MOD = 4;

interface Corners {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

export type RenderMode = "pixel" | "circle" | "lego" | "print" | "print-dots";

export interface IconDocumentRendererParams {
  document: IconDocument;
  context: CanvasRenderingContext2D;
  plateBounds: Rectangle;
  drawBackground?: boolean;
  drawGrid?: boolean;
  mode?: RenderMode;
  checkerColorA: Color;
  checkerColorB: Color;
  gridColor: Color;
}

export class IconDocumentRenderer {
  private static clock = 0;
  private static clockReminder = 0;
  private static checkerCanvas: HTMLCanvasElement | null = null;
  private static legoCanvas: Record<string, HTMLCanvasElement> = {};
  private static pixelsBuffer: HTMLCanvasElement | null = null;
  private static pixelsContext: CanvasRenderingContext2D | null = null;
  private static legoPeg: HTMLImageElement | null;

  static getPixelsBuffer(canvasSize: Size): {
    canvas: HTMLCanvasElement;
    cx: CanvasRenderingContext2D;
  } {
    const t = IconDocumentRenderer;
    if (
      !t.pixelsBuffer ||
      t.pixelsBuffer.width !== canvasSize.width ||
      t.pixelsBuffer.height !== canvasSize.height
    ) {
      t.pixelsBuffer = document.createElement("canvas");
      t.pixelsBuffer.width = canvasSize.width;
      t.pixelsBuffer.height = canvasSize.height;
      t.pixelsContext = t.pixelsBuffer.getContext("2d");
    }

    if (!t.pixelsContext) {
      throw new MemoryError();
    }

    return {
      canvas: t.pixelsBuffer,
      cx: t.pixelsContext,
    };
  }

  static clearCheckerCanvasCache() {
    IconDocumentRenderer.checkerCanvas = null;
  }

  static getCheckerPattern(
    context: CanvasRenderingContext2D,
    colorA: Color,
    colorB: Color
  ): CanvasPattern | null {
    if (!IconDocumentRenderer.checkerCanvas) {
      const pattern = createCheckerPattern({
        tileSize: 5,
        colorA: colorA.tupleInt8,
        colorB: colorB.tupleInt8,
      });
      IconDocumentRenderer.checkerCanvas = createBitmapCanvas(pattern);
    }

    return context.createPattern(IconDocumentRenderer.checkerCanvas, "repeat");
  }

  static getLegoCanvas(size: Size): HTMLCanvasElement {
    const key = `${size.width}`;

    if (!(key in IconDocumentRenderer.legoCanvas)) {
      IconDocumentRenderer.legoCanvas[key] = createLegoPegOverlay(size);
    }

    return IconDocumentRenderer.legoCanvas[key];
  }

  static getLegoPegImage(): HTMLImageElement {
    if (!IconDocumentRenderer.legoPeg) {
      IconDocumentRenderer.legoPeg = document.createElement("img");
      const img = IconDocumentRenderer.legoPeg;
      img.src = "/lego-peg.png";
    }
    if (!IconDocumentRenderer.legoPeg) {
      throw new Error("legoPeg is null");
    }
    return IconDocumentRenderer.legoPeg;
  }

  readonly bounds: Rectangle;

  constructor(readonly params: IconDocumentRendererParams) {
    this.bounds = params.plateBounds.deflate(CORNER_RADIUS, CORNER_RADIUS);
  }

  private pathRoundRect(bounds: Rectangle, radius: number | Corners = 10) {
    const { context } = this.params;
    const ctx = context;
    const { x, y } = bounds.location;
    const { width, height } = bounds.size;

    const rad =
      typeof radius === "number"
        ? {
            tl: radius,
            tr: radius,
            br: radius,
            bl: radius,
          }
        : radius;

    ctx.beginPath();
    ctx.moveTo(x + rad.tl, y);
    ctx.lineTo(x + width - rad.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + rad.tr);
    ctx.lineTo(x + width, y + height - rad.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - rad.br, y + height);
    ctx.lineTo(x + rad.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - rad.bl);
    ctx.lineTo(x, y + rad.tl);
    ctx.quadraticCurveTo(x, y, x + rad.tl, y);
    ctx.closePath();
  }

  private pathLines(lines: [Point, Point][]) {
    const c = this.params.context;

    c.beginPath();

    // biome-ignore lint/complexity/noForEach: <explanation>
    lines.forEach((line) => {
      c.moveTo(line[0].x, line[0].y);
      c.lineTo(line[1].x, line[1].y);
    });
  }

  private renderPixels(pixelSize: Size) {
    const { document, context, mode } = this.params;
    const { canvas, cx } = IconDocumentRenderer.getPixelsBuffer(
      makeSz(document.icon.width, document.icon.height)
    );
    const { icon } = document;
    const { data } = icon;
    const { bounds } = this;

    if (!mode || mode === "pixel" || mode === "lego") {
      cx.putImageData(
        new ImageData(document.icon.data, document.icon.width),
        0,
        0
      );

      context.imageSmoothingEnabled = false;
      context.drawImage(canvas, ...this.bounds.tuple);
      context.imageSmoothingEnabled = true;

      if (mode === "lego") {
        // const legoCanvas = IconDocumentRenderer.getLegoCanvas(pixelSize);
        // const pattern = context.createPattern(legoCanvas, 'repeat');
        const img = IconDocumentRenderer.getLegoPegImage();
        const matrix = new DOMMatrix().scale(
          pixelSize.width / img.naturalWidth,
          pixelSize.height / img.naturalHeight
        );
        if (!img.complete) {
          return;
        }
        const pattern = context.createPattern(img, "repeat");

        if (pattern) {
          pattern.setTransform(matrix);
          context.save();
          context.fillStyle = pattern;
          context.translate(this.bounds.left, this.bounds.top);
          context.fillRect(...Rectangle.fromSize(this.bounds.size).tuple);
          context.restore();
        }
      }
    } else if (mode === "circle") {
      for (let i = 0; i < data.length; i += 4) {
        const color = Color.fromInt8Array(data, i);
        const pixel = IconService.indexToPixel(i, icon);
        const x = bounds.left + pixel.x * pixelSize.width + pixelSize.width / 2;
        const y =
          bounds.top + pixel.y * pixelSize.height + pixelSize.height / 2;
        context.beginPath();
        context.arc(x, y, pixelSize.width / 2, 0, Math.PI * 2);
        context.fillStyle = color.hexRgba;
        context.fill();
      }
    } else if (mode === "print") {
      context.strokeStyle = "#ccc";
      for (let i = 0; i < data.length; i += 4) {
        const color = Color.fromInt8Array(data, i);
        const pixel = IconService.indexToPixel(i, icon);
        const x = bounds.left + pixel.x * pixelSize.width;
        const y = bounds.top + pixel.y * pixelSize.height;
        const rect = Rectangle.fromSize(pixelSize).withLocation(makePt(x, y));
        context.strokeRect(x, y, pixelSize.width, pixelSize.height);

        const { r, g, b } = color;

        if (r === 0 && g === 0 && b === 0) {
          context.beginPath();
          context.moveTo(rect.northWest.x, rect.northWest.y);
          context.lineTo(rect.southEast.x, rect.southEast.y);
          context.stroke();
        }
      }
    } else if (mode === "print-dots") {
      context.strokeStyle = "#ccc";
      for (let i = 0; i < data.length; i += 4) {
        const color = Color.fromInt8Array(data, i);
        const pixel = IconService.indexToPixel(i, icon);
        const x = bounds.left + pixel.x * pixelSize.width;
        const y = bounds.top + pixel.y * pixelSize.height;
        const rect = Rectangle.fromSize(pixelSize).withLocation(makePt(x, y));
        // context.strokeRect(x, y, pixelSize.width, pixelSize.height);

        const { r, g, b } = color;
        context.beginPath();
        const ctr = rect.center;
        context.arc(ctr.x, ctr.y, rect.width / 2, 0, Math.PI * 2);

        if (r === 0 && g === 0 && b === 0) {
          context.moveTo(rect.northWest.x, rect.northWest.y);
          context.lineTo(rect.southEast.x, rect.southEast.y);
        }

        context.stroke();
      }
    } else {
      throw new Error(`Render mode not supported: ${mode}`);
    }
  }

  private renderGrid(pixelSize: Size, color: Color) {
    if (
      pixelSize.width < MIN_PIXEL_SIZE_FOR_GRID ||
      pixelSize.height < MIN_PIXEL_SIZE_FOR_GRID
    ) {
      return;
    }

    const { document, context } = this.params;
    const ctx = context;
    const { icon } = document;
    const { bounds } = this;

    ctx.beginPath();

    let x = this.bounds.left;
    let y = this.bounds.top;

    for (let i = 0; i <= icon.width; i++) {
      ctx.moveTo(x, bounds.top);
      ctx.lineTo(x, bounds.bottom);
      x += pixelSize.width;
    }

    for (let i = 0; i <= icon.height; i++) {
      ctx.moveTo(bounds.left, y);
      ctx.lineTo(bounds.right, y);
      y += pixelSize.height;
    }

    ctx.strokeStyle = color.cssRgba;
    ctx.stroke();
  }

  private renderFrame() {
    const { plateBounds, context } = this.params;
    const r = CORNER_RADIUS;
    const p = plateBounds;
    this.pathLines([
      p.offset(0, r).northSegment,
      p.offset(-r, 0).eastSegment,
      p.offset(0, -r).southSegment,
      p.offset(r, 0).westSegment,
    ]);
    //context.strokeStyle = gridOut().cssRgba;
    context.stroke();
  }

  private renderChecker() {
    const { context, checkerColorA, checkerColorB } = this.params;
    const pattern = IconDocumentRenderer.getCheckerPattern(
      context,
      checkerColorA,
      checkerColorB
    );

    if (!pattern) {
      return;
    }

    context.fillStyle = pattern;
    context.fillRect(...this.bounds.tuple);
  }

  private renderSelection(pixelSize: Size) {
    const { document, context } = this.params;
    if (!document.selectionRegion) {
      return;
    }

    const selection = document.selectionRegion;

    const selBounds = new Rectangle(
      this.bounds.left + selection.left * pixelSize.width,
      this.bounds.top + selection.top * pixelSize.height,
      selection.width * pixelSize.width,
      selection.height * pixelSize.height
    ).round();

    IconDocumentRenderer.clock++;

    if (IconDocumentRenderer.clock % CLOCK_MOD === 0) {
      IconDocumentRenderer.clockReminder++;

      if (IconDocumentRenderer.clockReminder === 9) {
        IconDocumentRenderer.clockReminder = 0;
      }
    }

    MarchingAnts.rectangle(
      context,
      selBounds,
      Color.black,
      Color.white,
      IconDocumentRenderer.clockReminder
    );
  }

  private drawPlate() {
    const { plateBounds, context } = this.params;
    this.pathRoundRect(plateBounds, CORNER_RADIUS);
    //context.fillStyle = plateBg().cssRgba;
    context.fill();
  }

  render() {
    const {
      document,
      drawGrid,
      drawBackground,
      mode,
      context,
      plateBounds,
      gridColor,
    } = this.params;
    const pixelSize = makeSz(
      this.bounds.width / document.icon.width,
      this.bounds.height / document.icon.height
    );

    // this.context.clearRect(...this.plateBounds.inflate(SAFE_CLEAR, SAFE_CLEAR).tuple);
    // this.context.clearRect(0, 0, this.)

    // this.drawPlate();

    if (mode?.startsWith("print")) {
      context.fillStyle = "white";
      context.fillRect(...plateBounds.tuple);
    } else if (drawBackground) {
      this.renderChecker();
    }

    this.renderPixels(pixelSize);

    if (drawGrid) {
      this.renderGrid(pixelSize, gridColor);
    }

    // this.renderFrame();

    if (document.selectionRegion) {
      this.renderSelection(pixelSize);
    }
  }
}
