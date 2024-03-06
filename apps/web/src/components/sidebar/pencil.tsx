import { useFaviconate } from "../FaviconateContext";
import {
  SidebarPanel,
  SidebarPanelContent,
  SidebarPanelTitle,
} from "./sidebar-panel";
import { ColorPicker } from "../color-picker";

export function Pencil() {
  const { color, setColor } = useFaviconate();

  return (
    <SidebarPanel>
      <SidebarPanelTitle>Pencil</SidebarPanelTitle>
      <SidebarPanelContent>
        <ColorPicker value={color} setValue={setColor} />
      </SidebarPanelContent>
    </SidebarPanel>
  );
}
