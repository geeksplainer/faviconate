import { useFaviconate } from "@/components/FaviconateContext";
import { Export } from "@/components/sidebar/export";
import { Pencil } from "@/components/sidebar/pencil";
import { Preview } from "@/components/sidebar/preview";
import { Selection } from "@/components/sidebar/selection";

export function Sidebar() {
  const { tool } = useFaviconate();
  return (
    <div>
      <Preview />
      {tool === "select" && <Selection />}
      {tool === "pencil" && <Pencil />}
      <Export />
    </div>
  );
}
