import {
  CanvasViewController,
  KeyEvent,
  KeyEventResult,
  PointingEvent,
  PointingEventResult,
} from "../components/IconControllerView";
import { IconDocument, IconEditor, IconEditorTool } from "./IconEditor";
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
import { SelectionTool } from "./tools/SelectionTool";
import { Icon } from "./Icon";
import { ClipboardEmptyError, ClipboardService } from "./ClipboardService";
import { NoSelectionError } from "./errors";
import { Color } from "./util/Color";
import { uuid } from "./util/uuid";

const MIME_PNG = "image/png";

export interface PasteResult {
  tool?: IconEditorTool;
  success: boolean;
  warnings: string[];
}

export type DownloadFormat = "png" | "ico";

export type ColorPickCallback = (
  color: Color | null,
  colorHover?: Color
) => void;

export class IconCanvasController implements CanvasViewController {
  readonly id = uuid();

  readonly editor: IconEditor;

  private _tool: IconEditorTool | null = null;

  private previewBounds: Rectangle = Rectangle.empty;

  private previewPixelSize = 0;

  private _colorPicker?: ColorPickCallback;

  constructor(
    readonly document?: IconDocument,
    readonly renderParams?: Partial<IconDocumentRendererParams>
  ) {
    this.editor = document
      ? new IconEditor(document)
      : new IconEditor({
          icon: IconService.newIcon(16, 16),
        });
  }

  colorFromPoint(p: Point): Color | null {
    const i = this.pointToData(p);

    if (i < 0) {
      return null;
    }

    const { data } = this.editor.document.icon;
    return Color.fromTupleInt8([
      data[i],
      data[i + 1],
      data[i + 2],
      data[i + 3],
    ]);
  }

  colorPicker(picker: ColorPickCallback | undefined) {
    this._colorPicker = picker;
  }

  async copy(): Promise<void> {
    if (!this.editor.document.selectionSprite) {
      return;
    }

    const blob = await IconService.asBlobWithMime(
      this.editor.document.selectionSprite,
      MIME_PNG
    );

    await ClipboardService.copyBlob(blob, MIME_PNG);
  }

  async cut(): Promise<void> {
    if (!this.editor.document.selectionBuffer) {
      throw new NoSelectionError();
    }

    await this.copy();

    this.editor.transact({
      ...this.editor.cloneDocument(),
      icon: this.editor.document.selectionBuffer,
      selectionRegion: undefined,
      selectionSprite: undefined,
      selectionBuffer: undefined,
    });
  }

  async paste(): Promise<PasteResult> {
    let success = false;
    let tool: IconEditorTool | undefined;
    let warnings: string[] = [];

    try {
      const blob = await ClipboardService.pasteBlob();
      tool = await this.importFile(blob);
      success = true;
    } catch (error) {
      if (error instanceof ClipboardEmptyError) {
        throw error;
      }
      if (Array.isArray(error)) {
        warnings = [...error];
      }
    }

    return { success, tool, warnings };
  }

  async downloadAs(
    format: DownloadFormat,
    icons: Icon[] | null = null
  ): Promise<void> {
    let blob: Blob;
    let name: string;

    if (format === "png") {
      blob = await IconService.asBlobWithMime(
        this.editor.document.icon,
        MIME_PNG
      );
      name = "favicon.png";
    } else {
      blob = await IconService.asIcoBlob(icons || [this.editor.document.icon]);
      name = "favicon.ico";
    }

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }

  async importFile(file: Blob): Promise<SelectionTool> {
    const { icon } = this.editor.document;
    const size = makeSz(icon.width, icon.height);
    const sprite = await IconService.fromFile(file, size);

    this.pasteSprite(sprite);

    if (this.tool instanceof SelectionTool) {
      return this.tool;
    }

    const tool = new SelectionTool(this);
    this.tool = tool;
    return tool;
  }

  pasteSprite(sprite: Icon) {
    const newDoc = this.editor.cloneDocument();
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

    this.editor.begin();
    this.editor.setDocument(newDoc);
    this.editor.commit();
  }

