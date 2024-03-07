import { useFaviconate } from "@/components/FaviconateContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Grid2X2, Grid3X3, Monitor } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { cn } from "@/lib/utils";

export function BottomToolbar() {
  const { zoom, setZoom, grid, checker, toggleGrid, toggleChecker } =
    useFaviconate();
  return (
    <div className="min-h-[50px] flex justify-between shrink-0 p-2">
      <ModeToggle />
      <div className="flex gap-1 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className={cn(grid && "bg-secondary")}
          onClick={() => toggleGrid()}
        >
          <Grid3X3 size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(checker && "bg-secondary")}
          onClick={() => toggleChecker()}
        >
          <Grid2X2 size={16} />
        </Button>
      </div>
      <div className="text-secondary-foreground rounded-xl flex justify-center items-center gap-3">
        <div className="opacity-30">1:1</div>
        <Slider
          defaultValue={[1]}
          max={1}
          step={0.01}
          min={0.01}
          className={"w-[100px] md:w-[200px]"}
          value={[zoom || 1]}
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
