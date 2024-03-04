import { useState } from "react";
import { useFaviconate } from "../FaviconateContext";
import { Input } from "../ui/input";
import {
  SidebarPanel,
  SidebarPanelContent,
  SidebarPanelTitle,
} from "./sidebar-panel";
import { Color } from "@faviconate/pixler/src/model/util/Color";

export function Pencil() {
  const { color, setColor } = useFaviconate();
  const [text, setText] = useState(color.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setColor(Color.fromHex(text));
  };

  return (
    <SidebarPanel>
      <SidebarPanelTitle>Pencil</SidebarPanelTitle>
      <SidebarPanelContent>
        <form onSubmit={handleSubmit}>
          <div className="pb-2 flex gap-3">
            Color{" "}
            <div
              className="border border-border rounded-md size-6"
              style={{ backgroundColor: color.toString() }}
            />
          </div>
          <div>
            <Input value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        </form>
      </SidebarPanelContent>
    </SidebarPanel>
  );
}
