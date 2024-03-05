import { cloneIconDocument } from "@faviconate/pixler/src/model/IconEditor";
import { Color } from "@faviconate/pixler/src/model/util/Color";
import { Point } from "@faviconate/pixler/src/model/util/Rectangle";
import {
  ControllerPointingEvent,
  IconDocument,
  PointingEventResult,
} from "@faviconate/pixler/src/models";

export function useFloodFill({
  color,
  document,
  setDocument,
  commit,
}: {
  color: Color;
  document: IconDocument;
  setDocument: (doc: IconDocument) => void;
  commit: () => void;
}) {
  const fill = (p: Point, pixelToData: (pixel: Point) => number) => {
    const LIMIT = 30_000;
    const tuple = color.tupleInt8;
    const doc = cloneIconDocument(document);
    const { data } = doc.icon;
    const { width } = doc.icon;
    const index = pixelToData(p);
    const origin = new Color(
      data[index] || 0,
      data[index + 1] || 0,
      data[index + 2] || 0,
      data[index + 3] || 0
    );
    const q: number[] = [];
    const visited: Set<number> = new Set();
    let counter = 0;

    q.push(index);

    const keep = () => {
      if (q.length > 0) {
        batch();
      } else {
        setDocument(doc); // Update the document once all filling is complete.
        commit(); // Commit changes after the flood fill operation is complete.
      }
    };

    const batch = () => {
      while (q.length > 0) {
        counter++;

        if (counter >= LIMIT) {
          counter = 0;
          setTimeout(() => keep(), 0); // Use zero delay to allow UI updates and avoid freezing.
          return;
        }

        const n = q.shift(); // Use shift() for BFS.

        if (typeof n === "number" && n >= 0 && n + 3 < data.length) {
          const matchesColor = origin.equals(
            new Color(
              data[n] || 0,
              data[n + 1] || 0,
              data[n + 2] || 0,
              data[n + 3] || 0
            )
          );
          if (!visited.has(n) && matchesColor) {
            data[n] = tuple[0];
            data[n + 1] = tuple[1];
            data[n + 2] = tuple[2];
            data[n + 3] = tuple[3];

            // Add adjacent pixels to the queue.
            // biome-ignore lint/complexity/noForEach: <explanation>
            [n + 4, n - 4, n - width * 4, n + width * 4].forEach((adjacent) => {
              if (!visited.has(adjacent)) {
                q.push(adjacent);
              }
            });

            visited.add(n);
          }
        }
      }
      setTimeout(() => keep(), 0); // Continue processing after the current batch.
    };

    batch();
  };

  const pointingGestureStart = (
    e: ControllerPointingEvent
  ): PointingEventResult | undefined => {
    const p = e.pointToPixel(e.point);

    if (p) {
      fill(p, e.pixelToData);
    }
    return;
  };

  return {
    pointingGestureStart,
  };
}
