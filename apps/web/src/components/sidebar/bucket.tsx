import { useFaviconate } from "../FaviconateContext";
import {
  SidebarPanel,
  SidebarPanelContent,
  SidebarPanelTitle,
} from "./sidebar-panel";
import { ColorPicker } from "../color-picker";

export function Bucket() {
  const { color, setColor } = useFaviconate();

  return (
    <SidebarPanel>
      <SidebarPanelTitle>Fill</SidebarPanelTitle>
      <SidebarPanelContent>
        <ColorPicker value={color} setValue={setColor} />
      </SidebarPanelContent>
    </SidebarPanel>
  );
}
