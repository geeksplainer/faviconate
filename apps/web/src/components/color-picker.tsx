import { Color } from "@faviconate/pixler/src/model/util/Color";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Range2d } from "./range-2d";

export function ColorPicker({
  value,
  setValue,
}: {
  value: Color;
  setValue: (value: Color) => void;
}) {
  const [text, setText] = useState("");
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(0);
  const [val, setVal] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    //setColor(Color.fromHex(text));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setValue(Color.fromHsv(hue, sat, val));
  }, [hue, sat, val]);

  const satImg = createSaturationPattern(hue, 10);
  const hueImg = createHuePattern();

  return (
    <div className="flex flex-col gap-3">
      <div
        className="border border-border rounded-md h-8"
        style={{ backgroundColor: value.toString() }}
      />
      <Range2d
        x={sat}
        y={val}
        setX={setSat}
        setY={setVal}
        bg={satImg}
        className="mb-6"
      />
      <Slider
        min={0}
        max={360}
        value={[hue]}
        onValueChange={(h) => setHue(h[0])}
        style={{ backgroundImage: `url(${hueImg})` }}
        className=" bg-contain bg-str mb-6"
        noRange
      />
      <Slider min={0} max={100} />
      <div>
        H: {hue} S: {Math.round(sat * 100)} V: {Math.round(val * 100)}
      </div>
      <form onSubmit={handleSubmit} className="hidden">
        <div>
          <Input value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      </form>
    </div>
  );
}

const BG_SQ_SIZE = 5;
const BG_COLOR_A = [0, 0, 0, 0];
const BG_COLOR_B = [127, 127, 127, 127];

function createBgPattern(): string {
  const lineOfA = new Array(BG_SQ_SIZE).fill(BG_COLOR_A);
  const lineOfB = new Array(BG_SQ_SIZE).fill(BG_COLOR_B);
  const rowA = [].concat(...lineOfA, ...lineOfB);
  const rowB = [].concat(...lineOfB, ...lineOfA);
  const chunkA = new Array(BG_SQ_SIZE).fill(rowA);
  const chunkB = new Array(BG_SQ_SIZE).fill(rowB);
  const data = new Uint8ClampedArray([].concat(...chunkA, ...chunkB));

  return dataUrlFrom(data, BG_SQ_SIZE * 2);
}

function createHuePattern(): string {
  const convert = (foo: number, hue: number) =>
    Color.fromHsv(hue, 1, 1).tupleInt8;
  const array360 = new Array(360).fill(0);
  const arrayColors = array360.map(convert);
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const flatArrayColors: number[] = [].concat(...(arrayColors as any));
  const data = new Uint8ClampedArray(flatArrayColors);
  return dataUrlFrom(data, 360);
}

function createSaturationPattern(hue = 1, length = 10): string {
  const arr = new Uint8ClampedArray(length * length * 4);
  let z = 0;

  for (let j = length; j >= 0; j--) {
    for (let i = 0; i < length; i++) {
      const hsv = Color.fromHsv(hue, i / length, j / length);
      const [r, g, b, a] = hsv.tupleInt8;
      arr[z++] = r;
      arr[z++] = g;
      arr[z++] = b;
      arr[z++] = a;
    }
  }

  return dataUrlFrom(arr, length);
}
function dataUrlFrom(data: Uint8ClampedArray, width: number): string {
  const imageData = new ImageData(data, width);
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.width = width;
  canvas.height = data.length / 4 / width;

  const cx = canvas.getContext("2d");

  if (!cx) {
    throw Error("Graphics Error");
  }

  cx.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}
