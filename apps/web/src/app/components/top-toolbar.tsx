import { useFaviconate } from "@/components/FaviconateContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Eraser,
  Grid3X3,
  Menu,
  MousePointer,
  PaintBucket,
  Pencil,
  User,
} from "lucide-react";

export function TopToolbar() {
  const { tool, setTool, grid, toggleGrid } = useFaviconate();
  return (
    <div className="p-2 flex justify-between items-center">
      <Button variant="outline" size="icon">
        <Menu className="h-[1.2rem] w-[1.2rem]" />
      </Button>
      <div className="border-input border rounded-md flex p-1 gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(tool === "select" && "bg-secondary")}
          onClick={() => setTool("select")}
        >
          <MousePointer size={16} />
        </Button>
        <Separator orientation="vertical" />
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
        <Separator orientation="vertical" />
        <Button
          variant="ghost"
          size="icon"
          className={cn(grid && "bg-secondary")}
          onClick={() => toggleGrid()}
        >
          <Grid3X3 size={16} />
        </Button>
      </div>
      <Button variant="outline" size="icon">
        <User size={16} />
      </Button>
    </div>
  );
}
