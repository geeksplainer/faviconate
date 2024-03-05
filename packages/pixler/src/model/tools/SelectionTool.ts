import { IconDocument, IconEditor, IconEditorTool } from "../IconEditor";
import {
  KeyEvent,
  KeyEventResult,
  PointingEvent,
  PointingEventResult,
} from "../../models";
import { makePt, makeSz, Point, Rectangle } from "../util/Rectangle";
import { IconCanvasController } from "../IconCanvasController";
import { Icon } from "../Icon";
import { IconService } from "../IconService";
import { NoSelectionError } from "../errors";

export type SelectionDragMode = "sprite" | "area";

export class SelectionTool implements IconEditorTool {
  private selecting = false;
  private dragging = false;
  private dragOffset: Point = makePt(0, 0);
  private startPixel = makePt(0, 0);

  _dragMode: SelectionDragMode = "sprite";

  constructor(readonly controller: IconCanvasController) {}

  private clipOutSelection(sourceDocument?: IconDocument): {
    buffer: Icon;
    sprite: Icon;
  } {
    const document = sourceDocument || this.document;

    if (!document.selectionRegion) {
      throw new Error("No selection region to clip out");
    }

    const buffer = IconService.clone(document.icon);
    const sprite = IconService.fromIcon(buffer, document.selectionRegion);

    IconService.region32(buffer, document.selectionRegion, (index) => {
      buffer.data[index] = 0;
      buffer.data[index + 1] = 0;
      buffer.data[index + 2] = 0;
      buffer.data[index + 3] = 0;
    });

    return { buffer, sprite };
  }

  private updateSelRegion(a: Point, b: Point) {
    const newDoc = this.controller.cloneDocument();

    newDoc.selectionRegion = Rectangle.fromLTRB(
      Math.round(Math.min(a.x, b.x)),
      Math.round(Math.min(a.y, b.y)),
      Math.round(Math.max(a.x, b.x)) + 1,
      Math.round(Math.max(a.y, b.y)) + 1
    );

    this.controller.setDocument(newDoc);
  }

  private selectionDragEnded() {
    if (!this.document.selectionRegion) {
      return;
    }

    this.selectRegion(this.document.selectionRegion, false);
    this.controller.commit();

    this.selecting = false;
  }

  private pixelIsInsideSelection(p: Point | null) {
    return (
      p &&
      this.document.selectionRegion &&
      this.document.selectionRegion.contains(p)
    );
  }

  private dragEnded() {
    this.dragging = false;
    this.dragOffset = makePt(0, 0);
  }

  private updateDrag(p: Point) {
    this.moveSelection(p.x - this.dragOffset.x, p.y - this.dragOffset.y);
  }

  private moveSelection(X: number, Y: number) {
    if (!this.document.selectionRegion) {
      throw new NoSelectionError();
    }

    let x = X;
    let y = Y;

    const base = this.document.icon;
    const spriteW =
      this.document.selectionSprite?.width ||
      this.document.selectionRegion.width;
    const spriteH =
      this.document.selectionSprite?.height ||
      this.document.selectionRegion.height;

    x = Math.max(-spriteW, x);
    x = Math.min(base.width, x);
    y = Math.max(-spriteH, y);
    y = Math.min(base.height, y);

    const region = new Rectangle(x, y, spriteW, spriteH);
    const offset = makePt(
      region.left < 0 ? Math.abs(region.left) : 0,
      region.top < 0 ? Math.abs(region.top) : 0
    );
    const selectionRegion = Rectangle.fromLTRB(
      region.left < 0 ? 0 : region.left,
      region.top < 0 ? 0 : region.top,
      region.right > base.width ? base.width : region.right,
      region.bottom > base.height ? base.height : region.bottom
    );

    let newDoc: IconDocument;

    if (this.dragMode === "sprite") {
      if (!this.document.selectionSprite || !this.document.selectionBuffer) {
        throw new NoSelectionError();
      }

      const { selectionBuffer, selectionSprite } = this.document;

      newDoc = {
        ...this.controller.cloneDocument(),
        selectionRegion,
        icon: IconService.blend(
          selectionBuffer,
          selectionSprite,
          selectionRegion,
          offset
        ),
      };
    } else {
      newDoc = {
        ...this.controller.cloneDocument(),
        selectionRegion,
        selectionBuffer: undefined,
        selectionSprite: undefined,
      };
    }

    this.controller.setDocument(newDoc);
  }

