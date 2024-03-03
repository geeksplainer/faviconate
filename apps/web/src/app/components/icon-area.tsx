import { useEffect, useState } from "react";
import { IconControllerView } from "@faviconate/pixler/src/components/IconControllerView";
import { IconCanvasController } from "@faviconate/pixler/src/model/IconCanvasController";
import { IconService } from "@faviconate/pixler/src/model/IconService";

export function IconArea() {
  const [controller, setController] = useState<IconCanvasController>(
    new IconCanvasController(
      { icon: IconService.newIcon(32, 32) },
      { drawGrid: true }
    )
  );
  return <IconControllerView controller={controller} />;
}
