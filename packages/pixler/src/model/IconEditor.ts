import { Editor } from "./Editor";
import { CanvasSensor, IconDocument } from "../models";
import { IconService } from "./IconService";

export class IconEditor extends Editor<IconDocument> {}

export function cloneIconDocument(doc: IconDocument): IconDocument {
  const documentObject = doc;

  const newDocument = {
    ...documentObject,
    icon: IconService.clone(documentObject.icon),
  };

  return newDocument;
}
