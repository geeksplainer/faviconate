"use client";
import { cn } from "@/lib/utils";
import { Sidebar } from "./components/sidebar";
import { Workspace } from "./components/workspace";
import { useFaviconate } from "@/components/FaviconateContext";

export default function Home() {
  const { sidebarVisible } = useFaviconate();
  return (
    <main className="w-svw h-svh">
      <div className="flex w-full h-full">
        {sidebarVisible ? (
          <div>
            <Sidebar />
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col">
              <Workspace />
            </div>
            <div
              className={cn(
                "hidden w-[300px] h-full border-l borderl-l-border md:block"
              )}
            >
              <Sidebar />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
