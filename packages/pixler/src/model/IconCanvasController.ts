import {
  CanvasViewController,
  KeyEvent,
  KeyEventResult,
  PointingEvent,
  PointingEventResult,
  IconDocument,
  IconEditorTool,
} from "../models";
import { cloneIconDocument } from "./IconEditor";
import { IconService } from "./IconService";
import {
  IconDocumentRenderer,
  IconDocumentRendererParams,
} from "./rendering/IconDocumentRenderer";
import {
  makePt,
  makeSz,
  Point,
  Rectangle,
  scaleToContain,
  Size,
} from "./util/Rectangle";
import { Icon } from "./Icon";
import { ClipboardEmptyError, ClipboardService } from "./ClipboardService";
import { NoSelectionError } from "./errors";
import { Color } from "./util/Color";
import { uuid } from "./util/uuid";

const MIME_PNG = "image/png";

export interface PasteResult {
  success: boolean;
  warnings: string[];
}

export type DownloadFormat = "png" | "ico";

export type ColorPickCallback = (
  color: Color | null,
  colorHover?: Color
) => void;

export type IconCanvasProps = {
  document: IconDocument;
  renderParams: Partial<IconDocumentRendererParams> &
    Pick<
      IconDocumentRendererParams,
      "gridColor" | "checkerColorA" | "checkerColorB"
    >;
  setDocument: (doc: IconDocument) => void;
  commit: () => void;
  rollback: () => void;
  tool?: IconEditorTool;
  colorPicking?: boolean;
  onColorPicked?: ColorPickCallback;
};

export type IconCanvasController = CanvasViewController & {
  document: IconDocument;
  tool?: IconEditorTool;
  cloneDocument: () => IconDocument;
  copy: () => Promise<void>;
  cut: () => Promise<void>;
  paste: () => Promise<PasteResult>;
  importFile: (file: Blob) => Promise<void>;
  downloadAs: (format: DownloadFormat, icons?: Icon[] | null) => Promise<void>;
  pointToData: (p: Point) => number;
};

