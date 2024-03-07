import { useFaviconate } from "@/components/FaviconateContext";
import { useImportFile } from "@/hooks/useImportFile";
import { cn } from "@/lib/utils";
import { IconControllerView } from "@faviconate/pixler/src/components/IconControllerView";
import { useState } from "react";

export function IconArea({ className }: { className?: string }) {
  const { controller, setTool } = useFaviconate();
  const { importFile } = useImportFile();
  const [hot, setHot] = useState(false);

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      e.preventDefault();
      setHot(true);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();

    if (hot) {
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        const item = e.dataTransfer.items[0];
        const file = item.getAsFile();

        if (file) {
          setTool("select");
          importFile?.(file);
        } else {
          console.warn("Item was no file");
        }
      } else {
        console.warn("No transfer items");
      }
    } else {
      console.warn("No overlay");
    }

    setHot(false);
  }

  function onMouseLeave() {
    setHot(false);
  }

  return (
    <div
      className={cn(className, "flex flex-col relative")}
      onDragOver={(e) => onDragOver(e)}
      onDrop={(e) => onDrop(e)}
      onMouseLeave={() => onMouseLeave()}
    >
      <IconControllerView controller={controller} className="flex-1" />
      {hot && (
        <div className=" bg-primary absolute inset-0 opacity-20 text-white flex items-center justify-center">
          <div className=" text-4xl text-primary-foreground">
            Drop File Here
          </div>
        </div>
      )}
    </div>
  );
}
