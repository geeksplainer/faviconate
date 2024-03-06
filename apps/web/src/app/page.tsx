"use client";
import { cn } from "@/lib/utils";
import { Sidebar } from "./components/sidebar";
import { Workspace } from "./components/workspace";
import { useFaviconate } from "@/components/FaviconateContext";

export default function Home() {
  const { sidebarVisible } = useFaviconate();
  return (
    <main className="w-svw h-svh">
      <div className="hidden w-full h-full md:flex">
        <div className="flex-1 flex flex-col">
          <Workspace />
        </div>
        <div className={cn("w-[300px] h-full border-l borderl-l-border")}>
          <Sidebar />
        </div>
      </div>
      <div className="w-full h-full md:hidden">
        {sidebarVisible ? (
          <div className=" h-full border-l borderl-l-border">
            <Sidebar />
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full">
            <Workspace />
          </div>
        )}
      </div>
    </main>
  );
}
