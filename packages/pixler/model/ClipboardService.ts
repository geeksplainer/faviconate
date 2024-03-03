// eslint-disable-next-line max-classes-per-file
const MIME_PNG = "image/png";

export class ClipboardEmptyError extends Error {}

export class ClipboardService {
  private static buffer: Blob | null;

  static async copyBlob(blob: Blob, mime: string): Promise<void> {
    try {
      await this.systemCopyBlob(blob, mime);
    } catch {
      this.buffer = blob;
    }
  }

  static async pasteBlob(): Promise<Blob> {
    try {
      return await this.systemPasteBlob();
    } catch {
      if (this.buffer) {
        return this.buffer;
      }
      throw new ClipboardEmptyError();
    }
  }

  static async systemCopyBlob(blob: Blob, mime: string): Promise<void> {
    const CTOR_NAME = "ClipboardItem";

    if (CTOR_NAME in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctor: any = (window as any)[CTOR_NAME]; // Workaround: currently not in TS library.
      // eslint-disable-next-line new-cap
      const item = new ctor({ [mime]: blob });
      const data = [item];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (navigator.clipboard as any).write(data);
    } else {
      throw new Error("No compatibility for clipboard copying");
    }
  }

  static async systemCopyText(text: string): Promise<void> {
    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      throw new Error("No compatibility for clipboard copying");
    }
  }

  static async systemPasteBlob(): Promise<Blob> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any | undefined = await (navigator.clipboard as any).read();
    const warnings: string[] = [];

    if (data && data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const { types } = data[i];

        if (types.includes(MIME_PNG)) {
          // eslint-disable-next-line no-await-in-loop
          const blob: Blob = await item.getType(MIME_PNG);

          if (blob) {
            return blob;
          }
          warnings.push(`Can't read ${item.type} from clipboard`);

          break;
        } else {
          warnings.push(`Unsupported MIME: ${item.type}`);
        }
      }
    } else {
      throw new ClipboardEmptyError();
    }

    throw new Error(warnings.join("\n"));
  }
}
