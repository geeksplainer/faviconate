"use client";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./components/mode-toggle";
import {
  Eraser,
  Grid3X3,
  Menu,
  MousePointer,
  PaintBucket,
  Pencil,
  User,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sidebar } from "./components/sidebar";
import { IconArea } from "./components/icon-area";

export default function Home() {
  return (
    <main className=" w-svw h-svh ">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={80}>
          <div className="p-2 flex justify-between items-center">
            <Button variant="outline" size="icon">
              <Menu className="h-[1.2rem] w-[1.2rem]" />
            </Button>
            <div className="border-input border rounded-md flex p-1 gap-1">
              <Button variant="ghost" size="icon">
                <MousePointer size={16} />
              </Button>
              <Separator orientation="vertical" />
              <Button variant="ghost" size="icon">
                <Pencil size={16} />
              </Button>
              <Button variant="ghost" size="icon">
                <PaintBucket size={16} />
              </Button>
              <Button variant="ghost" size="icon">
                <Eraser size={16} />
              </Button>
              <Separator orientation="vertical" />
              <Button variant="ghost" size="icon" className=" bg-secondary">
                <Grid3X3 size={16} />
              </Button>
            </div>
            <Button variant="outline" size="icon">
              <User size={16} />
            </Button>
          </div>
          <IconArea />
          <ModeToggle />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={20}>
          <Sidebar />
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
