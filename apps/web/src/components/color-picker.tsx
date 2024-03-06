import { Color } from "@faviconate/pixler/src/model/util/Color";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Range2d } from "./range-2d";
import { Button } from "./ui/button";
import { Pipette } from "lucide-react";
import { cn } from "@/lib/utils";

let hueImg: string | null = null;
let bgPattern: string | null = null;

export function ColorPicker({
  value,
  setValue,
  onPickingChanged,
}: {
  value: Color;
  setValue: (value: Color) => void;
  onPickingChanged?: (picking: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [hue, setHue] = useState(value.hsv[0]);
  const [sat, setSat] = useState(value.hsv[1]);
  const [val, setVal] = useState(value.hsv[2]);
  const [alpha, setAlpha] = useState(value.a * 100);
  const [picking, setPicking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const color = Color.fromHex(text);
      setValue(color);
      const [h, s, v] = color.hsv;
      setHue(h);
      setSat(s);
      setVal(v);
      setAlpha(color.a * 100);
    } catch {}
  };

  useEffect(() => {
    const color = Color.fromHsv(hue, sat, val).withAlpha(alpha / 100);
    setValue(color);
  }, [setValue, hue, sat, val, alpha]);

  useEffect(() => {
    setText(value.a < 1 ? value.hexRgba : value.hexRgb);
  }, [value]);

  useEffect(() => {
    onPickingChanged?.(picking);
  }, [picking, onPickingChanged]);

  if (hueImg === null) {
    hueImg = createHuePattern();
  }

  if (bgPattern === null) {
    bgPattern = createBgPattern();
  }

  const satImg = createSaturationPattern(hue, 10);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="border border-border rounded-md h-8 relative overflow-hidden bg-repeat"
        style={{ backgroundImage: `url(${bgPattern})` }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: value.hexRgba }}
        />
      </div>
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
      <Slider
        min={0}
        max={100}
        value={[alpha]}
        onValueChange={(v) => setAlpha(v[0])}
      />
      <div className="opacity-30 text-xs">
        H: {hue} S: {Math.round(sat * 100)} V: {Math.round(val * 100)} A:{" "}
        {alpha}
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="icon"
          className={cn(picking && "bg-primary text-primary-foreground")}
          onClick={() => setPicking(!picking)}
        >
          <Pipette size={16} />
        </Button>
        <form onSubmit={handleSubmit} className="">
          <div>
            <Input value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        </form>
      </div>
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