  private offsetSelection(x: number, y: number) {
    if (!this.document.selectionRegion || !this.document.selectionSprite) {
      throw new NoSelectionError();
    }

    const sprite: Icon = this.document.selectionSprite;
    const current: Rectangle = this.document.selectionRegion;

    let implicitX = current.right - sprite.width;
    let implicitY = current.bottom - sprite.height;

    implicitX = implicitX < 0 ? implicitX : 0;
    implicitY = implicitY < 0 ? implicitY : 0;

    this.moveSelection(
      current.left + x + implicitX,
      current.top + y + implicitY
    );
    this.controller.commit();
  }

  private saveDragOffset(p: Point) {
    if (!this.document.selectionRegion) {
      throw new NoSelectionError();
    }

    this.dragOffset = makePt(
      p.x - this.document.selectionRegion.left,
      p.y - this.document.selectionRegion.top
    );
  }

  selectRegion(selectionRegion: Rectangle, transact = true) {
    let doc: IconDocument = {
      ...this.controller.cloneDocument(),
      selectionRegion,
    };

    if (this.dragMode === "sprite") {
      const { buffer, sprite } = this.clipOutSelection(doc);

      doc = {
        ...doc,
        selectionBuffer: buffer,
        selectionSprite: sprite,
      };
    }

    this.controller.setDocument(doc);
  }

  selectAll() {
    const { icon } = this.document;
    this.selectRegion(Rectangle.fromSize(makeSz(icon.width, icon.height)));
    this.controller.commit();
  }

  clearSelection() {
    const newDoc = this.controller.cloneDocument();

    // eslint-disable-next-line no-multi-assign
    newDoc.selectionRegion =
      // eslint-disable-next-line no-multi-assign
      newDoc.selectionSprite =
      // eslint-disable-next-line no-multi-assign
      newDoc.selectionBuffer =
        undefined;

    this.controller.setDocument(newDoc);
    this.controller.commit();
  }

  cropToSelection() {
    const sprite = this.controller.document.selectionSprite;

    if (sprite) {
      this.controller.setDocument({ icon: sprite });
      this.controller.commit();
    } else {
      throw new NoSelectionError();
    }
  }

  deactivate() {
    if (this.document.selectionRegion) {
      this.clearSelection();
    }
  }

  deleteSelection() {
    const newDoc = this.controller.cloneDocument();

    if (!newDoc.selectionBuffer) {
      throw new NoSelectionError();
    }

    newDoc.icon = newDoc.selectionBuffer;
    // eslint-disable-next-line no-multi-assign
    newDoc.selectionSprite =
      // eslint-disable-next-line no-multi-assign
      newDoc.selectionBuffer =
      // eslint-disable-next-line no-multi-assign
      newDoc.selectionRegion =
        undefined;

    this.controller.setDocument(newDoc);
    this.controller.commit();
  }

  pointingGestureStart(e: PointingEvent): PointingEventResult | undefined {
    const p = this.controller.pointToPixel(e.point);

    if (p) {
      this.startPixel = p;

      if (this.pixelIsInsideSelection(p)) {
        this.dragging = true;
        this.saveDragOffset(p);
      } else {
        this.selecting = true;
      }
    }

    return;
  }

  pointingGestureEnd(e: PointingEvent): PointingEventResult | undefined {
    const p = this.controller.pointToPixel(e.point);

    if (this.selecting) {
      this.selectionDragEnded();
    }

    if (this.dragging) {
      this.dragEnded();
      this.controller.commit();
    }

    if (this.pixelIsInsideSelection(p)) {
      return { cursor: "move" };
    }

    throw new NoSelectionError();
  }

  pointingGestureMove(e: PointingEvent): PointingEventResult | undefined {
    const p = this.controller.pointToPixel(e.point);

    if (p) {
      if (this.selecting) {
        this.updateSelRegion(this.startPixel, p);
      } else if (this.dragging) {
        this.updateDrag(p);
      } else if (this.pixelIsInsideSelection(p)) {
        return { cursor: "move" };
      }
    }

    return { cursor: "crosshair" };
  }

  keyDown(e: KeyEvent): KeyEventResult | undefined {
    if (e.key === "Escape") {
      this.clearSelection();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      this.deleteSelection();
    } else if (e.key === "ArrowLeft") {
      this.offsetSelection(-1, 0);
    } else if (e.key === "ArrowRight") {
      this.offsetSelection(1, 0);
    } else if (e.key === "ArrowUp") {
      this.offsetSelection(0, -1);
    } else if (e.key === "ArrowDown") {
      this.offsetSelection(0, 1);
    }
    return;
  }

  get document(): IconDocument {
    return this.controller.document;
  }

  get dragMode(): SelectionDragMode {
    return this._dragMode;
  }

  set dragMode(mode: SelectionDragMode) {
    const changed = mode !== this._dragMode;

    if (!changed) {
      return;
    }

    this._dragMode = mode;

    if (this.document.selectionRegion) {
      this.selectRegion(this.document.selectionRegion);
    }
  }
}
