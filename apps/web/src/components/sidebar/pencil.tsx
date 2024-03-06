import { useFaviconate } from "../FaviconateContext";
import {
  SidebarPanel,
  SidebarPanelContent,
  SidebarPanelTitle,
} from "./sidebar-panel";
import { ColorPicker } from "../color-picker";

export function Pencil() {
  const { color, setColor, setPickingColor } = useFaviconate();

  return (
    <SidebarPanel>
      <SidebarPanelTitle>Pencil</SidebarPanelTitle>
      <SidebarPanelContent>
        <ColorPicker
          value={color}
          setValue={setColor}
          onPickingChanged={setPickingColor}
        />
      </SidebarPanelContent>
    </SidebarPanel>
  );
}
