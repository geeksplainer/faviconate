import { cloneIconDocument } from "@faviconate/pixler/src/model/IconEditor";
import { Color } from "@faviconate/pixler/src/model/util/Color";
import { Point } from "@faviconate/pixler/src/model/util/Rectangle";
import {
  ControllerPointingEvent,
  IconDocument,
  PointingEventResult,
  ToolProps,
} from "@faviconate/pixler/src/models";
import { useState } from "react";

export function usePencil({ color, document, setDocument, commit }: ToolProps) {
  const [drawing, onDrawingChange] = useState(false);

  const drawAt = (p: Point, pointToData: (p: Point) => number) => {
    const index = pointToData(p);

    if (index < 0) {
      return;
    }

    const newState = cloneIconDocument(document);
    const { data } = newState.icon;

    data[index] = color.r;
    data[index + 1] = color.g;
    data[index + 2] = color.b;
    data[index + 3] = Math.round(color.a * 255);

    setDocument(newState);
  };

  const pointingGestureStart = (
    e: ControllerPointingEvent
  ): PointingEventResult | undefined => {
    onDrawingChange(true);
    drawAt(e.point, e.pointToData);
    return;
  };

  const pointingGestureMove = (
    e: ControllerPointingEvent
  ): PointingEventResult | undefined => {
    if (drawing) {
      drawAt(e.point, e.pointToData);
    }
    return;
  };

  const pointingGestureEnd = (): PointingEventResult | undefined => {
    onDrawingChange(false);
    commit();
    return;
  };

  return {
    pointingGestureStart,
    pointingGestureMove,
    pointingGestureEnd,
  };
}
