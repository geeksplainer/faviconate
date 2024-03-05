import { IconEditorTool, cloneIconDocument } from "../IconEditor";
import { PointingEvent, PointingEventResult } from "../../models";
import { IconCanvasController } from "../IconCanvasController";
import { Point } from "../util/Rectangle";
import { Color } from "../util/Color";
import { PrimaryColorTool } from "./PrimaryColorTool";

export class PencilToolBase extends PrimaryColorTool implements IconEditorTool {
  private drawing = false;

  constructor(readonly controller: IconCanvasController) {
    super();
  }

  private drawAt(p: Point) {
    const index = this.controller.pointToData(p);

    if (index < 0) {
      return;
    }

    const newState = cloneIconDocument(this.controller.document);
    const { data } = newState.icon;

    data[index] = this.color.r;
    data[index + 1] = this.color.g;
    data[index + 2] = this.color.b;
    data[index + 3] = Math.round(this.color.a * 255);

    this.controller.setDocument(newState);
  }

  pointingGestureStart(e: PointingEvent): PointingEventResult | undefined {
    this.drawing = true;

    this.drawAt(e.point);
    return;
  }

  pointingGestureMove(e: PointingEvent): PointingEventResult | undefined {
    if (this.drawing) {
      this.drawAt(e.point);
    }
    return;
  }

  pointingGestureEnd(): PointingEventResult | undefined {
    this.drawing = false;
    this.controller.commit();
    return;
  }

  useColor(color: Color) {
    this.color = color;
  }
}
