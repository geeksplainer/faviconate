import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

export function Range2d({
  x,
  y,
  setX,
  setY,
  bg,
  className,
}: {
  x: number;
  y: number;
  setX: (x: number) => void;
  setY: (y: number) => void;
  bg?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [mouseDownData, setMouseDownData] = useState<null | {
    x: number;
    y: number;
  }>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mouseDownData) {
      return;
    }
    e.preventDefault();
    setMouseDownData({ x, y });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    let down = true;
    const mouseMove = (e: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (mouseDownData && down) {
        const b = containerRef.current.getBoundingClientRect();
        const x = e.clientX - b.left - 8;
        const y = e.clientY - b.top - 8;
        setX(Math.max(0, Math.min(1, x / b.width)));
        setY(Math.max(0, Math.min(1, 1 - y / b.height)));
      }
    };

    function mouseUp() {
      setMouseDownData(null);
      down = false;
    }

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", mouseUp);

    () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", mouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mouseDownData]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "rounded-md h-20 bg-cover relative",
        "before:absolute before:inset-0 before:bg-gradient-to-t before:from-black before:to-transparent",
        className
      )}
      onMouseDown={handleMouseDown}
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div
        ref={handleRef}
        className="absolute size-[16px] bg-primary border-primary-foreground border rounded-full"
        style={{
          left: `calc(${x * 100}% - 8px)`,
          top: `calc(${100 - y * 100}% - 8px)`,
        }}
      />
    </div>
  );
}
