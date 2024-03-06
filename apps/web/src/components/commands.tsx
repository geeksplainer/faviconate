import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./ui/command";
import {
  Clipboard,
  Copy,
  FileUp,
  Menu,
  Redo,
  Scissors,
  Undo,
} from "lucide-react";
import { useFaviconate } from "./FaviconateContext";
import { Button } from "./ui/button";
import { useImportFile } from "@/hooks/useImportFile";

interface Shortcut {
  key: string;
  action: () => void;
  meta?: boolean;
  separator?: boolean;
}

export function Commands() {
  const { undo, redo, controller, setTool, selectTool } = useFaviconate();
  const { promptFile } = useImportFile();
  const [open, setOpen] = useState(false);

  const shortcuts: Shortcut[] = useMemo(
    () => [
      { key: "j", meta: true, action: () => setOpen((open) => !open) },
      { key: "z", meta: true, action: () => undo?.() },
      { key: "y", meta: true, action: () => redo?.() },
      { key: "x", meta: true, action: () => controller.cut() },
      { key: "c", meta: true, action: () => controller.copy() },
      { key: "v", meta: true, action: () => controller.paste() },
      { key: "i", meta: true, action: () => promptFile() },
      { key: "a", meta: true, action: () => selectTool?.selectAll() },
      { key: "v", action: () => setTool("select") },
      { key: "d", action: () => setTool("pencil") },
      { key: "f", action: () => setTool("bucket") },
      { key: "e", action: () => setTool("eraser") },
    ],
    [undo, redo, controller, setTool, promptFile, selectTool]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        const shortcut = shortcuts.find(
          (s) => s.key === e.key && s.meta === e.metaKey
        );
        if (shortcut) {
          e.preventDefault();
          shortcut.action();
        }
      } else {
        const shortcut = shortcuts.find((s) => s.key === e.key && !s.meta);
        if (shortcut) {
          e.preventDefault();
          shortcut.action();
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [shortcuts]);

  return (
    <>
      <div className="flex gap-3 items-center">
        <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
          <Menu className="h-[1.2rem] w-[1.2rem]" />
        </Button>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-50">
          <span className="text-xs">⌘</span>J
        </kbd>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem
              onSelect={() => {
                promptFile();
                setOpen(false);
              }}
            >
              <FileUp className="mr-2 h-4 w-4" />
              <span>Import File</span>
            </CommandItem>
            <CommandSeparator />
            <CommandItem onSelect={undo}>
              <Undo className="mr-2 h-4 w-4" />
              <span>Undo</span>
              <CommandShortcut>⌘Z</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={redo}>
              <Redo className="mr-2 h-4 w-4" />
              <span>Redo</span>
              <CommandShortcut>⌘Y</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Clipboard">
            <CommandItem onSelect={() => controller.cut()}>
              <Scissors className="mr-2 h-4 w-4" />
              <span>Cut</span>
              <CommandShortcut>⌘X</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => controller.copy()}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy</span>
              <CommandShortcut>⌘C</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => controller.paste()}>
              <Clipboard className="mr-2 h-4 w-4" />
              <span>Paste</span>
              <CommandShortcut>⌘V</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
