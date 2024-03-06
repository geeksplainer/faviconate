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
import { BottomToolbar } from "./components/bottom-toolbar";
import { Commands } from "@/components/commands";

export default function Home() {
  return (
    <main className=" w-svw h-svh ">
      <Commands />
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={80} className="flex flex-col relative">
          <TopToolbar />
          <IconArea className="flex-1" />
          <BottomToolbar />
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
