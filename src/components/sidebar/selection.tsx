import { BoxSelect, CircleOff, Crop, Delete } from "lucide-react";
import { Button } from "../ui/button";
import {
  SidebarPanel,
  SidebarPanelContent,
  SidebarPanelTitle,
} from "./sidebar-panel";

const commands = [
  { name: "Select All", shortcut: "Ctrl + A", icon: BoxSelect },
  { name: "Clear Selection", shortcut: "Esc", icon: CircleOff },
  { name: "Delete Selection", shortcut: "Backspace", icon: Delete },
  { name: "Crop", shortcut: "", icon: Crop },
];

export function Selection() {
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
