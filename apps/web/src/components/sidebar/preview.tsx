/* eslint-disable @next/next/no-img-element */
import { MoreHorizontal, Plus, icons } from "lucide-react";
import { Button } from "../ui/button";
import {
  SidebarPanel,
  SidebarPanelContent,
  SidebarPanelTitle,
} from "./sidebar-panel";
import { useFaviconate } from "../FaviconateContext";
import { cn } from "@/lib/utils";
import { IconService } from "@faviconate/pixler/src/model/IconService";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";

const sizes = [16, 32, 64, 128, 256];

export function Preview() {
  const { documents, currentDocument, addDocument } = useFaviconate();

  const addFrame = (size: number) => {
    addDocument?.({
      icon: IconService.newIcon(size, size),
    });
  };

  const documentExists = (size: number) => {
    return documents.some(
      (document) =>
        document.icon.width === size && document.icon.height === size
    );
  };

  return (
    <SidebarPanel>
      <SidebarPanelTitle>
        <div className="flex justify-between items-center">
          <span>Preview</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"ghost"} size={"icon"}>
                <Plus size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Add Icon</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {sizes.map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => addFrame(size)}
                    disabled={documentExists(size)}
                  >
                    {size} x {size}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>Custom...</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarPanelTitle>
      <SidebarPanelContent>
        <div className="flex flex-col gap-2">
          {documents
            .sort(
              (a, b) =>
                a.icon.width * a.icon.height - b.icon.width * b.icon.height
            )
            .map((document, i) => (
              <PreviewItem
                index={i}
                key={`${document.icon.width}x${document.icon.height}`}
                width={document.icon.width}
                height={document.icon.height}
                selected={i === currentDocument}
              />
            ))}
        </div>
      </SidebarPanelContent>
    </SidebarPanel>
  );
}

function PreviewItem({
  index,
  width,
  height,
  selected,
}: {
  index: number;
  width: number;
  height: number;
  selected?: boolean;
}) {
  const { documents, removeDocument, setCurrentDocument } = useFaviconate();
  const document = documents[index];
  const [data, setData] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRemove = () => {
    removeDocument?.(index);
    setDialogOpen(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    IconService.asBlobUrl(document.icon)
      .then((url) => setData(url))
      .catch((e) => console.error(e));
  }, [document, index]);

  return (
    <div className="group flex items-stretch">
      <Button
        variant="outline"
        className={cn(
          "flex justify-start border rounded-xl h-auto flex-1 rounded-r-none border-r-0 gap-6",
          selected && "border-primary"
        )}
        onClick={() => setCurrentDocument?.(index)}
      >
        <div className="w-[64px] h-[64px] flex items-center justify-center">
          {data && (
            <img
              alt="icon"
              className=""
              width={document.icon.width}
              height={document.icon.height}
              src={data}
            />
          )}
        </div>
        <div>
          {width} x {height}
        </div>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "flex h-auto rounded-xl rounded-l-none  border-l-0 group-hover:bg-muted",
              selected && "border-primary"
            )}
          >
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem disabled>Export</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDialogOpen(true)}>
              Remove
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <div className="pb-6">
            <h1 className="text-xl font-bold">Remove Icon</h1>
            <p>
              Are you sure you want to remove the {width} x {height} icon?
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
