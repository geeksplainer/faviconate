import { useFaviconate } from "@/components/FaviconateContext";
import { Bucket } from "@/components/sidebar/bucket";
import { Export } from "@/components/sidebar/export";
import { Pencil } from "@/components/sidebar/pencil";
import { Preview } from "@/components/sidebar/preview";
import { Selection } from "@/components/sidebar/selection";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function Sidebar() {
  const { tool, setSidebarVisible } = useFaviconate();
  return (
    <div className=" h-svh overflow-auto sticky">
      <div className="md:hidden flex p-2">
        <Button
          variant="outline"
          className=" flex gap-3"
          onClick={() => setSidebarVisible?.(false)}
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </Button>
      </div>
      <Preview />
      {tool === "select" && <Selection />}
      {tool === "pencil" && <Pencil />}
      {tool === "bucket" && <Bucket />}
      <Export />
    </div>
  );
}
