import { Icon } from "./Icon";
import { Editor } from "./Editor";
import { CanvasSensor } from "../components/IconControllerView";
import { Rectangle } from "./util/Rectangle";
import { IconService } from "./IconService";
import { Color } from "./util/Color";

export interface IconDocument {
  icon: Icon;
  selectionRegion?: Rectangle;
  selectionBuffer?: Icon;
  selectionSprite?: Icon;
}

export interface IconEditorTool extends CanvasSensor {
  activate?: () => void;
  deactivate?: () => void;
  useColor?: (color: Color) => void;
}

export class IconEditor extends Editor<IconDocument> {
  cloneDocument(doc?: IconDocument): IconDocument {
    if (typeof doc === "undefined") {
      // eslint-disable-next-line no-param-reassign
      doc = this.document;
    }

    const newDocument = {
      ...doc,
      icon: IconService.clone(doc.icon),
    };

    return newDocument;
  }
}
