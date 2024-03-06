import { useFaviconate } from "@/components/FaviconateContext";
import { Commands } from "@/components/commands";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import {
  Eraser,
  Grid2X2,
  Grid3X3,
  MousePointer,
  PaintBucket,
  PanelRight,
  Pencil,
} from "lucide-react";

export function TopToolbar() {
  const {
    tool,
    grid,
    checker,
    setTool,
    toggleGrid,
    toggleChecker,
    setSidebarVisible,
  } = useFaviconate();
  return (
    <div className="p-2 flex justify-between items-center">
      <Commands />
      <div className="border-input border items-center rounded-md flex p-1 gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(tool === "select" && "bg-secondary")}
          onClick={() => setTool("select")}
        >
          <MousePointer size={16} />
        </Button>
        <Separator orientation="vertical" className="h-8" />
        <Button
          variant="ghost"
          size="icon"
          className={cn(tool === "pencil" && "bg-secondary")}
          onClick={() => setTool("pencil")}
        >
          <Pencil size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(tool === "bucket" && "bg-secondary")}
          onClick={() => setTool("bucket")}
        >
          <PaintBucket size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(tool === "eraser" && "bg-secondary")}
          onClick={() => setTool("eraser")}
        >
          <Eraser size={16} />
        </Button>
        <Separator orientation="vertical" className="h-8 hidden md:flex" />
        <Button
          variant="ghost"
          size="icon"
          className={cn(grid && "bg-secondary", "hidden md:flex")}
          onClick={() => toggleGrid()}
        >
          <Grid3X3 size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(checker && "bg-secondary", "hidden md:flex")}
          onClick={() => toggleChecker()}
        >
          <Grid2X2 size={16} />
        </Button>
      </div>
      <div className="flex gap-2">
        <div className="md:hidden border-input border items-center rounded-md flex p-1 gap-1">
          <Button
            className=""
            variant="ghost"
            size="icon"
            onClick={() => setSidebarVisible?.(true)}
          >
            <PanelRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
