import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  SidebarPanel,
  SidebarPanelContent,
  SidebarPanelTitle,
} from "./sidebar-panel";

export function Preview() {
  return (
    <SidebarPanel>
      <SidebarPanelTitle>
        <div className="flex justify-between items-center">
          <span>Preview</span>
          <Button variant={"ghost"} size={"icon"}>
            <Plus size={16} />
          </Button>
        </div>
      </SidebarPanelTitle>
      <SidebarPanelContent>
        <div className="flex flex-col gap-2">
          <PreviewItem width={16} height={16} />
          <PreviewItem width={32} height={32} />
        </div>
      </SidebarPanelContent>
    </SidebarPanel>
  );
}

function PreviewItem({ width, height }: { width: number; height: number }) {
  return (
    <div className="group flex items-stretch">
      <Button
        variant="outline"
        className="flex border rounded-xl h-auto flex-1 rounded-r-none border-r-0"
      >
        <div className="w-[64px] h-[64px]" />
        <div>
          {width} x {height}
        </div>
      </Button>
      <Button
        variant={"outline"}
        className="flex h-auto rounded-l-none border-l-0 group-hover:bg-muted"
      >
        <MoreHorizontal size={16} />
      </Button>
    </div>
  );
}