  pixelToData(pixel: Point): number {
    const { icon } = this.editor.document;
    return icon.width * 4 * pixel.y + pixel.x * 4;
  }

  pointToPixel(p: Point): Point | null {
    if (!this.previewBounds.contains(p)) {
      return null;
    }

    const left = p.x - this.previewBounds.left;
    const top = p.y - this.previewBounds.top;

    return makePt(
      Math.floor(left / this.previewPixelSize),
      Math.floor(top / this.previewPixelSize)
    );
  }

  pointToData(p: Point): number {
    // Deflation prevents round-errors
    if (!this.previewBounds.deflate(1, 1).contains(p)) {
      return -1;
    }

    const pixel = this.pointToPixel(p);

    if (pixel) {
      return this.pixelToData(pixel);
    }

    return -1;
  }

  pointingGestureStart(e: PointingEvent): PointingEventResult | void {
    if (this._colorPicker) {
      const color = this.colorFromPoint(e.point);

      if (color) {
        this._colorPicker(color);
        this._colorPicker = undefined;
      }

      return;
    }

    if (this.tool?.pointingGestureStart) {
      // eslint-disable-next-line consistent-return
      return this.tool.pointingGestureStart(e);
    }
  }

  pointingGestureMove(e: PointingEvent): PointingEventResult | void {
    if (this._colorPicker) {
      const color = this.colorFromPoint(e.point);

      if (color) {
        this._colorPicker(null, color);
      }

      return;
    }

    if (this.tool?.pointingGestureMove) {
      // eslint-disable-next-line consistent-return
      return this.tool.pointingGestureMove(e);
    }
  }

  // eslint-disable-next-line consistent-return
  pointingGestureEnd(e: PointingEvent): PointingEventResult | void {
    if (this.tool?.pointingGestureEnd) {
      return this.tool.pointingGestureEnd(e);
    }
  }

  // eslint-disable-next-line consistent-return
  keyDown(e: KeyEvent): KeyEventResult | void {
    if (this.tool?.keyDown) {
      return this.tool.keyDown(e);
    }
  }

  // eslint-disable-next-line consistent-return
  keyUp(e: KeyEvent): KeyEventResult | void {
    if (this.tool?.keyUp) {
      return this.tool.keyUp(e);
    }
  }

  renderMeasurements(size: Size): {
    plateBounds: Rectangle;
    previewSize: Size;
    pixelLength: number;
  } {
    const { icon } = this.editor.document;
    const cvBounds = new Rectangle(0, 0, size.width, size.height);
    const previewArea = cvBounds.deflate(0, 0);
    const previewSize = scaleToContain(previewArea.size, this.iconSize);
    // eslint-disable-next-line no-multi-assign
    const pixelLength = (this.previewPixelSize =
      Math.min(previewSize.width, previewSize.height) /
      Math.min(icon.width, icon.height));
    const plateBounds = new Rectangle(
      0,
      0,
      icon.width * pixelLength,
      icon.height * pixelLength
    ).centerAt(cvBounds.center);

    return { plateBounds, previewSize, pixelLength };
  }

  render(context: CanvasRenderingContext2D, size: Size) {
    context.clearRect(0, 0, size.width, size.height);

    if (this.editor.document) {
      const { plateBounds, pixelLength } = this.renderMeasurements(size);

      this.previewPixelSize = pixelLength;
      this.previewBounds = plateBounds;

      const renderer = new IconDocumentRenderer({
        ...this.renderParams,
        document: this.editor.document,
        context,
        plateBounds,
      });

      renderer.render();
    }
  }

  get iconSize(): Size {
    return makeSz(
      this.editor.document.icon.width,
      this.editor.document.icon.height
    );
  }

  get tool(): IconEditorTool | null {
    return this._tool;
  }

  set tool(value: IconEditorTool | null) {
    if (value === this._tool) {
      return;
    }

    if (this._tool?.deactivate) {
      this._tool.deactivate();
    }

    this._tool = value;

    if (this._tool?.activate) {
      this._tool.activate();
    }
  }
}
