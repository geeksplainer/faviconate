import { Icon } from "@faviconate/pixler/src/model/Icon";
import { cloneIconDocument } from "@faviconate/pixler/src/model/IconEditor";
import { IconService } from "@faviconate/pixler/src/model/IconService";
import {
  Point,
  Rectangle,
  makePt,
  makeSz,
} from "@faviconate/pixler/src/model/util/Rectangle";
import {
  ControllerPointingEvent,
  IconDocument,
  KeyEvent,
  KeyEventResult,
  PointingEventResult,
  ToolProps,
} from "@faviconate/pixler/src/models";
import { useEffect, useState } from "react";

type SelectionDragMode = "sprite" | "area";
export class NoSelectionError extends Error {}

export function useSelection({
  document,
  setDocument,
  commit,
}: {
  document: IconDocument;
  setDocument: (doc: IconDocument) => void;
  commit: () => void;
}) {
  const [selecting, setSelecting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPixel, setStartPixel] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState<SelectionDragMode>("sprite");

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (document.selectionRegion) {
      selectRegion(document.selectionRegion);
    }
  }, [dragMode]);

  const clipOutSelection = (
    sourceDocument?: IconDocument
  ): {
    buffer: Icon;
    sprite: Icon;
  } => {
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
  };

  const updateSelRegion = (a: Point, b: Point) => {
    const newDoc = cloneIconDocument(document);

    newDoc.selectionRegion = Rectangle.fromLTRB(
      Math.round(Math.min(a.x, b.x)),
      Math.round(Math.min(a.y, b.y)),
      Math.round(Math.max(a.x, b.x)) + 1,
      Math.round(Math.max(a.y, b.y)) + 1
    );

    setDocument(newDoc);
  };

  const selectionDragEnded = () => {
    setSelecting(false);
    if (!document.selectionRegion) {
      return;
    }

    selectRegion(document.selectionRegion, false);
    commit();
  };

  const pixelIsInsideSelection = (p: Point | null) => {
    return (
      p && document.selectionRegion && document.selectionRegion.contains(p)
    );
  };

  const dragEnded = () => {
    setDragging(false);
    setDragOffset(makePt(0, 0));
  };

  const updateDrag = (p: Point) => {
    moveSelection(p.x - dragOffset.x, p.y - dragOffset.y);
  };

  const moveSelection = (X: number, Y: number) => {
    if (!document.selectionRegion) {
      throw new NoSelectionError();
    }

    let x = X;
    let y = Y;

    const base = document.icon;
    const spriteW =
      document.selectionSprite?.width || document.selectionRegion.width;
    const spriteH =
      document.selectionSprite?.height || document.selectionRegion.height;

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

    if (dragMode === "sprite") {
      if (!document.selectionSprite || !document.selectionBuffer) {
        throw new NoSelectionError();
      }

      const { selectionBuffer, selectionSprite } = document;

      newDoc = {
        ...cloneIconDocument(document),
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
        ...cloneIconDocument(document),
        selectionRegion,
        selectionBuffer: undefined,
        selectionSprite: undefined,
      };
    }

    setDocument(newDoc);
  };

  const offsetSelection = (x: number, y: number) => {
    if (!document.selectionRegion || !document.selectionSprite) {
      throw new NoSelectionError();
    }

    const sprite: Icon = document.selectionSprite;
    const current: Rectangle = document.selectionRegion;

    let implicitX = current.right - sprite.width;
    let implicitY = current.bottom - sprite.height;

    implicitX = implicitX < 0 ? implicitX : 0;
    implicitY = implicitY < 0 ? implicitY : 0;

    moveSelection(current.left + x + implicitX, current.top + y + implicitY);
    commit();
  };

  const saveDragOffset = (p: Point) => {
    if (!document.selectionRegion) {
      throw new NoSelectionError();
    }

    setDragOffset(
      makePt(
        p.x - document.selectionRegion.left,
        p.y - document.selectionRegion.top
      )
    );
  };

  const selectRegion = (selectionRegion: Rectangle, transact = true) => {
    let doc: IconDocument = {
      ...cloneIconDocument(document),
      selectionRegion,
    };

    if (dragMode === "sprite") {
      const { buffer, sprite } = clipOutSelection(doc);

      doc = {
        ...doc,
        selectionBuffer: buffer,
        selectionSprite: sprite,
      };
    }
    setDocument(doc);
  };

  const selectAll = () => {
    const { icon } = document;
    selectRegion(Rectangle.fromSize(makeSz(icon.width, icon.height)));
    commit();
  };

  const clearSelection = () => {
    const newDoc = cloneIconDocument(document);

    // eslint-disable-next-line no-multi-assign
    newDoc.selectionRegion =
      // eslint-disable-next-line no-multi-assign
      newDoc.selectionSprite =
      // eslint-disable-next-line no-multi-assign
      newDoc.selectionBuffer =
        undefined;

    setDocument(newDoc);
    commit();
  };

  const cropToSelection = () => {
    const sprite = document.selectionSprite;

    if (sprite) {
      setDocument({ icon: sprite });
      commit();
    } else {
      throw new NoSelectionError();
    }
  };

  const deactivate = () => {
    if (document.selectionRegion) {
      clearSelection();
    }
  };

  const deleteSelection = () => {
    const newDoc = cloneIconDocument(document);

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

    setDocument(newDoc);
    commit();
  };

  const pointingGestureStart = (
    e: ControllerPointingEvent
  ): PointingEventResult | undefined => {
    const p = e.pointToPixel(e.point);

    if (p) {
      setStartPixel(p);

      if (pixelIsInsideSelection(p)) {
        setDragging(true);
        saveDragOffset(p);
      } else {
        setSelecting(true);
      }
    }
    return;
  };

  const pointingGestureEnd = (
    e: ControllerPointingEvent
  ): PointingEventResult | undefined => {
    const p = e.pointToPixel(e.point);

    if (selecting) {
      selectionDragEnded();
      return;
    }

    if (dragging) {
      dragEnded();
      return;
    }

    if (pixelIsInsideSelection(p)) {
      return { cursor: "move" };
    }
  };

  const pointingGestureMove = (
    e: ControllerPointingEvent
  ): PointingEventResult | undefined => {
    const p = e.pointToPixel(e.point);

    if (p) {
      if (selecting) {
        updateSelRegion(startPixel, p);
      } else if (dragging) {
        updateDrag(p);
      } else if (pixelIsInsideSelection(p)) {
        return { cursor: "move" };
      }
    }

    return { cursor: "crosshair" };
  };

  const keyDown = (e: KeyEvent): KeyEventResult | undefined => {
    if (e.key === "Escape") {
      clearSelection();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      deleteSelection();
    } else if (e.key === "ArrowLeft") {
      offsetSelection(-1, 0);
    } else if (e.key === "ArrowRight") {
      offsetSelection(1, 0);
    } else if (e.key === "ArrowUp") {
      offsetSelection(0, -1);
    } else if (e.key === "ArrowDown") {
      offsetSelection(0, 1);
    }
    return;
  };

  return {
    pointingGestureStart,
    pointingGestureMove,
    pointingGestureEnd,
    keyDown,
    deactivate,
    selectAll,
    clearSelection,
    deleteSelection,
    cropToSelection,
  };
}
