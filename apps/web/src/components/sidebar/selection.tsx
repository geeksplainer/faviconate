import { BoxSelect, CircleOff, Crop, Delete, LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  SidebarPanel,
  SidebarPanelContent,
  SidebarPanelTitle,
} from "./sidebar-panel";
import { FaviconateCommand } from "@/models";
import { useFaviconate } from "../FaviconateContext";

const commands: {
  name: string;
  shortcut: string;
  icon: LucideIcon;
  command: FaviconateCommand;
}[] = [
  {
    name: "Select All",
    shortcut: "Ctrl + A",
    icon: BoxSelect,
    command: "selectAll",
  },
  {
    name: "Clear Selection",
    shortcut: "Esc",
    icon: CircleOff,
    command: "clearSelection",
  },
  {
    name: "Delete Selection",
    shortcut: "Backspace",
    icon: Delete,
    command: "deleteSelection",
  },
  { name: "Crop", shortcut: "", icon: Crop, command: "crop" },
];

export function Selection() {
  const { executeCommand } = useFaviconate();
  return (
    <SidebarPanel>
      <SidebarPanelTitle>Selection</SidebarPanelTitle>
      <SidebarPanelContent>
        <div className="flex flex-col items-stretch">
          {commands.map((command) => (
            <Button
              key={command.name}
              variant={"ghost"}
              className="flex justify-start"
              onClick={() => executeCommand(command.command)}
            >
              <command.icon size={16} className="mr-3" /> {command.name}
            </Button>
          ))}
        </div>
        <div className="flex bg-secondary rounded-xl p-1 mt-3">
          <Button variant="ghost" className="flex-1 bg-background">
            Move Sprite
          </Button>
          <Button variant="ghost" className="flex-1">
            Move Selection
          </Button>
        </div>
      </SidebarPanelContent>
    </SidebarPanel>
  );
}