export function createIconCanvasController({
  document,
  renderParams,
  setDocument,
  commit,
  rollback,
  tool,
  colorPicking,
  onColorPicked,
}: IconCanvasProps): IconCanvasController {
  const id = uuid();
  const iconSize = makeSz(document.icon.width, document.icon.height);
  let previewBounds: Rectangle = Rectangle.empty;
  let previewPixelSize = 0;

  const cloneDocument = (): IconDocument => {
    return cloneIconDocument(document);
  };

  const colorFromPoint = (p: Point): Color | null => {
    const i = pointToData(p);

    if (i < 0) {
      return null;
    }

    const { data } = document.icon;
    return Color.fromTupleInt8([
      data[i] || 0,
      data[i + 1] || 0,
      data[i + 2] || 0,
      data[i + 3] || 0,
    ]);
  };

  const copy = async (): Promise<void> => {
    if (!document.selectionSprite) {
      return;
    }

    const blob = await IconService.asBlobWithMime(
      document.selectionSprite,
      MIME_PNG
    );

    await ClipboardService.copyBlob(blob, MIME_PNG);
  };

  const cut = async (): Promise<void> => {
    if (!document.selectionBuffer) {
      throw new NoSelectionError();
    }

    await copy();

    setDocument(cloneIconDocument(document));
    commit();
  };

  const paste = async (): Promise<PasteResult> => {
    let success = false;
    let warnings: string[] = [];

    try {
      const blob = await ClipboardService.pasteBlob();
      await importFile(blob);
      success = true;
    } catch (error) {
      if (error instanceof ClipboardEmptyError) {
        throw error;
      }
      if (Array.isArray(error)) {
        warnings = [...error];
      }
    }

    return { success, warnings };
  };

  const downloadAs = async (
    format: DownloadFormat,
    icons: Icon[] | null = null
  ): Promise<void> => {
    let blob: Blob;
    let name: string;

    if (format === "png") {
      blob = await IconService.asBlobWithMime(document.icon, MIME_PNG);
      name = "favicon.png";
    } else {
      blob = await IconService.asIcoBlob(icons || [document.icon]);
      name = "favicon.ico";
    }

    const a = window.document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  const importFile = async (file: Blob): Promise<void> => {
    const { icon } = document;
    const size = makeSz(icon.width, icon.height);
    const sprite = await IconService.fromFile(file, size);

    pasteSprite(sprite);
  };

  const pasteSprite = (sprite: Icon) => {
    const newDoc = cloneIconDocument(document);
    const containerRec = new Rectangle(
      0,
      0,
      newDoc.icon.width,
      newDoc.icon.height
    );
    const spriteRect = new Rectangle(0, 0, sprite.width, sprite.height)
      .centerAt(containerRec.center)
      .round();

    newDoc.selectionRegion = spriteRect;
    newDoc.selectionSprite = sprite;
    newDoc.selectionBuffer = newDoc.icon;
    newDoc.icon = IconService.blend(
      newDoc.selectionBuffer,
      newDoc.selectionSprite,
      newDoc.selectionRegion
    );

    setDocument(newDoc);
    commit();
  };

  const pixelToData = (pixel: Point): number => {
    const { icon } = document;
    return icon.width * 4 * pixel.y + pixel.x * 4;
  };

  const pointToPixel = (p: Point): Point | null => {
    if (!previewBounds.contains(p)) {
      return null;
    }

    const left = p.x - previewBounds.left;
    const top = p.y - previewBounds.top;

    return makePt(
      Math.floor(left / previewPixelSize),
      Math.floor(top / previewPixelSize)
    );
  };

  const pointToData = (p: Point): number => {
    // Deflation prevents round-errors
    if (!previewBounds.deflate(1, 1).contains(p)) {
      return -1;
    }

    const pixel = pointToPixel(p);

    if (pixel) {
      return pixelToData(pixel);
    }

    return -1;
  };

  const pointingGestureStart = (
    e: PointingEvent
  ): PointingEventResult | undefined => {
    if (colorPicking) {
      const color = colorFromPoint(e.point);

      if (color) {
        onColorPicked?.(color);
      }

      return;
    }

    if (tool?.pointingGestureStart) {
      // eslint-disable-next-line consistent-return
      return tool.pointingGestureStart({ ...e, pointToData, pointToPixel });
    }
  };

  const pointingGestureMove = (
    e: PointingEvent
  ): PointingEventResult | undefined => {
    if (colorPicking) {
      const color = colorFromPoint(e.point);

      if (color) {
        onColorPicked?.(color);
      }

      return;
    }

    if (tool?.pointingGestureMove) {
      // eslint-disable-next-line consistent-return
      return tool.pointingGestureMove({ ...e, pointToData, pointToPixel });
    }
  };

  const pointingGestureEnd = (
    e: PointingEvent
  ): PointingEventResult | undefined => {
    if (tool?.pointingGestureEnd) {
      return tool.pointingGestureEnd({ ...e, pointToData, pointToPixel });
    }
  };

  const keyDown = (e: KeyEvent): KeyEventResult | undefined => {
    if (tool?.keyDown) {
      return tool.keyDown(e);
    }
  };

  const keyUp = (e: KeyEvent): KeyEventResult | undefined => {
    if (tool?.keyUp) {
      return tool.keyUp(e);
    }
  };

  const renderMeasurements = (
    size: Size
  ): {
    plateBounds: Rectangle;
    previewSize: Size;
    pixelLength: number;
  } => {
    const { icon } = document;
    const cvBounds = new Rectangle(0, 0, size.width, size.height);
    const previewArea = cvBounds.deflate(0, 0);
    const previewSize = scaleToContain(previewArea.size, iconSize);
    previewPixelSize =
      Math.min(previewSize.width, previewSize.height) /
      Math.min(icon.width, icon.height);
    const pixelLength = previewPixelSize;
    const plateBounds = new Rectangle(
      0,
      0,
      icon.width * pixelLength,
      icon.height * pixelLength
    ).centerAt(cvBounds.center);

    return { plateBounds, previewSize, pixelLength };
  };

  const render = (context: CanvasRenderingContext2D, size: Size) => {
    context.clearRect(0, 0, size.width, size.height);

    if (document) {
      const { plateBounds, pixelLength } = renderMeasurements(size);

      previewPixelSize = pixelLength;
      previewBounds = plateBounds;

      const renderer = new IconDocumentRenderer({
        ...renderParams,
        document: document,
        context,
        plateBounds,
      });

      renderer.render();
    }
  };

  return {
    document,
    tool,
    cloneDocument,
    copy,
    cut,
    paste,
    importFile,
    downloadAs,
    pointingGestureStart,
    pointingGestureMove,
    pointingGestureEnd,
    keyDown,
    keyUp,
    render,
    pointToData,
  };
}
