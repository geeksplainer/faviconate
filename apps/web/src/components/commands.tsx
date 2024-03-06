import { useEffect, useState } from "react";
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
  Calendar,
  Mail,
  Redo,
  Rocket,
  Settings,
  Smile,
  Undo,
  User,
} from "lucide-react";
import { useFaviconate } from "./FaviconateContext";

export function Commands() {
  const { undo, redo } = useFaviconate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }

      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        undo?.();
      }

      if (e.key === "y" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        redo?.();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem onClick={undo}>
            <Undo className="mr-2 h-4 w-4" />
            <span>Undo</span>
            <CommandShortcut>⌘Z</CommandShortcut>
          </CommandItem>
          <CommandItem onClick={redo}>
            <Redo className="mr-2 h-4 w-4" />
            <span>Redo</span>
            <CommandShortcut>⌘Y</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
