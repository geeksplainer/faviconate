import { ValueRange } from "./ImageAdjustService";
import { distance, makePt, Point, roundPt, tuplePt } from "./util/Rectangle";
import { minMax } from "./util/utilities";

interface FingerReducerState {
  startPointers: PointerData[];
  currentPointers: PointerData[];
  scale: ValueRange;
  scrollX: ValueRange;
  scrollY: ValueRange;
  startDistance: number;
  currentDistance: number;
  currentScale: number;
  currentScroll: Point;
}

export const DefaultFingerReducerState: FingerReducerState = {
  startPointers: [],
  currentPointers: [],
  startDistance: 0,
  currentDistance: 0,
  currentScale: 1,
  currentScroll: makePt(0, 0),
  scale: { min: 0, max: 0, value: 0 },
  scrollX: { min: 0, max: 0, value: 0 },
  scrollY: { min: 0, max: 0, value: 0 },
};

export interface PointerData {
  pointerId: number;
  location: Point;
}

export type PointerReducerAction =
  | {
      type: "pointerDown";
      data: PointerData;
      scale: ValueRange;
      scrollX: ValueRange;
      scrollY: ValueRange;
    }
  | { type: "pointerMove"; data: PointerData }
  | { type: "pointerUp" };

const PIXEL_SCALE = 0.1;

export function adjustFingerReducer(
  state: FingerReducerState,
  action: PointerReducerAction
): FingerReducerState {
  const { type } = action;
  if (type === "pointerDown") {
    const { data, scale, scrollX, scrollY } = action;
    const startPointers = updatePair(state.startPointers, data);

    if (startPointers.length === 2) {
      const [a, b] = startPointers;
      const startDistance = distance(a.location, b.location);
      return {
        ...state,
        startPointers,
        startDistance,
        scale,
        scrollX,
        scrollY,
      };
    }
    return {
      ...state,
      startPointers,
      scale,
      scrollX,
      scrollY,
    };
  }
  if (type === "pointerMove") {
    const { data } = action;
    const currentPointers = updatePair(state.currentPointers, data);

    if (state.startPointers.length === 2 && currentPointers.length === 2) {
      const { startDistance, scale } = state;
      const [a, b] = currentPointers;
      const currentDistance = distance(a.location, b.location);
      const currentProportion =
        startDistance !== 0 ? currentDistance / startDistance : 1;
      const currentScale = minMax(
        scale.min || 0,
        scale.max,
        currentProportion * scale.value
      );
      return {
        ...state,
        currentPointers,
        currentDistance,
        currentScale,
      };
    }
    if (state.startPointers.length === 1) {
      const { startPointers, scrollX, scrollY } = state;
      const [startX, startY] = tuplePt(startPointers[0].location);
      const [currentX, currentY] = tuplePt(currentPointers[0].location);
      const rawScroll = makePt(
        (currentX - startX) * PIXEL_SCALE,
        (currentY - startY) * PIXEL_SCALE
      );
      const currentScroll = roundPt(
        makePt(
          minMax(scrollX.min || 0, scrollX.max, scrollX.value - rawScroll.x),
          minMax(scrollY.min || 0, scrollY.max, scrollY.value - rawScroll.y)
        )
      );

      return { ...state, currentPointers, currentScroll };
    }
    return { ...state, currentPointers };
  }
  if (type === "pointerUp") {
    return { ...DefaultFingerReducerState };
  }
  throw new Error(`Unknown reducer: ${type}`);
}

function updatePair(pair: PointerData[], data: PointerData): PointerData[] {
  const ptr = pair.find((p) => p.pointerId === data.pointerId);

  if (ptr) {
    ptr.location = data.location;
    return pair;
  }

  return [...pair, data];
}
