import { useEffect, useState } from "react";

export function IconArea() {
  const [controller, setController] = useState<IconCanvasController | null>(
    null
  );
  useEffect(() => {
    const newController = new IconCanvasController(
      { icon: IconService.newIcon(32, 32) },
      { drawGrid: true }
    );
    setController(newController);
  }, []);
  return <IconControllerView controller={controller} />;
}
