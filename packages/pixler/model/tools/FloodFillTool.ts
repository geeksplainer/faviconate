import { IconEditorTool } from "../IconEditor";
import { Color } from "../util/Color";
import { IconCanvasController } from "../IconCanvasController";
import {
  PointingEvent,
  PointingEventResult,
} from "../../components/IconControllerView";
import { Point } from "../util/Rectangle";
import { PrimaryColorTool } from "./PrimaryColorTool";

export class FloodFillTool extends PrimaryColorTool implements IconEditorTool {
  constructor(readonly controller: IconCanvasController) {
    super();
  }

  fill(p: Point) {
    this.controller.editor.begin();

    const LIMIT = 30_000;
    const tuple = this.color.tupleInt8;
    const doc = this.controller.editor.cloneDocument();
    const { data } = doc.icon;
    const { width } = doc.icon;
    const index = this.controller.pixelToData(p);
    const origin = new Color(
      doc.icon.data[index],
      doc.icon.data[index + 1],
      doc.icon.data[index + 2],
      doc.icon.data[index + 3]
    );
    const q: number[] = [];
    const visited: number[] = [];
    let counter = 0;

    q.push(index);

    const keep = () => {
      if (q.length > 0) {
        batch();
      }
    };

    const batch = () => {
      while (q.length > 0) {
        counter++;

        if (counter >= LIMIT) {
          counter = 0;
          this.controller.editor.setDocument(doc);
          setTimeout(() => keep());
          return;
        }

        const n = q.pop();

        if (typeof n === "number") {
          const insideArray = n >= 0 || n + 3 < data.length;
          const matchesColor = origin.equals(
            new Color(data[n], data[n + 1], data[n + 2], data[n + 3])
          );
          const repeated = visited.includes(n);

          if (!repeated && insideArray && matchesColor) {
            data[n] = tuple[0];
            data[n + 1] = tuple[1];
            data[n + 2] = tuple[2];
            data[n + 3] = tuple[3];

            q.push(n + 4, n - 4, n - width * 4, n + width * 4);

            visited.push(n);
          }
        }
      }

      this.controller.editor.commit(doc);
    };

    batch();
  }

  pointingGestureStart(e: PointingEvent): PointingEventResult | void {
    const p = this.controller.pointToPixel(e.point);

    if (p) {
      this.fill(p);
    }
  }

  useColor(color: Color) {
    this.color = color;
  }
}
