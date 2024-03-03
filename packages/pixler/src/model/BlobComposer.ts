export function readInt16LE(arr: Uint8ClampedArray, offset: number): number {
  // eslint-disable-next-line no-bitwise
  return (arr[offset + 1] << 8) | arr[offset];
}

export function readInt32LE(arr: Uint8ClampedArray, offset: number): number {
  const d = arr[offset + 3];
  const c = arr[offset + 2];
  const b = arr[offset + 1];
  const a = arr[offset];
  // eslint-disable-next-line no-bitwise
  return (d << 24) | (c << 16) | (b << 8) | a;
}

export function writeInt32LE(
  arr: Uint8ClampedArray,
  offset: number,
  n: number
) {
  // eslint-disable-next-line no-bitwise, no-param-reassign
  arr[offset] = n & 0xff;
  // eslint-disable-next-line no-bitwise, no-param-reassign
  arr[offset + 1] = (n & 0xff_00) >>> 8;
  // eslint-disable-next-line no-bitwise, no-param-reassign
  arr[offset + 2] = (n & 0xff_00_00) >>> 16;
  // eslint-disable-next-line no-bitwise, no-param-reassign
  arr[offset + 3] = (n & 0xff_00_00_00) >>> 24;
}

export class BlobComposer {
  private data: Uint8ClampedArray = new Uint8ClampedArray(0);

  getBlob(props?: BlobPropertyBag): Blob {
    return new Blob([this.data.buffer], props);
  }

  async writeBlob(blob: Blob) {
    this.writeBuffer(await blob.arrayBuffer());
  }

  writeBuffer(buff: ArrayBuffer) {
    this.writeUint8Clamped(new Uint8ClampedArray(buff));
  }

  writeUint8Clamped(arr: Uint8ClampedArray) {
    const data = new Uint8ClampedArray(this.data.length + arr.length);
    data.set(this.data, 0);
    data.set(arr, this.data.length);
    this.data = data;
  }

  writeInt32LE(n: number) {
    this.writeUint8Clamped(
      new Uint8ClampedArray([
        // eslint-disable-next-line no-bitwise
        n & 0xff,
        // eslint-disable-next-line no-bitwise
        (n & 0xff_00) >>> 8,
        // eslint-disable-next-line no-bitwise
        (n & 0xff_00_00) >>> 16,
        // eslint-disable-next-line no-bitwise
        (n & 0xff_00_00_00) >>> 24,
      ])
    );
  }

  writeInt16LE(n: number) {
    this.writeUint8Clamped(
      // eslint-disable-next-line no-bitwise
      new Uint8ClampedArray([n & 0xff, (n & 0xff_00) >>> 8])
    );
  }
}
