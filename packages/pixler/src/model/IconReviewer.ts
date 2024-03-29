import { Icon } from "./Icon";
import { Color } from "./util/Color";
import { BasicCardinalPoint, Rectangle, Size } from "./util/Rectangle";
import { compositeColor } from "./IconService";
import { GraphicsMemoryError } from "./errors";

export type StartCorner = "ne" | "nw" | "se" | "sw";

const unvisited = new Color(0, 0, 0, 0.9);
const visited = new Color(0, 255, 0, 0.7);

export class IconReviewer {
  readonly current: Icon;

  readonly sampleSprite: Uint8ClampedArray;

  private hotspot: Rectangle;

  constructor(
    readonly original: Icon,
    readonly sample: Size,
    readonly startCorner: StartCorner
  ) {
    this.current = { ...original, data: new Uint8ClampedArray(original.data) };

    const w = sample.width;
    const h = sample.height;
    const wh: [number, number] = [sample.width, sample.height];

    if (startCorner === "nw") {
      this.hotspot = new Rectangle(0, 0, ...wh);
    } else if (startCorner === "ne") {
      this.hotspot = new Rectangle(original.width - w, 0, ...wh);
    } else if (startCorner === "se") {
      this.hotspot = new Rectangle(
        original.width - w,
        original.height - h,
        ...wh
      );
    } else if (startCorner === "sw") {
      this.hotspot = new Rectangle(0, original.height - h, ...wh);
    } else {
      this.hotspot = Rectangle.empty;
    }

    this.sampleSprite = new Uint8ClampedArray(sample.width * sample.height * 4);

    this.tintRegion(
      new Rectangle(0, 0, original.width, original.height),
      unvisited
    );
    this.tintRegion(this.hotspot, Color.transparent);
    this.updateSampleSprite();
  }

  private updateSampleSprite() {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const index = (x: number, y: number, w: number) => y * w * 4 + x * 4;

    // Clean sampleSprite
    this.sampleSprite.forEach((v, i) => {
      this.sampleSprite[i] = 0;
    });

    for (let y = 0; y < this.sample.height; y++) {
      for (let x = 0; x < this.sample.height; x++) {
        const imgX = this.hotspot.left + x;
        const imgY = this.hotspot.top + y;

        if (
          imgX < 0 ||
          imgY < 0 ||
          imgX >= this.original.width ||
          imgY >= this.original.height
        ) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const sampleIndex = index(x, y, this.sample.width);
        const imgIndex = index(imgX, imgY, this.original.width);

        this.sampleSprite[sampleIndex] = this.original.data[imgIndex];
        this.sampleSprite[sampleIndex + 1] = this.original.data[imgIndex + 1];
        this.sampleSprite[sampleIndex + 2] = this.original.data[imgIndex + 2];
        this.sampleSprite[sampleIndex + 3] = this.original.data[imgIndex + 3];
      }
    }
  }

  tintRegion(region: Rectangle, color: Color) {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const index = (x: number, y: number) => y * this.original.width * 4 + x * 4;

    for (let y = region.top; y < region.bottom; y++) {
      if (y < 0 || y >= this.original.height) {
        // eslint-disable-next-line no-continue
        continue;
      }

      for (let x = region.left; x < region.right; x++) {
        if (x < 0 || x >= this.original.width) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const sIndex = index(x, y);
        const originalColor = Color.fromInt8Array(this.original.data, sIndex);
        const newColor = compositeColor(originalColor, color);

        newColor.copyToUint8(this.current.data, sIndex);

        // const dR = this.original.data[sIndex];
        // const dG = this.original.data[sIndex + 1];
        // const dB = this.original.data[sIndex + 2];
        // const dA = this.original.data[sIndex + 3] / 255;
        //
        // const [sR, sG, sB] = color.tupleInt8;
        // const sA = color.a;
        //
        // const rR = Math.round(sR * sA + dR * (1 - sA));
        // const rG = Math.round(sG * sA + dG * (1 - sA));
        // const rB = Math.round(sB * sA + dB * (1 - sA));
        // const rA = dA + sA * (1 - dA);
        // const rA8 = Math.round(rA * 255);
        //
        // this.current.data[sIndex] = rR;
        // this.current.data[sIndex + 1] = rG;
        // this.current.data[sIndex + 2] = rB;
        // this.current.data[sIndex + 3] = rA8;
      }
    }
  }

  move(cardinalPoint: BasicCardinalPoint) {
    this.tintRegion(this.hotspot, visited);

    if (cardinalPoint === "n") {
      this.hotspot = this.hotspot.offset(0, -this.sample.height);
    } else if (cardinalPoint === "s") {
      this.hotspot = this.hotspot.offset(0, this.sample.height);
    } else if (cardinalPoint === "e") {
      this.hotspot = this.hotspot.offset(this.sample.width, 0);
    } else if (cardinalPoint === "w") {
      this.hotspot = this.hotspot.offset(-this.sample.width, 0);
    }

    // TODO: Bound checking

    this.tintRegion(this.hotspot, Color.transparent);

    this.updateSampleSprite();
  }

  reviewImage(): HTMLCanvasElement {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const index = (x: number, y: number, w: number) => y * w * 4 + x * 4;
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const superSample = this.hotspot.inflate(
      this.sample.width,
      this.sample.height
    );
    const { current } = this;

    canvas.width = superSample.width;
    canvas.height = superSample.height;

    const cx = canvas.getContext("2d");

    if (!cx) {
      throw new GraphicsMemoryError();
    }

    const arr = new Uint8ClampedArray(
      superSample.width * superSample.height * 4
    );

    let curImgX = superSample.left;
    let curImgY = superSample.top;

    for (let y = 0; y < superSample.height; y++) {
      if (curImgY < 0 || curImgY >= this.current.height) {
        curImgY++;
        // eslint-disable-next-line no-continue
        continue;
      }

      for (let x = 0; x < superSample.width; x++) {
        if (curImgX < 0 || curImgX >= this.current.width) {
          curImgX++;
          // eslint-disable-next-line no-continue
          continue;
        }

        const arrIndex = index(x, y, superSample.width);
        const curIndex = index(curImgX, curImgY, current.width);

        for (let i = 0; i <= 3; i++) {
          arr[arrIndex + i] = current.data[curIndex + i];
        }

        curImgX++;
      }

      curImgX = superSample.left;
      curImgY++;
    }

    cx.putImageData(new ImageData(arr, superSample.width), 0, 0);

    return canvas;
  }

  get currentHotspot(): Rectangle {
    return this.hotspot;
  }
}
