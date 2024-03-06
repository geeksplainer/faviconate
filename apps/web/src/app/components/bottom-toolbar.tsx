import { useFaviconate } from "@/components/FaviconateContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Monitor } from "lucide-react";
import { ModeToggle } from "./mode-toggle";

export function BottomToolbar() {
  const { zoom = 1, setZoom } = useFaviconate();
  return (
    <div className="min-h-[50px] flex justify-between shrink-0 p-2">
      <ModeToggle />
      <div className="text-secondary-foreground rounded-xl w-[300px] flex justify-center items-center gap-3">
        <div className="opacity-30">1:1</div>
        <Slider
          defaultValue={[1]}
          max={1}
          step={0.01}
          min={0.01}
          className={"w-[60%]"}
          value={[zoom]}
          onValueChange={(v) => setZoom?.(v[0])}
        />
        <div className="opacity-30">
          <Monitor size={16} />
        </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() =>
          window.open("https://github.com/geeksplainer/faviconate")
        }
      >
        <GitHubLogoIcon className="size-4" />
      </Button>
    </div>
  );
}
