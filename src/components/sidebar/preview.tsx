import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import {
  SidebarPanel,
  SidebarPanelContent,
  SidebarPanelTitle,
} from "./sidebar-panel";

export function Preview() {
  return (
    <SidebarPanel>
      <SidebarPanelTitle>Preview</SidebarPanelTitle>
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
    <div className="flex items-stretch">
      <Button
        variant="outline"
        className="flex border rounded-xl h-auto flex-1"
      >
        <div className="w-[64px] h-[64px]" />
        <div>
          {width} x {height}
        </div>
      </Button>
      <Button variant={"outline"} className="flex h-auto">
        <MoreHorizontal size={16} />
      </Button>
    </div>
  );
}
