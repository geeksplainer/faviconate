import { Icon, IconColorModel } from "./Icon";
import {
  makePt,
  makeSz,
  Point,
  Rectangle,
  scaleToContain,
  Size,
} from "./util/Rectangle";
import { Color } from "./util/Color";
import {
  ClientSideRequiredError,
  InvalidRegionError,
  MemoryError,
} from "./errors";
import { ImageService } from "./ImageService";
import {
  BlobComposer,
  readInt16LE,
  readInt32LE,
  writeInt32LE,
} from "./BlobComposer";

const SIZE_ICONDIR = 6;
const SIZE_ICONDIRENTRY = 16;

export interface IconDirectory {
  icons: Icon[];
}

export function compositeColor(background: Color, foreground: Color): Color {
  const dR = background.r;
  const dG = background.g;
  const dB = background.b;
  const dA = background.a;

  const [sR, sG, sB] = foreground.tupleInt8;
  const sA = foreground.a;

  const rR = Math.round(sR * sA + dR * (1 - sA));
  const rG = Math.round(sG * sA + dG * (1 - sA));
  const rB = Math.round(sB * sA + dB * (1 - sA));
  const rA = dA + sA * (1 - dA);

  return new Color(rR, rG, rB, rA);
}

export const IconService = {
  clone(icon: Icon): Icon {
    return { ...icon, data: new Uint8ClampedArray(icon.data) };
  },

  asCanvas(icon: Icon): HTMLCanvasElement {
    if (typeof window !== "undefined") {
      const canvas: HTMLCanvasElement = document.createElement("canvas");
      canvas.width = icon.width;
      canvas.height = icon.height;

      const cx = canvas.getContext("2d");

      if (!cx) {
        throw new MemoryError();
      }

      cx.putImageData(this.asImageData(icon), 0, 0);

      return canvas;
    }
    throw new ClientSideRequiredError();
  },

  asBlobWithMime(icon: Icon, mime = "image/png"): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      const canvas = this.asCanvas(icon);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new MemoryError());
        }
      }, mime);
    });
  },

  async asBlobUrl(icon: Icon, mime = "image/png"): Promise<string> {
    const blob = await this.asBlobWithMime(icon, mime);
    return URL.createObjectURL(blob);
  },

  async asIcoBlob(icons: Icon[]): Promise<Blob> {
    const composer = new BlobComposer();
    const pngBlobs: Blob[] = [];
    let pngBlobSum = 0;

    // ICONDIR structure
    composer.writeUint8Clamped(
      new Uint8ClampedArray([
        0,
        0, // 2B	Reserved. Must always be 0.
        1,
        0, // 2B Specifies image type: 1 for icon (.ICO) image, 2 for cursor (.CUR) image. Other values are invalid.
      ])
    );

    composer.writeInt16LE(icons.length); // 2b Specifies number of images in the file.

    // eslint-disable-next-line no-restricted-syntax
    for (const icon of icons) {
      // eslint-disable-next-line no-await-in-loop
      const pngBlob = await this.asBlobWithMime(icon, "image/png");
      pngBlobs.push(pngBlob);

      // ICONDIRENTRY
      composer.writeUint8Clamped(
        new Uint8ClampedArray([
          icon.width === 256 ? 0 : icon.width, // 1B Specifies image width in pixels. Can be any number between 0 and 255. Value 0 means image width is 256 pixels.
          icon.height === 256 ? 0 : icon.height, // 1B Specifies image height in pixels. Can be any number between 0 and 255. Value 0 means image height is 256 pixels.
          0, // 1B Specifies number of colors in the color palette. Should be 0 if the image does not use a color palette.
          0, // 1B Reserved. Should be 0
          1,
          0, // 2B Specifies color planes. Should be 0 or 1
          8,
          0, // 2B Specifies bits per pixel
        ])
      );

      const dataOffset =
        SIZE_ICONDIR + SIZE_ICONDIRENTRY * icons.length + pngBlobSum;

      composer.writeInt32LE(pngBlob.size); // 4B Specifies the size of the image's data in bytes
      composer.writeInt32LE(dataOffset); // 4B Specifies the offset of BMP or PNG data from the beginning of the ICO/CUR file

      pngBlobSum += pngBlob.size;
    }

    await Promise.all(pngBlobs.map((b) => composer.writeBlob(b)));

    return composer.getBlob();
  },

  async fromIcoBlob(blob: Blob): Promise<IconDirectory> {
    const icons: Icon[] = [];

    const buffer = await blob.arrayBuffer();
    const array = new Uint8ClampedArray(buffer);
    const iconCount = readInt16LE(array, 4);

    for (let i = 0; i < iconCount; i++) {
      const dirEntryStart = SIZE_ICONDIR + SIZE_ICONDIRENTRY * i;
      const dirEntry = array.slice(
        dirEntryStart,
        dirEntryStart + SIZE_ICONDIRENTRY
      );
      const dataSize = readInt32LE(dirEntry, 8);
      const dataOffset = readInt32LE(dirEntry, 12);
      const data = array.slice(dataOffset, dataOffset + dataSize);
      const composer = new BlobComposer();

      // ICONDIR structure
      composer.writeUint8Clamped(
        new Uint8ClampedArray([
          0,
          0, // 2B	Reserved. Must always be 0.
          1,
          0, // 2B Specifies image type: 1 for icon (.ICO) image, 2 for cursor (.CUR) image. Other values are invalid.
          1,
          0, // 2B Specifies number of images in the file.
        ])
      );

      // Update offset
      writeInt32LE(dirEntry, 12, 22);

      composer.writeUint8Clamped(dirEntry);
      composer.writeUint8Clamped(data);

      const blb = composer.getBlob({ type: "image/x-icon" });
      // eslint-disable-next-line no-await-in-loop
      const image = await ImageService.fromFile(blb);

      icons.push(IconService.fromImage(image));
    }

    return { icons };
  },

  asImageData(icon: Icon): ImageData {
    return new ImageData(icon.data, icon.width);
  },

  fromCanvas(
    canvas: HTMLCanvasElement,
    cx: CanvasRenderingContext2D | null = null
  ): Icon {
    if (!cx) {
      // eslint-disable-next-line no-param-reassign
      cx = canvas.getContext("2d");
    }

    if (!cx) {
      throw new MemoryError();
    }

    const MODEL: IconColorModel = "rgba";
    const { width } = canvas;
    const { height } = canvas;
    const imageData = cx.getImageData(0, 0, width, height);
    const { data } = imageData;

    return {
      width,
      height,
      model: MODEL,
      data,
    };
  },

  fromIcon(icon: Icon, region: Rectangle): Icon {
    const data = new Uint8ClampedArray(region.width * region.height * 4);

    this.region32(icon, region, (index, current) => {
      data[current] = icon.data[index];
      data[current + 1] = icon.data[index + 1];
      data[current + 2] = icon.data[index + 2];
      data[current + 3] = icon.data[index + 3];
    });

    return {
      width: region.width,
      height: region.height,
      data,
      model: "rgba",
    };
  },

  fromImage(image: HTMLImageElement, newSize?: Size): Icon {
    const MODEL: IconColorModel = "rgba";
    const width = newSize ? newSize.width : image.naturalWidth;
    const height = newSize ? newSize.height : image.naturalHeight;
    const data = ImageService.resize(image, makeSz(width, height));

    return {
      width,
      height,
      model: MODEL,
      data,
    };
  },

  async fromFile(
    file: Blob,
    contain?: Size,
    allowScaleUp = false
  ): Promise<Icon> {
    const image = await ImageService.fromFile(file);
    let { width } = image;
    let { height } = image;

    if (contain) {
      const actual = makeSz(width, height);
      const contained =
        (actual.width > contain.width && actual.height > contain.height) ||
        allowScaleUp
          ? scaleToContain(contain, actual)
          : actual;
      width = Math.round(contained.width);
      height = Math.round(contained.height);
    }

    return this.fromImage(image, makeSz(width, height));
  },

  newIcon(width: number, height: number, model: IconColorModel = "rgba"): Icon {
    const icon = {
      width,
      height,
      model,
      data: new Uint8ClampedArray(width * height * 4),
    };

    return icon;
  },

  newIconWithBg(width: number, height: number, color: Color): Icon {
    const MODEL: IconColorModel = "rgba";
    const icon = {
      width,
      height,
      model: MODEL,
      data: new Uint8ClampedArray(width * height * 4),
    };

    for (let i = 0; i < icon.data.length; i += 4) {
      icon.data[i] = color.r;
      icon.data[i + 1] = color.g;
      icon.data[i + 2] = color.b;
      icon.data[i + 3] = color.a * 255;
    }

    return icon;
  },

  pixelToIndex(pixel: Point, icon: Icon): number {
    return icon.width * 4 * pixel.y + pixel.x * 4;
  },

  indexToPixel(index: number, icon: Icon): Point {
    const y = Math.floor(index / 4 / icon.width);
    const x = (index / 4) % icon.width;
    return { x, y };
  },

  region32(
    icon: Icon,
    region: Rectangle,
    onPixel: (regionIndex: number, iconIndex: number) => void
  ) {
    let current = 0;
    for (let y = region.top; y < region.bottom; y++) {
      for (let x = region.left; x < region.right; x++) {
        const index = IconService.pixelToIndex(makePt(x, y), icon);
        onPixel(index, current);
        current += 4;
      }
    }
  },

  blend(
    base: Icon,
    sprite: Icon,
    region: Rectangle,
    spriteOffset?: Point
  ): Icon {
    if (region.width > sprite.width || region.height > sprite.height) {
      throw new InvalidRegionError();
    }

    if (!spriteOffset) {
      // eslint-disable-next-line no-param-reassign
      spriteOffset = makePt(0, 0);
    }

    const buffer = this.clone(base);

    for (let y = 0; y < region.height; y++) {
      for (let x = 0; x < region.width; x++) {
        const bufferIndex = this.pixelToIndex(
          makePt(region.left + x, region.top + y),
          base
        );
        const spriteIndex = this.pixelToIndex(
          makePt(x + spriteOffset.x, y + spriteOffset.y),
          sprite
        );

        const bufferColor = Color.fromInt8Array(buffer.data, bufferIndex);
        const spriteColor = Color.fromInt8Array(sprite.data, spriteIndex);
        const newColor = compositeColor(bufferColor, spriteColor);

        newColor.copyToUint8(buffer.data, bufferIndex);
      }
    }

    return buffer;
  },
};
