import { useEffect, useState } from "react";
import { makePt, Point, Rectangle } from "../model/util/Rectangle";
import { CanvasView, RenderParams } from "./CanvasView";
import { CanvasViewController, PointingEventResult } from "../models";

interface CanvasViewProps {
  className?: string;
  controller: CanvasViewController;
}

export function IconControllerView(props: CanvasViewProps): JSX.Element {
  const { controller, className } = props;
  const [cursor, setCursor] = useState<string>("default");

  const handleMouseUp = (e: MouseEvent) => {
    const ctl = controller;

    if (ctl.pointingGestureEnd) {
      const point = canvasPoint(e.target, e.clientX, e.clientY);
      const { cursor: c } =
        ctl.pointingGestureEnd({ point, touch: false }) || {};
      setCursor(c || "default");
    }
  };

  // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
  function adoptCursor(result: PointingEventResult | void) {
    if (result?.cursor) {
      updateCursor(result.cursor);
    } else {
      updateCursor("default");
    }
  }

  function mouseDown(e: React.MouseEvent) {
    if (controller.pointingGestureStart) {
      const point = canvasPoint(e.target, e.clientX, e.clientY);
      const result = controller.pointingGestureStart({ point, touch: false });

      adoptCursor(result);
    }
  }

  function mouseMove(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (controller.pointingGestureMove) {
      const point = canvasPoint(e.target, e.clientX, e.clientY);
      const result = controller.pointingGestureMove({ point, touch: false });

      adoptCursor(result);
    }
  }

  function touchEnd(e: React.TouchEvent<HTMLCanvasElement>) {
    if (controller.pointingGestureEnd) {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        if (t)
          controller.pointingGestureEnd({
            point: canvasPoint(e.target, t.clientX, t.clientY),
            touch: true,
          });
      } else {
        controller.pointingGestureEnd({ point: makePt(0, 0), touch: true });
      }
    }
  }

  function touchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    if (controller.pointingGestureStart && e.touches.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      const t = e.touches[0];
      if (t) {
        const point = canvasPoint(e.target, t.clientX, t.clientY);
        controller.pointingGestureStart({ point, touch: true });
      }
    }
  }

  function touchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    if (controller.pointingGestureMove && e.touches.length > 0) {
      const t = e.touches[0];
      if (t) {
        controller.pointingGestureMove({
          point: canvasPoint(e.target, t.clientX, t.clientY),
          touch: true,
        });
      }
    }
  }

  function updateCursor(value: string | null) {
    const changed = value !== cursor;

    if (changed) {
      setCursor(value || "default");
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const mouseUpCatcher = (e: MouseEvent) => {
      handleMouseUp(e);
    };

    function keyDown(e: KeyboardEvent) {
      if (!ignoreKey() && controller.keyDown) {
        const result = controller.keyDown({ key: e.key });

        if (result && result.preventDefault === true) {
          e.preventDefault();
        }
      }
    }

    function keyUp(e: KeyboardEvent) {
      if (!ignoreKey() && controller.keyUp) {
        const result = controller.keyUp({ key: e.key });

        if (result && result.preventDefault === true) {
          e.preventDefault();
        }
      }
    }

    const keyDownCatcher = (e: KeyboardEvent) => keyDown(e);
    const keyUpCatcher = (e: KeyboardEvent) => keyUp(e);

    document.body.addEventListener("mouseup", mouseUpCatcher);
    document.addEventListener("keyup", keyUpCatcher);
    document.addEventListener("keydown", keyDownCatcher);

    return () => {
      document.body.removeEventListener("mouseup", mouseUpCatcher);
      document.removeEventListener("keyup", keyUpCatcher);
      document.removeEventListener("keydown", keyDownCatcher);
    };
  }, [controller]);

  const render = (params: RenderParams) => {
    controller.render(params.context, params.size);
  };

  return (
    <CanvasView
      render={render}
      className={className}
      style={{ cursor }}
      onMouseDown={(e) => mouseDown(e)}
      onMouseMove={(e) => mouseMove(e)}
      onTouchStart={(e) => touchStart(e)}
      onTouchMove={(e) => touchMove(e)}
      onTouchEnd={(e) => touchEnd(e)}
    />
  );
}

function ignoreKey(): boolean {
  const focused = document.querySelector("*:focus");

  return (
    !!focused && (focused.tagName === "INPUT" || focused.tagName === "TEXTAREA")
  );
}

function canvasPoint(
  target: EventTarget | null,
  clientX: number,
  clientY: number
): Point {
  if (target instanceof Element) {
    const bounds = Rectangle.fromDOMRect(target.getBoundingClientRect());
    return makePt(clientX - bounds.left, clientY - bounds.top);
  }
  return makePt(clientX, clientY);
}
