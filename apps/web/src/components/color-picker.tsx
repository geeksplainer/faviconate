"force client";
import { Color } from "@faviconate/pixler/src/model/util/Color";
import { useEffect, useRef, useState } from "react";
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
  const [textR, setTextR] = useState("");
  const [textG, setTextG] = useState("");
  const [textB, setTextB] = useState("");
  const [textA, setTextA] = useState("");
  const [hue, setHue] = useState(value.hsv[0]);
  const [sat, setSat] = useState(value.hsv[1]);
  const [val, setVal] = useState(value.hsv[2]);
  const [alpha, setAlpha] = useState(value.a * 100);
  const [picking, setPicking] = useState(false);
  const swatchRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

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

  const handleSubmitRGB = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const color = new Color(
        parseInt(textR, 10),
        parseInt(textG, 10),
        parseInt(textB, 10),
        parseInt(textA, 10)
      );
      setValue(color);
    } catch {}
  };

  useEffect(() => {
    const color = Color.fromHsv(hue, sat, val).withAlpha(alpha / 100);
    setValue(color);
  }, [setValue, hue, sat, val, alpha]);

  useEffect(() => {
    setText(value.a < 1 ? value.hexRgba : value.hexRgb);
    setTextR(value.r.toString());
    setTextG(value.g.toString());
    setTextB(value.b.toString());
    setTextA(value.a.toString());
  }, [value]);

  useEffect(() => {
    onPickingChanged?.(picking);
  }, [picking, onPickingChanged]);

  useEffect(() => {
    onPickingChanged?.(picking);
  }, [picking, onPickingChanged]);

  if (hueImg === null) {
    hueImg = createHuePattern();
  }

  if (bgPattern === null) {
    bgPattern = createBgPattern();
  }

  useEffect(() => {
    if (swatchRef.current) {
      swatchRef.current.style.backgroundImage = `url(${bgPattern})`;
    }
    if (hueRef.current) {
      hueRef.current.style.backgroundImage = `url(${hueImg})`;
    }
  }, []);

  const satImg = createSaturationPattern(hue, 10);
  const displayColor = value;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={swatchRef}
        className="border border-border rounded-md h-8 relative overflow-hidden bg-repeat"
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: displayColor.hexRgba }}
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
        ref={hueRef}
        min={0}
        max={360}
        value={[hue]}
        onValueChange={(h) => setHue(h[0])}
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
        HSV: ({hue}, {Math.round(sat * 100)}%, {Math.round(val * 100)}%), A:{" "}
        {alpha}
      </div>
      <div className="flex gap-3 items-end">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "hidden",
            picking && "bg-primary text-primary-foreground"
          )}
          onClick={() => setPicking(!picking)}
        >
          <Pipette size={16} />
        </Button>
        <form onSubmit={handleSubmit} className="">
          <div>
            <div className="text-xs text-center opacity-30">Hex</div>
            <Input value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        </form>
        <form onSubmit={handleSubmitRGB} className="flex items-end gap-2">
          <div>
            <div className="text-xs text-center opacity-30">R</div>
            <Input
              className="w-14"
              value={textR}
              onChange={(e) => setTextR(e.target.value)}
            />
          </div>
          <div>
            <div className="text-xs text-center opacity-30">G</div>
            <Input
              className="w-14"
              value={textG}
              onChange={(e) => setTextG(e.target.value)}
            />
          </div>
          <div>
            <div className="text-xs text-center opacity-30">B</div>
            <Input
              className="w-14"
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
            />
          </div>
          <div className="hidden">
            <div className="text-xs text-center opacity-30">A</div>
            <Input
              className="w-14"
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
            />
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
  try {
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
  } catch (e) {
    console.error(e);
    return "";
  }
}
