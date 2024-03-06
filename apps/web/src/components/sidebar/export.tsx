import { Save } from "lucide-react";
import { Button } from "../ui/button";
import {
  SidebarPanel,
  SidebarPanelContent,
  SidebarPanelTitle,
} from "./sidebar-panel";
import { useFaviconate } from "../FaviconateContext";

export function Export() {
  const { controller, documents } = useFaviconate();
  return (
    <SidebarPanel>
      <SidebarPanelTitle>Export</SidebarPanelTitle>
      <SidebarPanelContent>
        <div className="flex gap-3">
          <Button
            className="flex-1 flex"
            onClick={() =>
              controller.downloadAs(
                "ico",
                documents.map((d) => d.icon)
              )
            }
          >
            <Save size={16} className="mr-3" /> ICO
          </Button>
          <Button
            variant="secondary"
            className="flex-1 flex"
            onClick={() => controller.downloadAs("png")}
          >
            <Save size={16} className="mr-3" /> PNG
          </Button>
        </div>
      </SidebarPanelContent>
    </SidebarPanel>
  );
}
