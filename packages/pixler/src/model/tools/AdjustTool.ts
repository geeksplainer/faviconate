import { IconDocument, IconEditorTool } from "../IconEditor";
import { IconCanvasController } from "../IconCanvasController";
import { Color } from "../util/Color";
import { ImageAdjustService } from "../ImageAdjustService";
import { Palette } from "../PaletteService";

export interface AdjustProperties {
  palette?: Palette;
  brightness?: number;
  contrast?: number;
  kernel?: number;
  serpentine?: boolean;
}

export class AdjustTool implements IconEditorTool {
  original: IconDocument | null = null;

  private lastProps?: AdjustProperties;

  constructor(readonly controller: IconCanvasController) {}

  activate() {
    this.controller.editor.begin();
    this.original = this.controller.editor.cloneDocument();
  }

  deactivate() {
    this.controller.editor.rollback();
  }

  apply() {
    this.controller.editor.commit();
    this.original = this.controller.editor.cloneDocument();
    this.controller.editor.begin();
  }

  updateAdjustments(props: AdjustProperties): boolean {
    if (!this.original) {
      return false;
    }

    let changed = false;

    if (this.lastProps) {
      const keys = Object.keys(props);
      // eslint-disable-next-line no-restricted-syntax
      for (const name of keys) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((props as any)[name] !== (this.lastProps as any)[name]) {
          changed = true;
          break;
        }
      }
    } else {
      changed = true;
    }

    if (!changed) {
      return false;
    }

    const doc = this.controller.editor.cloneDocument(this.original);
    const { icon } = doc;
    const { data } = icon;
    const { palette, contrast, brightness, kernel, serpentine } = props;

    if (typeof brightness === "number" && brightness !== 0) {
      ImageAdjustService.brightness(data, brightness);
    }

    if (typeof contrast === "number" && contrast !== 0) {
      ImageAdjustService.contrast(data, contrast);
    }

    if (palette) {
      ImageAdjustService.dither(
        data,
        icon.width,
        icon.height,
        palette.colors.map((tuple) => Color.fromHex(tuple.hex)),
        kernel || 0,
        !!serpentine
      );
    }

    this.controller.editor.setDocument(doc);

    this.lastProps = props;

    return true;
  }
}
