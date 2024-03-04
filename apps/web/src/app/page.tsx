"use client";
import { ModeToggle } from "./components/mode-toggle";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sidebar } from "./components/sidebar";
import { IconArea } from "./components/icon-area";
import { TopToolbar } from "./components/top-toolbar";

export default function Home() {
  return (
    <main className=" w-svw h-svh ">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={80} className="flex flex-col">
          <TopToolbar />
          <IconArea className="flex-1" />
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
