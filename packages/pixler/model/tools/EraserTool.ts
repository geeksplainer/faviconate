import { IconCanvasController } from "../IconCanvasController";
import { Color } from "../util/Color";
import { PencilToolBase } from "./PencilToolBase";

export class EraserTool extends PencilToolBase {
  constructor(controller: IconCanvasController) {
    super(controller);
    this.color = Color.transparent;
  }
}
