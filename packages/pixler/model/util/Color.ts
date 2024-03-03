// eslint-disable-next-line max-classes-per-file
export class InvalidColorFormatError extends Error {}

export type ColorTuple = [number, number, number, number];

const hex = (n: number) => {
  const result = n.toString(16);
  return result.length === 1 ? `0${result}` : result;
};
export class Color {
  static get black(): Color {
    return new Color(0, 0, 0);
  }

  static hexParsable(hexColor: string): boolean {
    return hexColor.match(/#?[\dA-Fa-f]{3}([\dA-Fa-f]{3})?/) !== null;
  }

  static fromHex(colorInHex: string): Color {
    if (!Color.hexParsable(colorInHex)) {
      throw new InvalidColorFormatError(colorInHex);
    }

    const hexColor = colorInHex.replace("#", "");

    let r = 0;
    let g = 0;
    let b = 0;
    let a = 1;

    // If three digits
    if (hexColor.length === 3) {
      r = toDecimal(hexColor[0] + hexColor[0]);
      g = toDecimal(hexColor[1] + hexColor[1]);
      b = toDecimal(hexColor[2] + hexColor[2]);
    } else {
      r = toDecimal(hexColor[0] + hexColor[1]);
      g = toDecimal(hexColor[2] + hexColor[3]);
      b = toDecimal(hexColor[4] + hexColor[5]);

      if (hexColor.length === 8) {
        a = toDecimal(hexColor[6] + hexColor[7]);
      }
    }

    return new Color(r, g, b, a);
  }

  /**
   * HSV to RGB color conversion
   *
   * H runs from 0 to 360 degrees
   * S and V run from 0 to 1
   *
   * Ported from the excellent java algorithm by Eugene Vishnevsky at:
   * http://www.cs.rit.edu/~ncs/color/t_convert.html
   */
  static fromHsv(H: number, S: number, V: number): Color {
    let h = H;
    let s = S;
    let v = V;
    let r;
    let g;
    let b;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    if (s === 0) {
      // Achromatic (grey)
      // eslint-disable-next-line no-multi-assign
      r = g = b = v;
      return new Color(
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
      );
    }

    h /= 60; // sector 0 to 5
    const i = Math.floor(h);
    const f = h - i; // factorial part of h
    const p = v * (1 - s);
    const q = v * (1 - s * f);
    const t = v * (1 - s * (1 - f));

    switch (i) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      default:
        r = v;
        g = p;
        b = q;
    }

    return new Color(
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    );
  }

  static fromTupleInt8(t: [number, number, number, number]): Color {
    return new Color(t[0], t[1], t[2], t[3] / 255);
  }

  static fromInt8Array(data: Uint8ClampedArray, offset = 0): Color {
    return this.fromTupleInt8([
      data[offset],
      data[offset + 1],
      data[offset + 2],
      data[offset + 3],
    ]);
  }

  static get transparent(): Color {
    return new Color(0, 0, 0, 0);
  }

  static get white(): Color {
    return new Color(255, 255, 255);
  }

  constructor(
    readonly r: number, //  0 - 255
    readonly g: number, //  0 - 255
    readonly b: number, //  0 - 255
    readonly a: number = 1 //  0 - 1
  ) {
    this.r = Math.max(Math.min(Math.round(r), 255), 0);
    this.g = Math.max(Math.min(Math.round(g), 255), 0);
    this.b = Math.max(Math.min(Math.round(b), 255), 0);
    this.a = Math.max(Math.min(a, 1), 0);
  }

  equals(c: Color): boolean {
    return c.r === this.r && c.g === this.g && c.b === this.b && c.a === this.a;
  }

  copyToUint8(array: Uint8ClampedArray, offset: number) {
    const [r, g, b, a] = this.tupleInt8;
    // eslint-disable-next-line no-param-reassign
    array[offset] = r;
    // eslint-disable-next-line no-param-reassign
    array[offset + 1] = g;
    // eslint-disable-next-line no-param-reassign
    array[offset + 2] = b;
    // eslint-disable-next-line no-param-reassign
    array[offset + 3] = a;
  }

  toString(): string {
    if (this.a !== 1) {
      return this.hexRgba;
    }

    return this.hexRgb;
  }

  withAlpha(alpha: number): Color {
    if (alpha < 0 || alpha > 100) {
      throw new Error(`Invalid alpha: ${alpha}`);
    }
    return new Color(this.r, this.g, this.b, alpha);
  }

  withR(r: number): Color {
    return new Color(r, this.g, this.b, this.a);
  }

  withG(g: number): Color {
    return new Color(this.r, g, this.b, this.a);
  }

  withB(b: number): Color {
    return new Color(this.r, this.g, b, this.a);
  }

  get cssRgb(): string {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }

  get cssRgba(): string {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  get hexRgb(): string {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
  }

  get hexRgba(): string {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex(
      Math.round(this.a * 255)
    )}`;
  }

  get hsv(): [number, number, number] {
    let rr;
    let gg;
    let bb;
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;
    let h = 0;
    let s = 0;
    const v = Math.max(r, g, b);
    const diff = v - Math.min(r, g, b);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const diff_c = (c: number) => (v - c) / 6 / diff + 1 / 2;

    if (diff === 0) {
      // eslint-disable-next-line no-multi-assign
      h = s = 0;
    } else {
      s = diff / v;
      rr = diff_c(r);
      gg = diff_c(g);
      bb = diff_c(b);

      if (r === v) {
        h = bb - gg;
      } else if (g === v) {
        h = 1 / 3 + rr - bb;
      } else if (b === v) {
        h = 2 / 3 + gg - rr;
      }
    }

    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }

    return [Math.round(h * 360), s, v];
  }

  get isTransparent(): boolean {
    return this.r === 0 && this.g === 0 && this.b === 0 && this.a === 0;
  }

  get relativeLuminance(): number {
    return (
      0.2126 * (this.r / 255) +
      0.7152 * (this.g / 255) +
      0.0722 * (this.b / 255)
    );
  }

  get tupleInt8(): ColorTuple {
    return [this.r, this.g, this.b, Math.round(this.a * 255)];
  }
}

function toDecimal(h: string) {
  return Number.parseInt(h, 16);
}
