import { IconCanvasController } from "..";
import { Icon } from "../model/Icon";
import { Color } from "../model/util/Color";
import { Point, Rectangle, Size } from "../model/util/Rectangle";

export interface ToolProps {
  color: Color;
  document: IconDocument;
  setDocument: (doc: IconDocument) => void;
  commit: () => void;
}

export interface PointingEvent {
  point: Point;
  touch: boolean;
}

export interface ControllerPointingEvent extends PointingEvent {
  pointToData(point: Point): number;
  pointToPixel(point: Point): Point | null;
  pixelToData(pixel: Point): number;
}

export interface PointingEventResult {
  cursor?: string;
}

export interface KeyEvent {
  key: string;
}

export interface KeyEventResult {
  preventDefault?: boolean;
}

export interface CanvasSensor {
  pointingGestureMove?(e: PointingEvent): PointingEventResult | undefined;
  pointingGestureStart?(e: PointingEvent): PointingEventResult | undefined;
  pointingGestureEnd?(e: PointingEvent): PointingEventResult | undefined;
  keyDown?(e: KeyEvent): KeyEventResult | undefined;
  keyUp?(e: KeyEvent): KeyEventResult | undefined;
}

export interface CanvasViewController extends CanvasSensor {
  render(context: CanvasRenderingContext2D, size: Size): void;
}

export interface IconDocument {
  icon: Icon;
  selectionRegion?: Rectangle;
  selectionBuffer?: Icon;
  selectionSprite?: Icon;
}

export interface IconEditorTool {
  pointingGestureMove?(
    e: ControllerPointingEvent
  ): PointingEventResult | undefined;
  pointingGestureStart?(
    e: ControllerPointingEvent
  ): PointingEventResult | undefined;
  pointingGestureEnd?(
    e: ControllerPointingEvent
  ): PointingEventResult | undefined;
  keyDown?(e: KeyEvent): KeyEventResult | undefined;
  keyUp?(e: KeyEvent): KeyEventResult | undefined;
  activate?: () => void;
  deactivate?: () => void;
  useColor?: (color: Color) => void;
}
