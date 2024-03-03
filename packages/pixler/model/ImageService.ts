import { FileError, InvalidImageError, MemoryError } from "./errors";
import { makeSz, scaleToContain, Size } from "./util/Rectangle";

const REDUCE_MARGIN = 256;

export const ImageService = {
  fromFile(file: Blob): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener("load", (readEvent) => {
        if (readEvent.target) {
          const img = new Image();

          img.addEventListener("load", () => resolve(img));
          img.addEventListener("error", () => reject(new InvalidImageError()));

          img.src = readEvent.target.result as string;
        } else {
          reject(new MemoryError());
        }
      });

      reader.addEventListener("error", () => reject(new FileError()));

      reader.readAsDataURL(file);
    });
  },

  resize(image: HTMLImageElement, size: Size): Uint8ClampedArray {
    const MUST_REDUCE = false; // image.width > REDUCE_MARGIN || image.height > REDUCE_MARGIN;
    const reducedSize = MUST_REDUCE
      ? scaleToContain(makeSz(REDUCE_MARGIN, REDUCE_MARGIN), size)
      : size;
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const cx = canvas.getContext("2d");

    if (!cx) {
      throw new MemoryError();
    }

    canvas.width = reducedSize.width;
    canvas.height = reducedSize.height;
    cx.drawImage(image, 0, 0, reducedSize.width, reducedSize.height);

    const imageData = cx.getImageData(
      0,
      0,
      reducedSize.width,
      reducedSize.height
    );

    if (size.width <= REDUCE_MARGIN || size.height <= REDUCE_MARGIN) {
      return this.resample(imageData, size);
    }
    return imageData.data;
  },

  resample(image: ImageData, size: Size): Uint8ClampedArray {
    const srcW = image.width;
    const srcH = image.height;
    const destW = Math.round(size.width);
    const destH = Math.round(size.height);
    const { data } = image;
    const data2 = new Uint8ClampedArray(size.width * size.height * 4);
    const ratioW = srcW / destW;
    const ratioH = srcH / destH;
    const ratioWHalf = Math.ceil(ratioW / 2);
    const ratioHHalf = Math.ceil(ratioH / 2);

    for (let j = 0; j < destH; j++) {
      for (let i = 0; i < destW; i++) {
        const x2 = (i + j * destW) * 4;
        let weight = 0;
        let weights = 0;
        let weightsAlpha = 0;
        let gxR = 0;
        let gxG = 0;
        let gxB = 0;
        let gxA = 0;
        const centerY = (j + 0.5) * ratioH;
        for (let yy = Math.floor(j * ratioH); yy < (j + 1) * ratioH; yy++) {
          const dy = Math.abs(centerY - (yy + 0.5)) / ratioHHalf;
          const centerX = (i + 0.5) * ratioW;
          const w0 = dy * dy; // pre-calc part of w
          for (let xx = Math.floor(i * ratioW); xx < (i + 1) * ratioW; xx++) {
            let dx = Math.abs(centerX - (xx + 0.5)) / ratioWHalf;
            const w = Math.sqrt(w0 + dx * dx);
            if (w >= -1 && w <= 1) {
              // hermite filter
              weight = 2 * w * w * w - 3 * w * w + 1;
              if (weight > 0) {
                dx = 4 * (xx + yy * srcW);
                // alpha
                gxA += weight * data[dx + 3];
                weightsAlpha += weight;
                // colors
                if (data[dx + 3] < 255) weight = (weight * data[dx + 3]) / 250;
                gxR += weight * data[dx];
                gxG += weight * data[dx + 1];
                gxB += weight * data[dx + 2];
                weights += weight;
              }
            }
          }
        }
        data2[x2] = gxR / weights;
        data2[x2 + 1] = gxG / weights;
        data2[x2 + 2] = gxB / weights;
        data2[x2 + 3] = gxA / weightsAlpha;
      }
    }
    return data2;
  },
};
