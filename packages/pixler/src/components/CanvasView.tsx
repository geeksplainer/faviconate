import { FC, useEffect, useRef } from "react";
import { makeSz, Rectangle, Size } from "../model/util/Rectangle";

export interface RenderParams {
  size: Size;
  context: CanvasRenderingContext2D;
}

interface Props extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  className?: string;
  render: (data: RenderParams) => void;
}

export const CanvasView: FC<Props> = (props) => {
  const { render, className, ...rest } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function updateCanvasSize() {
    if (containerRef.current) {
      const rect = Rectangle.fromDOMRect(
        containerRef.current.getBoundingClientRect()
      );

      if (canvasRef.current) {
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      } else {
        throw new Error("Diagram::resize: No canvasRef");
      }
    } else {
      throw new Error("Diagram::resize: No containerRef");
    }
  }

  useEffect(() => {
    const resizer = () => updateCanvasSize();
    let running = true;
    resizer();
    window.addEventListener("resize", resizer);

    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");

      if (context) {
        const draw = () => {
          const size = containerRef?.current
            ? Rectangle.fromDOMRect(
                containerRef.current.getBoundingClientRect()
              ).size
            : makeSz(0, 0);
          render({ context, size });

          if (running) {
            requestAnimationFrame(draw);
          }
        };

        requestAnimationFrame(() => draw());
      } else {
        console.error("No context");
      }
    } else {
      console.error("No canvasRef");
    }

    return () => {
      window.removeEventListener("resize", resizer);
      running = false;
    };
  }, [render]);

  return (
    <div ref={containerRef} {...{ className }}>
      <canvas ref={canvasRef} {...rest} />
    </div>
  );
};
